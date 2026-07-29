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

export interface DiagnosticTurn {
  turnNumber: number;
  timestamp: string;
  topic: string;
  questionId: string;
  questionStem: string;
  targetConcepts: string[];
  candidateAnswer: string;
  responseTimeSeconds: number;
  evaluationScore: number | null;
  evaluationFeedback?: string;
  audioUrl?: string;
  stopReason?: string;
  conceptDeltas?: Array<{ conceptId: string; conceptName: string; from: BeliefStateLevel; to: BeliefStateLevel }>;
  interventions?: string[];
  aiReasoningSummary?: string;
  style?: DiagnosticStyle;
}

export interface DiagnosticSessionSummary {
  threadId: string;
  candidateId: string;
  candidateName: string;
  courseCode: string;
  startedAt: string;
  completedAt: string | null;
  totalTurns: number;
  overallScore: number;
  conceptsMasteredCount: number;
  conceptsTotalCount: number;
  misconceptionsCount: number;
  status: 'In Progress' | 'Completed' | 'Terminated';
}

export interface DiagnosticAuditLogEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  severity: 'info' | 'warning' | 'error';
}
