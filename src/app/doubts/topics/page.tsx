"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useTheme } from '@/components/providers/theme-provider';
import { 
  BookOpen, 
  HelpCircle, 
  Search, 
  Sparkles, 
  ChevronDown, 
  ChevronRight, 
  CheckCircle2, 
  Layers, 
  Volume2, 
  Play, 
  Pause, 
  ArrowRight, 
  Lightbulb, 
  Star, 
  BarChart3, 
  FileText, 
  Tag, 
  ExternalLink,
  BrainCircuit,
  Filter,
  Upload,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface TopicQA {
  id: string;
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  bloomsLevel: string;
  answerSummary: string;
  detailedPoints: string[];
  keyFormulaOrCode?: string;
  audioDuration: string;
}

interface TopicGroup {
  topicId: string;
  topicName: string;
  questions: TopicQA[];
}

interface UnitGroup {
  unitId: string;
  unitTitle: string;
  topics: TopicGroup[];
}

interface CourseTopicsData {
  courseCode: string;
  courseTitle: string;
  units: UnitGroup[];
}

export default function TopicWiseQAPage() {
  const { openSettings } = useTheme();
  
  const [coursesData, setCoursesData] = useState<CourseTopicsData[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const [selectedCourseIndex, setSelectedCourseIndex] = useState(0);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);

  // Load dynamic syllabus and doubt Q&As from localStorage / store
  useEffect(() => {
    try {
      const savedDraft = localStorage.getItem('syllabus_draft_data');
      const savedDoubts = localStorage.getItem('syllabus_doubts_history');
      
      const dynamicCourses: CourseTopicsData[] = [];

      // Extract units and topics from uploaded syllabus draft if available
      if (savedDraft) {
        const parsed = JSON.parse(savedDraft);
        const code = parsed.course?.code || 'SYLLABUS_COURSE';
        const title = parsed.course?.title || 'Extracted Course Syllabus';
        const unitsList = parsed.units || [];

        const units: UnitGroup[] = unitsList.map((u: any, uIdx: number) => {
          const unitId = u.title?.split(':')[0] || `Unit ${uIdx + 1}`;
          const unitTitle = u.title?.includes(':') ? u.title.split(':')[1].trim() : u.title || `Unit ${uIdx + 1}`;
          
          const topics: TopicGroup[] = (u.topics || []).map((t: any, tIdx: number) => ({
            topicId: `top_${uIdx}_${tIdx}`,
            topicName: typeof t === 'string' ? t : t.title || `Topic ${tIdx + 1}`,
            questions: []
          }));

          return { unitId, unitTitle, topics };
        });

        if (units.length > 0) {
          dynamicCourses.push({ courseCode: code, courseTitle: title, units });
        }
      }

      // Map saved doubt items into matching units/topics if available
      if (savedDoubts && dynamicCourses.length > 0) {
        const historyItems = JSON.parse(savedDoubts);
        if (Array.isArray(historyItems)) {
          historyItems.forEach((item: any) => {
            const course = dynamicCourses[0];
            if (course && course.units[0] && course.units[0].topics[0]) {
              course.units[0].topics[0].questions.push({
                id: item.id || `q_${Date.now()}`,
                question: item.question,
                difficulty: 'Medium',
                bloomsLevel: 'Understand',
                answerSummary: item.sections?.[0]?.content || 'AI generated structured explanation.',
                detailedPoints: item.sections?.slice(1).map((s: any) => s.content) || [],
                audioDuration: item.audioDuration || '01:30'
              });
            }
          });
        }
      }

      setCoursesData(dynamicCourses);
    } catch (e) {
      console.error("Failed building dynamic topic Q&As", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Demo Seeder for user preview if no syllabus uploaded yet
  const handleSeedDemoData = () => {
    const demoData: CourseTopicsData[] = [
      {
        courseCode: "CS8691",
        courseTitle: "Artificial Intelligence & Machine Learning",
        units: [
          {
            unitId: "Unit I",
            unitTitle: "ML Basics & Learning Paradigms",
            topics: [
              {
                topicId: "top_1_1",
                topicName: "1.1 Supervised vs Unsupervised Learning",
                questions: [
                  {
                    id: "q_101",
                    question: "What is the primary difference between Supervised and Unsupervised Learning?",
                    difficulty: "Easy",
                    bloomsLevel: "Understand (K2)",
                    answerSummary: "Supervised learning uses labeled training datasets to learn mapping functions y = f(x). Unsupervised learning uncovers inherent structure or distributions in unlabeled data X.",
                    detailedPoints: [
                      "Supervised: Classification (discrete targets) & Regression (continuous targets).",
                      "Unsupervised: Clustering (K-Means, DBSCAN) & Dimensionality Reduction (PCA)."
                    ],
                    keyFormulaOrCode: "Supervised Loss: L(θ) = 1/N ∑ (y_i - f(x_i; θ))^2",
                    audioDuration: "01:30"
                  }
                ]
              }
            ]
          }
        ]
      }
    ];
    setCoursesData(demoData);
  };

  const currentCourse = coursesData[selectedCourseIndex] || null;

  const toggleQuestion = (id: string) => {
    setExpandedQuestionId(prev => prev === id ? null : id);
  };

  const toggleAudio = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPlayingAudioId(prev => prev === id ? null : id);
  };

  // Filter units & topics
  const filteredUnits = currentCourse?.units.map(unit => {
    const matchingTopics = unit.topics.map(topic => {
      const matchingQuestions = topic.questions.filter(q => 
        q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        q.answerSummary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        topic.topicName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      return { ...topic, questions: matchingQuestions };
    }).filter(topic => topic.questions.length > 0 || searchQuery === '');

    return { ...unit, topics: matchingTopics };
  }).filter(unit => (selectedUnitId === 'ALL' || unit.unitId === selectedUnitId) && unit.topics.length > 0) || [];

  return (
    <AppShell>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                  <BookOpen size={14} /> Topic-wise Q&amp;A Repository
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  Syllabus Topic &amp; Concept Q&amp;A
                </h1>
                <p className="mt-2 text-[var(--text-secondary)] text-sm sm:text-base max-w-2xl">
                  Explore organized questions, Bloom’s cognitive classifications, formulas, and AI explanations grouped unit by unit.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={openSettings}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-semibold transition-all"
                  title="Open Settings"
                >
                  <Settings size={16} className="text-amber-500" /> Settings
                </button>
                <Link
                  href="/doubts"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-black font-bold text-sm shadow-md"
                >
                  <Sparkles size={16} /> Open AI Resolver
                </Link>
                <Link
                  href="/doubts/history"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-semibold transition-all"
                >
                  <HelpCircle size={16} /> Doubts History
                </Link>
              </div>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col lg:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3 w-full lg:w-auto">
              <span className="text-xs font-mono font-bold text-[var(--text-muted)] uppercase whitespace-nowrap">Course:</span>
              {coursesData.length > 0 ? (
                <select
                  value={selectedCourseIndex}
                  onChange={(e) => {
                    setSelectedCourseIndex(Number(e.target.value));
                    setSelectedUnitId('ALL');
                  }}
                  className="w-full lg:w-80 bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs sm:text-sm font-bold text-amber-500 focus:outline-none focus:border-amber-500"
                >
                  {coursesData.map((c, idx) => (
                    <option key={c.courseCode} value={idx}>
                      {c.courseCode} — {c.courseTitle}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-xs text-[var(--text-muted)] italic">No Syllabus Uploaded Yet</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <div className="relative flex-1 lg:w-72">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={16} />
                <input
                  type="text"
                  placeholder="Search questions or topics..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500"
                />
              </div>

              {currentCourse && (
                <select
                  value={selectedUnitId}
                  onChange={(e) => setSelectedUnitId(e.target.value)}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Units</option>
                  {currentCourse.units.map(u => (
                    <option key={u.unitId} value={u.unitId}>{u.unitId}: {u.unitTitle}</option>
                  ))}
                </select>
              )}
            </div>
          </div>

          {/* Q&A Content or Clean Empty State */}
          {!isLoaded ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)] font-mono animate-pulse">
              Loading syllabus topics...
            </div>
          ) : !currentCourse || filteredUnits.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
              <BookOpen size={48} className="mx-auto text-amber-500/40" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {!currentCourse ? "No Topic-wise Q&As Available Yet" : "No Matching Questions Found"}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                {!currentCourse 
                  ? "Upload a syllabus PDF or ask questions in the AI Doubts Resolver to populate unit and topic Q&As."
                  : "No topic Q&As match your active search keyword or unit filter."}
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 pt-3">
                <Link
                  href="/upload"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 text-white hover:bg-slate-700 text-xs font-bold shadow-md"
                >
                  <Upload size={14} /> Upload Syllabus PDF
                </Link>
                <Link
                  href="/doubts"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-xs shadow-md"
                >
                  <Sparkles size={14} /> Ask AI Doubt
                </Link>
                {!currentCourse && (
                  <button
                    onClick={handleSeedDemoData}
                    className="px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] text-xs font-semibold"
                  >
                    Load Sample Syllabus Q&amp;A
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredUnits.map((unit) => (
                <div key={unit.unitId} className="space-y-4">
                  <div className="flex items-center gap-3 border-b border-[var(--border-subtle)] pb-2">
                    <span className="px-3 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold uppercase">
                      {unit.unitId}
                    </span>
                    <h2 className="text-lg font-bold text-[var(--text-primary)]">{unit.unitTitle}</h2>
                  </div>

                  <div className="space-y-4">
                    {unit.topics.map((topic) => (
                      <div key={topic.topicId} className="rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] overflow-hidden shadow-md">
                        <div className="p-4 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] flex items-center justify-between gap-4">
                          <h3 className="text-sm sm:text-base font-bold text-amber-500 flex items-center gap-2">
                            <Layers size={16} /> {topic.topicName}
                          </h3>
                          <span className="px-2.5 py-0.5 rounded-full bg-[var(--bg-card)] text-[var(--text-muted)] text-xs font-semibold">
                            {topic.questions.length} Q&amp;A Items
                          </span>
                        </div>

                        {topic.questions.length === 0 ? (
                          <div className="p-6 text-center text-xs text-[var(--text-muted)] italic">
                            No resolved doubts logged for this topic yet. Ask AI in the Resolver workspace to add questions.
                          </div>
                        ) : (
                          <div className="divide-y divide-[var(--border-subtle)]">
                            {topic.questions.map((q) => {
                              const isExpanded = expandedQuestionId === q.id;
                              const isPlaying = playingAudioId === q.id;

                              return (
                                <div key={q.id} className="p-4 sm:p-5 hover:bg-[var(--bg-subtle)]/50 transition-colors">
                                  <div 
                                    onClick={() => toggleQuestion(q.id)}
                                    className="flex items-start justify-between gap-4 cursor-pointer group"
                                  >
                                    <div className="space-y-1 flex-1">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-amber-500 text-[11px] font-bold">
                                          {q.difficulty}
                                        </span>
                                        <span className="px-2 py-0.5 rounded bg-[var(--bg-subtle)] text-[var(--text-muted)] text-[11px]">
                                          {q.bloomsLevel}
                                        </span>
                                      </div>

                                      <h4 className="text-sm sm:text-base font-bold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors pt-1">
                                        {q.question}
                                      </h4>
                                    </div>

                                    <div className="flex items-center gap-2">
                                      <button
                                        onClick={(e) => toggleAudio(q.id, e)}
                                        className="p-2 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                                        title="Listen to Voice Explanation"
                                      >
                                        {isPlaying ? <Pause size={14} /> : <Play size={14} />}
                                      </button>
                                      <ChevronDown size={16} className={`transform transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                                    </div>
                                  </div>

                                  <AnimatePresence>
                                    {isExpanded && (
                                      <motion.div
                                        initial={{ height: 0, opacity: 0 }}
                                        animate={{ height: "auto", opacity: 1 }}
                                        exit={{ height: 0, opacity: 0 }}
                                        className="overflow-hidden pt-4 space-y-3 text-xs sm:text-sm text-[var(--text-secondary)]"
                                      >
                                        <div className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                                          <div className="font-bold text-amber-500 flex items-center gap-1.5">
                                            <BrainCircuit size={14} /> AI Solution Summary
                                          </div>
                                          <p className="leading-relaxed">{q.answerSummary}</p>
                                        </div>

                                        {q.keyFormulaOrCode && (
                                          <div className="p-3 rounded-xl bg-[var(--bg-subtle)] border border-amber-500/30 font-mono text-amber-500 text-xs">
                                            {q.keyFormulaOrCode}
                                          </div>
                                        )}

                                        <div className="pt-2 flex items-center justify-between text-xs">
                                          <Link
                                            href={`/doubts?query=${encodeURIComponent(q.question)}`}
                                            className="text-amber-500 font-bold hover:underline flex items-center gap-1"
                                          >
                                            <Sparkles size={13} /> Ask AI follow-up <ArrowRight size={12} />
                                          </Link>
                                        </div>
                                      </motion.div>
                                    )}
                                  </AnimatePresence>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
