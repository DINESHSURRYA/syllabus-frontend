"use client";
import './styles/page.css';
import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Target,
  Share2,
  Printer,
  BrainCircuit,
  ExternalLink,
} from 'lucide-react';
import { useEvaluatorStore } from '@/stores';
import { EvaluatorBackButton } from '@/components/ui/evaluator';
import { cn } from '@/lib/utils';
import type { InterviewReport } from '@/lib/evaluator-api';

function ReportScreen({ propReport }: { propReport?: InterviewReport }) {
  const params = useParams();
  const router = useRouter();
  const threadId = (params?.threadId as string) || '';
  const { sessions, clearActiveSession } = useEvaluatorStore();

  const [report, setReport] = useState<InterviewReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedLink, setCopiedLink] = useState(false);

  const session = (sessions || []).find((s: any) => s.threadId === threadId);

  useEffect(() => {
    async function loadReport() {
      try {
        if (propReport) {
          setReport(propReport);
          return;
        }
        if (session?.report) {
          setReport(session.report);
          return;
        }
      } catch (err) {
        console.error("Failed to load report", err);
      } finally {
        setLoading(false);
      }
    }
    loadReport();
  }, [propReport, session?.report]);

  const handleRetake = () => {
    clearActiveSession();
    router.push('/evaluator/upload');
  };

  const handleShare = () => {
    setCopiedLink(true);
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
    }
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[60vh]">
        <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-surface font-mono animate-pulse">Synthesizing your assessment report...</p>
      </div>
    );
  }

  if (!session && !propReport) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <AlertTriangle size={48} className="text-amber-400" />
        <h2 className="text-lg font-bold text-surface">Report Not Found</h2>
        <p className="text-xs text-surface/70">
          Thread ID <code className="font-mono text-accent">{threadId}</code> was not found in the local session store.
        </p>
        <button
          onClick={() => router.push('/evaluator/admin')}
          className="px-6 py-2.5 rounded-full text-xs font-bold bg-accent text-background shadow-md hover:opacity-90 transition-all"
        >
          Return to Admin Dashboard
        </button>
      </div>
    );
  }

  if (!report || !report.assessment_summary) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-[60vh] p-6">
        <h2 className="text-xl text-error mb-4">Report format invalid or unavailable</h2>
        <pre className="bg-surface/10 p-4 rounded-xl text-surface/70 text-sm overflow-auto max-w-2xl w-full">
          {JSON.stringify(report ?? session, null, 2)}
        </pre>
        <button onClick={handleRetake} className="mt-8 px-8 py-3 bg-accent text-background rounded-full font-medium">
          Return Home
        </button>
      </div>
    );
  }

  const {
    session_metrics: rawMetrics,
    assessment_summary,
    topic_analysis,
    reasoning_profile,
    key_strengths,
    priority_improvement_areas,
    final_summary
  } = report;

  // Synthesize session metrics if not explicitly provided in report object
  const session_metrics = rawMetrics ?? {
    total_questions_asked: session?.totalQuestionsAsked ?? session?.turns.length ?? 0,
    total_answered_correctly: session?.totalAnsweredCorrectly ?? session?.turns.filter((t: any) => (t.evaluationScore ?? 0) >= 0.6).length ?? 0,
    total_topics: session?.totalTopics ?? topic_analysis?.length ?? 1,
  };

  const getUnderstandingColor = (level: string = '') => {
    const lvl = level.toLowerCase();
    if (lvl.includes('strong') || lvl.includes('high') || lvl.includes('advanced') || lvl.includes('mastered')) {
      return 'text-success border-success/30 bg-success/10';
    }
    if (lvl.includes('moderate') || lvl.includes('intermediate') || lvl.includes('partial') || lvl.includes('medium')) {
      return 'text-accent border-accent/30 bg-accent/10';
    }
    if (lvl.includes('weak') || lvl.includes('emerging') || lvl.includes('low') || lvl.includes('basic')) {
      return 'text-error border-error/30 bg-error/10';
    }
    return 'text-muted border-muted/30 bg-muted/10';
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-20">
      {/* Top Actions & Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-surface/10 pb-4 print:hidden">
        <EvaluatorBackButton
          onClick={() => router.push('/evaluator/admin')}
          label="Back to Admin Dashboard"
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-3.5 py-2 rounded-full border border-surface/20 bg-surface/5 text-xs font-mono font-semibold text-surface hover:bg-surface/10 transition-all"
          >
            <Share2 size={14} className="text-accent" />
            <span>{copiedLink ? 'Link Copied!' : 'Share Report'}</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 rounded-full text-xs font-mono font-bold bg-accent text-background hover:opacity-90 transition-all shadow-md"
          >
            <Printer size={14} />
            <span>Print / PDF</span>
          </button>
        </div>
      </div>

      {/* Header */}
      <div className="mb-8">
        <span className="font-mono text-accent text-sm tracking-widest uppercase mb-2 block flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-accent" /> Step 03 — Final Assessment
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-surface">
          Interview Report
        </h1>
        {session?.threadId && (
          <p className="text-xs font-mono text-surface/60 mt-1">
            Thread: <span className="text-accent font-bold">{session.threadId}</span>
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Column: Summary */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {session_metrics && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2">MCQ Summary</h3>
              
              <div className="flex flex-col gap-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-surface/80">Total Questions Correct</span>
                  <p className="text-3xl font-mono">
                    <span className="text-success font-bold">{session_metrics.total_answered_correctly}</span>
                    <span className="text-surface/30 mx-2">/</span>
                    <span className="text-surface/60 text-xl">{session_metrics.total_questions_asked}</span>
                  </p>
                </div>
                
                {session_metrics.total_topics !== undefined && (
                  <div className="flex justify-between items-center border-t border-surface/5 pt-3">
                    <span className="text-sm text-surface/80">Total Topics Evaluated</span>
                    <p className="text-xl font-mono text-accent font-medium">
                      {session_metrics.total_topics}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
            <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2">Overall Understanding</h3>
            <div className="mb-4">
              <span className={cn("px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider border inline-block", getUnderstandingColor(assessment_summary.overall_understanding))}>
                {assessment_summary.overall_understanding.replace(/_/g, ' ')}
              </span>
            </div>
            <p className="text-surface/80 text-sm leading-relaxed">{assessment_summary.summary}</p>
          </div>

          {assessment_summary.communication_skills && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
              <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2">Communication Skills</h3>
              <div className="space-y-4">
                {assessment_summary.communication_skills.articulation && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-accent mb-1">Articulation</h4>
                    <p className="text-surface/80 text-sm leading-relaxed">{assessment_summary.communication_skills.articulation}</p>
                  </div>
                )}
                {assessment_summary.communication_skills.confidence && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-widest text-success mb-1">Confidence</h4>
                    <p className="text-surface/80 text-sm leading-relaxed">{assessment_summary.communication_skills.confidence}</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {reasoning_profile && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
               <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2">Reasoning Profile</h3>
               {reasoning_profile.reasoning_depth && (
                 <div className="mb-4">
                   <span className="px-4 py-1.5 rounded-full text-sm font-semibold uppercase tracking-wider border text-accent border-accent/30 bg-accent/10 inline-block">
                     Depth: {reasoning_profile.reasoning_depth}
                   </span>
                 </div>
               )}
               {reasoning_profile.summary && (
                 <p className="text-surface/80 text-sm leading-relaxed">{reasoning_profile.summary}</p>
               )}
            </div>
          )}

          {key_strengths && key_strengths.length > 0 && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
               <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2 flex items-center gap-2">
                 <CheckCircle2 className="w-5 h-5 text-success" /> Key Strengths
               </h3>
               <ul className="space-y-3">
                 {key_strengths.map((s, i) => (
                   <li key={i} className="text-sm text-surface/80 flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-success mt-1.5 shrink-0" />
                     {s}
                   </li>
                 ))}
               </ul>
            </div>
          )}

          {priority_improvement_areas && priority_improvement_areas.length > 0 && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6">
               <h3 className="font-serif text-xl mb-4 border-b border-surface/10 pb-2 flex items-center gap-2">
                 <AlertTriangle className="w-5 h-5 text-error" /> Priority Improvements
               </h3>
               <ul className="space-y-3">
                 {priority_improvement_areas.map((p, i) => (
                   <li key={i} className="text-sm text-surface/80 flex items-start gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-error mt-1.5 shrink-0" />
                     {p}
                   </li>
                 ))}
               </ul>
            </div>
          )}
        </div>

        {/* Right Column: Topic Breakdown */}
        <div className="lg:col-span-7 flex flex-col h-full">
          {final_summary && (
            <div className="bg-surface/5 border border-surface/10 rounded-2xl p-6 mb-6">
               <h3 className="font-serif text-xl mb-3 flex items-center gap-2">
                 <Target className="w-5 h-5 text-accent" /> Final Conclusion
               </h3>
               <p className="text-surface/90 italic font-serif text-lg leading-relaxed">
                 "{final_summary}"
               </p>
            </div>
          )}

          <h3 className="font-serif text-2xl text-surface mb-6 border-b border-surface/10 pb-2">
            Topic Analysis
          </h3>
          
          <div className="space-y-6 lg:max-h-[60vh] lg:overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-surface/20 scrollbar-track-transparent">
            {topic_analysis?.map((topic, idx) => {
              const level = topic.understanding_level || topic.mastery || 'moderate';
              const depth = topic.depth;
              const consistency = topic.mcq_interview_consistency;
              
              return (
                <div key={idx} className="bg-surface/5 border border-surface/10 rounded-2xl p-6 relative overflow-hidden group hover:border-surface/20 transition-colors">
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent opacity-50 group-hover:opacity-100 transition-opacity" />
                  <h4 className="text-xl font-medium mb-3">{topic.topic}</h4>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className={cn("px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border", getUnderstandingColor(level))}>
                      Level: {level.replace(/_/g, ' ')}
                    </span>
                    {depth && (
                      <span className="px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border text-surface/60 border-surface/20 bg-surface/10">
                        Depth: {depth}
                      </span>
                    )}
                    {consistency && (
                      <span className="px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border text-surface/60 border-surface/20 bg-surface/10">
                        Consistency: {consistency.replace(/_/g, ' ')}
                      </span>
                    )}
                    {topic.average_time_taken_seconds !== undefined && (
                      <span className="px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border text-accent/70 border-accent/20 bg-accent/5">
                        Avg Time: {topic.average_time_taken_seconds}s
                      </span>
                    )}
                    {topic.mcq_questions_asked !== undefined && (
                      <span className="px-3 py-1 rounded-md text-xs font-semibold uppercase tracking-wider border text-success/70 border-success/20 bg-success/5">
                        MCQ: {topic.mcq_questions_correct ?? 0} / {topic.mcq_questions_asked} Correct
                      </span>
                    )}
                  </div>
                  {topic.feedback && (
                    <p className="text-sm text-surface/80 mb-6">{topic.feedback}</p>
                  )}
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     {topic.knowledge_gaps && topic.knowledge_gaps.length > 0 && (
                       <div>
                         <h5 className="text-sm font-semibold text-error mb-2">Knowledge Gaps</h5>
                         <ul className="space-y-2">
                           {topic.knowledge_gaps.map((g, i) => (
                             <li key={i} className="text-xs text-surface/70 flex items-start gap-1.5">
                               <span className="text-error mt-0.5">•</span> {g}
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}
                     {topic.misconceptions && topic.misconceptions.length > 0 && (
                       <div>
                         <h5 className="text-sm font-semibold text-accent mb-2">Misconceptions</h5>
                         <ul className="space-y-2">
                           {topic.misconceptions.map((m, i) => (
                             <li key={i} className="text-xs text-surface/70 flex items-start gap-1.5">
                               <span className="text-accent mt-0.5">•</span> {m}
                             </li>
                           ))}
                         </ul>
                       </div>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-surface/10 pt-8 print:hidden">
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full sm:w-auto">
          <button 
            onClick={handleRetake}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-full font-medium bg-accent text-background hover:bg-accent/90 transition-all focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <RefreshCw className="w-5 h-5" />
            Start New Interview
          </button>
          <button 
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3 rounded-full font-medium bg-transparent border border-surface/20 text-surface hover:bg-surface/10 transition-all focus:outline-none focus:ring-2 focus:ring-surface/30"
            onClick={() => window.print()}
          >
            <Download className="w-5 h-5" />
            Download Full Report
          </button>
        </div>
        
        {session?.threadId && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => router.push(`/evaluator/admin/transcript/${session.threadId}`)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-semibold border border-surface/20 bg-surface/5 text-surface/80 hover:text-accent hover:border-accent/40 transition-all"
            >
              <ExternalLink size={14} />
              <span>View Full Transcript</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function DiagnosticReportPage() {
  return <ReportScreen />;
}
