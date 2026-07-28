"use client";

import { motion } from 'framer-motion';
import { BadgeCheck, Sparkles } from 'lucide-react';

interface TopicCardProps {
  title: string;
  description: string;
  confidence: number;
  pedagogies: Array<{ name?: string; reason?: string; confidence?: number }>;
}

export function TopicCard({ title, description, confidence, pedagogies }: TopicCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="semantic-card rounded-[24px] p-5 backdrop-blur-xl"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-[var(--bg-hover)] text-[var(--text-accent)] border border-[var(--border-subtle)]">
            <Sparkles size={12} /> TOPIC RECOMMENDATION
          </span>
          <h4 className="mt-2 text-xl font-bold text-[var(--text-primary)]">{title}</h4>
        </div>
        <div className="rounded-full border border-[var(--border-subtle)] bg-[var(--bg-subtle)] px-3 py-1 text-xs font-mono font-semibold text-[var(--text-secondary)]">
          {confidence}% confidence
        </div>
      </div>
      <p className="mt-2 text-xs text-[var(--text-secondary)] leading-relaxed">{description}</p>

      <div className="mt-4 grid gap-3 md:grid-cols-3">
        {pedagogies.map((pedagogy, idx) => {
          const pedConf = pedagogy.confidence ?? 80;
          return (
            <div
              key={pedagogy.name || idx}
              className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-3.5 shadow-sm hover:border-[var(--border-strong)] transition-colors"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold text-[var(--text-primary)]">{pedagogy.name || 'Pedagogy'}</p>
                <BadgeCheck
                  size={16}
                  className={
                    pedConf >= 95
                      ? 'text-emerald-500'
                      : pedConf >= 80
                      ? 'text-indigo-600'
                      : 'text-amber-500'
                  }
                />
              </div>
              <p className="mt-1.5 text-xs text-[var(--text-muted)] leading-relaxed">{pedagogy.reason || ''}</p>
              <div className="mt-3 h-2 rounded-full bg-[var(--bg-muted)] overflow-hidden">
                <div
                  className={`h-2 rounded-full ${
                    pedConf >= 95
                      ? 'bg-emerald-500'
                      : pedConf >= 80
                      ? 'bg-indigo-600'
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${pedConf}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
