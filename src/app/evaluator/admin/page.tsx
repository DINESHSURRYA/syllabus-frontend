"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Search,
  Eye,
  FileText,
  Trash2,
  Clock,
  Plus,
  ArrowUpRight,
  TrendingUp,
  BarChart3,
  BrainCircuit,
  RefreshCw,
  BookOpen,
  Tag,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEvaluatorStore } from '@/lib/evaluator-store';
import { fetchAdminInterviews, AdminInterviewSummary } from '@/lib/evaluator-api';
import {
  EvaluatorPageHeader,
  EvaluatorStatCard,
  EvaluatorStatusBadge,
  EvaluatorEmptyState,
} from '@/components/ui/evaluator';

// ============================================================
// Stop Reason badge
// ============================================================
function StopReasonBadge({ reason }: { reason: string }) {
  if (!reason) return null;
  const label = reason.replace(/_/g, ' ');
  const colorClass =
    reason === 'manual_stop'
      ? 'border-amber-500/30 bg-amber-500/10 text-amber-400'
      : reason === 'completed'
      ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
      : 'border-slate-500/30 bg-slate-500/10 text-slate-400';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold uppercase tracking-wider ${colorClass}`}>
      {label}
    </span>
  );
}

// ============================================================
// API Session Row Card (from GET /admin/interviews)
// ============================================================
function ApiSessionCard({
  interview,
  onViewDetail,
}: {
  interview: AdminInterviewSummary;
  onViewDetail: () => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm overflow-hidden transition-all duration-200 hover:border-indigo-500/30 hover:shadow-md"
    >
      <div className="absolute left-0 top-0 w-1 h-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div className="p-5 pl-6 space-y-3">
        {/* Thread ID + stop reason */}
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-mono text-indigo-400 font-bold truncate">{interview.thread_id}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-mono font-bold text-[var(--text-primary)] px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/8 text-cyan-300">
                {interview.overall_understanding || '—'}
              </span>
              <StopReasonBadge reason={interview.stop_reason} />
            </div>
          </div>
        </div>

        {/* Topics */}
        {interview.topic && (
          <div className="flex items-start gap-1.5 text-xs font-mono text-[var(--text-muted)]">
            <Tag size={11} className="shrink-0 mt-0.5 text-indigo-400" />
            <span className="line-clamp-2">{interview.topic}</span>
          </div>
        )}

        {/* Summary */}
        {interview.summary && (
          <p className="text-xs text-[var(--text-secondary)] line-clamp-2 leading-relaxed">
            {interview.summary}
          </p>
        )}

        {/* Action */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-end">
          <button
            onClick={onViewDetail}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm"
          >
            <Eye size={13} />
            <span>View Detail</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Local Session Row Card (from Zustand store)
// ============================================================
function LocalSessionCard({
  session,
  onViewTranscript,
  onViewReport,
  onDelete,
}: {
  session: { threadId: string; topic: string; status: string; turns: any[]; report: any | null; stopReason: string };
  onViewTranscript: () => void;
  onViewReport: () => void;
  onDelete: () => void;
}) {
  const understanding = session.report?.assessment_summary?.overall_understanding;
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="group relative rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm overflow-hidden transition-all duration-200 hover:border-indigo-500/30 hover:shadow-md"
    >
      <div className="absolute left-0 top-0 w-1 h-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div className="p-5 pl-6 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-mono text-indigo-400 font-bold truncate">{session.threadId}</p>
            <div className="flex items-center gap-2 flex-wrap">
              <EvaluatorStatusBadge status={session.status} />
              {understanding && (
                <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-full border border-cyan-500/20 bg-cyan-500/8 text-cyan-300">
                  {understanding}
                </span>
              )}
              <StopReasonBadge reason={session.stopReason} />
            </div>
          </div>
        </div>

        {session.topic && (
          <div className="flex items-start gap-1.5 text-xs font-mono text-[var(--text-muted)]">
            <Tag size={11} className="shrink-0 mt-0.5 text-indigo-400" />
            <span>{session.topic}</span>
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] font-mono text-[var(--text-muted)]">
          <span className="flex items-center gap-1">
            <BrainCircuit size={11} />
            {session.turns.length} Turns
          </span>
        </div>

        <div className="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={onViewTranscript}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-indigo-500/40 hover:text-indigo-300 transition-all"
            >
              <FileText size={13} />
              <span>Transcript</span>
            </button>
            {session.report && (
              <button
                onClick={onViewReport}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm"
              >
                <ArrowUpRight size={13} />
                <span>Report</span>
              </button>
            )}
          </div>
          <button
            onClick={onDelete}
            className="p-1.5 text-[var(--text-muted)] hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-all"
            title="Delete session"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ============================================================
// Main Page
// ============================================================
export default function DiagnosticAdminDashboardPage() {
  const router = useRouter();
  const { sessions, deleteSession, setActiveThread } = useEvaluatorStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [apiInterviews, setApiInterviews] = useState<AdminInterviewSummary[]>([]);
  const [isFetchingApi, setIsFetchingApi] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'local' | 'api'>('local');

  const sessionList = Object.values(sessions);

  const filteredLocal = sessionList.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.threadId.toLowerCase().includes(q) ||
      s.topic.toLowerCase().includes(q)
    );
  });

  const filteredApi = apiInterviews.filter((i) => {
    const q = searchQuery.toLowerCase();
    return (
      i.thread_id.toLowerCase().includes(q) ||
      i.topic.toLowerCase().includes(q) ||
      (i.overall_understanding || '').toLowerCase().includes(q)
    );
  });

  // KPI (from local store)
  const totalLocal = sessionList.length;
  const completedCount = sessionList.filter((s) => s.status === 'Completed').length;
  const totalQuestions = sessionList.reduce((acc, s) => acc + s.turns.length, 0);
  const correctAnswers = sessionList.reduce((acc, s) => acc + (s.totalAnsweredCorrectly ?? 0), 0);

  const handleFetchFromApi = async () => {
    setIsFetchingApi(true);
    setFetchError(null);
    try {
      const res = await fetchAdminInterviews();
      setApiInterviews(res.interviews);
      setViewMode('api');
    } catch (err: any) {
      setFetchError(err?.message || 'Failed to fetch interviews from the server.');
    } finally {
      setIsFetchingApi(false);
    }
  };

  const handleViewTranscript = (threadId: string) => {
    setActiveThread(threadId);
    router.push(`/evaluator/admin/transcript/${threadId}`);
  };

  const handleViewReport = (threadId: string) => {
    setActiveThread(threadId);
    router.push(`/evaluator/report/${threadId}`);
  };

  const handleDelete = (threadId: string) => {
    if (confirm(`Delete session ${threadId}?`)) deleteSession(threadId);
  };

  const handleViewApiDetail = (threadId: string) => {
    router.push(`/evaluator/admin/transcript/${threadId}`);
  };

  return (
    <div className="space-y-8 pb-16">

      {/* ── Page Header ─────────────────────────────────── */}
      <EvaluatorPageHeader
        eyebrowIcon={LayoutDashboard}
        eyebrowText="Admin Management Area"
        title="Diagnostic Session Dashboard"
        subtitle="Monitor interview sessions, review transcripts, track evaluation scores, and fetch server-side results."
        rightContent={
          <button
            onClick={() => router.push('/evaluator/upload')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md"
          >
            <Plus size={14} />
            <span>New Session</span>
          </button>
        }
      />

      {/* ── KPI Stat Cards ──────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EvaluatorStatCard
          label="Total Sessions"
          value={totalLocal}
          description="Local sessions in store"
          icon={Users}
          iconColorClass="text-indigo-400"
          iconBgClass="bg-indigo-500/10"
          valueColorClass="text-indigo-400"
        />
        <EvaluatorStatCard
          label="Completed"
          value={completedCount}
          description="Finished interviews"
          icon={CheckCircle2}
          iconColorClass="text-emerald-400"
          iconBgClass="bg-emerald-500/10"
          valueColorClass="text-emerald-400"
        />
        <EvaluatorStatCard
          label="Total Questions"
          value={totalQuestions}
          description="Across all turns"
          icon={BrainCircuit}
          iconColorClass="text-cyan-400"
          iconBgClass="bg-cyan-500/10"
          valueColorClass="text-cyan-400"
        />
        <EvaluatorStatCard
          label="API Interviews"
          value={apiInterviews.length}
          description="Fetched from server"
          icon={TrendingUp}
          iconColorClass="text-amber-400"
          iconBgClass="bg-amber-500/10"
          valueColorClass="text-amber-400"
        />
      </div>

      {/* ── Toolbar ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by thread ID or topic…"
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* View toggle */}
        <div className="flex items-center gap-1 bg-[var(--bg-subtle)] p-1 rounded-xl border border-[var(--border-subtle)] shrink-0">
          <button
            onClick={() => setViewMode('local')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'local' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Local
          </button>
          <button
            onClick={() => setViewMode('api')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${viewMode === 'api' ? 'bg-indigo-600 text-white shadow-sm' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'}`}
          >
            Server
          </button>
        </div>

        {/* Fetch from API */}
        <button
          onClick={handleFetchFromApi}
          disabled={isFetchingApi}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 transition-all disabled:opacity-50 shrink-0"
        >
          <RefreshCw size={14} className={isFetchingApi ? 'animate-spin' : ''} />
          <span>{isFetchingApi ? 'Fetching…' : 'Fetch from Server'}</span>
        </button>
      </div>

      {/* Fetch error */}
      {fetchError && (
        <div className="flex items-start gap-2 p-3.5 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-400 text-xs font-mono">
          <AlertTriangle size={16} className="shrink-0 mt-0.5" />
          <span>{fetchError}</span>
        </div>
      )}

      {/* ── Session Cards ─────────────────────────────────── */}
      {viewMode === 'local' ? (
        filteredLocal.length === 0 ? (
          <EvaluatorEmptyState
            icon={BrainCircuit}
            title={searchQuery ? 'No sessions match your search' : 'No local sessions yet'}
            description={
              searchQuery
                ? `No sessions found for "${searchQuery}".`
                : 'Start a new diagnostic interview by uploading an assessment file.'
            }
            actionLabel={!searchQuery ? 'Begin New Session' : undefined}
            onAction={!searchQuery ? () => router.push('/evaluator/upload') : undefined}
          />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {filteredLocal.map((session) => (
              <LocalSessionCard
                key={session.threadId}
                session={session}
                onViewTranscript={() => handleViewTranscript(session.threadId)}
                onViewReport={() => handleViewReport(session.threadId)}
                onDelete={() => handleDelete(session.threadId)}
              />
            ))}
          </div>
        )
      ) : (
        apiInterviews.length === 0 ? (
          <EvaluatorEmptyState
            icon={BookOpen}
            title="No server interviews fetched"
            description="Click 'Fetch from Server' to load completed interview sessions from the evaluator backend."
            actionLabel="Fetch from Server"
            onAction={handleFetchFromApi}
          />
        ) : (
          <div className="space-y-3">
            <p className="text-xs font-mono text-[var(--text-muted)]">
              Showing <span className="text-[var(--text-primary)] font-bold">{filteredApi.length}</span> of{' '}
              <span className="text-[var(--text-primary)] font-bold">{apiInterviews.length}</span> server interviews
            </p>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredApi.map((interview) => (
                <ApiSessionCard
                  key={interview.thread_id}
                  interview={interview}
                  onViewDetail={() => handleViewApiDetail(interview.thread_id)}
                />
              ))}
            </div>
          </div>
        )
      )}
    </div>
  );
}
