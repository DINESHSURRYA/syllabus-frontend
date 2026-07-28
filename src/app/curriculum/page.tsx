"use client";

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Sparkles, 
  BookOpen, 
  Clock, 
  FlaskConical, 
  Layers, 
  ChevronRight, 
  X, 
  Check, 
  CheckSquare, 
  Square, 
  ChevronDown,
  ChevronUp,
  Info,
  Filter,
  RefreshCw,
  Tag,
  HelpCircle
} from 'lucide-react';
import dynamic from 'next/dynamic';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { useCurriculumData } from '@/hooks/use-curriculum-data';
import { useGuideStore } from '@/lib/guide-store';
import { PEDAGOGIES_CATALOG_DATA, CatalogPedagogyCategory } from '@/lib/data/pedagogies-catalog-data';
import { getUnitRomanTitle, formatUnitHeader } from '@/lib/normalizer';

const PedagogySection = dynamic(
  () => import('@/components/curriculum/PedagogySection').then((mod) => mod.PedagogySection),
  {
    loading: () => <div className="p-8 text-center text-sm font-mono text-slate-400 animate-pulse">Loading Pedagogy Catalog &amp; Bloom Framework...</div>,
    ssr: false,
  }
);

const ExperimentMapperTab = dynamic(
  () => import('@/components/curriculum/ExperimentMapperTab').then((mod) => mod.ExperimentMapperTab),
  {
    loading: () => <div className="p-8 text-center text-sm font-mono text-slate-400 animate-pulse">Loading Experiment Mapping Studio...</div>,
    ssr: false,
  }
);

const TeachingStrategiesModal = dynamic(
  () => import('@/components/curriculum/TeachingStrategiesModal').then((mod) => mod.TeachingStrategiesModal),
  { ssr: false }
);

const ALL_UNITS_LIST = ['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5'];

export default function CurriculumPage() {
  const { highlightedTargetId } = useGuideStore();
  // --------------------------------------------------------------------------
  // STATE MANAGEMENT
  // --------------------------------------------------------------------------
  const [selectedSyllabusId, setSelectedSyllabusId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('Recently Uploaded');

  // Custom Dropdown Open State (Fixes Dropdown Overflow Clipping Bug)
  const [isSyllabusDropdownOpen, setIsSyllabusDropdownOpen] = useState(false);
  
  // Unit Checkbox Selection State
  const [unitCheckboxes, setUnitCheckboxes] = useState<Record<string, boolean>>({
    'Unit 1': true,
    'Unit 2': true,
    'Unit 3': true,
    'Unit 4': true,
    'Unit 5': true
  });
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // Applied state (updated when user clicks "Apply Filters")
  const [appliedUnits, setAppliedUnits] = useState<string[]>(['Unit 1', 'Unit 2', 'Unit 3', 'Unit 4', 'Unit 5']);
  const [appliedDifficulty, setAppliedDifficulty] = useState('All');
  const [isApplying, setIsApplying] = useState(false);

  // Universal Hierarchy Generation State
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [generatingProgress, setGeneratingProgress] = useState<{ current: number; total: number }>({ current: 0, total: 0 });

  // Unit Hours & Hierarchy State (Unit level hours only)
  const [unitHoursState, setUnitHoursState] = useState<Record<number, number>>({
    1: 10,
    2: 10,
    3: 9,
    4: 8,
    5: 8
  });
  const [generatingUnit, setGeneratingUnit] = useState<Record<number, boolean>>({});
  const [dynamicUnitTopics, setDynamicUnitTopics] = useState<Record<number, any[]>>({});
  const [expandedUnits, setExpandedUnits] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true
  });

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'board' | 'pedagogy' | 'experiments'>('board');

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab');
      if (tabParam === 'pedagogy' || tabParam === 'experiments' || tabParam === 'board') {
        setActiveTab(tabParam as any);
      }
    }
  }, []);

  // Topic Interactive Pedagogy Popover Side-Drawer State
  const [popoverState, setPopoverState] = useState<{
    isOpen: boolean;
    title: string;
    unitName?: string;
    hierarchyReason?: string;
    suggestedPedagogies: {
      rank: number;
      categoryNumber: number;
      categoryName: string;
      confidenceScore: number;
      reasoning: string;
      teachingStyle: string;
      catalogCategory: CatalogPedagogyCategory;
    }[];
  }>({
    isOpen: false,
    title: '',
    suggestedPedagogies: []
  });

  // Pedagogy Category Dialog Modal State
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    category: CatalogPedagogyCategory | null;
  }>({
    isOpen: false,
    category: null
  });

  // Data fetching hook
  const { savedSyllabi, hierarchy, topTopics, isLoading, course } = useCurriculumData(
    searchQuery,
    appliedDifficulty,
    'All',
    selectedSyllabusId,
    sortBy
  );

  // Automatically sync unit level hours from loaded curriculum hierarchy
  React.useEffect(() => {
    if (hierarchy && hierarchy.length > 0) {
      const hoursMap: Record<number, number> = {};
      hierarchy.forEach((unitNode: any, idx: number) => {
        const uNum = idx + 1;
        const hVal = parseFloat(unitNode.learningHours || unitNode.hours || 0);
        if (hVal > 0) {
          hoursMap[uNum] = hVal;
        }
      });
      if (Object.keys(hoursMap).length > 0) {
        setUnitHoursState(hoursMap);
      }
    }
  }, [hierarchy]);

  // Filter saved syllabi for dropdown
  const filteredSyllabi = useMemo(() => {
    if (!searchQuery.trim()) return savedSyllabi;
    const q = searchQuery.toLowerCase().trim();
    return savedSyllabi.filter(
      (s) => s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
    );
  }, [savedSyllabi, searchQuery]);

  // Auto-select saved syllabus matching search query
  React.useEffect(() => {
    if (!searchQuery.trim()) return;
    const q = searchQuery.toLowerCase().trim();
    const match = savedSyllabi.find(
      (s) => s.code.toLowerCase() === q || s.title.toLowerCase() === q || s.code.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
    );
    if (match && match.id && match.id !== selectedSyllabusId) {
      setSelectedSyllabusId(match.id);
    }
  }, [searchQuery, savedSyllabi, selectedSyllabusId]);

  const activeSyllabus = useMemo(() => {
    if (selectedSyllabusId && savedSyllabi.some((s) => s.id === selectedSyllabusId)) {
      return savedSyllabi.find((s) => s.id === selectedSyllabusId);
    }
    if (savedSyllabi.length > 0) {
      return savedSyllabi[0];
    }
    if (course) {
      return { id: course.id, code: course.code, title: course.courseName };
    }
    return null;
  }, [savedSyllabi, selectedSyllabusId, course]);

  const isAllSelected = useMemo(() => {
    return ALL_UNITS_LIST.every((u) => unitCheckboxes[u]);
  }, [unitCheckboxes]);

  const toggleSelectAll = () => {
    const nextState = !isAllSelected;
    const updated: Record<string, boolean> = {};
    ALL_UNITS_LIST.forEach((u) => {
      updated[u] = nextState;
    });
    setUnitCheckboxes(updated);
  };

  const toggleUnitCheckbox = (unitName: string) => {
    setUnitCheckboxes((prev) => ({
      ...prev,
      [unitName]: !prev[unitName]
    }));
  };

  const toggleExpandUnit = (unitNum: number) => {
    setExpandedUnits(prev => ({
      ...prev,
      [unitNum]: !prev[unitNum]
    }));
  };

  const handleApplyFilters = async () => {
    setIsApplying(true);
    const selected = Object.keys(unitCheckboxes).filter((key) => unitCheckboxes[key]);
    setAppliedUnits(selected);
    setAppliedDifficulty(difficultyFilter);

    // PostgreSQL Course Fetching Logic on "Apply"
    try {
      const targetId = selectedSyllabusId || activeSyllabus?.code || activeSyllabus?.id || 'CS3451';
      const res = await fetch(`http://localhost:8000/api/courses/${encodeURIComponent(targetId)}`);
      if (res.ok) {
        const dbCourse = await res.json();
        if (dbCourse && dbCourse.units) {
          // Sync PostgreSQL unit hours & raw topic state
          const hoursMap: Record<number, number> = {};
          dbCourse.units.forEach((u: any, idx: number) => {
            const uNum = u.unitNumber || idx + 1;
            hoursMap[uNum] = u.learningHours || 9;
          });
          if (Object.keys(hoursMap).length > 0) {
            setUnitHoursState(prev => ({ ...prev, ...hoursMap }));
          }
        }
      }
    } catch (err) {
      console.warn('[ApplyFilters] PostgreSQL course fetch notice:', err);
    } finally {
      setTimeout(() => {
        setIsApplying(false);
      }, 300);
    }
  };

  // Filter hierarchy by applied units with precise unitNumber matching
  const filteredUnitsHierarchy = useMemo(() => {
    if (!hierarchy || hierarchy.length === 0) return [];
    if (appliedUnits.length === 5) return hierarchy;

    return hierarchy.filter((unitNode, idx) => {
      const uNum = (unitNode as any).unitNumber || (unitNode as any).unit_number || idx + 1;
      const unitNumStr = `Unit ${uNum}`;
      return appliedUnits.includes(unitNumStr);
    });
  }, [hierarchy, appliedUnits]);

  // Universal Hierarchy Generation for all currently visible/filtered units
  const handleGenerateAllHierarchies = async () => {
    if (filteredUnitsHierarchy.length === 0 || isGeneratingAll) return;
    setIsGeneratingAll(true);
    const total = filteredUnitsHierarchy.length;
    setGeneratingProgress({ current: 0, total });

    let completed = 0;
    for (const unitNode of filteredUnitsHierarchy) {
      const uNum = (unitNode as any).unitNumber || (unitNode as any).unit_number || 1;
      await handleGenerateUnitHierarchy(uNum, unitNode.title);
      completed++;
      setGeneratingProgress({ current: completed, total });
    }

    setIsGeneratingAll(false);
  };

  // Client AI Fallback Hierarchy Generator
  const generateClientFallbackHierarchy = (unitNum: number, uTitle: string, hours: number) => {
    const cleanTitle = uTitle.replace(/Unit \d+:\s*/i, '');
    const cat2 = PEDAGOGIES_CATALOG_DATA.find(c => c.id === 'cat-2') || PEDAGOGIES_CATALOG_DATA[1];
    const cat3 = PEDAGOGIES_CATALOG_DATA.find(c => c.id === 'cat-3') || PEDAGOGIES_CATALOG_DATA[2];
    const cat6 = PEDAGOGIES_CATALOG_DATA.find(c => c.id === 'cat-6') || PEDAGOGIES_CATALOG_DATA[5];
    const cat23 = PEDAGOGIES_CATALOG_DATA.find(c => c.id === 'cat-23') || PEDAGOGIES_CATALOG_DATA[22];

    const fallbackTopics = [
      {
        id: `gen-t-${unitNum}-1`,
        title: `Core Principles & Theoretical Foundations of ${cleanTitle}`,
        description: `Introduces essential concepts, formal models, and structural prerequisites for ${cleanTitle}.`,
        similarTopics: [`Fundamental ${cleanTitle}`, "Domain Abstractions", "Theoretical Frameworks", "System Primitives"],
        hierarchyReason: `Establishes core domain prerequisites for ${cleanTitle} before executing advanced algorithmic tasks.`,
        suggestedPedagogies: [
          { rank: 1, categoryNumber: cat3.number, categoryName: cat3.category, confidenceScore: 97, reasoning: `Active student-centered exercises solidify basic abstractions in '${cleanTitle}'.`, teachingStyle: cat3.teachingStyle, catalogCategory: cat3 },
          { rank: 2, categoryNumber: cat2.number, categoryName: cat2.category, confidenceScore: 94, reasoning: `Socratic inquiry & peer debate unpack trade-offs and structural assumptions.`, teachingStyle: cat2.teachingStyle, catalogCategory: cat2 },
          { rank: 3, categoryNumber: cat6.number, categoryName: cat6.category, confidenceScore: 91, reasoning: `Diagnostic scenario troubleshooting trains root-cause conceptual alignment.`, teachingStyle: cat6.teachingStyle, catalogCategory: cat6 }
        ],
        subtopics: [
          {
            id: `gen-sub-${unitNum}-1-1`,
            title: `Mathematical & Conceptual Definitions in ${cleanTitle}`,
            hierarchyReason: "Defines formal notation and baseline terminology.",
            suggestedPedagogies: [
              { rank: 1, categoryNumber: cat3.number, categoryName: cat3.category, confidenceScore: 95, reasoning: `Think-Pair-Share checks notation mastery immediately.`, teachingStyle: cat3.teachingStyle, catalogCategory: cat3 },
              { rank: 2, categoryNumber: cat2.number, categoryName: cat2.category, confidenceScore: 92, reasoning: `Guided Q&A verifies mathematical clarity.`, teachingStyle: cat2.teachingStyle, catalogCategory: cat2 },
              { rank: 3, categoryNumber: cat6.number, categoryName: cat6.category, confidenceScore: 89, reasoning: `Case scenario checks edge conditions.`, teachingStyle: cat6.teachingStyle, catalogCategory: cat6 }
            ]
          },
          {
            id: `gen-sub-${unitNum}-1-2`,
            title: `Structural Components & System Boundaries`,
            hierarchyReason: "Maps external dependencies and architectural limits.",
            suggestedPedagogies: [
              { rank: 1, categoryNumber: cat23.number, categoryName: cat23.category, confidenceScore: 96, reasoning: `Hands-on diagramming highlights interface boundaries.`, teachingStyle: cat23.teachingStyle, catalogCategory: cat23 },
              { rank: 2, categoryNumber: cat3.number, categoryName: cat3.category, confidenceScore: 93, reasoning: `Concept mapping clarifies subsystem connections.`, teachingStyle: cat3.teachingStyle, catalogCategory: cat3 },
              { rank: 3, categoryNumber: cat2.number, categoryName: cat2.category, confidenceScore: 90, reasoning: `Peer review critiques interface design choices.`, teachingStyle: cat2.teachingStyle, catalogCategory: cat2 }
            ]
          }
        ]
      },
      {
        id: `gen-t-${unitNum}-2`,
        title: `Algorithmic Mechanics & Execution Models`,
        description: `Detailed execution patterns, algorithmic step procedures, and computational workflows.`,
        similarTopics: ["Algorithmic Design", "Performance Tradeoffs", "Optimization Strategy", "Computational Complexity"],
        hierarchyReason: `Transforms theoretical knowledge into executable algorithmic procedures and optimization patterns.`,
        suggestedPedagogies: [
          { rank: 1, categoryNumber: cat23.number, categoryName: cat23.category, confidenceScore: 98, reasoning: `Controlled lab execution directly reinforces practical execution of '${cleanTitle}'.`, teachingStyle: cat23.teachingStyle, catalogCategory: cat23 },
          { rank: 2, categoryNumber: cat6.number, categoryName: cat6.category, confidenceScore: 94, reasoning: `Problem-based troubleshooting sharpens algorithm debugging.`, teachingStyle: cat6.teachingStyle, catalogCategory: cat6 },
          { rank: 3, categoryNumber: cat3.number, categoryName: cat3.category, confidenceScore: 92, reasoning: `Peer live coding drives immediate syntax feedback.`, teachingStyle: cat3.teachingStyle, catalogCategory: cat3 }
        ],
        subtopics: [
          {
            id: `gen-sub-${unitNum}-2-1`,
            title: `Algorithmic Step Execution & Data Flow`,
            hierarchyReason: "Analyzes step-by-step state transitions during algorithm execution.",
            suggestedPedagogies: [
              { rank: 1, categoryNumber: cat23.number, categoryName: cat23.category, confidenceScore: 96, reasoning: `Live step execution in IDE highlights memory states.`, teachingStyle: cat23.teachingStyle, catalogCategory: cat23 },
              { rank: 2, categoryNumber: cat3.number, categoryName: cat3.category, confidenceScore: 92, reasoning: `Interactive trace tables verify loop invariants.`, teachingStyle: cat3.teachingStyle, catalogCategory: cat3 },
              { rank: 3, categoryNumber: cat6.number, categoryName: cat6.category, confidenceScore: 89, reasoning: `Scenario analysis checks boundary cases.`, teachingStyle: cat6.teachingStyle, catalogCategory: cat6 }
            ]
          },
          {
            id: `gen-sub-${unitNum}-2-2`,
            title: `Complexity Bounds & Optimization Techniques`,
            hierarchyReason: "Evaluates time/space tradeoffs under scaling workloads.",
            suggestedPedagogies: [
              { rank: 1, categoryNumber: cat6.number, categoryName: cat6.category, confidenceScore: 95, reasoning: `Bottleneck diagnosis exercises reveal scaling limits.`, teachingStyle: cat6.teachingStyle, catalogCategory: cat6 },
              { rank: 2, categoryNumber: cat2.number, categoryName: cat2.category, confidenceScore: 93, reasoning: `Debating asymptotic tradeoffs compares alternative approaches.`, teachingStyle: cat2.teachingStyle, catalogCategory: cat2 },
              { rank: 3, categoryNumber: cat3.number, categoryName: cat3.category, confidenceScore: 90, reasoning: `Benchmarking code drills validate asymptotic predictions.`, teachingStyle: cat3.teachingStyle, catalogCategory: cat3 }
            ]
          }
        ]
      },
      {
        id: `gen-t-${unitNum}-3`,
        title: `Production Deployment, Integration & Case Studies`,
        description: `Real-world application patterns, fault-tolerant integration, and industry case studies.`,
        similarTopics: ["System Integration", "Production Engineering", "Diagnostic Troubleshooting", "Case Analysis"],
        hierarchyReason: `Synthesizes core topics into production-grade systems engineering practice.`,
        suggestedPedagogies: [
          { rank: 1, categoryNumber: cat6.number, categoryName: cat6.category, confidenceScore: 96, reasoning: `Industry case study debugging trains real-world diagnostic resilience.`, teachingStyle: cat6.teachingStyle, catalogCategory: cat6 },
          { rank: 2, categoryNumber: cat23.number, categoryName: cat23.category, confidenceScore: 95, reasoning: `End-to-end lab deployment validates real system integration.`, teachingStyle: cat23.teachingStyle, catalogCategory: cat23 },
          { rank: 3, categoryNumber: cat2.number, categoryName: cat2.category, confidenceScore: 91, reasoning: `Architecture review panel evaluates production reliability.`, teachingStyle: cat2.teachingStyle, catalogCategory: cat2 }
        ],
        subtopics: [
          {
            id: `gen-sub-${unitNum}-3-1`,
            title: `Fault Recovery & Diagnostic Troubleshooting`,
            hierarchyReason: "Prepares students to handle runtime exceptions and system outages.",
            suggestedPedagogies: [
              { rank: 1, categoryNumber: cat6.number, categoryName: cat6.category, confidenceScore: 97, reasoning: `Simulated outage drills train rapid incident resolution.`, teachingStyle: cat6.teachingStyle, catalogCategory: cat6 },
              { rank: 2, categoryNumber: cat23.number, categoryName: cat23.category, confidenceScore: 94, reasoning: `Log tracing lab exercises teach telemetry inspection.`, teachingStyle: cat23.teachingStyle, catalogCategory: cat23 },
              { rank: 3, categoryNumber: cat3.number, categoryName: cat3.category, confidenceScore: 90, reasoning: `Peer post-mortem analysis identifies root causes.`, teachingStyle: cat3.teachingStyle, catalogCategory: cat3 }
            ]
          }
        ]
      }
    ];

    setDynamicUnitTopics(prev => ({ ...prev, [unitNum]: fallbackTopics }));
  };

  // OpenAI Hierarchy & Pedagogy Generation Trigger
  const handleGenerateUnitHierarchy = async (unitNum: number, uTitle: string) => {
    setGeneratingUnit(prev => ({ ...prev, [unitNum]: true }));
    const currentHours = unitHoursState[unitNum] || 10;

    // Extract raw DB topics for selected unit using explicit unit number
    const targetUnitNode = 
      hierarchy.find(u => ((u as any).unitNumber || (u as any).unit_number) === unitNum) ||
      filteredUnitsHierarchy.find(u => ((u as any).unitNumber || (u as any).unit_number) === unitNum) ||
      hierarchy[unitNum - 1];

    let rawDbTopics: string[] = [];

    if (targetUnitNode) {
      if (Array.isArray((targetUnitNode as any).rawTopicNames) && (targetUnitNode as any).rawTopicNames.length > 0) {
        rawDbTopics = (targetUnitNode as any).rawTopicNames;
      } else if (Array.isArray(targetUnitNode.children) && targetUnitNode.children.length > 0) {
        rawDbTopics = targetUnitNode.children.map((c: any) => c.title || c.name || String(c));
      }
    }

    if (!rawDbTopics || rawDbTopics.length === 0) {
      rawDbTopics = [
        "Core Concepts & Architecture",
        "Process & Resource Mechanics",
        "Interface Protocols & Communication",
        "System Verification & Diagnostics"
      ];
    }

    try {
      // Endpoint call to OpenAI API /api/generate-hierarchy
      const res = await fetch('http://localhost:8000/api/generate-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: activeSyllabus?.code || 'CS3451',
          courseTitle: activeSyllabus?.title || 'Introduction to Operating Systems',
          unit: uTitle || `Unit ${unitNum}`,
          topics: rawDbTopics
        })
      });

      if (res.ok) {
        const data = await res.json();
        const hierarchyList = data?.hierarchy || data?.topics;

        if (data && Array.isArray(hierarchyList) && hierarchyList.length > 0) {
          const formattedTopics = hierarchyList.map((item: any, tIdx: number) => {
            // Map top 3 pedagogies to catalog
            const rawPeds = item.top_3_pedagogies || item.top3Pedagogies || item.suggestedPedagogies || [];
            const pedagogies = rawPeds.slice(0, 3).map((p: any, pIdx: number) => {
              const pName = p.name || p.strategyName || p.method || "Active Practice";
              const pDesc = p.description || p.reasoning || p.reason || `Pedagogical strategy for ${item.title}`;
              const catNum = p.categoryNumber || (pIdx === 0 ? 3 : (pIdx === 1 ? 2 : 6));
              const catalogCat = PEDAGOGIES_CATALOG_DATA.find(c => c.number === catNum) || PEDAGOGIES_CATALOG_DATA[pIdx % PEDAGOGIES_CATALOG_DATA.length];

              return {
                rank: pIdx + 1,
                categoryNumber: catNum,
                categoryName: pName,
                confidenceScore: 97 - (pIdx * 3),
                reasoning: pDesc,
                teachingStyle: catalogCat?.teachingStyle || "Interactive Student-Centered",
                catalogCategory: catalogCat
              };
            });

            // Map subtopics array
            const rawSubs = item.subtopics || [];
            const formattedSubtopics = rawSubs.map((sub: any, sIdx: number) => {
              const subTitle = typeof sub === 'string' ? sub : sub.title || sub.name || `Subtopic ${sIdx + 1}`;
              const subReason = (typeof sub === 'object' && sub.reasoning) || (typeof sub === 'object' && sub.hierarchyReason) || `Granular component supporting ${item.title}.`;

              return {
                id: `sub-${unitNum}-${tIdx + 1}-${sIdx + 1}`,
                title: subTitle,
                hierarchyReason: subReason,
                suggestedPedagogies: pedagogies
              };
            });

            return {
              id: item.topic_id || item.id || `topic-${unitNum}-${tIdx + 1}`,
              title: item.title,
              description: item.reasoning || item.description || `Core topic covering ${item.title}`,
              similarTopics: item.similarTopics || [item.title, "Core Concept", "Domain Prerequisite"],
              hierarchyReason: item.reasoning || item.hierarchyReason || `Establishes core foundation for ${item.title}.`,
              suggestedPedagogies: pedagogies,
              subtopics: formattedSubtopics
            };
          });

          setDynamicUnitTopics(prev => ({ ...prev, [unitNum]: formattedTopics }));
          setGeneratingUnit(prev => ({ ...prev, [unitNum]: false }));
          return;
        }
      }

      // Try legacy endpoint fallback if route returned different structure
      const legacyRes = await fetch('http://localhost:8000/api/curriculum/generate-unit-hierarchy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseCode: activeSyllabus?.code || 'CS3451',
          courseTitle: activeSyllabus?.title || 'Operating Systems',
          unitNumber: unitNum,
          unitTitle: uTitle,
          unitHours: currentHours
        })
      });

      if (legacyRes.ok) {
        const legacyData = await legacyRes.json();
        if (legacyData && Array.isArray(legacyData.topics) && legacyData.topics.length > 0) {
          setDynamicUnitTopics(prev => ({ ...prev, [unitNum]: legacyData.topics }));
          setGeneratingUnit(prev => ({ ...prev, [unitNum]: false }));
          return;
        }
      }

      generateClientFallbackHierarchy(unitNum, uTitle, currentHours);
    } catch (err) {
      console.warn('[GenerateHierarchy] OpenAI call notice:', err);
      generateClientFallbackHierarchy(unitNum, uTitle, currentHours);
    } finally {
      setGeneratingUnit(prev => ({ ...prev, [unitNum]: false }));
    }
  };

  // Helper to open Interactive Pedagogy Popover Drawer for Topic/Subtopic
  const handleOpenTopicPedagogyPopover = (
    itemNode: any,
    unitName: string
  ) => {
    const title = itemNode.title;
    const reason = itemNode.hierarchyReason || `Establishes essential domain prerequisites for ${title} within the DAG curriculum progression.`;
    
    let suggestedPedagogies = itemNode.suggestedPedagogies || [];

    if (!suggestedPedagogies || suggestedPedagogies.length === 0) {
      const cat2 = PEDAGOGIES_CATALOG_DATA.find(c => c.id === 'cat-2') || PEDAGOGIES_CATALOG_DATA[1];
      const cat3 = PEDAGOGIES_CATALOG_DATA.find(c => c.id === 'cat-3') || PEDAGOGIES_CATALOG_DATA[2];
      const cat6 = PEDAGOGIES_CATALOG_DATA.find(c => c.id === 'cat-6') || PEDAGOGIES_CATALOG_DATA[5];

      suggestedPedagogies = [
        {
          rank: 1,
          categoryNumber: cat3.number,
          categoryName: cat3.category,
          confidenceScore: 96,
          reasoning: `Active student-centered exercises like Think-Pair-Share reinforce core logic in '${title}'.`,
          teachingStyle: cat3.teachingStyle,
          catalogCategory: cat3
        },
        {
          rank: 2,
          categoryNumber: cat2.number,
          categoryName: cat2.category,
          confidenceScore: 94,
          reasoning: `Socratic inquiry & peer debate unpack trade-offs and structural assumptions for '${title}'.`,
          teachingStyle: cat2.teachingStyle,
          catalogCategory: cat2
        },
        {
          rank: 3,
          categoryNumber: cat6.number,
          categoryName: cat6.category,
          confidenceScore: 92,
          reasoning: `Diagnostic scenario troubleshooting trains root-cause debugging for '${title}'.`,
          teachingStyle: cat6.teachingStyle,
          catalogCategory: cat6
        }
      ];
    }

    setPopoverState({
      isOpen: true,
      title,
      unitName,
      hierarchyReason: reason,
      suggestedPedagogies
    });
  };

  // Helper to open Pedagogy Category Dialog Modal
  const handleOpenCategoryModal = (cat: CatalogPedagogyCategory) => {
    setCategoryModal({
      isOpen: true,
      category: cat
    });
  };

  const hasExperiments = useMemo(() => {
    const exps = (course as any)?.labExperiments || (course as any)?.experiments || (activeSyllabus as any)?.labExperiments || (activeSyllabus as any)?.experiments || [];
    return Array.isArray(exps) && exps.length > 0;
  }, [course, activeSyllabus]);

  React.useEffect(() => {
    if (!hasExperiments && activeTab === 'experiments') {
      setActiveTab('board');
    }
  }, [hasExperiments, activeTab]);

  return (
    <AppShell>
      <div className="flex flex-col gap-5 overflow-visible">
        
        {/* ==================================================================== */}
        {/* TOP FILTER BAR & CONTROLS (Overflow-Visible + Floating Z-50 Layer)    */}
        {/* ==================================================================== */}
        <div className="sticky top-0 z-40 rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)]/95 backdrop-blur-2xl p-4 shadow-lg overflow-visible">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between overflow-visible">
            
            {/* Live Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-cyan-400" />
              <input
                type="text"
                placeholder="Search syllabuses by course code or title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-9 py-2 text-xs font-mono font-bold bg-[var(--bg-subtle)] text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-2xl outline-none focus:border-cyan-400 transition-all placeholder:text-[var(--text-muted)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Dynamic Syllabus Custom Floating Dropdown Selector & Unit Filters */}
            <div className="flex items-center gap-2.5 flex-wrap overflow-visible">
              
              {/* Dropdown Bug Fix: Custom Floating Dropdown with z-50, max-h-60, overflow-y-auto */}
              <div className="relative min-w-[240px] overflow-visible">
                <button
                  type="button"
                  onClick={() => setIsSyllabusDropdownOpen(!isSyllabusDropdownOpen)}
                  className="w-full flex items-center justify-between bg-[var(--bg-hover)] text-xs font-mono font-bold text-[var(--text-primary)] border border-[var(--border-subtle)] rounded-2xl px-3.5 py-2.5 outline-none hover:border-indigo-400 transition-all shadow-sm"
                >
                  <span className="truncate">
                    {selectedSyllabusId && filteredSyllabi.find(s => s.id === selectedSyllabusId)
                      ? `${filteredSyllabi.find(s => s.id === selectedSyllabusId)?.code}: ${filteredSyllabi.find(s => s.id === selectedSyllabusId)?.title}`
                      : activeSyllabus
                      ? `${activeSyllabus.code}: ${activeSyllabus.title}`
                      : "Select Saved Syllabus..."}
                  </span>
                  <ChevronDown className={`w-4 h-4 text-indigo-400 transition-transform ${isSyllabusDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Floating Options Layer */}
                <AnimatePresence>
                  {isSyllabusDropdownOpen && (
                    <>
                      {/* Backdrop dismiss */}
                      <div 
                        className="fixed inset-0 z-40" 
                        onClick={() => setIsSyllabusDropdownOpen(false)} 
                      />

                      <motion.div
                        initial={{ opacity: 0, y: -8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="absolute left-0 right-0 top-full mt-1.5 z-50 max-h-60 overflow-y-auto bg-[var(--bg-card)] border border-indigo-500/40 rounded-2xl shadow-2xl p-1.5 space-y-1 text-xs font-mono backdrop-blur-2xl text-[var(--text-primary)] custom-scrollbar"
                      >
                        <div
                          onClick={() => {
                            setSelectedSyllabusId('');
                            setIsSyllabusDropdownOpen(false);
                          }}
                          className={`px-3 py-2 rounded-xl cursor-pointer transition-colors ${
                            !selectedSyllabusId ? 'bg-indigo-600 text-white font-bold' : 'hover:bg-[var(--bg-hover)] text-[var(--text-secondary)]'
                          }`}
                        >
                          Select Saved Syllabus...
                        </div>
                        {filteredSyllabi.length === 0 ? (
                          <div className="px-3 py-3 text-center text-xs font-mono text-[var(--text-muted)] italic">
                            No saved syllabi found in PostgreSQL DB
                          </div>
                        ) : (
                          filteredSyllabi.map((s) => (
                            <div
                              key={s.id}
                              onClick={() => {
                                setSelectedSyllabusId(s.id);
                                setIsSyllabusDropdownOpen(false);
                              }}
                              className={`px-3 py-2 rounded-xl cursor-pointer transition-colors flex items-center justify-between gap-2 ${
                                selectedSyllabusId === s.id
                                  ? 'bg-indigo-600 text-white font-bold border border-indigo-700'
                                  : 'hover:bg-[var(--bg-hover)] text-[var(--text-primary)]'
                              }`}
                            >
                              <div className="flex flex-col min-w-0 text-left">
                                <span className="font-bold truncate text-[var(--text-primary)]">{s.code}</span>
                                <span className="text-[var(--text-secondary)] text-[11px] truncate">{s.title}</span>
                              </div>
                              {selectedSyllabusId === s.id && <Check size={14} className="text-white shrink-0" />}
                            </div>
                          ))
                        )}
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* Unit Checkboxes Group */}
              <div className="flex items-center gap-1.5 flex-wrap bg-[var(--bg-subtle)] p-1 rounded-2xl border border-[var(--border-subtle)]">
                <button
                  onClick={toggleSelectAll}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-mono font-bold transition-all ${
                    isAllSelected
                      ? 'bg-indigo-600 text-white shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {isAllSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                  All
                </button>

                {ALL_UNITS_LIST.map((uName) => {
                  const checked = !!unitCheckboxes[uName];
                  return (
                    <button
                      key={uName}
                      onClick={() => toggleUnitCheckbox(uName)}
                      className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-[11px] font-mono font-semibold transition-all ${
                        checked
                          ? 'bg-indigo-600 text-white border border-indigo-700 shadow-sm'
                          : 'text-[var(--text-muted)] hover:text-[var(--text-secondary)]'
                      }`}
                    >
                      {checked ? <Check size={12} className="text-white" /> : <Square size={12} />}
                      {uName}
                    </button>
                  );
                })}
              </div>

              {/* Apply Button Trigger */}
              <Button
                onClick={handleApplyFilters}
                disabled={isApplying}
                size="sm"
                className="bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold shadow-md flex items-center gap-1.5 px-4 py-2 rounded-2xl"
              >
                {isApplying ? <span className="animate-spin">⏳</span> : <Filter size={14} />}
                Apply
              </Button>
            </div>
          </div>

          {/* Active Syllabus Metadata HUD */}
          {activeSyllabus && (
            <div className="mt-3 pt-3 border-t border-[var(--border-subtle)] space-y-2 text-[11px] font-mono text-[var(--text-secondary)]">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-extrabold uppercase shadow-sm">
                    ACTIVE: {activeSyllabus.code}
                  </span>
                  <span className="font-extrabold text-[var(--text-primary)] text-xs">{activeSyllabus.title}</span>
                </div>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="text-indigo-500 dark:text-indigo-400 font-bold">{course?.department || 'Computer Science & Engineering'}</span>
                  <span>•</span>
                  <span>{course?.semester || 'Semester V'}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-bold">{course?.credits || 4} Credits</span>
                  <span>•</span>
                  <span className="text-indigo-400 font-bold">Total Course Hours: {course?.hours || 45}h</span>
                  <span className="text-emerald-500 font-semibold">● Dynamic AI Sync</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Header Title & Navigation Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 px-2">
          <h2 className="text-xl font-black text-[var(--text-primary)] tracking-tight flex items-center gap-2">
            <Layers className="w-5 h-5 text-indigo-500" />
            Syllabus & Pedagogy View
          </h2>

          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="flex items-center gap-1.5 flex-wrap bg-[var(--bg-card)] p-1 rounded-2xl border border-[var(--border-subtle)]">
              <button
                onClick={() => setActiveTab('board')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'board' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Layers size={14} /> 1 Col × 5 Rows Unit Board
              </button>

              <button
                onClick={() => setActiveTab('pedagogy')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  activeTab === 'pedagogy' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sparkles size={14} /> Pedagogy Catalog
              </button>

              {hasExperiments && (
                <button
                  onClick={() => setActiveTab('experiments')}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    activeTab === 'experiments' ? 'bg-indigo-600 text-white shadow-md' : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <FlaskConical size={14} /> Experiments
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================================== */}
        {/* CURRICULUM BOARD: VERTICAL 1 COLUMN x 5 ROWS STRUCTURED LAYOUT       */}
        {/* ==================================================================== */}
        {activeTab === 'board' && (
          <div className="space-y-4">
            
            {/* 1 Column x 5 Rows Container */}
            <div className="flex flex-col gap-4">
              {!isLoading && filteredUnitsHierarchy.length === 0 ? (
                <div className="rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-10 text-center space-y-3 shadow-lg">
                  <Layers className="w-12 h-12 text-cyan-400 mx-auto opacity-80" />
                  <h3 className="text-lg font-extrabold text-[var(--text-primary)] tracking-tight">
                    No Saved Syllabus Found in PostgreSQL Database
                  </h3>
                  <p className="text-xs font-mono text-[var(--text-secondary)] max-w-md mx-auto leading-relaxed">
                    Only saved and verified syllabi from the PostgreSQL DB are shown on the curriculum tree page. Upload a syllabus PDF and complete verification to save it.
                  </p>
                </div>
              ) : (
                filteredUnitsHierarchy.map((unitNode, uIdx) => {
                  const unitNum = (unitNode as any).unitNumber || (unitNode as any).unit_number || uIdx + 1;
                  const unitRomanBadge = getUnitRomanTitle(unitNum);
                  const unitHeaderTitle = formatUnitHeader(unitNum, unitNode.title);
                  const isExpanded = !!expandedUnits[unitNum];
                
                // Get unit level total hours
                const currentHours = unitHoursState[unitNum] ?? (unitNode.learningHours || (unitNode as any).hours || 9);
                const isGenerating = !!generatingUnit[unitNum];

                // Dynamically generated topics or fallback hierarchy topics
                const rawTopics = dynamicUnitTopics[unitNum] || unitNode.children || [];

                return (
                  <motion.div
                    key={unitNode.id || uIdx}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: uIdx * 0.04 }}
                    className="w-full rounded-3xl border border-[var(--border-subtle)] bg-[var(--bg-card)] p-5 sm:p-6 shadow-lg space-y-4 hover:border-indigo-500/40 transition-all"
                  >
                    {/* Unit Row Header (1 Col x 5 Rows Format) */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="px-3 py-0.5 rounded-full text-xs font-mono font-extrabold bg-indigo-600 text-white uppercase shadow-sm">
                            {unitRomanBadge}
                          </span>
                          
                          {/* Unit Level Hours Only Rule */}
                          <div className="flex items-center gap-1 bg-indigo-500/15 border border-indigo-500/30 px-3 py-1 rounded-full text-xs font-mono font-bold text-indigo-400 dark:text-indigo-300">
                            <span>⏱️ Unit Level Hours:</span>
                            <input
                              type="number"
                              min={1}
                              max={100}
                              value={currentHours || ''}
                              onChange={(e) => {
                                const val = parseInt(e.target.value) || 0;
                                setUnitHoursState(prev => ({ ...prev, [unitNum]: val }));
                              }}
                              placeholder="Set Hours"
                              className="w-12 bg-[var(--bg-card)] text-indigo-400 dark:text-indigo-200 border border-indigo-500/40 rounded px-1.5 py-0.5 text-xs font-mono text-center outline-none focus:border-indigo-500"
                            />
                            <span>Hours</span>
                          </div>

                          <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/30 px-2.5 py-0.5 rounded-full">
                            🎓 {unitNum <= 2 ? '1.0 Credit' : '0.8 Credit'}
                          </span>
                        </div>

                        <h3 className="text-lg sm:text-xl font-extrabold text-[var(--text-primary)] tracking-tight">
                          {unitHeaderTitle}
                        </h3>
                      </div>

                      {/* Unit Level Action Buttons: Expand Toggle */}
                      <div className="flex items-center gap-2.5 shrink-0 self-start md:self-center flex-wrap">
                        <button
                          onClick={() => toggleExpandUnit(unitNum)}
                          className="p-2 rounded-2xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-indigo-400 transition-all flex items-center gap-1 text-xs font-mono font-bold"
                        >
                          <span>{isExpanded ? 'Collapse' : 'Expand'}</span>
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </div>
                    </div>

                    {/* Expandable Hierarchical Detail View: Main Topics, Subtopics & Similar Topics */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="space-y-4 pt-1"
                        >
                          {rawTopics.length === 0 ? (
                            <div className="p-6 text-center text-xs text-[var(--text-muted)] italic bg-[var(--bg-subtle)] rounded-2xl border border-dashed border-[var(--border-subtle)] space-y-2">
                              <p>No topics loaded for this unit yet.</p>
                              <Button
                                onClick={() => handleGenerateUnitHierarchy(unitNum, unitNode.title)}
                                size="sm"
                                variant="outline"
                                className="text-xs font-mono font-bold border-cyan-500/40 text-cyan-400"
                              >
                                <Sparkles size={12} className="mr-1" /> Generate Unit Topics Hierarchy
                              </Button>
                            </div>
                          ) : (
                            rawTopics.map((tNode: any, tIdx: number) => {
                              const subtopics = tNode.subtopics || tNode.children || [];
                              const hierarchyReasonText = tNode.hierarchyReason || 
                                `Establishes prerequisite foundational knowledge for ${tNode.title} prior to advanced applications in ${unitRomanBadge}.`;
                              
                              const similarTopicsList = tNode.similarTopics || [
                                `${tNode.title} Theory`,
                                "Algorithmic Mechanics",
                                "System Integration"
                              ];

                              return (
                                <div
                                  key={tNode.id || tIdx}
                                  className="rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)] p-4 sm:p-5 space-y-3.5 hover:border-indigo-500/40 transition-all shadow-xs"
                                >
                                  {/* Main Topic Header (NO Topic/Subtopic Hours Badge per Spec 1) */}
                                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div 
                                      onClick={() => handleOpenTopicPedagogyPopover(tNode, unitRomanBadge)}
                                      className="cursor-pointer group flex items-start sm:items-center gap-2.5"
                                    >
                                      <span className="w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-600 font-mono text-xs font-extrabold flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                                        {tIdx + 1}
                                      </span>
                                      <h4 className="text-sm sm:text-base font-extrabold text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors">
                                        {tNode.title}
                                      </h4>
                                      <ChevronRight size={15} className="text-indigo-600 group-hover:translate-x-1 transition-transform shrink-0" />
                                    </div>

                                    {/* Interactive Pedagogy Popover Trigger */}
                                    <button
                                      onClick={() => handleOpenTopicPedagogyPopover(tNode, unitRomanBadge)}
                                      className="inline-flex items-center gap-1.5 text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all shadow-sm shrink-0 self-start sm:self-center"
                                    >
                                      <Sparkles size={12} /> Top 3 Pedagogies
                                    </button>
                                  </div>

                                  {/* Similar Topics / Related Concepts Tag List */}
                                  <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
                                    <span className="text-[11px] font-mono text-indigo-600 font-bold flex items-center gap-1 mr-1">
                                      <Tag size={12} /> Similar Topics / Related Concepts:
                                    </span>
                                    {similarTopicsList.map((tagStr: string, sTagIdx: number) => (
                                      <span
                                        key={sTagIdx}
                                        className="text-[10px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-indigo-500/15 text-indigo-600 border border-indigo-500/30 hover:border-indigo-400 transition-all"
                                      >
                                        #{tagStr}
                                      </span>
                                    ))}
                                  </div>

                                  {/* Dedicated Hierarchy Reason Tag / Callout */}
                                  <div className="p-3 rounded-xl border border-indigo-500/25 bg-indigo-500/10 text-xs text-[var(--text-secondary)] space-y-1">
                                    <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold text-indigo-600 uppercase tracking-wider">
                                      <Info size={13} /> Hierarchy Ordering Reason:
                                    </div>
                                    <p className="text-xs leading-relaxed font-sans">
                                      {hierarchyReasonText}
                                    </p>
                                  </div>

                                  {/* Nested Subtopics List (Hierarchical Tree Format - NO Subtopic Hours Tag) */}
                                  {subtopics.length > 0 && (
                                    <div className="pl-3 sm:pl-5 border-l-2 border-indigo-500/30 space-y-2 pt-1">
                                      <span className="text-[11px] font-mono font-bold text-[var(--text-muted)] block">
                                        Nested Subtopics ({subtopics.length}):
                                      </span>
                                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                                        {subtopics.map((subNode: any, sIdx: number) => {
                                          const subTitle = subNode.title || subNode;
                                          const subReason = subNode.hierarchyReason || `Provides granular breakdown for ${subTitle}.`;
                                          return (
                                            <div
                                              key={sIdx}
                                              onClick={() => handleOpenTopicPedagogyPopover(subNode, unitRomanBadge)}
                                              className="cursor-pointer p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-indigo-400 hover:bg-[var(--bg-hover)] transition-all flex items-start gap-2 text-xs group shadow-xs"
                                            >
                                              <span className="text-indigo-600 font-bold shrink-0 mt-0.5">•</span>
                                              <div className="flex-1">
                                                <div className="font-bold text-[var(--text-primary)] group-hover:text-indigo-600 transition-colors line-clamp-1">
                                                  {subTitle}
                                                </div>
                                                <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1 line-clamp-1">
                                                  Reason: {subReason}
                                                </div>
                                              </div>
                                              <Sparkles size={11} className="text-indigo-400 opacity-60 group-hover:opacity-100 transition-opacity shrink-0" />
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              }))}
            </div>
          </div>
        )}

        {/* Pedagogy Catalog Tab View */}
        {activeTab === 'pedagogy' && (
          <div
            id="guide-pedagogy-catalog"
            className={`rounded-3xl transition-all ${
              highlightedTargetId === 'guide-pedagogy-catalog'
                ? 'ring-4 ring-cyan-400 p-2 shadow-[0_0_35px_rgba(6,182,212,0.6)] animate-pulse'
                : ''
            }`}
          >
            <PedagogySection topicTitle="Computer Science & Engineering Syllabus" />
          </div>
        )}

        {/* Experiments Tab View */}
        {activeTab === 'experiments' && (
          <ExperimentMapperTab courseId={selectedSyllabusId} />
        )}

        {/* ==================================================================== */}
        {/* INTERACTIVE PEDAGOGY POPOVER / SIDE-DRAWER (Topic / Subtopic Click)  */}
        {/* ==================================================================== */}
        <AnimatePresence>
          {popoverState.isOpen && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-md pointer-events-auto">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                className="w-full max-w-md md:max-w-lg h-full bg-[var(--bg-card)] border-l border-indigo-500/40 p-6 shadow-2xl overflow-y-auto flex flex-col justify-between backdrop-blur-2xl text-[var(--text-primary)] custom-scrollbar"
              >
                <div className="space-y-5">
                  {/* Popover Header */}
                  <div className="flex items-start justify-between border-b border-[var(--border-subtle)] pb-4">
                    <div>
                      <span className="px-3 py-1 rounded-full text-xs font-mono font-black bg-indigo-600 text-white shadow-xs">
                        {popoverState.unitName || 'Curriculum Topic'}
                      </span>
                      <h2 className="text-lg sm:text-xl font-black text-[var(--text-primary)] mt-2 tracking-tight">
                        {popoverState.title}
                      </h2>
                      <p className="text-xs text-indigo-500 dark:text-indigo-400 eyecomfort:text-amber-400 font-mono font-extrabold mt-1 flex items-center gap-1">
                        <Sparkles size={13} className="text-indigo-600 dark:text-indigo-400 eyecomfort:text-amber-400" /> Interactive Pedagogy Recommendations
                      </p>
                    </div>

                    <button
                      onClick={() => setPopoverState((prev) => ({ ...prev, isOpen: false }))}
                      className="p-2 rounded-2xl bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all hover:scale-105 active:scale-95"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {/* Dedicated Hierarchy Reason Callout */}
                  {popoverState.hierarchyReason && (
                    <div className="p-4 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 text-xs space-y-1.5 shadow-inner">
                      <strong className="text-indigo-700 dark:text-indigo-400 eyecomfort:text-amber-300 font-mono font-extrabold uppercase tracking-wider flex items-center gap-1.5 text-[11px]">
                        <Info size={13} /> Dedicated Hierarchy Reason:
                      </strong>
                      <p className="text-xs leading-relaxed text-[var(--text-secondary)] font-medium">
                        {popoverState.hierarchyReason}
                      </p>
                    </div>
                  )}

                  {/* Top 3 Suggested Pedagogies Section */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-mono font-black text-[var(--text-primary)] uppercase tracking-wider flex items-center gap-1.5">
                      <BookOpen size={14} className="text-indigo-600 dark:text-indigo-400 eyecomfort:text-amber-400" /> Top 3 Suggested Pedagogies
                    </h3>

                    {popoverState.suggestedPedagogies.map((item, pIdx) => (
                      <div
                        key={pIdx}
                        onClick={() => {
                          handleOpenCategoryModal(item.catalogCategory);
                        }}
                        className="cursor-pointer group p-4.5 rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-card)] hover:border-indigo-500/60 dark:hover:border-indigo-400/60 hover:bg-[var(--bg-hover)] transition-all duration-300 space-y-2.5 shadow-md hover:shadow-xl"
                      >
                        <div className="flex justify-between items-center gap-2">
                          <span className="text-xs font-mono font-extrabold text-indigo-900 dark:text-indigo-200 eyecomfort:text-amber-300 bg-indigo-100 dark:bg-indigo-950/60 eyecomfort:bg-amber-500/20 border border-indigo-300 dark:border-indigo-500/40 eyecomfort:border-amber-500/40 px-2.5 py-0.5 rounded-full">
                            Rank #{item.rank || pIdx + 1} Suggested Pedagogy
                          </span>
                          <span className="text-xs font-mono font-extrabold text-emerald-900 dark:text-emerald-300 eyecomfort:text-amber-300 bg-emerald-100 dark:bg-emerald-500/20 eyecomfort:bg-amber-500/20 px-2.5 py-0.5 rounded-full border border-emerald-300 dark:border-emerald-500/40 eyecomfort:border-amber-500/40">
                            {item.confidenceScore}% Match
                          </span>
                        </div>

                        <h4 className="text-sm font-bold text-[var(--text-primary)] group-hover:text-indigo-600 dark:group-hover:text-indigo-400 eyecomfort:group-hover:text-amber-400 transition-colors flex items-center justify-between">
                          <span>Category #{item.categoryNumber}: {item.categoryName}</span>
                          <ChevronRight size={15} className="text-indigo-600 dark:text-indigo-400 eyecomfort:text-amber-400 group-hover:translate-x-1 transition-transform shrink-0" />
                        </h4>

                        <p className="text-xs text-[var(--text-secondary)] italic leading-relaxed font-medium">
                          &ldquo;{item.reasoning}&rdquo;
                        </p>

                        <div className="pt-2 border-t border-[var(--border-subtle)] flex justify-between items-center text-[11px] text-[var(--text-muted)]">
                          <span>Style: <strong className="text-[var(--text-primary)] font-bold">{item.teachingStyle}</strong></span>
                          <span className="text-indigo-700 dark:text-indigo-300 eyecomfort:text-amber-300 font-extrabold font-mono flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Click for methods &rarr;
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Popover Drawer Footer */}
                <div className="pt-4 mt-6 border-t border-[var(--border-subtle)]">
                  <Button
                    onClick={() => setPopoverState((prev) => ({ ...prev, isOpen: false }))}
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-black py-3 rounded-2xl shadow-md transition-all hover:scale-[1.01]"
                  >
                    Close Popover Drawer
                  </Button>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* ==================================================================== */}
        {/* PEDAGOGY CATEGORY DIALOG MODAL (Pedagogy Click Inside Popover)       */}
        {/* ==================================================================== */}
        <TeachingStrategiesModal
          category={categoryModal.category}
          isOpen={categoryModal.isOpen && !!categoryModal.category}
          onClose={() => setCategoryModal({ isOpen: false, category: null })}
        />

      </div>
    </AppShell>
  );
}
