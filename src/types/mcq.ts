export type BloomLevel = 'K1' | 'K2' | 'K3' | 'K4' | 'K5' | 'K6';

export interface MCQOption {
  id: string;
  text: string;
  explanation?: string;
}

export interface MCQQuestion {
  id: string;
  questionText: string;
  cognitiveLevel: BloomLevel;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  options: MCQOption[];
  correctOptionIndex: number;
  explanation: string;
  points: number;
  unitTopic?: string;
}

export interface QuestionSet {
  id: string;
  title: string;
  subject: string;
  topic: string;
  difficulty: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
  questionCount: number;
  bloomMatrix: Record<BloomLevel, number>;
  questions: MCQQuestion[];
  createdAt: string;
  tags: string[];
}

export interface AccessControlConfig {
  isPublic: boolean;
  hasAccessCode: boolean;
  accessCode: string;
  domainRestrictions: string[];
  whitelistedEmails: string[];
}

export interface ProctoringConfig {
  trackTabSwitches: boolean;
  enforceFullscreen: boolean;
  maxTabSwitches: number;
}

export interface Assessment {
  id: string;
  title: string;
  code?: string;
  subject?: string;
  description?: string;
  type?: 'practice' | 'formal';
  durationMinutes: number;
  totalMarks: number;
  passingMarks?: number;
  passingPercentage?: number;
  questionSetId?: string;
  questions: MCQQuestion[];
  accessControl: AccessControlConfig;
  proctoring: ProctoringConfig;
  status: 'Draft' | 'Published' | 'Archived' | 'active' | 'draft' | 'archived';
  scheduledStart?: string;
  scheduledEnd?: string;
  createdByName?: string;
  createdAt: string;
  attemptsCount?: number;
}

export interface ExamAttempt {
  id?: string;
  attemptId: string;
  assessmentId: string;
  assessmentTitle?: string;
  candidateName: string;
  candidateEmail: string;
  startedAt?: string;
  startTime?: string;
  submittedAt?: string;
  endTime?: string;
  durationSeconds?: number;
  status: 'In Progress' | 'Submitted' | 'Disqualified';
  answers: Record<string, number>;
  score?: number;
  totalMarks?: number;
  percentage?: number;
  passed?: boolean;
  totalQuestions?: number;
  correctCount?: number;
  tabSwitches?: number;
  tabSwitchCount?: number;
  markedForReview?: string[];
  cognitiveBreakdown?: Record<BloomLevel, { total: number; correct: number; percentage: number }>;
}
