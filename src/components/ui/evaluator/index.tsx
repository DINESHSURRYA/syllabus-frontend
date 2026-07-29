"use client";
import './styles/index.css';
/**
 * Evaluator Shared UI Components
 * 
 * Reusable building blocks for all Diagnostic Evaluator pages.
 * Inspired by the eVALUATOR reference frontend's design patterns:
 * - Editorial typography (eyebrow + serif heading)
 * - Translucent card surfaces
 * - Left accent bar on hover
 * - Colored status badges
 * - Consistent empty/loading states
 * 
 * IMPORTANT: These components use only our design system CSS variables
 * (--text-primary, --bg-card, --border-subtle, etc.) and our indigo/cyan
 * color theme. Do NOT hardcode colors.
 */


import React, { ReactNode } from 'react';
import { LucideIcon, Bot } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================================
// EvaluatorPageHeader
// Reference pattern: AdminDashboard, LogsScreen, ReportScreen
// eyebrow (icon + mono label) + bold h1 + subtitle + right actions
// ============================================================
interface EvaluatorPageHeaderProps {
  eyebrowIcon?: LucideIcon;
  eyebrowText: string;
  title: string;
  subtitle?: string;
  rightContent?: ReactNode;
  className?: string;
}

export function EvaluatorPageHeader({
  eyebrowIcon: Icon,
  eyebrowText,
  title,
  subtitle,
  rightContent,
  className = '',
}: EvaluatorPageHeaderProps) {
  return (
    <div className={`flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-6 ${className}`}>
      <div>
        <div className="flex items-center gap-2 text-xs font-mono text-indigo-400 font-bold uppercase tracking-wider mb-1.5">
          {Icon && <Icon size={14} />}
          <span>{eyebrowText}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-[var(--text-primary)] leading-tight">
          {title}
        </h1>
        {subtitle && (
          <p className="text-sm text-[var(--text-secondary)] mt-1 leading-relaxed max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
      {rightContent && (
        <div className="flex items-center gap-2 shrink-0">
          {rightContent}
        </div>
      )}
    </div>
  );
}

// ============================================================
// EvaluatorStepHeader
// Reference pattern: UploadScreen "Step 01 — MCQ Ingestion", ReportScreen "Step 03 — Final Assessment"
// ============================================================
interface EvaluatorStepHeaderProps {
  step: string;        // e.g. "Step 01 — MCQ Ingestion"
  title: string;       // e.g. "Drop in your assessment."
  description?: string;
  className?: string;
}

export function EvaluatorStepHeader({
  step,
  title,
  description,
  className = '',
}: EvaluatorStepHeaderProps) {
  return (
    <div className={`mb-8 ${className}`}>
      <span className="font-mono text-indigo-400 text-sm tracking-widest uppercase mb-2 block font-bold">
        {step}
      </span>
      <h1 className="text-3xl sm:text-4xl font-black text-[var(--text-primary)] leading-tight mb-2">
        {title}
      </h1>
      {description && (
        <p className="text-[var(--text-secondary)] text-base max-w-lg leading-relaxed">
          {description}
        </p>
      )}
    </div>
  );
}

// ============================================================
// EvaluatorStatCard
// Reference pattern: AdminDashboard KPI cards
// ============================================================
interface EvaluatorStatCardProps {
  label: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  iconColorClass?: string;   // e.g. "text-indigo-400"
  iconBgClass?: string;      // e.g. "bg-indigo-500/10"
  valueColorClass?: string;  // e.g. "text-cyan-400"
  className?: string;
}

export function EvaluatorStatCard({
  label,
  value,
  description,
  icon: Icon,
  iconColorClass = 'text-indigo-400',
  iconBgClass = 'bg-indigo-500/10',
  valueColorClass = 'text-[var(--text-primary)]',
  className = '',
}: EvaluatorStatCardProps) {
  return (
    <div className={`group relative p-5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-2 overflow-hidden transition-all duration-200 hover:border-indigo-500/30 hover:shadow-md ${className}`}>
      {/* Subtle left accent on hover */}
      <div className="absolute left-0 top-0 w-0.5 h-full bg-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] uppercase tracking-wider">
          {label}
        </span>
        <div className={`p-2 rounded-xl ${iconBgClass} ${iconColorClass}`}>
          <Icon size={15} />
        </div>
      </div>
      <p className={`text-2xl font-black font-mono ${valueColorClass}`}>{value}</p>
      {description && (
        <p className="text-[11px] text-[var(--text-muted)] font-mono">{description}</p>
      )}
    </div>
  );
}

// ============================================================
// EvaluatorStatusBadge
// Reference pattern: AdminDashboard status labels
// ============================================================
type SessionStatus = 'Completed' | 'In Progress' | 'Terminated';

const statusConfig: Record<SessionStatus, string> = {
  'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  'In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/30 animate-pulse',
  'Terminated': 'bg-rose-500/10 text-rose-400 border-rose-500/30',
};

interface EvaluatorStatusBadgeProps {
  status: SessionStatus | string;
  className?: string;
}

export function EvaluatorStatusBadge({ status, className = '' }: EvaluatorStatusBadgeProps) {
  const colorClass = statusConfig[status as SessionStatus] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-mono font-bold ${colorClass} ${className}`}>
      {status}
    </span>
  );
}

// ============================================================
// EvaluatorUnderstandingBadge
// Reference pattern: ReportScreen understanding level
// ============================================================
type UnderstandingLevel = 'strong' | 'moderate' | 'weak' | string;

export function EvaluatorUnderstandingBadge({ level, className = '' }: { level: UnderstandingLevel; className?: string }) {
  const colorClass =
    level === 'strong'   ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
    level === 'moderate' ? 'text-amber-400 border-amber-500/30 bg-amber-500/10' :
    level === 'weak'     ? 'text-rose-400 border-rose-500/30 bg-rose-500/10' :
                           'text-slate-400 border-slate-500/30 bg-slate-500/10';

  return (
    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border ${colorClass} ${className}`}>
      {level.replace(/_/g, ' ')}
    </span>
  );
}

// ============================================================
// EvaluatorBeliefBadge
// Reference pattern: DiagnosticReportPage belief state
// ============================================================
type BeliefLevel = 'Unknown' | 'Emerging' | 'Partial' | 'Strong' | 'Mastered' | string;

const beliefConfig: Record<string, string> = {
  Unknown:  'border-slate-500/30 bg-slate-500/10 text-slate-400',
  Emerging: 'border-rose-500/30 bg-rose-500/10 text-rose-400',
  Partial:  'border-amber-500/30 bg-amber-500/10 text-amber-400',
  Strong:   'border-cyan-500/30 bg-cyan-500/10 text-cyan-400',
  Mastered: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400',
};

export function EvaluatorBeliefBadge({ level, className = '' }: { level: BeliefLevel; className?: string }) {
  const colorClass = beliefConfig[level] || beliefConfig['Unknown'];
  return (
    <span className={`px-2.5 py-0.5 rounded-full border text-[10px] font-mono font-bold ${colorClass} ${className}`}>
      {level}
    </span>
  );
}

// ============================================================
// EvaluatorCard
// Reference pattern: bg-surface/5 border border-surface/10 rounded-2xl
// Translucent card with optional left accent bar on hover
// ============================================================
interface EvaluatorCardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  accentOnHover?: boolean;
  accentColor?: string; // tailwind class e.g. "bg-indigo-400"
}

export function EvaluatorCard({
  children,
  className = '',
  onClick,
  accentOnHover = false,
  accentColor = 'bg-indigo-400',
}: EvaluatorCardProps) {
  return (
    <div
      onClick={onClick}
      className={`group relative p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm overflow-hidden transition-all duration-200 hover:border-[var(--border-strong)] hover:shadow-md ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {accentOnHover && (
        <div className={`absolute left-0 top-0 w-1 h-full ${accentColor} opacity-0 group-hover:opacity-100 transition-opacity duration-200`} />
      )}
      {children}
    </div>
  );
}

// ============================================================
// EvaluatorSectionCard
// Reference pattern: Section with title + icon + content
// ============================================================
interface EvaluatorSectionCardProps {
  title: string;
  icon?: LucideIcon;
  iconClass?: string;
  children: ReactNode;
  className?: string;
  rightContent?: ReactNode;
}

export function EvaluatorSectionCard({
  title,
  icon: Icon,
  iconClass = 'text-indigo-400',
  children,
  className = '',
  rightContent,
}: EvaluatorSectionCardProps) {
  return (
    <div className={`p-6 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-sm space-y-4 ${className}`}>
      <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-3">
        <h3 className="font-bold text-base text-[var(--text-primary)] flex items-center gap-2">
          {Icon && <Icon size={18} className={iconClass} />}
          {title}
        </h3>
        {rightContent}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// EvaluatorEmptyState
// Reference pattern: AdminDashboard, LogsScreen empty text
// ============================================================
interface EvaluatorEmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function EvaluatorEmptyState({
  icon: Icon = Bot,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
}: EvaluatorEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center py-16 text-center space-y-4 ${className}`}>
      <div className="p-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400">
        <Icon size={32} />
      </div>
      {title && (
        <h3 className="text-base font-bold text-[var(--text-primary)]">{title}</h3>
      )}
      <p className="text-sm text-[var(--text-muted)] italic max-w-sm">{description}</p>
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-2 px-5 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-md"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ============================================================
// EvaluatorLoadingScreen
// Reference pattern: All screens — spinner + pulsing mono text
// ============================================================
export function EvaluatorLoadingScreen({ label = 'Loading...' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-5">
      <div className="relative">
        <div className="w-14 h-14 rounded-full border-4 border-indigo-500/20 border-t-indigo-400 animate-spin" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-indigo-500/20 animate-pulse" />
        </div>
      </div>
      <p className="text-sm font-mono text-[var(--text-muted)] animate-pulse">{label}</p>
    </div>
  );
}

// ============================================================
// EvaluatorBackButton
// Reference pattern: AdminInterviewDetail, LogsScreen
// ============================================================
interface EvaluatorBackButtonProps {
  onClick: () => void;
  label?: string;
  className?: string;
}

export function EvaluatorBackButton({ onClick, label = 'Back', className = '' }: EvaluatorBackButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-indigo-400 transition-colors group ${className}`}
    >
      <svg
        className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 12H5m7-7l-7 7 7 7" />
      </svg>
      {label}
    </button>
  );
}

// ============================================================
// EvaluatorInterviewerTile
// Reference pattern: InterviewerTile with concentric rings + audio controls
// ============================================================
interface EvaluatorInterviewerTileProps {
  questionText?: string;
  isTransitioning?: boolean;
  isPlaying?: boolean;
  onTogglePlay?: () => void;
  onReplay?: () => void;
  avatarContent?: ReactNode;
}

export function EvaluatorInterviewerTile({
  questionText,
  isTransitioning = false,
  isPlaying = false,
  onTogglePlay,
  onReplay,
  avatarContent,
}: EvaluatorInterviewerTileProps) {
  return (
    <div
      className={`w-full h-64 sm:h-80 md:h-[400px] bg-[var(--bg-card)] border border-[var(--border-subtle)] rounded-2xl relative overflow-hidden flex flex-col justify-end p-8 transition-all duration-500 shadow-md ${
        isTransitioning ? 'opacity-50 scale-95' : 'opacity-100 scale-100'
      }`}
    >
      {/* Concentric animated rings — centered */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center opacity-40 pointer-events-none">
        <div
          className={`w-48 h-48 rounded-full border border-indigo-400/20 absolute evaluator-ring-outer ${isPlaying ? 'animate-ping' : ''}`}
        />
        <div
          className={`w-32 h-32 rounded-full border border-indigo-400/40 absolute evaluator-ring-middle ${isPlaying ? 'animate-ping' : ''}`}
        />
        <div
          className={`w-16 h-16 rounded-full border border-indigo-400/60 absolute evaluator-ring-inner ${isPlaying ? 'animate-ping' : ''}`}
        />
        <div
          className={`w-8 h-8 rounded-full bg-indigo-400/80 shadow-[0_0_20px_rgba(99,102,241,0.6)] ${isPlaying ? 'shadow-[0_0_30px_rgba(99,102,241,0.9)]' : ''}`}
        />
      </div>

      {/* Audio controls overlay — top right */}
      {!isTransitioning && (onTogglePlay || onReplay) && (
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2 bg-[var(--bg-primary)]/60 backdrop-blur-sm p-1.5 rounded-full border border-[var(--border-subtle)]">
          {onTogglePlay && (
            <button
              onClick={onTogglePlay}
              className="p-2 rounded-full hover:bg-indigo-500/20 text-[var(--text-secondary)] hover:text-indigo-300 transition-colors"
              title={isPlaying ? 'Pause Audio' : 'Play Audio'}
            >
              {isPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>
              ) : (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
              )}
            </button>
          )}
          {onReplay && (
            <>
              <div className="w-px h-4 bg-[var(--border-subtle)]" />
              <button
                onClick={onReplay}
                className="p-2 rounded-full hover:bg-indigo-500/20 text-[var(--text-secondary)] hover:text-indigo-300 transition-colors"
                title="Replay Audio"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}

      {/* Question content or loading */}
      <div className="relative z-10 max-w-3xl w-full h-full flex flex-col">
        {isTransitioning ? (
          <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-[var(--text-muted)]">
            <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-400 animate-spin rounded-full" />
            <span className="text-base font-medium font-mono animate-pulse">Generating Question...</span>
          </div>
        ) : (
          <div className="mt-auto w-full max-h-full overflow-y-auto pr-2 custom-scrollbar">
            {avatarContent || (
              <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] leading-snug drop-shadow-lg">
                {questionText}
              </h2>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// EvaluatorActionFooter
// Reference pattern: UploadScreen CTA strip
// ============================================================
interface EvaluatorActionFooterProps {
  leftContent: ReactNode;
  rightContent: ReactNode;
  className?: string;
}

export function EvaluatorActionFooter({ leftContent, rightContent, className = '' }: EvaluatorActionFooterProps) {
  return (
    <div className={`flex flex-col sm:flex-row items-center justify-between p-6 rounded-2xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/60 via-[var(--bg-card)] to-indigo-950/60 backdrop-blur-xl shadow-xl gap-4 ${className}`}>
      <div className="flex items-center gap-3">{leftContent}</div>
      <div className="w-full sm:w-auto flex justify-end">{rightContent}</div>
    </div>
  );
}

// ============================================================
// EvaluatorAccordionRow
// Reference pattern: LogsScreen expandable rows
// ============================================================
interface EvaluatorAccordionRowProps {
  isOpen: boolean;
  onToggle: () => void;
  headerContent: ReactNode;
  bodyContent: ReactNode;
  className?: string;
}

export function EvaluatorAccordionRow({
  isOpen,
  onToggle,
  headerContent,
  bodyContent,
  className = '',
}: EvaluatorAccordionRowProps) {
  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden transition-all hover:border-indigo-500/30 ${className}`}>
      <div
        className="p-4 sm:p-5 flex items-center justify-between cursor-pointer hover:bg-[var(--bg-hover)] transition-colors"
        onClick={onToggle}
      >
        <div className="flex-1 min-w-0">{headerContent}</div>
        <div className="ml-4 text-[var(--text-muted)] shrink-0">
          <svg
            className={`w-5 h-5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="border-t border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 overflow-hidden"
          >
            <div className="p-4 sm:p-6 space-y-6">{bodyContent}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================
// EvaluatorTimelineTurn
// Reference pattern: AdminInterviewDetail interaction cards
// ============================================================
interface EvaluatorTimelineTurnProps {
  turnNumber: number;
  children: ReactNode;
  className?: string;
}

export function EvaluatorTimelineTurn({ turnNumber, children, className = '' }: EvaluatorTimelineTurnProps) {
  return (
    <div className={`relative z-10 space-y-4 pl-12 ${className}`}>
      {/* Turn number dot */}
      <div className="absolute left-3.5 top-0 -translate-x-1/2 flex h-7 w-7 items-center justify-center rounded-full border-2 border-indigo-500 bg-[var(--bg-primary)] font-mono text-[10px] font-bold text-indigo-300 shadow-[0_0_12px_rgba(99,102,241,0.4)]">
        {turnNumber}
      </div>
      {children}
    </div>
  );
}

// ============================================================
// EvaluatorProgressBar
// Reference pattern: InterviewScreen progress bar
// ============================================================
interface EvaluatorProgressBarProps {
  current: number;
  total: number;
  className?: string;
}

export function EvaluatorProgressBar({ current, total, className = '' }: EvaluatorProgressBarProps) {
  const percent = Math.min((current / total) * 100, 100);
  return (
    <div className={`w-full h-1.5 bg-[var(--border-subtle)] rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-gradient-to-r from-indigo-500 to-cyan-400 rounded-full transition-all duration-500 ease-in-out"
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

// ============================================================
// EvaluatorMetricPill
// Reference pattern: Token counts, latency chips inline
// ============================================================
interface EvaluatorMetricPillProps {
  label: string;
  value: string | number;
  colorClass?: string;
  className?: string;
}

export function EvaluatorMetricPill({ label, value, colorClass = 'text-[var(--text-muted)]', className = '' }: EvaluatorMetricPillProps) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <span className="text-[10px] font-mono text-[var(--text-muted)] uppercase tracking-wider mb-0.5">{label}</span>
      <span className={`text-sm font-mono font-bold ${colorClass}`}>{value}</span>
    </div>
  );
}
