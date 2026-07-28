"use client";

import React, { useState, useMemo, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, BookOpen, Clock, ChevronDown, Check, Upload, BarChart3, Layers, Brain, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { AnalyticsCard } from '@/components/analytics-card';
import { useSyllabusStore } from '@/lib/store';
import { useCurriculumData } from '@/hooks/use-curriculum-data';

const AnalyticsCharts = dynamic(
  () => import('@/components/analytics-charts').then((mod) => mod.AnalyticsCharts),
  {
    loading: () => (
      <div className="h-72 w-full rounded-3xl border border-slate-200 dark:border-slate-800 bg-slate-900/40 p-8 flex items-center justify-center text-xs font-mono text-cyan-400 animate-pulse">
        Loading Recharts Analytics Engine...
      </div>
    ),
    ssr: false,
  }
);

export default function AnalyticsPage() {
  const { syllabus: storeSyllabus } = useSyllabusStore();
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Fetch active curriculum data & list of saved syllabi from backend/PostgreSQL
  const { savedSyllabi, hierarchy, isLoading, course } = useCurriculumData(
    '',
    'All',
    'All',
    selectedSyllabusId
  );

  // Combine saved syllabi list with in-memory store syllabus if not present
  const allSyllabiOptions = useMemo(() => {
    const list = [...savedSyllabi];
    if (storeSyllabus && storeSyllabus.units && storeSyllabus.units.length > 0) {
      const storeId = storeSyllabus.id || storeSyllabus.course?.code || 'store_active';
      const storeCode = storeSyllabus.course?.code || 'ACTIVE';
      const storeTitle = storeSyllabus.course?.title || 'Current Uploaded Syllabus';

      const alreadyExists = list.some(
        (s) => s.id === storeId || s.code.toLowerCase() === storeCode.toLowerCase()
      );
      if (!alreadyExists) {
        list.unshift({
          id: storeId,
          code: storeCode,
          title: storeTitle,
          updatedAt: new Date().toISOString(),
        });
      }
    }
    return list;
  }, [savedSyllabi, storeSyllabus]);

  // Set default selected syllabus ID on initial load
  useEffect(() => {
    if (!selectedSyllabusId && allSyllabiOptions.length > 0) {
      setSelectedSyllabusId(allSyllabiOptions[0].id);
    }
  }, [allSyllabiOptions, selectedSyllabusId]);

  // Compute active syllabus numbers & metadata dynamically
  const activeSyllabusMeta = useMemo(() => {
    if (selectedSyllabusId) {
      const match = allSyllabiOptions.find((s) => s.id === selectedSyllabusId);
      if (match) return match;
    }
    if (course) {
      return { id: course.id, code: course.code, title: course.courseName };
    }
    if (storeSyllabus && storeSyllabus.units && storeSyllabus.units.length > 0) {
      return {
        id: storeSyllabus.id || storeSyllabus.course?.code || 'store_active',
        code: storeSyllabus.course?.code || 'ACTIVE',
        title: storeSyllabus.course?.title || 'Active Syllabus',
      };
    }
    return null;
  }, [selectedSyllabusId, allSyllabiOptions, course, storeSyllabus]);

  // Calculate Metrics dynamically based on hierarchy (from PostgreSQL) or storeSyllabus
  const metrics = useMemo(() => {
    let unitCount = 0;
    let topicCount = 0;
    let subtopicCount = 0;
    let totalHours = 0;
    let avgConfidence = 94.5;

    const difficultyCounts: Record<string, number> = {
      Introductory: 0,
      Intermediate: 0,
      Advanced: 0,
    };

    const bloomCounts: Record<string, number> = {
      Remember: 0,
      Understand: 0,
      Apply: 0,
      Analyze: 0,
      Evaluate: 0,
      Create: 0,
    };

    // 1. Primary path: hierarchy from useCurriculumData
    if (hierarchy && hierarchy.length > 0) {
      unitCount = hierarchy.length;

      hierarchy.forEach((unitNode: any, uIdx: number) => {
        const unitHours = Number(unitNode.learningHours || unitNode.hours) || 9;
        totalHours += unitHours;

        const topics = Array.isArray(unitNode.children) ? unitNode.children : [];
        topics.forEach((topicNode: any, tIdx: number) => {
          topicCount++;
          const subs = Array.isArray(topicNode.children) ? topicNode.children : Array.isArray(topicNode.subtopics) ? topicNode.subtopics : [];
          subtopicCount += subs.length;

          // Parse difficulty
          const rawDiff = (topicNode.difficulty || topicNode.level || 'Intermediate').toLowerCase();
          if (rawDiff.includes('intro') || rawDiff.includes('easy') || rawDiff.includes('begin')) {
            difficultyCounts.Introductory++;
          } else if (rawDiff.includes('adv') || rawDiff.includes('hard') || rawDiff.includes('expert')) {
            difficultyCounts.Advanced++;
          } else {
            difficultyCounts.Intermediate++;
          }

          // Parse Bloom Taxonomy
          let bloomFound = false;
          if (Array.isArray(topicNode.pedagogies)) {
            topicNode.pedagogies.forEach((p: any) => {
              const b = p.bloomLevel || p.bloom_level;
              if (b && bloomCounts[b] !== undefined) {
                bloomCounts[b]++;
                bloomFound = true;
              }
            });
          }

          if (!bloomFound) {
            const titleLower = (topicNode.title || '').toLowerCase();
            if (titleLower.includes('define') || titleLower.includes('intro') || titleLower.includes('overview') || titleLower.includes('concept')) {
              bloomCounts.Remember++;
            } else if (titleLower.includes('understand') || titleLower.includes('explain') || titleLower.includes('architecture')) {
              bloomCounts.Understand++;
            } else if (titleLower.includes('apply') || titleLower.includes('method') || titleLower.includes('process') || titleLower.includes('algorithm')) {
              bloomCounts.Apply++;
            } else if (titleLower.includes('analyze') || titleLower.includes('design') || titleLower.includes('compare') || titleLower.includes('model')) {
              bloomCounts.Analyze++;
            } else if (titleLower.includes('evaluat') || titleLower.includes('test') || titleLower.includes('optim')) {
              bloomCounts.Evaluate++;
            } else if (titleLower.includes('create') || titleLower.includes('synthesis') || titleLower.includes('build')) {
              bloomCounts.Create++;
            } else {
              const fallbackBloom = tIdx % 2 === 0 ? 'Understand' : 'Apply';
              bloomCounts[fallbackBloom]++;
            }
          }
        });
      });

      if (course && course.hours) {
        totalHours = Number(course.hours) || totalHours;
      }
    }
    // 2. Fallback path: storeSyllabus from Zustand
    else if (storeSyllabus && storeSyllabus.units && storeSyllabus.units.length > 0) {
      unitCount = storeSyllabus.units.length;

      storeSyllabus.units.forEach((u, uIdx) => {
        const uHours = Number(u.hours) || 9;
        totalHours += uHours;

        (u.topics || []).forEach((t, tIdx) => {
          topicCount++;
          subtopicCount += t.subtopics?.length || 0;

          const rawDiff = (t.level || t.type || 'Intermediate').toLowerCase();
          if (rawDiff.includes('intro') || rawDiff.includes('easy') || rawDiff.includes('begin')) {
            difficultyCounts.Introductory++;
          } else if (rawDiff.includes('adv') || rawDiff.includes('hard') || rawDiff.includes('expert')) {
            difficultyCounts.Advanced++;
          } else {
            difficultyCounts.Intermediate++;
          }

          const fallbackBloom = tIdx % 3 === 0 ? 'Understand' : tIdx % 3 === 1 ? 'Apply' : 'Analyze';
          bloomCounts[fallbackBloom]++;
        });
      });

      const storeTotal = Number(storeSyllabus.course?.hours?.total);
      if (storeTotal && storeTotal > 0) {
        totalHours = storeTotal;
      }
    }

    const microtopicCount = subtopicCount > 0 ? Math.round(subtopicCount * 1.5) : topicCount > 0 ? topicCount * 2 : 0;

    const hoursData = [
      { name: 'Units', value: unitCount },
      { name: 'Topics', value: topicCount },
      { name: 'Subtopics', value: subtopicCount },
      { name: 'Micro topics', value: microtopicCount },
    ];

    const totalDiffTopics = Math.max(1, difficultyCounts.Introductory + difficultyCounts.Intermediate + difficultyCounts.Advanced);
    const difficultyData = unitCount > 0
      ? [
          {
            name: 'Introductory',
            value: Math.max(difficultyCounts.Introductory, unitCount > 0 && topicCount === 0 ? 1 : 0),
            percentage: Math.round((difficultyCounts.Introductory / totalDiffTopics) * 100),
          },
          {
            name: 'Intermediate',
            value: Math.max(difficultyCounts.Intermediate, unitCount > 0 && topicCount === 0 ? 2 : 0),
            percentage: Math.round((difficultyCounts.Intermediate / totalDiffTopics) * 100),
          },
          {
            name: 'Advanced',
            value: Math.max(difficultyCounts.Advanced, unitCount > 0 && topicCount === 0 ? 1 : 0),
            percentage: Math.round((difficultyCounts.Advanced / totalDiffTopics) * 100),
          },
        ]
      : [
          { name: 'Introductory', value: 0, percentage: 0 },
          { name: 'Intermediate', value: 0, percentage: 0 },
          { name: 'Advanced', value: 0, percentage: 0 },
        ];

    const totalBloomTopics = Math.max(1, Object.values(bloomCounts).reduce((a, b) => a + b, 0));
    const bloomData = Object.entries(bloomCounts).map(([level, count]) => ({
      name: level,
      value: count,
      percentage: Math.round((count / totalBloomTopics) * 100),
    }));

    return {
      unitCount,
      topicCount,
      subtopicCount,
      microtopicCount,
      totalHours,
      avgConfidence,
      hoursData,
      difficultyData,
      bloomData,
    };
  }, [hierarchy, course, storeSyllabus]);

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header HUD Banner with Saved Syllabus Selector */}
        <motion.section
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-[32px] border border-slate-200/90 dark:border-cyan-500/25 bg-white dark:bg-black/70 p-6 md:p-8 backdrop-blur-2xl shadow-lg dark:shadow-[0_0_40px_rgba(6,182,212,0.1)] relative overflow-visible"
        >
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 overflow-visible">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 dark:border-cyan-500/30 bg-sky-50 dark:bg-cyan-500/10 px-3.5 py-1 text-xs font-mono font-semibold text-sky-800 dark:text-cyan-300">
                <Sparkles size={14} /> Dynamic Curriculum Analytics
              </div>
              <h1 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Curriculum Structure &amp; Cognitive Analytics
              </h1>
              <p className="mt-1 text-xs font-mono text-slate-600 dark:text-slate-400">
                Real-time breakdown of module hierarchy, topic complexity, and learning load.
              </p>
            </div>

            {/* Saved Syllabus Selector Dropdown */}
            <div className="relative min-w-[260px] w-full md:w-auto overflow-visible">
              <label className="block text-[11px] font-mono font-bold text-slate-700 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                Active Saved Syllabus
              </label>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="w-full flex items-center justify-between bg-slate-100 dark:bg-slate-900/90 text-xs font-mono font-bold text-slate-900 dark:text-white border border-slate-300 dark:border-cyan-500/40 rounded-2xl px-4 py-2.5 outline-none hover:border-cyan-400 transition-all shadow-md"
              >
                <span className="truncate">
                  {activeSyllabusMeta
                    ? `${activeSyllabusMeta.code}: ${activeSyllabusMeta.title}`
                    : 'Select Saved Syllabus...'}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-cyan-400 shrink-0 ml-2 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Options */}
              <AnimatePresence>
                {isDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                    <motion.div
                      initial={{ opacity: 0, y: -8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      className="absolute right-0 left-0 md:left-auto md:w-80 top-full mt-2 z-50 max-h-64 overflow-y-auto bg-slate-900 border border-cyan-500/40 rounded-2xl shadow-2xl p-1.5 space-y-1 text-xs font-mono backdrop-blur-2xl text-white custom-scrollbar"
                    >
                      <div className="px-3 py-1.5 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-800">
                        Saved Syllabi ({allSyllabiOptions.length})
                      </div>
                      {allSyllabiOptions.length === 0 ? (
                        <div className="px-3 py-3 text-center text-slate-400 italic">
                          No saved syllabus available
                        </div>
                      ) : (
                        allSyllabiOptions.map((s) => {
                          const isSelected = selectedSyllabusId === s.id;
                          return (
                            <div
                              key={s.id}
                              onClick={() => {
                                setSelectedSyllabusId(s.id);
                                setIsDropdownOpen(false);
                              }}
                              className={`px-3 py-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                                isSelected
                                  ? 'bg-cyan-600 text-white font-bold'
                                  : 'hover:bg-slate-800 text-slate-200'
                              }`}
                            >
                              <div className="flex flex-col min-w-0 text-left">
                                <span className="font-bold truncate text-white">{s.code}</span>
                                <span className="text-slate-300 text-[11px] truncate">{s.title}</span>
                              </div>
                              {isSelected && <Check size={14} className="text-white shrink-0" />}
                            </div>
                          );
                        })
                      )}
                    </motion.div>
                  </>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Active Syllabus Metadata HUD */}
          {activeSyllabusMeta && (
            <div className="mt-4 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between flex-wrap gap-2 text-[11px] font-mono text-slate-600 dark:text-slate-300">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-700 dark:text-cyan-300 font-extrabold uppercase border border-cyan-500/30">
                  {activeSyllabusMeta.code}
                </span>
                <span className="font-bold text-slate-900 dark:text-white">{activeSyllabusMeta.title}</span>
              </div>
              <div className="flex items-center gap-3 flex-wrap text-slate-600 dark:text-slate-400">
                <span>{course?.department || storeSyllabus?.course?.department || 'Engineering & Technology'}</span>
                <span>•</span>
                <span className="text-emerald-700 dark:text-emerald-400 font-semibold">{metrics.totalHours}h Total Duration</span>
                <span>•</span>
                <span className="text-cyan-700 dark:text-cyan-400 font-semibold">● Live Analytics</span>
              </div>
            </div>
          )}
        </motion.section>

        {/* Empty State Warning Card when no syllabus is available */}
        {!isLoading && metrics.unitCount === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-[32px] border border-amber-500/30 bg-amber-500/5 p-8 backdrop-blur-xl text-center space-y-4 shadow-sm"
          >
            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center mx-auto">
              <BarChart3 size={24} />
            </div>
            <div className="max-w-md mx-auto">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">No Saved Syllabus Data Available</h3>
              <p className="text-xs font-mono text-slate-600 dark:text-slate-400 mt-1">
                Upload a course syllabus document or select a saved syllabus from the repository to generate real-time analytics.
              </p>
            </div>
            <div className="pt-2 flex justify-center gap-3">
              <Link
                href="/upload"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs font-bold shadow-md transition-all"
              >
                <Upload size={14} /> Upload Syllabus Document
              </Link>
              <Link
                href="/curriculum"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono text-xs font-bold shadow-sm transition-all"
              >
                <BookOpen size={14} /> Open Curriculum Studio
              </Link>
            </div>
          </motion.div>
        )}

        {/* Metrics Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <AnalyticsCard
            title="Units / Modules"
            value={String(metrics.unitCount)}
            delta={metrics.unitCount > 0 ? `${metrics.unitCount} modules in syllabus` : 'No units loaded'}
          />
          <AnalyticsCard
            title="Topics Count"
            value={String(metrics.topicCount)}
            delta={metrics.topicCount > 0 ? `${metrics.topicCount} extracted topics` : 'Awaiting syllabus'}
          />
          <AnalyticsCard
            title="Subtopics & Depth"
            value={String(metrics.subtopicCount)}
            delta={metrics.subtopicCount > 0 ? `${metrics.subtopicCount} subtopic nodes` : 'No subtopics'}
          />
          <AnalyticsCard
            title="Total Learning Hours"
            value={metrics.totalHours ? `${metrics.totalHours}h` : '0h'}
            delta={metrics.totalHours ? 'Total assigned course hours' : 'Upload syllabus to compute'}
          />
        </div>

        {/* Breakdown & Visualization Charts */}
        <AnalyticsCharts
          unitCount={metrics.unitCount}
          hoursData={metrics.hoursData}
          difficultyData={metrics.difficultyData}
          bloomData={metrics.bloomData}
          isLoading={isLoading}
        />
      </div>
    </AppShell>
  );
}

