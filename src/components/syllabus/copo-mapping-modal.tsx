"use client";
import './styles/copo-mapping-modal.css';
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Grid3X3,
  X,
  Sparkles,
  Save,
  Download,
  Info,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Award,
  Layers,
  Building2,
  GraduationCap,
  Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { updateSyllabusRepository, generateCoPoMapping } from '@/lib/api-client';

export interface CoPoMappingModalProps {
  isOpen: boolean;
  onClose: () => void;
  syllabusData: any;
  onSaved?: () => void;
}

export interface ProgramOutcomeDef {
  code: string;
  shortName: string;
  fullName: string;
  category: string;
}

export const STANDARD_POS: ProgramOutcomeDef[] = [
  { code: 'PO1',  shortName: 'Engg Knowledge',   fullName: 'Apply knowledge of mathematics, science & engineering fundamentals',               category: 'Technical' },
  { code: 'PO2',  shortName: 'Problem Analysis',  fullName: 'Identify, formulate, and analyze complex engineering problems',                    category: 'Technical' },
  { code: 'PO3',  shortName: 'Design/Dev',        fullName: 'Design solutions for complex engineering problems and systems',                    category: 'Technical' },
  { code: 'PO4',  shortName: 'Investigations',    fullName: 'Conduct investigations of complex problems using research methods',                category: 'Technical' },
  { code: 'PO5',  shortName: 'Modern Tools',      fullName: 'Create, select, and apply appropriate modern IT tools & resources',               category: 'Technical' },
  { code: 'PO6',  shortName: 'Engineer & Society',fullName: 'Apply reasoning informed by contextual knowledge regarding societal issues',       category: 'Contextual' },
  { code: 'PO7',  shortName: 'Environment',       fullName: 'Understand impact of professional solutions in environmental contexts',            category: 'Contextual' },
  { code: 'PO8',  shortName: 'Ethics',            fullName: 'Apply ethical principles and commit to professional ethics',                       category: 'Contextual' },
  { code: 'PO9',  shortName: 'Teamwork',          fullName: 'Function effectively as an individual and as a member or leader in teams',        category: 'Professional' },
  { code: 'PO10', shortName: 'Communication',     fullName: 'Communicate effectively on complex engineering activities',                        category: 'Professional' },
  { code: 'PO11', shortName: 'Project Mgmt',      fullName: 'Demonstrate knowledge and understanding of engineering management principles',    category: 'Professional' },
  { code: 'PSO1', shortName: 'Domain Expertise',  fullName: 'Specialize in core domain architectures, software engineering and algorithms',     category: 'Program Specific' },
  { code: 'PSO2', shortName: 'Tool Mastery',      fullName: 'Master modern hardware & software design tools to build scalable systems',         category: 'Program Specific' },
  { code: 'PSO3', shortName: 'Innovation & Soc',  fullName: 'Develop innovative solutions addressing contemporary industry and societal needs',   category: 'Program Specific' },
];

export function CoPoMappingModal({
  isOpen,
  onClose,
  syllabusData,
  onSaved
}: CoPoMappingModalProps) {
  const [editingMatrix, setEditingMatrix] = useState<Record<string, Record<string, string>>>({});
  const [courseOutcomes, setCourseOutcomes] = useState<any[]>([]);
  const [activePoTooltip, setActivePoTooltip] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPoLegend, setShowPoLegend] = useState(false);
  const [isAiGenerating, setIsAiGenerating] = useState(false);
  const [justificationsMap, setJustificationsMap] = useState<Record<string, Record<string, string>>>({});

  const handleAiAutoMap = async () => {
    if (!syllabusData) return;
    setIsAiGenerating(true);
    setToastMessage("OpenAI AI is analyzing syllabus topics, outcomes & Bloom levels...");

    try {
      const content = syllabusData.content || syllabusData || {};
      const sId = syllabusData.id || syllabusData.syllabusId;
      const cCode = syllabusData.courseCode || content.metadata?.courseCode || content.course?.code || 'CS3451';
      const cName = syllabusData.courseName || content.metadata?.courseName || content.course?.title || 'Course Outcome Mapping';

      const res = await generateCoPoMapping({
        syllabusId: sId,
        courseCode: cCode,
        courseName: cName,
        outcomes: courseOutcomes,
        units: syllabusData.units || syllabusData.hierarchy || content.units || [],
        syllabusData
      });

      if (res && res.matrix) {
        const newMatrix: Record<string, Record<string, string>> = {};
        Object.keys(res.matrix).forEach(co => {
          newMatrix[co] = {};
          Object.keys(res.matrix[co]).forEach(po => {
            const val = String(res.matrix[co][po]);
            newMatrix[co][po] = val === '0' ? '-' : val;
          });
        });
        setEditingMatrix(newMatrix);
        if (res.justifications) {
          setJustificationsMap(res.justifications);
        }
        setToastMessage("CO-PO Mapping generated by OpenAI AI & saved to DB directly!");
        setTimeout(() => setToastMessage(null), 4500);
        if (onSaved) onSaved();
      }
    } catch (err: any) {
      console.error("OpenAI CO-PO Mapping failed:", err);
      setToastMessage(`AI Mapping error: ${err.message || 'Check OPENAI_API_KEY'}`);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsAiGenerating(false);
    }
  };


  // Initialize outcomes and mapping matrix from props
  useEffect(() => {
    if (!syllabusData) return;

    const content = syllabusData.content || syllabusData || {};
    const rawOutcomes = content.outcomes || syllabusData.outcomes || content.coStatements || [];
    const units = syllabusData.units || syllabusData.hierarchy || content.units || [];
    
    // Extract raw string statements
    const extractedStmts: string[] = [];
    if (Array.isArray(rawOutcomes)) {
      rawOutcomes.forEach((oc: any) => {
        let txt = typeof oc === 'string' ? oc : (oc.description || oc.statement || oc.title || '');
        txt = txt.replace(/^(?:CO\d+\s*:\s*)+/gi, '').trim();
        if (txt) extractedStmts.push(txt);
      });
    }

    // Always generate exactly 5 COs (CO1..CO5) matching 5 units
    const formattedCos: any[] = [];
    for (let i = 0; i < 5; i++) {
      const coCode = `CO${i + 1}`;
      let uTitle = '';
      if (units[i]) {
        uTitle = units[i].title || units[i].unitTitle || '';
        uTitle = uTitle.replace(/^(?:UNIT|MODULE)\s+[IVXLCDM\d]+\s*:\s*/gi, '').trim();
      }

      let stmt = extractedStmts[i] || (uTitle ? `Understand and analyze core concepts, applications, and principles of ${uTitle}.` : '');
      if (!stmt) {
        const defaultStmts = [
          'Describe fundamentals and main characteristics of core subject domains.',
          'Analyze engineering problem specifications and design domain components.',
          'Apply technological frameworks and principles to harness domain solutions.',
          'Evaluate operational parameters, system performance, and design trade-offs.',
          'Identify and evaluate emerging technical trends and advanced domain problems.'
        ];
        stmt = defaultStmts[i];
      }

      formattedCos.push({
        code: coCode,
        description: stmt,
        bloomLevel: i % 2 === 0 ? 'Apply (K3)' : 'Analyze (K4)'
      });
    }

    setCourseOutcomes(formattedCos);

    // Initialize mapping matrix values
    const rawMapping = content.co_po_mapping || content.coPoMapping || syllabusData.coPoMapping || [];
    // Normalize: if rawMapping is an object/matrix (e.g. {CO1: {PO1: 3, ...}}), convert to array format
    let existingMapping: any[] = [];
    if (Array.isArray(rawMapping)) {
      existingMapping = rawMapping;
    } else if (rawMapping && typeof rawMapping === 'object') {
      // Convert matrix object to array of {co_code, po_code, correlation_level}
      Object.keys(rawMapping).forEach((coKey: string) => {
        const poMap = rawMapping[coKey];
        if (poMap && typeof poMap === 'object') {
          Object.keys(poMap).forEach((poKey: string) => {
            existingMapping.push({
              co_code: coKey,
              po_code: poKey,
              correlation_level: poMap[poKey]
            });
          });
        }
      });
    }
    const matrix: Record<string, Record<string, string>> = {};

    formattedCos.forEach((co, cIdx) => {
      matrix[co.code] = {};
      STANDARD_POS.forEach((po, pIdx) => {
        // Find if score exists in existingMapping
        const match = existingMapping.find(
          (m: any) => (m.co_code === co.code || m.coCode === co.code) && (m.po_code === po.code || m.poCode === po.code)
        );

        if (match && match.correlation_level !== undefined) {
          const val = String(match.correlation_level);
          matrix[co.code][po.code] = val === '0' ? '-' : val;
        } else {
          // Heuristic default HSCPM correlation mapping generator
          // Technical POs (PO1-PO5) correlate strongly with CO1-CO4
          if (['PO1', 'PO2', 'PO3'].includes(po.code)) {
            matrix[co.code][po.code] = cIdx <= 2 ? '3' : '2';
          } else if (['PO4', 'PO5'].includes(po.code)) {
            matrix[co.code][po.code] = cIdx >= 2 ? '3' : '2';
          } else if (['PO8', 'PO9', 'PO10'].includes(po.code)) {
            matrix[co.code][po.code] = cIdx === 4 ? '3' : cIdx === 0 ? '1' : '2';
          } else if (['PSO1', 'PSO2'].includes(po.code)) {
            matrix[co.code][po.code] = cIdx % 2 === 0 ? '3' : '2';
          } else {
            matrix[co.code][po.code] = ((cIdx + pIdx) % 3 === 0) ? '2' : ((cIdx + pIdx) % 5 === 0) ? '1' : '-';
          }
        }
      });
    });

    setEditingMatrix(matrix);
  }, [syllabusData, isOpen]);

  if (!isOpen || !syllabusData) return null;

  const content = syllabusData.content || syllabusData || {};
  const courseCode = syllabusData.courseCode || content.metadata?.courseCode || content.course?.code || 'CS3451';
  const courseName = syllabusData.courseName || content.metadata?.courseName || content.course?.title || 'Course Outcome Mapping';
  const university = syllabusData.university || 'Standard University';
  const department = syllabusData.department || 'Computer Science & Engineering';

  // Toggle rating score cell (3 -> 2 -> 1 -> - -> 3)
  const handleCellClick = (coCode: string, poCode: string) => {
    setEditingMatrix(prev => {
      const current = prev[coCode]?.[poCode] || '-';
      let next = '3';
      if (current === '3') next = '2';
      else if (current === '2') next = '1';
      else if (current === '1') next = '-';
      else next = '3';

      return {
        ...prev,
        [coCode]: {
          ...(prev[coCode] || {}),
          [poCode]: next
        }
      };
    });
  };

  // Compute PO averages
  const getPoAverage = (poCode: string): string => {
    if (courseOutcomes.length === 0) return '-';
    let total = 0;
    let count = 0;
    courseOutcomes.forEach(co => {
      const val = editingMatrix[co.code]?.[poCode];
      if (val && val !== '-') {
        total += parseFloat(val);
        count++;
      }
    });
    if (count === 0) return '-';
    return (total / count).toFixed(1);
  };

  // Compute total mapped POs & overall score
  let totalMappedCells = 0;
  let sumMappedScores = 0;
  courseOutcomes.forEach(co => {
    STANDARD_POS.forEach(po => {
      const val = editingMatrix[co.code]?.[po.code];
      if (val && val !== '-') {
        totalMappedCells++;
        sumMappedScores += parseFloat(val);
      }
    });
  });
  const avgOverallScore = totalMappedCells > 0 ? (sumMappedScores / totalMappedCells).toFixed(2) : 'N/A';

  // Save matrix to PostgreSQL
  const handleSave = async () => {
    setSaving(true);
    try {
      // Reformat matrix into list of COPOMapping objects
      const coPoMappingList: any[] = [];
      courseOutcomes.forEach(co => {
        STANDARD_POS.forEach(po => {
          const val = editingMatrix[co.code]?.[po.code];
          coPoMappingList.push({
            co_code: co.code,
            po_code: po.code,
            correlation_level: val === '-' ? 0 : parseInt(val, 10)
          });
        });
      });
      const syllabusId = syllabusData?.id || syllabusData?.syllabusId;
      if (syllabusId) {
        await updateSyllabusRepository(syllabusId, {
          co_po_mapping: coPoMappingList,
          coPoMapping: coPoMappingList,
          outcomes: courseOutcomes.map((co: any) =>
            typeof co === 'string'
              ? co
              : `${co.code || 'CO'}: ${co.description || ''}`
          ),
          courseOutcomes: courseOutcomes,
          updatedBy: 'Faculty Reviewer'
        });
      }

      setToastMessage("CO-PO Mapping Matrix saved to repository successfully!");
      setTimeout(() => setToastMessage(null), 3500);
      if (onSaved) onSaved();
    } catch (err) {
      console.error("Failed to save CO-PO matrix:", err);
      setToastMessage("Failed to save changes. Please try again.");
      setTimeout(() => setToastMessage(null), 3500);
    } finally {
      setSaving(false);
    }
  };

  // Download matrix as CSV
  const handleDownloadCsv = () => {
    let csv = `Course Code,${courseCode},Course Title,"${courseName}"\n\n`;
    csv += `CO Code,CO Description,Bloom Level,${STANDARD_POS.map(p => p.code).join(',')}\n`;
    courseOutcomes.forEach(co => {
      const rowVals = STANDARD_POS.map(po => editingMatrix[co.code]?.[po.code] || '-').join(',');
      csv += `${co.code},"${co.description.replace(/"/g, '""')}","${co.bloomLevel}",${rowVals}\n`;
    });
    csv += `Average,-,-,${STANDARD_POS.map(po => getPoAverage(po.code)).join(',')}\n`;

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${courseCode}_CO_PO_Mapping_Matrix.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity"
        />

        {/* Modal Window Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 15 }}
          className="relative w-full max-w-6xl max-h-[92vh] flex flex-col rounded-3xl border border-indigo-500/30 bg-white dark:bg-slate-900 shadow-2xl overflow-hidden z-10"
        >
          {/* Top Edge Decorative Accent Stripe */}
          <div className="h-1.5 w-full bg-gradient-to-r from-emerald-500 via-indigo-600 to-purple-600" />

          {/* Modal Header */}
          <div className="p-5 sm:p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold px-2.5 py-0.5 rounded bg-indigo-500/10 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                  {courseCode}
                </span>
                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <Award size={12} /> GAPC v4.0 Matrix
                </span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 border border-purple-500/30">
                  HSCPM 7-Stage Engine
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Grid3X3 className="text-indigo-500" size={24} />
                CO–PO & PSO Mapping Matrix
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5 flex items-center gap-3 font-mono">
                <span>{courseName}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><Building2 size={12} /> {university}</span>
                <span>•</span>
                <span className="flex items-center gap-1"><GraduationCap size={12} /> {department}</span>
              </p>
            </div>

            {/* Action Header Buttons */}
            <div className="flex items-center gap-2">
              <Button
                onClick={handleAiAutoMap}
                disabled={isAiGenerating}
                variant="default"
                size="sm"
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold text-xs border-0 shadow-md transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-70"
                title="Run OpenAI AI analysis on syllabus topics & outcomes"
              >
                {isAiGenerating ? (
                  <>
                    <Loader2 size={14} className="animate-spin text-purple-200" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} className="text-amber-300 animate-pulse" />
                    <span>AI Auto-Map (OpenAI)</span>
                  </>
                )}
              </Button>
              <Button
                onClick={() => setShowPoLegend(!showPoLegend)}
                variant="outline"
                size="sm"
                className="border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300"
              >
                <HelpCircle size={14} className="mr-1 text-indigo-500" />
                {showPoLegend ? 'Hide Legend' : 'PO Definitions'}
              </Button>
              <Button
                onClick={handleDownloadCsv}
                variant="outline"
                size="sm"
                className="border-slate-300 dark:border-slate-700 text-xs font-mono text-slate-700 dark:text-slate-300"
                title="Export Matrix as CSV"
              >
                <Download size={14} className="mr-1 text-emerald-500" /> Export CSV
              </Button>
              <button
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Toast Banner */}
          {toastMessage && (
            <div className="bg-emerald-500/15 border-b border-emerald-500/30 px-6 py-2.5 text-xs font-mono font-bold text-emerald-700 dark:text-emerald-300 flex items-center justify-between animate-fadeIn">
              <span className="flex items-center gap-2">
                <CheckCircle2 size={15} /> {toastMessage}
              </span>
              <button onClick={() => setToastMessage(null)} className="text-emerald-500 hover:underline">Dismiss</button>
            </div>
          )}

          {/* PO Legend Drawer Toggle */}
          <AnimatePresence>
            {showPoLegend && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-indigo-50/60 dark:bg-slate-950/80 border-b border-indigo-200 dark:border-indigo-900/40 p-4 font-mono text-xs overflow-hidden shrink-0"
              >
                <div className="max-w-full overflow-x-auto">
                  <h4 className="font-bold text-indigo-900 dark:text-indigo-300 mb-2 flex items-center gap-2">
                    <Info size={14} /> Program Outcome (PO) & Program Specific Outcome (PSO) Definitions (GAPC v4.0):
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                    {STANDARD_POS.map(po => (
                      <div key={po.code} className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <span className="font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">{po.code}:</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{po.shortName}</span>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{po.fullName}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Metrics Bar */}
          <div className="px-6 py-3 bg-slate-100/50 dark:bg-slate-950/40 border-b border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4 text-xs font-mono shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-slate-600 dark:text-slate-400">
                Course Outcomes: <strong className="text-indigo-600 dark:text-indigo-400 font-bold">{courseOutcomes.length} COs</strong>
              </span>
              <span>•</span>
              <span className="text-slate-600 dark:text-slate-400">
                Mapped Attributes: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{STANDARD_POS.length} POs/PSOs</strong>
              </span>
              <span>•</span>
              <span className="text-slate-600 dark:text-slate-400">
                Average Intensity: <strong className="text-purple-600 dark:text-purple-400 font-bold">{avgOverallScore} / 3.0</strong>
              </span>
            </div>

            {/* Scale Legend Indicator */}
            <div className="flex items-center gap-3">
              <span className="text-slate-500 text-[11px]">Scale:</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold border border-emerald-500/30">3 = High</span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-300 font-bold border border-amber-500/30">2 = Moderate</span>
              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-700 dark:text-sky-300 font-bold border border-sky-500/30">1 = Low</span>
              <span className="px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-500 font-bold">- = None</span>
            </div>
          </div>

          {/* Interactive Matrix Body (Scrollable Pane) */}
          <div className="p-4 sm:p-6 overflow-auto flex-1 custom-sidebar-scrollbar">
            <div className="min-w-[900px]">
              <table className="w-full text-left border-collapse border border-slate-200 dark:border-slate-800">
                <thead>
                  <tr className="bg-slate-100 dark:bg-slate-950 text-xs font-mono text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-300 dark:border-slate-800">
                    <th className="p-3 w-16 border-r border-slate-200 dark:border-slate-800 text-center">CO Code</th>
                    <th className="p-3 min-w-[260px] border-r border-slate-200 dark:border-slate-800">Course Outcome Description</th>
                    <th className="p-3 w-28 border-r border-slate-200 dark:border-slate-800 text-center">Bloom Level</th>
                    {STANDARD_POS.map(po => (
                      <th
                        key={po.code}
                        className="p-2 border-r border-slate-200 dark:border-slate-800 text-center cursor-pointer hover:bg-indigo-50 dark:hover:bg-slate-800 transition-colors"
                        title={`${po.code}: ${po.fullName}`}
                        onMouseEnter={() => setActivePoTooltip(po.code)}
                        onMouseLeave={() => setActivePoTooltip(null)}
                      >
                        <div className="font-bold text-indigo-600 dark:text-indigo-400">{po.code}</div>
                        <div className="text-[9px] font-normal text-slate-500 line-clamp-1">{po.shortName}</div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                  {courseOutcomes.map((co) => (
                    <tr key={co.code} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      {/* CO Code */}
                      <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-center font-mono font-bold text-indigo-700 dark:text-indigo-300 bg-slate-50/50 dark:bg-slate-950/40">
                        {co.code}
                      </td>
                      {/* Description */}
                      <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200 leading-snug">
                        {co.description}
                      </td>
                      {/* Bloom Level */}
                      <td className="p-3 border-r border-slate-200 dark:border-slate-800 text-center font-mono text-[11px]">
                        <span className="px-2 py-0.5 rounded bg-purple-500/10 text-purple-700 dark:text-purple-300 font-bold border border-purple-500/30 block">
                          {co.bloomLevel || 'Apply (K3)'}
                        </span>
                      </td>
                      {/* Interactive Rating Cells */}
                      {STANDARD_POS.map(po => {
                        const val = editingMatrix[co.code]?.[po.code] || '-';
                        return (
                          <td
                            key={po.code}
                            onClick={() => handleCellClick(co.code, po.code)}
                            className="p-1 border-r border-slate-200 dark:border-slate-800 text-center cursor-pointer select-none hover:scale-105 transition-transform"
                            title={`Click to change ${co.code} -> ${po.code} correlation score`}
                          >
                            <span
                              className={`inline-flex items-center justify-center w-8 h-8 rounded-lg font-mono font-black text-xs transition-all shadow-sm ${
                                val === '3'
                                  ? 'bg-emerald-500 text-white dark:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/40 shadow-emerald-500/20'
                                  : val === '2'
                                  ? 'bg-amber-500 text-white dark:bg-amber-500/20 dark:text-amber-300 border border-amber-500/40'
                                  : val === '1'
                                  ? 'bg-sky-500 text-white dark:bg-sky-500/20 dark:text-sky-300 border border-sky-500/40'
                                  : 'bg-slate-100 dark:bg-slate-950 text-slate-400 dark:text-slate-600 border border-slate-200 dark:border-slate-800'
                              }`}
                            >
                              {val}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}

                  {/* Summary Row: Average PO Scores */}
                  <tr className="bg-slate-100 dark:bg-slate-950 font-mono font-bold border-t-2 border-slate-300 dark:border-slate-800 text-xs">
                    <td colSpan={3} className="p-3 border-r border-slate-200 dark:border-slate-800 text-right uppercase text-slate-600 dark:text-slate-400">
                      Average Correlation Score per Attribute
                    </td>
                    {STANDARD_POS.map(po => {
                      const avg = getPoAverage(po.code);
                      return (
                        <td key={po.code} className="p-2 border-r border-slate-200 dark:border-slate-800 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-[11px] ${
                            avg !== '-' && parseFloat(avg) >= 2.5
                              ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30'
                              : avg !== '-' && parseFloat(avg) >= 1.5
                              ? 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/30'
                              : avg !== '-'
                              ? 'bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30'
                              : 'text-slate-400'
                          }`}>
                            {avg}
                          </span>
                        </td>
                      );
                    })}
                  </tr>
                </tbody>
              </table>
            </div>

            <p className="text-[11px] font-mono text-slate-500 dark:text-slate-400 mt-4 flex items-center gap-1.5">
              <Sparkles size={13} className="text-amber-500 shrink-0" />
              <span>Tip: Click any score cell in the matrix table above to adjust rating levels directly for faculty feedback and audit review.</span>
            </p>
          </div>

          {/* Modal Footer */}
          <div className="p-4 sm:p-6 border-t border-slate-200 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-950/60 flex items-center justify-between gap-4 shrink-0">
            <Button
              variant="outline"
              onClick={onClose}
              className="border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300"
            >
              Close
            </Button>
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={saving}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md flex items-center gap-1.5"
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" /> Saving Matrix...
                  </>
                ) : (
                  <>
                    <Save size={14} /> Save CO-PO Matrix
                  </>
                )}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
