import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { StartInterviewResponse, SubmitAnswerResponse, InterviewReport } from '@/lib/api/evaluator.api';
import {
  BeliefStateLevel,
  DiagnosticStyle,
  DiagnosticConcept,
  Misconception,
  DiagnosticTurn,
} from '@/types/evaluator';

export interface DiagnosticSession {
  threadId: string;
  topic: string;
  status: 'In Progress' | 'Completed' | 'Terminated';
  createdAt: string;
  totalTopics: number;
  totalQuestionsAsked: number;
  totalAnsweredCorrectly: number;
  report: InterviewReport | null;
  stopReason: string;
  turns: DiagnosticTurn[];
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  agentType: 'IngestorAgent' | 'QuestionAgent' | 'EvaluatorAgent' | 'ReportAgent';
  threadId: string;
  logLevel: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
  eventName: string;
  model: string;
  latencyMs: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  systemPrompt: string;
  userPrompt: string;
  rawJsonResponse: string;
}

export interface ParsedIngestionTopic {
  id: string;
  title: string;
  itemCount: number;
  concepts: {
    id: string;
    name: string;
    baselineAccuracy: number;
  }[];
}

export interface CandidateAssessmentContext {
  candidate_id: string;
  candidate_name: string;
  assessment_code: string;
  assessment_name: string;
  submitted_at: string;
  set_id?: number;
  score_percentage: number;
  weak_topics: string[];
  total_questions?: number;
  attended_questions?: number;
  raw_snapshot?: any;
}

interface EvaluatorState {
  activeSession: DiagnosticSession | null;
  selectedCandidateAssessment: CandidateAssessmentContext | null;
  sessions: DiagnosticSession[];
  pastSessions: DiagnosticSession[];
  auditLogs: AuditLogEntry[];
  concepts: DiagnosticConcept[];
  misconceptions: Misconception[];
  parsedTopics: ParsedIngestionTopic[];

  // Ingestion state
  contextId: string | null;
  uploadedFileName: string | null;
  uploadedFileUrl: string | null;
  rawSyllabusText: string | null;
  isIngesting: boolean;
  ingestError: string | null;

  // Active turn transient state
  activeThreadId: string | null;
  currentTurnIndex: number;
  candidateResponseInput: string;
  selectedAuditLog: AuditLogEntry | null;
  currentAnswerDraft: string;
  isSubmittingAnswer: boolean;
  submitError: string | null;
  isGeneratingReport: boolean;
  isAudioPlaying: boolean;
  isMicRecording: boolean;
  questionTimerSeconds: number;
  isTimerRunning: boolean;
  showAdminHint: boolean;

  // Global settings
  targetTopic: string;
  useVoiceOutput: boolean;
  autoSpeakQuestion: boolean;

  // Actions
  setActiveThread: (threadId: string | null) => void;
  deleteSession: (threadId: string) => void;
  setSelectedAuditLog: (log: AuditLogEntry | null) => void;

  // Actions
  setContextId: (id: string | null) => void;
  setUploadedFile: (fileName: string, rawText: string) => void;
  setPendingFile: (fileName: string) => void;
  clearUpload: () => void;
  setParsedTopics: (topics: ParsedIngestionTopic[]) => void;
  clearIngestion: () => void;

  startSessionFromApi: (data: StartInterviewResponse) => void;
  setActiveSessionFromApi: (data: StartInterviewResponse) => void;
  applyTurnResponseFromApi: (candidateAnswer: string, responseTimeSec: number, data: SubmitAnswerResponse) => void;
  applySubmitResponseToSession: (data: SubmitAnswerResponse) => void;

  setCandidateResponseInput: (draft: string) => void;
  setAnswerDraft: (draft: string) => void;
  setSubmittingAnswer: (isSubmitting: boolean, error?: string | null) => void;
  setAudioPlaying: (playing: boolean) => void;
  setMicRecording: (recording: boolean) => void;
  tickTimer: () => void;
  resetQuestionTimer: () => void;
  setShowAdminHint: (show: boolean) => void;
  setStopReport: (report: InterviewReport | null) => void;

  completeSession: (report?: InterviewReport | null) => void;
  terminateSession: () => void;
  clearActiveSession: () => void;
  clearSession: () => void;

  addAuditLog: (log: Omit<AuditLogEntry, 'id' | 'timestamp'>) => void;
  clearAuditLogs: () => void;

  setVoiceSettings: (settings: { useVoiceOutput?: boolean; autoSpeakQuestion?: boolean }) => void;

  deletePastSession: (threadId: string) => void;
  setSelectedCandidateAssessment: (ctx: CandidateAssessmentContext | null) => void;
}

function buildTurn(
  turnNumber: number,
  genQ: {
    question_id?: string;
    question?: string;
    target_concepts?: string[];
    audio_url?: string;
    question_type?: string;
    style?: string;
  }
): DiagnosticTurn {
  return {
    turnNumber,
    timestamp: new Date().toISOString(),
    topic: (genQ.target_concepts && genQ.target_concepts[0]) || 'General Concept',
    questionId: genQ.question_id || `q_${turnNumber}`,
    questionStem: genQ.question || '',
    targetConcepts: genQ.target_concepts || [],
    candidateAnswer: '',
    responseTimeSeconds: 0,
    evaluationScore: null,
    audioUrl: genQ.audio_url || '',
    conceptDeltas: [],
    interventions: [],
    aiReasoningSummary: '',
    style: (genQ.style as DiagnosticStyle) || (genQ.question_type as DiagnosticStyle) || 'Explanation',
  };
}

export const useEvaluatorStore = create<EvaluatorState>()(
  persist(
    (set, get) => ({
      activeSession: null,
      selectedCandidateAssessment: null,
      setSelectedCandidateAssessment: (ctx) => set({ selectedCandidateAssessment: ctx }),
      sessions: [],
      pastSessions: [],
      auditLogs: [],
      concepts: [],
      misconceptions: [],
      parsedTopics: [],

      contextId: null,
      uploadedFileName: null,
      uploadedFileUrl: null,
      rawSyllabusText: null,
      isIngesting: false,
      ingestError: null,

      activeThreadId: null,
      currentTurnIndex: 0,
      candidateResponseInput: '',
      selectedAuditLog: null,

      setActiveThread: (id) => set({ activeThreadId: id }),
      deleteSession: (threadId) =>
        set((s) => ({
          sessions: s.sessions.filter((x) => x.threadId !== threadId),
          pastSessions: s.pastSessions.filter((x) => x.threadId !== threadId),
        })),
      setSelectedAuditLog: (log) => set({ selectedAuditLog: log }),

      currentAnswerDraft: '',
      isSubmittingAnswer: false,
      submitError: null,
      isGeneratingReport: false,
      isAudioPlaying: false,
      isMicRecording: false,
      questionTimerSeconds: 0,
      isTimerRunning: false,
      showAdminHint: false,

      targetTopic: 'Comprehensive Assessment',
      useVoiceOutput: false,
      autoSpeakQuestion: false,

      setContextId: (id) => set({ contextId: id }),
      setUploadedFile: (fileName, rawText) =>
        set({ uploadedFileName: fileName, rawSyllabusText: rawText, ingestError: null }),
      setPendingFile: (fileName) => set({ uploadedFileName: fileName }),
      clearUpload: () => set({ uploadedFileName: null, rawSyllabusText: null, contextId: null }),

      setParsedTopics: (topics) => set({ parsedTopics: topics }),

      clearIngestion: () =>
        set({ uploadedFileName: null, rawSyllabusText: null, parsedTopics: [], contextId: null, ingestError: null }),

      startSessionFromApi: (data) => {
        const firstTurn = buildTurn(1, { ...(data.generated_question || {}), audio_url: data.audio_url });
        const session: DiagnosticSession = {
          threadId: data.thread_id,
          topic: (data.generated_question?.target_concepts && data.generated_question.target_concepts[0]) || 'Diagnostic Assessment',
          status: 'In Progress',
          createdAt: new Date().toISOString(),
          totalTopics: data.total_topics || 1,
          totalQuestionsAsked: 1,
          totalAnsweredCorrectly: 0,
          report: null,
          stopReason: '',
          turns: [firstTurn],
        };
        set((s) => ({
          activeSession: session,
          activeThreadId: data.thread_id,
          currentTurnIndex: 0,
          sessions: [session, ...s.sessions],
          currentAnswerDraft: '',
          candidateResponseInput: '',
          submitError: null,
        }));
      },

      setActiveSessionFromApi: (data) => {
        get().startSessionFromApi(data);
      },

      applyTurnResponseFromApi: (candidateAnswer, responseTimeSec, data) => {
        const state = get();
        if (!state.activeSession) return;

        const currentTurns = state.activeSession.turns;
        const currentTurnIdx = currentTurns.length - 1;

        if (currentTurnIdx < 0) return;

        const turnToUpdate = { ...currentTurns[currentTurnIdx] };
        turnToUpdate.candidateAnswer = candidateAnswer;
        turnToUpdate.responseTimeSeconds = responseTimeSec;

        if (data.evaluation) {
          turnToUpdate.evaluationScore = typeof data.evaluation.score === 'number' ? data.evaluation.score : null;
          turnToUpdate.evaluationFeedback = data.evaluation.feedback || '';
        }

        const isComplete = Boolean(data.is_complete || data.stop_reason);
        const updatedTurns = [...currentTurns.slice(0, currentTurnIdx), turnToUpdate];

        if (!isComplete && data.generated_question) {
          const newNextTurn = buildTurn(currentTurns.length + 1, { ...(data.generated_question || {}), audio_url: data.audio_url });
          updatedTurns.push(newNextTurn);
        }

        const newSessionStatus = isComplete ? 'Completed' : 'In Progress';

        const updatedSession: DiagnosticSession = {
          ...state.activeSession,
          status: newSessionStatus,
          stopReason: data.stop_reason || '',
          report: data.report || state.activeSession.report,
          totalQuestionsAsked: updatedTurns.length,
          totalAnsweredCorrectly: data.total_answered_correctly ?? state.activeSession.totalAnsweredCorrectly,
          turns: updatedTurns,
        };

        const pastSessions = isComplete
          ? [updatedSession, ...state.pastSessions.filter((s) => s.threadId !== updatedSession.threadId)]
          : state.pastSessions;

        set({
          activeSession: updatedSession,
          currentTurnIndex: updatedTurns.length - 1,
          pastSessions,
          sessions: state.sessions.map((s) => (s.threadId === updatedSession.threadId ? updatedSession : s)),
          currentAnswerDraft: '',
          candidateResponseInput: '',
          isSubmittingAnswer: false,
          submitError: null,
        });
      },

      applySubmitResponseToSession: (data) => {
        const state = get();
        state.applyTurnResponseFromApi(state.candidateResponseInput || state.currentAnswerDraft, state.questionTimerSeconds, data);
      },

      setCandidateResponseInput: (draft) => set({ candidateResponseInput: draft, currentAnswerDraft: draft }),
      setAnswerDraft: (draft) => set({ candidateResponseInput: draft, currentAnswerDraft: draft }),
      setSubmittingAnswer: (isSubmitting, error = null) =>
        set({ isSubmittingAnswer: isSubmitting, submitError: error }),
      setAudioPlaying: (playing) => set({ isAudioPlaying: playing }),
      setMicRecording: (recording) => set({ isMicRecording: recording }),
      tickTimer: () => set((s) => ({ questionTimerSeconds: s.questionTimerSeconds + 1 })),
      resetQuestionTimer: () => set({ questionTimerSeconds: 0 }),
      setShowAdminHint: (show) => set({ showAdminHint: show }),
      setStopReport: (report) => {
        const active = get().activeSession;
        if (active) set({ activeSession: { ...active, report } });
      },

      completeSession: (report = null) => {
        const state = get();
        if (!state.activeSession) return;
        const finished: DiagnosticSession = {
          ...state.activeSession,
          status: 'Completed',
          report: report || state.activeSession.report,
        };
        set({
          activeSession: finished,
          pastSessions: [finished, ...state.pastSessions.filter((s) => s.threadId !== finished.threadId)],
        });
      },

      terminateSession: () => {
        const state = get();
        if (!state.activeSession) return;
        const terminated: DiagnosticSession = {
          ...state.activeSession,
          status: 'Terminated',
        };
        set({
          activeSession: terminated,
          pastSessions: [terminated, ...state.pastSessions.filter((s) => s.threadId !== terminated.threadId)],
        });
      },

      clearActiveSession: () => set({ activeSession: null }),
      clearSession: () => set({ activeSession: null }),

      addAuditLog: (log) => {
        const entry: AuditLogEntry = {
          ...log,
          id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
          timestamp: new Date().toISOString(),
        };
        set((s) => ({ auditLogs: [entry, ...s.auditLogs].slice(0, 100) }));
      },

      clearAuditLogs: () => set({ auditLogs: [] }),

      setVoiceSettings: (settings) =>
        set((s) => ({
          useVoiceOutput: settings.useVoiceOutput ?? s.useVoiceOutput,
          autoSpeakQuestion: settings.autoSpeakQuestion ?? s.autoSpeakQuestion,
        })),

      deletePastSession: (threadId) =>
        set((s) => ({ pastSessions: s.pastSessions.filter((session) => session.threadId !== threadId) })),
    }),
    {
      name: 'evaluator-store',
      partialize: (state) => ({
        pastSessions: state.pastSessions,
        auditLogs: state.auditLogs,
        useVoiceOutput: state.useVoiceOutput,
        autoSpeakQuestion: state.autoSpeakQuestion,
        selectedCandidateAssessment: state.selectedCandidateAssessment,
      }),
    }
  )
);
