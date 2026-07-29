/**
 * Evaluator Service API Typed Helpers
 */

import { client } from './client';
import { API } from './endpoints';

// Shared sub-shapes & interfaces
export interface GeneratedQuestion {
  question_id: string;
  question: string;
  target_concepts: string[];
}

export interface Evaluation {
  score: number;
  feedback: string;
}

export interface CommunicationSkills {
  articulation?: string;
  confidence?: string;
}

export interface AssessmentSummary {
  overall_understanding: string;
  summary: string;
  communication_skills?: CommunicationSkills;
}

export interface TopicAnalysis {
  topic: string;
  mastery?: string;
  understanding_level?: string;
  depth?: string;
  mcq_interview_consistency?: string;
  average_time_taken_seconds?: number;
  mcq_questions_asked?: number;
  mcq_questions_correct?: number;
  feedback?: string;
  knowledge_gaps?: string[];
  misconceptions?: string[];
}

export interface SessionMetrics {
  total_answered_correctly?: number;
  total_questions_asked?: number;
  total_topics?: number;
}

export interface ReasoningProfile {
  reasoning_depth?: string;
  summary?: string;
}

export interface InterviewReport {
  session_metrics?: SessionMetrics;
  assessment_summary: AssessmentSummary;
  topic_analysis: TopicAnalysis[];
  reasoning_profile?: ReasoningProfile;
  key_strengths?: string[];
  priority_improvement_areas?: string[];
  final_summary?: string;
}

export interface UploadResponse {
  message: string;
  filename: string;
  url: string;
  context_id: string;
}

export interface StartInterviewResponse {
  message: string;
  thread_id: string;
  topic: string;
  generated_question: GeneratedQuestion;
  total_topics: number;
  audio_url: string;
}

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

export interface StopInterviewResponse {
  message: string;
  report: InterviewReport;
}

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

export interface AdminLogEntry {
  timestamp: string;
  agent: string;
  prompt: string;
  response: string;
}

export interface AdminLogsResponse {
  logs: AdminLogEntry[];
}

export interface ChatResponse {
  response?: string;
  message?: string;
}

export async function uploadContextFile(file: File): Promise<UploadResponse> {
  const formData = new FormData();
  formData.append('file', file);

  return client.post<UploadResponse>(API.evaluator.upload, formData);
}

export async function startInterview(contextId: string): Promise<StartInterviewResponse> {
  return client.post<StartInterviewResponse>(API.evaluator.startInterview, { context_id: contextId });
}

export async function submitAnswer(
  threadId: string,
  studentAnswer: string,
  timeTakenSeconds: number
): Promise<SubmitAnswerResponse> {
  return client.post<SubmitAnswerResponse>(API.evaluator.submitAnswer, {
    thread_id: threadId,
    student_answer: studentAnswer,
    time_taken_seconds: timeTakenSeconds,
  });
}

export interface AttendedCandidate {
  candidate_id: string;
  candidate_name: string;
  assessment_code: string;
  assessment_name: string;
  submitted_at: string;
  set_id?: number;
  score_percentage: number;
}

export interface AttendedCandidatesResponse {
  candidates: AttendedCandidate[];
}

export async function stopInterview(threadId: string): Promise<StopInterviewResponse> {
  return client.post<StopInterviewResponse>(API.evaluator.stopInterview, { thread_id: threadId });
}

export async function fetchAdminInterviews(): Promise<AdminInterviewsResponse> {
  return client.get<AdminInterviewsResponse>(API.evaluator.adminInterviews);
}

export async function fetchAdminInterviewDetail(threadId: string): Promise<AdminInterviewDetailResponse> {
  return client.get<AdminInterviewDetailResponse>(API.evaluator.adminInterviewDetail(threadId));
}

export async function fetchAdminLogs(): Promise<AdminLogsResponse> {
  return client.get<AdminLogsResponse>(API.evaluator.adminLogs);
}

export async function sendChat(prompt: string, history: any[] = []): Promise<ChatResponse> {
  return client.post<ChatResponse>(API.evaluator.chat, { prompt, history });
}

export async function uploadJsonPayload(payload: any): Promise<UploadResponse> {
  return client.post<UploadResponse>('/api/evaluator/upload_json', payload);
}

export async function fetchAttendedCandidates(): Promise<AttendedCandidatesResponse> {
  return client.get<AttendedCandidatesResponse>(API.assessment.attended);
}

export async function fetchAttendedAssessmentSnapshot(candidateId: string, assessmentCode: string): Promise<any> {
  return client.get<any>(API.assessment.attendedDetail(candidateId, assessmentCode));
}

