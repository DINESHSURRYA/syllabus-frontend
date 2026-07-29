"use client";
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Clock, Loader2, AlertCircle, RefreshCw, Sparkles, Layers, BookOpen, Calendar, BarChart3, Network } from 'lucide-react';
import { toast } from 'sonner';

interface AIProcessingStatusProps {
  jobId?: string;
  courseId?: string;
  onComplete?: () => void;
}

export const AIProcessingStatus: React.FC<AIProcessingStatusProps> = ({ jobId, courseId, onComplete }) => {
  const [jobData, setJobData] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [retryLoading, setRetryLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!jobId && !courseId) return;

    let isMounted = true;
    const fetchStatus = async () => {
      try {
        let url = jobId ? `/api/jobs/${jobId}` : `/api/courses/${courseId}/status`;
        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            if (jobId) {
              setJobData(data);
              if (data.status === 'completed' && onComplete) {
                onComplete();
              }
            } else if (data.latestJob) {
              setJobData(data.latestJob);
            }
          }
        }
      } catch (err) {
        console.error('Error fetching job status:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [jobId, courseId, onComplete]);

  const handleRetryTask = async (taskName: string) => {
    if (!courseId) return;
    setRetryLoading(taskName);
    try {
      const res = await fetch(`/api/courses/${courseId}/retry/${taskName}`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(`Triggered retry for ${taskName.replace('generate_', '')}`);
      } else {
        toast.error(`Failed to trigger retry for ${taskName}`);
      }
    } catch (err) {
      toast.error('Network error retrying task');
    } finally {
      setRetryLoading(null);
    }
  };

  if (!jobData && loading) {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-400 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-400" />
        <span>Initializing background AI pipeline...</span>
      </div>
    );
  }

  if (!jobData) return null;

  const stepStatuses = jobData.stepStatuses || {};
  const progress = jobData.progress || 0;

  const tasks = [
    { key: 'generate_hierarchy', label: 'Topic Hierarchy', icon: Layers },
    { key: 'generate_pedagogy', label: 'Top 3 Pedagogies', icon: BookOpen },
    { key: 'generate_timeline', label: 'Teaching Timeline', icon: Calendar },
    { key: 'generate_analytics', label: 'Course Analytics', icon: BarChart3 },
    { key: 'generate_knowledge_graph', label: 'Knowledge Graph', icon: Network },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
            <CheckCircle2 className="h-3 w-3" /> Completed
          </span>
        );
      case 'running':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
            <Loader2 className="h-3 w-3 animate-spin text-amber-400" /> Running...
          </span>
        );
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20">
            <AlertCircle className="h-3 w-3" /> Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-400 bg-slate-800/60 px-2 py-0.5 rounded-full border border-slate-700">
            <Clock className="h-3 w-3" /> Pending
          </span>
        );
    }
  };

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-xl text-slate-100">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-200">AI Background Pipeline</h4>
            <p className="text-[11px] text-slate-400">{jobData.currentStep || 'Processing tasks...'}</p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-indigo-400">{progress}%</span>
          <p className="text-[10px] text-slate-500">Status: <span className="capitalize">{jobData.status}</span></p>
        </div>
      </div>

      {/* Progress Track */}
      <div className="w-full bg-slate-800 rounded-full h-1.5 mb-4 overflow-hidden">
        <motion.div
          className="bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 h-full"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Step Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
        {tasks.map((task) => {
          const stepInfo = stepStatuses[task.key] || {};
          const status = stepInfo.status || 'pending';
          const Icon = task.icon;

          return (
            <div
              key={task.key}
              className={`rounded-xl border p-3 flex flex-col justify-between transition ${
                status === 'completed'
                  ? 'bg-slate-950/40 border-emerald-500/30'
                  : status === 'running'
                  ? 'bg-indigo-950/20 border-indigo-500/40 shadow-sm shadow-indigo-500/10'
                  : status === 'failed'
                  ? 'bg-rose-950/20 border-rose-500/40'
                  : 'bg-slate-950/20 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5 text-xs font-medium text-slate-200">
                  <Icon className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{task.label}</span>
                </div>
              </div>

              <div className="flex items-center justify-between mt-1">
                {getStatusBadge(status)}

                {status === 'failed' && (
                  <button
                    onClick={() => handleRetryTask(task.key)}
                    disabled={retryLoading === task.key}
                    className="p-1 rounded-md bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 transition text-[10px] inline-flex items-center gap-1"
                    title="Retry this step"
                  >
                    <RefreshCw className={`h-3 w-3 ${retryLoading === task.key ? 'animate-spin' : ''}`} />
                    Retry
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
