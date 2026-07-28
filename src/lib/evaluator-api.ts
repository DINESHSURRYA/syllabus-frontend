/**
 * Evaluator Service API Configuration & Typed Helpers
 *
 * All browser requests are routed through the Next.js rewrite proxy at
 * /api/evaluator/* which forwards them server-side to the real backend
 * (configured via NEXT_PUBLIC_EVALUATOR_API_URL in .env.local).
 * This avoids CORS entirely — the browser only ever talks to localhost.
 *
 * Endpoint reference (new API):
 *   POST /upload                    — Upload JSON/CSV, returns context_id
 *   POST /start_interview           — Start session from context_id
 *   POST /submit_answer             — Submit answer, get next question + evaluation
 *   POST /stop_interview            — Manually stop, get full report
 *   GET  /admin/interviews          — List all finished sessions
 *   GET  /admin/interviews/{id}     — Full detail for one session
 *   GET  /admin/logs                — Last 100 LLM execution logs
 */

/** Base prefix — points to the Next.js proxy. */
export const EVALUATOR_API_URL = '/api/evaluator';

// ============================================================
// Endpoint constants
// ============================================================
export const EVALUATOR_ENDPOINTS = {
  upload:               `${EVALUATOR_API_URL}/upload`,
  startInterview:       `${EVALUATOR_API_URL}/start_interview`,
  submitAnswer:         `${EVALUATOR_API_URL}/submit_answer`,
  stopInterview:        `${EVALUATOR_API_URL}/stop_interview`,
  chat:                 `${EVALUATOR_API_URL}/chat`,
  adminInterviews:      `${EVALUATOR_API_URL}/admin/interviews`,
  adminInterviewDetail: (threadId: string) => `${EVALUATOR_API_URL}/admin/interviews/${threadId}`,
  adminLogs:            `${EVALUATOR_API_URL}/admin/logs`,
} as const;

// ============================================================
// Shared sub-shapes
// ============================================================

/** A single generated question object returned by the backend. */
export interface GeneratedQuestion {
  question_id: string;
  question: string;
  target_concepts: string[];
}

/** Score + feedback for a submitted answer. */
export interface Evaluation {
  score: number;        // 0.0 – 1.0
  feedback: string;
}

/** Communication skills evaluation. */
export interface CommunicationSkills {
  articulation?: string;
  confidence?: string;
}

/** Assessment summary inside a stop/report response. */
export interface AssessmentSummary {
  overall_understanding: string;  // e.g. "strong", "moderate", "weak", "Intermediate"
  summary: string;
  communication_skills?: CommunicationSkills;
}

/** Per-topic analysis inside a report. */
export interface TopicAnalysis {
  topic: string;
  mastery?: string;               // e.g. "80%"
  understanding_level?: string;   // e.g. "strong", "moderate", "weak"
  depth?: string;                 // e.g. "Deep", "Surface"
  mcq_interview_consistency?: string;
  average_time_taken_seconds?: number;
  mcq_questions_asked?: number;
  mcq_questions_correct?: number;
  feedback?: string;
  knowledge_gaps?: string[];
  misconceptions?: string[];
}

/** Metrics summarizing MCQ and session performance. */
export interface SessionMetrics {
  total_answered_correctly?: number;
  total_questions_asked?: number;
  total_topics?: number;
}

/** Reasoning profile summary. */
export interface ReasoningProfile {
  reasoning_depth?: string;
  summary?: string;
}

/** Full interview report returned by /stop_interview or embedded in /submit_answer. */
export interface InterviewReport {
  session_metrics?: SessionMetrics;
  assessment_summary: AssessmentSummary;
  topic_analysis: TopicAnalysis[];
  reasoning_profile?: ReasoningProfile;
  key_strengths?: string[];
  priority_improvement_areas?: string[];
  final_summary?: string;
}

// ============================================================
// Step 1 — Upload
// ============================================================

export interface UploadResponse {
  message: string;
  filename: string;
  url: string;
  context_id: string;
}

/**
 * POST /upload
 * Uploads a JSON or CSV file, returns a context_id used to start the interview.
 */
export async function uploadContextFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(EVALUATOR_ENDPOINTS.upload, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<UploadResponse>;
}

// ============================================================
// Step 2 — Start Interview
// ============================================================

export interface StartInterviewResponse {
  message: string;
  thread_id: string;
  topic: string;
  generated_question: GeneratedQuestion;
  total_topics: number;
  audio_url: string;
}

/**
 * POST /start_interview
 * Initializes an interview session from a previously-uploaded context.
 * Returns the thread_id and the first question.
 */
export async function startInterview(contextId: string): Promise<StartInterviewResponse> {
  const res = await fetch(EVALUATOR_ENDPOINTS.startInterview, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ context_id: contextId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Start interview failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<StartInterviewResponse>;
}

// ============================================================
// Step 3 — Submit Answer
// ============================================================

export interface SubmitAnswerResponse {
  message: string;
  generated_question: GeneratedQuestion | null;
  evaluation: Evaluation;
  report: InterviewReport | null;
  is_complete: boolean;
  question_count: number;
  current_topic: string;
  stop_reason: string;
  audio_url: string;
  total_questions_asked: number;
  total_answered_correctly: number;
}

/**
 * POST /submit_answer
 * Submits the student's answer. Returns the next question (or null if done),
 * plus the evaluation for the submitted answer.
 */
export async function submitAnswer(
  threadId: string,
  studentAnswer: string,
  timeTakenSeconds: number,
): Promise<SubmitAnswerResponse> {
  const res = await fetch(EVALUATOR_ENDPOINTS.submitAnswer, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      thread_id: threadId,
      student_answer: studentAnswer,
      time_taken_seconds: timeTakenSeconds,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Submit answer failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<SubmitAnswerResponse>;
}

// ============================================================
// Stop Interview
// ============================================================

export interface StopInterviewResponse {
  message: string;
  report: InterviewReport;
}

/**
 * POST /stop_interview
 * Manually terminates the session and returns the evaluation report.
 */
export async function stopInterview(threadId: string): Promise<StopInterviewResponse> {
  const res = await fetch(EVALUATOR_ENDPOINTS.stopInterview, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ thread_id: threadId }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Stop interview failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<StopInterviewResponse>;
}

// ============================================================
// Admin — List interviews
// ============================================================

export interface AdminInterviewSummary {
  thread_id: string;
  topic: string;
  overall_understanding: string;
  summary: string;
  stop_reason: string;
}

export interface AdminInterviewsResponse {
  interviews: AdminInterviewSummary[];
}

/**
 * GET /admin/interviews
 * Returns all finished interview sessions sorted newest first.
 */
export async function fetchAdminInterviews(): Promise<AdminInterviewsResponse> {
  const res = await fetch(EVALUATOR_ENDPOINTS.adminInterviews);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Fetch interviews failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<AdminInterviewsResponse>;
}

// ============================================================
// Admin — Interview detail
// ============================================================

export interface AdminInteractionEntry {
  thread_id: string;
  question: { question: string };
  student_answer: string;
  evaluation: { score: number };
  knowledge_state_snapshot: Record<string, string>;
  question_count: number;
  current_topic: string;
}

export interface AdminInterviewDetailResponse {
  thread_id: string;
  interactions: AdminInteractionEntry[];
  report: InterviewReport;
  knowledge_state: Record<string, string>;
  stop_reason: string;
}

/**
 * GET /admin/interviews/{thread_id}
 * Full turn-by-turn details for one session.
 */
export async function fetchAdminInterviewDetail(threadId: string): Promise<AdminInterviewDetailResponse> {
  const res = await fetch(EVALUATOR_ENDPOINTS.adminInterviewDetail(threadId));
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Fetch interview detail failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<AdminInterviewDetailResponse>;
}

// ============================================================
// Admin — Logs
// ============================================================

export interface AdminLogEntry {
  timestamp: string;
  agent: string;
  prompt: string;
  response: string;
}

export interface AdminLogsResponse {
  logs: AdminLogEntry[];
}

/**
 * GET /admin/logs
 * Fetches the last 100 LLM execution logs.
 */
export async function fetchAdminLogs(): Promise<AdminLogsResponse> {
  const res = await fetch(EVALUATOR_ENDPOINTS.adminLogs);
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Fetch logs failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<AdminLogsResponse>;
}

// ============================================================
// Chat Endpoint
// ============================================================

export interface ChatResponse {
  response?: string;
  message?: string;
}

/**
 * POST /chat
 * Sends prompt and chat history to the assistant endpoint.
 */
export async function sendChat(prompt: string, history: any[] = []): Promise<ChatResponse> {
  const res = await fetch(EVALUATOR_ENDPOINTS.chat, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, history }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText);
    throw new Error(`Chat failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<ChatResponse>;
}

