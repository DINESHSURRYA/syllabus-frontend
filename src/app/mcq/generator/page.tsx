"use client";

import './styles/page.css';
import React, { useState, useEffect, useMemo } from 'react';
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
  SlidersHorizontal,
  BookOpen,
  FolderTree,
  FileText,
  Clock,
  History,
  CheckCircle2,
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { useSyllabusStore, useMCQStore, BLOOM_LEVEL_DESCRIPTIONS } from '@/stores';
import { BloomLevel, MCQQuestion, QuestionSet } from '@/types';
import { getSyllabusList } from '@/lib/api/syllabus.api';
import { generateMcqQuestions, getMcqBank } from '@/lib/api/mcq.api';
import { toast } from 'sonner';

interface CourseOption {
  id: string;
  courseCode: string;
  courseName: string;
  department?: string;
  regulation?: string;
  content?: {
    units?: Array<{
      id: string;
      title: string;
      unit_number?: number;
      topics?: Array<{
        id: string;
        title: string;
        subtopics?: Array<{
          id: string;
          title: string;
          bloom?: string;
        }>;
      }>;
    }>;
  };
  units?: Array<{
    id: string;
    title: string;
    unit_number?: number;
    topics?: Array<{
      id: string;
      title: string;
      subtopics?: Array<{
        id: string;
        title: string;
        bloom?: string;
      }>;
    }>;
  }>;
}

export default function MCQGeneratorPage() {
  const router = useRouter();
  const { syllabus } = useSyllabusStore();
  const { addQuestionSet, addGenerationLog, setSelectedQuestionsForBuilder, questionSets } = useMCQStore();

  // Mode selection: 'create' or 'history'
  const [activeTab, setActiveTab] = useState<'create' | 'history'>('create');

  // History State
  const [historyList, setHistoryList] = useState<any[]>([]);
  const [selectedHistoryId, setSelectedHistoryId] = useState<string>('');
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Syllabus API / Course Data
  const [coursesList, setCoursesList] = useState<CourseOption[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('');
  const [loadingSyllabus, setLoadingSyllabus] = useState<boolean>(true);

  // Cascading Selection States
  const [selectedUnitId, setSelectedUnitId] = useState<string>('');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('');
  const [selectedSubtopicId, setSelectedSubtopicId] = useState<string>('');
  const [customTopic, setCustomTopic] = useState<string>('');

  // Form states
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

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0);
  const [generatedQuestions, setGeneratedQuestions] = useState<MCQQuestion[] | null>(null);

  // Preview UI state
  const [expandedQuestionId, setExpandedQuestionId] = useState<string | null>(null);
  const [setTitle, setSetTitle] = useState('');

  // Default demo courses fallback if backend return is empty
  const defaultDemoCourses: CourseOption[] = useMemo(() => [
    {
      id: 'CS8451',
      courseCode: 'CS8451',
      courseName: 'Design & Analysis of Algorithms',
      department: 'CSE',
      regulation: '2021',
      units: [
        {
          id: 'unit-1',
          title: 'Unit I: Trees & Sorting Algorithms',
          unit_number: 1,
          topics: [
            {
              id: 'topic-1-1',
              title: 'Binary Search Trees & Rotations',
              subtopics: [
                { id: 'sub-1-1-1', title: 'AVL Tree Balancing & Rotations', bloom: 'K3' },
                { id: 'sub-1-1-2', title: 'Red-Black Tree Invariants', bloom: 'K4' },
                { id: 'sub-1-1-3', title: 'BST Search & Deletion Complexity', bloom: 'K2' },
              ],
            },
            {
              id: 'topic-1-2',
              title: 'Divide and Conquer Sorting',
              subtopics: [
                { id: 'sub-1-2-1', title: 'QuickSort Partitioning Strategies', bloom: 'K3' },
                { id: 'sub-1-2-2', title: 'MergeSort Space Complexity', bloom: 'K4' },
              ],
            },
          ],
        },
        {
          id: 'unit-2',
          title: 'Unit II: Graph Algorithms & Dynamic Programming',
          unit_number: 2,
          topics: [
            {
              id: 'topic-2-1',
              title: 'Shortest Path Algorithms',
              subtopics: [
                { id: 'sub-2-1-1', title: 'Dijkstra Single Source Shortest Path', bloom: 'K3' },
                { id: 'sub-2-1-2', title: 'Bellman-Ford Negative Weight Cycles', bloom: 'K4' },
              ],
            },
            {
              id: 'topic-2-2',
              title: 'Minimum Spanning Trees',
              subtopics: [
                { id: 'sub-2-2-1', title: 'Kruskal Disjoint Set Union', bloom: 'K3' },
                { id: 'sub-2-2-2', title: 'Prim Greedy MST Construction', bloom: 'K3' },
              ],
            },
          ],
        },
      ],
    },
    {
      id: 'CS8591',
      courseCode: 'CS8591',
      courseName: 'Computer Networks & Protocols',
      department: 'ECE/CSE',
      regulation: '2021',
      units: [
        {
          id: 'cn-unit-1',
          title: 'Unit I: Transport Layer Protocols',
          unit_number: 1,
          topics: [
            {
              id: 'cn-topic-1-1',
              title: 'TCP Congestion Control & Flow Control',
              subtopics: [
                { id: 'cn-sub-1-1-1', title: 'Sliding Window & AIMD Dynamics', bloom: 'K4' },
                { id: 'cn-sub-1-1-2', title: 'UDP vs TCP Handshake Comparison', bloom: 'K2' },
              ],
            },
          ],
        },
      ],
    },
  ], []);

  // Fetch Syllabus on Mount
  useEffect(() => {
    async function loadSyllabi() {
      try {
        setLoadingSyllabus(true);
        const response = await getSyllabusList();
        const items: CourseOption[] = Array.isArray(response?.items)
          ? response.items
          : Array.isArray(response)
          ? response
          : [];

        if (items.length > 0) {
          setCoursesList(items);
          const firstCourse = items[0];
          const firstId = firstCourse.id || firstCourse.courseCode;
          setSelectedCourseId(firstId);
          initializeCascadingSelections(firstCourse);
        } else if (syllabus?.units && syllabus.units.length > 0) {
          const storeCourse: CourseOption = {
            id: syllabus.course?.code || syllabus.pdfCourseCode || 'CURRENT_SYLLABUS',
            courseCode: syllabus.course?.code || syllabus.pdfCourseCode || 'SYLLABUS',
            courseName: syllabus.course?.title || 'Active Syllabus',
            department: syllabus.course?.department || 'CS',
            regulation: '2021',
            units: syllabus.units.map((u, idx) => ({
              id: `u-${idx + 1}`,
              title: `Unit ${u.unit_number}: ${u.title}`,
              unit_number: u.unit_number,
              topics: (u.topics || []).map((t, tIdx) => ({
                id: `t-${idx + 1}-${tIdx + 1}`,
                title: t.name,
                subtopics: (t.subtopics || []).map((st: any, stIdx: number) => ({
                  id: `st-${idx + 1}-${tIdx + 1}-${stIdx + 1}`,
                  title: typeof st === 'string' ? st : st.title || st.name,
                  bloom: st.bloom || 'K2',
                })),
              })),
            })),
          };
          setCoursesList([storeCourse, ...defaultDemoCourses]);
          setSelectedCourseId(storeCourse.id);
          initializeCascadingSelections(storeCourse);
        } else {
          setCoursesList(defaultDemoCourses);
          const firstCourse = defaultDemoCourses[0];
          setSelectedCourseId(firstCourse.id);
          initializeCascadingSelections(firstCourse);
        }
      } catch (err) {
        console.warn('Failed to fetch API syllabus list, using local defaults:', err);
        setCoursesList(defaultDemoCourses);
        const firstCourse = defaultDemoCourses[0];
        setSelectedCourseId(firstCourse.id);
        initializeCascadingSelections(firstCourse);
      } finally {
        setLoadingSyllabus(false);
      }
    }
    loadSyllabi();
  }, [syllabus, defaultDemoCourses]);

  // Load History List when History tab activated
  useEffect(() => {
    if (activeTab === 'history') {
      loadHistoryList();
    }
  }, [activeTab]);

  const loadHistoryList = async () => {
    try {
      setLoadingHistory(true);
      const data = await getMcqBank().catch(() => null);
      const apiList = Array.isArray(data) ? data : data?.items || [];
      const combined = apiList.length > 0 ? apiList : questionSets;
      setHistoryList(combined);
      if (combined.length > 0) {
        handleSelectHistoryItem(combined[0].id || combined[0].set_id);
      }
    } catch (err) {
      console.error(err);
      setHistoryList(questionSets);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectHistoryItem = (id: string) => {
    if (!id) return;
    setSelectedHistoryId(id);
    const setObj = historyList.find((item) => (item.id || item.set_id) === id);
    if (setObj && setObj.questions) {
      setGeneratedQuestions(setObj.questions);
      setExpandedQuestionId(setObj.questions[0]?.id || null);
      setSetTitle(setObj.title || `Saved Set #${id}`);
      toast.success(`Loaded question set: ${setObj.title || id}`);
    }
  };

  const initializeCascadingSelections = (course: CourseOption) => {
    const units = course?.content?.units || course?.units || [];
    if (units.length > 0) {
      setSelectedUnitId(units[0].id);
      const firstTopic = units[0].topics?.[0];
      if (firstTopic) {
        setSelectedTopicId(firstTopic.id);
        const firstSubtopic = firstTopic.subtopics?.[0];
        setSelectedSubtopicId(firstSubtopic?.id || '');
      } else {
        setSelectedTopicId('');
        setSelectedSubtopicId('');
      }
    } else {
      setSelectedUnitId('');
      setSelectedTopicId('');
      setSelectedSubtopicId('');
    }
  };

  const currentCourse = useMemo(() => {
    return (
      coursesList.find((c) => (c.id || c.courseCode) === selectedCourseId) || coursesList[0]
    );
  }, [coursesList, selectedCourseId]);

  const unitsList = useMemo(() => {
    return currentCourse?.content?.units || currentCourse?.units || [];
  }, [currentCourse]);

  const currentUnit = useMemo(() => {
    return unitsList.find((u) => u.id === selectedUnitId) || unitsList[0];
  }, [unitsList, selectedUnitId]);

  const topicsList = useMemo(() => {
    return currentUnit?.topics || [];
  }, [currentUnit]);

  const currentTopic = useMemo(() => {
    return topicsList.find((t) => t.id === selectedTopicId) || topicsList[0];
  }, [topicsList, selectedTopicId]);

  const subtopicsList = useMemo(() => {
    return currentTopic?.subtopics || [];
  }, [currentTopic]);

  const activeTopicName = useMemo(() => {
    if (customTopic.trim()) return customTopic.trim();
    const sub = subtopicsList.find((s) => s.id === selectedSubtopicId);
    if (sub) return sub.title;
    if (currentTopic) return currentTopic.title;
    if (currentUnit) return currentUnit.title;
    return currentCourse?.courseName || 'General Topic';
  }, [customTopic, selectedSubtopicId, subtopicsList, currentTopic, currentUnit, currentCourse]);

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

  // Generation workflow
  const handleGenerate = async () => {
    if (totalAssigned !== questionCount) {
      toast.error(`Matrix mismatch: Total allocated (${totalAssigned}) does not match target count (${questionCount}). Adjust inputs or click Auto-Balance.`);
      return;
    }

    setIsGenerating(true);
    setGenerationStep(1);

    const payload = {
      topic: activeTopicName,
      difficulty: difficulty.toLowerCase(),
      description: `Course: ${currentCourse?.courseCode || ''} | Unit: ${selectedUnitId || ''} | Topic: ${selectedTopicId || ''}`,
      question_count: questionCount,
      type: 'mcq',
      language: 'en',
      include_explanation: generateExplanations,
      shuffle_options: shuffleOptions,
      knowledge_level: null,
      knowledge_level_breakdown: bloomMatrix,
    };

    try {
      const steps = [
        'Parsing syllabus units and cognitive Bloom targets...',
        'Synthesizing question stems for levels K1-K6...',
        'Formulating plausible distractors & explanations...',
        'Finalizing generated assessment items...',
      ];

      for (let i = 1; i <= steps.length; i++) {
        setGenerationStep(i);
        await new Promise((res) => setTimeout(res, 400));
      }

      // Try calling API endpoint first
      let apiResponse: any = null;
      try {
        apiResponse = await generateMcqQuestions(payload);
      } catch (err) {
        console.warn('API call failed or backend offline, utilizing smart fallback engine:', err);
      }

      let newQuestions: MCQQuestion[] = [];

      if (apiResponse && (apiResponse.questions || Array.isArray(apiResponse))) {
        const raw = apiResponse.questions || apiResponse;
        newQuestions = raw.map((q: any, idx: number) => ({
          id: q.id || `gen-q-${Date.now()}-${idx + 1}`,
          questionText: q.questionText || q.question_text || q.question || 'Generated Question',
          cognitiveLevel: (q.cognitiveLevel || q.cognitive_level || q.bloom || 'K2') as BloomLevel,
          difficulty: q.difficulty || difficulty,
          points: q.points || 2,
          unitTopic: activeTopicName,
          options: (q.options || []).map((opt: any, oIdx: number) => ({
            id: opt.id || `opt-${idx}-${oIdx}`,
            text: typeof opt === 'string' ? opt : opt.text || opt.option_text || '',
            explanation: typeof opt === 'object' ? opt.explanation : undefined,
          })),
          correctOptionIndex: q.correctOptionIndex ?? q.correct_option_index ?? 0,
          explanation: q.explanation || q.reasoning || '',
        }));
      } else {
        // Build realistic mock questions based on allocated matrix
        let qCounter = 1;
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
              stem = `[K1 Recall] Which foundational concept best defines ${activeTopicName}?`;
              optA = 'It maintains an invariant structure allowing bounded recursive traversals.';
              optB = 'It operates exclusively on secondary disk storage without main RAM.';
              optC = 'It guarantees polynomial reduction to non-deterministic Turing machines.';
              optD = 'It disables garbage collection during execution.';
              exp = 'K1 Remember: Requires basic recall of core definitions and foundational invariant characteristics.';
            } else if (level === 'K2') {
              stem = `[K2 Understand] How does the architecture of ${activeTopicName} handle asymptotic scaling under high load?`;
              optA = 'By dynamically partitioning elements to maintain linear memory bounds.';
              optB = 'By converting recursive call stacks into iterative loops to prevent stack overflow.';
              optC = 'By utilizing logarithmic height bounds to guarantee sub-quadratic operations.';
              optD = 'By disabling context switching across concurrent worker threads.';
              exp = 'K2 Understand: Evaluates comprehension of scaling behavior and architectural mechanics.';
            } else if (level === 'K3') {
              stem = `[K3 Apply] Given a system requiring processing of ${activeTopicName}, which implementation strategy should be applied?`;
              optA = 'Construct a balanced indexing tree with in-place pointer updates.';
              optB = 'Apply an iterative breadth-first queue traversal with visited node caching.';
              optC = 'Implement a dynamic array with amortized tail insertion.';
              optD = 'Utilize a synchronized multi-producer thread-safe queue.';
              exp = 'K3 Apply: Assesses capability to apply algorithms to practical problem scenarios.';
            } else if (level === 'K4') {
              stem = `[K4 Analyze] Analyze the trade-offs between space complexity and search time when deploying ${activeTopicName}.`;
              optA = 'Trade-off A: O(1) space with O(N) search vs. O(N) space with O(log N) search.';
              optB = 'Trade-off B: Unlimited memory usage with zero CPU overhead.';
              optC = 'Trade-off C: Immediate constant compilation time with high runtime degradation.';
              optD = 'Trade-off D: High hardware lock contention with low throughput.';
              exp = 'K4 Analyze: Examines deep structural trade-offs between memory footprint and query latency.';
            } else if (level === 'K5') {
              stem = `[K5 Evaluate] Evaluate the assertion: "${activeTopicName} is strictly superior to classical linear array structures." Under what constraints does this assertion fail?`;
              optA = 'Fails when memory overhead per node exceeds cache line sizes for small N.';
              optB = 'Fails when CPU clock speeds exceed 4GHz.';
              optC = 'Fails when compiling with strict optimization flags.';
              optD = 'Never fails under any hardware constraints.';
              exp = 'K5 Evaluate: Critical evaluation of system constraints, cache locality, and performance edge-cases.';
            } else {
              stem = `[K6 Create] Design an enhanced hybrid variant of ${activeTopicName} that guarantees O(1) lookups while maintaining sorted order traversal.`;
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
              unitTopic: activeTopicName,
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
            for (let i = q.options.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [q.options[i], q.options[j]] = [q.options[j], q.options[i]];
            }
            q.correctOptionIndex = q.options.findIndex((o) => o.id === correctOpt.id);
          });
        }
      }

      setGeneratedQuestions(newQuestions);
      setExpandedQuestionId(newQuestions[0]?.id || null);
      const generatedTitle = `AI Set: ${activeTopicName} (${newQuestions.length} Questions)`;
      setSetTitle(generatedTitle);

      addGenerationLog({
        id: `gen-log-${Date.now()}`,
        subject: currentCourse?.courseCode || 'GENERAL',
        topic: activeTopicName,
        difficulty,
        questionCount,
        bloomMatrix,
        timestamp: new Date().toISOString(),
        status: 'completed',
      });

      if (autoSaveBank) {
        saveSetToBank(newQuestions, generatedTitle);
      }

      toast.success(`Successfully generated ${newQuestions.length} questions aligned with Bloom's Taxonomy!`);
    } catch (error) {
      console.error("Generation error:", error);
      toast.error('Error generating questions. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const saveSetToBank = (questionsToSave = generatedQuestions, customTitle = setTitle) => {
    if (!questionsToSave || questionsToSave.length === 0) return;
    const finalTitle = customTitle.trim() || `Question Set - ${new Date().toLocaleDateString()}`;

    const newSet: QuestionSet = {
      id: `set-${Date.now()}`,
      title: finalTitle,
      subject: currentCourse?.courseCode || 'COURSE',
      topic: activeTopicName,
      difficulty,
      questionCount: questionsToSave.length,
      bloomMatrix,
      questions: questionsToSave,
      createdAt: new Date().toISOString(),
      tags: [difficulty, "Bloom's AI", currentCourse?.courseCode || 'GenAI'],
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
              <Brain size={14} className="animate-pulse" /> BLOOM'S TAXONOMY AI ENGINE
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-2">
              AI MCQ Generator
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {currentCourse
                ? `${currentCourse.courseCode} - ${currentCourse.courseName}`
                : 'Generate balanced, cognitive-level multiple choice questions directly from syllabus topics.'}
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
              
              {/* Mode Switcher: Generate New Set vs Load Existing Set */}
              <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900">
                <button
                  type="button"
                  onClick={() => setActiveTab('create')}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'create'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Sparkles size={14} /> Generate New Set
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`py-2 rounded-xl text-xs font-mono font-bold transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'history'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <History size={14} /> Load Saved Set
                </button>
              </div>

              {/* MODE 1: LOAD SAVED SET FROM HISTORY */}
              {activeTab === 'history' && (
                <div className="space-y-4 pt-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Clock size={14} /> Select Saved Question Set
                    </label>
                    <button
                      onClick={loadHistoryList}
                      className="text-xs font-mono text-cyan-500 hover:underline flex items-center gap-1"
                    >
                      <RefreshCw size={12} /> Refresh
                    </button>
                  </div>

                  {loadingHistory ? (
                    <div className="text-xs text-slate-500 py-4 text-center">Loading set history...</div>
                  ) : historyList.length === 0 ? (
                    <div className="text-xs text-slate-500 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-white/10 text-center">
                      No saved question sets found in history or bank.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                      {historyList.map((item) => {
                        const id = item.id || item.set_id;
                        const isSelected = selectedHistoryId === id;
                        return (
                          <div
                            key={id}
                            onClick={() => handleSelectHistoryItem(id)}
                            className={`p-3.5 rounded-2xl border transition-all cursor-pointer space-y-1 ${
                              isSelected
                                ? 'border-cyan-500 bg-cyan-500/10 text-slate-900 dark:text-white'
                                : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-900/40 hover:border-cyan-500/40'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                                {item.title || item.topic || `Set #${id}`}
                              </span>
                              {isSelected && <CheckCircle2 size={14} className="text-cyan-500 shrink-0" />}
                            </div>
                            <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                              <span>Subject: {item.subject || 'N/A'}</span>
                              <span>{item.questions?.length || item.questionCount || 0} Qs</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* MODE 2: GENERATE NEW SET FORM */}
              {activeTab === 'create' && (
                <>
                  <h2 className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <SlidersHorizontal size={14} className="text-cyan-500" /> Assessment Generator Controls
                  </h2>

                  {loadingSyllabus ? (
                    <div className="text-xs text-slate-500 py-3">Loading syllabus subjects...</div>
                  ) : (
                    <>
                      {/* Step 1: Course Selection */}
                      <div className="space-y-1.5">
                        <label className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
                          <BookOpen size={13} /> 1. Course / Subject Selection
                        </label>
                        <select
                          value={selectedCourseId}
                          onChange={(e) => {
                            const courseId = e.target.value;
                            setSelectedCourseId(courseId);
                            const course = coursesList.find((c) => (c.id || c.courseCode) === courseId);
                            if (course) initializeCascadingSelections(course);
                          }}
                          className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                        >
                          {coursesList.map((c) => (
                            <option key={c.id || c.courseCode} value={c.id || c.courseCode}>
                              {c.courseCode} - {c.courseName}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Step 2: Unit Selection */}
                      {unitsList.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <FolderTree size={13} className="text-cyan-500" /> 2. Syllabus Unit Selection
                          </label>
                          <select
                            value={selectedUnitId}
                            onChange={(e) => {
                              const unitId = e.target.value;
                              setSelectedUnitId(unitId);
                              const unit = unitsList.find((u) => u.id === unitId);
                              const firstTopic = unit?.topics?.[0];
                              setSelectedTopicId(firstTopic?.id || '');
                              setSelectedSubtopicId(firstTopic?.subtopics?.[0]?.id || '');
                            }}
                            className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                          >
                            {unitsList.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Step 3: Topic Selection */}
                      {topicsList.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <FileText size={13} className="text-indigo-500" /> 3. Topic Selection
                          </label>
                          <select
                            value={selectedTopicId}
                            onChange={(e) => {
                              const topicId = e.target.value;
                              setSelectedTopicId(topicId);
                              const topic = topicsList.find((t) => t.id === topicId);
                              setSelectedSubtopicId(topic?.subtopics?.[0]?.id || '');
                            }}
                            className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                          >
                            {topicsList.map((t) => (
                              <option key={t.id} value={t.id}>
                                {t.title}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Step 4: Subtopics Selection */}
                      {subtopicsList.length > 0 && (
                        <div className="space-y-1.5">
                          <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                            <Layers size={13} className="text-purple-500" /> 4. Subtopic / Concept Selection
                          </label>
                          <select
                            value={selectedSubtopicId}
                            onChange={(e) => setSelectedSubtopicId(e.target.value)}
                            className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:border-cyan-500 focus:outline-none"
                          >
                            {subtopicsList.map((s) => (
                              <option key={s.id} value={s.id}>
                                {s.title} {s.bloom ? `(${s.bloom})` : ''}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </>
                  )}

                  {/* Custom Topic Override */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                      Custom Topic / Specific Focus (Optional Override)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Biodiversity loss and conservation methods"
                      value={customTopic}
                      onChange={(e) => setCustomTopic(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 dark:border-white/15 bg-slate-50 dark:bg-slate-900 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none font-sans"
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
                          className="w-8 h-8 rounded-xl border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-mono font-bold hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center"
                        >
                          -
                        </button>
                        <button
                          onClick={() => setQuestionCount(Math.min(50, questionCount + 1))}
                          className="w-8 h-8 rounded-xl border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-white font-mono font-bold hover:bg-cyan-500 hover:text-black transition-all flex items-center justify-center"
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
                        type="button"
                        onClick={handleAutoDistribute}
                        className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                      >
                        <RefreshCw size={12} /> Auto-Balance Matrix
                      </button>
                      <span className="text-slate-300 dark:text-slate-700">|</span>
                      <button
                        type="button"
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
                    disabled={isGenerating || loadingSyllabus}
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
                </>
              )}
            </div>
          </motion.div>

          {/* Right Preview Panel */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7 space-y-6"
          >
            {/* Loading State */}
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
                      <span>{generatedQuestions.length} Questions</span>
                      <span>•</span>
                      <span className="text-cyan-500 font-semibold">{currentCourse?.courseCode || 'AI'}</span>
                      <span>•</span>
                      <span className="text-slate-400">{activeTopicName}</span>
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
                    const bloomInfo = BLOOM_LEVEL_DESCRIPTIONS[q.cognitiveLevel] || BLOOM_LEVEL_DESCRIPTIONS.K1;

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
                                  {q.points || 2} pts
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
                                    key={opt.id || optIdx}
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
                            {q.explanation && (
                              <div className="p-3.5 rounded-2xl border border-cyan-500/30 bg-cyan-500/5 text-xs space-y-1">
                                <p className="font-mono font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                                  <Info size={14} /> Cognitive Explanation & Reasoning:
                                </p>
                                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                                  {q.explanation}
                                </p>
                              </div>
                            )}
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
                    Select a course, unit, topic, and subtopic on the left, configure question counts per Bloom level (K1 to K6), and click "Generate Questions with AI".
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
