"use client";

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Award,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Layers,
  ArrowRight,
  Brain,
  Check,
  X,
  Info,
  ShieldCheck,
  Printer
} from 'lucide-react';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  useMCQStore,
  BLOOM_LEVEL_DESCRIPTIONS,
  BloomLevel,
  ExamAttempt,
  Assessment
} from '@/lib/mcq-store';

export default function InstantExamResultsPage() {
  const params = useParams();
  const router = useRouter();
  const attemptId = (params?.attemptId as string) || 'attempt-101';

  const { attempts, assessments, questionSets } = useMCQStore();

  // Find target attempt or fallback to latest/initial mock attempt
  const attempt = useMemo<ExamAttempt>(() => {
    const found = attempts.find((a) => a.id === attemptId);
    if (found) return found;
    return attempts[0] || {
      id: 'attempt-101',
      assessmentId: 'asm-dsa-midterm-2026',
      assessmentTitle: 'Data Structures & Algorithms Formal Mid-Term Exam',
      candidateName: 'Alex Mercer',
      candidateEmail: 'alex.mercer@university.edu',
      startTime: new Date().toISOString(),
      endTime: new Date().toISOString(),
      durationSeconds: 2520,
      score: 21,
      totalMarks: 24,
      percentage: 87.5,
      passed: true,
      tabSwitchCount: 1,
      answers: {
        'q-101': 1,
        'q-102': 1,
        'q-103': 1,
        'q-104': 1,
        'q-105': 1,
        'q-106': 0,
      },
      markedForReview: [],
      cognitiveBreakdown: {
        K1: { total: 2, correct: 2, percentage: 100 },
        K2: { total: 3, correct: 3, percentage: 100 },
        K3: { total: 4, correct: 4, percentage: 100 },
        K4: { total: 5, correct: 5, percentage: 100 },
        K5: { total: 5, correct: 5, percentage: 100 },
        K6: { total: 5, correct: 2, percentage: 40 },
      },
    };
  }, [attempts, attemptId]);

  // Find corresponding assessment questions to display review list
  const assessmentObj = useMemo<Assessment | undefined>(() => {
    return assessments.find((a) => a.id === attempt.assessmentId);
  }, [assessments, attempt]);

  const questionsList = useMemo(() => {
    if (assessmentObj?.questions && assessmentObj.questions.length > 0) {
      return assessmentObj.questions;
    }
    // Fallback to first question set
    return questionSets[0]?.questions || [];
  }, [assessmentObj, questionSets]);

  const minutesTaken = Math.floor((attempt.durationSeconds || 0) / 60);
  const secondsTaken = (attempt.durationSeconds || 0) % 60;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-black/70 p-6 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Award size={14} /> INSTANT EVALUATION SCORECARD
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              Exam Results & Cognitive Review
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Detailed performance breakdown across Bloom's Taxonomy levels (K1-K6).
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="border-slate-300 dark:border-white/20 text-xs font-mono"
            >
              <Printer size={14} className="mr-1.5" /> Print Scorecard
            </Button>
            <Button
              asChild
              size="sm"
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-md"
            >
              <Link href="/exam/portal">
                <RotateCcw size={14} className="mr-1.5" /> Retake Exam
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Score Summary Banner Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`rounded-3xl border p-8 backdrop-blur-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6 ${
            attempt.passed
              ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/40 to-black/80'
              : 'border-rose-500/40 bg-gradient-to-br from-rose-500/10 via-slate-900/40 to-black/80'
          }`}
        >
          <div className="flex items-center gap-5">
            {/* Big Badge Icon */}
            <div
              className={`w-20 h-20 rounded-3xl flex items-center justify-center text-3xl font-extrabold shadow-inner shrink-0 ${
                attempt.passed
                  ? 'bg-emerald-500 text-black shadow-[0_0_30px_rgba(16,185,129,0.4)]'
                  : 'bg-rose-500 text-white shadow-[0_0_30px_rgba(244,63,94,0.4)]'
              }`}
            >
              {attempt.passed ? <CheckCircle2 size={40} /> : <XCircle size={40} />}
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase ${
                    attempt.passed
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  }`}
                >
                  {attempt.passed ? 'PASSED VERIFIED' : 'FAILED - BELOW CUTOFF'}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  Candidate: {attempt.candidateName}
                </span>
              </div>

              <h2 className="text-3xl font-black text-slate-900 dark:text-white">
                Score: {attempt.score} / {attempt.totalMarks} Points
              </h2>

              <p className="text-xs font-mono text-slate-400">
                {attempt.assessmentTitle} • Completed in {minutesTaken}m {secondsTaken}s
              </p>
            </div>
          </div>

          {/* Big Percentage Metric Pill */}
          <div className="text-center md:text-right space-y-1">
            <p className="text-xs font-mono text-slate-400 uppercase tracking-widest">
              Percentage Score
            </p>
            <p className={`text-5xl font-black font-mono tracking-tight ${attempt.passed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {attempt.percentage}%
            </p>
            <p className="text-[11px] font-mono text-slate-500">
              Proctoring Flag: {attempt.tabSwitchCount} Tab Switches
            </p>
          </div>
        </motion.div>

        {/* Cognitive Breakdown Section (K1 to K6) */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 backdrop-blur-xl space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Brain size={18} className="text-cyan-500" /> Cognitive Performance by Bloom's Level (K1 - K6)
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {(['K1', 'K2', 'K3', 'K4', 'K5', 'K6'] as BloomLevel[]).map((lvl) => {
              const cfg = BLOOM_LEVEL_DESCRIPTIONS[lvl];
              const metrics = attempt.cognitiveBreakdown?.[lvl] || { total: 5, correct: 4, percentage: 80 };

              return (
                <div
                  key={lvl}
                  className={`p-4 rounded-2xl border ${cfg.border} ${cfg.bg} space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-mono font-bold ${cfg.color}`}>
                      {cfg.name}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-900 dark:text-white">
                      {metrics.percentage}%
                    </span>
                  </div>

                  <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-900 overflow-hidden">
                    <div
                      style={{ width: `${metrics.percentage}%` }}
                      className="h-full bg-cyan-500 transition-all duration-500"
                    />
                  </div>

                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                    Points: {metrics.correct} / {metrics.total} pts earned
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detailed Question-by-Question Review List */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 backdrop-blur-xl space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers size={18} className="text-cyan-500" /> Question-by-Question Response Audit & Explanations
          </h2>

          <div className="space-y-4">
            {questionsList.map((q, idx) => {
              const selectedOptIdx = attempt.answers[q.id];
              const isCorrect = selectedOptIdx === q.correctOptionIndex;
              const bloomInfo = BLOOM_LEVEL_DESCRIPTIONS[q.cognitiveLevel];

              return (
                <div
                  key={q.id}
                  className={`p-5 rounded-3xl border space-y-4 transition-all ${
                    isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/5'
                      : 'border-rose-500/30 bg-rose-500/5'
                  }`}
                >
                  {/* Item Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <span
                        className={`flex h-7 w-7 items-center justify-center rounded-xl font-mono font-bold text-xs ${
                          isCorrect
                            ? 'bg-emerald-500 text-black'
                            : 'bg-rose-500 text-white'
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="space-y-1">
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {q.questionText}
                        </p>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${bloomInfo.bg} ${bloomInfo.color}`}>
                            {bloomInfo.name}
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            {q.points || 1} Pts
                          </span>
                        </div>
                      </div>
                    </div>

                    <span
                      className={`px-3 py-1 rounded-full text-xs font-mono font-bold flex items-center gap-1 ${
                        isCorrect
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {isCorrect ? <Check size={14} /> : <X size={14} />}
                      {isCorrect ? 'Correct (+Points)' : 'Incorrect (0 Pts)'}
                    </span>
                  </div>

                  {/* Options Audit */}
                  <div className="grid gap-2 sm:grid-cols-2">
                    {q.options.map((opt, oIdx) => {
                      const isCandidateChoice = selectedOptIdx === oIdx;
                      const isActualCorrect = oIdx === q.correctOptionIndex;

                      let borderClass = 'border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300';
                      if (isActualCorrect) {
                        borderClass = 'border-emerald-500 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-bold';
                      } else if (isCandidateChoice && !isActualCorrect) {
                        borderClass = 'border-rose-500 bg-rose-500/10 text-rose-600 dark:text-rose-300 font-bold';
                      }

                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-2xl border text-xs flex items-center justify-between ${borderClass}`}
                        >
                          <span>
                            {String.fromCharCode(65 + oIdx)}. {opt.text}
                          </span>
                          {isCandidateChoice && (
                            <span className="text-[9px] font-mono uppercase font-bold px-1.5 py-0.5 rounded bg-black/20">
                              Your Choice
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Explanation Box */}
                  <div className="p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 text-xs space-y-1">
                    <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                      <Info size={14} /> Cognitive Explanation & Reasoning:
                    </p>
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                      {q.explanation}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
