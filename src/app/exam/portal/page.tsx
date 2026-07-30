"use client";
import './styles/page.css';
import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Clock,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  CheckCircle2,
  Lock,
  UserCheck,
  Maximize2,
  Minimize2,
  XCircle,
  ShieldAlert,
  ArrowRight,
  Info
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { useMCQStore } from '@/stores';
import { Assessment, MCQQuestion, ExamAttempt, BloomLevel } from '@/types';
import { toast } from 'sonner';

export default function CandidateExamPortalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const assessmentIdFromQuery = searchParams.get('id');

  const { assessments, recordAttempt } = useMCQStore();

  // Find targeted assessment or default to first formal assessment
  const targetAssessment = useMemo(() => {
    if (assessmentIdFromQuery) {
      const found = assessments.find((a) => a.id === assessmentIdFromQuery);
      if (found) return found;
    }
    return assessments[0];
  }, [assessments, assessmentIdFromQuery]);

  // Exam flow states
  const [hasStarted, setHasStarted] = useState(false);
  const [candidateName, setCandidateName] = useState('Alex Mercer');
  const [candidateEmail, setCandidateEmail] = useState('alex.mercer@university.edu');
  const [enteredAccessCode, setEnteredAccessCode] = useState('');
  const [accessCodeError, setAccessCodeError] = useState('');

  // Exam taking state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({}); // questionId -> optionIndex
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<number>>(new Set([0]));

  // Proctoring states
  const [tabSwitchCount, setTabSwitchCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Countdown timer state (in seconds)
  const totalDurationSeconds = (targetAssessment?.durationMinutes || 30) * 60;
  const [secondsRemaining, setSecondsRemaining] = useState(totalDurationSeconds);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Reset timer if targetAssessment changes
  useEffect(() => {
    if (targetAssessment) {
      setSecondsRemaining(targetAssessment.durationMinutes * 60);
    }
  }, [targetAssessment]);

  // Live Timer Countdown Effect
  useEffect(() => {
    if (!hasStarted || isSubmitting) return;

    const timer = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoSubmit('Time has expired!');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [hasStarted, isSubmitting]);

  // Proctoring Listener: Window Blur / Tab Switch Detection
  useEffect(() => {
    if (!hasStarted || isSubmitting || !targetAssessment?.proctoring?.trackTabSwitches) return;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        setTabSwitchCount((prevCount) => {
          const newCount = prevCount + 1;
          setShowWarningModal(true);

          const maxAllowed = targetAssessment.proctoring.maxTabSwitches || 3;
          if (newCount >= maxAllowed) {
            handleAutoSubmit(`Maximum tab switches allowed (${maxAllowed}) exceeded! Automatic submission triggered.`);
          }
          return newCount;
        });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [hasStarted, isSubmitting, targetAssessment]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleStartExam = () => {
    if (targetAssessment?.accessControl?.hasAccessCode) {
      if (enteredAccessCode.trim() !== targetAssessment.accessControl.accessCode) {
        setAccessCodeError(`Invalid access code! (Hint: Code is "${targetAssessment.accessControl.accessCode}")`);
        return;
      }
    }
    setHasStarted(true);
    setVisitedQuestions(new Set([0]));
    toast.success('Exam started! Active proctoring is enabled.');
  };

  const handleSelectOption = (questionId: string, optionIndex: number) => {
    setUserAnswers((prev) => ({ ...prev, [questionId]: optionIndex }));
  };

  const handleClearSelection = (questionId: string) => {
    setUserAnswers((prev) => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
  };

  const toggleMarkForReview = (questionId: string) => {
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const navigateToQuestion = (index: number) => {
    setCurrentQuestionIndex(index);
    setVisitedQuestions((prev) => new Set(prev).add(index));
  };

  // Submit & record attempt logic
  const handleAutoSubmit = (reason?: string) => {
    if (isSubmitting || !targetAssessment) return;
    setIsSubmitting(true);

    if (reason) {
      toast.warning(reason);
    }

    // Calculate score
    let totalScore = 0;
    const questions = targetAssessment.questions;
    const cognitiveBreakdown: Record<BloomLevel, { total: number; correct: number; percentage: number }> = {
      K1: { total: 0, correct: 0, percentage: 0 },
      K2: { total: 0, correct: 0, percentage: 0 },
      K3: { total: 0, correct: 0, percentage: 0 },
      K4: { total: 0, correct: 0, percentage: 0 },
      K5: { total: 0, correct: 0, percentage: 0 },
      K6: { total: 0, correct: 0, percentage: 0 },
    };

    questions.forEach((q) => {
      const level = q.cognitiveLevel;
      const pts = q.points || 1;
      cognitiveBreakdown[level].total += pts;

      const selectedOpt = userAnswers[q.id];
      if (selectedOpt !== undefined && selectedOpt === q.correctOptionIndex) {
        totalScore += pts;
        cognitiveBreakdown[level].correct += pts;
      }
    });

    (Object.keys(cognitiveBreakdown) as BloomLevel[]).forEach((lvl) => {
      const item = cognitiveBreakdown[lvl];
      item.percentage = item.total > 0 ? Math.round((item.correct / item.total) * 100) : 100;
    });

    const percentage = targetAssessment.totalMarks > 0 ? Math.round((totalScore / targetAssessment.totalMarks) * 1000) / 10 : 0;
    const passed = percentage >= (targetAssessment.passingPercentage || 60);

    const attemptId = `attempt-${Date.now()}`;
    const newAttempt: ExamAttempt = {
      id: attemptId,
      attemptId,
      status: 'Submitted',
      assessmentId: targetAssessment.id,
      assessmentTitle: targetAssessment.title,
      candidateName,
      candidateEmail,
      startTime: new Date(Date.now() - (totalDurationSeconds - secondsRemaining) * 1000).toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: totalDurationSeconds - secondsRemaining,
      score: totalScore,
      totalMarks: targetAssessment.totalMarks,
      percentage,
      passed,
      tabSwitchCount,
      answers: userAnswers,
      markedForReview: Array.from(markedForReview),
      cognitiveBreakdown,
    };

    recordAttempt(newAttempt);

    // ── Persist submission payload directly to PostgreSQL Backend ──────
    const bloomMap: Record<string, string> = {
      K1: 'Remember', K2: 'Understand', K3: 'Apply', K4: 'Analyze', K5: 'Evaluate', K6: 'Create'
    };

    const pgPayload = {
      candidate: {
        candidate_code: candidateEmail ? candidateEmail.split('@')[0].toUpperCase() : 'CAND-USER',
        name: candidateName || 'Candidate',
        email: candidateEmail || 'candidate@example.com',
        department: 'Computer Science',
        course_batch: '2026'
      },
      assessment: {
        assessment_name: targetAssessment.title || 'Assessment',
        course_code: (targetAssessment as any).courseCode || 'GEN101',
        topic: (targetAssessment as any).topic || 'General',
        difficulty: 'medium'
      },
      proctoring: {
        tab_switch_count: tabSwitchCount,
        risk_level: tabSwitchCount > 3 ? 'FLAGGED' : 'VERIFIED CLEAN'
      },
      completion_time: new Date().toLocaleTimeString(),
      submitted_at: new Date().toISOString(),
      questions: targetAssessment.questions.map((q) => {
        const userAnsIdx = userAnswers[q.id];
        return {
          id: q.id,
          text: q.text,
          options: q.options.map((optText, optIdx) => ({
            text: optText,
            is_correct: optIdx === q.correctOptionIndex
          })),
          bloom_level: bloomMap[q.cognitiveLevel] || 'Remember',
          unit_number: (q as any).unitNumber || 1,
          topic: (q as any).topic || 'General Topic',
          co_code: (q as any).coCode || 'CO1',
          user_answer: userAnsIdx !== undefined ? userAnsIdx : null,
          is_user_correct: userAnsIdx !== undefined && userAnsIdx === q.correctOptionIndex,
          correct_answer: q.correctOptionIndex,
          marks: q.points || 1.0
        };
      })
    };

    // Send payload to backend asynchronously
    fetch('http://localhost:8000/api/assessments/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pgPayload)
    })
      .then((res) => res.json())
      .then((data) => {
        console.log('Successfully persisted attempt to PostgreSQL:', data);
      })
      .catch((err) => {
        console.error('Error saving attempt to PostgreSQL:', err);
      });

    toast.success('Exam submitted successfully! Redirecting to score review...');

    setTimeout(() => {
      router.push(`/exam/results/${attemptId}`);
    }, 1000);
  };

  // Format time mm:ss
  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainderSecs = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainderSecs.toString().padStart(2, '0')}`;
  };

  // Color warning for timer
  const timerColorClass =
    secondsRemaining < 300
      ? 'text-rose-500 bg-rose-500/10 border-rose-500/30 animate-pulse'
      : secondsRemaining < 600
      ? 'text-amber-500 bg-amber-500/10 border-amber-500/30'
      : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30';

  const questions = targetAssessment?.questions || [];
  const currentQ = questions[currentQuestionIndex];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Verification Entry Screen before start */}
        {!hasStarted && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto rounded-3xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-black/80 p-8 backdrop-blur-2xl shadow-xl space-y-6"
          >
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-500 mx-auto flex items-center justify-center">
                <GraduationCap size={32} />
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 uppercase">
                {targetAssessment?.type === 'formal' ? 'Formal Proctored Exam' : 'Self-Paced Practice Quiz'}
              </span>
              <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">
                {targetAssessment?.title}
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {targetAssessment?.description}
              </p>
            </div>

            {/* Assessment Spec Meta */}
            <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 text-center text-xs font-mono">
              <div>
                <p className="text-slate-400 text-[10px]">TOTAL QUESTIONS</p>
                <p className="font-bold text-slate-900 dark:text-white text-base mt-0.5">
                  {questions.length}
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">DURATION</p>
                <p className="font-bold text-cyan-500 text-base mt-0.5">
                  {targetAssessment?.durationMinutes} Mins
                </p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px]">TOTAL MARKS</p>
                <p className="font-bold text-emerald-500 text-base mt-0.5">
                  {targetAssessment?.totalMarks} Pts
                </p>
              </div>
            </div>

            {/* Proctoring Rules Notice */}
            <div className="p-4 rounded-2xl border border-amber-500/30 bg-amber-500/10 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
              <p className="font-mono font-bold text-amber-500 flex items-center gap-1.5">
                <AlertTriangle size={14} /> Active Security & Proctoring Instructions:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-[11px]">
                <li>Tab switches and window minimization will be tracked automatically.</li>
                <li>Exceeding {targetAssessment?.proctoring?.maxTabSwitches || 3} tab switches triggers auto-submission.</li>
                <li>Ensure a stable internet connection before clicking "Start Exam".</li>
              </ul>
            </div>

            {/* Candidate Identity Form */}
            <div className="space-y-4 pt-2">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Candidate Full Name
                  </label>
                  <input
                    type="text"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                    Candidate Email
                  </label>
                  <input
                    type="email"
                    value={candidateEmail}
                    onChange={(e) => setCandidateEmail(e.target.value)}
                    className="w-full rounded-2xl border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Access Code Input if protected */}
              {targetAssessment?.accessControl?.hasAccessCode && (
                <div className="space-y-1">
                  <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                    <span>Access Passcode Required</span>
                    <span className="text-amber-500 font-mono">Protected</span>
                  </label>
                  <input
                    type="password"
                    placeholder="Enter access code..."
                    value={enteredAccessCode}
                    onChange={(e) => {
                      setEnteredAccessCode(e.target.value);
                      setAccessCodeError('');
                    }}
                    className="w-full rounded-2xl border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white font-mono focus:border-cyan-500 focus:outline-none"
                  />
                  {accessCodeError && (
                    <p className="text-[11px] font-mono text-rose-500 mt-1">{accessCodeError}</p>
                  )}
                </div>
              )}

              <Button
                onClick={handleStartExam}
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black font-extrabold text-sm rounded-2xl shadow-lg cursor-pointer"
              >
                Begin Exam Session <ArrowRight size={16} className="ml-1.5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Active Exam Player Layout */}
        {hasStarted && currentQ && (
          <div className="space-y-6">
            {/* Exam Header Bar */}
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/80 p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3 shadow-md">
              {/* Candidate Info */}
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-2xl bg-cyan-500/20 text-cyan-500 flex items-center justify-center font-mono font-bold text-xs">
                  {candidateName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {candidateName}
                  </p>
                  <p className="text-[10px] font-mono text-slate-400">
                    {targetAssessment?.title}
                  </p>
                </div>
              </div>

              {/* Center Live Countdown Timer */}
              <div className="flex items-center gap-2">
                <div className={`px-4 py-1.5 rounded-2xl border font-mono font-black text-sm flex items-center gap-2 ${timerColorClass}`}>
                  <Clock size={16} className="animate-spin" />
                  <span>Time Remaining: {formatTime(secondsRemaining)}</span>
                </div>
              </div>

              {/* Proctoring Status & Fullscreen Toggle */}
              <div className="flex items-center gap-3">
                <div
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold border flex items-center gap-1.5 ${
                    tabSwitchCount > 0
                      ? 'bg-rose-500/20 text-rose-500 border-rose-500/30'
                      : 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30'
                  }`}
                >
                  <ShieldAlert size={14} />
                  <span>
                    Tab Switches: {tabSwitchCount} / {targetAssessment?.proctoring?.maxTabSwitches || 3}
                  </span>
                </div>

                <button
                  onClick={toggleFullscreen}
                  className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
                  title="Toggle Fullscreen"
                >
                  {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
                </button>
              </div>
            </div>

            {/* Exam Main Area: Question Viewport + Question Palette Sidebar */}
            <div className="grid gap-6 lg:grid-cols-12">
              {/* Question Viewport */}
              <div className="lg:col-span-8 space-y-6">
                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 sm:p-8 backdrop-blur-xl space-y-6 shadow-sm">
                  {/* Question Stem Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                    <span className="text-xs font-mono font-bold text-cyan-500 uppercase">
                      Question {currentQuestionIndex + 1} of {questions.length}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Points: {currentQ.points || 1} Pts
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-relaxed">
                    {currentQ.questionText}
                  </h2>

                  {/* Option List with Radio Selection */}
                  <div className="space-y-3 pt-2">
                    {currentQ.options.map((opt, optIdx) => {
                      const isSelected = userAnswers[currentQ.id] === optIdx;
                      return (
                        <div
                          key={opt.id}
                          onClick={() => handleSelectOption(currentQ.id, optIdx)}
                          className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'border-cyan-500 bg-cyan-500/10 text-slate-900 dark:text-cyan-200 font-bold shadow-md'
                              : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/60 text-slate-800 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3 text-xs sm:text-sm">
                            <span
                              className={`w-6 h-6 rounded-full border flex items-center justify-center text-xs font-mono font-bold ${
                                isSelected
                                  ? 'border-cyan-500 bg-cyan-500 text-black'
                                  : 'border-slate-300 dark:border-white/20 text-slate-500'
                              }`}
                            >
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt.text}</span>
                          </div>
                          {isSelected && <CheckCircle2 size={18} className="text-cyan-500 shrink-0" />}
                        </div>
                      );
                    })}
                  </div>

                  {/* Controls: Prev, Next, Clear, Mark for Review */}
                  <div className="pt-6 border-t border-slate-200 dark:border-white/10 flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateToQuestion(Math.max(0, currentQuestionIndex - 1))}
                        disabled={currentQuestionIndex === 0}
                        className="text-xs font-mono"
                      >
                        <ChevronLeft size={14} className="mr-1" /> Previous
                      </Button>

                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigateToQuestion(Math.min(questions.length - 1, currentQuestionIndex + 1))}
                        disabled={currentQuestionIndex === questions.length - 1}
                        className="text-xs font-mono"
                      >
                        Next <ChevronRight size={14} className="ml-1" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-2">
                      {userAnswers[currentQ.id] !== undefined && (
                        <button
                          onClick={() => handleClearSelection(currentQ.id)}
                          className="text-xs font-mono text-slate-500 hover:text-rose-500 underline"
                        >
                          Clear Choice
                        </button>
                      )}

                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleMarkForReview(currentQ.id)}
                        className={`text-xs font-mono font-bold ${
                          markedForReview.has(currentQ.id)
                            ? 'text-amber-500 bg-amber-500/10'
                            : 'text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <Bookmark size={14} className="mr-1" />
                        {markedForReview.has(currentQ.id) ? 'Marked for Review' : 'Mark for Review'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Question Palette Sidebar */}
              <div className="lg:col-span-4 space-y-4">
                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-5 backdrop-blur-xl space-y-4 shadow-sm">
                  <h3 className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Question Navigation Palette
                  </h3>

                  {/* Number Grid Palette */}
                  <div className="grid grid-cols-5 gap-2">
                    {questions.map((q, idx) => {
                      const isCurrent = currentQuestionIndex === idx;
                      const isAnswered = userAnswers[q.id] !== undefined;
                      const isMarked = markedForReview.has(q.id);

                      let bgClass = 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400';
                      if (isMarked) {
                        bgClass = 'bg-amber-500 text-black font-bold';
                      } else if (isAnswered) {
                        bgClass = 'bg-emerald-500 text-black font-bold';
                      }

                      return (
                        <button
                          key={q.id}
                          onClick={() => navigateToQuestion(idx)}
                          className={`h-10 rounded-xl text-xs font-mono font-bold transition-all relative ${bgClass} ${
                            isCurrent ? 'ring-2 ring-cyan-500 ring-offset-2 ring-offset-black' : ''
                          }`}
                        >
                          {idx + 1}
                        </button>
                      );
                    })}
                  </div>

                  {/* Palette Legend */}
                  <div className="space-y-1.5 pt-3 border-t border-slate-200 dark:border-white/10 text-[11px] font-mono">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-emerald-500" />
                      <span className="text-slate-600 dark:text-slate-400">Answered</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-amber-500" />
                      <span className="text-slate-600 dark:text-slate-400">Marked for Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded bg-slate-200 dark:bg-slate-800" />
                      <span className="text-slate-600 dark:text-slate-400">Unvisited / Pending</span>
                    </div>
                  </div>

                  {/* Final Submit Button */}
                  <Button
                    onClick={() => handleAutoSubmit()}
                    size="lg"
                    className="w-full bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs rounded-2xl shadow-md cursor-pointer mt-4"
                  >
                    Submit Exam & View Results
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Switch Warning Modal Popup */}
        <AnimatePresence>
          {showWarningModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="max-w-md w-full rounded-3xl border border-rose-500/50 bg-slate-950 p-6 space-y-4 text-center shadow-2xl"
              >
                <div className="w-14 h-14 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center animate-bounce">
                  <ShieldAlert size={28} />
                </div>

                <h3 className="text-lg font-bold text-white">
                  Security Warning: Window Blur / Tab Switch Detected!
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed">
                  You navigated away from the exam environment. Violation recorded: ({tabSwitchCount} of {targetAssessment?.proctoring?.maxTabSwitches || 3} allowed).
                </p>

                <Button
                  onClick={() => setShowWarningModal(false)}
                  className="w-full bg-rose-500 hover:bg-rose-400 text-black font-mono font-bold text-xs"
                >
                  I Understand • Resume Exam
                </Button>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
