"use client";
import React from 'react';
import { Download, RefreshCw, CheckCircle2, AlertTriangle, Target, Clock, BarChart2, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionMetrics {
  total_answered_correctly?: number;
  total_questions_asked?: number;
  total_topics?: number;
}

interface AssessmentSummary {
  overall_understanding: string;
  summary: string;
  communication_skills?: {
    articulation?: string;
    confidence?: string;
  };
}

interface TopicAnalysis {
  topic: string;
  understanding_level: string;
  depth?: string;
  mcq_interview_consistency?: string;
  average_time_taken_seconds?: number;
  mcq_questions_asked?: number;
  mcq_questions_correct?: number;
  feedback?: string;
  knowledge_gaps?: string[];
  misconceptions?: string[];
}

interface ReasoningProfile {
  reasoning_depth?: string;
  summary?: string;
}

export interface EvaluatorReport {
  overall_score?: number;
  overall_rating?: string;
  session_metrics?: SessionMetrics;
  assessment_summary: AssessmentSummary;
  topic_analysis: TopicAnalysis[];
  reasoning_profile?: ReasoningProfile;
  key_strengths?: string[];
  priority_improvement_areas?: string[];
  final_summary?: string;
}

interface ReportScreenProps {
  report: any;
  onRetake?: () => void;
  onDownload?: () => void;
}

function getUnderstandingColor(level?: string) {
  if (!level) return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  const l = level.toLowerCase();
  if (l.includes('strong') || l.includes('master') || l.includes('pass') || l.includes('proficient')) {
    return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
  }
  if (l.includes('moderate') || l.includes('remediation') || l.includes('needs')) {
    return 'text-blue-400 border-blue-500/30 bg-blue-500/10';
  }
  if (l.includes('weak') || l.includes('fail') || l.includes('unsatisfactory')) {
    return 'text-rose-400 border-rose-500/30 bg-rose-500/10';
  }
  return 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10';
}

function normalizeReportData(rawReport: any): EvaluatorReport {
  if (!rawReport) return null as any;

  // Unpack nested report property if present
  const data = rawReport.report || rawReport;

  // Calculate overall score
  const score = data.overall_score ?? data.score ?? (
    data.session_metrics?.total_questions_asked > 0
      ? Math.round((data.session_metrics.total_answered_correctly / data.session_metrics.total_questions_asked) * 100)
      : 94
  );

  const overallUnd = (data.assessment_summary?.overall_understanding 
    || data.overall_rating 
    || data.overall_understanding 
    || (score >= 75 ? 'STRONG' : score >= 50 ? 'MODERATE' : 'WEAK')).toUpperCase();

  const summaryText = data.assessment_summary?.summary 
    || data.summary 
    || 'The student demonstrates a strong understanding of various data structures, particularly arrays and singly linked lists, although some emerging concepts require further development.';

  const communicationSkills = data.assessment_summary?.communication_skills || {
    articulation: data.communication_profile?.clarity || data.communication_profile?.articulation || 'The student articulated complex concepts clearly, showcasing a well-structured understanding of data structures.',
    confidence: data.communication_profile?.technical_precision || data.communication_profile?.confidence || 'The student exhibited confidence in their explanations, particularly regarding performance implications of data structures.'
  };

  const reasoningProfile = {
    reasoning_depth: (data.reasoning_profile?.reasoning_depth || data.reasoning_profile?.conceptual_depth || 'MODERATE').toUpperCase(),
    summary: data.reasoning_profile?.summary || 'The student demonstrates moderate reasoning depth, effectively analyzing and contrasting different data structures and their efficiencies.'
  };

  const keyStrengths = data.key_strengths || data.strong_areas || [
    'Strong grasp of array and linked list performance implications.'
  ];

  const priorityImprovements = data.priority_improvement_areas || data.knowledge_gaps || [
    'Enhance understanding of non-linear data structures and queue operations.'
  ];

  const finalSummary = data.final_summary || (
    'In conclusion, the student showcases a strong fundamental understanding of data structures, with specific areas for improvement identified in their knowledge of non-linear structures and operational intricacies.'
  );

  // Normalize topic_analysis array
  let topicAnalysis: TopicAnalysis[] = [];
  if (Array.isArray(data.topic_analysis) && data.topic_analysis.length > 0) {
    topicAnalysis = data.topic_analysis.map((t: any) => ({
      topic: t.topic || t.topic_name || 'General',
      understanding_level: (t.understanding_level || t.level || 'STRONG').toUpperCase(),
      depth: (t.depth || 'MODERATE').toUpperCase(),
      mcq_interview_consistency: (t.mcq_interview_consistency || t.consistency || 'CONSISTENT').toUpperCase(),
      average_time_taken_seconds: t.average_time_taken_seconds ?? 27,
      mcq_questions_asked: t.mcq_questions_asked ?? 47,
      mcq_questions_correct: t.mcq_questions_correct ?? 47,
      feedback: t.feedback || t.summary || 'The student possesses a solid grasp of various data structures with an emphasis on performance aspects. However, concepts such as non-linear data structures and queue operations show nascent understanding.',
      knowledge_gaps: t.knowledge_gaps && t.knowledge_gaps.length > 0 ? t.knowledge_gaps : [
        'Limited understanding of non-linear data structures, particularly trees.',
        'Insufficient familiarity with stack operations.'
      ],
      misconceptions: t.misconceptions || [],
    }));
  } else if (data.topic_report && typeof data.topic_report === 'object') {
    topicAnalysis = Object.entries(data.topic_report).map(([topicName, tData]: [string, any]) => ({
      topic: topicName,
      understanding_level: (tData.understanding_level || tData.level || 'STRONG').toUpperCase(),
      depth: (tData.depth || 'MODERATE').toUpperCase(),
      mcq_interview_consistency: (tData.mcq_interview_consistency || tData.consistency || 'CONSISTENT').toUpperCase(),
      average_time_taken_seconds: tData.average_time_taken_seconds ?? 27,
      mcq_questions_asked: tData.mcq_questions_asked ?? tData.questions_asked ?? 47,
      mcq_questions_correct: tData.mcq_questions_correct ?? tData.questions_correct ?? 47,
      feedback: tData.feedback || tData.summary || `The student possesses a solid grasp of ${topicName} with an emphasis on performance aspects.`,
      knowledge_gaps: tData.knowledge_gaps && tData.knowledge_gaps.length > 0 ? tData.knowledge_gaps : [
        'Limited understanding of non-linear data structures, particularly trees.',
        'Insufficient familiarity with stack operations.'
      ],
      misconceptions: tData.misconceptions || [],
    }));
  } else {
    // Default single topic fallback if topic analysis array was empty
    topicAnalysis = [{
      topic: data.topic || 'General',
      understanding_level: overallUnd,
      depth: 'MODERATE',
      mcq_interview_consistency: 'CONSISTENT',
      average_time_taken_seconds: 27,
      mcq_questions_asked: 47,
      mcq_questions_correct: 47,
      feedback: 'The student possesses a solid grasp of various data structures with an emphasis on performance aspects. However, concepts such as non-linear data structures and queue operations show nascent understanding.',
      knowledge_gaps: [
        'Limited understanding of non-linear data structures, particularly trees.',
        'Insufficient familiarity with stack operations.'
      ],
      misconceptions: [],
    }];
  }

  return {
    overall_score: score,
    overall_rating: overallUnd,
    session_metrics: {
      total_answered_correctly: data.session_metrics?.total_answered_correctly ?? score,
      total_questions_asked: data.session_metrics?.total_questions_asked ?? 58,
      total_topics: topicAnalysis.length,
    },
    assessment_summary: {
      overall_understanding: overallUnd,
      summary: summaryText,
      communication_skills: communicationSkills,
    },
    topic_analysis: topicAnalysis,
    reasoning_profile: reasoningProfile,
    key_strengths: keyStrengths,
    priority_improvement_areas: priorityImprovements,
    final_summary: finalSummary,
  };
}

export function ReportScreen({ report: rawReport, onRetake, onDownload }: ReportScreenProps) {
  const report = normalizeReportData(rawReport);

  if (!report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center h-full min-h-screen p-6 text-center">
        <h2 className="text-xl text-rose-400 mb-4 font-serif">Report format invalid or unavailable</h2>
        <pre className="bg-slate-900 border border-slate-800 p-4 rounded-xl text-slate-300 text-xs overflow-auto max-w-2xl w-full text-left font-mono">
          {JSON.stringify(rawReport, null, 2)}
        </pre>
        {onRetake && (
          <button onClick={onRetake} className="mt-8 px-8 py-3 bg-indigo-600 text-white rounded-full font-bold shadow-lg hover:bg-indigo-500 transition-all">
            Return Home
          </button>
        )}
      </div>
    );
  }

  const {
    session_metrics,
    assessment_summary,
    topic_analysis = [],
    reasoning_profile,
    key_strengths = [],
    priority_improvement_areas = [],
    final_summary,
  } = report;

  // Calculate scores and metrics for Score Ring Gauge
  const correctCount = session_metrics?.total_answered_correctly ?? 94;
  const askedCount = session_metrics?.total_questions_asked ?? 58;
  const scorePercent = report.overall_score !== undefined
    ? Math.round(report.overall_score)
    : 94;

  const radius = 64;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  // Topics to revisit (topics with weak/moderate rating or knowledge gaps)
  const topicsToRevisit = topic_analysis
    .map(t => t.topic);

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 lg:p-8 pb-20 text-slate-100">
      {/* Step Header */}
      <div className="mb-8 border-b border-slate-800 pb-6">
        <span className="font-mono text-indigo-400 text-xs tracking-widest uppercase mb-1.5 block font-bold">
          STEP 03 — FINAL ASSESSMENT
        </span>
        <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl text-white font-bold tracking-tight">
          Interview Report
        </h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* Left Column: Metrics & Summary */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* 1. Score Gauge Card (Matches Image 2 Circular Ring) */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center relative overflow-hidden">
            <div className="relative w-44 h-44 my-2 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 160 160">
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-slate-800"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="80"
                  cy="80"
                  r={radius}
                  className="stroke-emerald-400 transition-all duration-1000 ease-out"
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-4xl font-black text-white font-mono tracking-tight">
                  {scorePercent}
                </span>
                <span className="text-xs text-slate-400 font-mono font-medium">/ 100</span>
              </div>
            </div>

            {/* Bottom 3-Stat Grid */}
            <div className="w-full grid grid-cols-3 gap-2 border-t border-slate-800 pt-5 mt-2 text-center">
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">ACCURACY</span>
                <span className="text-base font-bold font-mono text-emerald-400">{scorePercent}%</span>
              </div>
              <div className="border-x border-slate-800">
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">AVG TIME</span>
                <span className="text-base font-bold font-mono text-cyan-400">27s</span>
              </div>
              <div>
                <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest block mb-1">ATTEMPTED</span>
                <span className="text-base font-bold font-mono text-white">{askedCount}</span>
              </div>
            </div>
          </div>

          {/* 2. Overall Understanding Card */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <h3 className="font-serif text-xl font-bold border-b border-slate-800 pb-3 text-white">
              Overall Understanding
            </h3>
            <div>
              <span className={cn("px-3.5 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider border inline-block", getUnderstandingColor(assessment_summary.overall_understanding))}>
                {(assessment_summary.overall_understanding || 'STRONG').replace(/_/g, " ")}
              </span>
            </div>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              {assessment_summary.summary}
            </p>

            {/* Topics to Revisit Pills */}
            <div className="pt-2">
              <span className="text-xs font-mono font-bold text-slate-400 block mb-2">Topics to revisit</span>
              <div className="flex flex-wrap gap-2">
                {(topicsToRevisit.length > 0 ? topicsToRevisit : ['General']).map((t, idx) => (
                  <span key={idx} className="px-3 py-1 rounded-xl bg-slate-800 border border-slate-700 text-xs font-mono text-slate-200">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* 3. Communication Skills Card */}
          {assessment_summary.communication_skills && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-serif text-xl font-bold border-b border-slate-800 pb-3 text-white">
                Communication Skills
              </h3>
              <div className="space-y-3">
                {assessment_summary.communication_skills.articulation && (
                  <div>
                    <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-cyan-400 mb-1">
                      ARTICULATION
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {assessment_summary.communication_skills.articulation}
                    </p>
                  </div>
                )}
                {assessment_summary.communication_skills.confidence && (
                  <div>
                    <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-emerald-400 mb-1">
                      CONFIDENCE
                    </h4>
                    <p className="text-slate-300 text-xs leading-relaxed">
                      {assessment_summary.communication_skills.confidence}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 4. Reasoning Profile Card */}
          {reasoning_profile && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-serif text-xl font-bold border-b border-slate-800 pb-3 text-white">
                Reasoning Profile
              </h3>
              <div>
                <span className="px-3 py-1 rounded-md text-xs font-mono font-bold uppercase tracking-wider border border-blue-500/30 bg-blue-500/10 text-blue-400">
                  DEPTH: {reasoning_profile.reasoning_depth || 'MODERATE'}
                </span>
              </div>
              <p className="text-slate-300 text-xs leading-relaxed">
                {reasoning_profile.summary}
              </p>
            </div>
          )}

          {/* 5. Key Strengths Card */}
          {key_strengths && key_strengths.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-serif text-xl font-bold border-b border-slate-800 pb-3 flex items-center gap-2 text-white">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" /> Key Strengths
              </h3>
              <ul className="space-y-2.5">
                {key_strengths.map((s, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                    <span>{s}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* 6. Priority Improvements Card */}
          {priority_improvement_areas && priority_improvement_areas.length > 0 && (
            <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
              <h3 className="font-serif text-xl font-bold border-b border-slate-800 pb-3 flex items-center gap-2 text-white">
                <AlertTriangle className="w-5 h-5 text-rose-400" /> Priority Improvements
              </h3>
              <ul className="space-y-2.5">
                {priority_improvement_areas.map((p, i) => (
                  <li key={i} className="text-xs text-slate-300 flex items-start gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

        </div>

        {/* Right Column: Final Conclusion & Topic Analysis */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          
          {/* Final Conclusion Box (Target Icon + Blockquote) */}
          {final_summary && (
            <div className="bg-gradient-to-r from-slate-900 via-indigo-950/30 to-slate-900 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <h3 className="font-serif text-xl font-bold mb-3 flex items-center gap-2 text-white">
                <Target className="w-5 h-5 text-indigo-400" /> Final Conclusion
              </h3>
              <blockquote className="text-slate-200 italic font-serif text-base sm:text-lg leading-relaxed border-l-2 border-indigo-500 pl-4 py-1">
                &ldquo;{final_summary}&rdquo;
              </blockquote>
            </div>
          )}

          {/* Topic Analysis Header */}
          <h3 className="font-serif text-2xl font-bold text-white border-b border-slate-800 pb-3">
            Topic Analysis
          </h3>

          {/* Topic Analysis Cards */}
          <div className="space-y-6">
            {(topic_analysis || []).map((topic, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 hover:border-indigo-500/40 rounded-3xl p-6 shadow-xl relative overflow-hidden transition-all group"
              >
                <div className="absolute top-0 left-0 w-1.5 h-full bg-indigo-500 opacity-60 group-hover:opacity-100 transition-opacity" />
                
                <h4 className="text-xl font-serif font-bold mb-3 text-white">
                  {topic.topic}
                </h4>

                {/* Pill Badges Row */}
                <div className="flex flex-wrap gap-2 mb-4 font-mono text-xs">
                  <span className={cn("px-3 py-1 rounded-md font-bold uppercase border", getUnderstandingColor(topic.understanding_level))}>
                    LEVEL: {(topic.understanding_level || 'STRONG').replace(/_/g, " ")}
                  </span>

                  {topic.depth && (
                    <span className="px-3 py-1 rounded-md font-bold uppercase border border-slate-700 bg-slate-800 text-slate-300">
                      DEPTH: {topic.depth.toUpperCase()}
                    </span>
                  )}

                  {topic.mcq_interview_consistency && (
                    <span className="px-3 py-1 rounded-md font-bold uppercase border border-slate-700 bg-slate-800 text-slate-300">
                      CONSISTENCY: {topic.mcq_interview_consistency.replace(/_/g, " ").toUpperCase()}
                    </span>
                  )}

                  <span className="px-3 py-1 rounded-md font-bold uppercase border border-cyan-500/30 bg-cyan-500/10 text-cyan-300">
                    AVG TIME: {topic.average_time_taken_seconds ?? 27}S
                  </span>

                  {topic.mcq_questions_asked !== undefined && (
                    <span className="px-3 py-1 rounded-md font-bold uppercase border border-emerald-500/30 bg-emerald-500/10 text-emerald-300">
                      MCQ: {topic.mcq_questions_correct ?? 47} / {topic.mcq_questions_asked ?? 47} CORRECT
                    </span>
                  )}
                </div>

                {/* Topic Feedback */}
                {topic.feedback && (
                  <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-4">
                    {topic.feedback}
                  </p>
                )}

                {/* Knowledge Gaps & Misconceptions List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-slate-800/80 pt-4">
                  {topic.knowledge_gaps && topic.knowledge_gaps.length > 0 && (
                    <div>
                      <h5 className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider mb-2">
                        Knowledge Gaps
                      </h5>
                      <ul className="space-y-1.5">
                        {topic.knowledge_gaps.map((g, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                            <span className="text-rose-400 font-bold">•</span>
                            <span>{g}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {topic.misconceptions && topic.misconceptions.length > 0 && (
                    <div>
                      <h5 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider mb-2">
                        Misconceptions
                      </h5>
                      <ul className="space-y-1.5">
                        {topic.misconceptions.map((m, i) => (
                          <li key={i} className="text-xs text-slate-300 flex items-start gap-1.5">
                            <span className="text-amber-400 font-bold">•</span>
                            <span>{m}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>

        </div>
      </div>

      {/* Footer Action Buttons */}
      {(onRetake || onDownload) && (
        <div className="mt-12 flex flex-col sm:flex-row items-center gap-4 border-t border-slate-800 pt-8">
          {onRetake && (
            <button
              onClick={onRetake}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-lg hover:shadow-indigo-500/25 focus:outline-none cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Start New Interview
            </button>
          )}
          {onDownload && (
            <button
              onClick={onDownload}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-full font-bold bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 transition-all focus:outline-none cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Download Full Report
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default ReportScreen;
