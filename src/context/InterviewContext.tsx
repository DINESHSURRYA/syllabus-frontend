"use client";
import React, { createContext, useContext, useState, ReactNode } from 'react';
import {
  uploadContextFile,
  uploadJsonPayload,
  startInterview as apiStartInterview,
  submitAnswer as apiSubmitAnswer,
  stopInterview as apiStopInterview,
  InterviewCandidate,
  CandidateAssessmentAttempt,
  InterviewReport,
} from '@/lib/evaluator-api';
import { client } from '@/lib/api/client';

export interface InterviewQuestionItem {
  text: string;
  audioUrl?: string;
  questionId?: string;
  targetConcepts?: string[];
}

export interface InterviewAnswerItem {
  questionId: number;
  answer: string;
  timeTaken: number;
}

export interface UploadedFileState {
  name: string;
  size: number;
  url?: string;
  context_id: string;
}

interface InterviewContextType {
  uploadedFile: UploadedFileState | null;
  selectedCandidate: InterviewCandidate | null;
  selectedAttempt: CandidateAssessmentAttempt | null;
  threadId: string | null;
  questions: InterviewQuestionItem[];
  answers: InterviewAnswerItem[];
  currentQuestionIndex: number;
  isInterviewComplete: boolean;
  reportData: InterviewReport | any | null;
  isLoading: boolean;
  setUploadedFile: (file: UploadedFileState | null) => void;
  setSelectedCandidate: (cand: InterviewCandidate | null) => void;
  setSelectedAttempt: (att: CandidateAssessmentAttempt | null) => void;
  setCurrentQuestionIndex: React.Dispatch<React.SetStateAction<number>>;
  uploadFile: (file: File) => Promise<string>;
  uploadJson: (payload: any) => Promise<string>;
  ingestPhase2Assessment: (payload: any) => Promise<string>;
  startInterview: (customContextId?: string) => Promise<void>;
  submitAnswer: (answerText: string, timeTakenSeconds?: number) => Promise<void>;
  stopInterview: () => Promise<void>;
  fetchReport: () => Promise<any>;
  resetInterview: () => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export function useInterview() {
  const context = useContext(InterviewContext);
  if (!context) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}

export function InterviewProvider({ children }: { children: ReactNode }) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileState | null>(null);
  const [selectedCandidate, setSelectedCandidate] = useState<InterviewCandidate | null>(null);
  const [selectedAttempt, setSelectedAttempt] = useState<CandidateAssessmentAttempt | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<InterviewQuestionItem[]>([]);
  const [answers, setAnswers] = useState<InterviewAnswerItem[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [isInterviewComplete, setIsInterviewComplete] = useState<boolean>(false);
  const [reportData, setReportData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // 1. Upload File
  const uploadFile = async (file: File): Promise<string> => {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File too large. Max 10MB allowed.");
    }
    setIsLoading(true);
    try {
      const data = await uploadContextFile(file);
      const stateObj: UploadedFileState = {
        name: file.name,
        size: file.size,
        url: data.url,
        context_id: data.context_id,
      };
      setUploadedFile(stateObj);
      return data.context_id;
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Upload JSON Payload
  const uploadJson = async (payload: any): Promise<string> => {
    setIsLoading(true);
    try {
      const data = await uploadJsonPayload(payload);
      const stateObj: UploadedFileState = {
        name: "assessment.json",
        size: JSON.stringify(payload).length,
        context_id: data.context_id,
      };
      setUploadedFile(stateObj);
      return data.context_id;
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Ingest Phase 2 Assessment Output (Phase 2 -> Phase 3 Chaining)
  const ingestPhase2Assessment = async (payload: any): Promise<string> => {
    setIsLoading(true);
    try {
      const res = await client.post<any>('/api/evaluator/ingest_phase2', payload, { timeout: 300000 }).catch(async () => {
        return uploadJsonPayload(payload);
      });
      const contextId = res.context_id;
      const stateObj: UploadedFileState = {
        name: `phase2_attempt_${payload.attempt_id || payload.submission_id || 'submission'}.json`,
        size: JSON.stringify(payload).length,
        context_id: contextId,
      };
      setUploadedFile(stateObj);
      return contextId;
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Start Interview
  const startInterview = async (customContextId?: string): Promise<void> => {
    const targetContextId = customContextId || uploadedFile?.context_id;
    if (!targetContextId) {
      throw new Error("No context ID found. Please upload or select an assessment first.");
    }

    setIsLoading(true);
    try {
      const data = await apiStartInterview(targetContextId);
      setThreadId(data.thread_id);

      const qText = data.generated_question?.question || "Can you explain the main concepts in your assessment?";
      setQuestions([
        {
          text: qText,
          audioUrl: data.audio_url,
          questionId: data.generated_question?.question_id,
          targetConcepts: data.generated_question?.target_concepts,
        },
      ]);
      setCurrentQuestionIndex(0);
      setIsInterviewComplete(false);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Submit Answer
  const submitAnswer = async (answerText: string, timeTakenSeconds: number = 0): Promise<void> => {
    if (!threadId) throw new Error("No active interview thread.");

    setAnswers((prev) => [
      ...prev,
      { questionId: currentQuestionIndex, answer: answerText, timeTaken: timeTakenSeconds },
    ]);

    setIsLoading(true);
    try {
      const data = await apiSubmitAnswer(threadId, answerText, timeTakenSeconds);

      if (data.is_complete || data.report) {
        setIsInterviewComplete(true);
        if (data.report) setReportData(data.report);
      } else {
        const nextQText = data.generated_question?.question || "Can you elaborate further?";
        setQuestions((prev) => [
          ...prev,
          {
            text: nextQText,
            audioUrl: data.audio_url,
            questionId: data.generated_question?.question_id,
            targetConcepts: data.generated_question?.target_concepts,
          },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 6. Stop Interview (Manual stop)
  const stopInterview = async (): Promise<void> => {
    if (!threadId) return;
    setIsLoading(true);
    try {
      const data = await apiStopInterview(threadId);
      setReportData(data.report);
      setIsInterviewComplete(true);
    } finally {
      setIsLoading(false);
    }
  };

  // 7. Fetch Report
  const fetchReport = async (): Promise<any> => {
    return reportData;
  };

  // 8. Reset Interview
  const resetInterview = () => {
    setUploadedFile(null);
    setSelectedCandidate(null);
    setSelectedAttempt(null);
    setThreadId(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setIsInterviewComplete(false);
    setReportData(null);
    setIsLoading(false);
  };

  const value: InterviewContextType = {
    uploadedFile,
    selectedCandidate,
    selectedAttempt,
    threadId,
    questions,
    answers,
    currentQuestionIndex,
    isInterviewComplete,
    reportData,
    isLoading,
    setUploadedFile,
    setSelectedCandidate,
    setSelectedAttempt,
    setCurrentQuestionIndex,
    uploadFile,
    uploadJson,
    ingestPhase2Assessment,
    startInterview,
    submitAnswer,
    stopInterview,
    fetchReport,
    resetInterview,
  };

  return (
    <InterviewContext.Provider value={value}>
      {children}
    </InterviewContext.Provider>
  );
}
