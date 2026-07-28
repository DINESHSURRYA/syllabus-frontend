"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  CalendarDays,
  ArrowRight,
  ChevronDown,
  BookOpen,
  Clock,
  Layers,
  RefreshCw,
  Check,
  Search,
  Filter
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSyllabusStore, normalizeSyllabusToStoreData, UnitItem } from '@/lib/store';

const TimelineCard = dynamic(
  () => import('@/components/timeline-card').then((mod) => mod.TimelineCard),
  {
    loading: () => <div className="h-32 rounded-2xl border border-slate-800 bg-slate-900/50 animate-pulse p-4 text-xs font-mono text-slate-500">Loading timeline card...</div>,
    ssr: false,
  }
);

// ─────────────────────────────────────────────
// Types & Keyword Rules
// ─────────────────────────────────────────────
interface SavedSyllabus {
  id: string;
  code: string;
  title: string;
  updatedAt?: string;
}

const PEDAGOGY_POOL = ['Worked Example', 'Case Study', 'Hands-on Lab', 'Visualisation', 'Guided Practice', 'Think-Pair-Share', 'Socratic Dialogue'];
const BLOOM_POOL = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const HOURS_OPTIONS = ['45 Hours', '60 Hours', '75 Hours', '90 Hours', 'Custom'];

const HIGH_WEIGHT_KEYWORDS = [
  'SCHEDULING', 'DEADLOCK', 'PAGE REPLACEMENT', 'CRITICAL-SECTION', 'SYNCHRONIZATION',
  'BANKER', 'ALLOCATION METHODS', 'INODE', 'VIRTUALIZATION', 'HYPERVISOR',
  'INTER-PROCESS', 'MEMORY MANAGEMENT', 'FILE SYSTEM IMPLEMENTATION', 'VIRTUAL MEMORY',
  'DISK SCHEDULING', 'SYSTEM CALLS', 'STRUCTURING METHODS', 'ART', 'SEMAPHORE'
];

const LOW_WEIGHT_KEYWORDS = [
  'OVERVIEW', 'INTRODUCTION', 'EVOLUTION', 'INTERFACE', 'HISTORY', 'OBJECTIVES',
  'FUNCTIONS', 'PROGRAMS', 'CONCEPT', 'TYPES OF', 'BENEFITS', 'ELEMENTS'
];

function calculateTopicWeight(title: string, subCount: number, bloomLevel?: string): number {
  const tUpper = (title || '').toUpperCase();
  let weight = 1.0;

  if (subCount > 1) {
    weight += (subCount - 1) * 0.3;
  }

  if (HIGH_WEIGHT_KEYWORDS.some((kw) => tUpper.includes(kw))) {
    weight *= 1.8;
  } else if (LOW_WEIGHT_KEYWORDS.some((kw) => tUpper.includes(kw))) {
    weight *= 0.65;
  }

  const bUpper = (bloomLevel || '').toUpperCase();
  if (bUpper.includes('EVALUATE') || bUpper.includes('CREATE')) {
    weight *= 1.4;
  } else if (bUpper.includes('ANALYZE') || bUpper.includes('APPLY')) {
    weight *= 1.2;
  } else if (bUpper.includes('REMEMBER')) {
    weight *= 0.8;
  }

  return Math.max(0.4, weight);
}

function buildTimelineData(
  units: UnitItem[],
  selectedUnits: Record<number, boolean>,
  generatedTimelineUnits?: any[],
  generatedTimelineLectures?: any[]
) {
  return units
    .filter((_, idx) => selectedUnits[idx] !== false)
    .map((unit, uIdx) => {
      const unitNumberStr = `Unit ${unit.unit_number || uIdx + 1}`;
      const unitTitleStr = unit.title || `Unit ${uIdx + 1}`;
      const unitTotalHours = parseFloat(unit.hours) || 9.0;
      const unitIdStr = (unit as any).id || unitTitleStr;

      // 1. Check if generated 1-hour unit plan exists from API/DB
      const matchedUnitPlan = (generatedTimelineUnits || []).find(
        (u: any) =>
          u.unit_id === unitIdStr ||
          u.unit_name === unitTitleStr ||
          u.unit_id === unitNumberStr ||
          (u.unit_name && u.unit_name.toLowerCase() === unitTitleStr.toLowerCase())
      );

      if (matchedUnitPlan && Array.isArray(matchedUnitPlan.hourly_sessions) && matchedUnitPlan.hourly_sessions.length > 0) {
        return {
          unit: unitNumberStr,
          topic: matchedUnitPlan.unit_name || unitTitleStr,
          hours: String(matchedUnitPlan.total_allocated_hours || unitTotalHours),
          sessions: matchedUnitPlan.hourly_sessions.map((s: any) => ({
            hour_number: s.hour_number,
            duration: "60 mins",
            topics_covered: Array.isArray(s.topics_covered) ? s.topics_covered : [s.topic || "Core Topic"],
            bloom_level: s.bloom_level || "Understand",
            pedagogy: s.pedagogy || "Worked Example",
            reasoning: s.reasoning || ""
          }))
        };
      }

      // 2. Fallback: generate clean 1-hour session slots for this unit
      const targetHoursInt = Math.max(1, Math.round(unitTotalHours));
      const topics = unit.topics || [];
      const sessionList: Array<{
        hour_number: number;
        duration: string;
        topics_covered: string[];
        bloom_level: string;
        pedagogy: string;
        reasoning?: string;
      }> = [];

      const allTopicTitles: string[] = [];
      topics.forEach((t) => {
        const topicName = t.name || 'Core Topic';
        const rawSubs = Array.isArray(t.subtopics) ? t.subtopics : [];
        if (rawSubs.length > 0) {
          rawSubs.forEach((sub) => {
            const titleStr = typeof sub === 'string' ? sub : (sub as any).title || (sub as any).name || topicName;
            allTopicTitles.push(titleStr);
          });
        } else {
          allTopicTitles.push(topicName);
        }
      });

      if (allTopicTitles.length === 0) {
        allTopicTitles.push(`${unitTitleStr} Core Concepts`);
      }

      const itemsPerSlot = Math.max(1, Math.floor(allTopicTitles.length / targetHoursInt));

      for (let h = 1; h <= targetHoursInt; h++) {
        let slotTopics: string[] = [];
        if (h === targetHoursInt) {
          slotTopics = allTopicTitles.slice((h - 1) * itemsPerSlot);
        } else {
          slotTopics = allTopicTitles.slice((h - 1) * itemsPerSlot, h * itemsPerSlot);
        }

        if (slotTopics.length === 0 && allTopicTitles.length > 0) {
          slotTopics = [allTopicTitles[(h - 1) % allTopicTitles.length]];
        }

        const pedagogy = PEDAGOGY_POOL[(h - 1) % PEDAGOGY_POOL.length];
        const bloom = BLOOM_POOL[(h - 1) % BLOOM_POOL.length];
        const reasoning = slotTopics.length === 1
          ? `${slotTopics[0]} requires a dedicated 60-minute session due to high conceptual weightage.`
          : `Combining ${slotTopics.length} related subtopics into a 60-minute session creates a solid learning block.`;

        sessionList.push({
          hour_number: h,
          duration: '60 mins',
          topics_covered: slotTopics,
          bloom_level: bloom,
          pedagogy,
          reasoning,
        });
      }

      return {
        unit: unitNumberStr,
        topic: unitTitleStr,
        hours: String(targetHoursInt),
        sessions: sessionList,
      };
    });
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function TimelinePage() {
  const { syllabus, setSyllabus } = useSyllabusStore();

  const [savedSyllabi, setSavedSyllabi] = useState<SavedSyllabus[]>([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState('');
  const [isFetchingSyllabi, setIsFetchingSyllabi] = useState(true);
  const [isLoadingSyllabus, setIsLoadingSyllabus] = useState(false);
  const [isGeneratingTimeline, setIsGeneratingTimeline] = useState(false);
  const [isTimelineAllocated, setIsTimelineAllocated] = useState<boolean>(false);
  const [generatedTimelineUnits, setGeneratedTimelineUnits] = useState<any[]>([]);
  const [generatedTimelineLectures, setGeneratedTimelineLectures] = useState<any[]>([]);
  const [selectedUnits, setSelectedUnits] = useState<Record<number, boolean>>({});
  const [selectedHours, setSelectedHours] = useState('45 Hours');
  const [syllabusSearch, setSyllabusSearch] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [activeUnitFilter, setActiveUnitFilter] = useState<string>('all');

  const units = syllabus?.units || [];

  // ── Check PostgreSQL database for cached allocated timeline plan ──
  useEffect(() => {
    if (!selectedSyllabusId) return;
    const checkDbTimeline = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/timeline/syllabus/${encodeURIComponent(selectedSyllabusId)}`);
        if (res.ok) {
          const data = await res.json();
          if (data && data.isTimelineAllocated && data.timelinePlan) {
            setIsTimelineAllocated(true);
            if (Array.isArray(data.timelinePlan.units) && data.timelinePlan.units.length > 0) {
              setGeneratedTimelineUnits(data.timelinePlan.units);
            }
            if (Array.isArray(data.timelinePlan.lectures)) {
              setGeneratedTimelineLectures(data.timelinePlan.lectures);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('DB timeline fetch notice:', err);
      }
      setIsTimelineAllocated(false);
    };
    checkDbTimeline();
  }, [selectedSyllabusId]);

  // ── Fetch saved syllabi list from backend ──
  useEffect(() => {
    setIsFetchingSyllabi(true);
    const tryFetch = async () => {
      try {
        let res = await fetch('http://localhost:8000/api/syllabus/saved');
        if (!res.ok) res = await fetch('http://localhost:8000/api/syllabus');

        if (res.ok) {
          const raw = await res.json();
          const list = Array.isArray(raw) ? raw : Array.isArray(raw?.items) ? raw.items : [];
          const seen = new Set<string>();
          const formatted: SavedSyllabus[] = [];

          list.forEach((c: any) => {
            const courseInfo = c?.course && typeof c.course === 'object' ? c.course : c;
            const code = (c.courseCode || c.code || courseInfo?.code || courseInfo?.courseCode || '').trim();
            const title = (c.courseName || c.courseTitle || c.title || courseInfo?.title || courseInfo?.courseName || '').trim();
            const id = c.id || c.syllabusId || courseInfo?.id || code;
            if (code && title && id && !seen.has(id)) {
              seen.add(id);
              formatted.push({ id, code, title, updatedAt: c.updatedAt || c.createdAt || c.timestamp });
            }
          });

          setSavedSyllabi(formatted);

          if (formatted.length > 0) {
            const currentId = selectedSyllabusId || syllabus?.id || syllabus?.course?.code;
            const found = currentId ? formatted.find((f) => f.id === currentId || f.code === currentId) : null;
            if (found) {
              setSelectedSyllabusId(found.id);
            } else {
              setSelectedSyllabusId(formatted[0].id);
            }
          } else {
            setSelectedSyllabusId('');
          }
        }
      } catch (err) {
        console.warn('Could not fetch saved syllabi:', err);
      } finally {
        setIsFetchingSyllabi(false);
      }
    };
    tryFetch();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Load full syllabus data when selection changes ──
  useEffect(() => {
    if (!selectedSyllabusId) return;

    const currentId = syllabus?.id || syllabus?.course?.code;
    if ((currentId === selectedSyllabusId) && units.length > 0) {
      setIsLoadingSyllabus(false);
      return;
    }

    setIsLoadingSyllabus(true);
    const loadSyllabus = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/syllabus/${encodeURIComponent(selectedSyllabusId)}`);
        if (res.ok) {
          const raw = await res.json();
          const normalized = normalizeSyllabusToStoreData(raw);
          setSyllabus(normalized);
        }
      } catch (err) {
        console.warn('Could not load syllabus data:', err);
      } finally {
        setIsLoadingSyllabus(false);
      }
    };
    loadSyllabus();
  }, [selectedSyllabusId]);

  // ── Reset unit selection when syllabus changes ──
  useEffect(() => {
    const init: Record<number, boolean> = {};
    units.forEach((_, idx) => { init[idx] = true; });
    setSelectedUnits(init);
  }, [units.length]);

  const toggleUnit = (idx: number) => {
    setSelectedUnits((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleGenerateTimeline = async () => {
    setIsGeneratingTimeline(true);
    try {
      const courseId = selectedSyllabusId || syllabus?.id || 'CS3451';
      const targetHoursNum = parseInt(selectedHours) || 45;
      const selectedUnitIds = units
        .filter((_, idx) => selectedUnits[idx] !== false)
        .map((u) => (u as any).id || u.title);

      const res = await fetch('http://localhost:8000/api/timeline/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          targetHours: targetHoursNum,
          selectedUnitIds,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data) {
          if (Array.isArray(data.units) && data.units.length > 0) {
            setGeneratedTimelineUnits(data.units);
          }
          if (Array.isArray(data.lectures)) {
            setGeneratedTimelineLectures(data.lectures);
          }
          setIsTimelineAllocated(true);
        }
      }
    } catch (err) {
      console.warn('Could not generate timeline via API:', err);
    } finally {
      setIsGeneratingTimeline(false);
    }
  };


  const dynamicTimelineData = useMemo(
    () => buildTimelineData(units, selectedUnits, generatedTimelineUnits, generatedTimelineLectures),
    [units, selectedUnits, generatedTimelineUnits, generatedTimelineLectures]
  );

  const displayedTimelineData = useMemo(() => {
    if (activeUnitFilter === 'all') return dynamicTimelineData;
    return dynamicTimelineData.filter(
      (item) => item.unit === activeUnitFilter || item.unit.toLowerCase() === activeUnitFilter.toLowerCase()
    );
  }, [dynamicTimelineData, activeUnitFilter]);

  useEffect(() => {
    if (activeUnitFilter !== 'all') {
      const exists = dynamicTimelineData.some(
        (item) => item.unit === activeUnitFilter || item.unit.toLowerCase() === activeUnitFilter.toLowerCase()
      );
      if (!exists) setActiveUnitFilter('all');
    }
  }, [dynamicTimelineData, activeUnitFilter]);

  const filteredSyllabi = useMemo(() => {
    const q = syllabusSearch.toLowerCase().trim();
    if (!q) return savedSyllabi;
    return savedSyllabi.filter((s) => s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q));
  }, [savedSyllabi, syllabusSearch]);

  useEffect(() => {
    if (!syllabusSearch.trim()) return;
    const q = syllabusSearch.toLowerCase().trim();
    const match = savedSyllabi.find(
      (s) => s.code.toLowerCase() === q || s.title.toLowerCase() === q || s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
    );
    if (match && match.id && match.id !== selectedSyllabusId) {
      setSelectedSyllabusId(match.id);
    }
  }, [syllabusSearch, savedSyllabi, selectedSyllabusId]);

  const activeSyllabus = useMemo(() => {
    if (selectedSyllabusId) return savedSyllabi.find((s) => s.id === selectedSyllabusId);
    return undefined;
  }, [savedSyllabi, selectedSyllabusId]);

  const totalHours = units.reduce((sum, u) => sum + (Number(u.hours) || 9), 0);
  const selectedCount = Object.values(selectedUnits).filter(Boolean).length;

  return (
    <AppShell>
      <div className="space-y-6">

        {/* ─── Hero Header ─── */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative z-30 overflow-visible rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/95 backdrop-blur-2xl p-6 md:p-7 shadow-lg"
        >
          <div className="flex flex-col gap-5">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-slate-900 text-white dark:bg-sky-950 dark:text-sky-200 border border-slate-800 dark:border-sky-700 px-3.5 py-1.5 text-xs font-mono font-bold shadow-xs">
                <Sparkles size={14} className="text-sky-400" /> Teaching Timeline Generator
              </div>
              <h1 className="mt-3 text-2xl md:text-3xl font-extrabold text-[var(--text-primary)] tracking-tight">
                Shape the curriculum into a guided weekly teaching plan
              </h1>
              {activeSyllabus && (
                <p className="mt-1.5 text-xs font-mono text-[var(--text-secondary)]">
                  Active:&nbsp;
                  <span className="text-blue-700 dark:text-sky-300 font-extrabold bg-blue-50 dark:bg-sky-950/70 px-2 py-0.5 rounded border border-blue-200 dark:border-sky-800">{activeSyllabus.code}</span>
                  &nbsp;—&nbsp;{activeSyllabus.title}
                </p>
              )}
            </div>

            {/* ── Syllabus Selector & Generate Action Bar (Directly under Page Title) ── */}
            <div className="pt-4 border-t border-[var(--border-subtle)]/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 relative z-30">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                <div className="relative min-w-[280px] max-w-full sm:max-w-md z-40">
                  <div
                    className="flex items-center justify-between gap-2.5 bg-[var(--bg-hover)] border border-[var(--border-subtle)] rounded-2xl px-4 py-2.5 cursor-pointer hover:border-cyan-400 transition-all shadow-sm group"
                    onClick={() => setDropdownOpen((v) => !v)}
                  >
                    <span className="text-xs font-mono font-bold text-[var(--text-primary)] truncate max-w-[220px] sm:max-w-[260px]">
                      {isFetchingSyllabi
                        ? 'Loading syllabi...'
                        : activeSyllabus
                          ? `${activeSyllabus.code}: ${activeSyllabus.title}`
                          : 'Select Saved Syllabus...'}
                    </span>
                    <ChevronDown
                      size={15}
                      className={`text-cyan-400 shrink-0 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </div>

                  <AnimatePresence>
                    {dropdownOpen && (
                      <>
                        <div className="fixed inset-0 z-40" onClick={() => setDropdownOpen(false)} />

                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute top-full left-0 right-0 sm:w-[360px] z-50 mt-2 rounded-2xl border border-cyan-500/40 bg-[var(--bg-card)] shadow-2xl overflow-hidden p-2 space-y-1.5 text-xs font-mono backdrop-blur-2xl text-[var(--text-primary)]"
                        >
                          <div className="p-2 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/50 rounded-xl">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-400" />
                              <input
                                type="text"
                                placeholder="Search syllabi by code or title..."
                                value={syllabusSearch}
                                onChange={(e) => setSyllabusSearch(e.target.value)}
                                onClick={(e) => e.stopPropagation()}
                                autoFocus
                                className="w-full pl-8 pr-3 py-2 text-xs font-mono bg-[var(--bg-card)] text-[var(--text-primary)] rounded-lg outline-none border border-[var(--border-subtle)] focus:border-cyan-400 transition-colors placeholder:text-[var(--text-muted)]"
                              />
                            </div>
                          </div>
                          <div className="max-h-64 overflow-y-auto space-y-1 p-1 custom-scrollbar">
                            {filteredSyllabi.length === 0 ? (
                              <p className="text-xs text-[var(--text-muted)] text-center py-4 font-mono">No syllabi found</p>
                            ) : (
                              filteredSyllabi.map((s) => (
                                <button
                                  key={s.id}
                                  onClick={() => {
                                    setSelectedSyllabusId(s.id);
                                    setDropdownOpen(false);
                                    setSyllabusSearch('');
                                  }}
                                  className={`w-full text-left px-3.5 py-2.5 text-xs font-mono rounded-xl hover:bg-[var(--bg-hover)] transition-colors flex items-center justify-between gap-2 ${
                                    selectedSyllabusId === s.id
                                      ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 font-bold border border-cyan-500/30'
                                      : 'text-[var(--text-primary)]'
                                  }`}
                                >
                                  <div className="flex flex-col min-w-0 text-left">
                                    <span className="font-bold truncate text-[var(--text-primary)]">{s.code}</span>
                                    <span className="text-[var(--text-secondary)] text-[11px] truncate">{s.title}</span>
                                  </div>
                                  {selectedSyllabusId === s.id && <Check size={14} className="text-cyan-500 shrink-0" />}
                                </button>
                              ))
                            )}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {isTimelineAllocated ? (
                  <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold">
                    <Check size={16} />
                    <span>Allocated &amp; Saved in DB (Read-Only Caching)</span>
                  </div>
                ) : (
                  <Button
                    onClick={handleGenerateTimeline}
                    disabled={isGeneratingTimeline || isLoadingSyllabus || units.length === 0}
                    className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold shadow-md text-sm px-5 py-2.5 rounded-2xl whitespace-nowrap flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                  >
                    {isGeneratingTimeline ? (
                      <>
                        <RefreshCw size={15} className="animate-spin text-white" />
                        Generating AI Timeline...
                      </>
                    ) : (
                      <>
                        <Sparkles size={15} />
                        Generate Timeline
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </motion.section>

        {/* ─── Loading State ─── */}
        {isLoadingSyllabus && (
          <div className="flex items-center justify-center gap-3 py-10 text-[var(--text-muted)] text-sm font-mono">
            <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
            Loading syllabus data...
          </div>
        )}

        {/* ─── Empty State ─── */}
        {!isLoadingSyllabus && units.length === 0 && (
          <Card className="border-[var(--border-subtle)] bg-[var(--bg-card)] p-12 text-center shadow-md">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-[var(--border-strong)] bg-[var(--bg-subtle)] p-3 mb-4">
              <CalendarDays className="w-8 h-8 text-[var(--text-muted)]" />
            </div>
            <h3 className="text-lg font-bold text-[var(--text-primary)]">No syllabus units found</h3>
            <p className="mt-2 max-w-sm mx-auto text-xs text-[var(--text-secondary)] leading-relaxed">
              {savedSyllabi.length > 0
                ? 'Select a saved syllabus from the dropdown above to generate a teaching timeline.'
                : 'Upload and verify a syllabus document to generate a customized teaching timeline and weekly lecture breakdown.'}
            </p>
            {savedSyllabi.length === 0 && (
              <Button asChild size="sm" className="mt-5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-md">
                <Link href="/upload">Upload Syllabus <ArrowRight size={14} className="ml-1.5" /></Link>
              </Button>
            )}
          </Card>
        )}

        {/* ─── Main Content ─── */}
        {!isLoadingSyllabus && units.length > 0 && (
          <div className="grid gap-6 xl:grid-cols-[0.9fr_1.1fr]">

            {/* Left: Configuration Panel */}
            <div className="space-y-4">
              <Card className="border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-md overflow-hidden">
                <CardHeader className="p-5 border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                  <CardTitle className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                    <Layers size={15} className="text-indigo-400" />
                    Teaching Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 p-5">

                  {/* Status Banner: Read-Only Caching vs Unallocated Prompt */}
                  {isTimelineAllocated ? (
                    <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 space-y-1.5 font-mono text-xs text-emerald-300">
                      <div className="flex items-center gap-2 font-bold text-emerald-400">
                        <Check size={16} />
                        <span>Timeline Allocated &amp; Persisted (Read-Only)</span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        This timeline plan is stored in PostgreSQL DB. Reconfiguration is locked to fast-load cached DB data without extra AI processing.
                      </p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-sky-300 dark:border-cyan-500/30 bg-sky-50 dark:bg-cyan-950/40 p-4 space-y-1.5 font-mono text-xs">
                      <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-cyan-300">
                        <Sparkles size={16} className="text-blue-700 dark:text-cyan-400" />
                        <span className="text-slate-900 dark:text-cyan-300 text-sm font-extrabold">Unallocated Teaching Timeline</span>
                      </div>
                      <p className="text-[11px] text-slate-800 dark:text-slate-300 font-medium leading-relaxed">
                        Set total teaching hours (e.g., 45h, 60h) or allow AI to auto-calculate the optimal 1-hour teaching slot plan.
                      </p>
                    </div>
                  )}

                  {/* Course Summary */}
                  {activeSyllabus && (
                    <div className="rounded-2xl border border-sky-300 dark:border-cyan-500/25 bg-sky-50/90 dark:bg-cyan-500/8 p-3.5 space-y-1">
                      <span className="inline-block px-2.5 py-0.5 rounded bg-slate-900 text-white dark:bg-cyan-950 dark:text-cyan-200 text-[10px] font-mono font-bold uppercase tracking-wider">
                        Active Syllabus
                      </span>
                      <p className="text-xs font-bold text-slate-900 dark:text-[var(--text-primary)]">{activeSyllabus.code}: {activeSyllabus.title}</p>
                      <div className="flex gap-3 text-[11px] font-mono text-slate-700 dark:text-[var(--text-muted)] mt-1 font-semibold">
                        <span>{units.length} Units</span>
                        <span>•</span>
                        <span>{totalHours} Total Hours</span>
                        <span>•</span>
                        <span>{syllabus?.course?.credits || '–'} Credits</span>
                      </div>
                    </div>
                  )}

                  {/* Unit Selector */}
                  <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 shadow-sm">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-[11px] font-mono font-bold uppercase text-[var(--text-secondary)] tracking-wider">Select Units</p>
                      <span className="text-[11px] font-mono text-blue-700 dark:text-cyan-400 font-bold">{selectedCount}/{units.length}</span>
                    </div>
                    <div className="space-y-2">
                      {units.map((unit, uIdx) => {
                        const isChecked = selectedUnits[uIdx] !== false;
                        return (
                          <div
                            key={uIdx}
                            onClick={() => !isTimelineAllocated && toggleUnit(uIdx)}
                            className={`flex items-center justify-between rounded-xl border px-3.5 py-2.5 transition-all ${
                              isTimelineAllocated ? 'cursor-default' : 'cursor-pointer'
                            } ${
                              isChecked
                                ? 'border-cyan-500/40 bg-cyan-500/8 text-[var(--text-primary)]'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-muted)]'
                            }`}
                          >
                            <div className="min-w-0">
                              <span className="text-xs font-mono font-bold text-indigo-400 block">
                                Unit {unit.unit_number || uIdx + 1}
                              </span>
                              <span className="text-xs font-semibold truncate block max-w-[200px]">
                                {unit.title || `Unit ${unit.unit_number || uIdx + 1}`}
                              </span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-[10px] font-mono text-[var(--text-muted)]">{unit.hours || '9'}h</span>
                              <div className={`w-4 h-4 rounded-md border flex items-center justify-center transition-all ${
                                isChecked ? 'bg-indigo-600 border-indigo-500' : 'border-[var(--border-strong)] bg-[var(--bg-subtle)]'
                              }`}>
                                {isChecked && <Check size={10} className="text-white" />}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Teaching Hours */}
                  {!isTimelineAllocated && (
                    <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 shadow-sm">
                      <p className="text-[11px] font-mono font-bold uppercase text-[var(--text-secondary)] tracking-wider mb-3">Teaching Hours</p>
                      <div className="flex flex-wrap gap-2">
                        {HOURS_OPTIONS.map((option) => (
                          <button
                            key={option}
                            onClick={() => setSelectedHours(option)}
                            className={`rounded-full px-3.5 py-1.5 text-xs font-mono transition-all border ${
                              selectedHours === option
                                ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-sm'
                                : 'border-[var(--border-subtle)] bg-[var(--bg-card)] text-[var(--text-secondary)] hover:border-indigo-400'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Stats Row */}
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { label: 'Selected', value: selectedCount, icon: <Check size={13} className="text-emerald-400" /> },
                      { label: 'Total Hours', value: totalHours, icon: <Clock size={13} className="text-cyan-400" /> },
                      { label: 'Topics', value: units.reduce((s, u) => s + (u.topics?.length || 0), 0), icon: <BookOpen size={13} className="text-indigo-400" /> },
                    ].map((stat) => (
                      <div key={stat.label} className="rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-2.5 text-center">
                        <div className="flex justify-center mb-1">{stat.icon}</div>
                        <p className="text-sm font-black text-[var(--text-primary)]">{stat.value}</p>
                        <p className="text-[10px] font-mono text-[var(--text-muted)]">{stat.label}</p>
                      </div>
                    ))}
                  </div>

                </CardContent>
              </Card>
            </div>

            {/* Right: Timeline Cards & Unitwise Filter */}
            <div className="space-y-4">
              {/* ─── Unitwise Filter Bar ─── */}
              {dynamicTimelineData.length > 0 && (
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4.5 shadow-md space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
                        <Filter size={14} />
                      </div>
                      <div>
                        <h4 className="text-xs font-mono font-bold uppercase text-[var(--text-primary)] tracking-wider flex items-center gap-2">
                          Unitwise Timeline Filter
                        </h4>
                        <p className="text-[11px] font-mono text-[var(--text-muted)]">
                          {activeUnitFilter === 'all'
                            ? `Showing all ${dynamicTimelineData.length} units`
                            : `Filtered to ${activeUnitFilter} of ${dynamicTimelineData.length} units`}
                        </p>
                      </div>
                    </div>

                    {activeUnitFilter !== 'all' && (
                      <button
                        onClick={() => setActiveUnitFilter('all')}
                        className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 transition-colors flex items-center gap-1 font-bold bg-cyan-500/10 border border-cyan-500/30 px-3 py-1 rounded-full"
                      >
                        Reset Filter
                      </button>
                    )}
                  </div>

                  {/* Filter Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 custom-scrollbar">
                    <button
                      onClick={() => setActiveUnitFilter('all')}
                      className={`rounded-xl px-3.5 py-2 text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-2 border ${
                        activeUnitFilter === 'all'
                          ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 border-transparent text-white font-bold shadow-md'
                          : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-cyan-400'
                      }`}
                    >
                      <Layers size={13} />
                      <span>All Units</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        activeUnitFilter === 'all' ? 'bg-white/20 text-white' : 'bg-[var(--bg-card)] text-slate-400'
                      }`}>
                        {dynamicTimelineData.length}
                      </span>
                    </button>

                    {dynamicTimelineData.map((item) => {
                      const isActive = activeUnitFilter === item.unit;
                      const sessionCount = item.sessions?.length || 0;
                      return (
                        <button
                          key={item.unit}
                          onClick={() => setActiveUnitFilter(item.unit)}
                          className={`rounded-xl px-3.5 py-2 text-xs font-mono font-semibold transition-all shrink-0 flex items-center gap-2 border ${
                            isActive
                              ? 'bg-indigo-600 border-indigo-500 text-white font-bold shadow-md'
                              : 'border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:border-indigo-400'
                          }`}
                        >
                          <span>{item.unit}</span>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isActive ? 'bg-white/20 text-white' : 'bg-[var(--bg-card)] text-slate-400'
                          }`}>
                            {sessionCount}h
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {displayedTimelineData.length === 0 ? (
                <div className="flex items-center justify-center h-40 rounded-3xl border border-dashed border-[var(--border-strong)] text-[var(--text-muted)] text-sm font-mono">
                  {dynamicTimelineData.length === 0
                    ? 'No units selected — check a unit on the left to see its timeline.'
                    : 'No sessions found for the selected unit filter.'}
                </div>
              ) : (
                displayedTimelineData.map((item, idx) => (
                  <motion.div
                    key={`${item.unit}-${idx}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.06 }}
                  >
                    <TimelineCard
                      unit={item.unit}
                      topic={item.topic}
                      hours={item.hours}
                      sessions={item.sessions}
                    />
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </AppShell>
  );
}
