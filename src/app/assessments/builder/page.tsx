"use client";

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Sliders,
  Plus,
  Trash2,
  GripVertical,
  Clock,
  Award,
  CheckCircle2,
  Search,
  Filter,
  ArrowRight,
  ShieldCheck,
  Eye,
  BarChart3,
  Sparkles,
  HelpCircle
} from 'lucide-react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import {
  useMCQStore,
  Assessment,
  MCQQuestion,
  BLOOM_LEVEL_DESCRIPTIONS,
  BloomLevel
} from '@/lib/mcq-store';
import { toast } from 'sonner';

// Sortable Question Item Component using @dnd-kit
function SortableQuestionCard({
  question,
  index,
  onRemove,
  onPointsChange,
}: {
  question: MCQQuestion;
  index: number;
  onRemove: (id: string) => void;
  onPointsChange: (id: string, pts: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const bloomInfo = BLOOM_LEVEL_DESCRIPTIONS[question.cognitiveLevel];

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 shadow-sm flex items-start justify-between gap-3 group transition-all"
    >
      <div className="flex items-start gap-3">
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="mt-1 cursor-grab active:cursor-grabbing text-slate-400 hover:text-cyan-500 transition-colors"
          title="Drag to reorder"
        >
          <GripVertical size={18} />
        </button>

        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-mono font-bold text-slate-700 dark:text-slate-300">
              {index + 1}
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${bloomInfo.bg} ${bloomInfo.color}`}>
              {bloomInfo.name}
            </span>
            <span className="text-[10px] font-mono text-slate-500">
              {question.difficulty}
            </span>
          </div>

          <p className="text-xs font-semibold text-slate-900 dark:text-white leading-snug">
            {question.questionText}
          </p>

          <p className="text-[10px] text-slate-500 truncate">
            {question.unitTopic || 'General Topic'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3 shrink-0">
        {/* Weightage / Points Config */}
        <div className="flex items-center gap-1 text-xs font-mono">
          <span className="text-slate-500 text-[10px]">Pts:</span>
          <input
            type="number"
            min={1}
            max={50}
            value={question.points || 1}
            onChange={(e) => onPointsChange(question.id, Math.max(1, parseInt(e.target.value) || 1))}
            className="w-12 text-center rounded-lg border border-slate-300 dark:border-white/20 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white font-mono font-bold text-xs py-0.5 focus:border-cyan-500 focus:outline-none"
          />
        </div>

        <button
          onClick={() => onRemove(question.id)}
          className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-rose-500/10 transition-colors"
          title="Remove from assessment"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  );
}

export default function AssessmentBuilderPage() {
  const router = useRouter();
  const {
    questionSets,
    selectedQuestionsForBuilder,
    addAssessment,
    setSelectedQuestionsForBuilder
  } = useMCQStore();

  // Basic Info state
  const [title, setTitle] = useState('Comprehensive Computer Science Assessment 2026');
  const [description, setDescription] = useState('Formal time-bound evaluation covering Data Structures, Operating Systems, and Algorithm complexity.');
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [assessmentType, setAssessmentType] = useState<'formal' | 'practice'>('formal');
  const [passingPercentage, setPassingPercentage] = useState(60);

  // Selected questions for building assessment
  const [selectedQuestions, setSelectedQuestions] = useState<MCQQuestion[]>([]);

  // Search/Filter for left column question bank
  const [bankSearch, setBankSearch] = useState('');
  const [bankBloomFilter, setBankBloomFilter] = useState('all');

  // Pre-load from store selection if pushed from Generator or Bank
  useEffect(() => {
    if (selectedQuestionsForBuilder && selectedQuestionsForBuilder.length > 0) {
      setSelectedQuestions(selectedQuestionsForBuilder);
    } else if (questionSets[0]?.questions) {
      setSelectedQuestions(questionSets[0].questions);
    }
  }, [selectedQuestionsForBuilder, questionSets]);

  // Combine all questions from bank
  const allBankQuestions = useMemo(() => {
    const questions: MCQQuestion[] = [];
    const ids = new Set<string>();
    questionSets.forEach((set) => {
      set.questions.forEach((q) => {
        if (!ids.has(q.id)) {
          ids.add(q.id);
          questions.push(q);
        }
      });
    });
    return questions;
  }, [questionSets]);

  const filteredBankQuestions = useMemo(() => {
    return allBankQuestions.filter((q) => {
      const matchesSearch =
        q.questionText.toLowerCase().includes(bankSearch.toLowerCase()) ||
        (q.unitTopic && q.unitTopic.toLowerCase().includes(bankSearch.toLowerCase()));
      const matchesBloom = bankBloomFilter === 'all' || q.cognitiveLevel === bankBloomFilter;
      return matchesSearch && matchesBloom;
    });
  }, [allBankQuestions, bankSearch, bankBloomFilter]);

  // Calculations for summary footer
  const totalMarks = useMemo(() => {
    return selectedQuestions.reduce((sum, q) => sum + (q.points || 1), 0);
  }, [selectedQuestions]);

  const bloomDistribution = useMemo(() => {
    const dist: Record<BloomLevel, number> = { K1: 0, K2: 0, K3: 0, K4: 0, K5: 0, K6: 0 };
    selectedQuestions.forEach((q) => {
      dist[q.cognitiveLevel] = (dist[q.cognitiveLevel] || 0) + (q.points || 1);
    });
    return dist;
  }, [selectedQuestions]);

  // Drag and drop sensor configuration
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setSelectedQuestions((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const addQuestionToAssessment = (q: MCQQuestion) => {
    if (selectedQuestions.some((item) => item.id === q.id)) {
      toast.info('Question already added to assessment.');
      return;
    }
    setSelectedQuestions((prev) => [...prev, q]);
    toast.success('Question added to assessment.');
  };

  const removeQuestionFromAssessment = (id: string) => {
    setSelectedQuestions((prev) => prev.filter((q) => q.id !== id));
  };

  const updateQuestionPoints = (id: string, pts: number) => {
    setSelectedQuestions((prev) =>
      prev.map((q) => (q.id === id ? { ...q, points: pts } : q))
    );
  };

  const handleSaveAssessment = () => {
    if (selectedQuestions.length === 0) {
      toast.error('Please select at least one question for the assessment.');
      return;
    }

    const newAssessment: Assessment = {
      id: `asm-${Date.now()}`,
      title: title.trim() || 'Untitled Assessment',
      description,
      durationMinutes,
      type: assessmentType,
      passingPercentage,
      questions: selectedQuestions,
      totalMarks,
      accessControl: {
        isPublic: true,
        hasAccessCode: false,
        accessCode: 'EXAM2026',
        domainRestrictions: [],
        whitelistedEmails: [],
      },
      proctoring: {
        trackTabSwitches: true,
        enforceFullscreen: true,
        maxTabSwitches: 3,
      },
      status: 'active',
      createdAt: new Date().toISOString(),
      attemptsCount: 0,
    };

    addAssessment(newAssessment);
    toast.success(`Assessment "${newAssessment.title}" created successfully!`);
    router.push('/assessments/manage');
  };

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-slate-200 dark:border-cyan-500/20 bg-white dark:bg-black/70 p-6 backdrop-blur-xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4"
        >
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 text-cyan-600 dark:text-cyan-300 text-xs font-mono font-bold uppercase tracking-wider">
              <Sliders size={14} /> EXAM & TEST CONSTRUCTOR
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              Assessment Builder
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Select questions from the bank, reorder items with drag-and-drop, configure points, and set exam duration.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              onClick={handleSaveAssessment}
              className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs rounded-2xl shadow-md"
            >
              Save & Configure Security <ShieldCheck size={16} className="ml-1.5" />
            </Button>
          </div>
        </motion.div>

        {/* Basic Info Form */}
        <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 backdrop-blur-xl space-y-4 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sliders size={18} className="text-cyan-500" /> Basic Assessment Details
          </h2>

          <div className="grid gap-4 md:grid-cols-12">
            {/* Title */}
            <div className="md:col-span-8 space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Assessment Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Type */}
            <div className="md:col-span-4 space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Assessment Type
              </label>
              <div className="grid grid-cols-2 gap-1 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setAssessmentType('formal')}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    assessmentType === 'formal'
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Formal Exam
                </button>
                <button
                  type="button"
                  onClick={() => setAssessmentType('practice')}
                  className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                    assessmentType === 'practice'
                      ? 'bg-cyan-500 text-black shadow-sm'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Practice Test
                </button>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-6 space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Description / Instructions
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
              />
            </div>

            {/* Duration */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Duration (Minutes)
              </label>
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-cyan-500" />
                <input
                  type="number"
                  min={5}
                  max={240}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(parseInt(e.target.value) || 30)}
                  className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Passing % */}
            <div className="md:col-span-3 space-y-1.5">
              <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Passing Cutoff (%)
              </label>
              <div className="flex items-center gap-2">
                <Award size={16} className="text-emerald-500" />
                <input
                  type="number"
                  min={10}
                  max={100}
                  value={passingPercentage}
                  onChange={(e) => setPassingPercentage(parseInt(e.target.value) || 60)}
                  className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-mono font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Dual-Column Question Selection Interface */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Column: Question Bank Repository */}
          <div className="lg:col-span-5 space-y-4">
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-5 backdrop-blur-xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Available Question Bank
                </h3>
                <span className="text-xs font-mono text-slate-400">
                  {filteredBankQuestions.length} items
                </span>
              </div>

              {/* Bank Filter Bar */}
              <div className="space-y-2">
                <div className="relative">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search bank questions..."
                    value={bankSearch}
                    onChange={(e) => setBankSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 pl-8 pr-3 py-1.5 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <select
                  value={bankBloomFilter}
                  onChange={(e) => setBankBloomFilter(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white font-mono"
                >
                  <option value="all">All Bloom Levels</option>
                  <option value="K1">K1 - Remember</option>
                  <option value="K2">K2 - Understand</option>
                  <option value="K3">K3 - Apply</option>
                  <option value="K4">K4 - Analyze</option>
                  <option value="K5">K5 - Evaluate</option>
                  <option value="K6">K6 - Create</option>
                </select>
              </div>

              {/* Questions List */}
              <div className="space-y-2.5 max-h-[500px] overflow-y-auto custom-sidebar-scrollbar pr-1">
                {filteredBankQuestions.map((q) => {
                  const isSelected = selectedQuestions.some((item) => item.id === q.id);
                  const cfg = BLOOM_LEVEL_DESCRIPTIONS[q.cognitiveLevel];

                  return (
                    <div
                      key={q.id}
                      className={`p-3 rounded-2xl border transition-all ${
                        isSelected
                          ? 'border-emerald-500/50 bg-emerald-500/10 opacity-75'
                          : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900 hover:border-cyan-500/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold ${cfg.bg} ${cfg.color}`}>
                            {q.cognitiveLevel}
                          </span>
                          <p className="text-xs font-medium text-slate-900 dark:text-white line-clamp-2">
                            {q.questionText}
                          </p>
                        </div>

                        <button
                          onClick={() => addQuestionToAssessment(q)}
                          disabled={isSelected}
                          className={`p-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                            isSelected
                              ? 'bg-emerald-500/20 text-emerald-500 cursor-not-allowed'
                              : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-sm'
                          }`}
                        >
                          {isSelected ? <CheckCircle2 size={14} /> : <Plus size={14} />}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Selected Assessment Questions (Sortable) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-5 backdrop-blur-xl space-y-4 shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-white/10 pb-3">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    Selected Questions in Assessment ({selectedQuestions.length})
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Drag items via grip handle to reorder exam layout.
                  </p>
                </div>

                <div className="flex items-center gap-3 text-xs font-mono font-bold">
                  <span className="text-cyan-500">Total Marks: {totalMarks}</span>
                </div>
              </div>

              {/* DndContext Sortable Container */}
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={selectedQuestions.map((q) => q.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 min-h-[300px]">
                    {selectedQuestions.map((q, idx) => (
                      <SortableQuestionCard
                        key={q.id}
                        question={q}
                        index={idx}
                        onRemove={removeQuestionFromAssessment}
                        onPointsChange={updateQuestionPoints}
                      />
                    ))}

                    {selectedQuestions.length === 0 && (
                      <div className="py-16 text-center text-slate-400 border border-dashed border-slate-300 dark:border-white/15 rounded-2xl">
                        <Plus className="mx-auto mb-2 text-slate-400" size={24} />
                        <p className="text-xs">No questions added to assessment yet.</p>
                        <p className="text-[10px] text-slate-500">Click "+" on bank items on the left to include them.</p>
                      </div>
                    )}
                  </div>
                </SortableContext>
              </DndContext>

              {/* Summary Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono font-bold">
                  <span className="text-slate-600 dark:text-slate-300">Bloom's Cognitive Breakdown Summary</span>
                  <span className="text-emerald-500 font-bold">{totalMarks} Total Marks</span>
                </div>

                {/* Progress breakdown bar across K1-K6 */}
                <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-900 flex overflow-hidden p-0.5 border border-slate-200 dark:border-white/10">
                  {(['K1', 'K2', 'K3', 'K4', 'K5', 'K6'] as BloomLevel[]).map((lvl) => {
                    const pts = bloomDistribution[lvl] || 0;
                    if (pts === 0 || totalMarks === 0) return null;
                    const pct = (pts / totalMarks) * 100;
                    const cfg = BLOOM_LEVEL_DESCRIPTIONS[lvl];
                    return (
                      <div
                        key={lvl}
                        style={{ width: `${pct}%` }}
                        className={`h-full ${cfg.bg} border-r border-black/20`}
                        title={`${lvl}: ${pts} marks (${Math.round(pct)}%)`}
                      />
                    );
                  })}
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {(['K1', 'K2', 'K3', 'K4', 'K5', 'K6'] as BloomLevel[]).map((lvl) => {
                    const pts = bloomDistribution[lvl] || 0;
                    if (pts === 0) return null;
                    const cfg = BLOOM_LEVEL_DESCRIPTIONS[lvl];
                    return (
                      <span key={lvl} className={`text-[10px] font-mono font-bold ${cfg.color}`}>
                        {lvl}: {pts} pts
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
