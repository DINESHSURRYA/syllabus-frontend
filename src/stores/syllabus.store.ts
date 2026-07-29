import { create } from 'zustand';
import { SyllabusData, UnitItem, TopicItem, PendingExtractionFile, ExtractionProgressState } from '@/types/syllabus';

export type { SyllabusData, UnitItem, TopicItem, PendingExtractionFile, ExtractionProgressState };

export interface SyllabusStoreState {
  extractedText: string;
  fileName: string;
  jobId: string | null;
  processingStatus: 'idle' | 'connecting' | 'processing' | 'error' | 'timeout' | 'completed';
  statusMessageIndex: number;
  errorMessage: string;
  retryCount: number;
  syllabus: SyllabusData;
  isBackgroundProcessing: boolean;
  activeNotification: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'error';
    jobId?: string;
    completedAt?: string;
  } | null;

  pendingExtraction: PendingExtractionFile | null;
  extractionState: ExtractionProgressState;

  setPendingExtraction: (pending: PendingExtractionFile | null) => void;
  setExtractionProgress: (progress: Partial<ExtractionProgressState>) => void;
  clearPendingExtraction: () => void;

  setJobId: (jobId: string | null) => void;
  setBackgroundProcessing: (isProcessing: boolean) => void;
  setActiveNotification: (notif: SyllabusStoreState['activeNotification']) => void;
  clearNotification: () => void;

  setExtractedText: (text: string, fileName?: string) => void;
  setProcessingStatus: (status: SyllabusStoreState['processingStatus'], error?: string) => void;
  setStatusMessageIndex: (idx: number) => void;
  incrementRetryCount: () => void;
  resetRetryCount: () => void;
  setSyllabus: (data: SyllabusData) => void;

  // Verification Screen Edit Actions
  updateCourseDetails: (fields: Partial<SyllabusData['course']>) => void;
  addObjective: (objective: string) => void;
  deleteObjective: (index: number) => void;
  updateObjective: (index: number, value: string) => void;

  addOutcome: (outcome: string) => void;
  deleteOutcome: (index: number) => void;
  updateOutcome: (index: number, value: string) => void;

  addUnit: (unit: UnitItem) => void;
  updateUnit: (unitIndex: number, unit: Partial<UnitItem>) => void;
  deleteUnit: (unitIndex: number) => void;
  reorderUnits: (startIndex: number, endIndex: number) => void;

  addTopic: (unitIndex: number, topic: TopicItem) => void;
  updateTopic: (unitIndex: number, topicIndex: number, topic: Partial<TopicItem>) => void;
  deleteTopic: (unitIndex: number, topicIndex: number) => void;

  addTextbook: (book: string) => void;
  deleteTextbook: (index: number) => void;
  updateTextbook: (index: number, value: string) => void;

  addReferenceBook: (book: string) => void;
  deleteReferenceBook: (index: number) => void;
  updateReferenceBook: (index: number, value: string) => void;
}

export const emptySyllabus: SyllabusData = {
  course: {
    code: '',
    title: '',
    programme: '',
    department: '',
    semester: '',
    credits: '',
    hours: {
      lecture: '',
      tutorial: '',
      practical: '',
      total: '',
    },
    prerequisites: '',
    objectives: [],
    outcomes: [],
  },
  units: [],
  textbooks: [],
  reference_books: [],
  assessment: {},
  additional_information: {},
};

export function normalizeSyllabusToStoreData(raw: any): SyllabusData {
  if (!raw) return emptySyllabus;

  const courseObj = raw.course && typeof raw.course === 'object' ? raw.course : {};

  const code = raw.courseCode || courseObj.code || raw.code || 'COURSE';
  const title = raw.courseName || raw.courseTitle || courseObj.title || courseObj.name || raw.title || 'Course';
  const department = raw.department || courseObj.department || 'Engineering & Technology';
  const semester = raw.semester || courseObj.semester || 'Semester V';
  const credits = String(raw.credits || courseObj.credits || 4);
  const programme = raw.programme || courseObj.programme || 'B.Tech';

  const hoursObj = courseObj.hours || {};
  const lecture = String(courseObj.lectureHours || hoursObj.lecture || 3);
  const tutorial = String(courseObj.tutorialHours || hoursObj.tutorial || 0);
  const practical = String(courseObj.practicalHours || hoursObj.practical || 0);
  const total = String(raw.totalHours || raw.hours || courseObj.totalHours || hoursObj.total || 45);

  const rawUnits = Array.isArray(raw.units) ? raw.units : [];
  const units: UnitItem[] = rawUnits.map((u: any, uIdx: number) => {
    const unitNumber = u.unit_number || u.unitNumber || u.unitId || uIdx + 1;
    const unitTitle = u.title || u.unitName || `Unit ${unitNumber}`;
    const unitHours = String(
      u.learningHours !== undefined && u.learningHours !== null && u.learningHours !== ''
        ? u.learningHours
        : u.hours !== undefined && u.hours !== null && u.hours !== ''
        ? u.hours
        : 9
    );
    const rawTopics = Array.isArray(u.topics) ? u.topics : [];

    const topics: TopicItem[] = rawTopics.map((t: any) => {
      const topicName = typeof t === 'string' ? t : t.name || t.title || 'Topic';
      const rawSubs = typeof t === 'object' && Array.isArray(t.subtopics) ? t.subtopics : [];
      const subtopics: string[] = rawSubs.map((s: any) => {
        if (typeof s === 'string') return s;
        return s.title || s.name || s.subtopicName || String(s);
      });

      return {
        name: topicName,
        subtopics,
        level: typeof t === 'object' ? t.level || 'Concept' : undefined,
        type: typeof t === 'object' ? t.type || 'Theory' : undefined,
        hierarchyReason:
          typeof t === 'object' ? t.hierarchyReason || t.hourAllocationReason || t.description : undefined,
      };
    });

    return {
      unit_number: Number(unitNumber) || uIdx + 1,
      title: unitTitle,
      hours: unitHours,
      hierarchyReason: u.hierarchyReason || u.description,
      topics,
    };
  });

  const labExps = raw.labExperiments || raw.experiments || raw.lab_experiments || [];

  return {
    id: raw.id || raw.syllabusId || raw.courseId || code,
    course: {
      code,
      title,
      programme,
      department,
      semester,
      credits,
      hours: { lecture, tutorial, practical, total },
      prerequisites: raw.prerequisites || courseObj.prerequisites || '',
      objectives: Array.isArray(raw.objectives)
        ? raw.objectives
        : Array.isArray(courseObj.objectives)
        ? courseObj.objectives
        : [],
      outcomes: Array.isArray(raw.outcomes)
        ? raw.outcomes
        : Array.isArray(courseObj.outcomes)
        ? courseObj.outcomes
        : [],
    },
    units,
    labExperiments: Array.isArray(labExps) ? labExps : [],
    experiments: Array.isArray(labExps) ? labExps : [],
    textbooks: Array.isArray(raw.textbooks) ? raw.textbooks : raw.references || [],
    reference_books: Array.isArray(raw.reference_books)
      ? raw.reference_books
      : Array.isArray(raw.references)
      ? raw.references
      : [],
    assessment: raw.assessment || {},
    additional_information: raw.additional_information || raw.additionalInfo || {},
    tables: raw.tables || [],
  };
}

export const useSyllabusStore = create<SyllabusStoreState>((set) => ({
  extractedText: '',
  fileName: '',
  jobId: null,
  processingStatus: 'idle',
  statusMessageIndex: 0,
  errorMessage: '',
  retryCount: 0,
  syllabus: emptySyllabus,
  isBackgroundProcessing: false,
  activeNotification: null,

  pendingExtraction: null,
  extractionState: {
    isExtracting: false,
    step: 0,
    progress: 0,
    statusText: '',
    error: null,
  },

  setPendingExtraction: (pending) => set({ pendingExtraction: pending }),
  setExtractionProgress: (progress) =>
    set((state) => ({
      extractionState: {
        ...state.extractionState,
        ...(progress.isExtracting === false && progress.step === undefined
          ? { isExtracting: false, step: 0, progress: 0, statusText: '' }
          : {}),
        ...progress,
      },
    })),
  clearPendingExtraction: () =>
    set({
      pendingExtraction: null,
    }),

  setJobId: (jobId) => set({ jobId }),
  setBackgroundProcessing: (isProcessing) => set({ isBackgroundProcessing: isProcessing }),
  setActiveNotification: (notif) => set({ activeNotification: notif }),
  clearNotification: () => set({ activeNotification: null }),

  setExtractedText: (text, fileName = '') => set({ extractedText: text, fileName }),
  setProcessingStatus: (status, error = '') => set({ processingStatus: status, errorMessage: error }),
  setStatusMessageIndex: (idx) => set({ statusMessageIndex: idx }),
  incrementRetryCount: () => set((state) => ({ retryCount: state.retryCount + 1 })),
  resetRetryCount: () => set({ retryCount: 0 }),
  setSyllabus: (data) => set({ syllabus: data }),

  updateCourseDetails: (fields) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        course: { ...state.syllabus.course, ...fields },
      },
    })),

  addObjective: (objective) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        course: {
          ...state.syllabus.course,
          objectives: [...state.syllabus.course.objectives, objective],
        },
      },
    })),

  deleteObjective: (index) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        course: {
          ...state.syllabus.course,
          objectives: state.syllabus.course.objectives.filter((_, i) => i !== index),
        },
      },
    })),

  updateObjective: (index, value) =>
    set((state) => {
      const updated = [...state.syllabus.course.objectives];
      updated[index] = value;
      return {
        syllabus: {
          ...state.syllabus,
          course: { ...state.syllabus.course, objectives: updated },
        },
      };
    }),

  addOutcome: (outcome) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        course: {
          ...state.syllabus.course,
          outcomes: [...state.syllabus.course.outcomes, outcome],
        },
      },
    })),

  deleteOutcome: (index) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        course: {
          ...state.syllabus.course,
          outcomes: state.syllabus.course.outcomes.filter((_, i) => i !== index),
        },
      },
    })),

  updateOutcome: (index, value) =>
    set((state) => {
      const updated = [...state.syllabus.course.outcomes];
      updated[index] = value;
      return {
        syllabus: {
          ...state.syllabus,
          course: { ...state.syllabus.course, outcomes: updated },
        },
      };
    }),

  addUnit: (unit) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        units: [...state.syllabus.units, unit],
      },
    })),

  updateUnit: (unitIndex, unitData) =>
    set((state) => {
      const updated = [...state.syllabus.units];
      updated[unitIndex] = { ...updated[unitIndex], ...unitData };
      return {
        syllabus: { ...state.syllabus, units: updated },
      };
    }),

  deleteUnit: (unitIndex) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        units: state.syllabus.units.filter((_, i) => i !== unitIndex),
      },
    })),

  reorderUnits: (startIndex, endIndex) =>
    set((state) => {
      const result = Array.from(state.syllabus.units);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return {
        syllabus: { ...state.syllabus, units: result },
      };
    }),

  addTopic: (unitIndex, topic) =>
    set((state) => {
      const updatedUnits = [...state.syllabus.units];
      if (updatedUnits[unitIndex]) {
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          topics: [...updatedUnits[unitIndex].topics, topic],
        };
      }
      return { syllabus: { ...state.syllabus, units: updatedUnits } };
    }),

  updateTopic: (unitIndex, topicIndex, topicData) =>
    set((state) => {
      const updatedUnits = [...state.syllabus.units];
      if (updatedUnits[unitIndex] && updatedUnits[unitIndex].topics[topicIndex]) {
        const updatedTopics = [...updatedUnits[unitIndex].topics];
        updatedTopics[topicIndex] = { ...updatedTopics[topicIndex], ...topicData };
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          topics: updatedTopics,
        };
      }
      return { syllabus: { ...state.syllabus, units: updatedUnits } };
    }),

  deleteTopic: (unitIndex, topicIndex) =>
    set((state) => {
      const updatedUnits = [...state.syllabus.units];
      if (updatedUnits[unitIndex]) {
        updatedUnits[unitIndex] = {
          ...updatedUnits[unitIndex],
          topics: updatedUnits[unitIndex].topics.filter((_, i) => i !== topicIndex),
        };
      }
      return { syllabus: { ...state.syllabus, units: updatedUnits } };
    }),

  addTextbook: (book) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        textbooks: [...state.syllabus.textbooks, book],
      },
    })),

  deleteTextbook: (index) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        textbooks: state.syllabus.textbooks.filter((_, i) => i !== index),
      },
    })),

  updateTextbook: (index, value) =>
    set((state) => {
      const updated = [...state.syllabus.textbooks];
      updated[index] = value;
      return { syllabus: { ...state.syllabus, textbooks: updated } };
    }),

  addReferenceBook: (book) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        reference_books: [...state.syllabus.reference_books, book],
      },
    })),

  deleteReferenceBook: (index) =>
    set((state) => ({
      syllabus: {
        ...state.syllabus,
        reference_books: state.syllabus.reference_books.filter((_, i) => i !== index),
      },
    })),

  updateReferenceBook: (index, value) =>
    set((state) => {
      const updated = [...state.syllabus.reference_books];
      updated[index] = value;
      return { syllabus: { ...state.syllabus, reference_books: updated } };
    }),
}));
