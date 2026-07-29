/**
 * Evaluator Service API Bridge
 * Forwards all calls and types to the centralized API architecture at '@/lib/api'
 */

export { API_CONFIG as EVALUATOR_CONFIG } from './api/config';
export { API } from './api/endpoints';

export const EVALUATOR_API_URL = '/api/evaluator';
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

export type {
  GeneratedQuestion,
  Evaluation,
  CommunicationSkills,
  AssessmentSummary,
  TopicAnalysis,
  SessionMetrics,
  ReasoningProfile,
  InterviewReport,
  UploadResponse,
  StartInterviewResponse,
  SubmitAnswerResponse,
  StopInterviewResponse,
  AdminInterviewSummary,
  AdminInterviewsResponse,
  AdminInteractionEntry,
  AdminInterviewDetailResponse,
  AdminLogEntry,
  AdminLogsResponse,
  ChatResponse,
  AttendedCandidate,
  AttendedCandidatesResponse,
} from './api/evaluator.api';

export {
  uploadContextFile,
  uploadJsonPayload,
  startInterview,
  submitAnswer,
  stopInterview,
  fetchAdminInterviews,
  fetchAdminInterviewDetail,
  fetchAdminLogs,
  sendChat,
  fetchAttendedCandidates,
  fetchAttendedAssessmentSnapshot,
} from './api/evaluator.api';
