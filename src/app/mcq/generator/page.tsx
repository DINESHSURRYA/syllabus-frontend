"use client";

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Zap,
  Sliders,
  Check,
  RefreshCw,
  Save,
  Plus,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Info,
  Layers,
  HelpCircle,
  Brain,
  SlidersHorizontal
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { useSyllabusStore } from '@/lib/store';
import {
  useMCQStore,
  BloomLevel,
  BLOOM_LEVEL_DESCRIPTIONS,
  MCQQuestion,
  QuestionSet
} from '@/lib/mcq-store';
import { toast } from 'sonner';

export default function MCQGeneratorPage() {
  const router = useRouter();
  const { syllabus } = useSyllabusStore();
  const { addQuestionSet, addGenerationLog, setSelectedQuestionsForBuilder } = useMCQStore();

  // Dynamic subjects/topics from current syllabus store
  const syllabusUnits = useMemo(() => {
    if (syllabus?.units && syllabus.units.length > 0) {
      return syllabus.units.map((u) => ({
        value: `Unit ${u.unit_number}: ${u.title}`,
        label: `Unit ${u.unit_number}: ${u.title}`,
        topics: u.topics ? u.topics.map((t) => t.name) : [],
      }));
    }
    return [
      {
        value: 'Unit 1: Trees & Sorting Algorithms',
        label: 'Unit 1: Trees & Sorting Algorithms',
        topics: ['Binary Search Trees', 'AVL Trees', 'QuickSort', 'MergeSort'],
      },
      {
        value: 'Unit 2: Graph Algorithms & Traversals',
        label: 'Unit 2: Graph Algorithms & Traversals',
        topics: ['Dijkstra Algorithm', 'BFS & DFS', 'Minimum Spanning Tree'],
      },
      {
        value: 'Unit 3: Operating System Processes & Threads',
        label: 'Unit 3: Operating System Processes & Threads',
        topics: ['Process States', 'Semaphores', 'Deadlock Detection'],
      },
    ];
  }, [syllabus]);

  // Form states
  const [selectedSubject, setSelectedSubject] = useState(syllabusUnits[0]?.value || '');
  const [customTopic, setCustomTopic] = useState('');
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard' | 'Mixed'>('Mixed');
  const [questionCount, setQuestionCount] = useState<number>(10);

  // Bloom's Matrix allocation
  const [bloomMatrix, setBloomMatrix] = useState<Record<BloomLevel, number>>({
    K1: 2,
    K2: 2,
    K3: 2,
    K4: 2,
    K5: 1,
    K6: 1,
  });

  // Advanced toggles
  const [shuffleOptions, setShuffleOptions] = useState(true);
  const [generateExplanations, setGenerateExplanations] = useState(true);
  const [autoSaveBank, setAutoSaveBank] = useState(false);

  // Generation state
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<MCQQuestion[] | null>(null);

  // Preview UI state
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<MCQQuestion | null>(null);
  const [setTitle, setSetTitle] = useState('');

  // Total assigned questions counter
  const totalAssigned = Object.values(bloomMatrix).reduce((a, b) => a + b, 0);

  // Auto-distribute Bloom's levels evenly across total target question count
  const handleAutoDistribute = () => {
    const levels: BloomLevel[] = ['K1', 'K2', 'K3', 'K4', 'K5', 'K6'];
    const base = Math.floor(questionCount / 6);
    const remainder = questionCount % 6;
    const newMatrix: Record<BloomLevel, number> = { K1: base, K2: base, K3: base, K4: base, K5: base, K6: base };

    for (let i = 0; i < remainder; i++) {
      newMatrix[levels[i]] += 1;
    }
    setBloomMatrix(newMatrix);
    toast.success("Bloom's matrix balanced automatically!");
  };

  // Higher-order cognitive focus (K4-K6)
  const handleFocusHigherOrder = () => {
    const k4 = Math.ceil(questionCount * 0.35);
    const k5 = Math.ceil(questionCount * 0.35);
    const k6 = Math.max(1, questionCount - (k4 + k5));
    setBloomMatrix({ K1: 0, K2: 0, K3: 0, K4: k4, K5: k5, K6: k6 });
    toast.info("Configured matrix for Higher Order Thinking Skills (HOTS)");
  };

  // Simulated AI Generation streaming workflow
  const handleGenerate = async () => {
    if (totalAssigned !== questionCount) {
      toast.error(`Matrix mismatch: Total allocated (${totalAssigned}) does not match target count (${questionCount}). Adjust inputs or click Auto-Balance.`);
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);

    const steps = [
      'Parsing syllabus units and cognitive Bloom targets...',
      'Synthesizing question stems for levels K1-K6...',
      'Formulating plausible distractors & explanations...',
      'Finalizing generated assessment items...',
    ];

    for (let i = 1; i <= steps.length; i++) {
      setGenerationStep(i);
      await new Promise((res) => setTimeout(res, 600));
    }

    // Build realistic mock questions based on allocated matrix
    const newQuestions: MCQQuestion[] = [];
    let qCounter = 1;

    const topicName = customTopic.trim() || selectedSubject.split(':')[1] || selectedSubject;

    (Object.keys(bloomMatrix) as BloomLevel[]).forEach((level) => {
      const count = bloomMatrix[level];
      for (let i = 0; i < count; i++) {
        const qId = `gen-q-${Date.now()}-${qCounter}`;
        let stem = '';
        let optA = '';
        let optB = '';
        let optC = '';
        let optD = '';
        let exp = '';

        if (level === 'K1') {
          stem = `[K1 Recall] Which of the following fundamental principles defines ${topicName}?`;
          optA = 'It maintains an invariant structure allowing bounded recursive traversals.';
          optB = 'It operates exclusively on secondary disk storage without main RAM.';
          optC = 'It guarantees polynomial reduction to non-deterministic Turing machines.';
          optD = 'It disables garbage collection during execution.';
          exp = 'K1 Remember: Requires basic recall of core definitions and foundational invariant characteristics.';
        } else if (level === 'K2') {
          stem = `[K2 Understand] How does the architecture of ${topicName} handle asymptotic scaling under high load?`;
          optA = 'By dynamically partitioning elements to maintain linear memory bounds.';
          optB = 'By converting recursive call stacks into iterative loops to prevent stack overflow.';
          optC = 'By utilizing logarithmic height bounds to guarantee sub-quadratic operations.';
          optD = 'By disabling context switching across concurrent worker threads.';
          exp = 'K2 Understand: Evaluates comprehension of scaling behavior and architectural mechanics.';
        } else if (level === 'K3') {
          stem = `[K3 Apply] Given a real-world scenario requiring processing of ${topicName}, which implementation strategy should be applied?`;
          optA = 'Construct a balanced indexing tree with in-place pointer updates.';
          optB = 'Apply an iterative breadth-first queue traversal with visited node caching.';
          optC = 'Implement a dynamic array with amortized tail insertion.';
          optD = 'Utilize a synchronized multi-producer thread-safe queue.';
          exp = 'K3 Apply: Assesses capability to apply algorithms to practical problem scenarios.';
        } else if (level === 'K4') {
          stem = `[K4 Analyze] Analyze the trade-offs between space complexity and search time when deploying ${topicName}.`;
          optA = 'Trade-off A: O(1) space with O(N) search vs. O(N) space with O(log N) search.';
          optB = 'Trade-off B: Unlimited memory usage with zero CPU overhead.';
          optC = 'Trade-off C: Immediate constant compilation time with high runtime degradation.';
          optD = 'Trade-off D: High hardware lock contention with low throughput.';
          exp = 'K4 Analyze: Examines deep structural trade-offs between memory footprint and query latency.';
        } else if (level === 'K5') {
          stem = `[K5 Evaluate] Evaluate the assertion: "${topicName} is strictly superior to classical linear array structures." Under what constraints does this assertion fail?`;
          optA = 'Fails when memory overhead per node exceeds cache line sizes for small N.';
          optB = 'Fails when CPU clock speeds exceed 4GHz.';
          optC = 'Fails when compiling with strict optimization flags.';
          optD = 'Never fails under any hardware constraints.';
          exp = 'K5 Evaluate: Critical evaluation of system constraints, cache locality, and performance edge-cases.';
        } else {
          stem = `[K6 Create] Design an enhanced hybrid variant of ${topicName} that guarantees O(1) lookups while maintaining sorted order traversal.`;
          optA = 'Combine a Doubly Linked List for sorted order with a Hash Map mapping keys to node pointers.';
          optB = 'Use a single unindexed array with random element sampling.';
          optC = 'Apply a multi-level priority queue with periodic full sorting.';
          optD = 'Nest a binary search tree inside a monolithic file system buffer.';
          exp = 'K6 Create: Synthesis of composite data structure design leveraging HashMap + LinkedList.';
        }

        newQuestions.push({
          id: qId,
          questionText: stem,
          cognitiveLevel: level,
          difficulty: difficulty === 'Mixed' ? (i % 2 === 0 ? 'Medium' : 'Hard') : difficulty,
          points: level === 'K1' || level === 'K2' ? 2 : level === 'K3' || level === 'K4' ? 4 : 5,
          unitTopic: topicName,
          options: [
            { id: `${qId}-opt-a`, text: optA, explanation: generateExplanations ? 'Correct choice based on theoretical invariants.' : undefined },
            { id: `${qId}-opt-b`, text: optB, explanation: generateExplanations ? 'Incorrect. Confuses memory layout with runtime complexity.' : undefined },
            { id: `${qId}-opt-c`, text: optC, explanation: generateExplanations ? 'Incorrect distractor.' : undefined },
            { id: `${qId}-opt-d`, text: optD, explanation: generateExplanations ? 'Incorrect distractor.' : undefined },
          ],
          correctOptionIndex: 0,
          explanation: exp,
        });

        qCounter++;
      }
    });

    // Shuffle options if toggle active
    if (shuffleOptions) {
      newQuestions.forEach((q) => {
        const correctOpt = q.options[q.correctOptionIndex];
        // Fisher-Yates shuffle
        for (let i = q.options.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
        }
        q.correctOptionIndex = q.options.findIndex((o) => o.id === correctOpt.id);
      });
    }

    setGeneratedQuestions(newQuestions);
    setExpandedQuestionId(newQuestions[0]?.id || null);
    setSetTitle(`AI Set: ${topicName} (${newQuestions.length} Questions)`);
    setIsGenerating(false);

    // Save to generation log
    addGenerationLog({
      id: `gen-log-${Date.now()}`,
      subject: selectedSubject,
      topic: topicName,
      difficulty,
      questionCount,
      bloomMatrix,
      timestamp: new Date().toISOString(),
      status: 'completed',
    });

    if (autoSaveBank) {
      saveSetToBank(newQuestions, `AI Set: ${topicName}`);
    }

    toast.success(`Successfully generated ${newQuestions.length} questions aligned with Bloom's Taxonomy!`);
  };

  const saveSetToBank = (questionsToSave = generatedQuestions, customTitle = setTitle) => {
    if (!questionsToSave || questionsToSave.length === 0) return;
    const finalTitle = customTitle.trim() || `Question Set - ${new Date().toLocaleDateString()}`;

    const newSet: QuestionSet = {
      id: `set-${Date.now()}`,
      title: finalTitle,
      subject: selectedSubject,
      topic: customTopic || selectedSubject,
      difficulty,
      questionCount: questionsToSave.length,
      bloomMatrix,
      questions: questionsToSave,
      createdAt: new Date().toISOString(),
      tags: [difficulty, "Bloom's AI", selectedSubject.split(':')[0] || 'GenAI'],
    };

    addQuestionSet(newSet);
    toast.success(`Question set "${finalTitle}" saved to Question Bank!`);
  };

  const pushToAssessmentBuilder = () => {
    if (!generatedQuestions || generatedQuestions.length === 0) return;
    setSelectedQuestionsForBuilder(generatedQuestions);
    toast.success('Pushed questions to Assessment Builder!');
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
              <Brain size={14} className="animate-pulse" /> BLOOMS TAXONOMY AI ENGINE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              AI MCQ Generator
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Generate balanced, cognitive-level multiple choice questions directly from syllabus topics.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              asChild
              className="border-slate-300 dark:border-white/20 text-xs font-mono"
            >
              <Link href="/mcq/bank">
                <Layers size={14} className="mr-1.5" /> View Question Bank
              </Link>
            </Button>
          </div>
        </motion.div>

        {/* Generator Controls Grid */}
        <div className="grid gap-6 lg:grid-cols-12">
          {/* Left Config Panel */}
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-5 space-y-6"
          >
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-6 backdrop-blur-xl space-y-5 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <SlidersHorizontal size={18} className="text-cyan-500" /> Assessment Generator Controls
              </h2>

              {/* Subject / Syllabus Unit Selector */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Syllabus Unit / Subject
                </label>
                <select
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                >
                  {syllabusUnits.map((u) => (
                    <option key={u.value} value={u.value}>
                      {u.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Custom Topic Sub-field */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Topic / Specific Focus (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Binary Search Trees & AVL Rotations"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none font-sans"
                />
              </div>

              {/* Difficulty Segmented Control */}
              <div className="space-y-2">
                <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Target Difficulty
                </label>
                <div className="grid grid-cols-4 gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900">
                  {(['Easy', 'Medium', 'Hard', 'Mixed'] as const).map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDifficulty(d)}
                      className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                        difficulty === d
                          ? 'bg-cyan-500 text-black shadow-md'
                          : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Count Stepper & Slider */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                  <span className="uppercase tracking-wider">Total Questions</span>
                  <span className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-500 dark:text-cyan-300 border border-cyan-500/30">
                    {questionCount} Questions
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="range"
                    min={1}
                    max={50}
                    value={questionCount}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      setQuestionCount(val);
                    }}
                    className="w-full accent-cyan-500 cursor-pointer"
                  />
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setQuestionCount(Math.max(1, questionCount - 1))}
                      className="w-8 h-8 rounded-xl border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-mono font-bold hover:bg-cyan-500 hover:text-black transition-all"
                    >
                      -
                    </button>
                    <button
                      onClick={() => setQuestionCount(Math.min(50, questionCount + 1))}
                      className="w-8 h-8 rounded-xl border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-mono font-bold hover:bg-cyan-500 hover:text-black transition-all"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* Bloom's Taxonomy Matrix (K1-K6) */}
              <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-white/10">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Bloom's Cognitive Distribution
                  </span>
                  <span
                    className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${
                      totalAssigned === questionCount
                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 border border-emerald-500/30'
                        : 'bg-amber-500/20 text-amber-600 dark:text-amber-300 border border-amber-500/30'
                    }`}
                  >
                    Assigned: {totalAssigned} / {questionCount}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {(['K1', 'K2', 'K3', 'K4', 'K5', 'K6'] as BloomLevel[]).map((lvl) => {
                    const cfg = BLOOM_LEVEL_DESCRIPTIONS[lvl];
                    return (
                      <div
                        key={lvl}
                        className={`p-2.5 rounded-2xl border ${cfg.border} ${cfg.bg} space-y-1.5`}
                      >
                        <div className="flex items-center justify-between text-xs font-mono font-bold">
                          <span className={cfg.color}>{lvl}</span>
                          <input
                            type="number"
                            min={0}
                            max={50}
                            value={bloomMatrix[lvl]}
                            onChange={(e) => {
                              const val = Math.max(0, parseInt(e.target.value) || 0);
                              setBloomMatrix((prev) => ({ ...prev, [lvl]: val }));
                            }}
                            className="w-12 text-center rounded-lg border border-slate-300 dark:border-white/20 bg-white dark:bg-black text-slate-900 dark:text-white font-mono font-bold text-xs py-0.5 focus:border-cyan-500 focus:outline-none"
                          />
                        </div>
                        <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate leading-tight">
                          {cfg.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>

                {/* Matrix Quick Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    onClick={handleAutoDistribute}
                    className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <RefreshCw size={12} /> Auto-Balance Matrix
                  </button>
                  <span className="text-slate-300 dark:text-slate-700">|</span>
                  <button
                    onClick={handleFocusHigherOrder}
                    className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <Zap size={12} /> HOTS Focus (K4-K6)
                  </button>
                </div>
              </div>

              {/* Advanced Toggles */}
              <div className="space-y-2.5 pt-3 border-t border-slate-200 dark:border-white/10">
                <p className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Generation Options
                </p>

                <div className="space-y-2 text-xs">
                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300">Shuffle option order automatically</span>
                    <input
                      type="checkbox"
                      checked={shuffleOptions}
                      onChange={(e) => setShuffleOptions(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300">Generate option-level explanations</span>
                    <input
                      type="checkbox"
                      checked={generateExplanations}
                      onChange={(e) => setGenerateExplanations(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>

                  <label className="flex items-center justify-between cursor-pointer">
                    <span className="text-slate-700 dark:text-slate-300">Auto-save generated set to bank</span>
                    <input
                      type="checkbox"
                      checked={autoSaveBank}
                      onChange={(e) => setAutoSaveBank(e.target.checked)}
                      className="accent-cyan-500 w-4 h-4 rounded"
                    />
                  </label>
                </div>
              </div>

              {/* Generate CTA Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                size="lg"
                className="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold rounded-2xl shadow-lg dark:shadow-[0_0_25px_rgba(6,182,212,0.3)] transition-all cursor-pointer"
              >
                {isGenerating ? (
                  <span className="flex items-center gap-2 font-mono">
                    <RefreshCw className="animate-spin" size={16} /> Generating AI Questions...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Sparkles size={18} /> Generate Questions with AI
                  </span>
                )}
              </Button>
            </div>
          </motion.div>

          {/* Right Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Shimmer / Loading State */}
            {isGenerating && (
              <div className="rounded-3xl border border-cyan-500/30 bg-white dark:bg-black/70 p-8 backdrop-blur-xl space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center animate-bounce">
                    <Brain size={24} />
                  </div>
                  <div>
                    <p className="text-xs font-mono text-cyan-500 font-bold uppercase tracking-wider">
                      Bloom AI Engine Processing • Step {generationStep}/4
                    </p>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                      Synthesizing Bloom's Taxonomy Questions
                    </h3>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="h-4 w-3/4 rounded-lg shimmer-loader" />
                  <div className="h-4 w-full rounded-lg shimmer-loader" />
                  <div className="h-4 w-5/6 rounded-lg shimmer-loader" />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-4">
                  <div className="h-16 rounded-2xl shimmer-loader" />
                  <div className="h-16 rounded-2xl shimmer-loader" />
                  <div className="h-16 rounded-2xl shimmer-loader" />
                  <div className="h-16 rounded-2xl shimmer-loader" />
                </div>
              </div>
            )}

            {/* Generated Output Preview Accordion */}
            {!isGenerating && generatedQuestions && (
              <div className="space-y-4">
                {/* Header Actions for Generated Set */}
                <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/70 p-5 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
                  <div className="space-y-1">
                    <input
                      type="text"
                      value={setTitle}
                      onChange={(e) => setSetTitle(e.target.value)}
                      className="text-base font-bold text-slate-900 dark:text-white bg-transparent border-b border-transparent hover:border-slate-300 dark:hover:border-white/20 focus:border-cyan-500 focus:outline-none w-full"
                    />
                    <div className="flex flex-wrap items-center gap-1.5 text-xs font-mono text-slate-500">
                      <span>{generatedQuestions.length} Questions Generated</span>
                      <span>•</span>
                      <span className="text-cyan-500 font-semibold">{selectedSubject.split(':')[0]}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => saveSetToBank()}
                      variant="outline"
                      size="sm"
                      className="border-slate-300 dark:border-white/20 text-xs font-mono font-bold"
                    >
                      <Save size={14} className="mr-1.5" /> Save Set
                    </Button>
                    <Button
                      onClick={pushToAssessmentBuilder}
                      size="sm"
                      className="bg-cyan-500 hover:bg-cyan-400 text-black font-mono font-bold text-xs shadow-md"
                    >
                      Build Exam <ArrowRight size={14} className="ml-1" />
                    </Button>
                  </div>
                </div>

                {/* Questions List */}
                <div className="space-y-3">
                  {generatedQuestions.map((q, idx) => {
                    const isExpanded = expandedQuestionId === q.id;
                    const bloomInfo = BLOOM_LEVEL_DESCRIPTIONS[q.cognitiveLevel];

                    return (
                      <div
                        key={q.id}
                        className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-black/60 overflow-hidden shadow-sm transition-all"
                      >
                        {/* Accordion Title Bar */}
                        <div
                          onClick={() => setExpandedQuestionId(isExpanded ? null : q.id)}
                          className="p-4 sm:p-5 flex items-start justify-between gap-3 cursor-pointer hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                          <div className="flex items-start gap-3">
                            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-300">
                              {idx + 1}
                            </span>
                            <div className="space-y-1.5">
                              <p className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">
                                {q.questionText}
                              </p>
                              <div className="flex flex-wrap items-center gap-2">
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${bloomInfo.bg} ${bloomInfo.color} ${bloomInfo.border} border`}>
                                  {bloomInfo.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                                  {q.difficulty}
                                </span>
                                <span className="text-[10px] font-mono text-slate-500">
                                  {q.points} pts
                                </span>
                              </div>
                            </div>
                          </div>

                          <button className="text-slate-400 hover:text-slate-700 dark:hover:text-white p-1">
                            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                          </button>
                        </div>

                        {/* Accordion Expanded Body */}
                        {isExpanded && (
                          <div className="p-5 pt-0 border-t border-slate-100 dark:border-white/5 space-y-4 bg-slate-50/50 dark:bg-slate-950/30">
                            {/* Options List */}
                            <div className="space-y-2 mt-3">
                              <p className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                                Answer Options
                              </p>
                              {q.options.map((opt, optIdx) => {
                                const isCorrect = optIdx === q.correctOptionIndex;
                                return (
                                  <div
                                    key={opt.id}
                                    className={`p-3 rounded-2xl border transition-all ${
                                      isCorrect
                                        ? 'border-emerald-500/50 bg-emerald-500/10 text-slate-900 dark:text-emerald-200'
                                        : 'border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-300'
                                    }`}
                                  >
                                    <div className="flex items-center justify-between text-xs">
                                      <span className="font-semibold">
                                        {String.fromCharCode(65 + optIdx)}. {opt.text}
                                      </span>
                                      {isCorrect && (
                                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono font-bold text-[10px]">
                                          <Check size={12} /> Correct Option
                                        </span>
                                      )}
                                    </div>
                                    {opt.explanation && (
                                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 italic pl-4 border-l border-emerald-500/30">
                                        {opt.explanation}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}
                            </div>

                            {/* Detailed Reasoning Box */}
                            <div className="p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 text-xs space-y-1">
                              <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                                <Info size={14} /> Cognitive Explanation & Reasoning:
                              </p>
                              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                {q.explanation}
                              </p>
                            </div>

                            {/* Quick Actions */}
                            <div className="flex items-center justify-end gap-2 pt-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setEditingQuestion(q)}
                                className="text-xs text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                              >
                                <Edit3 size={14} className="mr-1" /> Edit Item
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Empty State */}
            {!isGenerating && !generatedQuestions && (
              <div className="rounded-3xl border border-dashed border-slate-300 dark:border-white/15 p-12 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-cyan-500/10 text-cyan-500 mx-auto flex items-center justify-center">
                  <Brain size={32} />
                </div>
                <div className="max-w-md mx-auto space-y-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Ready to Generate Bloom-Aligned Assessment Items
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Select a syllabus unit on the left, configure question counts per Bloom level (K1 to K6), and click "Generate Questions with AI".
                  </p>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </AppShell>
  );
}
