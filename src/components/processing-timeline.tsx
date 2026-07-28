"use client";

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, RefreshCw, Sparkles, XCircle } from 'lucide-react';
import { STAGE_2_STATUS_MESSAGES } from '@/lib/constants';
import { Button } from '@/components/ui/button';

interface ProcessingTimelineProps {
  progress: number;
  currentStageIndex: number;
  status: 'idle' | 'connecting' | 'processing' | 'error' | 'timeout' | 'completed';
  errorMessage?: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function ProcessingTimeline({
  progress,
  currentStageIndex,
  status,
  errorMessage,
  onRetry,
  onCancel,
}: ProcessingTimelineProps) {
  const currentMessage =
    STAGE_2_STATUS_MESSAGES[currentStageIndex] || STAGE_2_STATUS_MESSAGES[STAGE_2_STATUS_MESSAGES.length - 1];

  return (
    <div className="relative overflow-hidden rounded-[30px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-brand-500/10 p-6 shadow-xl">
      {/* Floating particles animation */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {[...Array(12)].map((_, idx) => (
          <motion.span
            key={idx}
            animate={{ y: [0, -25, 0], opacity: [0.2, 0.7, 0.2] }}
            transition={{ duration: 5 + idx, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute h-2 w-2 rounded-full bg-brand-400"
            style={{ left: `${8 + idx * 7.5}%`, top: `${10 + (idx % 4) * 20}%` }}
          />
        ))}
      </div>

      <div className="relative space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-brand-600 dark:text-brand-300">Stage 2 AI Processing Engine</p>
            <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">Extracted Syllabus Ingestion</h3>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-indigo-200 dark:border-brand-500/30 bg-indigo-50 dark:bg-brand-500/10 px-4 py-1.5 text-sm font-medium text-indigo-700 dark:text-brand-300">
            <Sparkles size={16} className="animate-spin text-indigo-600 dark:text-brand-300" />
            {status === 'error'
              ? 'Server Error'
              : status === 'timeout'
              ? 'Timeout Delay'
              : status === 'completed'
              ? 'JSON Generated'
              : 'Live AI Ingestion'}
          </div>
        </div>

        {/* Progress Card */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/80 p-5 shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500 dark:text-slate-400 font-mono font-semibold">Current Status</p>
              <p className="mt-1 text-lg font-medium text-slate-900 dark:text-slate-100">{currentMessage}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-mono font-semibold">Progress</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white">{Math.round(progress)}%</p>
            </div>
          </div>
          <div className="mt-4 h-3 rounded-full bg-slate-200 dark:bg-slate-900 p-0.5 border border-slate-300 dark:border-slate-800">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: 'easeOut', duration: 0.3 }}
              className="h-full rounded-full bg-gradient-to-r from-brand-500 via-indigo-500 to-cyan-400 shadow-lg shadow-brand-500/20"
            />
          </div>
        </div>

        {/* Error Handling Card: Backend Unavailable */}
        {status === 'error' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 p-6 backdrop-blur shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-rose-100 dark:bg-rose-500/20 p-3 text-rose-600 dark:text-rose-400">
                <XCircle size={28} />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-rose-900 dark:text-rose-200">Unable to connect to Processing Server</h4>
                <p className="mt-1 text-sm text-rose-700 dark:text-rose-300/80">
                  {errorMessage || 'The backend processing server at ip.txt (http://172.16.157.5:8080) is currently unavailable or unreachable.'}
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button onClick={onRetry} className="bg-rose-600 hover:bg-rose-500 text-white">
                    <RefreshCw className="mr-2" size={16} /> Retry
                  </Button>
                  <Button variant="outline" onClick={onCancel} className="border-rose-300 dark:border-rose-500/40 text-rose-700 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-950/60">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Timeout Card: Long Response */}
        {status === 'timeout' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-2xl border border-amber-300 dark:border-amber-500/40 bg-amber-50 dark:bg-amber-950/40 p-6 backdrop-blur shadow-sm"
          >
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-amber-100 dark:bg-amber-500/20 p-3 text-amber-600 dark:text-amber-400">
                <AlertTriangle size={28} />
              </div>
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-amber-900 dark:text-amber-200">Processing is taking longer than expected. Please wait...</h4>
                <p className="mt-1 text-sm text-amber-700 dark:text-amber-300/80">
                  AI analysis of large syllabus documents with deep unit/topic hierarchies can take up to 30 seconds. Automatically retrying...
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button onClick={onRetry} className="bg-amber-600 hover:bg-amber-500 text-white">
                    <RefreshCw className="mr-2" size={16} /> Force Retry
                  </Button>
                  <Button variant="outline" onClick={onCancel} className="border-amber-300 dark:border-amber-500/40 text-amber-700 dark:text-amber-300 hover:bg-amber-100 dark:hover:bg-amber-950/60">
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Stages Grid */}
        <div className="grid gap-3 md:grid-cols-2">
          {STAGE_2_STATUS_MESSAGES.map((msg, index) => {
            const isCompleted = index < currentStageIndex;
            const isCurrent = index === currentStageIndex && status !== 'error';
            return (
              <motion.div
                key={msg}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04 }}
                className={`rounded-2xl border p-4 transition-all ${
                  isCompleted
                    ? 'border-emerald-300 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 font-semibold'
                    : isCurrent
                    ? 'border-brand-500/40 bg-brand-50 dark:bg-brand-500/15 text-slate-900 dark:text-white font-semibold shadow-md shadow-brand-500/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-950/60 text-slate-500 dark:text-slate-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">{msg}</p>
                  {isCompleted ? (
                    <CheckCircle2 className="text-emerald-600 dark:text-emerald-400" size={18} />
                  ) : isCurrent ? (
                    <Sparkles className="animate-spin text-brand-500 dark:text-brand-300" size={18} />
                  ) : (
                    <span className="text-xs text-slate-400 dark:text-slate-600">Pending</span>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
