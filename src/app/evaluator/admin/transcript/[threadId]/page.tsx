"use client";
import './styles/page.css';
import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ScrollText,
  Bot,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  BrainCircuit,
  Tag,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvaluatorStore } from '@/stores';
import {
  EvaluatorBackButton,
  EvaluatorEmptyState,
  EvaluatorTimelineTurn,
} from '@/components/ui/evaluator';

// ============================================================
// Main Page
// ============================================================
export default function InterviewTranscriptPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = (params?.threadId as string) || '';
  const { sessions } = useEvaluatorStore();

  const session = (sessions || []).find((s: any) => s.threadId === threadId);
  const [expandedTurn, setExpandedTurn] = useState<number | null>(1);

  if (!session) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertCircle size={48} className="text-amber-400" />
        <h2 className="text-lg font-bold text-[var(--text-primary)]">Transcript Not Found</h2>
        <p className="text-xs text-[var(--text-muted)]">
          No session transcript found for thread{' '}
          <code className="font-mono text-indigo-400">{threadId}</code>.
        </p>
        <button
          onClick={() => router.push('/evaluator/admin')}
          className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white shadow-md hover:bg-indigo-500 transition-all"
        >
          Back to Admin Dashboard
        </button>
      </div>
    );
  }

  const toggleAccordion = (turnNumber: number) =>
    setExpandedTurn(expandedTurn === turnNumber ? null : turnNumber);

  const totalQs = session.totalQuestionsAsked;
  const totalCorrect = session.totalAnsweredCorrectly;

  return (
    <div className="space-y-8 pb-20">

      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex flex-col gap-3 border-b border-[var(--border-subtle)] pb-6">
        <EvaluatorBackButton
          onClick={() => router.push('/evaluator/admin')}
          label="Back to Admin Dashboard"
        />
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1">
              <ScrollText size={14} />
              <span>Full Interview Transcript</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)]">
              Session {session.threadId}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-mono text-[var(--text-muted)]">
                Topic: <span className="text-[var(--text-secondary)] font-bold">{session.topic}</span>
              </span>
              <span className="text-xs font-mono text-[var(--text-muted)]">|</span>
              <span className="text-xs font-mono text-[var(--text-muted)]">
                {session.turns.length} turns
              </span>
            </div>
          </div>
          <button
            onClick={() => router.push(`/evaluator/report/${session.threadId}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-mono font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md shrink-0"
          >
            <span>View Report</span>
            <ExternalLink size={14} />
          </button>
        </div>
      </div>

      {/* ── Overview Cards ───────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Turns</span>
          <span className="text-xl font-black text-indigo-400 font-mono">{session.turns.length}</span>
        </div>
        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Asked</span>
          <span className="text-xl font-black text-cyan-400 font-mono">{totalQs}</span>
        </div>
        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Correct</span>
          <span className="text-xl font-black text-emerald-400 font-mono">{totalCorrect}</span>
        </div>
        <div className="p-4 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] space-y-1">
          <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase block">Topics</span>
          <span className="text-xl font-black text-[var(--text-primary)] font-mono">{session.totalTopics}</span>
        </div>
      </div>

      {/* ── Timeline ─────────────────────────────────────── */}
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <BrainCircuit className="text-indigo-400" size={20} />
          <h2 className="text-lg font-bold text-[var(--text-primary)]">
            Turn-by-Turn Transcript
          </h2>
        </div>

        {session.turns.length === 0 ? (
          <EvaluatorEmptyState
            icon={ScrollText}
            title="No transcript turns yet"
            description="This session has not recorded any interview turns."
          />
        ) : (
          <div className="space-y-6 relative before:absolute before:inset-0 before:left-6 before:w-0.5 before:bg-[var(--border-subtle)] before:z-0">
            {(session.turns || []).map((turn: any) => {
              const isOpen = expandedTurn === turn.turnNumber;
              const passed = (turn.evaluationScore ?? 0) >= 0.5;

              return (
                <EvaluatorTimelineTurn key={turn.turnNumber} turnNumber={turn.turnNumber}>

                  {/* ── AI Question Card ── */}
                  <div className="p-5 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-[var(--bg-card)] to-[var(--bg-card)] shadow-md space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-xl bg-indigo-500/20 text-indigo-300 flex items-center justify-center">
                          <Bot size={16} />
                        </div>
                        <span className="text-xs font-mono font-bold text-indigo-400 uppercase tracking-wider">
                          AI Interviewer
                        </span>
                      </div>
                      <span className="text-[11px] font-mono text-[var(--text-muted)]">{turn.timestamp}</span>
                    </div>

                    <p className="text-sm sm:text-base font-medium text-[var(--text-primary)] leading-relaxed">
                      {turn.questionStem}
                    </p>

                    {/* Target concepts */}
                    {turn.targetConcepts?.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        <Tag size={10} className="text-[var(--text-muted)] mt-1 shrink-0" />
                        {turn.targetConcepts.map((c: any) => (
                          <span key={c} className="px-2.5 py-0.5 rounded-full border border-indigo-500/20 bg-indigo-500/8 text-indigo-300 text-[10px] font-mono font-bold">
                            {c}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* ── Candidate Response Card ── */}
                  {turn.candidateAnswer && (
                    <div className="p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-3">
                      <div className="flex items-center justify-between flex-wrap gap-2">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 rounded-xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center">
                            <User size={16} />
                          </div>
                          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
                            Student Response
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 font-mono text-[11px] text-[var(--text-muted)]">
                          <Clock size={13} />
                          <span>{turn.responseTimeSeconds}s</span>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[var(--text-primary)] leading-relaxed bg-[var(--bg-subtle)] p-3.5 rounded-xl border border-[var(--border-subtle)]">
                        {turn.candidateAnswer}
                      </p>

                      {/* Evaluation result */}
                      {turn.evaluationScore !== null && (
                        <button
                          onClick={() => toggleAccordion(turn.turnNumber)}
                          className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-xs font-mono hover:bg-[var(--bg-hover)] transition-colors"
                        >
                          <div className="flex items-center gap-2">
                            {passed
                              ? <CheckCircle2 size={14} className="text-emerald-400" />
                              : <XCircle size={14} className="text-amber-400" />}
                            <span className={`font-bold ${passed ? 'text-emerald-400' : 'text-amber-400'}`}>
                              Score: {((turn.evaluationScore ?? 0) * 100).toFixed(0)}%
                            </span>
                          </div>
                          {isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                        </button>
                      )}

                      <AnimatePresence>
                        {isOpen && turn.evaluationFeedback && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className={`p-3.5 rounded-xl border text-xs font-mono leading-relaxed ${passed ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-200' : 'border-amber-500/30 bg-amber-500/8 text-amber-200'}`}>
                              {turn.evaluationFeedback}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </EvaluatorTimelineTurn>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
