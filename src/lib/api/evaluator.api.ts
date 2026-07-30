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
  feedback?: string;
  assessment_confidence?: string;
}

export type EvaluatorReport = InterviewReport;

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
  overall_score?: number;
  overall_rating?: string;
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
  candidate_id?: string;
  candidate_name?: string;
  assessment_name?: string;
  topic: string;
  overall_understanding: string;
  summary: string;
  stop_reason: string;
  overall_score?: number;
  created_at?: string;
}

export interface AdminInterviewsResponse {
  interviews: AdminInterviewSummary[];
}

export interface AdminInteractionEntry {
  thread_id: string;
  question: { question: string };
  student_answer: string;
  evaluation: Evaluation;
  knowledge_state_snapshot?: Record<string, string>;
  question_count?: number;
  current_topic?: string;
  state_given_to_questioning_agent?: any;
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

  return client.post<UploadResponse>(API.evaluator.upload, formData, { timeout: 300000 });
}

export async function startInterview(contextId: string): Promise<StartInterviewResponse> {
  return client.post<StartInterviewResponse>(API.evaluator.startInterview, { context_id: contextId }, { timeout: 300000 });
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
  }, { timeout: 300000 });
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
  return client.post<StopInterviewResponse>(API.evaluator.stopInterview, { thread_id: threadId }, { timeout: 300000 });
}

export async function fetchAdminInterviews(): Promise<AdminInterviewsResponse> {
  return client.get<AdminInterviewsResponse>(API.evaluator.adminInterviews, { timeout: 300000 });
}

export async function fetchAdminInterviewDetail(threadId: string): Promise<AdminInterviewDetailResponse> {
  return client.get<AdminInterviewDetailResponse>(API.evaluator.adminInterviewDetail(threadId), { timeout: 300000 });
}

export async function fetchAdminLogs(): Promise<AdminLogsResponse> {
  return client.get<AdminLogsResponse>(API.evaluator.adminLogs, { timeout: 300000 });
}

export async function sendChat(prompt: string, history: any[] = []): Promise<ChatResponse> {
  return client.post<ChatResponse>(API.evaluator.chat, { prompt, history }, { timeout: 300000 });
}

export async function uploadJsonPayload(payload: any): Promise<UploadResponse> {
  return client.post<UploadResponse>('/api/evaluator/upload_json', payload, { timeout: 300000 });
}

export async function fetchAttendedCandidates(): Promise<AttendedCandidatesResponse> {
  return client.get<AttendedCandidatesResponse>(API.assessment.attended);
}

export async function fetchAttendedAssessmentSnapshot(candidateId: string, assessmentCode: string): Promise<any> {
  return client.get<any>(API.assessment.attendedDetail(candidateId, assessmentCode));
}

// ==================== PHASE 3 AI INTERVIEW ENGINE TYPED APIS ====================

export interface InterviewCandidate {
  id: string;
  candidate_code: string;
  name: string;
  email?: string;
  department: string;
  course_batch?: string;
  completed_assessments_count: number;
}

export interface CandidateAssessmentAttempt {
  attempt_id: string;
  assessment_id: string;
  assessment_name: string;
  course_code: string;
  assessment_description?: string;
  attempt_number: number;
  status: string;
  score: number;
  percentage: number;
  pass_status: string;
  assessment_date: string;
}

export interface Phase3InterviewQuestion {
  question_number: number;
  question_text: string;
  target_concept: string;
  bloom_level: string;
  expected_difficulty?: string;
  expected_answer?: string;
  candidate_answer?: string;
  score?: number;
  time_taken_seconds?: number;
  evaluation?: any;
}

export interface GenerateAIInterviewResponse {
  status: string;
  interview_id: string;
  candidate_id: string;
  candidate_name: string;
  assessment_id: string;
  assessment_name: string;
  total_questions: number;
  interview_plan: any;
  questions: Phase3InterviewQuestion[];
  created_at: string;
}

export interface InterviewAnswerResponse {
  status: string;
  interview_id: string;
  question_number: number;
  recorded: boolean;
  next_question_number?: number;
  is_last_question: boolean;
}

export interface InterviewDiagnosticReport {
  status: string;
  interview_id: string;
  overall_score: number;
  overall_rating: string;
  topic_report: Record<string, any>;
  unit_report: Record<string, any>;
  co_report: Record<string, any>;
  bloom_report: Record<string, any>;
  reasoning_profile: Record<string, any>;
  communication_profile: Record<string, any>;
  knowledge_gaps: string[];
  strong_areas: string[];
  recommendations: any[];
  question_evaluations: any[];
}

export async function fetchInterviewCandidates(query?: string): Promise<{ candidates: InterviewCandidate[] }> {
  const url = query ? `/api/evaluator/phase2/candidates?query=${encodeURIComponent(query)}` : `/api/evaluator/phase2/candidates`;
  return client.get<{ candidates: InterviewCandidate[] }>(url).catch(() => {
    const fallbackUrl = query ? `${API.interview.candidates}?query=${encodeURIComponent(query)}` : API.interview.candidates;
    return client.get<{ candidates: InterviewCandidate[] }>(fallbackUrl);
  });
}

export async function fetchCandidateAssessments(candidateId: string): Promise<{ assessments: CandidateAssessmentAttempt[] }> {
  return client.get<{ assessments: CandidateAssessmentAttempt[] }>(API.interview.candidateAssessments(candidateId));
}

export async function generateAIInterview(candidateId: string, attemptId: string): Promise<GenerateAIInterviewResponse> {
  return client.post<GenerateAIInterviewResponse>(
    API.interview.generate,
    {
      candidate_id: candidateId,
      attempt_id: attemptId,
    },
    { timeout: 300000 }
  );
}

export async function fetchInterviewState(interviewId: string): Promise<any> {
  return client.get<any>(API.interview.getById(interviewId), { timeout: 300000 });
}

export async function submitInterviewQuestionAnswer(
  interviewId: string,
  questionNumber: number,
  answer: string,
  timeTakenSeconds: number = 0
): Promise<InterviewAnswerResponse> {
  return client.post<InterviewAnswerResponse>(
    API.interview.answer(interviewId),
    {
      question_number: questionNumber,
      candidate_answer: answer,
      time_taken_seconds: timeTakenSeconds,
    },
    { timeout: 300000 }
  );
}

export async function completeAIInterview(interviewId: string): Promise<InterviewDiagnosticReport> {
  return client.post<InterviewDiagnosticReport>(API.interview.complete(interviewId), {}, { timeout: 300000 });
}

export async function fetchInterviewDiagnosticReport(interviewId: string): Promise<InterviewDiagnosticReport> {
  return client.get<InterviewDiagnosticReport>(API.interview.report(interviewId), { timeout: 300000 });
}


