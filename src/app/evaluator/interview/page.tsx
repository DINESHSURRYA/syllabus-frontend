"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Mic,
  Send,
  MicOff,
  SkipForward,
  LogOut,
  BrainCircuit,
  Volume2,
  VolumeX,
  RotateCcw,
  Clock,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Tag,
  StopCircle,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvaluatorStore } from '@/lib/evaluator-store';
import { submitAnswer, stopInterview } from '@/lib/evaluator-api';
import {
  EvaluatorInterviewerTile,
  EvaluatorProgressBar,
} from '@/components/ui/evaluator';

// ============================================================
// SpeechRecognition typing shim
// ============================================================
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

// ============================================================
// Evaluation feedback banner
// ============================================================
function EvaluationBanner({
  score,
  feedback,
}: {
  score: number | null;
  feedback: string;
}) {
  if (score === null || !feedback) return null;
  const passed = score >= 0.5;
  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`flex items-start gap-3 p-4 rounded-xl border text-xs font-mono ${
        passed
          ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-300'
          : 'border-amber-500/30 bg-amber-500/8 text-amber-300'
      }`}
    >
      {passed ? (
        <CheckCircle2 size={15} className="shrink-0 mt-0.5 text-emerald-400" />
      ) : (
        <XCircle size={15} className="shrink-0 mt-0.5 text-amber-400" />
      )}
      <div className="space-y-1 flex-1">
        <div className="flex items-center gap-2">
          <span className={`font-bold uppercase tracking-wider text-[10px] ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
            {passed ? 'Correct' : 'Needs improvement'}
          </span>
          <span className="ml-auto font-bold">
            Score: {(score * 100).toFixed(0)}%
          </span>
        </div>
        <p className="leading-relaxed text-[var(--text-secondary)]">{feedback}</p>
      </div>
    </motion.div>
  );
}

// ============================================================
// Target concepts chips
// ============================================================
function TargetConceptChips({ concepts }: { concepts: string[] }) {
  if (!concepts?.length) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider">
        <Tag size={10} /> Concepts:
      </span>
      {concepts.map((c) => (
        <span
          key={c}
          className="px-2.5 py-0.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-[10px] font-mono font-bold"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

// ============================================================
// Main page
// ============================================================
export default function InterviewSessionPage() {
  const router = useRouter();
  const {
    activeSession,
    activeThreadId,
    currentTurnIndex,
    candidateResponseInput,
    isAudioPlaying,
    isMicRecording,
    questionTimerSeconds,
    isTimerRunning,
    applySubmitResponseToSession,
    setCandidateResponseInput,
    setAudioPlaying,
    setMicRecording,
    tickTimer,
    resetQuestionTimer,
    showAdminHint,
    setShowAdminHint,
    setStopReport,
  } = useEvaluatorStore();

  const [responseTab, setResponseTab] = useState<'type' | 'speak'>('type');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Prevents redirect on direct page load (only redirect after an actual submit/stop)
  const hasSubmittedRef = useRef(false);

  // ── Timer tick ───────────────────────────────────────────
  useEffect(() => {
    if (!isTimerRunning) return;
    const interval = setInterval(() => tickTimer(), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, tickTimer]);

  // ── Redirect on session complete ─────────────────────────
  useEffect(() => {
    if (
      (activeSession?.status === 'Completed' || activeSession?.status === 'Terminated') &&
      hasSubmittedRef.current
    ) {
      hasSubmittedRef.current = false;
      router.push(`/evaluator/report/${activeSession.threadId}`);
    }
  }, [activeSession?.status, activeSession?.threadId, router]);

  // ── Init Web Speech API ──────────────────────────────────
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';
      recognitionRef.current = rec;
    }
  }, []);

  // ── Sync audio element to current turn's audio_url ──────
  useEffect(() => {
    if (!activeSession) return;
    const turn = activeSession.turns[currentTurnIndex];
    if (!turn?.audioUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(turn.audioUrl);
    audioRef.current = audio;
    setAudioPlaying(false);

    audio.onended = () => setAudioPlaying(false);
    audio.onerror = () => setAudioPlaying(false);
  }, [currentTurnIndex, activeSession?.threadId, setAudioPlaying]);

  // ── No active session guard ──────────────────────────────
  if (!activeSession) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-6 px-4">
        <div className="h-20 w-20 rounded-3xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center">
          <BrainCircuit size={36} className="text-indigo-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-black text-[var(--text-primary)]">No Active Session</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md">
            You don&apos;t have an active interview session. Go to the Upload page to upload an
            assessment file and start a new session.
          </p>
        </div>
        <button
          onClick={() => router.push('/evaluator/upload')}
          className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-500 to-cyan-500 text-white hover:from-indigo-400 hover:to-cyan-400 transition-all shadow-[0_0_25px_rgba(99,102,241,0.4)]"
        >
          <span>Go to Upload &amp; Start</span>
        </button>
      </div>
    );
  }

  const currentTurn = activeSession.turns[currentTurnIndex];
  const totalQuestionsAsked = activeSession.totalQuestionsAsked;
  const totalTopics = activeSession.totalTopics;

  // Previous turn (to show its evaluation under the new question)
  const prevTurn = currentTurnIndex > 0 ? activeSession.turns[currentTurnIndex - 1] : null;

  // ── Format timer ─────────────────────────────────────────
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = (secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // ── Audio controls ───────────────────────────────────────
  const handleToggleAudio = () => {
    if (!audioRef.current) return;
    if (isAudioPlaying) {
      audioRef.current.pause();
      setAudioPlaying(false);
    } else {
      audioRef.current.play().catch(console.error);
      setAudioPlaying(true);
    }
  };

  const handleReplayAudio = () => {
    if (!audioRef.current) return;
    audioRef.current.currentTime = 0;
    audioRef.current.play().catch(console.error);
    setAudioPlaying(true);
  };

  // ── Mic toggle ───────────────────────────────────────────
  const handleMicToggle = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. Please use Chrome or Edge.');
      return;
    }
    if (!isMicRecording) {
      const currentText = candidateResponseInput ? candidateResponseInput + ' ' : '';
      recognitionRef.current.onresult = (event: any) => {
        let final = '';
        let interim = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) final += event.results[i][0].transcript;
          else interim += event.results[i][0].transcript;
        }
        setCandidateResponseInput(currentText + final + interim);
      };
      recognitionRef.current.onerror = () => setMicRecording(false);
      recognitionRef.current.onend = () => setMicRecording(false);
      recognitionRef.current.start();
      setMicRecording(true);
    } else {
      recognitionRef.current.stop();
      setMicRecording(false);
    }
  };

  // ── Submit answer ────────────────────────────────────────
  const handleSubmit = async () => {
    if (!candidateResponseInput.trim() || isSubmitting) return;

    setIsSubmitting(true);
    setIsTransitioning(true);
    setSubmitError(null);
    hasSubmittedRef.current = true;

    if (isMicRecording) {
      recognitionRef.current?.stop();
      setMicRecording(false);
    }

    const timeTaken = questionTimerSeconds;

    try {
      const res = await submitAnswer(activeThreadId, candidateResponseInput.trim(), timeTaken);
      applySubmitResponseToSession(candidateResponseInput.trim(), timeTaken, res);
      resetQuestionTimer();
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to submit answer. Please check your connection.');
      hasSubmittedRef.current = false;
    } finally {
      setIsTransitioning(false);
      setIsSubmitting(false);
      setResponseTab('type');
    }
  };

  // ── Skip question ────────────────────────────────────────
  const handleSkip = async () => {
    if (isSubmitting) return;
    setCandidateResponseInput('I am unsure about this — please move to the next question.');
    await new Promise((r) => setTimeout(r, 50));
    await handleSubmit();
  };

  // ── Stop interview ───────────────────────────────────────
  const handleStopInterview = async () => {
    if (isStopping || isSubmitting) return;
    if (!confirm('Stop the interview now? A report will be generated from your answers so far.')) return;

    setIsStopping(true);
    hasSubmittedRef.current = true;

    try {
      const res = await stopInterview(activeThreadId);
      setStopReport(res.report, 'manual_stop');
      router.push(`/evaluator/report/${activeSession.threadId}`);
    } catch (err: any) {
      setSubmitError(err?.message || 'Failed to stop the interview. Please try again.');
      hasSubmittedRef.current = false;
    } finally {
      setIsStopping(false);
    }
  };

  const canSubmit = candidateResponseInput.trim().length > 0;

  return (
    <div className="flex flex-col space-y-4 pb-16">

      {/* ── Top Progress & Controls Bar ─────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
        {/* Left: Question counter + timer */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-xs font-mono">
            <BrainCircuit size={14} className="text-indigo-400" />
            <span className="font-bold text-[var(--text-primary)]">
              Question {currentTurnIndex + 1}
              <span className="text-[var(--text-muted)] font-normal">
                {totalTopics > 0 && ` · ${totalTopics} topic${totalTopics !== 1 ? 's' : ''}`}
              </span>
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs font-mono text-[var(--text-muted)] border border-[var(--border-subtle)] px-2.5 py-1 rounded-full">
            <Clock size={11} />
            <span>{formatTime(questionTimerSeconds)}</span>
          </div>
        </div>

        {/* Right: Current topic + score + stop */}
        <div className="flex items-center gap-2">
          {currentTurn && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hidden sm:flex items-center gap-1">
              <span className="text-[10px] text-[var(--text-muted)]">Topic:</span>
              <span>{currentTurn.topic}</span>
            </span>
          )}
          {totalQuestionsAsked > 0 && (
            <span className="text-xs font-mono px-2.5 py-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hidden sm:flex items-center gap-1">
              <CheckCircle2 size={10} />
              <span>{activeSession.totalAnsweredCorrectly}/{totalQuestionsAsked}</span>
            </span>
          )}
          <button
            onClick={handleStopInterview}
            disabled={isStopping || isSubmitting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-all disabled:opacity-50"
          >
            {isStopping ? <Loader2 size={13} className="animate-spin" /> : <StopCircle size={13} />}
            <span>{isStopping ? 'Stopping…' : 'Stop Interview'}</span>
          </button>
        </div>
      </div>

      {/* ── Progress Bar ───────────────────────────────── */}
      <EvaluatorProgressBar
        current={currentTurnIndex}
        total={Math.max(activeSession.turns.length, 1)}
        className="mb-1"
      />

      {/* ── Previous-turn evaluation (shown above new question) ── */}
      <AnimatePresence>
        {prevTurn && prevTurn.evaluationScore !== null && prevTurn.evaluationFeedback && (
          <EvaluationBanner
            score={prevTurn.evaluationScore}
            feedback={prevTurn.evaluationFeedback}
          />
        )}
      </AnimatePresence>

      {/* ── Target concepts for current question ──────────── */}
      {currentTurn && !isTransitioning && (
        <TargetConceptChips concepts={currentTurn.targetConcepts} />
      )}

      {/* ── Interviewer Tile ────────────────────────────── */}
      <EvaluatorInterviewerTile
        questionText={currentTurn?.questionStem}
        isTransitioning={isTransitioning}
        isPlaying={isAudioPlaying}
        onTogglePlay={handleToggleAudio}
        onReplay={handleReplayAudio}
      />

      {/* ── API Error Banner ────────────────────────────── */}
      <AnimatePresence>
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-2.5 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono"
          >
            <AlertTriangle size={15} className="shrink-0 mt-0.5" />
            <span>{submitError}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Response Panel ─────────────────────────────── */}
      <div className="space-y-3">
        {/* Tab toggle */}
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-full w-fit border border-[var(--border-subtle)]">
          <button
            onClick={() => setResponseTab('type')}
            className={`flex items-center gap-1.5 px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              responseTab === 'type'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Send size={12} />
            <span>Type</span>
          </button>
          <button
            onClick={() => setResponseTab('speak')}
            className={`flex items-center gap-1.5 px-5 py-1.5 rounded-full text-xs font-semibold transition-all ${
              responseTab === 'speak'
                ? 'bg-[var(--bg-card)] text-[var(--text-primary)] shadow-md'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Mic size={12} />
            <span>Speak</span>
          </button>
        </div>

        {/* Response content area */}
        <div
          className={`relative w-full rounded-2xl border transition-all duration-300 ${
            isFocused
              ? 'border-indigo-500 shadow-[0_0_0_3px_rgba(99,102,241,0.12)]'
              : 'border-[var(--border-subtle)]'
          } bg-[var(--bg-card)] p-5 min-h-[160px] flex flex-col`}
        >
          {responseTab === 'type' ? (
            <>
              <textarea
                ref={textareaRef}
                rows={5}
                className="w-full flex-1 bg-transparent border-none resize-none text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-0 leading-relaxed"
                placeholder="Type your response here… Be as detailed and specific as possible."
                value={candidateResponseInput}
                onChange={(e) => setCandidateResponseInput(e.target.value)}
                disabled={isSubmitting}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
              <p className="text-[10px] font-mono text-[var(--text-muted)] mt-2">
                {candidateResponseInput.length} characters
              </p>
            </>
          ) : (
            /* Speak tab */
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 flex-1">
              {/* Mic button */}
              <div className="flex flex-col items-center gap-2 shrink-0">
                <button
                  onClick={handleMicToggle}
                  disabled={isSubmitting}
                  className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl focus:outline-none focus:ring-4 focus:ring-indigo-500/30 ${
                    isMicRecording
                      ? 'bg-rose-500 text-white animate-pulse scale-110 shadow-[0_0_30px_rgba(244,63,94,0.5)]'
                      : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:bg-indigo-500/20 hover:text-indigo-300 border border-[var(--border-subtle)]'
                  }`}
                >
                  {isMicRecording ? <MicOff size={28} /> : <Mic size={28} />}
                </button>
                <p className="text-xs font-mono text-[var(--text-muted)] text-center max-w-[100px]">
                  {isMicRecording ? 'Recording…' : 'Tap to speak'}
                </p>
              </div>

              {/* Live transcription */}
              <div className="flex-1 w-full bg-[var(--bg-subtle)] rounded-xl p-4 border border-[var(--border-subtle)] flex flex-col min-h-[100px]">
                <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--text-muted)] mb-2">
                  Live Transcription
                </span>
                <textarea
                  rows={3}
                  className="w-full flex-1 bg-transparent border-none resize-none text-sm text-[var(--text-primary)] focus:outline-none focus:ring-0 leading-relaxed"
                  placeholder={isMicRecording ? 'Listening…' : 'Your transcribed speech will appear here. You can edit it manually.'}
                  value={candidateResponseInput}
                  onChange={(e) => setCandidateResponseInput(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>
            </div>
          )}

          {/* Submit / Skip row */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-[var(--border-subtle)]">
            <button
              onClick={handleSkip}
              disabled={isSubmitting}
              className="flex items-center gap-1.5 text-xs text-[var(--text-muted)] hover:text-amber-400 transition-colors font-mono"
            >
              <SkipForward size={13} />
              <span>Skip this question</span>
            </button>
            <button
              onClick={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-xs font-bold transition-all ${
                canSubmit && !isSubmitting
                  ? 'bg-gradient-to-r from-indigo-500 to-cyan-500 text-white shadow-lg hover:from-indigo-400 hover:to-cyan-400 hover:-translate-y-0.5 transform shadow-[0_0_20px_rgba(99,102,241,0.35)]'
                  : 'bg-[var(--bg-subtle)] text-[var(--text-muted)] cursor-not-allowed'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Processing…</span>
                </>
              ) : (
                <>
                  <span>Submit &amp; Next Question</span>
                  <Send size={13} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Agent Metadata Panel ────────────────────────── */}
      <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
        <button
          onClick={() => setShowAdminHint(!showAdminHint)}
          className="w-full flex items-center justify-between px-4 py-3 text-xs font-mono text-[var(--text-muted)] hover:bg-[var(--bg-hover)] transition-colors"
        >
          <span className="flex items-center gap-2">
            <BrainCircuit size={13} className="text-indigo-400" />
            <span className="text-indigo-300 font-bold uppercase tracking-wider">Session Metadata</span>
          </span>
          <ChevronDown
            size={15}
            className={`transition-transform duration-200 ${showAdminHint ? 'rotate-180' : ''}`}
          />
        </button>
        <AnimatePresence>
          {showAdminHint && currentTurn && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-[var(--border-subtle)] bg-slate-950/60 overflow-hidden"
            >
              <div className="p-4 space-y-3 text-xs font-mono">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <span className="text-indigo-400 uppercase tracking-wider font-bold block">Question ID</span>
                    <p className="text-slate-300">{currentTurn.questionId || '—'}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-amber-400 uppercase tracking-wider font-bold block">Current Topic</span>
                    <p className="text-slate-300">{currentTurn.topic || '—'}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-800 flex flex-wrap gap-4 text-[11px]">
                  <span>Thread: <span className="text-slate-400 font-bold">{activeThreadId}</span></span>
                  <span>Turn: <span className="text-cyan-400 font-bold">{currentTurn.turnNumber}</span></span>
                  <span>Timer: <span className="text-indigo-300 font-bold">{formatTime(questionTimerSeconds)}</span></span>
                  <span>Correct: <span className="text-emerald-400 font-bold">{activeSession.totalAnsweredCorrectly}/{activeSession.totalQuestionsAsked}</span></span>
                  {currentTurn.audioUrl && (
                    <span>Audio: <span className="text-cyan-400 font-bold truncate max-w-[200px] inline-block align-bottom">{currentTurn.audioUrl}</span></span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
