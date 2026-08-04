'use client';

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  Plus,
  Trash2,
  Save,
  CheckCircle2,
  Layers,
  Award,
  BookMarked,
  SlidersHorizontal,
  FileCode,
  Info,
  Clock,
  Sparkles,
  Grid
} from 'lucide-react';
import { toast } from 'sonner';
import {
  SyllabusExtractionPayload,
  Unit,
  Topic,
  DynamicCourseOutcome,
  COPOMappingItem,
  Book,
  CourseInfo
} from '@/types/syllabus';

interface DynamicSyllabusEditorProps {
  initialSyllabus: SyllabusExtractionPayload;
  onSave?: (data: SyllabusExtractionPayload) => Promise<void> | void;
  isSaving?: boolean;
}

const PO_COLUMNS = [
  'PO1', 'PO2', 'PO3', 'PO4', 'PO5', 'PO6', 'PO7', 'PO8', 'PO9', 'PO10', 'PO11', 'PO12',
  'PSO1', 'PSO2', 'PSO3'
];

const BLOOM_LEVELS = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'];
const DIFFICULTY_LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

export default function DynamicSyllabusEditor({
  initialSyllabus,
  onSave,
  isSaving = false
}: DynamicSyllabusEditorProps) {
  const [syllabus, setSyllabus] = useState<SyllabusExtractionPayload>(() => {
    return {
      course_info: initialSyllabus?.course_info || {
        code: 'CS101',
        title: 'Course Title',
        department: 'Computer Science & Engineering',
        semester: 'Semester I',
        credits: 4,
        lecture_hours: 3,
        tutorial_hours: 1,
        practical_hours: 0
      },
      units: initialSyllabus?.units || [],
      course_outcomes: initialSyllabus?.course_outcomes || [],
      co_po_pso_matrix: initialSyllabus?.co_po_pso_matrix || [],
      textbooks: initialSyllabus?.textbooks || [],
      reference_books: initialSyllabus?.reference_books || [],
      assessment_pattern: initialSyllabus?.assessment_pattern || {}
    };
  });

  const [activeSection, setActiveSection] = useState<
    'course_info' | 'units' | 'outcomes' | 'matrix' | 'books'
  >('course_info');
  const [subtopicInputs, setSubtopicInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialSyllabus) {
      setSyllabus({
        course_info: initialSyllabus.course_info || {
          code: 'CS101',
          title: 'Course Title',
          department: 'Computer Science & Engineering',
          semester: 'Semester I',
          credits: 4,
          lecture_hours: 3,
          tutorial_hours: 1,
          practical_hours: 0
        },
        units: initialSyllabus.units || [],
        course_outcomes: initialSyllabus.course_outcomes || [],
        co_po_pso_matrix: initialSyllabus.co_po_pso_matrix || [],
        textbooks: initialSyllabus.textbooks || [],
        reference_books: initialSyllabus.reference_books || [],
        assessment_pattern: initialSyllabus.assessment_pattern || {}
      });
    }
  }, [initialSyllabus]);

  // --- Course Information Handlers ---
  const handleCourseInfoChange = (field: keyof CourseInfo, value: any) => {
    setSyllabus((prev) => ({
      ...prev,
      course_info: {
        ...prev.course_info,
        [field]: value
      }
    }));
  };

  // --- Unit Operations ---
  const addUnit = () => {
    const nextNum = (syllabus.units?.length || 0) + 1;
    const newUnit: Unit = {
      unit_number: nextNum,
      title: `Unit ${nextNum} Title`,
      hours: 8,
      topics: []
    };
    setSyllabus((prev) => ({ ...prev, units: [...(prev.units || []), newUnit] }));
    toast.success(`Unit ${nextNum} added`);
  };

  const removeUnit = (uIdx: number) => {
    setSyllabus((prev) => ({
      ...prev,
      units: prev.units.filter((_, idx) => idx !== uIdx)
    }));
    toast.info('Unit removed');
  };

  const handleUnitChange = (uIdx: number, field: keyof Unit, value: any) => {
    const updated = [...syllabus.units];
    updated[uIdx] = { ...updated[uIdx], [field]: value };
    setSyllabus((prev) => ({ ...prev, units: updated }));
  };

  // --- Topic Operations ---
  const addTopic = (uIdx: number) => {
    const newTopic: Topic = {
      title: 'New Topic',
      difficulty: 'Intermediate',
      bloom_level: 'Understand',
      dependency: 'None',
      prerequisite: 'Basic Concepts',
      subtopics: []
    };
    const updated = [...syllabus.units];
    updated[uIdx].topics = [...(updated[uIdx].topics || []), newTopic];
    setSyllabus((prev) => ({ ...prev, units: updated }));
  };

  const removeTopic = (uIdx: number, tIdx: number) => {
    const updated = [...syllabus.units];
    updated[uIdx].topics = updated[uIdx].topics.filter((_, idx) => idx !== tIdx);
    setSyllabus((prev) => ({ ...prev, units: updated }));
  };

  const handleTopicChange = (uIdx: number, tIdx: number, field: keyof Topic, value: any) => {
    const updated = [...syllabus.units];
    updated[uIdx].topics[tIdx] = { ...updated[uIdx].topics[tIdx], [field]: value };
    setSyllabus((prev) => ({ ...prev, units: updated }));
  };

  // --- Subtopic Tag Management ---
  const handleAddSubtopic = (uIdx: number, tIdx: number, value: string) => {
    if (!value || !value.trim()) return;
    const trimmed = value.trim();
    const updated = [...syllabus.units];
    if (!updated[uIdx].topics[tIdx].subtopics) {
      updated[uIdx].topics[tIdx].subtopics = [];
    }
    updated[uIdx].topics[tIdx].subtopics.push(trimmed);
    setSyllabus((prev) => ({ ...prev, units: updated }));
    setSubtopicInputs((prev) => ({ ...prev, [`${uIdx}-${tIdx}`]: '' }));
  };

  const removeSubtopic = (uIdx: number, tIdx: number, stIdx: number) => {
    const updated = [...syllabus.units];
    updated[uIdx].topics[tIdx].subtopics.splice(stIdx, 1);
    setSyllabus((prev) => ({ ...prev, units: updated }));
  };

  // --- Course Outcome Operations ---
  const addCourseOutcome = () => {
    const nextNum = (syllabus.course_outcomes?.length || 0) + 1;
    const newCo: DynamicCourseOutcome = {
      code: `CO${nextNum}`,
      description: 'New Course Outcome statement',
      bloom_level: 'Apply'
    };
    setSyllabus((prev) => ({
      ...prev,
      course_outcomes: [...(prev.course_outcomes || []), newCo]
    }));
  };

  const removeCourseOutcome = (coIdx: number) => {
    setSyllabus((prev) => ({
      ...prev,
      course_outcomes: prev.course_outcomes.filter((_, idx) => idx !== coIdx)
    }));
  };

  const handleCoChange = (coIdx: number, field: keyof DynamicCourseOutcome, value: string) => {
    const updated = [...syllabus.course_outcomes];
    updated[coIdx] = { ...updated[coIdx], [field]: value };
    setSyllabus((prev) => ({ ...prev, course_outcomes: updated }));
  };

  // --- CO-PO Matrix Operations ---
  const getCopoValue = (coCode: string, poCode: string) => {
    const item = syllabus.co_po_pso_matrix?.find(
      (m) => m.co_code === coCode && m.po_code === poCode
    );
    return item ? item.correlation_value : 0;
  };

  const setCopoValue = (coCode: string, poCode: string, value: number) => {
    const matrix = [...(syllabus.co_po_pso_matrix || [])];
    const idx = matrix.findIndex((m) => m.co_code === coCode && m.po_code === poCode);
    if (idx >= 0) {
      matrix[idx].correlation_value = value;
    } else {
      matrix.push({ co_code: coCode, po_code: poCode, correlation_value: value });
    }
    setSyllabus((prev) => ({ ...prev, co_po_pso_matrix: matrix }));
  };

  // --- Book Operations ---
  const addBook = (type: 'textbook' | 'reference') => {
    const newBook: Book = {
      title: 'New Book Title',
      authors: 'Author Name',
      publisher: 'Publisher',
      year: '2024',
      book_type: type
    };
    if (type === 'textbook') {
      setSyllabus((prev) => ({ ...prev, textbooks: [...(prev.textbooks || []), newBook] }));
    } else {
      setSyllabus((prev) => ({
        ...prev,
        reference_books: [...(prev.reference_books || []), newBook]
      }));
    }
  };

  const removeBook = (type: 'textbook' | 'reference', index: number) => {
    if (type === 'textbook') {
      setSyllabus((prev) => ({
        ...prev,
        textbooks: prev.textbooks.filter((_, idx) => idx !== index)
      }));
    } else {
      setSyllabus((prev) => ({
        ...prev,
        reference_books: prev.reference_books.filter((_, idx) => idx !== index)
      }));
    }
  };

  const handleBookChange = (
    type: 'textbook' | 'reference',
    index: number,
    field: keyof Book,
    value: string
  ) => {
    if (type === 'textbook') {
      const updated = [...syllabus.textbooks];
      updated[index] = { ...updated[index], [field]: value };
      setSyllabus((prev) => ({ ...prev, textbooks: updated }));
    } else {
      const updated = [...syllabus.reference_books];
      updated[index] = { ...updated[index], [field]: value };
      setSyllabus((prev) => ({ ...prev, reference_books: updated }));
    }
  };

  // --- Submit Handler ---
  const handleFormSubmit = async () => {
    if (onSave) {
      try {
        await onSave(syllabus);
        toast.success('Syllabus verified and saved successfully!');
      } catch (err: any) {
        toast.error(`Save failed: ${err?.message || 'Unknown error'}`);
      }
    }
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(syllabus, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${syllabus.course_info?.code || 'syllabus'}_verified.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Downloaded verified JSON payload');
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Sidebar Scrollspy Navigation */}
      <aside className="w-64 p-6 border-r border-slate-800 bg-slate-900/60 backdrop-blur-md space-y-6 sticky top-0 h-screen hidden md:block">
        <div className="flex items-center gap-2 text-indigo-400">
          <Sparkles className="w-5 h-5" />
          <h2 className="text-sm font-extrabold uppercase tracking-wider">Syllabus Sections</h2>
        </div>

        <nav className="space-y-1.5">
          <a
            href="#section-course_info"
            onClick={() => setActiveSection('course_info')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'course_info'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Info className="w-4 h-4" />
            <span>Course Metadata</span>
          </a>

          <a
            href="#section-units"
            onClick={() => setActiveSection('units')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'units'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Units & Topics</span>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-indigo-300">
              {syllabus.units?.length || 0}
            </span>
          </a>

          <a
            href="#section-outcomes"
            onClick={() => setActiveSection('outcomes')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'outcomes'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Course Outcomes</span>
            <span className="ml-auto px-2 py-0.5 rounded-full bg-slate-800 text-[10px] font-mono text-indigo-300">
              {syllabus.course_outcomes?.length || 0}
            </span>
          </a>

          <a
            href="#section-matrix"
            onClick={() => setActiveSection('matrix')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'matrix'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <Grid className="w-4 h-4" />
            <span>CO-PO-PSO Matrix</span>
          </a>

          <a
            href="#section-books"
            onClick={() => setActiveSection('books')}
            className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeSection === 'books'
                ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-lg shadow-indigo-500/10'
                : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
            }`}
          >
            <BookMarked className="w-4 h-4" />
            <span>Books & References</span>
          </a>
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 p-6 md:p-8 space-y-8 max-w-5xl">
        {/* Top Action Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/90 border border-slate-800 p-5 rounded-2xl shadow-xl backdrop-blur-xl">
          <div>
            <div className="flex items-center gap-3">
              <span className="px-2.5 py-1 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xs font-mono font-bold">
                {syllabus.course_info?.code || 'CS101'}
              </span>
              <h1 className="text-lg font-extrabold text-white">Interactive Syllabus Editor</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Verify, edit dynamic units, topics, subtopic tags, and CO-PO matrix correlations.
            </p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={exportJson}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all"
            >
              <FileCode className="w-4 h-4" />
              <span>Export JSON</span>
            </button>

            <button
              onClick={handleFormSubmit}
              disabled={isSaving}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/30 border border-indigo-400/30 transition-all disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save & Confirm Course'}</span>
            </button>
          </div>
        </div>

        {/* 1. Course Information Metadata Section */}
        <section id="section-course_info" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-indigo-400 flex items-center gap-2">
              <Info className="w-4 h-4" />
              <span>Course Metadata</span>
            </h2>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Course Code</label>
              <input
                type="text"
                value={syllabus.course_info?.code || ''}
                onChange={(e) => handleCourseInfoChange('code', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-3">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Course Title</label>
              <input
                type="text"
                value={syllabus.course_info?.title || ''}
                onChange={(e) => handleCourseInfoChange('title', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-400 mb-1">Department</label>
              <input
                type="text"
                value={syllabus.course_info?.department || ''}
                onChange={(e) => handleCourseInfoChange('department', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Semester</label>
              <input
                type="text"
                value={syllabus.course_info?.semester || ''}
                onChange={(e) => handleCourseInfoChange('semester', e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Credits</label>
              <input
                type="number"
                value={syllabus.course_info?.credits ?? 4}
                onChange={(e) => handleCourseInfoChange('credits', parseInt(e.target.value) || 0)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Lecture Hours (L)</label>
              <input
                type="number"
                value={syllabus.course_info?.lecture_hours ?? 3}
                onChange={(e) => handleCourseInfoChange('lecture_hours', intVal(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Tutorial Hours (T)</label>
              <input
                type="number"
                value={syllabus.course_info?.tutorial_hours ?? 1}
                onChange={(e) => handleCourseInfoChange('tutorial_hours', intVal(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1">Practical Hours (P)</label>
              <input
                type="number"
                value={syllabus.course_info?.practical_hours ?? 0}
                onChange={(e) => handleCourseInfoChange('practical_hours', intVal(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
            </div>
          </div>
        </section>

        {/* 2. Dynamic Units & Topics Section */}
        <section id="section-units" className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-indigo-400 flex items-center gap-2">
              <Layers className="w-4 h-4" />
              <span>Curriculum Units & Topics</span>
            </h2>

            <button
              onClick={addUnit}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Unit</span>
            </button>
          </div>

          {syllabus.units?.map((unit, uIdx) => (
            <div
              key={uIdx}
              className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4 shadow-md relative"
            >
              {/* Unit Header */}
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-extrabold rounded-xl text-xs">
                  Unit {unit.unit_number || uIdx + 1}
                </span>

                <input
                  type="text"
                  value={unit.title}
                  onChange={(e) => handleUnitChange(uIdx, 'title', e.target.value)}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-bold text-white focus:outline-none focus:border-indigo-500"
                  placeholder="Unit Title"
                />

                <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="number"
                    value={unit.hours}
                    onChange={(e) => handleUnitChange(uIdx, 'hours', intVal(e.target.value))}
                    className="w-12 bg-transparent text-xs text-white text-center focus:outline-none font-mono"
                  />
                  <span className="text-[10px] text-slate-500 uppercase">hrs</span>
                </div>

                <button
                  onClick={() => removeUnit(uIdx)}
                  className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition-all"
                  title="Delete Unit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* Topics Container */}
              <div className="space-y-3 pl-4 border-l-2 border-slate-800">
                {unit.topics?.map((topic, tIdx) => (
                  <div
                    key={tIdx}
                    className="bg-slate-950/70 p-4 rounded-xl space-y-3 border border-slate-800/80 shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={topic.title}
                        onChange={(e) => handleTopicChange(uIdx, tIdx, 'title', e.target.value)}
                        className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs font-semibold text-white focus:outline-none focus:border-indigo-500"
                        placeholder="Topic Title"
                      />

                      <select
                        value={topic.difficulty || 'Intermediate'}
                        onChange={(e) => handleTopicChange(uIdx, tIdx, 'difficulty', e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-slate-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                      >
                        {DIFFICULTY_LEVELS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>

                      <select
                        value={topic.bloom_level || 'Understand'}
                        onChange={(e) => handleTopicChange(uIdx, tIdx, 'bloom_level', e.target.value)}
                        className="bg-slate-900 border border-slate-800 text-indigo-400 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none"
                      >
                        {BLOOM_LEVELS.map((b) => (
                          <option key={b} value={b}>
                            {b}
                          </option>
                        ))}
                      </select>

                      <button
                        onClick={() => removeTopic(uIdx, tIdx)}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete Topic"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Subtopics Tag Badges */}
                    <div className="flex flex-wrap gap-1.5 items-center">
                      <span className="text-[10px] font-bold uppercase text-slate-500 mr-1">
                        Subtopics:
                      </span>
                      {topic.subtopics?.map((st, stIdx) => (
                        <span
                          key={stIdx}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-900 text-[11px] text-slate-300 border border-slate-800 shadow-sm"
                        >
                          <span>{st}</span>
                          <button
                            type="button"
                            onClick={() => removeSubtopic(uIdx, tIdx, stIdx)}
                            className="text-slate-500 hover:text-rose-400 ml-0.5"
                          >
                            ×
                          </button>
                        </span>
                      ))}

                      <input
                        type="text"
                        placeholder="+ Add subtopic (Enter)"
                        value={subtopicInputs[`${uIdx}-${tIdx}`] || ''}
                        onChange={(e) =>
                          setSubtopicInputs({
                            ...subtopicInputs,
                            [`${uIdx}-${tIdx}`]: e.target.value
                          })
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddSubtopic(uIdx, tIdx, subtopicInputs[`${uIdx}-${tIdx}`] || '');
                          }
                        }}
                        className="bg-slate-900/60 border border-dashed border-slate-800 rounded-lg px-2.5 py-1 text-xs text-indigo-400 placeholder-slate-600 focus:outline-none focus:border-indigo-500 w-36"
                      />
                    </div>
                  </div>
                ))}

                <button
                  onClick={() => addTopic(uIdx)}
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-semibold mt-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Topic</span>
                </button>
              </div>
            </div>
          ))}
        </section>

        {/* 3. Course Outcomes Section */}
        <section id="section-outcomes" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-indigo-400 flex items-center gap-2">
              <Award className="w-4 h-4" />
              <span>Course Outcomes (COs)</span>
            </h2>

            <button
              onClick={addCourseOutcome}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/30 rounded-xl text-xs font-bold hover:bg-indigo-600 hover:text-white transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Course Outcome</span>
            </button>
          </div>

          <div className="space-y-3">
            {syllabus.course_outcomes?.map((co, coIdx) => (
              <div
                key={coIdx}
                className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center gap-3"
              >
                <input
                  type="text"
                  value={co.code}
                  onChange={(e) => handleCoChange(coIdx, 'code', e.target.value)}
                  className="w-20 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs font-extrabold text-indigo-400 text-center"
                />

                <input
                  type="text"
                  value={co.description}
                  onChange={(e) => handleCoChange(coIdx, 'description', e.target.value)}
                  className="flex-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-white"
                  placeholder="Outcome description statement"
                />

                <select
                  value={co.bloom_level || 'Apply'}
                  onChange={(e) => handleCoChange(coIdx, 'bloom_level', e.target.value)}
                  className="bg-slate-950 border border-slate-800 text-xs text-slate-300 rounded-xl px-3 py-1.5"
                >
                  {BLOOM_LEVELS.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>

                <button
                  onClick={() => removeCourseOutcome(coIdx)}
                  className="text-slate-500 hover:text-rose-400 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* 4. CO-PO-PSO Matrix Grid Section */}
        <section id="section-matrix" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-base font-bold text-indigo-400 flex items-center gap-2">
              <Grid className="w-4 h-4" />
              <span>CO-PO-PSO Correlation Matrix</span>
            </h2>
            <span className="text-xs text-slate-500 font-mono">0: None, 1: Low, 2: Medium, 3: High</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-4 overflow-x-auto shadow-md">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="p-2 text-indigo-400 font-extrabold sticky left-0 bg-slate-900 z-10">
                    CO Code
                  </th>
                  {PO_COLUMNS.map((po) => (
                    <th key={po} className="p-2 text-center text-slate-400 font-mono font-bold">
                      {po}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {syllabus.course_outcomes?.map((co) => (
                  <tr key={co.code} className="hover:bg-slate-850/50">
                    <td className="p-2 font-extrabold text-indigo-400 sticky left-0 bg-slate-900 z-10">
                      {co.code}
                    </td>
                    {PO_COLUMNS.map((po) => {
                      const val = getCopoValue(co.code, po);
                      return (
                        <td key={po} className="p-1 text-center">
                          <select
                            value={val}
                            onChange={(e) =>
                              setCopoValue(co.code, po, parseInt(e.target.value) || 0)
                            }
                            className={`w-10 text-center rounded-lg py-1 text-xs font-mono font-bold focus:outline-none ${
                              val === 3
                                ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/50'
                                : val === 2
                                ? 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40'
                                : val === 1
                                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/40'
                                : 'bg-slate-950 text-slate-600 border border-slate-800'
                            }`}
                          >
                            <option value={0}>0</option>
                            <option value={1}>1</option>
                            <option value={2}>2</option>
                            <option value={3}>3</option>
                          </select>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* 5. Books & References Section */}
        <section id="section-books" className="space-y-6">
          {/* Textbooks */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-indigo-400" />
                <span>Textbooks</span>
              </h3>

              <button
                onClick={() => addBook('textbook')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                + Add Textbook
              </button>
            </div>

            {syllabus.textbooks?.map((tb, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
              >
                <input
                  type="text"
                  placeholder="Book Title"
                  value={tb.title}
                  onChange={(e) => handleBookChange('textbook', idx, 'title', e.target.value)}
                  className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />

                <input
                  type="text"
                  placeholder="Authors"
                  value={tb.authors || ''}
                  onChange={(e) => handleBookChange('textbook', idx, 'authors', e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Publisher"
                    value={tb.publisher || ''}
                    onChange={(e) => handleBookChange('textbook', idx, 'publisher', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                  />

                  <button
                    onClick={() => removeBook('textbook', idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Reference Books */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2">
                <BookMarked className="w-4 h-4 text-indigo-400" />
                <span>Reference Books</span>
              </h3>

              <button
                onClick={() => addBook('reference')}
                className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                + Add Reference Book
              </button>
            </div>

            {syllabus.reference_books?.map((rb, idx) => (
              <div
                key={idx}
                className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-4 gap-3 items-center"
              >
                <input
                  type="text"
                  placeholder="Book Title"
                  value={rb.title}
                  onChange={(e) => handleBookChange('reference', idx, 'title', e.target.value)}
                  className="sm:col-span-2 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white"
                />

                <input
                  type="text"
                  placeholder="Authors"
                  value={rb.authors || ''}
                  onChange={(e) => handleBookChange('reference', idx, 'authors', e.target.value)}
                  className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Publisher"
                    value={rb.publisher || ''}
                    onChange={(e) => handleBookChange('reference', idx, 'publisher', e.target.value)}
                    className="flex-1 bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-300"
                  />

                  <button
                    onClick={() => removeBook('reference', idx)}
                    className="text-slate-500 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

function intVal(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? 0 : parsed;
}
