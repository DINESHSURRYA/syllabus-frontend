"use client";

import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  FileText,
  Sparkles,
  Code,
  Boxes,
  ShieldCheck,
  CheckCircle2,
  Check,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export interface Phase1ExtractionStep {
  id: number;
  statusCode: string;
  label: string;
  icon: React.ElementType;
  logTemplate: string;
}

export const EXTRACTION_STEPS: Phase1ExtractionStep[] = [
  {
    id: 1,
    statusCode: 'UPLOADING',
    label: 'Uploading',
    icon: Upload,
    logTemplate: '[1/7] File uploaded successfully.',
  },
  {
    id: 2,
    statusCode: 'READING_PDF',
    label: 'Reading PDF',
    icon: FileText,
    logTemplate: '[2/7] Extracting PDF layout and page text with PyMuPDF ...',
  },
  {
    id: 3,
    statusCode: 'GPT_ANALYSIS',
    label: 'GPT Analysis',
    icon: Sparkles,
    logTemplate: '[3/7] Running GPT analysis on extracted document content ...',
  },
  {
    id: 4,
    statusCode: 'PARSING_DATA',
    label: 'Parsing Data',
    icon: Code,
    logTemplate: '[4/7] Parsing course metadata, units, and topic hierarchies ...',
  },
  {
    id: 5,
    statusCode: 'BUILDING_JSON',
    label: 'Building JSON',
    icon: Boxes,
    logTemplate: '[5/7] Building structured JSON DAG schema and credit allocations ...',
  },
  {
    id: 6,
    statusCode: 'VALIDATION',
    label: 'Validation',
    icon: ShieldCheck,
    logTemplate: '[6/7] Validating course outcomes, prerequisites, and pedagogical rules ...',
  },
  {
    id: 7,
    statusCode: 'COMPLETED',
    label: 'Completed',
    icon: CheckCircle2,
    logTemplate: '[7/7] Syllabus extraction and validation completed successfully!',
  },
];

interface Phase1ExtractionProgressProps {
  fileName?: string;
  currentStep: number; // 1 to 7
  progress: number; // 0 to 100
  statusText?: string;
  statusCode?: string;
  customLogs?: string[];
  error?: string | null;
  onRetry?: () => void;
  onCancel?: () => void;
}

export function Phase1ExtractionProgress({
  fileName = 'BE3251.pdf',
  currentStep = 1,
  progress = 0,
  statusText,
  statusCode,
  customLogs,
  error,
  onRetry,
  onCancel,
}: Phase1ExtractionProgressProps) {
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Normalize step bounds
  const activeStep = Math.min(7, Math.max(1, currentStep));
  const activeStepObj = EXTRACTION_STEPS[activeStep - 1] || EXTRACTION_STEPS[0];
  const displayStatusCode = statusCode || activeStepObj.statusCode;
  const isCompleted = activeStep === 7 && progress >= 100;

  // Auto-generate logs up to current step if custom logs not provided
  const logsToDisplay =
    customLogs && customLogs.length > 0
      ? customLogs
      : EXTRACTION_STEPS.slice(0, activeStep).map((s) => s.logTemplate);

  // Auto-scroll logs container to bottom on new log entry
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = logContainerRef.current.scrollHeight;
    }
  }, [logsToDisplay]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      className="relative overflow-hidden rounded-[28px] border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 p-6 sm:p-8 shadow-xl text-slate-900 dark:text-white"
    >
      {/* Top Header Row */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Extraction Job: <span className="text-slate-800 dark:text-slate-100">{fileName}</span>
          </h2>
          <p className="mt-1 font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400 uppercase tracking-wide flex items-center gap-2">
            Status: <span>{displayStatusCode}</span>
          </p>
        </div>

        <div className="text-right font-mono">
          <span className="text-4xl sm:text-5xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {Math.round(progress)}%
          </span>
        </div>
      </div>

      {/* Progress Bar Track */}
      <div className="relative w-full h-3.5 bg-slate-100 dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700/60 p-0.5 overflow-hidden mb-6">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 shadow-md shadow-indigo-500/20"
          initial={{ width: '0%' }}
          animate={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>

      {/* 7 Step Options Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mb-6">
        {EXTRACTION_STEPS.map((stepItem) => {
          const StepIcon = stepItem.icon;
          const isStepDone = stepItem.id < activeStep || isCompleted;
          const isStepCurrent = stepItem.id === activeStep && !isCompleted;

          return (
            <div
              key={stepItem.id}
              className={`rounded-2xl border px-3 py-2.5 transition-all flex items-center justify-center gap-2 text-xs font-medium text-center ${
                isStepCurrent
                  ? 'border-2 border-indigo-500 dark:border-indigo-400 bg-indigo-50/90 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 font-bold shadow-md shadow-indigo-500/10 ring-2 ring-indigo-500/20'
                  : isStepDone
                  ? 'border-emerald-300 dark:border-emerald-500/40 bg-emerald-50/70 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-slate-400 dark:text-slate-500 opacity-60'
              }`}
            >
              {isStepDone ? (
                <Check className="h-4 w-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              ) : (
                <StepIcon
                  className={`h-4 w-4 shrink-0 ${
                    isStepCurrent
                      ? 'text-indigo-600 dark:text-indigo-300 animate-bounce'
                      : 'text-slate-400 dark:text-slate-500'
                  }`}
                />
              )}
              <span className="truncate">{stepItem.label}</span>
            </div>
          );
        })}
      </div>

      {/* Error Message Card */}
      {error && (
        <div className="mb-6 rounded-2xl border border-rose-300 dark:border-rose-500/40 bg-rose-50 dark:bg-rose-950/40 p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <XCircle className="h-6 w-6 text-rose-600 dark:text-rose-400 shrink-0" />
            <p className="text-sm text-rose-800 dark:text-rose-200 font-medium">{error}</p>
          </div>
          {onRetry && (
            <Button size="sm" onClick={onRetry} className="bg-rose-600 hover:bg-rose-500 text-white shrink-0">
              <RefreshCw className="mr-1.5 h-3.5 w-3.5" /> Retry
            </Button>
          )}
        </div>
      )}

      {/* Live Extraction Logs Terminal Card */}
      <div className="rounded-2xl bg-[#0a0f1d] dark:bg-[#070a14] border border-slate-800 p-5 shadow-inner">
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3 mb-3">
          <span className="font-mono text-xs font-bold tracking-wider text-slate-400 uppercase">
            LIVE EXTRACTION LOGS
          </span>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full ${
                  isCompleted ? 'bg-emerald-400 opacity-75' : 'bg-cyan-400 opacity-75'
                }`}
              />
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isCompleted ? 'bg-emerald-500' : 'bg-cyan-500'
                }`}
              />
            </span>
            <span className="font-mono text-xs font-semibold text-cyan-400">
              {isCompleted ? 'Completed' : 'Streaming'}
            </span>
          </div>
        </div>

        <div
          ref={logContainerRef}
          className="font-mono text-xs sm:text-sm leading-relaxed text-slate-200 max-h-44 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-slate-800"
        >
          {logsToDisplay.map((logLine, idx) => {
            const isLast = idx === logsToDisplay.length - 1;
            return (
              <div key={idx} className="flex items-start gap-2">
                <span className="text-indigo-400 font-bold select-none">&gt;</span>
                <span
                  className={
                    isLast && !isCompleted
                      ? 'text-cyan-300 font-semibold animate-pulse'
                      : 'text-slate-300'
                  }
                >
                  {logLine}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}
