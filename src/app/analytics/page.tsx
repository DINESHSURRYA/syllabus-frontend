"use client";
import './styles/page.css';
import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, BookOpen, Clock, ChevronDown, BarChart3, Layers,
  Brain, RefreshCw, Search, CheckCircle2, Circle, Database,
  Target, Users, Zap, TrendingUp, BookMarked, FlaskConical,
  ChevronRight, AlertCircle, GraduationCap
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { client, API, syllabusApi } from '@/lib/api';
import * as curriculumApiModule from '@/lib/api/curriculum.api';

const AnalyticsCharts = dynamic(
  () => import('@/components/analytics-charts').then((mod) => mod.AnalyticsCharts),
  {
    loading: () => (
      <div className="h-72 w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-8 flex items-center justify-center text-xs font-mono text-cyan-400 animate-pulse">
        Loading Analytics Charts...
      </div>
    ),
    ssr: false,
  }
);

// ── Types ──
interface PipelineStage { stage: string; completed: boolean; percentage: number; }
interface DistItem { name: string; count: number; percentage: number; }
interface UnitTopicsItem { unit: string; topicsCount: number; hours: number; }
interface AnalyticsData {
  syllabusId?: string; courseCode?: string; courseTitle?: string;
  overallProgress?: number;
  pipelineStages?: PipelineStage[];
  statistics?: {
    totalUnits: number; totalTopics: number; totalSubtopics: number; totalConcepts: number;
    totalTeachingHours: number; avgHoursPerUnit: number; avgHoursPerTopic: number;
    totalPedagogiesRecommended: number; totalLearningOutcomes: number; estimatedTeachingWeeks: number;
  };
  bloomDistribution?: DistItem[]; difficultyDistribution?: DistItem[];
  pedagogyDistribution?: DistItem[];
  topicsPerUnit?: UnitTopicsItem[];
  insights?: string[];
}

const BLOOM_COLORS: Record<string, string> = {
  'Remember': '#64748b', 'Understand': '#3b82f6', 'Apply': '#10b981',
  'Analyze': '#8b5cf6', 'Evaluate': '#f59e0b', 'Create': '#f43f5e',
};
const DIFFICULTY_COLORS: Record<string, string> = {
  'Beginner': '#10b981', 'Intermediate': '#3b82f6', 'Advanced': '#8b5cf6', 'Hard': '#f43f5e',
};

const roundVal = (v: number) => Math.round((v || 0) * 10) / 10;
const maxOne = (v?: number) => Math.max(1, v || 0);

export default function AnalyticsPage() {
  const [selectedSyllabusId, setSelectedSyllabusId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [savedSyllabi, setSavedSyllabi] = useState<Array<{ id: string; code: string; title: string }>>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeSyllabus = useMemo(() =>
    savedSyllabi.find(s => s.id === selectedSyllabusId) || savedSyllabi[0] || null,
    [savedSyllabi, selectedSyllabusId]
  );

  const filteredSyllabi = useMemo(() => {
    if (!searchTerm.trim()) return savedSyllabi;
    const t = searchTerm.toLowerCase();
    return savedSyllabi.filter(s => s.code.toLowerCase().includes(t) || s.title.toLowerCase().includes(t));
  }, [savedSyllabi, searchTerm]);

  // Fetch syllabi list
  useEffect(() => {
    const fetchSyllabi = async () => {
      try {
        let res: any;
        try { res = await client.get(API.syllabus.saved); } catch { res = await syllabusApi.getSyllabusList(); }
        const list = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
        const seen = new Set<string>();
        const formatted: typeof savedSyllabi = [];
        list.forEach((c: any) => {
          const ci = c.course || c;
          const code = (c.courseCode || c.code || ci?.code || '').trim();
          const title = (c.courseName || c.title || ci?.title || ci?.courseName || '').trim();
          const id = c.id || c.syllabusId || ci?.id || code;
          const key = (code || id).toLowerCase();
          if (code && title && !seen.has(key)) { seen.add(key); formatted.push({ id, code, title }); }
        });
        setSavedSyllabi(formatted);
        if (formatted.length > 0) setSelectedSyllabusId(prev => prev || formatted[0].id);
      } catch (e) { console.warn('Syllabi fetch:', e); }
    };
    fetchSyllabi();
  }, []);

  // Fetch analytics with multi-tier endpoint fallbacks
  useEffect(() => {
    if (!selectedSyllabusId) return;
    let isMounted = true;

    const loadAnalytics = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let resData: any = null;

        // Try 1: /api/curriculum/analytics?syllabusId=X
        try {
          resData = await curriculumApiModule.getCurriculumAnalytics(selectedSyllabusId);
        } catch {
          resData = null;
        }

        // Try 2: /api/courses/{id}/analytics
        if (!resData) {
          try {
            resData = await client.get(`/api/courses/${encodeURIComponent(selectedSyllabusId)}/analytics`);
          } catch {
            resData = null;
          }
        }

        // Try 3: /api/analytics/dashboard?course_id=X
        if (!resData) {
          try {
            resData = await client.get(`/api/analytics/dashboard?course_id=${encodeURIComponent(selectedSyllabusId)}`);
          } catch {
            resData = null;
          }
        }

        if (resData && isMounted) {
          setAnalyticsData(resData);
          setIsLoading(false);
          return;
        }

        if (isMounted) {
          setError('Failed to load analytics for selected syllabus. Please ensure the syllabus is verified.');
          setAnalyticsData(null);
        }
      } catch (e: any) {
        if (isMounted) {
          setError(e.message || 'Failed to load analytics.');
          setAnalyticsData(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    loadAnalytics();
    return () => { isMounted = false; };
  }, [selectedSyllabusId]);

  const rawData = analyticsData as any;
  const stats = analyticsData?.statistics || (rawData ? {
    totalUnits: rawData.totalUnits || 0,
    totalTopics: rawData.totalTopics || 0,
    totalSubtopics: rawData.totalSubtopics || 0,
    totalConcepts: rawData.totalSubtopics || 0,
    totalTeachingHours: rawData.totalLearningHours || 0,
    avgHoursPerUnit: roundVal((rawData.totalLearningHours || 0) / maxOne(rawData.totalUnits)),
    avgHoursPerTopic: roundVal((rawData.totalLearningHours || 0) / maxOne(rawData.totalTopics)),
    totalPedagogiesRecommended: (rawData.topPedagogies || []).length || 5,
    totalLearningOutcomes: 5,
    estimatedTeachingWeeks: Math.max(1, Math.round((rawData.totalLearningHours || 45) / 3))
  } : null);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">

        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              Curriculum Analytics Dashboard
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              AI-powered insights · Bloom's taxonomy · Pedagogy distribution · Coverage analysis
            </p>
          </div>
        </div>

        {/* ── Syllabus Selector ── */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/95 backdrop-blur-xl p-4 shadow-lg relative z-40">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative min-w-[260px] flex-1">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between bg-[var(--bg-subtle)] text-xs font-mono font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-2xl px-3.5 py-2.5 hover:border-indigo-400 transition-all shadow-sm"
              >
                <span className="truncate">
                  {activeSyllabus ? `${activeSyllabus.code}: ${activeSyllabus.title}` : 'Select Syllabus...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-indigo-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <>
                  <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsDropdownOpen(false)} />
                  <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl overflow-hidden backdrop-blur-xl">
                    <div className="p-2 border-b border-[var(--border-subtle)]">
                      <input type="text" placeholder="Search..." value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs font-mono bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-xl outline-none" />
                    </div>
                    <div className="max-h-52 overflow-y-auto">
                      {filteredSyllabi.map(s => (
                        <button key={s.id}
                          onClick={() => { setSelectedSyllabusId(s.id); setIsDropdownOpen(false); setSearchTerm(''); }}
                          className={`w-full text-left px-3.5 py-2.5 text-xs font-mono transition-colors ${selectedSyllabusId === s.id ? 'bg-indigo-600 text-white' : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'}`}>
                          <span className="font-extrabold">{s.code}</span> — {s.title}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
            {analyticsData && (
              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-[var(--text-muted)]">Overall Progress:</span>
                <span className={`font-extrabold ${(analyticsData.overallProgress || 100) >= 80 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {(analyticsData.overallProgress || 100).toFixed(1)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Loading / Error ── */}
        {isLoading && (
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-10 flex items-center justify-center gap-3 text-xs font-mono text-[var(--text-muted)]">
            <Database size={16} className="animate-pulse text-indigo-400" />
            Computing analytics from PostgreSQL data...
          </div>
        )}

        {error && !isLoading && (
          <div className="rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 flex items-center gap-3 text-xs font-mono text-amber-400">
            <AlertCircle size={14} />
            {error}
            <span className="ml-2 text-[var(--text-muted)]">Visit the Curriculum Tree page to generate the hierarchy first.</span>
          </div>
        )}

        {!isLoading && analyticsData && (
          <div className="space-y-6">

            {/* ── Pipeline Progress ── */}
            <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 space-y-4 shadow-md">
              <h2 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2">
                <Target size={15} className="text-indigo-400" /> Overall Progress
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {(analyticsData.pipelineStages || []).map((stage, idx) => (
                  <div key={idx} className={`flex items-center gap-3 p-3 rounded-2xl border ${stage.completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)]'}`}>
                    {stage.completed
                      ? <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
                      : <Circle size={16} className="text-[var(--text-muted)] shrink-0" />
                    }
                    <div className="flex-1 min-w-0">
                      <div className="text-[11px] font-mono font-bold text-[var(--text-primary)] truncate">{stage.stage}</div>
                      <div className={`text-xs font-extrabold ${stage.completed ? 'text-emerald-400' : 'text-[var(--text-muted)]'}`}>
                        {stage.percentage}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Course Statistics ── */}
            {stats && (
              <div className="space-y-3">
                <h2 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 px-1">
                  <BarChart3 size={15} className="text-indigo-400" /> Course Statistics
                </h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {[
                    { label: 'Total Units', value: stats.totalUnits, icon: <Layers size={14} />, color: 'text-indigo-400' },
                    { label: 'Total Topics', value: stats.totalTopics, icon: <BookOpen size={14} />, color: 'text-cyan-400' },
                    { label: 'Total Subtopics', value: stats.totalSubtopics, icon: <ChevronRight size={14} />, color: 'text-violet-400' },
                    { label: 'Total Concepts', value: stats.totalConcepts, icon: <Brain size={14} />, color: 'text-emerald-400' },
                    { label: 'Teaching Hours', value: `${stats.totalTeachingHours}h`, icon: <Clock size={14} />, color: 'text-amber-400' },
                    { label: 'Avg Hrs / Unit', value: `${stats.avgHoursPerUnit}h`, icon: <BarChart3 size={14} />, color: 'text-rose-400' },
                    { label: 'Avg Hrs / Topic', value: `${stats.avgHoursPerTopic}h`, icon: <Zap size={14} />, color: 'text-teal-400' },
                    { label: 'Pedagogies', value: stats.totalPedagogiesRecommended, icon: <GraduationCap size={14} />, color: 'text-blue-400' },
                    { label: 'Learning Outcomes', value: stats.totalLearningOutcomes, icon: <Target size={14} />, color: 'text-fuchsia-400' },
                    { label: 'Teaching Weeks', value: stats.estimatedTeachingWeeks, icon: <TrendingUp size={14} />, color: 'text-orange-400' },
                  ].map(s => (
                    <div key={s.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-center space-y-1">
                      <div className={`flex items-center justify-center gap-1 text-[10px] font-mono font-bold ${s.color} opacity-70`}>
                        {s.icon} {s.label}
                      </div>
                      <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Topics Per Unit Chart ── */}
            {(analyticsData.topicsPerUnit || []).length > 0 && (
              <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-md">
                <h2 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                  <Layers size={15} className="text-indigo-400" /> Topics & Hours per Unit
                </h2>
                <div className="space-y-3">
                  {(analyticsData.topicsPerUnit || []).map((u, idx) => (
                    <div key={idx} className="space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-mono">
                        <span className="font-bold text-[var(--text-primary)] truncate max-w-[60%]">{u.unit}</span>
                        <span className="text-[var(--text-muted)]">{u.topicsCount} topics · {u.hours}h</span>
                      </div>
                      <div className="h-2 rounded-full bg-[var(--bg-subtle)] overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }} animate={{ width: `${Math.min(100, (u.topicsCount / 10) * 100)}%` }}
                          transition={{ delay: idx * 0.05, duration: 0.5 }}
                          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-cyan-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Distribution Grids ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

              {/* Bloom's Taxonomy */}
              {(analyticsData.bloomDistribution || []).length > 0 && (
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-md">
                  <h3 className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                    <Brain size={13} className="text-violet-400" /> Bloom's Taxonomy Distribution
                  </h3>
                  <div className="space-y-2.5">
                    {(analyticsData.bloomDistribution || []).map((d, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="font-bold" style={{ color: BLOOM_COLORS[d.name] || '#64748b' }}>{d.name}</span>
                          <span className="text-[var(--text-muted)]">{d.count} · {d.percentage}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--bg-subtle)]">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${d.percentage}%` }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className="h-full rounded-full"
                            style={{ background: BLOOM_COLORS[d.name] || '#64748b' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Difficulty Distribution */}
              {(analyticsData.difficultyDistribution || []).length > 0 && (
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-md">
                  <h3 className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                    <Zap size={13} className="text-amber-400" /> Difficulty Distribution
                  </h3>
                  <div className="space-y-2.5">
                    {(analyticsData.difficultyDistribution || []).map((d, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="font-bold" style={{ color: DIFFICULTY_COLORS[d.name] || '#64748b' }}>{d.name}</span>
                          <span className="text-[var(--text-muted)]">{d.count} · {d.percentage}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--bg-subtle)]">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${d.percentage}%` }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className="h-full rounded-full"
                            style={{ background: DIFFICULTY_COLORS[d.name] || '#64748b' }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Top Pedagogies */}
              {(analyticsData.pedagogyDistribution || []).length > 0 && (
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-md">
                  <h3 className="text-xs font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-4">
                    <Users size={13} className="text-cyan-400" /> Top Pedagogies
                  </h3>
                  <div className="space-y-2.5">
                    {(analyticsData.pedagogyDistribution || []).slice(0, 6).map((d, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between text-[11px] font-mono">
                          <span className="font-bold text-[var(--text-primary)] truncate max-w-[70%]">{d.name}</span>
                          <span className="text-[var(--text-muted)]">{d.count} · {d.percentage}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[var(--bg-subtle)]">
                          <motion.div
                            initial={{ width: 0 }} animate={{ width: `${d.percentage}%` }}
                            transition={{ delay: idx * 0.05, duration: 0.4 }}
                            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-indigo-500"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* ── Recharts Visual Analytics ── */}
            {analyticsData.bloomDistribution && analyticsData.bloomDistribution.length > 0 && (
              <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-6 shadow-md">
                <h2 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 mb-5">
                  <BarChart3 size={15} className="text-indigo-400" /> Visual Analytics
                </h2>
                <AnalyticsCharts
                  unitCount={analyticsData.statistics?.totalUnits || 5}
                  hoursData={(analyticsData.topicsPerUnit || []).map((u) => ({ name: u.unit, value: u.hours }))}
                  bloomData={(analyticsData.bloomDistribution || []).map((d) => ({ name: d.name, value: d.count ?? (d as any).value ?? 0, percentage: d.percentage }))}
                  difficultyData={(analyticsData.difficultyDistribution || []).map((d) => ({ name: d.name, value: d.count ?? (d as any).value ?? 0, percentage: d.percentage }))}
                />
              </div>
            )}

            {/* ── AI Insights ── */}
            {(analyticsData.insights || []).length > 0 && (
              <div className="rounded-3xl border border-indigo-500/20 bg-indigo-500/5 p-6 shadow-md space-y-3">
                <h2 className="text-sm font-extrabold text-indigo-400 flex items-center gap-2">
                  <Sparkles size={15} /> Curriculum Insights
                </h2>
                <div className="space-y-2">
                  {(analyticsData.insights || []).map((insight, idx) => (
                    <div key={idx} className="flex gap-2.5 text-xs font-mono text-[var(--text-secondary)] leading-relaxed">
                      <span className="text-indigo-400 font-extrabold shrink-0 mt-0.5">✦</span>
                      {insight}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoading && !analyticsData && !error && (
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-14 text-center space-y-4">
            <BarChart3 className="w-14 h-14 text-indigo-400 mx-auto opacity-60" />
            <h3 className="text-lg font-extrabold text-[var(--text-primary)]">Select a Syllabus</h3>
            <p className="text-xs font-mono text-[var(--text-muted)] max-w-md mx-auto">
              Choose a saved and verified syllabus to view comprehensive curriculum analytics.
            </p>
          </div>
        )}
      </div>
    </AppShell>
  );
}
