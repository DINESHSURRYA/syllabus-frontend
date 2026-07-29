"use client";
import './styles/page.css';
import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CalendarDays, Clock, Layers, RefreshCw,
  Check, Search, ChevronDown, BookOpen, BarChart3,
  ChevronRight, ChevronDown as CollapseIcon, FlaskConical,
  AlertCircle, CheckCircle2, Database, Zap
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { client, API, syllabusApi, curriculumApi, timelineApi } from '@/lib/api';

interface SavedSyllabus { id: string; code: string; title: string; updatedAt?: string; }
interface HourlySlot {
  hour: number;
  topic: string;
  topics_covered?: string[];
  bloom_level?: string;
}
interface TimelineUnit {
  unit_id?: string; unitId?: string;
  unit_number?: number; unitNumber?: number;
  unit_title?: string; unitTitle?: string;
  total_unit_hours?: number; totalHours?: number; allocatedHours?: number;
  hourly_schedule?: HourlySlot[]; hourlySchedule?: HourlySlot[];
  topics?: any[]; topicsCount?: number; avgHoursPerTopic?: number;
  teachingHours?: number; revisionHours?: number; assessmentHours?: number;
}
interface TimelineData {
  syllabusId?: string; courseCode?: string; course_code?: string;
  courseTitle?: string; course_title?: string;
  targetHours?: number; total_hours?: number; totalAllocatedHours?: number; totalTeachingWeeks?: number;
  totalUnits?: number; totalTopics?: number; avgHoursPerUnit?: number; avgHoursPerTopic?: number;
  units?: TimelineUnit[]; labTimeline?: any[]; generatedAt?: string;
}

const HOURS_OPTIONS = ['45 Hours', '60 Hours', '75 Hours', '90 Hours', 'Custom'];
const BLOOM_COLORS: Record<string, string> = {
  'Remember': 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  'Understand': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'Apply': 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  'Analyze': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'Evaluate': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'Create': 'bg-rose-500/20 text-rose-300 border-rose-500/30',
};

export default function TimelinePage() {
  const [savedSyllabi, setSavedSyllabi] = useState<SavedSyllabus[]>([]);
  const [selectedSyllabusId, setSelectedSyllabusId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHours, setSelectedHours] = useState('45 Hours');
  const [customHoursInput, setCustomHoursInput] = useState('');
  const [selectedUnitFilter, setSelectedUnitFilter] = useState<'ALL' | '1' | '2' | '3' | '4' | '5'>('ALL');
  const [hasSyllabusHours, setHasSyllabusHours] = useState(false);
  const [syllabusTotalHours, setSyllabusTotalHours] = useState<number | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [isTimelineAllocated, setIsTimelineAllocated] = useState(false);
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({});
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState(false);

  const activeSyllabus = useMemo(() =>
    savedSyllabi.find(s => s.id === selectedSyllabusId) || savedSyllabi[0] || null,
    [savedSyllabi, selectedSyllabusId]
  );

  const filteredSyllabi = useMemo(() => {
    if (!searchTerm.trim()) return savedSyllabi;
    const t = searchTerm.toLowerCase();
    return savedSyllabi.filter(s => s.code.toLowerCase().includes(t) || s.title.toLowerCase().includes(t));
  }, [savedSyllabi, searchTerm]);

  const targetHoursNum = useMemo(() => {
    if (hasSyllabusHours && syllabusTotalHours && syllabusTotalHours > 0) return syllabusTotalHours;
    if (selectedHours === 'Custom') return parseInt(customHoursInput || '45') || 45;
    return parseInt(selectedHours) || 45;
  }, [hasSyllabusHours, syllabusTotalHours, selectedHours, customHoursInput]);

  // Fetch saved syllabi list
  useEffect(() => {
    const fetchSyllabi = async () => {
      try {
        let res: any;
        try { res = await client.get(API.syllabus.saved); } catch { res = await syllabusApi.getSyllabusList(); }
        const list = Array.isArray(res) ? res : Array.isArray(res?.items) ? res.items : [];
        const seen = new Set<string>();
        const formatted: SavedSyllabus[] = [];
        list.forEach((c: any) => {
          const ci = c.course || c;
          const code = (c.courseCode || c.code || ci?.code || ci?.courseCode || '').trim();
          const title = (c.courseName || c.title || ci?.title || ci?.courseName || '').trim();
          const id = c.id || c.syllabusId || ci?.id || code;
          const key = (code || id).toLowerCase();
          if (code && title && !seen.has(key)) { seen.add(key); formatted.push({ id, code, title, updatedAt: c.updatedAt }); }
        });
        setSavedSyllabi(formatted);
        if (formatted.length > 0) setSelectedSyllabusId(prev => prev || formatted[0].id);
      } catch (e) { console.warn('Syllabi fetch fallback:', e); }
    };
    fetchSyllabi();
  }, []);

  // Auto-load saved timeline from DB when syllabus is selected & inspect unit hours
  useEffect(() => {
    if (!selectedSyllabusId) return;
    const loadTimeline = async () => {
      setIsLoadingTimeline(true);
      setTimelineData(null);
      setIsTimelineAllocated(false);
      setHasSyllabusHours(false);
      setSyllabusTotalHours(null);

      try {
        const res = await timelineApi.getSyllabusTimeline(selectedSyllabusId);
        if (res && res.isTimelineAllocated && res.units && res.units.length > 0) {
          setTimelineData(res);
          setIsTimelineAllocated(true);
          // Check if allocated hours exist
          const totalH = res.total_hours || res.totalAllocatedHours || res.targetHours;
          if (totalH && totalH > 0) {
            setHasSyllabusHours(true);
            setSyllabusTotalHours(totalH);
          }
          // Auto-expand first unit
          const u0Id = res.units[0].unit_id || res.units[0].unitId || '0';
          setExpandedUnits({ [u0Id]: true });
        }
      } catch {
        // No saved timeline — user needs to generate
      } finally {
        setIsLoadingTimeline(false);
      }
    };
    loadTimeline();
  }, [selectedSyllabusId]);

  const handleGenerate = useCallback(async (forceRegenerate = false) => {
    if (!selectedSyllabusId && savedSyllabi.length === 0) {
      setStatusMsg({ type: 'error', text: 'No syllabus selected. Please select a saved syllabus.' });
      return;
    }
    setIsGenerating(true);
    setStatusMsg({ type: 'info', text: 'Generating teaching timeline — processing hour-by-hour allocation...' });
    try {
      const selectedUnitsParam = selectedUnitFilter === 'ALL' ? undefined : [selectedUnitFilter];
      const res = await timelineApi.generateTimeline({
        courseId: selectedSyllabusId,
        selectedUnitIds: selectedUnitsParam as any,
        targetHours: targetHoursNum,
        customHours: selectedHours === 'Custom' ? parseInt(customHoursInput || '45') : undefined,
        forceRegenerate,
      } as any);

      if (res && (res.units || res.success)) {
        setTimelineData(res);
        setIsTimelineAllocated(true);
        const totalH = res.total_hours || res.totalAllocatedHours || targetHoursNum;
        if (totalH) {
          setHasSyllabusHours(true);
          setSyllabusTotalHours(totalH);
        }
        const u0Id = res.units?.[0]?.unit_id || res.units?.[0]?.unitId || '0';
        if (u0Id) setExpandedUnits({ [u0Id]: true });
        setStatusMsg({
          type: 'success',
          text: `Timeline generated & saved to PostgreSQL — ${totalH}h across ${res.units?.length || 0} units.`
        });
      }
    } catch (e: any) {
      setStatusMsg({ type: 'error', text: e.message || 'Timeline generation failed. Check backend connection.' });
    } finally {
      setIsGenerating(false);
    }
  }, [selectedSyllabusId, savedSyllabi, targetHoursNum, selectedHours, customHoursInput, selectedUnitFilter]);

  const toggleUnit = (unitId: string) => {
    setExpandedUnits(prev => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // Filter visible units according to unit selection (ALL, 1, 2, 3, 4, 5)
  const visibleUnits = useMemo(() => {
    if (!timelineData || !timelineData.units) return [];
    if (selectedUnitFilter === 'ALL') return timelineData.units;
    const targetNum = parseInt(selectedUnitFilter);
    return timelineData.units.filter(u => {
      const uNum = u.unit_number ?? u.unitNumber;
      return uNum === targetNum;
    });
  }, [timelineData, selectedUnitFilter]);

  // Summary stats
  const stats = useMemo(() => {
    if (!timelineData) return null;
    const units = timelineData.units || [];
    const totalSlots = units.reduce((s, u) => s + (u.hourly_schedule?.length || u.topics?.length || 0), 0);
    const totHrs = timelineData.total_hours || timelineData.totalAllocatedHours || targetHoursNum;
    return {
      totalUnits: units.length,
      totalSlots,
      totalHours: totHrs,
      avgHoursPerUnit: totHrs / Math.max(1, units.length),
      avgHoursPerTopic: 1.0,
      totalWeeks: timelineData.totalTeachingWeeks || Math.ceil(totHrs / 10),
      labCount: (timelineData.labTimeline || []).length,
    };
  }, [timelineData, targetHoursNum]);

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        {/* ── Header ── */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2.5">
              <CalendarDays className="w-6 h-6 text-indigo-400" />
              Teaching Timeline Generator
            </h1>
            <p className="text-xs font-mono text-[var(--text-muted)] mt-1">
              1-Hour Slot Allocation · Weight-Adjusted Topic Hierarchy · DB-First Caching
            </p>
          </div>
          {isTimelineAllocated && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
              <Database size={13} /> Saved to PostgreSQL
            </span>
          )}
        </div>

        {/* ── Controls Bar ── */}
        <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/95 backdrop-blur-xl p-5 shadow-lg space-y-4">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">

            {/* Syllabus Dropdown with Search */}
            <div className="relative min-w-[280px] flex-1">
              <label className="block text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase mb-1">Select Syllabus</label>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between bg-[var(--bg-subtle)] text-xs font-mono font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-2xl px-3.5 py-2.5 hover:border-indigo-400 transition-all"
              >
                <span className="truncate">
                  {activeSyllabus ? `${activeSyllabus.code}: ${activeSyllabus.title}` : 'Select Saved Syllabus...'}
                </span>
                <ChevronDown className={`w-4 h-4 text-indigo-400 shrink-0 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-1.5 z-50 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] shadow-2xl overflow-hidden">
                  <div className="p-2 border-b border-[var(--border-subtle)] flex items-center gap-2">
                    <Search size={14} className="text-indigo-400 shrink-0 ml-1" />
                    <input
                      type="text" placeholder="Search course code or title..."
                      value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs font-mono bg-transparent outline-none"
                    />
                  </div>
                  <div className="max-h-56 overflow-y-auto">
                    {filteredSyllabi.length === 0 ? (
                      <p className="text-xs font-mono text-[var(--text-muted)] p-3 text-center">No matching syllabi found.</p>
                    ) : filteredSyllabi.map(s => (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedSyllabusId(s.id); setIsDropdownOpen(false); setSearchTerm(''); }}
                        className={`w-full text-left px-3.5 py-2.5 text-xs font-mono transition-colors ${selectedSyllabusId === s.id ? 'bg-indigo-600 text-white font-extrabold' : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'}`}
                      >
                        <span className="font-extrabold">{s.code}</span> — {s.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Unit Selection Filter (All Units, 1, 2, 3, 4, 5) */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase mb-1">Unit Filter</label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {(['ALL', '1', '2', '3', '4', '5'] as const).map(u => (
                  <button
                    key={u}
                    onClick={() => setSelectedUnitFilter(u)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${selectedUnitFilter === u ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-indigo-400'}`}
                  >
                    {u === 'ALL' ? 'All Units' : `Unit ${u}`}
                  </button>
                ))}
              </div>
            </div>

            {/* Smart Hours Selector / Badge */}
            <div>
              <label className="block text-[10px] font-mono font-bold text-[var(--text-muted)] uppercase mb-1">Total Hours</label>
              {hasSyllabusHours ? (
                <div className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                  <Check size={13} /> {syllabusTotalHours}h Allocated by Syllabus
                </div>
              ) : (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {HOURS_OPTIONS.map(h => (
                    <button
                      key={h}
                      onClick={() => setSelectedHours(h)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition-all ${selectedHours === h ? 'bg-indigo-600 border-indigo-500 text-white' : 'border-[var(--border-subtle)] text-[var(--text-secondary)] hover:border-indigo-400'}`}
                    >{h}</button>
                  ))}
                  {selectedHours === 'Custom' && (
                    <input
                      type="number" min={10} max={200}
                      value={customHoursInput} onChange={e => setCustomHoursInput(e.target.value)}
                      placeholder="hrs" className="w-16 px-2 py-1.5 text-xs font-mono border border-indigo-500/40 bg-[var(--bg-subtle)] rounded-xl outline-none text-center"
                    />
                  )}
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2 shrink-0 self-end">
              {isTimelineAllocated && (
                <Button
                  onClick={() => handleGenerate(true)}
                  disabled={isGenerating}
                  className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold rounded-2xl border border-slate-500/40 bg-transparent text-[var(--text-secondary)] hover:border-slate-400"
                  variant="ghost"
                >
                  <RefreshCw size={13} className={isGenerating ? 'animate-spin' : ''} />
                  Regenerate
                </Button>
              )}
              <Button
                onClick={() => handleGenerate(false)}
                disabled={isGenerating || isLoadingTimeline}
                className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-900/40 transition-all"
              >
                {isGenerating ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />}
                {isTimelineAllocated ? 'Load from DB' : 'Generate Timeline'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Status Message ── */}
        <AnimatePresence>
          {statusMsg && (
            <motion.div
              initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              className={`flex items-center gap-2 px-4 py-3 rounded-2xl border text-xs font-mono font-bold ${
                statusMsg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' :
                statusMsg.type === 'error' ? 'bg-red-500/10 border-red-500/30 text-red-400' :
                'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
              }`}
            >
              {statusMsg.type === 'success' ? <CheckCircle2 size={14} /> : statusMsg.type === 'error' ? <AlertCircle size={14} /> : <Database size={14} />}
              {statusMsg.text}
              <button onClick={() => setStatusMsg(null)} className="ml-auto opacity-60 hover:opacity-100">×</button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Loading ── */}
        {isLoadingTimeline && (
          <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-10 flex items-center justify-center gap-3 text-xs font-mono text-[var(--text-muted)]">
            <Database size={16} className="animate-pulse text-indigo-400" />
            Loading timeline from PostgreSQL...
          </div>
        )}

        {/* ── Timeline Content ── */}
        {!isLoadingTimeline && timelineData && stats && (
          <div className="space-y-5">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Total Units', value: stats.totalUnits, color: 'text-indigo-400', icon: <Layers size={14} /> },
                { label: 'Total Hourly Slots', value: stats.totalSlots, color: 'text-cyan-400', icon: <BookOpen size={14} /> },
                { label: 'Total Hours', value: `${stats.totalHours}h`, color: 'text-emerald-400', icon: <Clock size={14} /> },
                { label: 'Avg Hrs / Unit', value: `${stats.avgHoursPerUnit.toFixed(1)}h`, color: 'text-violet-400', icon: <BarChart3 size={14} /> },
                { label: 'Slot Duration', value: `1.0h`, color: 'text-amber-400', icon: <Zap size={14} /> },
                { label: 'Teaching Weeks', value: stats.totalWeeks, color: 'text-rose-400', icon: <CalendarDays size={14} /> },
              ].map(s => (
                <div key={s.label} className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-4 text-center space-y-1">
                  <div className={`flex items-center justify-center gap-1 text-[10px] font-mono font-bold ${s.color} opacity-70`}>
                    {s.icon} {s.label}
                  </div>
                  <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* Course Info */}
            <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] px-5 py-3 flex flex-wrap items-center gap-4 text-xs font-mono">
              <span className="px-3 py-1 rounded-full bg-indigo-600 text-white font-extrabold uppercase">{timelineData.courseCode || timelineData.course_code}</span>
              <span className="font-extrabold text-[var(--text-primary)]">{timelineData.courseTitle || timelineData.course_title}</span>
              <span className="text-[var(--text-muted)]">Generated: {timelineData.generatedAt ? new Date(timelineData.generatedAt).toLocaleDateString() : '—'}</span>
              {isTimelineAllocated && (
                <span className="ml-auto flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Check size={12} /> Saved to PostgreSQL
                </span>
              )}
            </div>

            {/* Unit Timeline Cards */}
            <div className="space-y-3">
              <h2 className="text-sm font-extrabold text-[var(--text-primary)] tracking-tight flex items-center gap-2 px-1">
                <CalendarDays size={15} className="text-indigo-400" />
                Hourly Unit Teaching Schedule ({visibleUnits.length} {visibleUnits.length === 1 ? 'Unit' : 'Units'} Displayed)
              </h2>
              {(visibleUnits || []).map((unit, uIdx) => {
                const uId = unit.unit_id || unit.unitId || String(uIdx);
                const uNum = unit.unit_number ?? unit.unitNumber ?? (uIdx + 1);
                const uTitle = unit.unit_title || unit.unitTitle || `Unit ${uNum}`;
                const uHours = unit.total_unit_hours ?? unit.totalHours ?? unit.allocatedHours ?? 9;
                const schedule: HourlySlot[] = unit.hourly_schedule || unit.hourlySchedule || (unit.topics || []).map((t: any, i: number) => ({
                  hour: t.teachingOrder || i + 1,
                  topic: t.topicTitle || t.topic || `Topic ${i + 1}`,
                  topics_covered: t.topicsCovered || [t.topicTitle || t.topic],
                  bloom_level: t.bloomLevel || t.bloom_level || 'Understand'
                }));
                const isExpanded = !!expandedUnits[uId];

                return (
                  <motion.div
                    key={uId}
                    initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: uIdx * 0.04 }}
                    className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden shadow-md"
                  >
                    {/* Unit Header */}
                    <button
                      onClick={() => toggleUnit(uId)}
                      className="w-full flex items-center justify-between p-5 hover:bg-[var(--bg-hover)] transition-colors group"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="px-2.5 py-0.5 rounded-full bg-indigo-600 text-white text-xs font-extrabold font-mono shrink-0">
                          UNIT {uNum}
                        </span>
                        <span className="font-extrabold text-[var(--text-primary)] text-sm truncate">{uTitle}</span>
                      </div>
                      <div className="flex items-center gap-4 shrink-0 text-xs font-mono">
                        <span className="text-emerald-400 font-bold">{uHours} Hours Total</span>
                        <span className="text-cyan-400 font-bold">{schedule.length} Hourly Slots</span>
                        {isExpanded ? <CollapseIcon size={15} className="text-indigo-400" /> : <ChevronRight size={15} className="text-[var(--text-muted)]" />}
                      </div>
                    </button>

                    {/* Unit Detail */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22 }}
                          className="overflow-hidden border-t border-[var(--border-subtle)]"
                        >
                          <div className="p-5 space-y-3">
                            {/* Hourly Breakdown Table */}
                            <div className="overflow-x-auto rounded-2xl border border-[var(--border-subtle)]">
                              <table className="w-full text-xs font-mono">
                                <thead>
                                  <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                                    <th className="text-left px-4 py-2.5 font-extrabold text-[var(--text-muted)] w-24">Slot</th>
                                    <th className="text-left px-4 py-2.5 font-extrabold text-[var(--text-muted)]">Topic / Subtopic Breakdown</th>
                                    <th className="text-center px-4 py-2.5 font-extrabold text-[var(--text-muted)] w-28">Bloom Level</th>
                                    <th className="text-center px-4 py-2.5 font-extrabold text-[var(--text-muted)] w-24">Duration</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {schedule.map((slot, sIdx) => {
                                    const bloom = slot.bloom_level || 'Understand';

                                    // Sanitize slot topic title if it repeats parent string in parentheses
                                    let displayTopic = (slot.topic || '').trim();
                                    const topicMatch = displayTopic.match(/^(.*?)\s*\((.*?)\)$/);
                                    if (topicMatch && topicMatch[1].trim().toLowerCase() === topicMatch[2].trim().toLowerCase()) {
                                      displayTopic = topicMatch[1].trim();
                                    }

                                    // Clean and deduplicate covered subtopics
                                    const mainTopicLower = displayTopic.toLowerCase();
                                    const rawCovered = slot.topics_covered && slot.topics_covered.length > 0
                                      ? slot.topics_covered
                                      : [displayTopic];

                                    const covered = rawCovered
                                      .map(c => (c || '').trim())
                                      .filter((c, idx, self) => c.length > 0 && self.findIndex(s => s.toLowerCase() === c.toLowerCase()) === idx)
                                      .filter(c => c.toLowerCase() !== mainTopicLower);

                                    return (
                                      <tr key={slot.hour || sIdx}
                                        className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-hover)] transition-colors last:border-0">
                                        <td className="px-4 py-3">
                                          <span className="px-2 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 font-extrabold text-[11px]">
                                            Hour {slot.hour}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-[var(--text-primary)]">
                                          <div className="font-semibold text-xs text-[var(--text-primary)]">{displayTopic}</div>
                                          {covered.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1.5">
                                              {covered.map((sub, subIdx) => (
                                                <span key={subIdx} className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[10px] text-[var(--text-secondary)] font-mono">
                                                  • {sub}
                                                </span>
                                              ))}
                                            </div>
                                          )}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${BLOOM_COLORS[bloom] || BLOOM_COLORS['Understand']}`}>
                                            {bloom}
                                          </span>
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-bold text-[10px]">
                                            1 Hour
                                          </span>
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t-2 border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                                    <td colSpan={2} className="px-4 py-2.5 font-extrabold text-[var(--text-primary)] text-right">Total Unit Teaching Slots:</td>
                                    <td className="px-4 py-2.5 text-center font-extrabold text-indigo-400">{schedule.length} Slots</td>
                                    <td className="px-4 py-2.5 text-center font-extrabold text-emerald-400">{uHours} Hours</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>

            {/* Lab Experiments */}
            {(timelineData.labTimeline || []).length > 0 && (
              <div className="space-y-3">
                <h2 className="text-sm font-extrabold text-[var(--text-primary)] flex items-center gap-2 px-1">
                  <FlaskConical size={15} className="text-cyan-400" /> Lab Timeline
                </h2>
                <div className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] overflow-hidden">
                  <table className="w-full text-xs font-mono">
                    <thead>
                      <tr className="border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]">
                        <th className="text-left px-4 py-2.5 font-extrabold text-[var(--text-muted)]">#</th>
                        <th className="text-left px-4 py-2.5 font-extrabold text-[var(--text-muted)]">Experiment</th>
                        <th className="text-center px-4 py-2.5 font-extrabold text-[var(--text-muted)]">Hours</th>
                        <th className="text-center px-4 py-2.5 font-extrabold text-[var(--text-muted)]">Week</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(timelineData.labTimeline || []).map((lab: any, idx: number) => (
                        <tr key={idx} className="border-b border-[var(--border-subtle)]/50 hover:bg-[var(--bg-hover)] last:border-0">
                          <td className="px-4 py-3 font-bold text-[var(--text-muted)]">{lab.experimentNumber || idx + 1}</td>
                          <td className="px-4 py-3 text-[var(--text-primary)] font-semibold">{lab.experimentTitle}</td>
                          <td className="px-4 py-3 text-center text-cyan-400 font-bold">{lab.estimatedHours || 3}h</td>
                          <td className="px-4 py-3 text-center text-indigo-400 font-bold">W{lab.weekNumber || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Empty State ── */}
        {!isLoadingTimeline && !timelineData && !isGenerating && (
          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-14 text-center space-y-4"
          >
            <CalendarDays className="w-14 h-14 text-indigo-400 mx-auto opacity-60" />
            <h3 className="text-lg font-extrabold text-[var(--text-primary)]">No Timeline Generated Yet</h3>
            <p className="text-xs font-mono text-[var(--text-muted)] max-w-md mx-auto leading-relaxed">
              Select a saved syllabus and click <strong>Generate Timeline</strong>.
              The timeline is generated once and saved permanently to PostgreSQL.
              On future visits, it loads instantly from the database.
            </p>
            <Button
              onClick={() => handleGenerate(false)}
              className="mt-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-lg shadow-indigo-900/40"
            >
              <Sparkles size={14} className="mr-2" /> Generate Timeline
            </Button>
          </motion.div>
        )}
      </div>
    </AppShell>
  );
}
