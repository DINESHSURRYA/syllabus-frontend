"use client";
import './styles/page.css';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Loader2,
  LogOut,
  BrainCircuit,
  AlertCircle,
  Award,
  ArrowRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchInterviewState,
  submitInterviewQuestionAnswer,
  completeAIInterview,
  Phase3InterviewQuestion,
} from '@/lib/evaluator-api';
import { InterviewerTile } from '@/components/ui/evaluator/InterviewerTile';
import { CallControls } from '@/components/ui/evaluator/CallControls';
import { ResponsePanel } from '@/components/ui/evaluator/ResponsePanel';

export default function InterviewSessionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const interviewIdFromUrl = searchParams.get('id') || searchParams.get('interview_id');

  // Session State
  const [phase3Session, setPhase3Session] = useState<any>(null);
  const [isLoadingSession, setIsLoadingSession] = useState<boolean>(!!interviewIdFromUrl);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState<boolean>(false);
  const [isCompletingSession, setIsCompletingSession] = useState<boolean>(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);

  // Audio state
  const [isAudioPlaying, setIsAudioPlaying] = useState<boolean>(false);
  const [isMicOn, setIsMicOn] = useState<boolean>(true);

  // 1. Fetch Phase 3 Session State
  useEffect(() => {
    if (!interviewIdFromUrl) return;
    let isMounted = true;
    setIsLoadingSession(true);
    fetchInterviewState(interviewIdFromUrl)
      .then((res) => {
        if (isMounted && res?.interview) {
          const threadId = res.interview.thread_id || res.interview.interview_id || interviewIdFromUrl;
          const normalized = {
            ...res.interview,
            interview_id: threadId,
            thread_id: threadId
          };
          setPhase3Session(normalized);
          const questions: Phase3InterviewQuestion[] = res.interview.questions || [];
          const firstUnanswered = questions.findIndex((q) => !q.candidate_answer);
          if (firstUnanswered !== -1) setCurrentQuestionIndex(firstUnanswered);
          else setCurrentQuestionIndex(0);
        }
      })
      .catch((err) => {
        console.error('Error loading interview session:', err);
        if (isMounted) setSessionError('Failed to load interview session state.');
      })
      .finally(() => { if (isMounted) setIsLoadingSession(false); });
    return () => { isMounted = false; };
  }, [interviewIdFromUrl]);

  // 1b. Polling for background question generation updates
  useEffect(() => {
    if (!interviewIdFromUrl || !phase3Session) return;

    const targetTotal = phase3Session.expected_total_questions || phase3Session.total_questions || 5;
    const isCompleted = phase3Session.generation_status === 'COMPLETED';
    const currentQCount = phase3Session.questions?.length || 0;

    if (isCompleted && currentQCount >= targetTotal) return;

    const interval = setInterval(() => {
      fetchInterviewState(interviewIdFromUrl)
        .then((res) => {
          if (res?.interview) {
            setPhase3Session((prev: any) => {
              const threadId = res.interview.thread_id || res.interview.interview_id || interviewIdFromUrl;
              const newQCount = res.interview.questions?.length || 0;
              const prevQCount = prev?.questions?.length || 0;
              if (newQCount !== prevQCount || res.interview.generation_status !== prev?.generation_status) {
                const freshQs: Phase3InterviewQuestion[] = res.interview.questions || [];
                const firstUnanswered = freshQs.findIndex((q) => !q.candidate_answer);
                if (firstUnanswered !== -1) {
                  setCurrentQuestionIndex(firstUnanswered);
                } else if (freshQs.length > 0) {
                  setCurrentQuestionIndex(freshQs.length - 1);
                }
                return { ...res.interview, interview_id: threadId, thread_id: threadId };
              }
              return prev;
            });
          }
        })
        .catch((err) => console.error('Error polling background generation status:', err));
    }, 2000);

    return () => clearInterval(interval);
  }, [
    interviewIdFromUrl,
    phase3Session?.generation_status,
    phase3Session?.questions?.length,
    phase3Session?.expected_total_questions,
    phase3Session?.total_questions
  ]);

  // 2. Web Speech TTS - speak question text out loud
  const speakText = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsAudioPlaying(true);
      utterance.onend = () => setIsAudioPlaying(false);
      utterance.onerror = () => setIsAudioPlaying(false);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  const handleTogglePlay = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      if (isAudioPlaying) {
        window.speechSynthesis.pause();
        setIsAudioPlaying(false);
      } else {
        window.speechSynthesis.resume();
        setIsAudioPlaying(true);
      }
    }
  }, [isAudioPlaying]);

  const handleReplay = useCallback(() => {
    if (phase3Session?.questions?.[currentQuestionIndex]?.question_text) {
      speakText(phase3Session.questions[currentQuestionIndex].question_text);
    }
  }, [currentQuestionIndex, phase3Session, speakText]);

  // 3. Auto-play when current question changes
  useEffect(() => {
    if (phase3Session?.questions?.[currentQuestionIndex]?.question_text) {
      const qText = phase3Session.questions[currentQuestionIndex].question_text;
      speakText(qText);
    }
  }, [currentQuestionIndex, phase3Session, speakText]);

  // Handle Answer Submission
  const handleAnswerSubmit = async (answerText: string) => {
    const sessionThreadId = phase3Session?.interview_id || phase3Session?.thread_id || (interviewIdFromUrl as string);
    if (!sessionThreadId) return;

    setIsSubmittingAnswer(true);
    setIsTransitioning(true);
    setSessionError(null);

    const questions: Phase3InterviewQuestion[] = phase3Session.questions || [];
    const currentQ = questions[currentQuestionIndex];
    const qNum = currentQ ? currentQ.question_number : currentQuestionIndex + 1;

    try {
      const res = await submitInterviewQuestionAnswer(
        sessionThreadId,
        qNum,
        answerText.trim(),
        0
      );

      const isComplete = res.is_last_question || res.result?.is_complete;

      if (isComplete) {
        await handleFinishInterview();
        return;
      }

      const updatedQuestions = [...questions];
      if (updatedQuestions[currentQuestionIndex]) {
        updatedQuestions[currentQuestionIndex].candidate_answer = answerText.trim();
      }

      const newGenQ = res.result?.generated_question;
      if (newGenQ && newGenQ.question) {
        const nextQNum = updatedQuestions.length + 1;
        updatedQuestions.push({
          question_number: nextQNum,
          question_text: newGenQ.question,
          target_concept: newGenQ.target_concept || newGenQ.topic || '',
          candidate_answer: null,
          is_evaluated: false
        });
      }

      setPhase3Session({
        ...phase3Session,
        interview_id: sessionThreadId,
        questions: updatedQuestions,
        current_question: newGenQ
      });

      const nextIndex = currentQuestionIndex + 1;
      if (nextIndex < updatedQuestions.length) {
        setCurrentQuestionIndex(nextIndex);
      } else {
        const freshRes = await fetchInterviewState(sessionThreadId);
        if (freshRes?.interview) {
          setPhase3Session({ ...freshRes.interview, interview_id: sessionThreadId });
          if (freshRes.interview.questions?.[nextIndex]) {
            setCurrentQuestionIndex(nextIndex);
          }
        }
      }
    } catch (err: any) {
      console.error('Error submitting answer:', err);
      setSessionError(err?.message || 'Failed to submit answer.');
    } finally {
      setIsSubmittingAnswer(false);
      setIsTransitioning(false);
    }
  };

  const handleFinishInterview = async () => {
    const sessionThreadId = phase3Session?.interview_id || phase3Session?.thread_id || (interviewIdFromUrl as string);
    if (!sessionThreadId) return;
    setIsCompletingSession(true);
    setSessionError(null);
    try {
      await completeAIInterview(sessionThreadId);
      router.push(`/evaluator/report?id=${sessionThreadId}`);
    } catch (err: any) {
      setSessionError(err?.message || 'Failed to complete interview.');
      setIsCompletingSession(false);
    }
  };

  // Loading state
  if (isLoadingSession || isCompletingSession) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-surface font-mono animate-pulse">
          {isCompletingSession
            ? 'Evaluating Candidate Answers...'
            : 'Loading AI Diagnostic Interview...'}
        </p>
      </div>
    );
  }

  // Guard — no active interview
  if (!phase3Session) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-screen p-6 text-center gap-6">
        <div className="p-4 bg-surface/10 rounded-full">
          <BrainCircuit className="w-10 h-10 text-muted" />
        </div>
        <div>
          <h2 className="font-serif text-2xl text-surface mb-2">No Active Interview Session</h2>
          <p className="text-muted text-sm max-w-md">
            Please select a candidate and assessment attempt from the Evaluator portal to generate a personalized AI Interview.
          </p>
        </div>
        <button
          onClick={() => router.push('/evaluator')}
          className="flex items-center gap-2 px-8 py-3 rounded-full font-medium bg-accent text-background hover:bg-accent/90 transition-all"
        >
          Select Candidate & Launch
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  const questions: Phase3InterviewQuestion[] = phase3Session?.questions || [];
  const currentQ = questions[currentQuestionIndex];
  const totalQuestions = phase3Session?.expected_total_questions || phase3Session?.total_questions || questions.length || 1;
  const progressPercent = Math.min(((currentQuestionIndex + 1) / totalQuestions) * 100, 100);
  const isLastQuestion = (currentQuestionIndex + 1 >= totalQuestions) && (phase3Session?.generation_status === 'COMPLETED' || questions.length >= totalQuestions);

  return (
    <div className="flex-1 flex flex-col p-4 sm:p-6 w-full h-full min-h-screen relative pb-10">
      {/* Top Progress Bar */}
      <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-2">
        <div className="flex items-center gap-4">
          <span className="font-mono text-sm text-muted">
            Question {currentQuestionIndex + 1} of {totalQuestions}
          </span>
          {phase3Session?.candidate_name && (
            <span className="font-mono text-xs text-accent bg-accent/10 px-2 py-1 rounded border border-accent/20">
              {phase3Session.candidate_name}
            </span>
          )}
          <button
            onClick={() => router.push('/evaluator')}
            className="flex items-center gap-1.5 px-3 py-1 bg-error/20 text-error hover:bg-error/30 rounded-full text-xs font-medium transition-colors"
          >
            <LogOut className="w-3 h-3" />
            End Interview
          </button>
        </div>
        <div className="w-full sm:w-64 h-1 bg-surface/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Error Banner */}
      {sessionError && (
        <div className="w-full max-w-4xl mx-auto mb-4 flex items-start gap-2 p-3 rounded-xl border border-error/30 bg-error/5 text-error text-xs font-mono">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{sessionError}</span>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative pb-6">
        <InterviewerTile
          questionText={currentQ?.question_text || 'Loading question...'}
          isTransitioning={isTransitioning}
          isPlaying={isAudioPlaying}
          onTogglePlay={handleTogglePlay}
          onReplay={handleReplay}
        />

        {/* Bloom & Concept Tags */}
        {currentQ && !isTransitioning && (
          <div className="flex items-center gap-2 mt-3">
            {currentQ.bloom_level && (
              <span className="font-mono text-xs px-3 py-1 rounded-full border border-accent/30 bg-accent/10 text-accent">
                {currentQ.bloom_level} Level
              </span>
            )}
            {currentQ.target_concept && (
              <span className="font-mono text-xs px-3 py-1 rounded-full border border-success/30 bg-success/10 text-success">
                Target: {currentQ.target_concept}
              </span>
            )}
          </div>
        )}

        <CallControls isMicOn={isMicOn} setIsMicOn={setIsMicOn} />

        <ResponsePanel
          onSubmit={handleAnswerSubmit}
          isSubmitting={isSubmittingAnswer}
          submitLabel={
            isLastQuestion
              ? 'Finish & Generate Report'
              : 'Submit & Next Question'
          }
        />
      </div>
    </div>
  );
}
