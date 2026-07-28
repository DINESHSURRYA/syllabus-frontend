"use client";

import { useEffect, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { ProcessingTimeline } from '@/components/processing-timeline';
import { Button } from '@/components/ui/button';
import { processSyllabus, getProcessingStatus } from '@/lib/api-client';
import { AI_PROCESSING_PROMPT, STAGE_2_STATUS_MESSAGES } from '@/lib/constants';
import { useSyllabusStore } from '@/lib/store';
import { normalizeBackendResponse } from '@/lib/normalizer';

export default function ProcessingPage() {
  const router = useRouter();
  const {
    extractedText,
    jobId,
    processingStatus,
    statusMessageIndex,
    errorMessage,
    setProcessingStatus,
    setStatusMessageIndex,
    setSyllabus,
    incrementRetryCount,
    retryCount,
    setActiveNotification,
    setBackgroundProcessing,
  } = useSyllabusStore();

  const [smoothPercent, setSmoothPercent] = useState<number>(5);

  const runStage2Processing = useCallback(async () => {
    setProcessingStatus('processing');
    setStatusMessageIndex(0);
    setSmoothPercent(5);

    const docText = extractedText || '';
    let targetPercent = 15;

    // Dynamic continuous progress ticker:
    // Moves smoothly and continuously forward even while backend is processing,
    // ensuring the progress bar NEVER freezes at 22% or any static number.
    const progressTicker = setInterval(() => {
      setSmoothPercent((prev) => {
        if (prev >= 96) return prev;

        let increment = 0.5;
        if (prev < targetPercent) {
          // Fast catch-up when backend sends higher progress
          increment = Math.max(0.8, (targetPercent - prev) * 0.25);
        } else if (prev < 30) {
          increment = 0.7;
        } else if (prev < 55) {
          increment = 0.45;
        } else if (prev < 80) {
          increment = 0.3;
        } else if (prev < 90) {
          increment = 0.15;
        } else {
          increment = 0.05;
        }

        const nextVal = Math.min(96, prev + increment);

        // Advance stage index dynamically according to progress percentage
        const calculatedStage = Math.min(
          STAGE_2_STATUS_MESSAGES.length - 2,
          Math.floor((nextVal / 96) * (STAGE_2_STATUS_MESSAGES.length - 1))
        );
        useSyllabusStore.setState((state) => ({
          statusMessageIndex: Math.max(state.statusMessageIndex, calculatedStage)
        }));

        return nextVal;
      });
    }, 350);

    try {
      let rawResult: any = null;

      if (jobId) {
        // Poll backend background extraction job until completed
        let completed = false;
        let attempts = 0;
        const maxAttempts = 180; // 180 * 2s = 6 minutes max

        while (!completed && attempts < maxAttempts) {
          attempts++;
          await new Promise((res) => setTimeout(res, 2000));
          try {
            const statusRes = await getProcessingStatus(jobId);
            if (statusRes.percentage) {
              targetPercent = Math.max(targetPercent, Math.min(98, statusRes.percentage));
            }
            if (statusRes.stageIndex && statusRes.totalStages) {
              const stageIdx = Math.min(
                STAGE_2_STATUS_MESSAGES.length - 1,
                Math.floor(((statusRes.stageIndex - 1) / statusRes.totalStages) * STAGE_2_STATUS_MESSAGES.length)
              );
              // Monotonically increase stage index only
              useSyllabusStore.setState((prev) => ({
                statusMessageIndex: Math.max(prev.statusMessageIndex, stageIdx)
              }));
            }

            if (statusRes.status === 'completed' && statusRes.result) {
              completed = true;
              rawResult = statusRes.result;
            } else if (statusRes.status === 'failed') {
              throw new Error(statusRes.error || statusRes.message || 'Background extraction task failed');
            }
          } catch (pollErr: any) {
            if (pollErr.message && pollErr.message.includes('failed')) {
              throw pollErr;
            }
          }
        }

        if (!rawResult && attempts >= maxAttempts) {
          throw new Error('TIMEOUT');
        }
      } else {
        // Direct single-shot process POST fallback
        targetPercent = 70;
        rawResult = await processSyllabus(docText, AI_PROCESSING_PROMPT);
      }

      clearInterval(progressTicker);
      setSmoothPercent(100);
      setStatusMessageIndex(STAGE_2_STATUS_MESSAGES.length - 1);
      setProcessingStatus('completed');
      setBackgroundProcessing(false);

      if (rawResult) {
        const normalized = normalizeBackendResponse(rawResult);
        setSyllabus(normalized);

        const courseTitle = normalized.course?.title || normalized.course?.code || 'Syllabus';
        setActiveNotification({
          title: 'Syllabus Extraction Completed 🎉',
          message: `Successfully extracted "${courseTitle}". Click to review & verify all fields.`,
          type: 'success',
          jobId: jobId || undefined,
          completedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        });

        setTimeout(() => {
          router.push('/verification');
        }, 600);
      }
    } catch (err: any) {
      clearInterval(progressTicker);
      setBackgroundProcessing(false);
      if (err.message === 'TIMEOUT') {
        if (retryCount < 1) {
          incrementRetryCount();
          setProcessingStatus('timeout');
        } else {
          setProcessingStatus('error', 'Processing timed out. Document extraction or AI Server taking long.');
        }
      } else {
        setProcessingStatus('error', err.message || 'Unable to connect to Processing Server');
      }
    }
  }, [extractedText, jobId, retryCount, setProcessingStatus, setStatusMessageIndex, setSyllabus, incrementRetryCount, setActiveNotification, setBackgroundProcessing, router]);

  useEffect(() => {
    runStage2Processing();
  }, [runStage2Processing]);

  const currentProgress = smoothPercent;


  return (
    <AppShell>
      <div className="space-y-6">
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-slate-200 dark:border-slate-800 bg-white dark:bg-gradient-to-br dark:from-slate-900 dark:via-slate-900 dark:to-brand-500/10 p-8 shadow-lg"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 dark:border-brand-500/20 bg-indigo-50 dark:bg-brand-500/10 px-3.5 py-1 text-xs font-mono text-indigo-700 dark:text-brand-300 font-semibold">
                <Sparkles size={14} /> Stage 2 Execution
              </div>
              <h1 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">
                Converting syllabus into structured JSON architecture
              </h1>
              <p className="mt-2 text-slate-600 dark:text-slate-400 text-sm">
                Extracted content and AI prompt sent to processing backend. Validating JSON & NetworkX DAG graph structure.
              </p>
            </div>
            <Button variant="outline" onClick={() => router.push('/upload')} className="border-slate-300 dark:border-white/20 bg-white dark:bg-black/60 text-slate-800 dark:text-white">
              <ArrowLeft className="mr-2" size={16} /> Re-upload
            </Button>
          </div>
        </motion.section>

        <ProcessingTimeline
          progress={currentProgress}
          currentStageIndex={statusMessageIndex}
          status={processingStatus}
          errorMessage={errorMessage}
          onRetry={runStage2Processing}
          onCancel={() => router.push('/upload')}
        />
      </div>
    </AppShell>
  );
}
