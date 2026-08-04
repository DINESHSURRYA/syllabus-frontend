import { create } from 'zustand';
import { evaluatorApi, StartInterviewParams } from '@/lib/api/evaluator.api';

export interface CandidateInfo {
  candidate_id: string;
  candidate_code: string;
  candidate_name: string;
  candidate_email: string;
  department?: string;
  course_batch?: string;
}

export interface AssessmentInfo {
  attempt_id: string;
  assessment_id?: string;
  course_code: string;
  assessment_name: string;
  total_score?: number;
  percentage?: number;
  grade?: string;
  weak_areas?: string[];
  strong_areas?: string[];
  questions?: Array<{
    question: string;
    topic?: string;
    options?: string[];
    user_answer?: string;
    correct_answer?: string;
    is_correct?: boolean;
    bloom_level?: string;
    co_code?: string;
  }>;
}

export interface InterviewQuestion {
  question: string;
  topic?: string;
  concepts?: string[];
  bloom_level?: string;
  style?: string;
  audio_url?: string;
}

export interface TurnRecord {
  turn_number: number;
  question: string;
  student_answer: string;
  time_taken_seconds: number;
  score?: number;
  feedback?: string;
  concept_deltas?: any[];
}

export interface EvaluatorState {
  // Setup & Selection State
  selectedCandidate: CandidateInfo | null;
  selectedAssessment: AssessmentInfo | null;
  uploadedFile: { name: string; size: number; context_id?: string } | null;
  
  // Live Interview State
  threadId: string | null;
  currentTopic: string | null;
  currentQuestion: InterviewQuestion | null;
  questions: Array<{ text: string; audioUrl?: string; questionTimerSeconds?: number; raw?: any }>;
  answers: Array<{ questionId: number; answer: string; timeTaken: number }>;
  currentQuestionIndex: number;
  globalTimeMinutes: number;
  turnHistory: TurnRecord[];
  turnCount: number;
  isStarting: boolean;
  isSubmitting: boolean;
  isInterviewComplete: boolean;
  report: any | null;
  error: string | null;

  // Audio / Mic Settings
  ttsEnabled: boolean;
  autoPlayAudio: boolean;
  audioVolume: number;

  // Actions
  setSelectedCandidate: (candidate: CandidateInfo | null) => void;
  setSelectedAssessment: (assessment: AssessmentInfo | null) => void;
  setUploadedFile: (file: { name: string; size: number; context_id?: string } | null) => void;
  setCurrentQuestionIndex: (index: number | ((prev: number) => number)) => void;
  setTtsEnabled: (enabled: boolean) => void;
  setAutoPlayAudio: (autoPlay: boolean) => void;
  setAudioVolume: (vol: number) => void;
  uploadFile: (file: File) => Promise<any>;
  
  // Main API Workflow Actions
  generateAndStartInterview: () => Promise<string>;
  submitAnswer: (answerText: string, timeTakenSeconds?: number) => Promise<void>;
  stopInterview: () => Promise<void>;
  resetSession: () => void;
}

export const useEvaluatorStore = create<EvaluatorState>((set, get) => ({
  selectedCandidate: {
    candidate_id: 'CAND-2026-001',
    candidate_code: 'ALEX_MERCER',
    candidate_name: 'Alex Mercer',
    candidate_email: 'alex.mercer@university.edu',
    department: 'Computer Science & Engineering',
    course_batch: 'CS-2026-A',
  },
  selectedAssessment: {
    attempt_id: 'ATT-2026-101',
    assessment_id: 'ASM-DS-01',
    course_code: 'CS101',
    assessment_name: 'Data Structures & Algorithms Midterm',
    percentage: 78.5,
    grade: 'B+',
    weak_areas: ['Binary Search Trees', 'Graph Traversal', 'Dynamic Programming'],
    strong_areas: ['Arrays & Hash Maps', 'Linked Lists'],
    questions: [
      {
        question: 'What is the worst-case time complexity of search operations in an unbalanced Binary Search Tree?',
        topic: 'Binary Search Trees',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n^2)'],
        user_answer: 'O(log n)',
        correct_answer: 'O(n)',
        is_correct: false,
        bloom_level: 'K2',
        co_code: 'CO2',
      },
      {
        question: 'Which data structure is primarily used to implement Breadth-First Search (BFS) in graphs?',
        topic: 'Graph Traversal',
        options: ['Queue', 'Stack', 'Heap', 'Tree'],
        user_answer: 'Stack',
        correct_answer: 'Queue',
        is_correct: false,
        bloom_level: 'K3',
        co_code: 'CO3',
      },
      {
        question: 'What is the primary characteristic of optimal substructure in Dynamic Programming?',
        topic: 'Dynamic Programming',
        options: [
          'The problem can be solved greedily at each step',
          'An optimal solution contains optimal solutions to its subproblems',
          'All subproblems must be independent',
          'The algorithm uses constant space'
        ],
        user_answer: 'The problem can be solved greedily at each step',
        correct_answer: 'An optimal solution contains optimal solutions to its subproblems',
        is_correct: false,
        bloom_level: 'K4',
        co_code: 'CO4',
      },
    ],
  },
  uploadedFile: null,

  threadId: null,
  currentTopic: null,
  currentQuestion: null,
  questions: [],
  answers: [],
  currentQuestionIndex: 0,
  globalTimeMinutes: 15,
  turnHistory: [],
  turnCount: 0,
  isStarting: false,
  isSubmitting: false,
  isInterviewComplete: false,
  report: null,
  error: null,

  ttsEnabled: true,
  autoPlayAudio: true,
  audioVolume: 0.9,

  setSelectedCandidate: (candidate) => set({ selectedCandidate: candidate }),
  setSelectedAssessment: (assessment) => set({ selectedAssessment: assessment }),
  setUploadedFile: (file) => set({ uploadedFile: file }),
  setCurrentQuestionIndex: (indexOrFn) => set((state) => ({
    currentQuestionIndex: typeof indexOrFn === 'function' ? indexOrFn(state.currentQuestionIndex) : indexOrFn
  })),
  setTtsEnabled: (enabled) => set({ ttsEnabled: enabled }),
  setAutoPlayAudio: (autoPlay) => set({ autoPlayAudio: autoPlay }),
  setAudioVolume: (vol) => set({ audioVolume: vol }),

  uploadFile: async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large. Max 10MB allowed.');
    }
    const data = await evaluatorApi.uploadFile(file);
    set({
      uploadedFile: {
        name: file.name,
        size: file.size,
        context_id: data.context_id,
      },
    });
    return data;
  },

  generateAndStartInterview: async () => {
    const { selectedCandidate, selectedAssessment, uploadedFile } = get();
    set({ isStarting: true, error: null });

    try {
      let params: StartInterviewParams = {};

      if (uploadedFile?.context_id) {
        params.context_id = uploadedFile.context_id;
      } else if (selectedAssessment?.attempt_id || selectedCandidate) {
        params.candidate_id = selectedCandidate?.candidate_id || 'CAND-USER';
        params.attempt_id = selectedAssessment?.attempt_id || 'ATT-USER';

        try {
          // 1. Export exact Phase 3 JSON schema from Phase 2 PostgreSQL
          const attemptIdToExport = selectedAssessment?.attempt_id || 'ATT-2026-101';
          const exportedPayload = await evaluatorApi.exportAttempt(attemptIdToExport);

          // 2. Ingest payload into Phase 3 FastAPI backend (:8001) via /upload_json
          const uploadRes = await evaluatorApi.uploadJson(exportedPayload);
          if (uploadRes?.context_id) {
            params.context_id = uploadRes.context_id;
          } else {
            params.json_payload = exportedPayload;
          }
        } catch (exportErr) {
          console.warn('Phase 2 JSON export warning, using direct candidate payload:', exportErr);
          params.json_payload = {
            set_id: 1,
            topic: selectedAssessment?.assessment_name || selectedAssessment?.course_code || 'Assessment Evaluation',
            time: 15,
            difficulty: 'medium',
            questions: selectedAssessment?.questions || []
          };
        }
      } else {
        throw new Error('Please select a Candidate & Assessment or upload a JSON assessment file.');
      }

      const res = await evaluatorApi.startInterview(params);

      const qObj = res.generated_question || {};
      const newQuestion: InterviewQuestion = {
        question: qObj.question || 'Can you explain the core concepts of this assessment topic?',
        topic: res.topic || qObj.topic || selectedAssessment?.course_code || 'General',
        concepts: qObj.concepts || [],
        bloom_level: qObj.bloom_level || 'K3',
        style: qObj.style || 'Explanation',
        audio_url: res.audio_url || qObj.audio_url,
      };

      const gTime = res.global_time_minutes || 15;
      const qTimerSec = qObj.question_timer_seconds || 45;
      const firstQItem = {
        text: newQuestion.question,
        audioUrl: res.audio_url || qObj.audio_url,
        questionTimerSeconds: qTimerSec,
        raw: qObj,
      };

      set({
        threadId: res.thread_id,
        currentTopic: res.topic || newQuestion.topic || 'Assessment Evaluation',
        currentQuestion: newQuestion,
        questions: [firstQItem],
        answers: [],
        currentQuestionIndex: 0,
        globalTimeMinutes: gTime,
        turnHistory: [],
        turnCount: 1,
        isStarting: false,
        isInterviewComplete: false,
        report: null,
      });

      return res.thread_id;
    } catch (err: any) {
      const msg = err.message || 'Failed to generate interview';
      set({ isStarting: false, error: msg });
      throw new Error(msg);
    }
  },

  submitAnswer: async (answerText: string, timeTakenSeconds: number = 0) => {
    const { threadId, currentQuestion, turnHistory, turnCount, currentQuestionIndex, answers } = get();
    if (!threadId) throw new Error('No active interview session');

    set({ 
      isSubmitting: true, 
      error: null,
      answers: [...answers, { questionId: currentQuestionIndex, answer: answerText, timeTaken: timeTakenSeconds }]
    });

    try {
      const res = await evaluatorApi.submitAnswer({
        thread_id: threadId,
        student_answer: answerText,
        time_taken_seconds: timeTakenSeconds,
      });

      const newTurnRecord: TurnRecord = {
        turn_number: turnCount,
        question: currentQuestion?.question || '',
        student_answer: answerText,
        time_taken_seconds: timeTakenSeconds,
        score: res.current_evaluation?.score,
        feedback: res.current_evaluation?.feedback,
      };

      if (res.is_complete || res.status === 'Completed') {
        set({
          turnHistory: [...turnHistory, newTurnRecord],
          isSubmitting: false,
          isInterviewComplete: true,
          report: res.report || res.evaluation_report,
        });
      } else {
        const qObj = res.generated_question || {};
        const nextQText = qObj.question || 'Thank you. Now, let us dive deeper into the next concept.';
        const qTimerSec = qObj.question_timer_seconds || 45;
        const nextQuestion: InterviewQuestion = {
          question: nextQText,
          topic: res.topic || qObj.topic || get().currentTopic,
          concepts: qObj.concepts || [],
          bloom_level: qObj.bloom_level || 'K3',
          style: qObj.style || 'Application',
          audio_url: res.audio_url || qObj.audio_url,
        };

        const nextQItem = {
          text: nextQText,
          audioUrl: res.audio_url || qObj.audio_url,
          questionTimerSeconds: qTimerSec,
          raw: qObj,
        };

        set((state) => ({
          turnHistory: [...state.turnHistory, newTurnRecord],
          turnCount: state.turnCount + 1,
          currentQuestion: nextQuestion,
          questions: [...state.questions, nextQItem],
          currentTopic: nextQuestion.topic || state.currentTopic,
          isSubmitting: false,
        }));
      }
    } catch (err: any) {
      set({ isSubmitting: false, error: err.message || 'Error submitting answer' });
      throw err;
    }
  },

  stopInterview: async () => {
    const { threadId } = get();
    if (!threadId) return;

    set({ isSubmitting: true, error: null });

    try {
      const res = await evaluatorApi.stopInterview(threadId);
      set({
        isSubmitting: false,
        isInterviewComplete: true,
        report: res.report || res.evaluation_report || res,
      });
    } catch (err: any) {
      set({ isSubmitting: false, error: err.message || 'Error stopping interview' });
    }
  },

  resetSession: () => {
    set({
      threadId: null,
      currentTopic: null,
      currentQuestion: null,
      questions: [],
      answers: [],
      currentQuestionIndex: 0,
      globalTimeMinutes: 15,
      turnHistory: [],
      turnCount: 0,
      isStarting: false,
      isSubmitting: false,
      isInterviewComplete: false,
      report: null,
      error: null,
      uploadedFile: null,
    });
  },
}));
