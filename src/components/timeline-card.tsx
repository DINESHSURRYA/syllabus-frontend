"use client";

import { motion } from 'framer-motion';
import { Clock3, BookOpen } from 'lucide-react';

export interface HourlySessionView {
  hour_number: number;
  duration?: string;
  topics_covered: string[];
  bloom_level: string;
  pedagogy: string;
  reasoning?: string;
}

export interface TimelineCardProps {
  unit: string;
  topic: string;
  hours?: string;
  sessions?: HourlySessionView[];
  subtopics?: Array<{
    title: string;
    duration: string;
    pedagogy: string;
    bloom: string;
    reasoning?: string;
    topics_covered?: string[];
  }>;
}

export function TimelineCard({ unit, topic, hours, sessions, subtopics }: TimelineCardProps) {
  // Normalize sessions vs subtopics
  const sessionList: HourlySessionView[] = (sessions && sessions.length > 0)
    ? sessions
    : (subtopics || []).map((sub, idx) => ({
        hour_number: idx + 1,
        duration: '60 mins',
        topics_covered: sub.topics_covered && sub.topics_covered.length > 0 ? sub.topics_covered : [sub.title],
        bloom_level: sub.bloom,
        pedagogy: sub.pedagogy,
        reasoning: sub.reasoning || ''
      }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-[24px] border dark:border-white/10 border-slate-200 dark:bg-slate-900 bg-white p-5 backdrop-blur-2xl shadow-sm hover:shadow-md hover:border-indigo-300 transition-all space-y-4"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono font-bold dark:text-indigo-400 text-indigo-700 uppercase">{unit}</p>
          <h4 className="mt-1 text-xl font-bold dark:text-slate-100 text-slate-900">{topic}</h4>
        </div>
        <div className="flex items-center gap-2">
          {hours && (
            <span className="text-xs font-mono dark:text-cyan-300 dark:bg-cyan-950/60 dark:border-cyan-500/40 bg-sky-100 text-sky-900 border border-sky-300 px-2.5 py-1 rounded-full font-bold">
              {hours} Hours Total
            </span>
          )}
          <div className="rounded-full border dark:border-indigo-500/40 border-indigo-300 dark:bg-indigo-950/80 bg-indigo-100 px-3 py-1 text-xs font-mono font-bold dark:text-indigo-200 text-indigo-950">
            1-Hour Session Engine
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {sessionList.map((session) => (
          <div
            key={session.hour_number}
            className="rounded-2xl border dark:border-white/10 border-slate-200 dark:bg-slate-800/60 bg-slate-50/80 p-4 shadow-sm hover:border-indigo-400 transition-all space-y-3"
          >
            {/* Header: Period X (60 mins) */}
            <div className="flex items-center justify-between border-b dark:border-white/5 border-slate-200/80 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white font-mono text-xs font-black">
                  H{session.hour_number}
                </div>
                <span className="text-sm font-black dark:text-slate-100 text-slate-900">
                  Period {session.hour_number}
                </span>
              </div>

              {/* Strict 60 mins pill */}
              <div className="flex items-center gap-1.5 rounded-full border border-sky-300 dark:border-cyan-500/40 bg-sky-100 dark:bg-cyan-950/60 px-3 py-1 text-xs font-mono font-bold text-sky-900 dark:text-cyan-300">
                <Clock3 size={13} className="text-sky-700 dark:text-cyan-400" />
                <span>60 mins</span>
              </div>
            </div>

            {/* Bundled Topics Covered */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-mono font-bold uppercase dark:text-slate-400 text-slate-500 tracking-wider flex items-center gap-1.5">
                <BookOpen size={13} className="text-indigo-400" /> Topics Covered in this 1-Hour Slot:
              </p>
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {session.topics_covered.map((t, tIdx) => (
                  <span
                    key={tIdx}
                    className="rounded-xl border dark:border-white/10 border-slate-300 dark:bg-slate-900 bg-white px-3 py-1.5 text-xs font-semibold dark:text-slate-200 text-slate-800 shadow-2xs"
                  >
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* Metadata & Rationale */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1">
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="rounded-full border dark:border-white/10 border-slate-300 dark:bg-slate-900 bg-white px-2.5 py-1 font-semibold dark:text-slate-300 text-slate-800">
                  Pedagogy: {session.pedagogy}
                </span>
                <span className="rounded-full border dark:border-indigo-500/40 border-indigo-300 dark:bg-indigo-950/80 bg-indigo-100 px-2.5 py-1 dark:text-indigo-200 text-indigo-950 font-bold">
                  Bloom: {session.bloom_level}
                </span>
              </div>

              {session.reasoning && (
                <p className="text-[11px] font-sans text-slate-400 italic leading-relaxed sm:max-w-xs">
                  "{session.reasoning}"
                </p>
              )}
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
