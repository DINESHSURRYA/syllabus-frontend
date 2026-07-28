"use client";

import React from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, X, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { useSyllabusStore } from '@/lib/store';

export function ExtractionNotificationPopup() {
  const { activeNotification, clearNotification, isBackgroundProcessing } = useSyllabusStore();

  if (!activeNotification && !isBackgroundProcessing) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-md w-full px-4 pointer-events-auto">
      <AnimatePresence>
        {isBackgroundProcessing && !activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="flex items-center gap-3.5 rounded-2xl border border-indigo-500/40 bg-slate-950/90 p-4 text-white shadow-xl backdrop-blur-xl"
          >
            <div className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 p-2 text-indigo-400">
              <Loader2 size={18} className="animate-spin" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                <p className="text-xs font-mono font-bold text-indigo-300 uppercase tracking-wider">Document Parser + AI Agent</p>
              </div>
              <p className="text-sm font-semibold text-white mt-0.5 truncate">Extracting Syllabus in background...</p>
              <p className="text-[11px] text-slate-400">You can continue navigating other pages freely.</p>
            </div>
            <Link
              href="/processing"
              className="rounded-xl border border-indigo-500/40 bg-indigo-600 px-3 py-1.5 text-xs font-mono font-bold text-white hover:bg-indigo-500 transition-all flex items-center gap-1 shrink-0 shadow-sm"
            >
              View <ArrowRight size={12} />
            </Link>
          </motion.div>
        )}

        {activeNotification && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="relative flex items-start gap-3.5 rounded-2xl border border-emerald-500/40 bg-slate-950/95 p-4 text-white shadow-[0_0_35px_rgba(16,185,129,0.3)] backdrop-blur-xl"
          >
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-400 shrink-0">
              <CheckCircle2 size={20} />
            </div>

            <div className="flex-1 min-w-0 pr-6">
              <div className="flex items-center gap-2">
                <Sparkles size={14} className="text-emerald-400" />
                <p className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-wider">
                  {activeNotification.title}
                </p>
              </div>
              <p className="text-sm font-medium text-slate-200 mt-1 leading-snug">
                {activeNotification.message}
              </p>
              {activeNotification.completedAt && (
                <p className="text-[10px] font-mono text-slate-400 mt-1">
                  Completed at {activeNotification.completedAt}
                </p>
              )}

              <div className="mt-3 flex items-center gap-2">
                <Link
                  href="/verification"
                  onClick={clearNotification}
                  className="rounded-xl border border-emerald-500/50 bg-emerald-500 text-black px-3.5 py-1.5 text-xs font-mono font-bold hover:bg-emerald-400 transition-all flex items-center gap-1.5 shadow-md"
                >
                  Verify Now <ArrowRight size={14} />
                </Link>
                <button
                  onClick={clearNotification}
                  className="rounded-xl border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-mono text-slate-300 hover:bg-slate-800 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </div>

            <button
              onClick={clearNotification}
              className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
