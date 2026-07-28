"use client";

import React, { useState } from 'react';
import {
  FileCode2,
  Search,
  Cpu,
  Clock,
  Eye,
  Copy,
  Check,
  Sparkles,
  Terminal,
  Code2,
  AlertCircle,
  Database,
  Filter,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEvaluatorStore, AuditLogEntry } from '@/lib/evaluator-store';
import {
  EvaluatorPageHeader,
  EvaluatorEmptyState,
  EvaluatorAccordionRow,
  EvaluatorMetricPill,
} from '@/components/ui/evaluator';

// ============================================================
// Agent type color config
// ============================================================
const agentTypeConfig: Record<string, string> = {
  IngestorAgent:  'border-indigo-500/30 bg-indigo-500/10 text-indigo-300',
  QuestionAgent:  'border-cyan-500/30 bg-cyan-500/10 text-cyan-300',
  EvaluatorAgent: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  ReportAgent:    'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
};

const levelBadgeColors: Record<string, string> = {
  INFO:  'bg-cyan-500/10 text-cyan-400 border-cyan-500/30',
  WARN:  'bg-amber-500/10 text-amber-400 border-amber-500/30',
  ERROR: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  DEBUG: 'bg-purple-500/10 text-purple-400 border-purple-500/30',
};

// ============================================================
// Log Row Card — single accordion row
// ============================================================
function AuditLogRow({
  log,
  isOpen,
  onToggle,
  onCopy,
  copiedLabel,
}: {
  log: AuditLogEntry;
  isOpen: boolean;
  onToggle: () => void;
  onCopy: (text: string, label: string) => void;
  copiedLabel: string | null;
}) {
  const agentClass = agentTypeConfig[log.agentType] || 'border-slate-500/30 bg-slate-500/10 text-slate-300';

  return (
    <EvaluatorAccordionRow
      isOpen={isOpen}
      onToggle={onToggle}
      headerContent={
        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          {/* Agent badge + event name */}
          <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold shrink-0 ${agentClass}`}>
              <Cpu size={10} />
              {log.agentType}
            </span>
            <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold shrink-0 ${levelBadgeColors[log.logLevel] || levelBadgeColors.INFO}`}>
              {log.logLevel}
            </span>
            <span className="text-xs font-mono font-bold text-[var(--text-primary)] truncate">
              {log.eventName}
            </span>
          </div>

          {/* Right metadata row */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 shrink-0 text-[11px] font-mono text-[var(--text-muted)]">
            <span className="flex items-center gap-1">
              <span className="text-[var(--text-muted)] text-[10px]">Thread:</span>
              <span className="text-indigo-400 font-bold">{log.threadId}</span>
            </span>
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {log.latencyMs}ms
            </span>
            <span className="hidden sm:flex items-center gap-1">
              <span className="text-[10px]">{log.totalTokens} tokens</span>
            </span>
            <span className="text-[10px] text-[var(--text-muted)]">{log.timestamp}</span>
          </div>
        </div>
      }
      bodyContent={
        <div className="space-y-5">
          {/* Token metrics row */}
          <div className="flex flex-wrap items-center gap-6 p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)]">
            <EvaluatorMetricPill label="Model" value={log.model} colorClass="text-indigo-300 font-bold" />
            <EvaluatorMetricPill label="Latency" value={`${log.latencyMs}ms`} colorClass="text-cyan-400 font-bold" />
            <EvaluatorMetricPill label="Prompt Tokens" value={log.promptTokens.toLocaleString()} colorClass="text-amber-400 font-bold" />
            <EvaluatorMetricPill label="Completion" value={log.completionTokens.toLocaleString()} colorClass="text-emerald-400 font-bold" />
            <EvaluatorMetricPill label="Total Tokens" value={log.totalTokens.toLocaleString()} colorClass="text-[var(--text-primary)] font-bold" />
          </div>

          {/* System Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
                <Terminal size={11} />
                System Prompt
              </span>
              <button
                onClick={() => onCopy(log.systemPrompt, `sys-${log.id}`)}
                className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-indigo-300 transition-colors"
              >
                {copiedLabel === `sys-${log.id}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                {copiedLabel === `sys-${log.id}` ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
              {log.systemPrompt}
            </pre>
          </div>

          {/* User Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={11} />
                User Prompt
              </span>
              <button
                onClick={() => onCopy(log.userPrompt, `usr-${log.id}`)}
                className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-cyan-300 transition-colors"
              >
                {copiedLabel === `usr-${log.id}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                {copiedLabel === `usr-${log.id}` ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto custom-scrollbar">
              {log.userPrompt}
            </pre>
          </div>

          {/* Raw JSON Response */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                <Code2 size={11} />
                Raw LLM JSON Response
              </span>
              <button
                onClick={() => onCopy(log.rawJsonResponse, `raw-${log.id}`)}
                className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] hover:text-emerald-300 transition-colors"
              >
                {copiedLabel === `raw-${log.id}` ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                {copiedLabel === `raw-${log.id}` ? 'Copied!' : 'Copy'}
              </button>
            </div>
            <pre className="w-full p-3 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto custom-scrollbar">
              {log.rawJsonResponse}
            </pre>
          </div>
        </div>
      }
    />
  );
}

// ============================================================
// Main Page Component
// ============================================================
const AGENT_TYPES = ['All', 'IngestorAgent', 'QuestionAgent', 'EvaluatorAgent', 'ReportAgent'] as const;
const LOG_LEVELS = ['All', 'INFO', 'WARN', 'ERROR', 'DEBUG'] as const;

export default function SystemAuditLogsPage() {
  const { auditLogs, selectedAuditLog, setSelectedAuditLog } = useEvaluatorStore();

  const [agentFilter, setAgentFilter] = useState<string>('All');
  const [logLevelFilter, setLogLevelFilter] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);
  const [openLogId, setOpenLogId] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesAgent = agentFilter === 'All' || log.agentType === agentFilter;
    const matchesLevel = logLevelFilter === 'All' || log.logLevel === logLevelFilter;
    const matchesSearch =
      log.eventName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.threadId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.model.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesAgent && matchesLevel && matchesSearch;
  });

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    setCopiedPrompt(label);
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <div className="space-y-8 pb-16">

      {/* ── Page Header ─────────────────────────────────── */}
      <EvaluatorPageHeader
        eyebrowIcon={FileCode2}
        eyebrowText="System Telemetry"
        title="LLM Agent Audit Logs"
        subtitle="Full observability into every AI agent invocation: prompts, completions, latency, belief updates, and token usage."
        rightContent={
          <span className="text-xs font-mono px-3 py-1.5 rounded-full border border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)]">
            <span className="text-[var(--text-primary)] font-bold">{filteredLogs.length}</span> of{' '}
            <span className="text-[var(--text-primary)] font-bold">{auditLogs.length}</span> entries
          </span>
        }
      />

      {/* ── Filters ─────────────────────────────────────── */}
      <div className="flex flex-col gap-3">
        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search event name, thread ID, or model..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        {/* Agent type filter */}
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] mr-1">
            <Cpu size={11} /> Agent:
          </span>
          {AGENT_TYPES.map((a) => (
            <button
              key={a}
              onClick={() => setAgentFilter(a)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-all ${
                agentFilter === a
                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-indigo-500/40 hover:text-indigo-300'
              }`}
            >
              {a === 'All' ? 'All Agents' : a.replace('Agent', '')}
            </button>
          ))}
        </div>

        {/* Log level filter */}
        <div className="flex flex-wrap gap-1.5">
          <span className="flex items-center gap-1 text-[10px] font-mono text-[var(--text-muted)] mr-1">
            <Filter size={11} /> Level:
          </span>
          {LOG_LEVELS.map((l) => (
            <button
              key={l}
              onClick={() => setLogLevelFilter(l)}
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold border transition-all ${
                logLevelFilter === l
                  ? 'bg-indigo-500 border-indigo-500 text-white shadow-sm'
                  : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-indigo-500/40 hover:text-indigo-300'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* ── Log Entries ─────────────────────────────────── */}
      {filteredLogs.length === 0 ? (
        <EvaluatorEmptyState
          icon={Database}
          title="No log entries found"
          description={
            searchQuery || agentFilter !== 'All' || logLevelFilter !== 'All'
              ? 'No logs match your current filters. Try adjusting your search or filter criteria.'
              : 'No audit log entries have been recorded yet. Begin an interview session to generate agent telemetry.'
          }
        />
      ) : (
        <div className="space-y-3">
          {filteredLogs.map((log) => (
            <AuditLogRow
              key={log.id}
              log={log}
              isOpen={openLogId === log.id}
              onToggle={() => setOpenLogId(openLogId === log.id ? null : log.id)}
              onCopy={handleCopyText}
              copiedLabel={copiedPrompt}
            />
          ))}
        </div>
      )}
    </div>
  );
}
