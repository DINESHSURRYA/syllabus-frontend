import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ROUTES } from '@/lib/constants/routes';

export type WorkflowStepId = 'code_verify' | 'upload_file' | 'verification_review' | 'academic_strategy';

export interface WorkflowStep {
  id: WorkflowStepId;
  stepNumber: number;
  title: string;
  shortName: string;
  route: string;
}

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: 'code_verify', stepNumber: 1, title: 'Code Verification', shortName: '1. Verify Code', route: ROUTES.UPLOAD },
  { id: 'upload_file', stepNumber: 2, title: 'Upload File', shortName: '2. Upload', route: ROUTES.UPLOAD },
  { id: 'verification_review', stepNumber: 3, title: 'Verification & Save', shortName: '3. Verify & Save', route: ROUTES.VERIFICATION },
  { id: 'academic_strategy', stepNumber: 4, title: 'Academic Strategy', shortName: '4. Strategy', route: ROUTES.CURRICULUM },
];

interface GuideStoreState {
  isGuideEnabled: boolean;
  isGuideMinimized: boolean;
  activeWorkflowStep: WorkflowStepId;
  highlightedTargetId: string | null;
  hasSeenWelcome: boolean;
  duplicateDetectedCode: string | null;

  toggleGuide: (enabled?: boolean) => void;
  setMinimized: (minimized: boolean) => void;
  setWorkflowStep: (step: WorkflowStepId) => void;
  nextWorkflowStep: () => void;
  prevWorkflowStep: () => void;
  triggerHighlight: (targetId: string | null, autoClearMs?: number) => void;
  setDuplicateDetectedCode: (code: string | null) => void;
  resetGuide: () => void;
}

export const useGuideStore = create<GuideStoreState>()(
  persist(
    (set, get) => ({
      isGuideEnabled: true,
      isGuideMinimized: false,
      activeWorkflowStep: 'code_verify',
      highlightedTargetId: null,
      hasSeenWelcome: false,
      duplicateDetectedCode: null,

      toggleGuide: (enabled) =>
        set((state) => ({
          isGuideEnabled: enabled !== undefined ? enabled : !state.isGuideEnabled,
        })),

      setMinimized: (minimized) => set({ isGuideMinimized: minimized }),

      setWorkflowStep: (step) => set({ activeWorkflowStep: step }),

      nextWorkflowStep: () => {
        const currentIdx = WORKFLOW_STEPS.findIndex((s) => s.id === get().activeWorkflowStep);
        if (currentIdx < WORKFLOW_STEPS.length - 1) {
          set({ activeWorkflowStep: WORKFLOW_STEPS[currentIdx + 1].id });
        }
      },

      prevWorkflowStep: () => {
        const currentIdx = WORKFLOW_STEPS.findIndex((s) => s.id === get().activeWorkflowStep);
        if (currentIdx > 0) {
          set({ activeWorkflowStep: WORKFLOW_STEPS[currentIdx - 1].id });
        }
      },

      triggerHighlight: (targetId, autoClearMs = 4000) => {
        set({ highlightedTargetId: targetId });
        if (targetId && autoClearMs > 0) {
          setTimeout(() => {
            if (get().highlightedTargetId === targetId) {
              set({ highlightedTargetId: null });
            }
          }, autoClearMs);
        }
      },

      setDuplicateDetectedCode: (code) => set({ duplicateDetectedCode: code }),

      resetGuide: () =>
        set({
          isGuideEnabled: true,
          isGuideMinimized: false,
          activeWorkflowStep: 'code_verify',
          highlightedTargetId: null,
          hasSeenWelcome: false,
          duplicateDetectedCode: null,
        }),
    }),
    {
      name: 'syllabus-ai-guide-storage',
      partialize: (state) => ({
        isGuideEnabled: state.isGuideEnabled,
        isGuideMinimized: state.isGuideMinimized,
        activeWorkflowStep: state.activeWorkflowStep,
        hasSeenWelcome: state.hasSeenWelcome,
      }),
    }
  )
);
