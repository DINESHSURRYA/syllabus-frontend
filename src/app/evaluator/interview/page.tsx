"use client";
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Clock, Timer } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import ProgressThread from '@/components/ui/evaluator/ProgressThread';
import InterviewerTile from '@/components/ui/evaluator/InterviewerTile';
import CallControls from '@/components/ui/evaluator/CallControls';
import ResponsePanel from '@/components/ui/evaluator/ResponsePanel';
import { useEvaluatorStore } from '@/stores/evaluator.store';

export default function InterviewPage() {
  const { 
    questions, 
    currentQuestionIndex, 
    setCurrentQuestionIndex, 
    submitAnswer, 
    stopInterview, 
    isInterviewComplete,
    globalTimeMinutes 
  } = useEvaluatorStore();
  
  const router = useRouter();
  
  const [isMicOn, setIsMicOn] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoSubmitSignal, setAutoSubmitSignal] = useState(0);

  // Timers State
  const [globalSecondsLeft, setGlobalSecondsLeft] = useState((globalTimeMinutes || 15) * 60);
  const [questionSecondsLeft, setQuestionSecondsLeft] = useState(45);
  
  const startTimeRef = useRef(Date.now());
  const stopCalledRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!questions || questions.length === 0) {
      router.push('/evaluator');
    }
  }, [questions, router]);

  useEffect(() => {
    if (isInterviewComplete) {
      router.push('/evaluator/report');
    }
  }, [isInterviewComplete, router]);

  // Global Timer effect - runs continuously across all questions
  useEffect(() => {
    const timer = setInterval(() => {
      setGlobalSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!stopCalledRef.current) {
            stopCalledRef.current = true;
            stopInterview();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [stopInterview]);

  const currentQuestionData = (questions && questions[currentQuestionIndex]) || {};
  const currentQuestionText = typeof currentQuestionData === 'string' ? currentQuestionData : (currentQuestionData.text || 'Preparing interview question...');
  const audioUrl = currentQuestionData.audioUrl;
  const questionTimerDuration = currentQuestionData.questionTimerSeconds || 45;

  // Question Timer effect - resets per question
  useEffect(() => {
    setQuestionSecondsLeft(questionTimerDuration);
  }, [currentQuestionIndex, questionTimerDuration]);

  useEffect(() => {
    const timer = setInterval(() => {
      setQuestionSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!isSubmitting && !isTransitioning) {
            setAutoSubmitSignal((s) => s + 1);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [currentQuestionIndex, isSubmitting, isTransitioning]);

  useEffect(() => {
    startTimeRef.current = Date.now();
    
    if (audioUrl) {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const baseUrl = process.env.NEXT_PUBLIC_EVALUATOR_API_URL || 'http://127.0.0.1:8001';
      const fullAudioUrl = audioUrl.startsWith('http') ? audioUrl : `${baseUrl}${audioUrl}`;
      const audio = new Audio(fullAudioUrl);
      audioRef.current = audio;
      
      audio.onended = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      
      audio.play().catch(e => console.error("Auto-play failed:", e));
    }
  }, [audioUrl, currentQuestionIndex]);

  const toggleAudio = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(e => console.error("Play failed:", e));
      }
    }
  };

  const replayAudio = () => {
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(e => console.error("Replay failed:", e));
    }
  };

  const formatGlobalTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatQuestionTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return m > 0 ? `${m}m ${s}s` : `${s}s`;
  };

  const progressPercent = Math.min(((currentQuestionIndex) / 3) * 100, 100);

  const handleAnswerSubmit = async (answerText: string) => {
    setIsSubmitting(true);
    setIsTransitioning(true);
    
    if (audioRef.current) {
      audioRef.current.pause();
    }
    
    const timeTakenSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);
    
    await submitAnswer(answerText, timeTakenSeconds);
    
    setCurrentQuestionIndex((prev) => prev + 1);
    setIsTransitioning(false);
    setIsSubmitting(false);
  };

  if (!questions || questions.length === 0) return null;

  return (
    <AppShell>
      <div className="min-h-screen relative flex bg-background text-surface">
        <ProgressThread />
        <main className="flex-1 ml-1 pl-4 sm:pl-8 flex flex-col min-h-screen p-4 sm:p-6 relative pb-10">
          {/* Top Header Bar with Timers & Progress */}
          <div className="w-full max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between mb-4 sm:mb-6 gap-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="font-mono text-sm text-muted">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>

              {/* Global Timer Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
                globalSecondsLeft < 120 
                  ? "bg-red-500/20 border-red-500/40 text-red-400 animate-pulse" 
                  : "bg-surface/10 border-surface/20 text-surface"
              }`}>
                <Clock className="w-3.5 h-3.5 text-accent" />
                <span>Global: {formatGlobalTime(globalSecondsLeft)}</span>
              </div>

              {/* Question Timer Badge */}
              <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium border ${
                questionSecondsLeft < 10 
                  ? "bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse" 
                  : "bg-surface/10 border-surface/20 text-surface"
              }`}>
                <Timer className="w-3.5 h-3.5 text-accent" />
                <span>Q Timer: {formatQuestionTime(questionSecondsLeft)}</span>
              </div>

              <button 
                onClick={stopInterview}
                className="px-3 py-1 bg-red-500/20 text-red-500 hover:bg-red-500/30 rounded-full text-xs font-medium transition-colors cursor-pointer"
              >
                End & View Report
              </button>
            </div>

            <div className="w-full sm:w-64 h-1 bg-surface/10 rounded-full overflow-hidden">
              <div 
                className="h-full bg-accent transition-all duration-500 ease-in-out" 
                style={{ width: `${progressPercent}%` }} 
              />
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 w-full max-w-4xl mx-auto flex flex-col relative pb-6">
            <InterviewerTile 
              questionText={currentQuestionText} 
              isTransitioning={isTransitioning} 
              isPlaying={isPlaying}
              onTogglePlay={toggleAudio}
              onReplay={replayAudio}
            />
            
            <CallControls 
              isMicOn={isMicOn}
              setIsMicOn={setIsMicOn}
            />
            
            <ResponsePanel 
              onSubmit={handleAnswerSubmit} 
              isSubmitting={isSubmitting} 
              autoSubmitSignal={autoSubmitSignal}
            />
          </div>
        </main>
      </div>
    </AppShell>
  );
}
