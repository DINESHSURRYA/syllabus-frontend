import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  BloomLevel,
  MCQOption,
  MCQQuestion,
  QuestionSet,
  AccessControlConfig,
  ProctoringConfig,
  Assessment,
  ExamAttempt,
} from '@/types/mcq';

export const BLOOM_LEVEL_DESCRIPTIONS: Record<
  BloomLevel,
  { name: string; desc: string; color: string; bg: string; border: string }
> = {
  K1: { name: 'K1 - Remember', desc: 'Recall facts & basic concepts', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  K2: { name: 'K2 - Understand', desc: 'Explain ideas or concepts', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  K3: { name: 'K3 - Apply', desc: 'Use information in new situations', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  K4: { name: 'K4 - Analyze', desc: 'Draw connections among ideas', color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  K5: { name: 'K5 - Evaluate', desc: 'Justify a stand or decision', color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  K6: { name: 'K6 - Create', desc: 'Produce new or original work', color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
};

export interface GenerationLog {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  bloomMatrix: Record<BloomLevel, number>;
  timestamp: string;
  status: 'completed' | 'failed';
  generatedSetId?: string;
}

interface MCQStoreState {
  questionSets: QuestionSet[];
  assessments: Assessment[];
  attempts: ExamAttempt[];
  generationLogs: GenerationLog[];
  selectedQuestionsForBuilder: MCQQuestion[];

  activeGenerating: boolean;
  activeGeneratingProgress: number;

  activeExamAttempt: ExamAttempt | null;

  saveQuestionSet: (set: QuestionSet) => void;
  addQuestionSet: (set: QuestionSet) => void;
  duplicateQuestionSet: (id: string) => void;
  deleteQuestionSet: (id: string) => void;

  setSelectedQuestionsForBuilder: (questions: MCQQuestion[]) => void;

  saveAssessment: (assessment: Assessment) => void;
  addAssessment: (assessment: Assessment) => void;
  updateAssessment: (assessment: Assessment) => void;
  deleteAssessment: (id: string) => void;
  updateAssessmentStatus: (id: string, status: Assessment['status']) => void;

  startExamAttempt: (assessmentId: string, candidateName: string, candidateEmail: string) => ExamAttempt;
  updateExamAnswer: (attemptId: string, questionId: string, selectedOptionIndex: number) => void;
  toggleMarkForReview: (attemptId: string, questionId: string) => void;
  incrementTabSwitchCount: (attemptId: string) => void;
  submitExamAttempt: (attemptId: string) => ExamAttempt | null;
  recordAttempt: (attempt: ExamAttempt) => void;

  addGenerationLog: (log: GenerationLog) => void;
  setGenerating: (isGenerating: boolean, progress?: number) => void;
}

export const useMCQStore = create<MCQStoreState>()(
  persist(
    (set, get) => ({
      questionSets: [],
      assessments: [],
      attempts: [],
      generationLogs: [],
      selectedQuestionsForBuilder: [],

      activeGenerating: false,
      activeGeneratingProgress: 0,
      activeExamAttempt: null,

      saveQuestionSet: (newSet) =>
        set((state) => ({
          questionSets: [newSet, ...state.questionSets.filter((s) => s.id !== newSet.id)],
        })),

      addQuestionSet: (newSet) =>
        set((state) => ({
          questionSets: [newSet, ...state.questionSets.filter((s) => s.id !== newSet.id)],
        })),

      duplicateQuestionSet: (id) => {
        const found = get().questionSets.find((s) => s.id === id);
        if (!found) return;
        const copy: QuestionSet = {
          ...found,
          id: `set_${Date.now()}`,
          title: `${found.title} (Copy)`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ questionSets: [copy, ...state.questionSets] }));
      },

      deleteQuestionSet: (id) =>
        set((state) => ({
          questionSets: state.questionSets.filter((s) => s.id !== id),
        })),

      setSelectedQuestionsForBuilder: (questions) => set({ selectedQuestionsForBuilder: questions }),

      saveAssessment: (newAssessment) =>
        set((state) => ({
          assessments: [newAssessment, ...state.assessments.filter((a) => a.id !== newAssessment.id)],
        })),

      addAssessment: (newAssessment) =>
        set((state) => ({
          assessments: [newAssessment, ...state.assessments.filter((a) => a.id !== newAssessment.id)],
        })),

      updateAssessment: (newAssessment) =>
        set((state) => ({
          assessments: state.assessments.map((a) => (a.id === newAssessment.id ? { ...a, ...newAssessment } : a)),
        })),

      deleteAssessment: (id) =>
        set((state) => ({
          assessments: state.assessments.filter((a) => a.id !== id),
        })),

      updateAssessmentStatus: (id, status) =>
        set((state) => ({
          assessments: state.assessments.map((a) => (a.id === id ? { ...a, status } : a)),
        })),

      startExamAttempt: (assessmentId, candidateName, candidateEmail) => {
        const attempt: ExamAttempt = {
          id: `att_${Date.now()}`,
          attemptId: `att_${Date.now()}`,
          assessmentId,
          candidateName,
          candidateEmail,
          startedAt: new Date().toISOString(),
          startTime: new Date().toISOString(),
          status: 'In Progress',
          answers: {},
          tabSwitches: 0,
          tabSwitchCount: 0,
        };
        set({ activeExamAttempt: attempt });
        return attempt;
      },

      updateExamAnswer: (attemptId, questionId, selectedOptionIndex) => {
        set((state) => {
          if (!state.activeExamAttempt || state.activeExamAttempt.attemptId !== attemptId) return state;
          return {
            activeExamAttempt: {
              ...state.activeExamAttempt,
              answers: { ...state.activeExamAttempt.answers, [questionId]: selectedOptionIndex },
            },
          };
        });
      },

      toggleMarkForReview: () => {},

      incrementTabSwitchCount: (attemptId) => {
        set((state) => {
          if (!state.activeExamAttempt || state.activeExamAttempt.attemptId !== attemptId) return state;
          const updatedSwitches = (state.activeExamAttempt.tabSwitches || 0) + 1;
          return {
            activeExamAttempt: {
              ...state.activeExamAttempt,
              tabSwitches: updatedSwitches,
              tabSwitchCount: updatedSwitches,
            },
          };
        });
      },

      submitExamAttempt: (attemptId) => {
        const state = get();
        if (!state.activeExamAttempt || state.activeExamAttempt.attemptId !== attemptId) return null;
        const submitted: ExamAttempt = {
          ...state.activeExamAttempt,
          id: state.activeExamAttempt.id || state.activeExamAttempt.attemptId,
          submittedAt: new Date().toISOString(),
          endTime: new Date().toISOString(),
          status: 'Submitted',
        };
        set({
          activeExamAttempt: null,
          attempts: [submitted, ...state.attempts],
        });
        return submitted;
      },

      recordAttempt: (attempt) =>
        set((state) => ({
          attempts: [attempt, ...state.attempts],
        })),

      addGenerationLog: (log) =>
        set((state) => ({
          generationLogs: [log, ...state.generationLogs],
        })),

      setGenerating: (isGenerating, progress = 0) =>
        set({ activeGenerating: isGenerating, activeGeneratingProgress: progress }),
    }),
    {
      name: 'mcq-store',
    }
  )
);
