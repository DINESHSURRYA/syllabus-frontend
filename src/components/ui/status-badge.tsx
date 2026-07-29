import './styles/status-badge.css';
import React from 'react';
import { Clock3 } from 'lucide-react';

interface DifficultyBadgeProps {
  level?: string;
}

export function DifficultyBadge({ level }: DifficultyBadgeProps) {
  if (!level) return null;
  const normalized = String(level).toLowerCase();

  if (normalized.includes('intro') || normalized.includes('begin')) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-950 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800/60">
        Introductory
      </span>
    );
  }

  if (normalized.includes('intermed')) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-indigo-100 dark:bg-indigo-950/80 text-indigo-950 dark:text-indigo-200 border border-indigo-300 dark:border-indigo-700">
        Intermediate
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-purple-100 dark:bg-purple-950/60 text-purple-950 dark:text-purple-300 border border-purple-300 dark:border-purple-800/60">
      {normalized.includes('advan') ? 'Advanced' : level}
    </span>
  );
}

interface ImportanceBadgeProps {
  importance?: string;
}

export function ImportanceBadge({ importance }: ImportanceBadgeProps) {
  if (!importance) return null;
  const norm = String(importance).toLowerCase();

  if (norm.includes('high')) {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-indigo-100 dark:bg-indigo-950/60 text-indigo-950 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-800/60">
        High Priority
      </span>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-mono font-semibold bg-slate-100 dark:bg-slate-800/60 text-slate-900 dark:text-slate-300 border border-slate-300 dark:border-slate-700">
      {importance}
    </span>
  );
}

export function HoursBadge({ hours }: { hours?: number | string }) {
  if (hours === undefined || hours === null || hours === '') return null;
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-[var(--bg-hover)] text-[var(--text-secondary)] border border-[var(--border-subtle)]">
      <Clock3 size={12} className="text-[var(--text-accent)]" />
      {hours}h
    </span>
  );
}

