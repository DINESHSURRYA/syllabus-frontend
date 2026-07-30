"use client";
import './styles/page.css';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ScrollText,
  Bot,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  ExternalLink,
  BrainCircuit,
  Tag,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Loader2,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  fetchAdminInterviewDetail,
  AdminInterviewDetailResponse,
} from '@/lib/evaluator-api';
import { ReportScreen } from '@/components/ui/evaluator/ReportScreen';

export default function InterviewTranscriptPage() {
  const params = useParams();
  const router = useRouter();
  const threadId = (params?.threadId as string) || '';

  const [detail, setDetail] = useState<AdminInterviewDetailResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedTurn, setExpandedTurn] = useState<number | null>(0);

  useEffect(() => {
    if (!threadId) return;
    let isMounted = true;
    setLoading(true);

    fetchAdminInterviewDetail(threadId)
      .then((data) => {
        if (isMounted) {
          setDetail(data);
        }
      })
      .catch((err) => {
        console.error('Error fetching interview detail:', err);
        if (isMounted) setError('Failed to load detailed transcript for thread.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [threadId]);

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-screen gap-4">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin" />
        <p className="text-surface font-mono animate-pulse">Loading Detailed Evidence Trail...</p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 p-6 text-center">
        <AlertCircle size={48} className="text-error" />
        <h2 className="text-xl font-bold text-surface">Transcript Not Found</h2>
        <p className="text-xs text-muted max-w-md">
          {error || `No transcript detail found for thread ID: ${threadId}`}
        </p>
        <button
          onClick={() => router.push('/evaluator/admin')}
          className="px-6 py-2.5 rounded-full text-xs font-bold bg-accent text-background shadow-md hover:bg-accent/90 transition-all"
        >
          Back to Admin Dashboard
        </button>
      </div>
    );
  }

  const toggleAccordion = (idx: number) => {
    setExpandedTurn(expandedTurn === idx ? null : idx);
  };

  const interactions = detail.interactions || [];

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      {/* Back Button */}
      <button
        onClick={() => router.push('/evaluator/admin')}
        className="flex items-center gap-2 text-surface/70 hover:text-accent transition-colors mb-8 text-sm"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Admin Dashboard
      </button>

      {/* Header */}
      <div className="mb-12 border-b border-surface/10 pb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <span className="font-mono text-accent text-sm tracking-widest uppercase mb-2 flex items-center gap-2">
            <ScrollText className="w-4 h-4" /> Detailed Evidence Trail
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl text-surface">
            Session Transcript: {threadId.slice(0, 16)}...
          </h1>
        </div>
        {detail.report && (
          <button
            onClick={() => router.push(`/evaluator/report?id=${threadId}`)}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold bg-accent text-background hover:bg-accent/90 transition-all shadow-md shrink-0"
          >
            <span>View Full Report</span>
            <ExternalLink className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-12">
        <div className="p-4 rounded-2xl border border-surface/10 bg-surface/5 space-y-1">
          <span className="text-[10px] font-mono text-surface/50 uppercase block">Total Turns</span>
          <span className="text-xl font-black text-accent font-mono">{interactions.length}</span>
        </div>
        <div className="p-4 rounded-2xl border border-surface/10 bg-surface/5 space-y-1">
          <span className="text-[10px] font-mono text-surface/50 uppercase block">Stop Reason</span>
          <span className="text-sm font-bold text-surface uppercase font-mono">{detail.stop_reason || 'Completed'}</span>
        </div>
        <div className="p-4 rounded-2xl border border-surface/10 bg-surface/5 space-y-1">
          <span className="text-[10px] font-mono text-surface/50 uppercase block">Thread ID</span>
          <span className="text-xs font-mono text-surface/70 truncate block">{threadId}</span>
        </div>
        <div className="p-4 rounded-2xl border border-surface/10 bg-surface/5 space-y-1">
          <span className="text-[10px] font-mono text-surface/50 uppercase block">Status</span>
          <span className="text-xs font-bold text-success uppercase font-mono">LOGGED</span>
        </div>
      </div>

      {/* Interaction Timeline */}
      <div className="space-y-12 mb-16 relative">
        <div className="absolute left-6 top-4 bottom-4 w-px bg-surface/10 hidden md:block"></div>

        {interactions.length === 0 ? (
          <p className="text-surface/60 italic text-center py-8">No step-by-step turns recorded for this interview session.</p>
        ) : (
          interactions.map((interaction, idx) => {
            const qText = interaction.question?.question || 'Question';
            const studentAns = interaction.student_answer || 'No response provided.';
            const evalObj = interaction.evaluation || {};
            const isExpanded = expandedTurn === idx;

            return (
              <div key={idx} className="relative z-10 grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-12">
                <div className="md:col-span-1 hidden md:flex justify-center">
                  <div className="w-12 h-12 rounded-full bg-background border border-surface/20 flex items-center justify-center font-mono text-accent text-lg font-bold">
                    {idx + 1}
                  </div>
                </div>

                <div className="md:col-span-11 space-y-6">
                  {/* AI Question */}
                  <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Bot className="w-4 h-4 text-accent" />
                      <h4 className="text-xs font-semibold text-accent uppercase tracking-wider">AI Question</h4>
                      {interaction.current_topic && (
                        <span className="ml-auto text-[10px] font-mono px-2 py-0.5 rounded bg-accent/10 text-accent border border-accent/20">
                          {interaction.current_topic}
                        </span>
                      )}
                    </div>
                    <p className="text-surface/90 text-lg font-serif italic mb-4">
                      "{qText}"
                    </p>

                    {/* Internal Prompt State */}
                    {interaction.state_given_to_questioning_agent && (
                      <div className="bg-surface/10 rounded-xl p-4 border border-surface/10">
                        <button
                          onClick={() => toggleAccordion(idx)}
                          className="w-full flex items-center justify-between text-xs font-semibold text-surface/70 uppercase tracking-wider mb-2"
                        >
                          <span>Internal Prompt State (state_given_to_questioning_agent)</span>
                          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                        {isExpanded && (
                          <pre className="text-xs text-surface/60 overflow-x-auto font-mono max-h-64 scrollbar-thin scrollbar-thumb-surface/20 mt-2">
                            {JSON.stringify(interaction.state_given_to_questioning_agent, null, 2)}
                          </pre>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Student Answer */}
                  <div className="bg-surface/10 border-l-4 border-l-accent rounded-r-2xl p-6">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="w-4 h-4 text-surface/70" />
                      <h4 className="text-xs font-semibold text-surface/70 uppercase tracking-wider">Student Response</h4>
                    </div>
                    <p className="text-surface/90 text-lg leading-relaxed font-medium">
                      {studentAns}
                    </p>
                  </div>

                  {/* Evaluator Assessment */}
                  {evalObj && (
                    <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6 border-t-4 border-t-success/50">
                      <h4 className="text-xs font-semibold text-success uppercase tracking-wider mb-3 flex items-center justify-between">
                        <span>Evaluator Assessment</span>
                        {evalObj.assessment_confidence && (
                          <span className="text-[10px] text-surface/50 normal-case bg-background px-2 py-1 rounded border border-surface/10 font-mono">
                            Confidence: {evalObj.assessment_confidence}
                          </span>
                        )}
                      </h4>
                      <div className="space-y-3 text-sm text-surface/80">
                        {evalObj.feedback && <p>{evalObj.feedback}</p>}
                        {evalObj.score !== undefined && (
                          <div className="flex items-center gap-2 font-mono text-xs text-success">
                            <CheckCircle2 className="w-4 h-4" />
                            <span>Score: {evalObj.score}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Embedded Full Report if Available */}
      {detail.report && (
        <div className="mt-16 border-t border-surface/10 pt-12">
          <h2 className="font-serif text-2xl text-surface mb-8">Generated Diagnostic Report</h2>
          <ReportScreen report={detail.report} />
        </div>
      )}
    </div>
  );
}
