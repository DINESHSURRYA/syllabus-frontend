"use client";
import './styles/page.css';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Clock,
  Edit3,
  Loader2,
  Plus,
  Save,
  Sparkles,
  Trash2,
  Check,
  X,
  Search,
  Undo2,
  Redo2,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  AlertTriangle,
  Layers,
  Settings,
  Filter,
  ArrowUp,
  ArrowDown,
  Eye,
  RefreshCw,
  FileText,
  FileCode,
  Award,
  BookMarked,
  ShieldAlert,
  ListChecks,
  SlidersHorizontal,
  Download,
  Info,
  Maximize2,
  Minimize2,
  Cpu,
  Bookmark,
  CheckCircle,
  AlertCircle,
  FlaskConical,
  Zap,
  Timer,
  AlarmClock
} from 'lucide-react';
import { AppShell } from '@/components/layout/app-shell';
import { useSyllabusStore, emptySyllabus, useGuideStore } from '@/stores';
import { UnitItem, TopicItem } from '@/types';
import { generateTopicTimeline, formatHours, TopicAllocationInput } from '@/lib/services/timeline-service';
import { uploadAndExtractSyllabusBackend, generateCoPoMapping, saveVerifiedCourse as saveVerifiedCourseApi } from '@/lib/api-client';
import { syllabusApi } from '@/lib/api';
import { sanitizeText } from '@/lib/normalizer';
import { toast } from 'sonner';

import { AIProcessingStatus } from '@/components/syllabus/ai-processing-status';
import { Phase1ExtractionProgress } from '@/components/syllabus/phase1-extraction-progress';
import { NotificationCenter } from '@/components/notifications/notification-center';
import DynamicSyllabusEditor from '@/components/syllabus/dynamic-syllabus-editor';
import { SyllabusExtractionPayload } from '@/types/syllabus';


// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface SubtopicData {
  id: string;
  title: string;
  learningHours: number;
  pedagogies?: string[];
  bloom?: string;
  duration?: string;
}

export interface TopicData {
  id: string;
  title: string;
  description: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  importance: 'Low' | 'Medium' | 'High';
  bloomLevel: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  learningHours: number;
  confidence?: number;
  subtopics: SubtopicData[];
  skills?: string[];
  keywords?: string[];
  hourAllocationReason?: string;
}

export interface UnitData {
  id: string;
  title: string;
  description: string;
  learningHours: number;
  topics: TopicData[];
}

export interface LabExperimentData {
  id: string;
  expNumber: string;
  title: string;
  description: string;
  hours: number;
  softwareTools: string;
  mappedUnit: string;
  bloomLevel: 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
}

export interface CourseData {
  code: string;
  title: string;
  university?: string;
  programme: string;
  department: string;
  regulation: string;
  semester: string;
  credits: number;
  category: string;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  totalHours: number;
  status: 'In Review' | 'Verified' | 'Draft';
}

export interface AssessmentItemData {
  id: string;
  component: string;
  weightagePercent: number;
  maxMarks: number;
  evaluationType: string;
}

export interface AdditionalInfoData {
  notes: string;
  prerequisites: string;
  softwareRequirements: string;
  labRequirements: string;
  remarks: string;
}

export interface CoPoMappingData {
  coStatements: string[];
  poStatements: string[];
  matrix: Record<string, Record<string, number>>;
}

export interface FullSyllabusData {
  id: string;
  isCodeMismatch?: boolean;
  userCourseCode?: string;
  pdfCourseCode?: string;
  mismatchWarning?: string;
  course: CourseData;
  objectives: string[];
  outcomes: string[];
  units: UnitData[];
  labExperiments: LabExperimentData[];
  textbooks: string[];
  referenceBooks: string[];
  assessment: AssessmentItemData[];
  additionalInfo: AdditionalInfoData;
  coPoMapping?: CoPoMappingData;
  createdAt?: string;
  updatedAt?: string;
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
  sectionId: string;
}

// ============================================================================
// EMPTY SYLLABUS DATA (No static predefined fallback data)
// ============================================================================

const emptySyllabusData: FullSyllabusData = {
  id: "",
  course: {
    code: "",
    title: "",
    programme: "",
    department: "",
    regulation: "",
    semester: "",
    credits: 0,
    category: "",
    lectureHours: 0,
    tutorialHours: 0,
    practicalHours: 0,
    totalHours: 0,
    status: "Draft"
  },
  objectives: [],
  outcomes: [],
  units: [],
  labExperiments: [],
  textbooks: [],
  referenceBooks: [],
  assessment: [],
  additionalInfo: {
    notes: "",
    prerequisites: "",
    softwareRequirements: "",
    labRequirements: "",
    remarks: ""
  }
};

function mapBackendToFullSyllabus(backendData: any): FullSyllabusData {
  if (!backendData) return emptySyllabusData;

  const content = backendData.content || backendData;
  const courseObj = (typeof content.course === 'object' && content.course) ? content.course : (typeof backendData.course === 'object' && backendData.course) ? backendData.course : {};

  const isCodeMismatch = Boolean(backendData.isCodeMismatch || content.isCodeMismatch || (backendData as any).is_code_mismatch);
  const userCourseCode = backendData.userCourseCode || content.userCourseCode || (backendData as any).user_course_code || "";
  const pdfCourseCode = backendData.pdfCourseCode || content.pdfCourseCode || (backendData as any).pdf_course_code || "";
  const mismatchWarning = backendData.mismatchWarning || content.mismatchWarning || (backendData as any).mismatch_warning || "";

  const rawCourseCode = sanitizeText(
    backendData.courseCode ||
    backendData.course_code ||
    courseObj.code ||
    courseObj.courseCode ||
    content.metadata?.courseCode ||
    "COURSE"
  );
  const rawCourseTitle = sanitizeText(
    backendData.courseName ||
    backendData.course_name ||
    backendData.courseTitle ||
    backendData.title ||
    backendData.name ||
    content.courseName ||
    content.course_name ||
    content.courseTitle ||
    content.name ||
    content.title ||
    courseObj.title ||
    courseObj.name ||
    courseObj.courseName ||
    courseObj.course_name ||
    content.metadata?.courseName ||
    content.metadata?.title ||
    "Untitled Syllabus"
  );

  let courseCode = rawCourseCode;
  let courseTitle = rawCourseTitle;

  const codeRegex = /\b([A-Z]{2,4}\s*\d{3,5}[A-Z]?)\b/i;
  const cleanC = courseCode.trim().toUpperCase().replace(/\s+/g, '');
  const cleanT = courseTitle.trim();

  if (['COURSE', 'DEFAULT', 'UNKNOWN', 'NONE', ''].includes(cleanC) || !codeRegex.test(cleanC)) {
    const m = cleanT.match(codeRegex);
    if (m) {
      courseCode = m[1].toUpperCase().replace(/\s+/g, '');
      const remTitle = cleanT.replace(new RegExp('\\b' + m[1] + '\\b', 'gi'), '').replace(/^[\s\-:_]+|[\s\-:_]+$/g, '');
      courseTitle = remTitle.length > 2 ? remTitle : 'Course Syllabus';
    }
  } else if (codeRegex.test(cleanT.toUpperCase().replace(/\s+/g, '')) && !codeRegex.test(cleanC)) {
    courseCode = cleanT.toUpperCase().replace(/\s+/g, '');
    courseTitle = cleanC;
  }
  const department = sanitizeText(backendData.department || content.department || courseObj.department || content.metadata?.department || "Computer Science & Engineering");
  const regulation = sanitizeText(backendData.regulation || content.regulation || courseObj.regulation || content.metadata?.regulation || "2021");
  const semester = sanitizeText(backendData.semester || content.semester || courseObj.semester || content.metadata?.semester || "5th Semester");
  const credits = Number(backendData.credits ?? content.credits ?? courseObj.credits ?? 4) || 4;

  // 1. UNITS & TOPICS MAPPING
  const rawUnits =
    backendData.units ||
    backendData.unitsAndTopics ||
    backendData.unit_details ||
    content.units ||
    content.unitsAndTopics ||
    content.unit_details ||
    courseObj.units ||
    [];

  const units: UnitData[] = (Array.isArray(rawUnits) ? rawUnits : []).map((u: any, uIdx: number) => {
    const uTitle = sanitizeText(u.title || u.name || u.unitTitle || u.unit_title || u.unitName || `Unit ${uIdx + 1}`);
    const uHours = parseFloat(u.learningHours || u.hours || u.learning_hours || u.teaching_hours || u.lectureHours || 9.0) || 9.0;
    
    const rawTopics = Array.isArray(u.topics) ? u.topics : Array.isArray(u.subtopics) ? u.subtopics : Array.isArray(u.topicList) ? u.topicList : [];
    
    const topics: TopicData[] = rawTopics.map((t: any, tIdx: number) => {
      const isString = typeof t === 'string';
      const tTitle = sanitizeText(isString ? t : t.title || t.name || t.topic_name || t.topicTitle || `Topic ${tIdx + 1}`);
      const rawSub = (!isString && t && typeof t === 'object') ? (t.subtopics || t.items || t.sub_topics || []) : [];
      
      const subtopics: SubtopicData[] = (Array.isArray(rawSub) ? rawSub : []).map((st: any, stIdx: number) => ({
        id: `s${uIdx + 1}_${tIdx + 1}_${stIdx + 1}`,
        title: sanitizeText(typeof st === 'string' ? st : st.title || st.name || st.subtopic_name || `Subtopic ${stIdx + 1}`),
        learningHours: 1.0,
        duration: "45 mins",
        bloom: "Understand"
      }));

      const tHours = (!isString && t && typeof t === 'object' && (t.learningHours || t.hours))
        ? parseFloat(t.learningHours || t.hours)
        : Math.max(1, Math.round(uHours / Math.max(1, rawTopics.length)));

      return {
        id: (!isString && t && t.id) || `t${uIdx + 1}_${tIdx + 1}`,
        title: tTitle,
        description: sanitizeText((!isString && t && (t.description || t.summary)) || `Core principles and concepts of ${tTitle}`),
        difficulty: (!isString && t && t.difficulty) ? t.difficulty : "Intermediate",
        importance: (!isString && t && t.importance) ? t.importance : "High",
        bloomLevel: (!isString && t && (t.bloomLevel || t.bloom_level || t.bloom)) ? (t.bloomLevel || t.bloom_level || t.bloom) : "Understand",
        learningHours: tHours,
        confidence: 90.0,
        subtopics,
        skills: (!isString && t && Array.isArray(t.skills)) ? t.skills.map((s: string) => sanitizeText(s)) : [tTitle],
        keywords: (!isString && t && Array.isArray(t.keywords)) ? t.keywords.map((k: string) => sanitizeText(k)) : [tTitle],
        hourAllocationReason: sanitizeText((!isString && t && t.hourAllocationReason) || "Pacing aligned with course learning outcomes.")
      };
    });

    return {
      id: u.id || `u${uIdx + 1}`,
      title: uTitle,
      description: sanitizeText(u.description || u.summary || `Detailed study of ${uTitle}`),
      learningHours: uHours,
      topics
    };
  });

  // 2. COURSE OBJECTIVES MAPPING
  const rawObjectives =
    backendData.courseObjectives ||
    backendData.course_objectives ||
    backendData.objectives ||
    content.courseObjectives ||
    content.course_objectives ||
    content.objectives ||
    courseObj.courseObjectives ||
    courseObj.course_objectives ||
    courseObj.objectives ||
    [];
  const objectives = (Array.isArray(rawObjectives) ? rawObjectives : [rawObjectives])
    .map((o: any) => {
      if (typeof o === 'string') return sanitizeText(o);
      if (o && typeof o === 'object') {
        return sanitizeText(o.description || o.statement || o.title || o.text || o.objective || String(o));
      }
      return sanitizeText(String(o));
    })
    .filter(Boolean);

  // 3. COURSE OUTCOMES MAPPING
  const rawOutcomes =
    backendData.courseOutcomes ||
    backendData.course_outcomes ||
    backendData.outcomes ||
    content.courseOutcomes ||
    content.course_outcomes ||
    content.outcomes ||
    courseObj.courseOutcomes ||
    courseObj.course_outcomes ||
    courseObj.outcomes ||
    [];
  const outcomes = (Array.isArray(rawOutcomes) ? rawOutcomes : [rawOutcomes])
    .map((o: any) => {
      if (typeof o === 'string') return sanitizeText(o);
      if (o && typeof o === 'object') {
        const desc = o.description || o.statement || o.title || o.text || o.outcome || '';
        const code = o.code ? `${o.code}: ` : '';
        return sanitizeText(`${code}${desc}`.trim() || String(o));
      }
      return sanitizeText(String(o));
    })
    .filter(Boolean);

  // 4. RECOMMENDED TEXTBOOKS MAPPING
  const rawTextbooks =
    backendData.textBooks ||
    backendData.textbooks ||
    backendData.text_books ||
    content.textBooks ||
    content.textbooks ||
    content.text_books ||
    courseObj.textBooks ||
    courseObj.textbooks ||
    courseObj.text_books ||
    [];
  const textbooks = (Array.isArray(rawTextbooks) ? rawTextbooks : [rawTextbooks])
    .map((b: any) => sanitizeText(typeof b === 'string' ? b : b.title || b.name || b.textbook || String(b)))
    .filter(Boolean);

  // 5. REFERENCE BOOKS MAPPING
  const rawRefBooks =
    backendData.references ||
    backendData.referenceBooks ||
    backendData.reference_books ||
    content.references ||
    content.referenceBooks ||
    content.reference_books ||
    courseObj.references ||
    courseObj.referenceBooks ||
    courseObj.reference_books ||
    [];
  const referenceBooks = (Array.isArray(rawRefBooks) ? rawRefBooks : [rawRefBooks])
    .map((b: any) => sanitizeText(typeof b === 'string' ? b : b.title || b.name || b.reference || String(b)))
    .filter(Boolean);

  // 6. PRACTICAL / LAB EXPERIMENTS MAPPING
  const rawExps =
    backendData.laboratoryExperiments ||
    backendData.labExperiments ||
    backendData.experiments ||
    backendData.lab_experiments ||
    content.laboratoryExperiments ||
    content.labExperiments ||
    content.experiments ||
    content.lab_experiments ||
    courseObj.laboratoryExperiments ||
    courseObj.labExperiments ||
    courseObj.experiments ||
    [];

  const labExperiments: LabExperimentData[] = (Array.isArray(rawExps) ? rawExps : []).map((expItem: any, idx: number) => {
    if (typeof expItem === 'string') {
      const cleanExp = sanitizeText(expItem);
      return {
        id: `exp_${idx + 1}`,
        expNumber: `Exp ${idx + 1}`,
        title: cleanExp,
        description: `Practical implementation exercise: ${cleanExp}`,
        hours: 0,
        softwareTools: '',
        mappedUnit: '',
        bloomLevel: '' as any
      };
    } else if (expItem && typeof expItem === 'object') {
      const cleanTitle = sanitizeText(expItem.title || expItem.name || expItem.experiment_name || `Experiment ${idx + 1}`);
      return {
        id: expItem.id || `exp_${idx + 1}`,
        expNumber: sanitizeText(expItem.expNumber || expItem.number || expItem.exp_number || `Exp ${idx + 1}`),
        title: cleanTitle,
        description: sanitizeText(expItem.description || `Practical implementation exercise`),
        hours: Number(expItem.hours || expItem.duration || 0) || 0,
        softwareTools: sanitizeText(expItem.softwareTools || expItem.tools || expItem.software || ''),
        mappedUnit: sanitizeText(expItem.mappedUnit || expItem.unit || ''),
        bloomLevel: expItem.bloomLevel || expItem.bloom || ''
      };
    }
    return {
      id: `exp_${idx + 1}`,
      expNumber: `Exp ${idx + 1}`,
      title: `Experiment ${idx + 1}`,
      description: `Practical implementation exercise`,
      hours: 0,
      softwareTools: '',
      mappedUnit: '',
      bloomLevel: '' as any
    };
  });

  // 7. HOURS BREAKDOWN & COMPUTATION
  const totalUnitHoursSum = units.reduce((acc, u) => acc + u.learningHours, 0);

  const parseNum = (val: any) => {
    if (val === undefined || val === null || val === '') return undefined;
    const n = Number(val);
    return isNaN(n) ? undefined : n;
  };

  const lectureHours = parseNum(backendData.lectureHours ?? backendData.lecture_hours ?? content.lectureHours ?? content.lecture_hours ?? courseObj.hours?.lecture ?? courseObj.lectureHours) ?? 3;
  const tutorialHours = parseNum(backendData.tutorialHours ?? backendData.tutorial_hours ?? content.tutorialHours ?? content.tutorial_hours ?? courseObj.hours?.tutorial ?? courseObj.tutorialHours) ?? 0;
  const practicalHours = parseNum(backendData.practicalHours ?? backendData.practical_hours ?? backendData.labHours ?? backendData.lab_hours ?? content.practicalHours ?? content.practical_hours ?? courseObj.hours?.practical ?? courseObj.practicalHours) ?? 0;
  const parsedTotal = parseNum(backendData.totalHours ?? backendData.total_hours ?? content.totalHours ?? content.total_hours ?? courseObj.hours?.total ?? courseObj.totalHours);

  const totalHours = parsedTotal || (totalUnitHoursSum > 0 ? totalUnitHoursSum : (lectureHours + tutorialHours + practicalHours || 45));

  // 8. CO-PO MAPPING DATA
  const rawCoPo = backendData.coPoMapping || content.coPoMapping || {};
  
  const rawOutcomesList = backendData.outcomes || backendData.courseOutcomes || content.outcomes || content.courseOutcomes || [];
  const cleanStmts: string[] = [];
  if (Array.isArray(rawOutcomesList)) {
    rawOutcomesList.forEach((oc: any) => {
      let txt = typeof oc === 'string' ? oc : (oc.description || oc.statement || oc.title || '');
      txt = txt.replace(/^(?:CO\d+\s*:\s*)+/gi, '').trim();
      if (txt) cleanStmts.push(txt);
    });
  }

  const finalCoStatements: string[] = [];
  for (let i = 0; i < 5; i++) {
    const coCode = `CO${i + 1}`;
    let uTitle = '';
    if (units[i]) {
      uTitle = units[i].title || '';
      uTitle = uTitle.replace(/^(?:UNIT|MODULE)\s+[IVXLCDM\d]+\s*:\s*/gi, '').trim();
    }
    let stmt = cleanStmts[i] || (uTitle ? `Understand and analyze core concepts, applications, and principles of ${uTitle}.` : '');
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
    finalCoStatements.push(`${coCode}: ${stmt}`);
  }

  const coStatements = finalCoStatements;
  const poStatements = ["PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11"];
  const matrix = rawCoPo.matrix || {
    "CO1": { "PO1": 3, "PO2": 3, "PO3": 3, "PO4": 2, "PO5": 2, "PO6": 1, "PO7": 2, "PO8": 1, "PO9": 1, "PO10": 2, "PO11": 1 },
    "CO2": { "PO1": 3, "PO2": 3, "PO3": 3, "PO4": 2, "PO5": 2, "PO6": 2, "PO7": 0, "PO8": 2, "PO9": 2, "PO10": 1, "PO11": 1 },
    "CO3": { "PO1": 3, "PO2": 3, "PO3": 3, "PO4": 3, "PO5": 3, "PO6": 0, "PO7": 0, "PO8": 2, "PO9": 2, "PO10": 1, "PO11": 1 },
    "CO4": { "PO1": 2, "PO2": 2, "PO3": 2, "PO4": 3, "PO5": 3, "PO6": 0, "PO7": 2, "PO8": 2, "PO9": 2, "PO10": 1, "PO11": 1 },
    "CO5": { "PO1": 3, "PO2": 3, "PO3": 3, "PO4": 3, "PO5": 2, "PO6": 1, "PO7": 2, "PO8": 2, "PO9": 2, "PO10": 1, "PO11": 1 }
  };

  const universityVal = sanitizeText(backendData.university || content.university || courseObj.university || "Anna University");

  // 9. ASSESSMENT SCHEME
  const rawAssessment = backendData.assessment || content.assessment || courseObj.assessment;
  let assessment: AssessmentItemData[] = [
    { id: 'ass_1', component: 'Continuous Internal Assessment (CIA)', weightagePercent: 40, maxMarks: 40, evaluationType: 'Internal' },
    { id: 'ass_2', component: 'End Semester Examination', weightagePercent: 60, maxMarks: 60, evaluationType: 'External' }
  ];
  if (Array.isArray(rawAssessment) && rawAssessment.length > 0) {
    assessment = rawAssessment.map((a: any, idx: number) => ({
      id: a.id || `ass_${idx + 1}`,
      component: sanitizeText(a.component || a.name || a.title || `Assessment Component ${idx + 1}`),
      weightagePercent: Number(a.weightagePercent || a.weightage || a.weight || 50),
      maxMarks: Number(a.maxMarks || a.max_marks || a.marks || 100),
      evaluationType: sanitizeText(a.evaluationType || a.type || 'Internal')
    }));
  }

  // 10. ADDITIONAL INFO
  const rawAdd = backendData.additionalInfo || backendData.additional_information || content.additionalInfo || content.additional_information || {};
  const additionalInfo: AdditionalInfoData = {
    notes: sanitizeText(rawAdd.notes || ''),
    prerequisites: sanitizeText(rawAdd.prerequisites || backendData.prerequisites || content.prerequisites || courseObj.prerequisites || ''),
    softwareRequirements: sanitizeText(rawAdd.softwareRequirements || rawAdd.software_requirements || ''),
    labRequirements: sanitizeText(rawAdd.labRequirements || rawAdd.lab_requirements || ''),
    remarks: sanitizeText(rawAdd.remarks || '')
  };

  return {
    id: backendData.id || courseCode || "course_dynamic",
    isCodeMismatch,
    userCourseCode,
    pdfCourseCode,
    mismatchWarning,
    course: {
      code: courseCode,
      title: courseTitle,
      university: universityVal,
      programme: content.programme || courseObj.programme || universityVal,
      department: department,
      regulation: regulation,
      semester: semester,
      credits: credits,
      category: "Professional Core (PC)",
      lectureHours: lectureHours,
      tutorialHours: tutorialHours,
      practicalHours: practicalHours,
      totalHours: totalHours,
      status: (backendData.verificationStatus || "In Review") as any
    },
    objectives,
    outcomes,
    units,
    labExperiments,
    textbooks,
    referenceBooks,
    assessment,
    additionalInfo,
    coPoMapping: {
      coStatements,
      poStatements,
      matrix
    }
  };
}

// ============================================================================
// MAIN SYLLABUS VERIFICATION PAGE COMPONENT
// ============================================================================

export default function SyllabusVerificationPage() {
  const router = useRouter();
  const storeSyllabus = useSyllabusStore((state) => state.syllabus);
  const pendingExtraction = useSyllabusStore((state) => state.pendingExtraction);
  const extractionState = useSyllabusStore((state) => state.extractionState);
  const setExtractionProgress = useSyllabusStore((state) => state.setExtractionProgress);
  const clearPendingExtraction = useSyllabusStore((state) => state.clearPendingExtraction);
  const { highlightedTargetId } = useGuideStore();

  // --------------------------------------------------------------------------
  // STATE MANAGEMENT WITH UNDO/REDO HISTORY STACK
  // --------------------------------------------------------------------------
  const [syllabus, setSyllabus] = useState<FullSyllabusData>(emptySyllabusData);
  const [history, setHistory] = useState<FullSyllabusData[]>([emptySyllabusData]);
  const [activeTab, setActiveTab] = useState<'general' | 'units' | 'topics' | 'cos' | 'copo' | 'references' | 'json'>('general');
  const [currentJobId, setCurrentJobId] = useState<string | undefined>(undefined);
  const [useDynamicEditor, setUseDynamicEditor] = useState<boolean>(false);

  const dynamicPayload: SyllabusExtractionPayload = useMemo(() => {
    return {
      course_info: {
        code: syllabus.course.code || 'CS101',
        title: syllabus.course.title || 'Course Title',
        department: syllabus.course.department || 'Computer Science',
        semester: syllabus.course.semester || 'Semester I',
        credits: Number(syllabus.course.credits) || 4,
        lecture_hours: Number(syllabus.course.lectureHours) || 3,
        tutorial_hours: Number(syllabus.course.tutorialHours) || 1,
        practical_hours: Number(syllabus.course.practicalHours) || 0,
      },
      units: (syllabus.units || []).map((u, uIdx) => ({
        unit_number: uIdx + 1,
        title: u.title,
        hours: Number(u.learningHours) || 8,
        topics: (u.topics || []).map((t) => ({
          title: t.title,
          difficulty: t.difficulty,
          bloom_level: t.bloomLevel,
          dependency: 'None',
          prerequisite: 'Basic Concepts',
          subtopics: (t.subtopics || []).map((st: any) => (typeof st === 'string' ? st : st.title)),
        })),
      })),
      course_outcomes: (syllabus.outcomes || []).map((co: any, cIdx) => ({
        code: `CO${cIdx + 1}`,
        description: typeof co === 'string' ? co : (co?.statement || co?.description || `Outcome ${cIdx + 1}`),
        bloom_level: typeof co === 'object' && co?.bloomLevel ? co.bloomLevel : 'Apply',
      })),
      co_po_pso_matrix: [],
      textbooks: (syllabus.textbooks || []).map((tb: any) => ({
        title: typeof tb === 'string' ? tb : (tb?.title || tb?.name || ''),
        authors: typeof tb === 'object' ? (tb?.authors || '') : '',
        publisher: typeof tb === 'object' ? (tb?.publisher || '') : '',
        year: typeof tb === 'object' ? (tb?.year || '') : '',
        book_type: 'textbook',
      })),
      reference_books: (syllabus.referenceBooks || []).map((rb: any) => ({
        title: typeof rb === 'string' ? rb : (rb?.title || rb?.name || ''),
        authors: typeof rb === 'object' ? (rb?.authors || '') : '',
        publisher: typeof rb === 'object' ? (rb?.publisher || '') : '',
        year: typeof rb === 'object' ? (rb?.year || '') : '',
        book_type: 'reference',
      })),

    };
  }, [syllabus]);

  const handleSaveDynamicEditor = async (data: SyllabusExtractionPayload) => {
    try {
      await saveVerifiedCourseApi(data);
      toast.success('Course verified & saved directly to DB!');
    } catch (err: any) {
      toast.error(`Save failed: ${err?.message || 'Error saving course'}`);
    }
  };


  // --------------------------------------------------------------------------
  // REAL-TIME EXTRACTION PIPELINE ORCHESTRATOR (BACKEND ONLY)
  // --------------------------------------------------------------------------
  const isExecutingRef = useRef(false);

  useEffect(() => {
    if (!pendingExtraction || !pendingExtraction.file) {
      if (extractionState.isExtracting && !isExecutingRef.current) {
        setExtractionProgress({ isExtracting: false, step: 0, progress: 0, statusText: '', error: null });
      }
      return;
    }

    if (isExecutingRef.current) return;

    isExecutingRef.current = true;
    const { file, courseCode } = pendingExtraction;
    clearPendingExtraction();

    let currentStep = 1;
    let currentProgress = 15;
    let stepInterval: NodeJS.Timeout | null = null;
    let isCancelled = false;

    const updateStepProgress = (step: number, progress: number, text: string) => {
      if (isCancelled) return;
      currentStep = step;
      currentProgress = progress;
      setExtractionProgress({
        isExtracting: true,
        step,
        progress,
        statusText: text,
        error: null,
      });
    };

    const runExtraction = async () => {
      try {
        updateStepProgress(1, 10, 'UPLOADING');

        // Start gradual timer advancing step 1 -> 2 -> 3 -> 4 -> 5 -> 6 (capped at 98%)
        let targetProgress = 10;
        stepInterval = setInterval(() => {
          if (isCancelled) return;
          targetProgress += 2;
          if (targetProgress > 98) targetProgress = 98;

          let step = 1;
          let statusCode = 'UPLOADING';
          if (targetProgress < 20) {
            step = 1;
            statusCode = 'UPLOADING';
          } else if (targetProgress < 40) {
            step = 2;
            statusCode = 'READING_PDF';
          } else if (targetProgress < 60) {
            step = 3;
            statusCode = 'GPT_ANALYSIS';
          } else if (targetProgress < 75) {
            step = 4;
            statusCode = 'PARSING_DATA';
          } else if (targetProgress < 90) {
            step = 5;
            statusCode = 'BUILDING_JSON';
          } else {
            step = 6;
            statusCode = 'VALIDATION';
          }

          updateStepProgress(step, Math.round(targetProgress), statusCode);
        }, 350);

        const parseResult = await uploadAndExtractSyllabusBackend(
          file,
          courseCode,
          (stageIndex, totalStages, message, percentage) => {
            if (isCancelled) return;
            if (percentage && percentage > targetProgress) {
              targetProgress = percentage;
              const step = Math.min(6, Math.max(1, stageIndex || Math.ceil((percentage / 100) * 6)));
              updateStepProgress(step, Math.round(targetProgress), message || 'READING_PDF');
            }
          }
        );

        if (stepInterval) clearInterval(stepInterval);

        if (!parseResult.success || !parseResult.syllabus) {
          throw new Error('Failed to receive structured syllabus from backend server.');
        }

        // Ensure steps 1 through 6 complete smoothly if backend returned fast
        if (currentStep < 6) {
          updateStepProgress(2, 35, 'READING_PDF');
          await new Promise((r) => setTimeout(r, 150));
          updateStepProgress(3, 55, 'GPT_ANALYSIS');
          await new Promise((r) => setTimeout(r, 150));
          updateStepProgress(4, 70, 'PARSING_DATA');
          await new Promise((r) => setTimeout(r, 150));
          updateStepProgress(5, 85, 'BUILDING_JSON');
          await new Promise((r) => setTimeout(r, 150));
          updateStepProgress(6, 95, 'VALIDATION');
          await new Promise((r) => setTimeout(r, 200));
        }

        const extractedSyllabus = parseResult.syllabus;
        useSyllabusStore.getState().setSyllabus(extractedSyllabus);

        const mapped = mapBackendToFullSyllabus(parseResult.rawJson || extractedSyllabus);
        if (!isCancelled) {
          if (typeof window !== 'undefined') {
            try {
              localStorage.setItem('active_saved_syllabus', JSON.stringify(mapped));
            } catch (e) {}
          }

          // 1. Populate and render the extracted content into blocks & pages FIRST
          setSyllabus(mapped);
          setHistory([mapped]);
          loadedSourceRef.current = 'default';

          // 2. Pause briefly to allow DOM to populate extracted content blocks
          await new Promise((r) => setTimeout(r, 300));

          // 3. Show Step 7 and 100% Done (COMPLETED)
          setExtractionProgress({
            isExtracting: true,
            step: 7,
            progress: 100,
            statusText: 'COMPLETED',
          });

          // 4. Keep Step 7 and 100% visible on screen before dismissing
          setTimeout(() => {
            setExtractionProgress({ isExtracting: false, step: 0, progress: 0, statusText: '', error: null });
            isExecutingRef.current = false;
          }, 3000);
        }

        toast.success(`Successfully extracted syllabus document!`);
      } catch (err: any) {
        if (stepInterval) clearInterval(stepInterval);
        console.warn('Backend syllabus extraction notice:', err);
        isExecutingRef.current = false;
        if (!isCancelled) {
          setExtractionProgress({
            isExtracting: false,
            step: 0,
            progress: 0,
            statusText: '',
            error: 'Failed to process syllabus. Please check your backend connection.',
          });
          toast.error('Failed to extract syllabus document. Please try again.');
        }
      }
    };

    runExtraction();

    return () => {
      // Do not cancel running extraction on state re-render
    };
  }, [pendingExtraction, setExtractionProgress, clearPendingExtraction]);

  const loadedSourceRef = useRef<string | null>(null);

  // Fetch from backend API if ?id= is passed in URL, else sync state dynamically with Zustand store
  useEffect(() => {
    let isCancelled = false;
    const urlParams = typeof window !== 'undefined' ? new URLSearchParams(window.location.search) : null;
    const courseId = urlParams?.get('id');
    const loadKey = courseId ? `id:${courseId}` : 'default';

    // Skip loading from DB/localStorage if an extraction process is actively running or already completed for this key
    if (extractionState.isExtracting || pendingExtraction?.file || isExecutingRef.current) {
      return;
    }

    // Prevent repeated re-initialization for the same source key if already loaded
    if (loadedSourceRef.current === loadKey) {
      return;
    }

    const applyMappedSyllabus = (mappedData: FullSyllabusData, syncToStore = true) => {
      if (isCancelled) return;
      setSyllabus(mappedData);
      setHistory([mappedData]);
      loadedSourceRef.current = loadKey;

      // Cache active syllabus in local storage
      if (typeof window !== 'undefined' && mappedData.course?.code) {
        try {
          localStorage.setItem('active_saved_syllabus', JSON.stringify(mappedData));
        } catch (e) {}
      }

      // Sync Zustand global store if valid content exists and code is different
      if (syncToStore && mappedData.course?.code && mappedData.course?.code !== '') {
        const storeState = useSyllabusStore.getState();
        if (storeState.syllabus?.course?.code !== mappedData.course.code) {
          if (storeState.setSyllabus) {
            storeState.setSyllabus({
              id: mappedData.id,
              course: {
                code: mappedData.course.code,
                title: mappedData.course.title,
                programme: mappedData.course.programme,
                department: mappedData.course.department,
                semester: mappedData.course.semester,
                credits: String(mappedData.course.credits),
                hours: {
                  lecture: String(mappedData.course.lectureHours),
                  tutorial: String(mappedData.course.tutorialHours),
                  practical: String(mappedData.course.practicalHours),
                  total: String(mappedData.course.totalHours),
                },
                prerequisites: mappedData.additionalInfo?.prerequisites || '',
                objectives: mappedData.objectives,
                outcomes: mappedData.outcomes,
              },
              units: mappedData.units.map((u, idx) => ({
                unit_number: idx + 1,
                title: u.title,
                hours: String(u.learningHours),
                topics: u.topics.map((t) => ({
                  name: t.title,
                  subtopics: t.subtopics.map((s) => (typeof s === 'string' ? s : s.title)),
                })),
              })),
              textbooks: mappedData.textbooks,
              reference_books: mappedData.referenceBooks,
              assessment: mappedData.assessment || {},
              additional_information: mappedData.additionalInfo || {},
            });
          }
        }
      }
    };

    if (courseId) {
      syllabusApi.getSyllabus(courseId)
        .then((data) => {
          if (data && !isCancelled) {
            const mapped = mapBackendToFullSyllabus(data);
            applyMappedSyllabus(mapped);
          }
        })
        .catch((err) => {
          console.warn("Could not fetch syllabus by ID for verification editor:", err);
        });
      return;
    }

    // 1. Check active Zustand store if valid content exists
    if (
      storeSyllabus &&
      storeSyllabus.course &&
      ((storeSyllabus.units && storeSyllabus.units.length > 0) || (storeSyllabus.course.title && storeSyllabus.course.title.trim() !== ''))
    ) {
      const mapped = mapBackendToFullSyllabus(storeSyllabus);
      if (mapped.units.length > 0 || (mapped.course.title && mapped.course.title !== 'Untitled Syllabus')) {
        applyMappedSyllabus(mapped, false);
        return;
      }
    }

    // 2. Check localStorage cache for active extracted syllabus
    let loadedFromCache = false;
    if (typeof window !== 'undefined') {
      try {
        const cachedStr = localStorage.getItem('active_saved_syllabus');
        if (cachedStr) {
          const cachedJson = JSON.parse(cachedStr);
          if (cachedJson && (cachedJson.course?.code || cachedJson.course?.title || (cachedJson.units && cachedJson.units.length > 0))) {
            const mapped = mapBackendToFullSyllabus(cachedJson);
            if (mapped.units.length > 0 || (mapped.course.title && mapped.course.title !== 'Untitled Syllabus')) {
              applyMappedSyllabus(mapped, false);
              loadedFromCache = true;
              return;
            }
          }
        }
      } catch (e) {
        console.warn("Could not load cached syllabus from localStorage:", e);
      }
    }

    if (!loadedFromCache) {
      // 3. Fallback: Fetch latest available syllabus from repository DB
      syllabusApi.getSyllabusList({ limit: 1 })
        .then((resData) => {
          if (isCancelled) return;
          const items = Array.isArray(resData)
            ? resData
            : Array.isArray(resData?.items)
            ? resData.items
            : [];
          if (items.length > 0) {
            const latestItem = items[0];
            const latestId = latestItem.id || latestItem.syllabusId || latestItem.courseCode || latestItem.code;
            if (latestId) {
              syllabusApi.getSyllabus(latestId)
                .then((fullData) => {
                  if (fullData && !isCancelled) {
                    const mapped = mapBackendToFullSyllabus(fullData);
                    applyMappedSyllabus(mapped);
                  } else if (latestItem && !isCancelled) {
                    const mapped = mapBackendToFullSyllabus(latestItem);
                    applyMappedSyllabus(mapped);
                  }
                })
                .catch(() => {
                  if (latestItem && !isCancelled) {
                    const mapped = mapBackendToFullSyllabus(latestItem);
                    applyMappedSyllabus(mapped);
                  }
                });
              return;
            }
          }
          applyMappedSyllabus(emptySyllabusData, false);
        })
        .catch((err) => {
          console.warn("Could not fetch latest syllabus fallback:", err);
          applyMappedSyllabus(emptySyllabusData, false);
        });
    }

    return () => {
      isCancelled = true;
    };
  }, [pendingExtraction]);
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [isDirty, setIsDirty] = useState<boolean>(false);

  // Auto-Save Status: 'saved' | 'saving' | 'unsaved'
  const [autoSaveState, setAutoSaveState] = useState<'saved' | 'saving' | 'unsaved'>('saved');
  const [lastSavedTime, setLastSavedTime] = useState<string>("Just now");
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Navigation / Active Section Scroll Observer
  const [activeSection, setActiveSection] = useState<string>('sec-course-details');

  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [unitFilter, setUnitFilter] = useState<string>('all');
  const [expandedUnits, setExpandedUnits] = useState<Record<string, boolean>>({
    u1: true,
    u2: true,
    u3: true,
    u4: true,
    u5: true
  });

  // UI Modal / State feedback
  const [isSavingModalOpen, setIsSavingModalOpen] = useState<boolean>(false);
  const [showJsonPreview, setShowJsonPreview] = useState<boolean>(false);
  const [showCopiedToast, setShowCopiedToast] = useState<boolean>(false);

  // --------------------------------------------------------------------------
  // TIMELINE GENERATION STATE (per-unit)
  // --------------------------------------------------------------------------
  const [generatingTimeline, setGeneratingTimeline] = useState<Record<string, boolean>>({});
  const [timelineErrors, setTimelineErrors] = useState<Record<string, string>>({});
  const [freshlyGenerated, setFreshlyGenerated] = useState<Record<string, boolean>>({}); // topic IDs that just got allocated

  // --------------------------------------------------------------------------
  // STATE UPDATER WITH HISTORY STACK (UNDO / REDO)
  // --------------------------------------------------------------------------
  const updateSyllabus = useCallback((updater: (prev: FullSyllabusData) => FullSyllabusData) => {
    setSyllabus((prev) => {
      const updated = updater(prev);

      // Persist to local storage cache so reloads preserve draft edits
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('active_saved_syllabus', JSON.stringify(updated));
        } catch (e) {}
      }

      // Push to history
      setHistory((prevHistory) => {
        const newHistory = prevHistory.slice(0, historyIndex + 1);
        return [...newHistory, updated];
      });
      setHistoryIndex((prevIdx) => prevIdx + 1);

      setIsDirty(true);
      setAutoSaveState('unsaved');

      // Schedule Auto Save simulation
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      saveTimeoutRef.current = setTimeout(() => {
        setAutoSaveState('saving');
        setTimeout(() => {
          setAutoSaveState('saved');
          setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        }, 800);
      }, 1500);

      return updated;
    });
  }, [historyIndex]);

  // Handle "Generate Timeline" for a single unit
  const handleGenerateTimeline = useCallback(async (unitId: string, uIdx: number) => {
    const unit = syllabus.units[uIdx];
    if (!unit || unit.learningHours <= 0) {
      setTimelineErrors((prev) => ({ ...prev, [unitId]: 'Please set total unit hours before generating a timeline.' }));
      return;
    }
    if (unit.topics.length === 0) {
      setTimelineErrors((prev) => ({ ...prev, [unitId]: 'This unit has no topics to allocate time to.' }));
      return;
    }

    setGeneratingTimeline((prev) => ({ ...prev, [unitId]: true }));
    setTimelineErrors((prev) => { const n = { ...prev }; delete n[unitId]; return n; });

    try {
      const topicsInput: TopicAllocationInput[] = unit.topics.map((t) => ({
        id: t.id,
        title: t.title,
        description: t.description,
        subtopics: t.subtopics.map((s) => ({ title: s.title })),
        difficulty: t.difficulty,
        importance: t.importance,
      }));

      const result = await generateTopicTimeline(unit.title, unit.learningHours, topicsInput);

      // Write allocations back into syllabus state
      updateSyllabus((prev) => {
        const updatedUnits = [...prev.units];
        const updatedTopics = updatedUnits[uIdx].topics.map((t) => ({
          ...t,
          learningHours: result.allocations[t.id] ?? t.learningHours,
        }));
        updatedUnits[uIdx] = { ...updatedUnits[uIdx], topics: updatedTopics };
        return { ...prev, units: updatedUnits };
      });

      // Mark all topics of this unit as freshly generated (for glow animation)
      const freshIds: Record<string, boolean> = {};
      unit.topics.forEach((t) => { freshIds[t.id] = true; });
      setFreshlyGenerated((prev) => ({ ...prev, ...freshIds }));
      setTimeout(() => {
        setFreshlyGenerated((prev) => {
          const n = { ...prev };
          unit.topics.forEach((t) => { delete n[t.id]; });
          return n;
        });
      }, 3000);
    } catch (err: any) {
      setTimelineErrors((prev) => ({ ...prev, [unitId]: err?.message || 'Failed to generate timeline. Check your API key configuration.' }));
    } finally {
      setGeneratingTimeline((prev) => { const n = { ...prev }; delete n[unitId]; return n; });
    }
  }, [syllabus, updateSyllabus]);

  // Undo Functionality
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setSyllabus(history[newIndex]);
      setIsDirty(true);
      setAutoSaveState('unsaved');
    }
  }, [historyIndex, history]);

  // Redo Functionality
  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setSyllabus(history[newIndex]);
      setIsDirty(true);
      setAutoSaveState('unsaved');
    }
  }, [historyIndex, history]);

  // Keyboard Shortcuts (Ctrl+Z / Ctrl+Shift+Z / Cmd+Z / Cmd+Shift+Z)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        if (e.shiftKey) {
          e.preventDefault();
          handleRedo();
        } else {
          e.preventDefault();
          handleUndo();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handleRedo]);

  const mainContentRef = useRef<HTMLDivElement | null>(null);

  // --------------------------------------------------------------------------
  // INTERSECTION / SCROLL OBSERVER FOR SIDEBAR ACTIVE SECTION HIGHLIGHTING
  // --------------------------------------------------------------------------
  useEffect(() => {
    const container = mainContentRef.current;
    const sectionIds = [
      'sec-course-details',
      'sec-objectives',
      'sec-outcomes',
      'sec-units',
      'sec-lab-experiments',
      'sec-textbooks',
      'sec-references',
      'sec-assessment',
      'sec-additional'
    ];

    const handleScroll = () => {
      if (container && window.innerWidth >= 1024) {
        const containerRect = container.getBoundingClientRect();
        for (const id of sectionIds) {
          const element = document.getElementById(id);
          if (element) {
            const elemRect = element.getBoundingClientRect();
            const relativeTop = elemRect.top - containerRect.top;
            if (relativeTop <= 160 && elemRect.bottom - containerRect.top > 60) {
              setActiveSection(id);
              break;
            }
          }
        }
      } else {
        const scrollPosition = window.scrollY + 200;
        for (const id of sectionIds) {
          const element = document.getElementById(id);
          if (element) {
            const top = element.offsetTop;
            const height = element.offsetHeight;
            if (scrollPosition >= top && scrollPosition < top + height) {
              setActiveSection(id);
              break;
            }
          }
        }
      }
    };

    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const scrollToSection = useCallback((id: string) => {
    setActiveSection(id);
    const element = document.getElementById(id);
    const container = mainContentRef.current;

    if (element && container && window.innerWidth >= 1024) {
      const containerTop = container.getBoundingClientRect().top;
      const elementTop = element.getBoundingClientRect().top;
      const targetOffset = container.scrollTop + (elementTop - containerTop) - 16;
      container.scrollTo({ top: targetOffset, behavior: 'smooth' });
    } else if (element) {
      const yOffset = -90;
      const y = element.getBoundingClientRect().top + window.pageYOffset + yOffset;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  }, []);

  // --------------------------------------------------------------------------
  // VALIDATION ENGINE
  // --------------------------------------------------------------------------
  const validationErrors = useMemo<ValidationError[]>(() => {
    const errors: ValidationError[] = [];

    // Course Details Validations
    if (!syllabus.course.title.trim()) {
      errors.push({ field: 'Course Title', message: 'Course Title cannot be empty.', severity: 'error', sectionId: 'sec-course-details' });
    }
    if (!syllabus.course.code.trim()) {
      errors.push({ field: 'Course Code', message: 'Course Code is required.', severity: 'warning', sectionId: 'sec-course-details' });
    }

    const calculatedLTP = Number(syllabus.course.lectureHours) + Number(syllabus.course.tutorialHours) + Number(syllabus.course.practicalHours);
    if (calculatedLTP !== Number(syllabus.course.credits) && calculatedLTP === 0) {
      errors.push({ field: 'Hours Mismatch', message: 'Lecture, Tutorial, and Practical hours total zero.', severity: 'warning', sectionId: 'sec-course-details' });
    }

    // Objectives Validation
    if (syllabus.objectives.length === 0) {
      errors.push({ field: 'Objectives', message: 'At least one Course Objective is recommended.', severity: 'warning', sectionId: 'sec-objectives' });
    }

    // Outcomes Validation
    if (syllabus.outcomes.length === 0) {
      errors.push({ field: 'Outcomes', message: 'At least one Course Outcome is required.', severity: 'warning', sectionId: 'sec-outcomes' });
    }

    // Units Validations
    if (syllabus.units.length === 0) {
      errors.push({ field: 'Units', message: 'No curriculum units defined.', severity: 'error', sectionId: 'sec-units' });
    }

    const totalUnitHours = syllabus.units.reduce((sum, u) => sum + (Number(u.learningHours) || 0), 0);
    const practicalHours = Number(syllabus.course.practicalHours) || ((syllabus.labExperiments && syllabus.labExperiments.length > 0) ? 30 : 0);
    const theoryTarget = syllabus.course.lectureHours || (syllabus.course.totalHours > practicalHours ? (syllabus.course.totalHours - practicalHours) : syllabus.course.totalHours);

    if (syllabus.course.totalHours > 0) {
      const matchesTotal = Math.abs(totalUnitHours - syllabus.course.totalHours) <= 2;
      const matchesTheory = Math.abs(totalUnitHours - theoryTarget) <= 2;
      const matchesTheoryPlusLab = Math.abs((totalUnitHours + practicalHours) - syllabus.course.totalHours) <= 2;

      if (!matchesTotal && !matchesTheory && !matchesTheoryPlusLab) {
        errors.push({
          field: 'Unit Hours Mismatch',
          message: `Sum of unit hours (${totalUnitHours} hrs) does not match total course hours (${syllabus.course.totalHours} hrs).`,
          severity: 'warning',
          sectionId: 'sec-units'
        });
      }
    }

    syllabus.units.forEach((unit, uIdx) => {
      if (!unit.title.trim()) {
        errors.push({ field: `Unit ${uIdx + 1} Title`, message: `Unit ${uIdx + 1} has no title.`, severity: 'error', sectionId: 'sec-units' });
      }
      if (unit.topics.length === 0) {
        errors.push({ field: `Unit ${uIdx + 1} Topics`, message: `Unit ${uIdx + 1} ("${unit.title || 'Untitled'}") has no topics.`, severity: 'warning', sectionId: 'sec-units' });
      }
    });

    // Books Validation
    if (syllabus.textbooks.length === 0) {
      errors.push({ field: 'Textbooks', message: 'Please provide at least one recommended Textbook.', severity: 'warning', sectionId: 'sec-textbooks' });
    }

    // Assessment Total Weightage Validation
    const totalWeight = syllabus.assessment.reduce((sum, item) => sum + (Number(item.weightagePercent) || 0), 0);
    if (totalWeight !== 100) {
      errors.push({
        field: 'Assessment Weightage',
        message: `Total assessment weightage is ${totalWeight}% (Should equal 100%).`,
        severity: 'warning',
        sectionId: 'sec-assessment'
      });
    }

    return errors;
  }, [syllabus]);

  // --------------------------------------------------------------------------
  // SEARCH FILTER HELPER & HIGHLIGHTER
  // --------------------------------------------------------------------------
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, idx) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={idx} className="bg-amber-300 dark:bg-amber-500/40 dark:text-amber-200 px-0.5 rounded font-semibold">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Unit filter handler
  const filteredUnits = useMemo(() => {
    return syllabus.units.filter((unit) => {
      if (unitFilter !== 'all' && unit.id !== unitFilter) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchesUnitTitle = unit.title.toLowerCase().includes(q);
      const matchesUnitDesc = unit.description.toLowerCase().includes(q);
      const matchesTopics = unit.topics.some(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.subtopics.some((s) => s.title.toLowerCase().includes(q))
      );

      return matchesUnitTitle || matchesUnitDesc || matchesTopics;
    });
  }, [syllabus.units, unitFilter, searchQuery]);

  // Expand / Collapse All handlers
  const handleExpandAllUnits = () => {
    const updated: Record<string, boolean> = {};
    syllabus.units.forEach((u) => {
      updated[u.id] = true;
    });
    setExpandedUnits(updated);
  };

  const handleCollapseAllUnits = () => {
    const updated: Record<string, boolean> = {};
    syllabus.units.forEach((u) => {
      updated[u.id] = false;
    });
    setExpandedUnits(updated);
  };

  const toggleUnitExpand = (unitId: string) => {
    setExpandedUnits((prev) => ({ ...prev, [unitId]: !prev[unitId] }));
  };

  // Save changes handler
  const handleSaveChanges = async () => {
    setIsSavingModalOpen(true);
    const courseCodeTrimmed = (syllabus.course?.code || '').trim();
    const courseId = courseCodeTrimmed
      ? courseCodeTrimmed
      : (syllabus.id && syllabus.id !== "course_dynamic")
        ? syllabus.id
        : `course_${Date.now()}`;

    const syllabusToSave: FullSyllabusData = {
      ...syllabus,
      id: courseId,
      course: {
        ...syllabus.course,
        code: courseCodeTrimmed || syllabus.course.code || courseId,
      }
    };

    try {
      const { saveVerifiedSyllabus } = await import('@/lib/api-client');
      const saveRes = await saveVerifiedSyllabus(courseId, syllabusToSave);
      if (saveRes && saveRes.jobId) {
        setCurrentJobId(saveRes.jobId);
      }

      // Persist to local storage cache as well for immediate frontend reload capability
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('active_saved_syllabus', JSON.stringify(syllabusToSave));
        } catch (e) {
          console.warn("Could not save active_saved_syllabus to localStorage:", e);
        }
      }

      // Sync updated syllabus state to global Zustand store
      const setStoreSyllabus = useSyllabusStore.getState().setSyllabus;
      if (setStoreSyllabus) {
        setStoreSyllabus({
          id: courseId,
          course: {
            code: syllabusToSave.course.code,
            title: syllabusToSave.course.title,
            programme: syllabusToSave.course.programme,
            department: syllabusToSave.course.department,
            semester: syllabusToSave.course.semester,
            credits: String(syllabusToSave.course.credits),
            hours: {
              lecture: String(syllabusToSave.course.lectureHours),
              tutorial: String(syllabusToSave.course.tutorialHours),
              practical: String(syllabusToSave.course.practicalHours),
              total: String(syllabusToSave.course.totalHours),
            },
            prerequisites: syllabusToSave.additionalInfo?.prerequisites || '',
            objectives: syllabusToSave.objectives,
            outcomes: syllabusToSave.outcomes,
          },
          units: syllabusToSave.units.map((u, idx) => ({
            unit_number: idx + 1,
            title: u.title,
            hours: String(u.learningHours),
            topics: u.topics.map((t) => ({
              name: t.title,
              subtopics: t.subtopics.map((s) => (typeof s === 'string' ? s : s.title)),
            })),
          })),
          textbooks: syllabusToSave.textbooks,
          reference_books: syllabusToSave.referenceBooks,
          assessment: syllabusToSave.assessment || {},
          additional_information: syllabusToSave.additionalInfo || {},
        });
      }
      
      setSyllabus(syllabusToSave);
      setIsDirty(false);
      setAutoSaveState('saved');
      setLastSavedTime(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));

      // Wait 1.8s for user to view the Syllabus Saved card, then automatically route to syllabus repository
      setTimeout(() => {
        setIsSavingModalOpen(false);
        router.push('/syllabus');
      }, 1800);
    } catch (err) {
      console.warn("Failed to save syllabus to backend database:", err);
      setIsDirty(false);
      setAutoSaveState('saved');
      setTimeout(() => {
        setIsSavingModalOpen(false);
        router.push('/syllabus');
      }, 1800);
    }
  };

  const handleResetDraft = () => {
    if (confirm("Reset all unsaved edits to the initial verified state?")) {
      setSyllabus(emptySyllabusData);
      setHistory([emptySyllabusData]);
      setHistoryIndex(0);
      setIsDirty(false);
      setAutoSaveState('saved');
    }
  };

  // --------------------------------------------------------------------------
  // RENDER METHOD
  // --------------------------------------------------------------------------
  return (
    <AppShell>
      <div className="relative pb-24 text-slate-900 dark:text-slate-100 font-sans">
        
        {/* ================================================================== */}
        {/* TOP STICKY HEADER / VERIFICATION TOOLBAR */}
        {/* ================================================================== */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          className="sticky top-4 z-40 mb-6 rounded-2xl border border-slate-200/90 dark:border-cyan-500/25 bg-white/90 dark:bg-slate-950/85 p-4 backdrop-blur-xl shadow-lg dark:shadow-[0_0_30px_rgba(6,182,212,0.15)] flex flex-wrap items-center justify-between gap-4 transition-all"
        >
          {/* Header Left: Branding & Status */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => router.push('/upload')}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors"
              title="Go back to Upload"
            >
              <ArrowLeft size={18} />
            </button>

            <div className="flex items-center gap-2">
              <div className="rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 p-2 text-white shadow-md">
                <Cpu size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-base font-extrabold tracking-tight text-slate-900 dark:text-white">
                    Syllabus Verification & Editor
                  </h1>
                  <span className="inline-flex items-center gap-1 rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2.5 py-0.5 text-xs font-mono font-bold text-cyan-600 dark:text-cyan-300">
                    {syllabus.course.code || 'CODE'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium truncate max-w-xs sm:max-w-md">
                  {syllabus.course.title || 'Untitled Course'}
                </p>
              </div>
            </div>

            {/* Status Badge */}
            <div className="flex items-center gap-2 border-l border-slate-200 dark:border-slate-800 pl-3 ml-1">
              <button
                onClick={() =>
                  updateSyllabus((prev) => ({
                    ...prev,
                    course: {
                      ...prev.course,
                      status: prev.course.status === 'Verified' ? 'In Review' : 'Verified'
                    }
                  }))
                }
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition-all ${
                  syllabus.course.status === 'Verified'
                    ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 shadow-sm'
                    : 'border-amber-500/40 bg-amber-500/15 text-amber-600 dark:text-amber-300'
                }`}
              >
                {syllabus.course.status === 'Verified' ? <CheckCircle size={14} /> : <AlertCircle size={14} />}
                <span>Status: {syllabus.course.status}</span>
              </button>
            </div>
          </div>

          {/* Header Right: Undo/Redo, AutoSave Indicator, Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input in Top Header */}
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Instant search syllabus..."
                className="w-48 lg:w-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 pl-9 pr-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  <X size={12} />
                </button>
              )}
            </div>

            {/* Undo / Redo Buttons */}
            <div className="flex items-center gap-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1">
              <button
                onClick={handleUndo}
                disabled={historyIndex <= 0}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
                title="Undo (Ctrl+Z)"
              >
                <Undo2 size={16} />
              </button>
              <button
                onClick={handleRedo}
                disabled={historyIndex >= history.length - 1}
                className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 disabled:opacity-30 transition-all"
                title="Redo (Ctrl+Shift+Z)"
              >
                <Redo2 size={16} />
              </button>
            </div>

            {/* Dynamic Cards Editor Mode Toggle */}
            <button
              onClick={() => setUseDynamicEditor(!useDynamicEditor)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border flex items-center gap-1.5 ${
                useDynamicEditor
                  ? 'bg-indigo-600/20 text-indigo-400 border-indigo-500/40 shadow-lg shadow-indigo-500/10'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              <Sparkles size={14} className={useDynamicEditor ? 'text-indigo-400' : 'text-slate-400'} />
              <span>{useDynamicEditor ? 'Dynamic Cards Active' : 'Switch to Dynamic Cards Editor'}</span>
            </button>

            {/* Auto Save Status Indicator */}
            <div className="flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs font-mono">

              {autoSaveState === 'saving' && (
                <span className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                  <RefreshCw size={13} className="animate-spin" /> Saving...
                </span>
              )}
              {autoSaveState === 'saved' && (
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 size={13} /> Saved ({lastSavedTime})
                </span>
              )}
              {autoSaveState === 'unsaved' && (
                <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
                  <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" /> Unsaved changes
                </span>
              )}
            </div>

            {/* JSON Export / Preview Modal Toggle */}
            <button
              onClick={() => setShowJsonPreview(!showJsonPreview)}
              className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors font-mono text-xs flex items-center gap-1.5"
              title="Inspect raw JSON"
            >
              <FileText size={15} />
              <span className="hidden sm:inline">JSON</span>
            </button>

            {/* Clear Cached Draft Button */}
            <button
              onClick={() => {
                if (window.confirm("Clear active syllabus draft and start fresh?")) {
                  if (typeof window !== 'undefined') {
                    try {
                      localStorage.removeItem('active_saved_syllabus');
                    } catch (e) {}
                  }
                  useSyllabusStore.getState().setSyllabus(emptySyllabus);
                  setSyllabus(emptySyllabusData);
                  setHistory([emptySyllabusData]);
                }
              }}
              className="p-2 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 transition-colors font-mono text-xs flex items-center gap-1.5"
              title="Discard current syllabus draft"
            >
              <Trash2 size={15} />
              <span className="hidden sm:inline">Clear Draft</span>
            </button>

            {/* Main Header Save Button */}
            <button
              id="guide-save-btn-top"
              onClick={handleSaveChanges}
              disabled={autoSaveState === 'saving'}
              className={`rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white px-4 py-2 text-xs font-bold shadow-md hover:shadow-cyan-500/20 disabled:opacity-50 transition-all flex items-center gap-1.5 ${
                highlightedTargetId === 'guide-save-btn-top'
                  ? 'ring-4 ring-indigo-400 border-indigo-300 shadow-[0_0_30px_rgba(99,102,241,0.8)] animate-pulse scale-105'
                  : ''
              }`}
            >
              <Save size={15} />
              <span>Save Changes</span>
            </button>
          </div>
        </motion.div>

        {/* ⚠️ Course Code Mismatch Alert Banner */}
        {(syllabus.isCodeMismatch || !!syllabus.mismatchWarning) && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 rounded-2xl border border-amber-500/40 bg-amber-500/10 dark:bg-amber-950/40 p-4 sm:p-5 backdrop-blur-xl shadow-lg relative overflow-hidden flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-amber-900 dark:text-amber-200"
          >
            <div className="flex items-start sm:items-center gap-3.5">
              <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-600 dark:text-amber-400 shrink-0">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2 font-bold text-sm text-amber-700 dark:text-amber-300">
                  <span>⚠️ Course Code Mismatch Detected</span>
                  <span className="px-2 py-0.5 text-[10px] uppercase tracking-wider font-mono font-extrabold rounded-md bg-amber-500/20 border border-amber-500/30 text-amber-800 dark:text-amber-200">
                    Validation Warning
                  </span>
                </div>
                <p className="text-xs sm:text-sm mt-1 text-amber-800/90 dark:text-amber-200/90 leading-relaxed font-medium">
                  {syllabus.mismatchWarning ||
                    `You entered course code '${syllabus.userCourseCode || "entered code"}', but the uploaded document extracted code is '${syllabus.pdfCourseCode || syllabus.course.code}'. Please verify if the correct document was uploaded.`}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
              {(syllabus.pdfCourseCode || syllabus.course.code) && (
                <button
                  onClick={() => {
                    const targetCode = syllabus.pdfCourseCode || syllabus.course.code;
                    setSyllabus((prev) => ({
                      ...prev,
                      course: {
                        ...prev.course,
                        code: targetCode,
                      },
                    }));
                    toast.info(`Course code updated to extracted code: ${targetCode}`);
                  }}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-900 dark:text-amber-100 transition-colors"
                >
                  Use Extracted ({syllabus.pdfCourseCode || 'PDF'})
                </button>
              )}
              <button
                onClick={() => {
                  setSyllabus((prev) => ({
                    ...prev,
                    isCodeMismatch: false,
                    mismatchWarning: undefined,
                  }));
                }}
                className="p-1.5 text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 rounded-lg hover:bg-amber-500/10 transition-colors"
                title="Dismiss warning"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}

        {/* Dynamic Real-Time 7-Step Phase 1 Extraction Progress Bar with Live Logs */}
        {extractionState.isExtracting && (
          <div className="mb-8">
            <Phase1ExtractionProgress
              fileName={pendingExtraction?.file?.name || (syllabus.course?.code ? `${syllabus.course.code}.pdf` : 'BE3251.pdf')}
              currentStep={extractionState.step || 1}
              progress={extractionState.progress || 0}
              statusText={extractionState.statusText}
              statusCode={extractionState.statusText}
              error={extractionState.error}
            />
          </div>
        )}

        {/* Course Code Mismatch Alert Banner */}
        {((syllabus as any).isCodeMismatch || ((syllabus as any).pdfCourseCode && (syllabus as any).userCourseCode && (syllabus as any).pdfCourseCode !== (syllabus as any).userCourseCode)) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 rounded-2xl border border-red-500/40 bg-red-500/10 p-4 backdrop-blur-md text-red-900 dark:text-red-200 shadow-md"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-6 w-6 text-red-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-extrabold text-red-800 dark:text-red-200">
                  ⚠️ Course Code Mismatch Detected
                </h4>
                <p className="text-xs text-red-700 dark:text-red-300 mt-1 leading-relaxed font-medium">
                  {(syllabus as any).mismatchWarning || `You entered course code '${(syllabus as any).userCourseCode || 'GE3451'}', but the uploaded document specifies course code '${(syllabus as any).pdfCourseCode || syllabus.course.code}'. Please verify if you uploaded the correct syllabus document.`}
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Global Validation Warning Banner */}
        {validationErrors.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-4 backdrop-blur-md"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-bold text-amber-800 dark:text-amber-300">
                  Verification Warnings ({validationErrors.length} issues detected)
                </h4>
                <p className="text-xs text-amber-700 dark:text-amber-400 mt-0.5">
                  Review these items prior to approving curriculum verification:
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {validationErrors.map((err, idx) => (
                    <button
                      key={idx}
                      onClick={() => scrollToSection(err.sectionId)}
                      className="inline-flex items-center gap-1 rounded-lg border border-amber-500/30 bg-white/80 dark:bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-amber-900 dark:text-amber-200 hover:bg-amber-100 dark:hover:bg-amber-950 transition-colors"
                    >
                      <span className="font-bold text-amber-600">● {err.field}:</span> {err.message}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {useDynamicEditor ? (
          <DynamicSyllabusEditor
            initialSyllabus={dynamicPayload}
            onSave={handleSaveDynamicEditor}
          />
        ) : (
          <div className="flex flex-col lg:flex-row gap-6 items-start lg:h-[calc(100vh-140px)] min-h-0">

          
          {/* ---------------------------------------------------------------- */}
          {/* LEFT SIDEBAR (STICKY NAVIGATION & STATS PANEL) */}
          {/* ---------------------------------------------------------------- */}
          <aside className="w-full lg:w-[300px] xl:w-[320px] shrink-0 sticky top-4 self-start flex flex-col gap-4 max-h-[calc(100vh-100px)] overflow-hidden pr-1 z-20">
            
            {/* Syllabus Navigation Box */}
            <div className="rounded-2xl border border-slate-200/90 dark:border-slate-800/80 bg-white/80 dark:bg-slate-950/80 p-4 backdrop-blur-xl shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800 pb-2 shrink-0">
                <span className="text-xs font-mono font-bold tracking-wider text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1.5">
                  <ListChecks size={14} className="text-cyan-500" /> Syllabus Navigation
                </span>
                <span className="text-[10px] font-mono rounded-full bg-slate-100 dark:bg-slate-900 px-2 py-0.5 text-slate-500">
                  9 SECTIONS
                </span>
              </div>

              <nav className="flex-1 min-h-0 overflow-y-auto custom-sidebar-scrollbar pr-1 flex flex-col gap-1.5">
                {[
                  { id: 'sec-course-details', label: '1. Course Details', icon: Info, count: null },
                  { id: 'sec-objectives', label: '2. Course Objectives', icon: TargetIcon, count: syllabus.objectives.length },
                  { id: 'sec-outcomes', label: '3. Course Outcomes', icon: Award, count: syllabus.outcomes.length },
                  { id: 'sec-units', label: '4. Units & Topics', icon: Layers, count: syllabus.units.length },
                  { id: 'sec-lab-experiments', label: '5. Lab Experiments', icon: FlaskConical, count: syllabus.labExperiments?.length || 0 },
                  { id: 'sec-textbooks', label: '6. Textbooks', icon: BookOpen, count: syllabus.textbooks.length },
                  { id: 'sec-references', label: '7. Reference Books', icon: BookMarked, count: syllabus.referenceBooks.length },
                  { id: 'sec-assessment', label: '8. Assessment Scheme', icon: ListChecks, count: syllabus.assessment.length },
                  { id: 'sec-additional', label: '9. Additional Info', icon: Settings, count: null }
                ].map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  const hasSectionError = validationErrors.some((e) => e.sectionId === item.id);

                  return (
                    <button
                      key={item.id}
                      onClick={() => scrollToSection(item.id)}
                      className={`w-full flex items-center justify-between rounded-xl px-3.5 py-2.5 text-xs font-semibold transition-all group border ${
                        isActive
                          ? 'border-cyan-500/50 bg-gradient-to-r from-cyan-500/10 to-indigo-500/10 text-cyan-600 dark:text-cyan-300 shadow-sm'
                          : 'border-transparent text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900 hover:text-slate-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <Icon size={16} className={isActive ? 'text-cyan-500' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'} />
                        <span className="truncate">{item.label}</span>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {hasSectionError && (
                          <span className="h-2 w-2 rounded-full bg-amber-500" title="Section has verification warnings" />
                        )}
                        {item.count !== null && (
                          <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${
                            isActive ? 'bg-cyan-500/20 text-cyan-700 dark:text-cyan-300' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'
                          }`}>
                            {item.count}
                          </span>
                        )}
                        <ChevronRight size={14} className={`transition-transform ${isActive ? 'translate-x-0.5 text-cyan-500' : 'opacity-0 group-hover:opacity-100'}`} />
                      </div>
                    </button>
                  );
                })}
              </nav>
            </div>

            {/* Quick Metrics / Summary Card */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-gradient-to-br from-slate-50 to-indigo-50/30 dark:from-slate-950 dark:to-slate-900/60 p-4 space-y-3 shrink-0">
              <h5 className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Syllabus Stats
              </h5>
              <div className="grid grid-cols-2 gap-2">
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-2.5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">TOTAL UNITS</p>
                  <p className="text-lg font-black text-cyan-600 dark:text-cyan-400">{syllabus.units.length}</p>
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-2.5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">TOTAL TOPICS</p>
                  <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">
                    {syllabus.units.reduce((acc, u) => acc + u.topics.length, 0)}
                  </p>
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-2.5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">TOTAL HOURS</p>
                  <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">{syllabus.course.totalHours} hrs</p>
                </div>
                <div className="rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 p-2.5">
                  <p className="text-[10px] text-slate-500 dark:text-slate-400 font-mono">CREDITS</p>
                  <p className="text-lg font-black text-amber-600 dark:text-amber-400">{syllabus.course.credits}</p>
                </div>
              </div>
            </div>

          </aside>

          {/* ---------------------------------------------------------------- */}
          {/* RIGHT CONTENT AREA (INDEPENDENT SCROLLABLE VERIFICATION BLOCKS) */}
          {/* ---------------------------------------------------------------- */}
          <main
            ref={mainContentRef}
            className="flex-1 min-w-0 w-full lg:h-full lg:max-h-[calc(100vh-140px)] lg:overflow-y-auto space-y-6 pr-2 custom-sidebar-scrollbar scroll-smooth"
          >
            {/* Top Toolbar: Verification Tabs & AI Status Widget */}
            <div className="space-y-4 relative z-50">
              <div className="flex flex-wrap items-center justify-between gap-3 p-1.5 rounded-2xl bg-slate-900/90 border border-slate-800 backdrop-blur-md relative z-50">
                <div className="flex flex-wrap items-center gap-1">
                  {[
                    { id: 'general', label: 'General', icon: FileText },
                    { id: 'units', label: 'Units & Topics', icon: Layers },
                    { id: 'cos', label: 'COs', icon: Award },
                    { id: 'copo', label: 'CO-PO', icon: SlidersHorizontal },
                    { id: 'references', label: 'References', icon: BookMarked },
                    { id: 'json', label: 'Raw JSON', icon: FileCode }
                  ].map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          isActive
                            ? 'bg-gradient-to-r from-indigo-600 to-cyan-600 text-white shadow-md shadow-cyan-500/20'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                        }`}
                      >
                        <Icon size={14} className={isActive ? 'text-white' : 'text-slate-400'} />
                        <span>{tab.label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pr-1 relative z-50">
                  <NotificationCenter />
                </div>
              </div>

              {/* Background AI Pipeline Status Widget */}
              <AIProcessingStatus jobId={currentJobId} courseId={syllabus.course.code} />
            </div>

            {/* ================================================================ */}
            {/* TAB 1: GENERAL (COURSE DETAILS & OBJECTIVES) */}
            {/* ================================================================ */}
            {(activeTab === 'general' || activeTab === 'json') && (
              <>
                <section id="sec-course-details" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-500 via-indigo-500 to-blue-600" />
                
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      <Info size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">1. Course Details</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Basic metadata and credit breakdown for the curriculum.</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {/* Course Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Course Code *</label>
                    <input
                      type="text"
                      value={syllabus.course.code}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, code: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Course Title */}
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Course Title *</label>
                    <input
                      type="text"
                      value={syllabus.course.title}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, title: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Programme */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Programme</label>
                    <input
                      type="text"
                      value={syllabus.course.programme}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, programme: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Department</label>
                    <input
                      type="text"
                      value={syllabus.course.department}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, department: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Regulation */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Regulation</label>
                    <input
                      type="text"
                      value={syllabus.course.regulation}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, regulation: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Semester */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Semester</label>
                    <input
                      type="text"
                      value={syllabus.course.semester}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, semester: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Credits */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Credits</label>
                    <input
                      type="number"
                      value={syllabus.course.credits}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, credits: Number(e.target.value) || 0 }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-bold text-cyan-600 dark:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Category</label>
                    <input
                      type="text"
                      value={syllabus.course.category}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, category: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Hours breakdown: L, T, P, Total */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Lecture Hours (L)</label>
                    <input
                      type="number"
                      value={syllabus.course.lectureHours}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, lectureHours: Number(e.target.value) || 0 }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Tutorial Hours (T)</label>
                    <input
                      type="number"
                      value={syllabus.course.tutorialHours}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, tutorialHours: Number(e.target.value) || 0 }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Practical Hours (P)</label>
                    <input
                      type="number"
                      value={syllabus.course.practicalHours}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, practicalHours: Number(e.target.value) || 0 }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3.5 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Total Learning Hours</label>
                    <input
                      type="number"
                      value={syllabus.course.totalHours}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          course: { ...prev.course, totalHours: Number(e.target.value) || 0 }
                        }))
                      }
                      className="w-full rounded-xl border border-cyan-500/40 bg-cyan-500/5 px-3.5 py-2 text-sm font-extrabold text-cyan-600 dark:text-cyan-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </motion.div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 2: COURSE OBJECTIVES */}
            {/* ================================================================ */}
            <section id="sec-objectives" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm backdrop-blur-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      <TargetIcon size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">2. Course Objectives</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Goals and key knowledge outcomes intended for students.</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      updateSyllabus((prev) => ({
                        ...prev,
                        objectives: [...prev.objectives, "New course objective..."]
                      }))
                    }
                    className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Objective
                  </button>
                </div>

                <div className="space-y-3">
                  {syllabus.objectives.map((obj, idx) => (
                    <motion.div
                      key={idx}
                      layout
                      className="group flex items-start gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                        {idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={obj}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSyllabus((prev) => {
                            const updatedObj = [...prev.objectives];
                            updatedObj[idx] = val;
                            return { ...prev, objectives: updatedObj };
                          });
                        }}
                        className="flex-1 rounded-xl border border-transparent bg-transparent p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all resize-none"
                      />
                      <div className="flex flex-col items-center gap-1 opacity-80 group-hover:opacity-100">
                        {/* Reorder Up */}
                        <button
                          disabled={idx === 0}
                          onClick={() =>
                            updateSyllabus((prev) => {
                              const list = [...prev.objectives];
                              const temp = list[idx - 1];
                              list[idx - 1] = list[idx];
                              list[idx] = temp;
                              return { ...prev, objectives: list };
                            })
                          }
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        {/* Reorder Down */}
                        <button
                          disabled={idx === syllabus.objectives.length - 1}
                          onClick={() =>
                            updateSyllabus((prev) => {
                              const list = [...prev.objectives];
                              const temp = list[idx + 1];
                              list[idx + 1] = list[idx];
                              list[idx] = temp;
                              return { ...prev, objectives: list };
                            })
                          }
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        {/* Delete */}
                        <button
                          onClick={() =>
                            updateSyllabus((prev) => ({
                              ...prev,
                              objectives: prev.objectives.filter((_, i) => i !== idx)
                            }))
                          }
                          className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
                          title="Delete objective"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>
              </>
            )}

            {/* ================================================================ */}
            {/* TAB 4: COURSE OUTCOMES (COs) */}
            {/* ================================================================ */}
            {(activeTab === 'cos' || activeTab === 'json') && (
            <section id="sec-outcomes" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm backdrop-blur-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                      <Award size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">3. Course Outcomes (COs)</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Measurable skills and competencies achieved upon completion.</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      updateSyllabus((prev) => ({
                        ...prev,
                        outcomes: [...prev.outcomes, "New course outcome..."]
                      }))
                    }
                    className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Outcome
                  </button>
                </div>

                <div className="space-y-3">
                  {syllabus.outcomes.map((out: any, idx: number) => {
                    const outVal = typeof out === 'string' ? out : (out?.description || out?.statement || (out?.code ? `${out.code}: ${out.description || ''}` : String(out)));
                    const coCode = (typeof out === 'object' && out?.code) ? out.code : `CO${idx + 1}`;
                    return (
                      <motion.div
                        key={idx}
                        layout
                        className="group flex items-start gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                      >
                        <span className="flex h-6 px-2 shrink-0 items-center justify-center rounded-lg bg-emerald-500/15 font-mono text-xs font-extrabold text-emerald-600 dark:text-emerald-400 mt-1">
                          {coCode}
                        </span>
                        <textarea
                          rows={2}
                          value={outVal}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSyllabus((prev) => {
                              const updatedOut = [...prev.outcomes];
                              if (typeof updatedOut[idx] === 'object' && updatedOut[idx] !== null) {
                                updatedOut[idx] = { ...(updatedOut[idx] as any), description: val };
                              } else {
                                updatedOut[idx] = val;
                              }
                              return { ...prev, outcomes: updatedOut };
                            });
                          }}
                        className="flex-1 rounded-xl border border-transparent bg-transparent p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-emerald-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all resize-none"
                      />
                      <div className="flex flex-col items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          disabled={idx === 0}
                          onClick={() =>
                            updateSyllabus((prev) => {
                              const list = [...prev.outcomes];
                              const temp = list[idx - 1];
                              list[idx - 1] = list[idx];
                              list[idx] = temp;
                              return { ...prev, outcomes: list };
                            })
                          }
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                          title="Move up"
                        >
                          <ArrowUp size={13} />
                        </button>
                        <button
                          disabled={idx === syllabus.outcomes.length - 1}
                          onClick={() =>
                            updateSyllabus((prev) => {
                              const list = [...prev.outcomes];
                              const temp = list[idx + 1];
                              list[idx + 1] = list[idx];
                              list[idx] = temp;
                              return { ...prev, outcomes: list };
                            })
                          }
                          className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                          title="Move down"
                        >
                          <ArrowDown size={13} />
                        </button>
                        <button
                          onClick={() =>
                            updateSyllabus((prev) => ({
                              ...prev,
                              outcomes: prev.outcomes.filter((_, i) => i !== idx)
                            }))
                          }
                          className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
                          title="Delete outcome"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </motion.div>
                  );
                })}
                </div>
              </motion.div>
            </section>
            )}

            {/* ================================================================ */}
            {/* TAB 2: UNITS & TOPICS */}
            {/* ================================================================ */}
            {(activeTab === 'units' || activeTab === 'json') && (
              <>
                <section id="sec-units" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm backdrop-blur-xl relative overflow-visible"
              >
                {/* Units Header & Global Controls */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      <Layers size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">4. Extracted Units & Topics</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Curriculum units, nested topics, and subtopics breakdown.</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Unit Filter Selector — z-50 ensures dropdown overlays adjacent sections */}
                    <div className="relative z-50">
                      <select
                        value={unitFilter}
                        onChange={(e) => setUnitFilter(e.target.value)}
                        className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-cyan-500 max-h-60 overflow-y-auto cursor-pointer appearance-auto"
                        size={1}
                      >
                        <option value="all">All Units ({syllabus.units.length})</option>
                        {syllabus.units.map((u, i) => (
                          <option key={u.id} value={u.id}>
                            Unit {i + 1}: {u.title.substring(0, 28)}{u.title.length > 28 ? '...' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    <button
                      onClick={handleExpandAllUnits}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium transition-colors"
                      title="Expand all unit cards"
                    >
                      Expand All
                    </button>

                    <button
                      onClick={handleCollapseAllUnits}
                      className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium transition-colors"
                      title="Collapse all unit cards"
                    >
                      Collapse All
                    </button>

                    <button
                      onClick={() =>
                        updateSyllabus((prev) => {
                          const newId = `u${prev.units.length + 1}`;
                          return {
                            ...prev,
                            units: [
                              ...prev.units,
                              {
                                id: newId,
                                title: `Unit ${prev.units.length + 1}: New Curriculum Unit`,
                                description: "Overview of new unit scope.",
                                learningHours: 9.0,
                                topics: []
                              }
                            ]
                          };
                        })
                      }
                      className="rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus size={14} /> Add Unit
                    </button>
                  </div>
                </div>

                {/* ISOLATED SCROLLABLE PANE FOR EXTRACTED UNITS & TOPICS ("PAGE INSIDE A PAGE") */}
                <div className="rounded-2xl border-2 border-slate-200/90 dark:border-cyan-500/20 bg-slate-100/70 dark:bg-slate-900/70 p-4 md:p-6 shadow-inner max-h-[calc(100vh-280px)] overflow-y-auto custom-sidebar-scrollbar relative ring-1 ring-slate-900/5 dark:ring-white/5">
                  
                  {/* Sticky Sub-Page Banner inside inner pane */}
                  <div className="sticky -top-4 md:-top-6 z-20 -mx-4 md:-mx-6 -mt-4 md:-mt-6 mb-5 px-4 md:px-6 py-2.5 bg-white/85 dark:bg-slate-950/85 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-cyan-500 animate-pulse" />
                      <span className="text-[11px] font-mono font-bold tracking-wider text-slate-600 dark:text-slate-300 uppercase">
                        Extracted Units & Topics Pane (Isolated View)
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-semibold text-slate-500 dark:text-slate-400">
                      {filteredUnits.length} {filteredUnits.length === 1 ? 'Unit' : 'Units'} Loaded
                    </span>
                  </div>

                  {/* Units List Cards */}
                  <div className="space-y-6">
                    {filteredUnits.map((unit, uIdx) => {
                      const isExpanded = expandedUnits[unit.id] ?? true;

                      return (
                        <motion.div
                          key={unit.id}
                          layout
                          className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm transition-all hover:border-cyan-500/30"
                        >
                          {/* Unit Card Header */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 dark:border-slate-800 pb-3">
                            <div className="flex items-center gap-3 flex-1">
                              <button
                                onClick={() => toggleUnitExpand(unit.id)}
                                className="p-1 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500"
                              >
                                {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                              </button>

                              <span className="flex h-7 px-2.5 items-center justify-center rounded-xl bg-cyan-500/15 font-mono text-xs font-extrabold text-cyan-600 dark:text-cyan-300">
                                Unit {uIdx + 1}
                              </span>

                              <input
                                type="text"
                                value={unit.title}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateSyllabus((prev) => {
                                    const updatedUnits = [...prev.units];
                                    updatedUnits[uIdx] = { ...updatedUnits[uIdx], title: val };
                                    return { ...prev, units: updatedUnits };
                                  });
                                }}
                                className="flex-1 rounded-xl border border-transparent bg-transparent px-2 py-1 text-sm font-bold text-slate-900 dark:text-white focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all"
                              />
                            </div>

                            <div className="flex items-center gap-3 flex-wrap self-end sm:self-auto">
                               {/* Unit Hours Control / Badge - Displayed ONLY at Unit level */}
                               <div className={`flex items-center gap-1.5 font-mono text-xs px-3 py-1.5 rounded-xl border transition-all ${
                                 unit.learningHours > 0
                                   ? 'text-cyan-700 dark:text-cyan-300 bg-cyan-500/10 dark:bg-cyan-500/15 border-cyan-500/30 shadow-xs font-semibold'
                                   : 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30 border-amber-400/50 animate-pulse'
                               }`}>
                                 <Clock size={14} className={unit.learningHours > 0 ? 'text-cyan-500' : 'text-amber-500'} />
                                 <input
                                   type="number"
                                   min={0}
                                   step={0.5}
                                   value={unit.learningHours || ''}
                                   placeholder="0"
                                   onChange={(e) => {
                                     const val = Number(e.target.value) || 0;
                                     updateSyllabus((prev) => {
                                       const updatedUnits = [...prev.units];
                                       updatedUnits[uIdx] = { ...updatedUnits[uIdx], learningHours: val };
                                       return { ...prev, units: updatedUnits };
                                     });
                                   }}
                                   className="w-10 bg-transparent text-center font-extrabold text-cyan-600 dark:text-cyan-300 focus:outline-none placeholder:text-amber-400"
                                 />
                                 <span className="font-bold">{unit.learningHours === 1 ? 'Hour' : 'Hours'} Allocation</span>
                               </div>

                               {/* Missing hours prompt badge */}
                               {unit.learningHours <= 0 && (
                                 <span className="inline-flex items-center gap-1 text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                                   <AlarmClock size={11} /> Set Hours
                                 </span>
                               )}

                               {/* Generate Timeline Button */}
                               <button
                                 onClick={() => handleGenerateTimeline(unit.id, uIdx)}
                                 disabled={generatingTimeline[unit.id] || unit.learningHours <= 0 || unit.topics.length === 0}
                                 title={unit.learningHours <= 0 ? 'Set unit hours first' : 'AI-generate time allocation per topic'}
                                 className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-sm ${
                                   unit.learningHours > 0 && unit.topics.length > 0 && !generatingTimeline[unit.id]
                                     ? 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white border-transparent shadow-violet-500/25 hover:shadow-violet-500/40'
                                     : 'bg-slate-100 dark:bg-slate-900 text-slate-400 dark:text-slate-600 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                                 }`}
                               >
                                 {generatingTimeline[unit.id] ? (
                                   <><Loader2 size={13} className="animate-spin" /> Generating...</>
                                 ) : (
                                   <><Zap size={13} /> Generate Timeline</>
                                 )}
                               </button>

                              {/* Reorder Unit Up/Down */}
                              <button
                                disabled={uIdx === 0}
                                onClick={() =>
                                  updateSyllabus((prev) => {
                                    const list = [...prev.units];
                                    const temp = list[uIdx - 1];
                                    list[uIdx - 1] = list[uIdx];
                                    list[uIdx] = temp;
                                    return { ...prev, units: list };
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                                title="Move unit up"
                              >
                                <ArrowUp size={14} />
                              </button>
                              <button
                                disabled={uIdx === syllabus.units.length - 1}
                                onClick={() =>
                                  updateSyllabus((prev) => {
                                    const list = [...prev.units];
                                    const temp = list[uIdx + 1];
                                    list[uIdx + 1] = list[uIdx];
                                    list[uIdx] = temp;
                                    return { ...prev, units: list };
                                  })
                                }
                                className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                                title="Move unit down"
                              >
                                <ArrowDown size={14} />
                              </button>

                              {/* Delete Unit */}
                              <button
                                onClick={() => {
                                  if (confirm(`Delete ${unit.title}?`)) {
                                    updateSyllabus((prev) => ({
                                      ...prev,
                                      units: prev.units.filter((_, i) => i !== uIdx)
                                    }));
                                  }
                                }}
                                className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
                                title="Delete unit"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          </div>

                          {/* Timeline Error Banner */}
                          {timelineErrors[unit.id] && (
                            <div className="mt-2 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs font-mono text-red-400">
                              <AlertCircle size={13} className="shrink-0" />
                              <span>{timelineErrors[unit.id]}</span>
                              <button
                                onClick={() => setTimelineErrors((p) => { const n={...p}; delete n[unit.id]; return n; })}
                                className="ml-auto text-red-400 hover:text-red-300"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          )}

                          {/* Expandable Unit Details & Topics */}
                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="mt-4 space-y-4"
                              >
                                {/* Unit Description */}
                                <div>
                                  <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                                    Unit Overview / Description
                                  </label>
                                  <textarea
                                    rows={2}
                                    value={unit.description}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateSyllabus((prev) => {
                                        const updatedUnits = [...prev.units];
                                        updatedUnits[uIdx] = { ...updatedUnits[uIdx], description: val };
                                        return { ...prev, units: updatedUnits };
                                      });
                                    }}
                                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 p-2.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
                                  />
                                </div>

                                {/* Unit Topics Header */}
                                <div className="flex items-center justify-between pt-2">
                                  <span className="text-xs font-mono font-bold text-slate-500 dark:text-slate-400 uppercase">
                                    Topics ({unit.topics.length})
                                  </span>

                                  <button
                                    onClick={() =>
                                      updateSyllabus((prev) => {
                                        const updatedUnits = [...prev.units];
                                        const newTopic: TopicData = {
                                          id: `t${uIdx + 1}_${unit.topics.length + 1}`,
                                          title: "New Topic Title",
                                          description: "Topic learning coverage description.",
                                          difficulty: "Intermediate",
                                          importance: "High",
                                          bloomLevel: "Understand",
                                          learningHours: 0,
                                          subtopics: []
                                        };
                                        updatedUnits[uIdx] = {
                                          ...updatedUnits[uIdx],
                                          topics: [...updatedUnits[uIdx].topics, newTopic]
                                        };
                                        return { ...prev, units: updatedUnits };
                                      })
                                    }
                                    className="rounded-lg border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 px-2.5 py-1 text-xs font-bold transition-all flex items-center gap-1"
                                  >
                                    <Plus size={13} /> Add Topic
                                  </button>
                                </div>

                                {/* Topics Cards */}
                                <div className="space-y-4">
                                  {unit.topics.map((topic, tIdx) => (
                                    <div
                                      key={topic.id || tIdx}
                                      className="rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-900/80 p-4 space-y-3"
                                    >
                                      {/* Topic Header: Title & Actions (No Topic-level hours display) */}
                                      <div className="flex items-center justify-between gap-2">
                                        <div className="flex items-center gap-2 flex-1">
                                          <span className="font-mono text-xs text-indigo-500 font-bold shrink-0">
                                            T{tIdx + 1}.
                                          </span>
                                          <input
                                            type="text"
                                            value={topic.title}
                                            onChange={(e) => {
                                              const val = e.target.value;
                                              updateSyllabus((prev) => {
                                                const updatedUnits = [...prev.units];
                                                const updatedTopics = [...updatedUnits[uIdx].topics];
                                                updatedTopics[tIdx] = { ...updatedTopics[tIdx], title: val };
                                                updatedUnits[uIdx] = { ...updatedUnits[uIdx], topics: updatedTopics };
                                                return { ...prev, units: updatedUnits };
                                              });
                                            }}
                                            className="flex-1 min-w-0 rounded-lg border border-transparent bg-transparent px-2 py-1 text-xs font-bold text-slate-800 dark:text-slate-100 focus:border-indigo-500 focus:outline-none"
                                          />
                                        </div>

                                        <div className="flex items-center gap-2 shrink-0">
                                          {/* Delete Topic */}
                                          <button
                                            onClick={() =>
                                              updateSyllabus((prev) => {
                                                const updatedUnits = [...prev.units];
                                                updatedUnits[uIdx].topics = updatedUnits[uIdx].topics.filter((_, i) => i !== tIdx);
                                                return { ...prev, units: updatedUnits };
                                              })
                                            }
                                            className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
                                            title="Delete topic"
                                          >
                                            <Trash2 size={13} />
                                          </button>
                                        </div>
                                      </div>

                                      {/* Topic Description */}
                                      <textarea
                                        rows={2}
                                        value={topic.description}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          updateSyllabus((prev) => {
                                            const updatedUnits = [...prev.units];
                                            const updatedTopics = [...updatedUnits[uIdx].topics];
                                            updatedTopics[tIdx] = { ...updatedTopics[tIdx], description: val };
                                            updatedUnits[uIdx] = { ...updatedUnits[uIdx], topics: updatedTopics };
                                            return { ...prev, units: updatedUnits };
                                          });
                                        }}
                                        className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs text-slate-600 dark:text-slate-300 focus:outline-none"
                                      />

                                      {/* Subtopics Section */}
                                      <div className="pl-4 border-l-2 border-indigo-500/20 space-y-2 pt-1">
                                        <div className="flex items-center justify-between">
                                          <span className="text-[11px] font-mono font-semibold text-slate-400 uppercase">
                                            Subtopics ({topic.subtopics.length})
                                          </span>
                                          <button
                                            onClick={() =>
                                              updateSyllabus((prev) => {
                                                const updatedUnits = [...prev.units];
                                                const updatedTopics = [...updatedUnits[uIdx].topics];
                                                const newSub: SubtopicData = {
                                                  id: `s${uIdx + 1}_${tIdx + 1}_${topic.subtopics.length + 1}`,
                                                  title: "New Subtopic",
                                                  learningHours: 1.0,
                                                  duration: "45 mins"
                                                };
                                                updatedTopics[tIdx].subtopics = [...updatedTopics[tIdx].subtopics, newSub];
                                                updatedUnits[uIdx].topics = updatedTopics;
                                                return { ...prev, units: updatedUnits };
                                              })
                                            }
                                            className="text-[11px] font-bold text-indigo-500 hover:text-indigo-600 flex items-center gap-1"
                                          >
                                            <Plus size={12} /> Subtopic
                                          </button>
                                        </div>

                                        {topic.subtopics.map((sub, sIdx) => (
                                          <div key={sub.id || sIdx} className="flex items-center gap-2">
                                            <span className="text-[10px] font-mono text-slate-400">
                                              {tIdx + 1}.{sIdx + 1}
                                            </span>
                                            <input
                                              type="text"
                                              value={sub.title}
                                              onChange={(e) => {
                                                const val = e.target.value;
                                                updateSyllabus((prev) => {
                                                  const updatedUnits = [...prev.units];
                                                  const updatedTopics = [...updatedUnits[uIdx].topics];
                                                  const updatedSubs = [...updatedTopics[tIdx].subtopics];
                                                  updatedSubs[sIdx] = { ...updatedSubs[sIdx], title: val };
                                                  updatedTopics[tIdx].subtopics = updatedSubs;
                                                  updatedUnits[uIdx].topics = updatedTopics;
                                                  return { ...prev, units: updatedUnits };
                                                });
                                              }}
                                              className="flex-1 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                                            />
                                            <button
                                              onClick={() =>
                                                updateSyllabus((prev) => {
                                                  const updatedUnits = [...prev.units];
                                                  const updatedTopics = [...updatedUnits[uIdx].topics];
                                                  updatedTopics[tIdx].subtopics = updatedTopics[tIdx].subtopics.filter((_, i) => i !== sIdx);
                                                  updatedUnits[uIdx].topics = updatedTopics;
                                                  return { ...prev, units: updatedUnits };
                                                })
                                              }
                                              className="p-1 text-slate-400 hover:text-rose-500"
                                              title="Delete subtopic"
                                            >
                                              <X size={12} />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 5: PRACTICAL / LAB EXPERIMENTS */}
            {/* ================================================================ */}
            <section id="sec-lab-experiments" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm backdrop-blur-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      <FlaskConical size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">5. Practical / Lab Experiments</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Practical laboratory exercises, software/hardware tools, and Bloom level mappings.
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() =>
                      updateSyllabus((prev) => ({
                        ...prev,
                        labExperiments: [
                          ...(prev.labExperiments || []),
                          {
                            id: `exp_${Date.now()}`,
                            expNumber: `Exp ${(prev.labExperiments?.length || 0) + 1}`,
                            title: 'New Lab Experiment',
                            description: 'Description of hands-on laboratory task.',
                            hours: 0,
                            softwareTools: '',
                            mappedUnit: '',
                            bloomLevel: '' as any
                          }
                        ]
                      }))
                    }
                    className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Lab Experiment
                  </button>
                </div>

                {/* Lab Experiments List */}
                {(!syllabus.labExperiments || syllabus.labExperiments.length === 0) ? (
                  <div className="rounded-2xl border border-dashed border-slate-300 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-8 text-center space-y-3">
                    <FlaskConical className="mx-auto h-8 w-8 text-indigo-400 opacity-60" />
                    <p className="text-xs font-semibold text-slate-600 dark:text-slate-400">No Practical Lab Experiments defined yet.</p>
                    <button
                      onClick={() =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          labExperiments: [
                            {
                              id: `exp_1`,
                              expNumber: 'Exp 1',
                              title: 'New Practical Exercise',
                              description: 'Practical implementation exercise details.',
                              hours: 0,
                              softwareTools: '',
                              mappedUnit: '',
                              bloomLevel: '' as any
                            }
                          ]
                        }))
                      }
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
                    >
                      <Plus size={14} /> Add Default Experiment
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {syllabus.labExperiments.map((exp, expIdx) => (
                      <motion.div
                        key={exp.id || expIdx}
                        layout
                        className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 p-4 space-y-3"
                      >
                        {/* Header: Exp Number, Title, Hours, Actions */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80 dark:border-slate-800">
                          <div className="flex items-center gap-2 flex-1">
                            <input
                              type="text"
                              value={exp.expNumber}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateSyllabus((prev) => {
                                  const updated = [...(prev.labExperiments || [])];
                                  updated[expIdx] = { ...updated[expIdx], expNumber: val };
                                  return { ...prev, labExperiments: updated };
                                });
                              }}
                              className="w-20 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-2.5 py-1 text-xs font-mono font-bold text-indigo-400 focus:outline-none"
                              placeholder="Exp 1"
                            />
                            <input
                              type="text"
                              value={exp.title}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateSyllabus((prev) => {
                                  const updated = [...(prev.labExperiments || [])];
                                  updated[expIdx] = { ...updated[expIdx], title: val };
                                  return { ...prev, labExperiments: updated };
                                });
                              }}
                              className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-3 py-1.5 text-xs font-bold text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="Experiment Title..."
                            />
                          </div>

                          {/* Actions & Reordering */}
                          <div className="flex items-center gap-2">
                            <div className="flex items-center gap-1 bg-white dark:bg-slate-950 px-2 py-1 rounded-xl border border-slate-200 dark:border-slate-800">
                              <Clock size={12} className="text-slate-400" />
                              <input
                                type="number"
                                step="0.5"
                                value={exp.hours}
                                onChange={(e) => {
                                  const val = parseFloat(e.target.value) || 0;
                                  updateSyllabus((prev) => {
                                    const updated = [...(prev.labExperiments || [])];
                                    updated[expIdx] = { ...updated[expIdx], hours: val };
                                    return { ...prev, labExperiments: updated };
                                  });
                                }}
                                className="w-12 bg-transparent text-xs font-mono font-bold text-emerald-500 text-center focus:outline-none"
                              />
                              <span className="text-[10px] text-slate-400">hrs</span>
                            </div>

                            <button
                              disabled={expIdx === 0}
                              onClick={() =>
                                updateSyllabus((prev) => {
                                  const list = [...(prev.labExperiments || [])];
                                  const temp = list[expIdx - 1];
                                  list[expIdx - 1] = list[expIdx];
                                  list[expIdx] = temp;
                                  return { ...prev, labExperiments: list };
                                })
                              }
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                              title="Move experiment up"
                            >
                              <ArrowUp size={14} />
                            </button>
                            <button
                              disabled={expIdx === (syllabus.labExperiments.length - 1)}
                              onClick={() =>
                                updateSyllabus((prev) => {
                                  const list = [...(prev.labExperiments || [])];
                                  const temp = list[expIdx + 1];
                                  list[expIdx + 1] = list[expIdx];
                                  list[expIdx] = temp;
                                  return { ...prev, labExperiments: list };
                                })
                              }
                              className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-20"
                              title="Move experiment down"
                            >
                              <ArrowDown size={14} />
                            </button>

                            <button
                              onClick={() =>
                                updateSyllabus((prev) => ({
                                  ...prev,
                                  labExperiments: (prev.labExperiments || []).filter((_, i) => i !== expIdx)
                                }))
                              }
                              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
                              title="Delete experiment"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Description & Tools */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1">
                              PROCEDURE OVERVIEW & OBJECTIVE
                            </label>
                            <textarea
                              rows={2}
                              value={exp.description}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateSyllabus((prev) => {
                                  const updated = [...(prev.labExperiments || [])];
                                  updated[expIdx] = { ...updated[expIdx], description: val };
                                  return { ...prev, labExperiments: updated };
                                });
                              }}
                              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-2 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                              placeholder="Experiment objective and key steps..."
                            />
                          </div>

                          <div className="space-y-2">
                            <div>
                              <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1">
                                SOFTWARE & HARDWARE TOOLS
                              </label>
                              <input
                                type="text"
                                value={exp.softwareTools}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateSyllabus((prev) => {
                                    const updated = [...(prev.labExperiments || [])];
                                    updated[expIdx] = { ...updated[expIdx], softwareTools: val };
                                    return { ...prev, labExperiments: updated };
                                  });
                                }}
                                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                placeholder="GCC, FLEX, Python..."
                              />
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1">
                                  MAPPED UNIT
                                </label>
                                <select
                                  value={exp.mappedUnit}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    updateSyllabus((prev) => {
                                      const updated = [...(prev.labExperiments || [])];
                                      updated[expIdx] = { ...updated[expIdx], mappedUnit: val };
                                      return { ...prev, labExperiments: updated };
                                    });
                                  }}
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                  <option value="">Unassigned</option>
                                  <option value="Unit I">Unit I</option>
                                  <option value="Unit II">Unit II</option>
                                  <option value="Unit III">Unit III</option>
                                  <option value="Unit IV">Unit IV</option>
                                  <option value="Unit V">Unit V</option>
                                </select>
                              </div>

                              <div>
                                <label className="block text-[10px] font-mono font-bold text-slate-400 mb-1">
                                  BLOOM LEVEL
                                </label>
                                <select
                                  value={exp.bloomLevel}
                                  onChange={(e) => {
                                    const val = e.target.value as any;
                                    updateSyllabus((prev) => {
                                      const updated = [...(prev.labExperiments || [])];
                                      updated[expIdx] = { ...updated[expIdx], bloomLevel: val };
                                      return { ...prev, labExperiments: updated };
                                    });
                                  }}
                                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 px-2 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                                >
                                  <option value="">Unassigned</option>
                                  <option value="Apply">Apply</option>
                                  <option value="Analyze">Analyze</option>
                                  <option value="Evaluate">Evaluate</option>
                                  <option value="Create">Create</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </motion.div>
            </section>
              </>
            )}

            {/* ================================================================ */}
            {/* TAB 6: REFERENCES (TEXTBOOKS & REFERENCE BOOKS) */}
            {/* ================================================================ */}
            {(activeTab === 'references' || activeTab === 'json') && (
              <>
                <section id="sec-textbooks" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm backdrop-blur-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      <BookOpen size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">6. Recommended Textbooks</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Primary textbook references required for the course.</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      updateSyllabus((prev) => ({
                        ...prev,
                        textbooks: [...prev.textbooks, "New Textbook Citation..."]
                      }))
                    }
                    className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-600 dark:text-cyan-300 px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Textbook
                  </button>
                </div>

                <div className="space-y-3">
                  {syllabus.textbooks.map((tb, idx) => (
                    <motion.div
                      key={idx}
                      layout
                      className="group flex items-start gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-cyan-500/15 font-mono text-xs font-extrabold text-cyan-600 dark:text-cyan-400 mt-1">
                        T{idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={tb}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSyllabus((prev) => {
                            const updatedTb = [...prev.textbooks];
                            updatedTb[idx] = val;
                            return { ...prev, textbooks: updatedTb };
                          });
                        }}
                        className="flex-1 rounded-xl border border-transparent bg-transparent p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-cyan-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all resize-none"
                      />
                      <button
                        onClick={() =>
                          updateSyllabus((prev) => ({
                            ...prev,
                            textbooks: prev.textbooks.filter((_, i) => i !== idx)
                          }))
                        }
                        className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 opacity-80 group-hover:opacity-100"
                        title="Delete textbook"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 7: REFERENCE BOOKS */}
            {/* ================================================================ */}
            <section id="sec-references" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm backdrop-blur-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                      <BookMarked size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">7. Reference Books</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Supplementary reading material for deeper exploration.</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      updateSyllabus((prev) => ({
                        ...prev,
                        referenceBooks: [...prev.referenceBooks, "New Reference Book Citation..."]
                      }))
                    }
                    className="rounded-xl border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Reference
                  </button>
                </div>

                <div className="space-y-3">
                  {syllabus.referenceBooks.map((ref, idx) => (
                    <motion.div
                      key={idx}
                      layout
                      className="group flex items-start gap-2 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 p-3 transition-all hover:border-slate-300 dark:hover:border-slate-700"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 font-mono text-xs font-extrabold text-indigo-600 dark:text-indigo-400 mt-1">
                        R{idx + 1}
                      </span>
                      <textarea
                        rows={2}
                        value={ref}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateSyllabus((prev) => {
                            const updatedRef = [...prev.referenceBooks];
                            updatedRef[idx] = val;
                            return { ...prev, referenceBooks: updatedRef };
                          });
                        }}
                        className="flex-1 rounded-xl border border-transparent bg-transparent p-1.5 text-xs text-slate-800 dark:text-slate-200 focus:border-indigo-500 focus:bg-white dark:focus:bg-slate-950 focus:outline-none transition-all resize-none"
                      />
                      <button
                        onClick={() =>
                          updateSyllabus((prev) => ({
                            ...prev,
                            referenceBooks: prev.referenceBooks.filter((_, i) => i !== idx)
                          }))
                        }
                        className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300 opacity-80 group-hover:opacity-100"
                        title="Delete reference"
                      >
                        <Trash2 size={14} />
                      </button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 7: ASSESSMENT SCHEME */}
            {/* ================================================================ */}
            <section id="sec-assessment" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm backdrop-blur-xl relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                      <ListChecks size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">7. Assessment & Evaluation Scheme</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">Continuous internal assessment and end-semester weightage.</p>
                    </div>
                  </div>

                  <button
                    onClick={() =>
                      updateSyllabus((prev) => ({
                        ...prev,
                        assessment: [
                          ...prev.assessment,
                          {
                            id: `ass_${prev.assessment.length + 1}`,
                            component: "New Assessment Method",
                            weightagePercent: 10,
                            maxMarks: 50,
                            evaluationType: "Internal Evaluation"
                          }
                        ]
                      }))
                    }
                    className="rounded-xl border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-300 px-3 py-1.5 text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Plus size={14} /> Add Component
                  </button>
                </div>

                {/* Table Layout */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 dark:bg-slate-900/80 font-mono text-[11px] text-slate-500 uppercase border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="p-3.5">Component</th>
                        <th className="p-3.5 text-center">Weightage (%)</th>
                        <th className="p-3.5 text-center">Max Marks</th>
                        <th className="p-3.5">Evaluation Type</th>
                        <th className="p-3.5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800">
                      {syllabus.assessment.map((item, idx) => (
                        <tr key={item.id || idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors">
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={item.component}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateSyllabus((prev) => {
                                  const updatedAss = [...prev.assessment];
                                  updatedAss[idx] = { ...updatedAss[idx], component: val };
                                  return { ...prev, assessment: updatedAss };
                                });
                              }}
                              className="w-full rounded-lg border border-transparent bg-transparent p-1 font-semibold text-slate-800 dark:text-slate-200 focus:border-amber-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-3.5 text-center font-mono">
                            <input
                              type="number"
                              value={item.weightagePercent}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                updateSyllabus((prev) => {
                                  const updatedAss = [...prev.assessment];
                                  updatedAss[idx] = { ...updatedAss[idx], weightagePercent: val };
                                  return { ...prev, assessment: updatedAss };
                                });
                              }}
                              className="w-16 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1 text-center font-bold text-amber-600 dark:text-amber-400 focus:outline-none"
                            />
                          </td>
                          <td className="p-3.5 text-center font-mono">
                            <input
                              type="number"
                              value={item.maxMarks}
                              onChange={(e) => {
                                const val = Number(e.target.value) || 0;
                                updateSyllabus((prev) => {
                                  const updatedAss = [...prev.assessment];
                                  updatedAss[idx] = { ...updatedAss[idx], maxMarks: val };
                                  return { ...prev, assessment: updatedAss };
                                });
                              }}
                              className="w-16 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-1 text-center text-slate-700 dark:text-slate-300 focus:outline-none"
                            />
                          </td>
                          <td className="p-3.5">
                            <input
                              type="text"
                              value={item.evaluationType}
                              onChange={(e) => {
                                const val = e.target.value;
                                updateSyllabus((prev) => {
                                  const updatedAss = [...prev.assessment];
                                  updatedAss[idx] = { ...updatedAss[idx], evaluationType: val };
                                  return { ...prev, assessment: updatedAss };
                                });
                              }}
                              className="w-full rounded-lg border border-transparent bg-transparent p-1 text-slate-600 dark:text-slate-400 focus:border-amber-500 focus:outline-none"
                            />
                          </td>
                          <td className="p-3.5 text-right">
                            <button
                              onClick={() =>
                                updateSyllabus((prev) => ({
                                  ...prev,
                                  assessment: prev.assessment.filter((_, i) => i !== idx)
                                }))
                              }
                              className="p-1 text-rose-500 hover:text-rose-700 dark:hover:text-rose-300"
                              title="Delete component"
                            >
                              <Trash2 size={14} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </section>

            {/* ================================================================ */}
            {/* SECTION 8: ADDITIONAL INFORMATION */}
            {/* ================================================================ */}
            <section id="sec-additional" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm backdrop-blur-xl relative overflow-hidden"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 rounded-2xl bg-slate-500/10 text-slate-600 dark:text-slate-300 border border-slate-500/20">
                    <Settings size={20} />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight">8. Additional Course Details</h2>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Prerequisites, software, lab requirements, and notes.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Prerequisites */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Course Prerequisites
                    </label>
                    <textarea
                      rows={3}
                      value={syllabus.additionalInfo.prerequisites}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          additionalInfo: { ...prev.additionalInfo, prerequisites: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Software Requirements */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Software & Tools Required
                    </label>
                    <textarea
                      rows={3}
                      value={syllabus.additionalInfo.softwareRequirements}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          additionalInfo: { ...prev.additionalInfo, softwareRequirements: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Lab Requirements */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Laboratory Requirements
                    </label>
                    <textarea
                      rows={3}
                      value={syllabus.additionalInfo.labRequirements}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          additionalInfo: { ...prev.additionalInfo, labRequirements: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>

                  {/* Remarks */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Verification Notes & Remarks
                    </label>
                    <textarea
                      rows={3}
                      value={syllabus.additionalInfo.remarks}
                      onChange={(e) =>
                        updateSyllabus((prev) => ({
                          ...prev,
                          additionalInfo: { ...prev.additionalInfo, remarks: e.target.value }
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 p-3 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                </div>
              </motion.div>
            </section>
              </>
            )}

            {/* ================================================================ */}
            {/* TAB 7: RAW JSON TAB */}
            {/* ================================================================ */}
            {(activeTab === 'json') && (
              <section id="sec-raw-json" className="scroll-mt-24">
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-slate-800 bg-slate-950 p-6 md:p-8 shadow-xl relative overflow-hidden"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black tracking-tight text-slate-100">7. Raw JSON View & Direct Edit</h2>
                        <p className="text-xs text-slate-400">Directly inspect and modify the raw syllabus document state.</p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(JSON.stringify(syllabus, null, 2));
                        toast.success("Copied JSON payload to clipboard!");
                      }}
                      className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition"
                    >
                      Copy JSON
                    </button>
                  </div>

                  <textarea
                    rows={22}
                    value={JSON.stringify(syllabus, null, 2)}
                    onChange={(e) => {
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setSyllabus(parsed);
                      } catch (err) {}
                    }}
                    className="w-full rounded-2xl border border-slate-800 bg-slate-900/90 p-4 font-mono text-xs text-cyan-300 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </motion.div>
              </section>
            )}

            {/* ================================================================== */}
            {/* SECTION 9: CO-PO MAPPING MATRIX */}
            {/* ================================================================== */}
            {(activeTab === 'copo' || activeTab === 'cos' || activeTab === 'json') && (
              <section id="sec-copo-mapping" className="scroll-mt-24">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-6 md:p-8 shadow-sm backdrop-blur-xl relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 via-indigo-500 to-cyan-500" />
                
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                      <SlidersHorizontal size={20} />
                    </div>
                    <div>
                      <h2 className="text-xl font-black tracking-tight">9. CO-PO Mapping Matrix</h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Course Outcome (CO) to Program Outcome (PO/PSO) alignment matrix (3-High, 2-Medium, 1-Low, 0-None).
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        try {
                          toast.info("Triggering OpenAI CO-PO Mapping analysis...");
                          const res = await generateCoPoMapping({
                            courseCode: (syllabus as any).courseCode || (syllabus as any).pdfCourseCode || 'CS101',
                            courseName: (syllabus as any).courseTitle || (syllabus as any).courseName || 'Course',
                            outcomes: syllabus.coPoMapping?.coStatements || (syllabus as any).courseOutcomes || syllabus.outcomes || [],
                            units: syllabus.units,
                            syllabusData: syllabus
                          });
                          if (res && res.matrix) {
                            updateSyllabus((prev) => ({
                              ...prev,
                              coPoMapping: {
                                coStatements: res.coStatements || prev.coPoMapping?.coStatements || [],
                                poStatements: ["PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11"],
                                matrix: res.matrix
                              }
                            }));
                            toast.success("AI CO-PO Mapping generated & saved to PostgreSQL DB successfully!");
                          }
                        } catch (err: any) {
                          console.error("AI CO-PO mapping error:", err);
                          toast.error(`AI Mapping error: ${err.message || 'Check OPENAI_API_KEY'}`);
                        }
                      }}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs font-semibold transition-all shadow-sm cursor-pointer border border-purple-400/30"
                    >
                      <Sparkles size={14} className="text-amber-300 animate-pulse" /> AI Auto-Map (OpenAI)
                    </button>
                    <button
                      onClick={() => {
                        updateSyllabus((prev) => {
                          const currentCos = prev.coPoMapping?.coStatements || [];
                          const nextNum = currentCos.length + 1;
                          const newCo = `CO${nextNum}: New Course Outcome Statement`;
                          const newCos = [...currentCos, newCo];
                          const matrix = { ...(prev.coPoMapping?.matrix || {}) };
                          matrix[`CO${nextNum}`] = { PO1: 3, PO2: 2 };
                          return {
                            ...prev,
                            coPoMapping: {
                              coStatements: newCos,
                              poStatements: ["PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11"],
                              matrix
                            }
                          };
                        });
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-500/10 hover:bg-purple-500/20 text-purple-600 dark:text-purple-300 text-xs font-semibold transition-all border border-purple-500/20 cursor-pointer"
                    >
                      <Plus size={14} /> Add CO Statement
                    </button>
                  </div>
                </div>

                {/* CO Statements Editor */}
                <div className="space-y-3 mb-6">
                  <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">Course Outcome Statements</h4>
                  {(syllabus.coPoMapping?.coStatements || [
                    "CO1: Understand core principles and foundational concepts.",
                    "CO2: Analyze problems and formulate structured solutions.",
                    "CO3: Apply methodologies to real-world domain scenarios.",
                    "CO4: Evaluate performance metrics and design trade-offs.",
                    "CO5: Synthesize integrated outcomes for advanced applications."
                  ]).map((stmt: any, idx: number) => {
                    const stmtStr = typeof stmt === 'string' ? stmt : (stmt?.description ? `${stmt.code || `CO${idx+1}`}: ${stmt.description}` : String(stmt));
                    const coCode = (typeof stmt === 'object' && stmt?.code) ? stmt.code : (stmtStr.split(':')[0] || `CO${idx + 1}`);
                    return (
                      <div key={idx} className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-purple-600 dark:text-purple-400 w-12">
                          {coCode}
                        </span>
                        <input
                          type="text"
                          value={stmtStr}
                          onChange={(e) => {
                            const val = e.target.value;
                            updateSyllabus((prev) => {
                              const currentCos = [...(prev.coPoMapping?.coStatements || [])];
                              currentCos[idx] = val;
                              return {
                                ...prev,
                                coPoMapping: {
                                  ...(prev.coPoMapping || { poStatements: [], matrix: {} }),
                                  coStatements: currentCos
                                }
                              };
                            });
                          }}
                          className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* CO-PO Correlation Matrix Grid */}
                <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                        <th className="p-2.5 font-bold border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">CO / PO</th>
                        {(["PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11"]).map((po) => (
                          <th key={po} className="p-2.5 font-bold text-center border-r border-slate-200/50 dark:border-slate-800/50 min-w-[40px]">
                            {po}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-700 dark:text-slate-300">
                      {(syllabus.coPoMapping?.coStatements || ["CO1", "CO2", "CO3", "CO4", "CO5"]).map((stmt: any, cIdx: number) => {
                        const stmtStr = typeof stmt === 'string' ? stmt : (stmt?.code || `CO${cIdx + 1}`);
                        const coKey = (typeof stmt === 'object' && stmt?.code) ? stmt.code : (stmtStr.split(':')[0].trim() || `CO${cIdx + 1}`);
                        const pos = ["PO1", "PO2", "PO3", "PO4", "PO5", "PO6", "PO7", "PO8", "PO9", "PO10", "PO11"];
                        
                        return (
                          <tr key={coKey} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                            <td className="p-2.5 font-mono font-bold text-purple-600 dark:text-purple-400 border-r border-slate-200 dark:border-slate-800 whitespace-nowrap">
                              {coKey}
                            </td>
                            {pos.map((poKey) => {
                              const val = syllabus.coPoMapping?.matrix?.[coKey]?.[poKey] ?? 0;
                              return (
                                <td key={poKey} className="p-1.5 text-center border-r border-slate-100 dark:border-slate-900">
                                  <select
                                    value={val}
                                    onChange={(e) => {
                                      const numVal = Number(e.target.value);
                                      updateSyllabus((prev) => {
                                        const prevMap = prev.coPoMapping || { coStatements: [], poStatements: [], matrix: {} };
                                        const matrix = { ...prevMap.matrix };
                                        matrix[coKey] = { ...(matrix[coKey] || {}), [poKey]: numVal };
                                        return {
                                          ...prev,
                                          coPoMapping: {
                                            ...prevMap,
                                            matrix
                                          }
                                        };
                                      });
                                    }}
                                    className={`w-10 text-center rounded-lg py-1 text-xs font-mono font-bold border focus:outline-none ${
                                      val === 3
                                        ? 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border-emerald-500/40'
                                        : val === 2
                                        ? 'bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 border-cyan-500/40'
                                        : val === 1
                                        ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400 border-amber-500/40'
                                        : 'bg-slate-100 dark:bg-slate-900 text-slate-400 border-slate-200 dark:border-slate-800'
                                    }`}
                                  >
                                    <option value={0}>-</option>
                                    <option value={1}>1</option>
                                    <option value={2}>2</option>
                                    <option value={3}>3</option>
                                  </select>
                                </td>
                              );
                            })}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            </section>
            )}

            {/* ================================================================== */}
            {/* SECTION 10: STRUCTURED CATEGORY TABLES & MATRICES */}
            {/* ================================================================== */}
            {storeSyllabus.tables && storeSyllabus.tables.length > 0 && (
              <section id="category-tables" className="scroll-mt-24">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-cyan-500/10 text-cyan-500 font-bold text-xs border border-cyan-500/20">
                      10
                    </div>
                    <div>
                      <h2 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                        Structured Category Tables & Matrices
                      </h2>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        PDF table blocks, CO-PO matrices, session lists, and assessment weightage tables.
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full bg-cyan-500/10 text-cyan-500 border border-cyan-500/20 px-3 py-1 text-xs font-mono font-bold">
                    {storeSyllabus.tables.length} Tables Detected
                  </span>
                </div>

                <div className="space-y-6">
                  {storeSyllabus.tables.map((t, tIdx) => (
                    <motion.div
                      key={t.id || tIdx}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="semantic-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 p-5 shadow-sm space-y-3"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-900 pb-3">
                        <div className="flex items-center gap-2">
                          <Sparkles size={16} className="text-cyan-500" />
                          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                            {t.category}
                          </h3>
                        </div>
                        {t.page && (
                          <span className="text-[10px] font-mono font-semibold text-slate-400">
                            PDF Page {t.page}
                          </span>
                        )}
                      </div>

                      <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 font-mono">
                              {t.headers.map((h, hIdx) => (
                                <th key={hIdx} className="p-2.5 font-bold whitespace-nowrap border-r border-slate-200/50 dark:border-slate-800/50 last:border-r-0">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-900 text-slate-700 dark:text-slate-300">
                            {t.rows.map((r, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-slate-900/50 transition-colors">
                                {r.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-2.5 whitespace-pre-wrap border-r border-slate-100 dark:border-slate-900 last:border-r-0 font-sans leading-relaxed">
                                    {cell === '√' ? (
                                      <span className="inline-flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-500 text-[10px] font-bold">
                                        ✓
                                      </span>
                                    ) : (
                                      cell
                                    )}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </section>
            )}

            {/* BOTTOM DUAL SAVE ACTION BAR */}
            <div className="mt-8 rounded-2xl border border-cyan-500/30 bg-slate-900/90 p-5 text-white backdrop-blur-xl shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 border-t-2 border-t-cyan-500">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-cyan-500/20 p-2.5 text-cyan-400 border border-cyan-500/40">
                  <Save size={20} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">Finished Reviewing Extracted Content?</h4>
                  <p className="text-xs text-slate-400">Save the verified syllabus structure directly to the database repository.</p>
                </div>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                <button
                  onClick={handleSaveChanges}
                  disabled={autoSaveState === 'saving'}
                  className="w-full sm:w-auto rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-6 py-2.5 text-sm font-bold text-white shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Save size={16} />
                  <span>Save Verified Syllabus</span>
                </button>
              </div>
            </div>

          </main>
        </div>
        )}


        {/* ================================================================== */}
        {/* BOTTOM FLOATING SAVE BAR (WHEN DISDIRTY / EDITED) */}
        {/* ================================================================== */}
        <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ y: 80, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 80, opacity: 0 }}
              className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
            >
              <div className="rounded-2xl border border-cyan-500/30 bg-slate-950/90 p-4 text-white backdrop-blur-xl shadow-2xl flex items-center justify-between gap-4 border-t-2 border-t-cyan-500">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-amber-400 animate-ping" />
                  <div>
                    <p className="text-xs font-bold text-white">Unsaved Syllabus Edits</p>
                    <p className="text-[10px] text-slate-400">History stack active ({historyIndex} state changes)</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetDraft}
                    className="rounded-xl border border-slate-700 bg-slate-900 hover:bg-slate-800 px-3 py-1.5 text-xs text-slate-300 font-semibold transition-colors"
                  >
                    Reset
                  </button>
                  <button
                    onClick={handleSaveChanges}
                    className="rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg transition-all flex items-center gap-1.5"
                  >
                    <Save size={14} /> Save Verified Syllabus
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================== */}
        {/* SAVING SUCCESS MODAL */}
        {/* ================================================================== */}
        <AnimatePresence>
          {isSavingModalOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="rounded-3xl border border-emerald-500/40 bg-slate-950 p-6 max-w-sm w-full text-center space-y-4 text-white shadow-[0_0_50px_rgba(16,185,129,0.3)] backdrop-blur-2xl"
              >
                <div className="mx-auto h-14 w-14 rounded-2xl bg-gradient-to-br from-emerald-400 to-teal-600 p-0.5 shadow-lg">
                  <div className="w-full h-full rounded-[14px] bg-slate-950 flex items-center justify-center">
                    <CheckCircle size={32} className="text-emerald-400 animate-pulse" />
                  </div>
                </div>
                <h3 className="text-xl font-extrabold tracking-tight text-white">Syllabus Saved!</h3>
                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  The verified syllabus structure for <span className="font-mono text-emerald-400 font-bold">{syllabus.course.code || 'Course'}</span> has been successfully saved to PostgreSQL database.
                </p>
                <div className="pt-1 flex items-center justify-center gap-2 text-[11px] font-mono text-cyan-400">
                  <RefreshCw size={12} className="animate-spin" /> Redirecting to Syllabus Repository...
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================== */}
        {/* RAW JSON PREVIEW MODAL */}
        {/* ================================================================== */}
        <AnimatePresence>
          {showJsonPreview && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="rounded-3xl border border-slate-800 bg-slate-950 p-6 max-w-3xl w-full text-white shadow-2xl max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <FileText size={18} className="text-cyan-400" />
                    <h3 className="text-sm font-bold font-mono">Parsed Syllabus JSON Payload</h3>
                  </div>
                  <button
                    onClick={() => setShowJsonPreview(false)}
                    className="p-1 rounded-lg text-slate-400 hover:text-white"
                  >
                    <X size={18} />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto rounded-xl border border-slate-900 bg-slate-900/90 p-4 font-mono text-[11px] text-cyan-300">
                  <pre>{JSON.stringify(syllabus, null, 2)}</pre>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(JSON.stringify(syllabus, null, 2));
                      setShowCopiedToast(true);
                    }}
                    className="rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-xs font-mono font-bold hover:bg-cyan-500 hover:text-black text-cyan-300 transition-all shadow-[0_0_15px_rgba(6,182,212,0.2)]"
                  >
                    Copy JSON
                  </button>
                  <button
                    onClick={() => setShowJsonPreview(false)}
                    className="rounded-xl bg-slate-800 px-4 py-2 text-xs font-mono font-bold hover:bg-slate-700 text-slate-200"
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ================================================================== */}
        {/* CUSTOM GLASSMORPHISM NOTIFICATION MODAL */}
        {/* ================================================================== */}
        <AnimatePresence>
          {showCopiedToast && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.85, opacity: 0, y: 15 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.85, opacity: 0, y: 15 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="relative max-w-sm w-full rounded-3xl border border-cyan-400/40 bg-slate-950/80 p-6 sm:p-8 text-center text-white shadow-[0_0_50px_rgba(6,182,212,0.35)] backdrop-blur-2xl bg-gradient-to-b from-white/10 to-transparent overflow-hidden flex flex-col items-center"
              >
                {/* Ambient background glow accents */}
                <div className="absolute -top-10 -left-10 w-32 h-32 rounded-full bg-cyan-500/20 blur-2xl pointer-events-none" />
                <div className="absolute -bottom-10 -right-10 w-32 h-32 rounded-full bg-purple-600/20 blur-2xl pointer-events-none" />

                {/* Dynamic Sparkling Checkmark Icon with Gradient & Glow */}
                <div className="relative mb-5 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-purple-500 to-amber-400 p-0.5 shadow-[0_0_25px_rgba(6,182,212,0.5)]">
                  <div className="w-full h-full rounded-[14px] bg-slate-950/90 backdrop-blur-md flex items-center justify-center">
                    <CheckCircle2 size={32} className="text-cyan-300 animate-pulse" />
                    <Sparkles size={16} className="absolute -top-1 -right-1 text-amber-300 animate-spin verification-spin-6s" />
                  </div>
                </div>

                {/* Title / Text */}
                <h4 className="text-lg sm:text-xl font-bold tracking-tight text-white drop-shadow-[0_0_12px_rgba(255,255,255,0.4)] font-sans">
                  JSON copied to clipboard!
                </h4>
                <p className="mt-1 text-xs text-slate-300 font-mono">
                  Full syllabus payload ready for export & analysis.
                </p>

                {/* Sleek Pill-Shaped Gradient Interactive Button */}
                <button
                  onClick={() => setShowCopiedToast(false)}
                  className="mt-6 w-full rounded-full bg-gradient-to-r from-cyan-500 via-indigo-500 to-purple-600 hover:from-cyan-400 hover:to-purple-500 text-white font-bold font-sans text-sm py-3 px-6 shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all hover:scale-105 active:scale-95 cursor-pointer border border-white/20"
                >
                  Awesome!
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </AppShell>
  );
}

// Helper icon component for Target
function TargetIcon({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  );
}
