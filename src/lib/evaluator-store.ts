import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  StartInterviewResponse,
  SubmitAnswerResponse,
  InterviewReport,
} from './evaluator-api';

export type BeliefStateLevel = 'Unknown' | 'Emerging' | 'Partial' | 'Strong' | 'Mastered';

export type DiagnosticStyle =
  | 'Explanation'
  | 'Comparison'
  | 'Application'
  | 'Debugging'
  | 'Counterexample'
  | 'Trade-off'
  | 'Scenario'
  | 'Design';

export interface DiagnosticConcept {
  id: string;
  topic: string;
  conceptName: string;
  baselineAccuracy: number;
  currentBelief: BeliefStateLevel;
  confidenceScore: number;
  initialScore: number;
}

export interface Misconception {
  id: string;
  conceptId: string;
  conceptName: string;
  title: string;
  description: string;
  severity: 'Low' | 'Medium' | 'High' | 'Critical';
  detectedAtTurn: number;
}

/**
 * A single question-answer turn in the interview.
 * Fields map directly from the API response shapes.
 */
export interface DiagnosticTurn {
  turnNumber: number;
  timestamp: string;
  topic: string;
  /** question_id from generated_question */
  questionId: string;
  /** question text from generated_question.question */
  questionStem: string;
  /** target_concepts from generated_question */
  targetConcepts: string[];
  /** Student's answer text (empty until answered) */
  candidateAnswer: string;
  /** Seconds spent on this question */
  responseTimeSeconds: number;
  /** evaluation.score (0–1) for this turn */
  evaluationScore: number | null;
  /** evaluation.feedback for this turn */
  evaluationFeedback: string;
  /** audio_url returned with this question */
  audioUrl: string;
  /** stop_reason if session ended after this turn */
  stopReason: string;
}

export interface DiagnosticSession {
  threadId: string;
  /** Topic label(s) from the backend */
  topic: string;
  status: 'In Progress' | 'Completed' | 'Terminated';
  createdAt: string;
  /** Total topics in this context */
  totalTopics: number;
  /** Cumulative questions asked */
  totalQuestionsAsked: number;
  /** Cumulative correctly answered */
  totalAnsweredCorrectly: number;
  /** Final report (set on stop or when is_complete = true) */
  report: InterviewReport | null;
  /** stop_reason from the last response */
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

// ─────────────────────────────────────────────────────────────
// Helper: build a DiagnosticTurn from a generated_question blob
// ─────────────────────────────────────────────────────────────
function buildTurn(
  turnNumber: number,
  topic: string,
  generatedQuestion: StartInterviewResponse['generated_question'],
  audioUrl: string,
): DiagnosticTurn {
  return {
    turnNumber,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    topic,
    questionId: generatedQuestion.question_id,
    questionStem: generatedQuestion.question,
    targetConcepts: generatedQuestion.target_concepts ?? [],
    candidateAnswer: '',
    responseTimeSeconds: 0,
    evaluationScore: null,
    evaluationFeedback: '',
    audioUrl,
    stopReason: '',
  };
}

// ─────────────────────────────────────────────────────────────
// Helper: build a session from POST /start_interview response
// ─────────────────────────────────────────────────────────────
function buildSessionFromStartResponse(res: StartInterviewResponse): DiagnosticSession {
  const firstTurn = buildTurn(1, res.topic, res.generated_question, res.audio_url);

  return {
    threadId: res.thread_id,
    topic: res.topic,
    status: 'In Progress',
    createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
    totalTopics: res.total_topics,
    totalQuestionsAsked: 0,
    totalAnsweredCorrectly: 0,
    report: null,
    stopReason: '',
    turns: [firstTurn],
  };
}

// ─────────────────────────────────────────────────────────────
// Helper: merge a SubmitAnswerResponse into an existing session
// ─────────────────────────────────────────────────────────────
function applySubmitResponse(
  session: DiagnosticSession,
  answerText: string,
  timeSecs: number,
  res: SubmitAnswerResponse,
): DiagnosticSession {
  // 1. Fill in the answer + evaluation for the last unanswered turn
  const updatedTurns = session.turns.map((t, idx) => {
    if (idx === session.turns.length - 1 && !t.candidateAnswer) {
      return {
        ...t,
        candidateAnswer: answerText,
        responseTimeSeconds: timeSecs,
        evaluationScore: res.evaluation?.score ?? null,
        evaluationFeedback: res.evaluation?.feedback ?? '',
        stopReason: res.stop_reason ?? '',
      };
    }
    return t;
  });

  // 2. Append next question turn if not complete
  let finalTurns = updatedTurns;
  if (!res.is_complete && res.generated_question) {
    const nextTurn: DiagnosticTurn = {
      turnNumber: session.turns.length + 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      topic: res.current_topic || session.topic,
      questionId: res.generated_question.question_id,
      questionStem: res.generated_question.question,
      targetConcepts: res.generated_question.target_concepts ?? [],
      candidateAnswer: '',
      responseTimeSeconds: 0,
      evaluationScore: null,
      evaluationFeedback: '',
      audioUrl: res.audio_url ?? '',
      stopReason: '',
    };
    finalTurns = [...updatedTurns, nextTurn];
  }

  const isTerminated = res.is_complete;

  return {
    ...session,
    status: isTerminated ? (res.stop_reason ? 'Terminated' : 'Completed') : 'In Progress',
    totalQuestionsAsked: res.total_questions_asked ?? session.totalQuestionsAsked + 1,
    totalAnsweredCorrectly: res.total_answered_correctly ?? session.totalAnsweredCorrectly,
    report: res.report ?? session.report,
    stopReason: res.stop_reason ?? session.stopReason,
    turns: finalTurns,
  };
}

// ─────────────────────────────────────────────────────────────
// Store interface
// ─────────────────────────────────────────────────────────────
interface EvaluatorStore {
  // ── Upload / Ingestion State ──────────────────────────────
  /** context_id returned from POST /upload */
  contextId: string | null;
  uploadedFileName: string | null;
  uploadedFileUrl: string | null;
  /** The actual File object held in memory (not persisted) */
  pendingFile: File | null;

  // ── Active Interview State ────────────────────────────────
  activeThreadId: string;
  activeSession: DiagnosticSession | null;
  currentTurnIndex: number;
  candidateResponseInput: string;
  isAudioPlaying: boolean;
  isMicRecording: boolean;
  showAdminHint: boolean;
  /** Timer tracking time spent on the CURRENT question (resets each turn) */
  questionTimerSeconds: number;
  isTimerRunning: boolean;

  // ── Sessions Store ────────────────────────────────────────
  sessions: Record<string, DiagnosticSession>;

  // ── Audit Logs ────────────────────────────────────────────
  auditLogs: AuditLogEntry[];
  selectedAuditLog: AuditLogEntry | null;

  // ── Actions ───────────────────────────────────────────────
  setPendingFile: (file: File | null) => void;
  setContextId: (id: string, filename: string, url: string) => void;
  clearUpload: () => void;
  setActiveSessionFromApi: (res: StartInterviewResponse) => string;
  applySubmitResponseToSession: (
    answerText: string,
    timeSecs: number,
    res: SubmitAnswerResponse,
  ) => void;
  setStopReport: (report: InterviewReport, stopReason?: string) => void;
  setActiveThread: (threadId: string) => void;
  setCandidateResponseInput: (input: string) => void;
  setAudioPlaying: (playing: boolean) => void;
  setMicRecording: (recording: boolean) => void;
  setShowAdminHint: (show: boolean) => void;
  tickTimer: () => void;
  resetQuestionTimer: () => void;
  deleteSession: (threadId: string) => void;
  addAuditLog: (log: AuditLogEntry) => void;
  setSelectedAuditLog: (log: AuditLogEntry | null) => void;
  clearSession: () => void;
}

export const useEvaluatorStore = create<EvaluatorStore>()(
  persist(
    (set, get) => ({
      // ── Initial State ────────────────────────────────────
      contextId: null,
      uploadedFileName: null,
      uploadedFileUrl: null,
      pendingFile: null,

      activeThreadId: '',
      activeSession: null,
      currentTurnIndex: 0,
      candidateResponseInput: '',
      isAudioPlaying: false,
      isMicRecording: false,
      showAdminHint: false,
      questionTimerSeconds: 0,
      isTimerRunning: false,

      sessions: {},
      auditLogs: [],
      selectedAuditLog: null,

      // ── Actions ──────────────────────────────────────────

      setPendingFile: (file) => set({ pendingFile: file }),

      setContextId: (id, filename, url) =>
        set({ contextId: id, uploadedFileName: filename, uploadedFileUrl: url }),

      clearUpload: () =>
        set({ contextId: null, uploadedFileName: null, uploadedFileUrl: null, pendingFile: null }),

      /**
       * Called after POST /start_interview.
       * Builds a DiagnosticSession and marks it active.
       */
      setActiveSessionFromApi: (res) => {
        const newSession = buildSessionFromStartResponse(res);
        set((state) => ({
          sessions: { ...state.sessions, [res.thread_id]: newSession },
          activeThreadId: res.thread_id,
          activeSession: newSession,
          currentTurnIndex: 0,
          candidateResponseInput: '',
          questionTimerSeconds: 0,
          isTimerRunning: true,
        }));
        return res.thread_id;
      },

      /**
       * Called after POST /submit_answer.
       * Merges evaluation + next question into the active session.
       */
      applySubmitResponseToSession: (answerText, timeSecs, res) => {
        const { activeSession } = get();
        if (!activeSession) return;
        const updatedSession = applySubmitResponse(activeSession, answerText, timeSecs, res);
        set((state) => ({
          activeSession: updatedSession,
          sessions: { ...state.sessions, [activeSession.threadId]: updatedSession },
          candidateResponseInput: '',
          currentTurnIndex: updatedSession.turns.length - 1,
          questionTimerSeconds: 0,
        }));
      },

      /**
       * Called after POST /stop_interview.
       * Stores the report and marks session Terminated.
       */
      setStopReport: (report, stopReason = 'manual_stop') => {
        const { activeSession } = get();
        if (!activeSession) return;
        const updated: DiagnosticSession = {
          ...activeSession,
          status: 'Terminated',
          report,
          stopReason,
          isTimerRunning: false,
        } as any;
        set((state) => ({
          activeSession: updated,
          sessions: { ...state.sessions, [activeSession.threadId]: updated },
          isTimerRunning: false,
        }));
      },

      setActiveThread: (threadId) => {
        const session = get().sessions[threadId] || null;
        set({
          activeThreadId: threadId,
          activeSession: session,
          currentTurnIndex: session ? Math.max(0, session.turns.length - 1) : 0,
        });
      },

      clearSession: () =>
        set({
          activeSession: null,
          activeThreadId: '',
          currentTurnIndex: 0,
          candidateResponseInput: '',
          isTimerRunning: false,
          questionTimerSeconds: 0,
          pendingFile: null,
          contextId: null,
          uploadedFileName: null,
          uploadedFileUrl: null,
        }),

      setCandidateResponseInput: (input) => set({ candidateResponseInput: input }),
      setAudioPlaying: (playing) => set({ isAudioPlaying: playing }),
      setMicRecording: (recording) => set({ isMicRecording: recording }),
      setShowAdminHint: (show) => set({ showAdminHint: show }),

      tickTimer: () =>
        set((state) => ({ questionTimerSeconds: state.questionTimerSeconds + 1 })),

      resetQuestionTimer: () => set({ questionTimerSeconds: 0 }),

      deleteSession: (threadId) =>
        set((state) => {
          const newSessions = { ...state.sessions };
          delete newSessions[threadId];
          return { sessions: newSessions };
        }),

      addAuditLog: (log) =>
        set((state) => ({ auditLogs: [log, ...state.auditLogs] })),
      setSelectedAuditLog: (log) => set({ selectedAuditLog: log }),
    }),
    {
      name: 'syllabus_evaluator_store_v4',
      partialize: (state) => ({
        contextId: state.contextId,
        uploadedFileName: state.uploadedFileName,
        uploadedFileUrl: state.uploadedFileUrl,
        activeThreadId: state.activeThreadId,
        activeSession: state.activeSession,
        sessions: state.sessions,
        currentTurnIndex: state.currentTurnIndex,
        questionTimerSeconds: state.questionTimerSeconds,
        isTimerRunning: state.isTimerRunning,
        auditLogs: state.auditLogs,
      }),
    }
  )
);
