"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers,
  Search,
  Filter,
  Download,
  Copy,
  Trash2,
  ArrowRight,
  Plus,
  Eye,
  Calendar,
  Tag,
  CheckCircle2,
  FileJson,
  FileSpreadsheet,
  SlidersHorizontal,
  ChevronRight,
  X,
  Sparkles
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  useMCQStore,
  QuestionSet,
  MCQQuestion,
  BLOOM_LEVEL_DESCRIPTIONS,
  BloomLevel
} from '@/lib/mcq-store';
import { toast } from 'sonner';

export default function QuestionBankPage() {
  const router = useRouter();
  const {
    questionSets,
    deleteQuestionSet,
    duplicateQuestionSet,
    setSelectedQuestionsForBuilder
  } = useMCQStore();

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedBloom, setSelectedBloom] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Selected set for drawer detail view
  const [activeSetDrawer, setActiveSetDrawer] = useState<QuestionSet | null>(null);

  // Filtered Question Sets
  const filteredSets = useMemo(() => {
    return questionSets.filter((set) => {
      const matchesSearch =
        set.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        set.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
        set.topic.toLowerCase().includes(searchTerm.toLowerCase()) ||
        set.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesDiff =
        selectedDifficulty === 'all' || set.difficulty.toLowerCase() === selectedDifficulty.toLowerCase();

      const matchesBloom =
        selectedBloom === 'all' ||
        set.questions.some((q) => q.cognitiveLevel === selectedBloom);

      return matchesSearch && matchesDiff && matchesBloom;
    });
  }, [questionSets, searchTerm, selectedDifficulty, selectedBloom]);

  // Export handlers
  const handleExportJSON = (set: QuestionSet) => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(set, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${set.title.replace(/\s+/g, '_')}_QuestionSet.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    toast.success(`Exported "${set.title}" as JSON file.`);
  };

  const handleExportCSV = (set: QuestionSet) => {
    let csvContent = 'data:text/csv;charset=utf-8,ID,Question,BloomLevel,Difficulty,Points,CorrectOption,Explanation\n';
    set.questions.forEach((q) => {
      const row = [
        `"${q.id}"`,
        `"${q.questionText.replace(/"/g, '""')}"`,
        `"${q.cognitiveLevel}"`,
        `"${q.difficulty}"`,
        `"${q.points}"`,
        `"${q.options[q.correctOptionIndex]?.text.replace(/"/g, '""') || ''}"`,
        `"${q.explanation.replace(/"/g, '""')}"`,
      ].join(',');
      csvContent += row + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${set.title.replace(/\s+/g, '_')}_Questions.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    toast.success(`Exported "${set.title}" as CSV file.`);
  };

  const pushToBuilder = (set: QuestionSet) => {
    setSelectedQuestionsForBuilder(set.questions);
    toast.success(`Loaded ${set.questions.length} questions into Assessment Builder!`);
    router.push('/assessments/builder');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-black/70 p-6 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Layers size={14} /> CENTRAL REPOSITORY
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              Question Bank & Sets
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Search, filter, manage, export, and push stored AI questions into formal assessment builds.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              asChild
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-bold text-xs rounded-2xl shadow-md"
            >
              <Link href="/mcq/generator">
                <Plus size={16} className="mr-1.5" /> Generate New Set
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Filter & Search Bar */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-4 backdrop-blur-xl space-y-4 shadow-sm">
          <div className="flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                type="text"
                placeholder="Search sets by topic, keyword, or tag..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 pl-10 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Dropdown Filters & Layout Toggle */}
            <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
              {/* Difficulty Filter */}
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="all">All Difficulties</option>
                <option value="easy">Easy</option>
                <option value="medium">Medium</option>
                <option value="hard">Hard</option>
                <option value="mixed">Mixed</option>
              </select>

              {/* Bloom Level Filter */}
              <select
                value={selectedBloom}
                onChange={(e) => setSelectedBloom(e.target.value)}
                className="rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none font-mono"
              >
                <option value="all">All Bloom Levels (K1-K6)</option>
                <option value="K1">K1 - Remember</option>
                <option value="K2">K2 - Understand</option>
                <option value="K3">K3 - Apply</option>
                <option value="K4">K4 - Analyze</option>
                <option value="K5">K5 - Evaluate</option>
                <option value="K6">K6 - Create</option>
              </select>

              {/* View Toggle */}
              <div className="flex items-center p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                    viewMode === 'grid'
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Cards
                </button>
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-3 py-1 rounded-xl text-xs font-mono font-bold transition-all ${
                    viewMode === 'table'
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Table
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Question Sets Display */}
        {viewMode === 'grid' ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {filteredSets.map((set) => (
              <motion.div
                key={set.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 p-6 backdrop-blur-xl shadow-sm hover:border-cyan-500/40 transition-all flex flex-col justify-between space-y-5 group"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 border border-cyan-500/20">
                      {set.subject.split(':')[0] || 'Question Set'}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                      <Calendar size={12} /> {new Date(set.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 dark:text-white leading-snug group-hover:text-cyan-500 transition-colors">
                    {set.title}
                  </h3>

                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                    {set.topic}
                  </p>

                  {/* Tags */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    {set.tags.map((t) => (
                      <span
                        key={t}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-mono bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>

                  {/* Bloom Breakdown Pills */}
                  <div className="pt-2 border-t border-slate-100 dark:border-white/5 flex flex-wrap items-center gap-1">
                    {(Object.keys(set.bloomMatrix || {}) as BloomLevel[]).map((lvl) => {
                      const count = set.bloomMatrix[lvl] || 0;
                      if (count === 0) return null;
                      const cfg = BLOOM_LEVEL_DESCRIPTIONS[lvl];
                      return (
                        <span
                          key={lvl}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-mono font-bold ${cfg.bg} ${cfg.color}`}
                        >
                          {lvl}: {count}
                        </span>
                      );
                    })}
                  </div>
                </div>

                {/* Card Footer Actions */}
                <div className="pt-4 border-t border-slate-100 dark:border-white/5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveSetDrawer(set)}
                      title="View Questions"
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    <button
                      onClick={() => handleExportJSON(set)}
                      title="Export JSON"
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-indigo-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <FileJson size={16} />
                    </button>
                    <button
                      onClick={() => duplicateQuestionSet(set.id)}
                      title="Duplicate Set"
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Copy size={16} />
                    </button>
                    <button
                      onClick={() => {
                        deleteQuestionSet(set.id);
                        toast.success(`Deleted "${set.title}"`);
                      }}
                      title="Delete Set"
                      className="p-2 rounded-xl text-slate-600 dark:text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <Button
                    size="sm"
                    onClick={() => pushToBuilder(set)}
                    className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs rounded-xl shadow-sm"
                  >
                    Build Exam <ArrowRight size={14} className="ml-1" />
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                    <th className="p-4">Set Title</th>
                    <th className="p-4">Subject & Topic</th>
                    <th className="p-4">Questions</th>
                    <th className="p-4">Difficulty</th>
                    <th className="p-4">Created Date</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/5 text-xs">
                  {filteredSets.map((set) => (
                    <tr key={set.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                      <td className="p-4 font-bold text-slate-900 dark:text-white">
                        {set.title}
                      </td>
                      <td className="p-4 text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {set.topic}
                      </td>
                      <td className="p-4 font-mono font-bold text-cyan-500">
                        {set.questionCount} Questions
                      </td>
                      <td className="p-4 font-mono">
                        <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold">
                          {set.difficulty}
                        </span>
                      </td>
                      <td className="p-4 font-mono text-slate-400">
                        {new Date(set.createdAt).toLocaleDateString()}
                      </td>
                      <td className="p-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setActiveSetDrawer(set)}>
                            <Eye size={14} className="mr-1" /> View
                          </Button>
                          <Button size="sm" onClick={() => pushToBuilder(set)} className="bg-cyan-500 text-black font-mono font-bold">
                            Push to Builder
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {filteredSets.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/15 p-12 text-center space-y-3">
            <Layers className="mx-auto text-slate-400" size={32} />
            <h3 className="text-base font-bold text-slate-900 dark:text-white">No Question Sets Found</h3>
            <p className="text-xs text-slate-500">Try clearing search filters or generate a new set with AI.</p>
          </div>
        )}

        {/* Slide-over Drawer for Question Set Detail View */}
        <AnimatePresence>
          {activeSetDrawer && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                className="w-full max-w-2xl h-full bg-white dark:bg-slate-950 border-l border-slate-200 dark:border-white/10 p-6 flex flex-col justify-between overflow-y-auto custom-sidebar-scrollbar shadow-2xl"
              >
                <div className="space-y-6">
                  {/* Drawer Header */}
                  <div className="flex items-start justify-between pb-4 border-b border-slate-200 dark:border-white/10">
                    <div>
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-500 border border-cyan-500/20">
                        {activeSetDrawer.subject}
                      </span>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-2">
                        {activeSetDrawer.title}
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">{activeSetDrawer.topic}</p>
                    </div>
                    <button
                      onClick={() => setActiveSetDrawer(null)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    >
                      <X size={20} />
                    </button>
                  </div>

                  {/* Questions List */}
                  <div className="space-y-4">
                    <h3 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                      Questions ({activeSetDrawer.questions.length})
                    </h3>
                    {activeSetDrawer.questions.map((q, idx) => {
                      const cfg = BLOOM_LEVEL_DESCRIPTIONS[q.cognitiveLevel];
                      return (
                        <div
                          key={q.id}
                          className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 space-y-3"
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="text-xs font-bold text-slate-900 dark:text-white">
                              {idx + 1}. {q.questionText}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${cfg.bg} ${cfg.color}`}>
                              {q.cognitiveLevel}
                            </span>
                          </div>

                          <div className="space-y-1.5 text-xs">
                            {q.options.map((opt, oIdx) => (
                              <div
                                key={opt.id}
                                className={`p-2 rounded-xl border ${
                                  oIdx === q.correctOptionIndex
                                    ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 font-semibold'
                                    : 'border-slate-200 dark:border-white/5 text-slate-700 dark:text-slate-300'
                                }`}
                              >
                                {String.fromCharCode(65 + oIdx)}. {opt.text}
                              </div>
                            ))}
                          </div>

                          <p className="text-[11px] text-slate-500 dark:text-slate-400 italic pt-1 border-t border-slate-200 dark:border-white/5">
                            Reasoning: {q.explanation}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Drawer Footer */}
                <div className="pt-4 border-t border-slate-200 dark:border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" onClick={() => handleExportJSON(activeSetDrawer)}>
                      <FileJson size={14} className="mr-1" /> Export JSON
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => handleExportCSV(activeSetDrawer)}>
                      <FileSpreadsheet size={14} className="mr-1" /> Export CSV
                    </Button>
                  </div>
                  <Button
                    onClick={() => {
                      pushToBuilder(activeSetDrawer);
                      setActiveSetDrawer(null);
                    }}
                    className="bg-cyan-500 text-black font-mono font-bold text-xs"
                  >
                    Build Assessment <ArrowRight size={14} className="ml-1" />
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AppShell>
  );
}
