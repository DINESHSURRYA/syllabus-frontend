"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useTheme } from '@/components/providers/theme-provider';
import { 
  ScrollText, 
  HelpCircle, 
  Search, 
  Filter, 
  Sparkles, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Star, 
  Volume2, 
  Play, 
  Pause, 
  ExternalLink, 
  ChevronRight, 
  ArrowRight, 
  Trash2, 
  Download, 
  Layers, 
  BrainCircuit, 
  FileText, 
  X, 
  Lightbulb, 
  BarChart3,
  Bookmark,
  Share2,
  RefreshCw,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface DoubtHistoryItem {
  id: string;
  question: string;
  courseCode: string;
  courseTitle: string;
  unit: string;
  topic: string;
  timestamp: string;
  status: 'resolved' | 'pending';
  isBookmarked: boolean;
  audioDuration: string;
  hasAudio: boolean;
  views: number;
  sections: {
    title: string;
    content: string;
    highlights?: string[];
  }[];
  sources: {
    document: string;
    snippet: string;
    relevance: string;
  }[];
}

export default function DoubtsHistoryPage() {
  const { openSettings } = useTheme();
  const [historyItems, setHistoryItems] = useState<DoubtHistoryItem[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [selectedItem, setSelectedItem] = useState<DoubtHistoryItem | null>(null);

  // Audio Playback state
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  // Load history dynamically from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem('syllabus_doubts_history');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setHistoryItems(parsed);
        }
      }
    } catch (e) {
      console.error("Failed loading doubt history", e);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Save history to localStorage on mutation
  const persistHistory = (newItems: DoubtHistoryItem[]) => {
    setHistoryItems(newItems);
    try {
      localStorage.setItem('syllabus_doubts_history', JSON.stringify(newItems));
    } catch (e) {
      console.error("Failed persisting history", e);
    }
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historyItems.map(item => 
      item.id === id ? { ...item, isBookmarked: !item.isBookmarked } : item
    );
    persistHistory(updated);
  };

  const deleteItem = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = historyItems.filter(item => item.id !== id);
    persistHistory(updated);
    if (selectedItem?.id === id) {
      setSelectedItem(null);
    }
  };

  const handlePlayAudio = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (playingId === id) {
      setIsPlaying(!isPlaying);
    } else {
      setPlayingId(id);
      setIsPlaying(true);
    }
  };

  // Extract unique course codes for filtering
  const courseOptions = Array.from(new Set(historyItems.map(i => i.courseCode)));

  // Filter items based on search and dropdown selections
  const filteredItems = historyItems.filter(item => {
    const matchesSearch = 
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.courseCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.topic.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCourse = selectedCourse === 'ALL' || item.courseCode === selectedCourse;
    const matchesStatus = 
      selectedStatus === 'ALL' || 
      (selectedStatus === 'BOOKMARKED' && item.isBookmarked) ||
      (selectedStatus === 'AUDIO' && item.hasAudio);

    return matchesSearch && matchesCourse && matchesStatus;
  });

  const totalDoubts = historyItems.length;
  const bookmarkedCount = historyItems.filter(i => i.isBookmarked).length;
  const audioCount = historyItems.filter(i => i.hasAudio).length;

  return (
    <AppShell>
      <div className="min-h-screen bg-[var(--bg-primary)] text-[var(--text-primary)] p-4 sm:p-6 lg:p-8 transition-colors duration-200">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-xl">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-xs font-mono font-bold uppercase tracking-wider mb-3">
                  <ScrollText size={14} /> Doubts History &amp; Logs
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold text-[var(--text-primary)] tracking-tight">
                  Past Questions &amp; AI Explanations
                </h1>
                <p className="mt-2 text-[var(--text-secondary)] text-sm sm:text-base max-w-2xl">
                  Review your resolved queries, interactive voice explanations, RAG textbook citations, and bookmarked solution cards across all your enrolled courses.
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
                  <Sparkles size={16} /> Ask New Doubt
                </Link>
                <Link
                  href="/doubts/topics"
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:bg-[var(--bg-hover)] text-[var(--text-primary)] text-sm font-semibold transition-all"
                >
                  <BookOpen size={16} /> Topic Q&amp;A
                </Link>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-semibold">
                <span>Total Doubts Asked</span>
                <HelpCircle size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">{totalDoubts}</div>
              <div className="text-xs text-emerald-500 mt-1 flex items-center gap-1">
                <CheckCircle2 size={12} /> {totalDoubts > 0 ? '100% Resolved by AI' : 'No queries yet'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-semibold">
                <span>Bookmarked Solutions</span>
                <Star size={16} className="text-amber-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">{bookmarkedCount}</div>
              <div className="text-xs text-[var(--text-muted)] mt-1">Saved for revision</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-semibold">
                <span>Audio Explanations</span>
                <Volume2 size={16} className="text-indigo-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">{audioCount}</div>
              <div className="text-xs text-indigo-500 mt-1">TTS Voice Available</div>
            </div>

            <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)]">
              <div className="flex items-center justify-between text-[var(--text-muted)] text-xs font-semibold">
                <span>Avg Resolution Time</span>
                <Clock size={16} className="text-emerald-500" />
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)] mt-2">1.2s</div>
              <div className="text-xs text-emerald-500 mt-1">Instant RAG synthesis</div>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-xl bg-[var(--bg-card)] border border-[var(--border-subtle)] flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" size={18} />
              <input
                type="text"
                placeholder="Search history by question, course, or topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl pl-10 pr-4 py-2 text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <div className="flex items-center gap-2">
                <Filter size={16} className="text-[var(--text-muted)]" />
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">All Courses</option>
                  {courseOptions.map(code => (
                    <option key={code} value={code}>{code}</option>
                  ))}
                </select>
              </div>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-[var(--bg-secondary)] border border-[var(--border-subtle)] rounded-xl px-3 py-2 text-xs font-semibold text-[var(--text-primary)] focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="BOOKMARKED">Bookmarked Only</option>
                <option value="AUDIO">Audio Voice Available</option>
              </select>

              <button
                onClick={() => { setSearchQuery(''); setSelectedCourse('ALL'); setSelectedStatus('ALL'); }}
                className="p-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="Reset Filters"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          {/* History List or Clean Empty State */}
          {!isLoaded ? (
            <div className="p-12 text-center text-xs text-[var(--text-muted)] font-mono animate-pulse">
              Loading doubt history...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="p-12 text-center rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] space-y-3">
              <HelpCircle size={48} className="mx-auto text-amber-500/40" />
              <h3 className="text-lg font-bold text-[var(--text-primary)]">
                {historyItems.length === 0 ? "No Doubts Asked Yet" : "No Matching Doubts Found"}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] max-w-md mx-auto">
                {historyItems.length === 0 
                  ? "Your asked questions, AI explanations, voice audio synthesis, and cited RAG sources will appear here automatically."
                  : "No past questions match your current search query or active filter selections."}
              </p>

              <div className="pt-2">
                {historyItems.length === 0 ? (
                  <Link
                    href="/doubts"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-black font-bold text-xs shadow-md"
                  >
                    <Sparkles size={16} /> Ask Your First Doubt
                  </Link>
                ) : (
                  <button
                    onClick={() => { setSearchQuery(''); setSelectedCourse('ALL'); setSelectedStatus('ALL'); }}
                    className="px-4 py-2 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold"
                  >
                    Clear Search Filters
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredItems.map((item) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => setSelectedItem(item)}
                  className="group relative rounded-2xl bg-[var(--bg-card)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] hover:border-amber-500/50 p-5 sm:p-6 transition-all duration-200 shadow-md cursor-pointer"
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold">
                          {item.courseCode}
                        </span>
                        <span className="px-2 py-0.5 rounded-md bg-[var(--bg-subtle)] text-[var(--text-muted)] text-xs">
                          {item.unit} — {item.topic}
                        </span>
                        <span className="text-[var(--text-muted)] text-xs flex items-center gap-1 ml-auto sm:ml-0">
                          <Clock size={12} /> {item.timestamp}
                        </span>
                      </div>

                      <h3 className="text-base sm:text-lg font-bold text-[var(--text-primary)] group-hover:text-amber-500 transition-colors leading-snug">
                        {item.question}
                      </h3>

                      {item.sections?.[0]?.content && (
                        <p className="text-xs sm:text-sm text-[var(--text-secondary)] line-clamp-2">
                          {item.sections[0].content}
                        </p>
                      )}

                      <div className="flex flex-wrap items-center gap-4 pt-2 text-xs text-[var(--text-muted)]">
                        {item.hasAudio && (
                          <div 
                            onClick={(e) => handlePlayAudio(item.id, e)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/10 border border-indigo-500/30 text-indigo-500 font-semibold"
                          >
                            {playingId === item.id && isPlaying ? (
                              <Pause size={12} className="text-indigo-500" />
                            ) : (
                              <Play size={12} className="text-indigo-500" />
                            )}
                            <span>Audio ({item.audioDuration})</span>
                          </div>
                        )}

                        <span className="flex items-center gap-1">
                          <FileText size={12} /> {item.sources?.length || 0} Sources
                        </span>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center justify-end gap-2 pt-2 sm:pt-0 border-t sm:border-t-0 border-[var(--border-subtle)]">
                      <button
                        onClick={(e) => toggleBookmark(item.id, e)}
                        className={`p-2 rounded-xl border transition-colors ${
                          item.isBookmarked 
                            ? 'bg-amber-500/15 border-amber-500/40 text-amber-500' 
                            : 'bg-[var(--bg-subtle)] border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                        }`}
                        title={item.isBookmarked ? "Remove Bookmark" : "Bookmark Doubt"}
                      >
                        <Star size={16} className={item.isBookmarked ? "fill-amber-500" : ""} />
                      </button>

                      <button
                        onClick={(e) => deleteItem(item.id, e)}
                        className="p-2 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:text-red-500 transition-colors"
                        title="Delete from History"
                      >
                        <Trash2 size={16} />
                      </button>

                      <div className="inline-flex items-center gap-1 text-xs text-amber-500 font-bold group-hover:translate-x-1 transition-transform ml-auto sm:ml-0">
                        View <ChevronRight size={14} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Solution Modal / Drawer */}
          <AnimatePresence>
            {selectedItem && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-md"
                onClick={() => setSelectedItem(null)}
              >
                <motion.div
                  initial={{ scale: 0.95, opacity: 0, y: 20 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  exit={{ scale: 0.95, opacity: 0, y: 20 }}
                  onClick={(e) => e.stopPropagation()}
                  className="relative w-full max-w-3xl max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--bg-card)] border border-[var(--border-subtle)] p-6 sm:p-8 shadow-2xl space-y-6 text-[var(--text-primary)]"
                >
                  <button
                    onClick={() => setSelectedItem(null)}
                    className="absolute top-4 right-4 p-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X size={18} />
                  </button>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-500 text-xs font-bold">
                        {selectedItem.courseCode} — {selectedItem.courseTitle}
                      </span>
                      <span className="px-3 py-1 rounded-md bg-[var(--bg-subtle)] text-[var(--text-muted)] text-xs font-medium">
                        {selectedItem.unit} • {selectedItem.topic}
                      </span>
                    </div>

                    <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] leading-snug">
                      {selectedItem.question}
                    </h2>

                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      <span>Asked on {selectedItem.timestamp}</span>
                      <span>•</span>
                      <span className="text-emerald-500 font-semibold flex items-center gap-1">
                        <CheckCircle2 size={12} /> AI RAG Solution
                      </span>
                    </div>
                  </div>

                  {/* Sections */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)] flex items-center gap-2">
                      <BrainCircuit size={16} className="text-amber-500" /> Explanation Breakdown
                    </h3>

                    {selectedItem.sections?.map((sec, idx) => (
                      <div key={idx} className="p-4 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] space-y-2">
                        <h4 className="font-bold text-amber-500 text-sm">{sec.title}</h4>
                        <p className="text-sm text-[var(--text-secondary)] whitespace-pre-line leading-relaxed">{sec.content}</p>
                      </div>
                    ))}
                  </div>

                  <div className="pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between">
                    <Link
                      href={`/doubts?query=${encodeURIComponent(selectedItem.question)}`}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/15 text-amber-500 border border-amber-500/30 text-xs font-bold"
                    >
                      <Sparkles size={14} /> Re-ask in Resolver
                    </Link>

                    <button
                      onClick={() => setSelectedItem(null)}
                      className="px-4 py-2 rounded-xl bg-[var(--bg-subtle)] text-[var(--text-primary)] text-xs font-bold"
                    >
                      Close Window
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </AppShell>
  );
}
