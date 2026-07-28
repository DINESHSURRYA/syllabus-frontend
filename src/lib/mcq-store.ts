import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type BloomLevel = 'K1' | 'K2' | 'K3' | 'K4' | 'K5' | 'K6';

export const BLOOM_LEVEL_DESCRIPTIONS: Record<BloomLevel, { name: string; desc: string; color: string; bg: string; border: string }> = {
  K1: { name: 'K1 - Remember', desc: 'Recall facts & basic concepts', color: 'text-amber-500 dark:text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/30' },
  K2: { name: 'K2 - Understand', desc: 'Explain ideas or concepts', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
  K3: { name: 'K3 - Apply', desc: 'Use information in new situations', color: 'text-emerald-500 dark:text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30' },
  K4: { name: 'K4 - Analyze', desc: 'Draw connections among ideas', color: 'text-indigo-500 dark:text-indigo-400', bg: 'bg-indigo-500/10', border: 'border-indigo-500/30' },
  K5: { name: 'K5 - Evaluate', desc: 'Justify a stand or decision', color: 'text-purple-500 dark:text-purple-400', bg: 'bg-purple-500/10', border: 'border-purple-500/30' },
  K6: { name: 'K6 - Create', desc: 'Produce new or original work', color: 'text-rose-500 dark:text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/30' },
};

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
  description: string;
  durationMinutes: number;
  type: 'practice' | 'formal';
  passingPercentage: number;
  questions: MCQQuestion[];
  totalMarks: number;
  accessControl: AccessControlConfig;
  proctoring: ProctoringConfig;
  status: 'active' | 'draft' | 'archived';
  createdAt: string;
  attemptsCount: number;
}

export interface ExamAttempt {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  candidateName: string;
  candidateEmail: string;
  startTime: string;
  endTime: string;
  durationSeconds: number;
  score: number;
  totalMarks: number;
  percentage: number;
  passed: boolean;
  tabSwitchCount: number;
  answers: Record<string, number>; // questionId -> selectedOptionIndex
  markedForReview: string[]; // array of questionIds
  cognitiveBreakdown: Record<BloomLevel, { total: number; correct: number; percentage: number }>;
}

export interface GenerationLog {
  id: string;
  subject: string;
  topic: string;
  difficulty: string;
  questionCount: number;
  bloomMatrix: Record<BloomLevel, number>;
  timestamp: string;
  status: 'completed' | 'failed';
  generatedSetId?: string;
}

const INITIAL_MOCK_QUESTIONS: MCQQuestion[] = [
  {
    id: 'q-101',
    questionText: 'What is the time complexity of searching an element in a balanced Binary Search Tree (BST) of size N?',
    cognitiveLevel: 'K1',
    difficulty: 'Easy',
    points: 2,
    unitTopic: 'Trees & Graphs',
    options: [
      { id: 'opt-a', text: 'O(1)', explanation: 'O(1) is constant time, applicable for hash table lookups in best cases.' },
      { id: 'opt-b', text: 'O(log N)', explanation: 'In a balanced BST, tree height is log(N), so search operations take O(log N).' },
      { id: 'opt-c', text: 'O(N)', explanation: 'O(N) occurs in degenerate linear linked-list trees.' },
      { id: 'opt-d', text: 'O(N log N)', explanation: 'O(N log N) is typical for efficient comparison sorts like MergeSort.' },
    ],
    correctOptionIndex: 1,
    explanation: 'A balanced BST maintains height h = O(log N). Thus searching halves the remaining nodes at each step.',
  },
  {
    id: 'q-102',
    questionText: 'Explain why QuickSort exhibits an O(N^2) worst-case time complexity, and identify the condition under which this occurs.',
    cognitiveLevel: 'K2',
    difficulty: 'Medium',
    points: 3,
    unitTopic: 'Sorting Algorithms',
    options: [
      { id: 'opt-a', text: 'When array elements are random and pivot is chosen randomly', explanation: 'Random pivots prevent quadratic worst case in expectation.' },
      { id: 'opt-b', text: 'When the array is already sorted and the smallest or largest element is consistently selected as pivot', explanation: 'Worst-case recursive depth reaches N when partitions are extremely unbalanced (1 and N-1).' },
      { id: 'opt-c', text: 'When duplicate values are completely absent', explanation: 'Absence of duplicates does not degrade partitioning.' },
      { id: 'opt-d', text: 'When memory allocation fails during recursion', explanation: 'Memory failure throws stack overflow, not O(N^2) time complexity.' },
    ],
    correctOptionIndex: 1,
    explanation: 'Extremely unbalanced splits produce a recursion depth of N with O(N) operations per level, yielding O(N^2).',
  },
  {
    id: 'q-103',
    questionText: 'Apply Dijkstra\'s Shortest Path algorithm to a weighted graph with a negative edge weight. What is the expected outcome?',
    cognitiveLevel: 'K3',
    difficulty: 'Medium',
    points: 4,
    unitTopic: 'Graph Algorithms',
    options: [
      { id: 'opt-a', text: 'It will always find the correct shortest path without error', explanation: 'Dijkstra assumes non-negative edge weights because visited nodes are finalized greedily.' },
      { id: 'opt-b', text: 'It may yield incorrect shortest path distances because greedy assumptions fail once negative edges re-open visited nodes', explanation: 'Dijkstra does not re-evaluate shortest distances for nodes marked visited.' },
      { id: 'opt-c', text: 'It automatically converts negative weights to absolute positive values', explanation: 'Modifying weights alters actual path costs incorrectly.' },
      { id: 'opt-d', text: 'It raises an unhandled infinite recursion exception', explanation: 'Dijkstra does not recurse infinitely unless implemented recursively without visit tracking.' },
    ],
    correctOptionIndex: 1,
    explanation: 'Dijkstra\'s greedy choice property assumes adding an edge only increases path weight. Negative weights violate this assumption; Bellman-Ford should be used instead.',
  },
  {
    id: 'q-104',
    questionText: 'Analyze the architectural trade-off between Depth-First Search (DFS) and Breadth-First Search (BFS) for finding the shortest path in an unweighted graph.',
    cognitiveLevel: 'K4',
    difficulty: 'Hard',
    points: 5,
    unitTopic: 'Graph Traversal',
    options: [
      { id: 'opt-a', text: 'DFS guarantees shortest path while using O(V) space', explanation: 'DFS does not guarantee shortest path in unweighted graphs.' },
      { id: 'opt-b', text: 'BFS guarantees shortest path in unweighted graphs by exploring level by level, requiring O(V) memory for its queue', explanation: 'BFS visits nodes layer by layer, guaranteeing the first discovery of destination is the shortest path.' },
      { id: 'opt-c', text: 'Both algorithms require identical memory and guarantee shortest paths', explanation: 'Memory consumption and path length guarantees differ fundamentally.' },
      { id: 'opt-d', text: 'BFS consumes O(1) space while DFS consumes O(V+E) space', explanation: 'BFS space is bounded by maximum width of graph level, which can be O(V).' },
    ],
    correctOptionIndex: 1,
    explanation: 'BFS explores distance in monotonically increasing order, guaranteeing shortest hop count for unweighted graphs.',
  },
  {
    id: 'q-105',
    questionText: 'Evaluate whether a Red-Black Tree or an AVL Tree is more suitable for a high-frequency insertion & deletion streaming workload.',
    cognitiveLevel: 'K5',
    difficulty: 'Hard',
    points: 5,
    unitTopic: 'Self-Balancing Trees',
    options: [
      { id: 'opt-a', text: 'AVL Tree, because its strict height balance minimizes lookup times regardless of write overhead', explanation: 'Strict balancing requires more frequent rotations on insert/delete.' },
      { id: 'opt-b', text: 'Red-Black Tree, because its relaxed balancing rules require fewer rotations during frequent insertions and deletions', explanation: 'Red-Black trees require at most 2 rotations on insert and 3 on delete, making writes faster.' },
      { id: 'opt-c', text: 'Neither, a simple Unbalanced Binary Search Tree is superior for high frequency writes', explanation: 'Unbalanced trees degenerate into O(N) linked lists.' },
      { id: 'opt-d', text: 'B-Tree, because it cannot be stored in RAM', explanation: 'B-Trees can be stored in RAM and are optimized for disk block accesses.' },
    ],
    correctOptionIndex: 1,
    explanation: 'Red-Black trees trade slightly deeper lookups for significantly faster insertions and deletions due to fewer rotations.',
  },
  {
    id: 'q-106',
    questionText: 'Synthesize a custom data structure design that supports O(1) insert, O(1) delete, and O(1) getRandom element operations.',
    cognitiveLevel: 'K6',
    difficulty: 'Hard',
    points: 5,
    unitTopic: 'Advanced Data Structure Design',
    options: [
      { id: 'opt-a', text: 'Combine a Dynamic Array (ArrayList) with a Hash Map mapping values to array indices', explanation: 'HashMap gives O(1) lookup & index mapping; swapping target element with last element in ArrayList enables O(1) deletion.' },
      { id: 'opt-b', text: 'Use a doubly linked list with a binary search tree index', explanation: 'BST operations take O(log N).' },
      { id: 'opt-c', text: 'Use a single Priority Queue (Min-Heap) with random seed generation', explanation: 'Heap deletion takes O(log N).' },
      { id: 'opt-d', text: 'Use a Circular Queue with fixed array allocation', explanation: 'Arbitrary element removal in array takes O(N) without index swap optimization.' },
    ],
    correctOptionIndex: 0,
    explanation: 'Combining a Hash Map (for index lookup) and Dynamic Array (for continuous index storage and swap-with-last removal) guarantees O(1) time complexity for all three operations.',
  }
];

const INITIAL_MOCK_SETS: QuestionSet[] = [
  {
    id: 'set-data-structures-master',
    title: 'Data Structures & Algorithms - Core Bloom Assessment Set',
    subject: 'Computer Science & Engineering',
    topic: 'Trees, Graphs & Sorting Algorithms',
    difficulty: 'Mixed',
    questionCount: 6,
    bloomMatrix: { K1: 1, K2: 1, K3: 1, K4: 1, K5: 1, K6: 1 },
    questions: INITIAL_MOCK_QUESTIONS,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    tags: ['Data Structures', 'Algorithms', 'Bloom K1-K6', 'CS Core'],
  },
  {
    id: 'set-operating-systems',
    title: 'Operating Systems & Concurrency Questions',
    subject: 'Computer Science & Engineering',
    topic: 'Process Scheduling & Synchronization',
    difficulty: 'Medium',
    questionCount: 4,
    bloomMatrix: { K1: 1, K2: 1, K3: 1, K4: 1, K5: 0, K6: 0 },
    questions: [
      {
        id: 'q-201',
        questionText: 'Which process state transition occurs when an I/O operation completes?',
        cognitiveLevel: 'K1',
        difficulty: 'Easy',
        points: 2,
        unitTopic: 'Process Management',
        options: [
          { id: 'opt-1', text: 'Running -> Terminated' },
          { id: 'opt-2', text: 'Waiting (Blocked) -> Ready' },
          { id: 'opt-3', text: 'Ready -> Running' },
          { id: 'opt-4', text: 'Running -> Waiting' },
        ],
        correctOptionIndex: 1,
        explanation: 'When I/O finishes, the process moves from Blocked/Waiting state to Ready queue for CPU scheduling.',
      },
      {
        id: 'q-202',
        questionText: 'Demonstrate how a Semaphore prevents Race Conditions in shared memory access.',
        cognitiveLevel: 'K2',
        difficulty: 'Medium',
        points: 3,
        unitTopic: 'Process Synchronization',
        options: [
          { id: 'opt-1', text: 'By increasing CPU clock frequency dynamically' },
          { id: 'opt-2', text: 'By maintaining an integer counter accessed atomically via wait() and signal() operations' },
          { id: 'opt-3', text: 'By disabling system interrupts globally permanently' },
          { id: 'opt-4', text: 'By storing shared variables on secondary disk storage' },
        ],
        correctOptionIndex: 1,
        explanation: 'Semaphores enforce mutual exclusion using atomic P() wait and V() signal operations.',
      }
    ],
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    tags: ['Operating Systems', 'Processes', 'Concurrency'],
  }
];

const INITIAL_MOCK_ASSESSMENTS: Assessment[] = [
  {
    id: 'asm-dsa-midterm-2026',
    title: 'Data Structures & Algorithms Formal Mid-Term Exam',
    description: 'Comprehensive time-bound examination covering trees, graphs, sorting algorithms, and complexity analysis.',
    durationMinutes: 45,
    type: 'formal',
    passingPercentage: 60,
    questions: INITIAL_MOCK_QUESTIONS,
    totalMarks: 24,
    accessControl: {
      isPublic: false,
      hasAccessCode: true,
      accessCode: 'DSA2026',
      domainRestrictions: ['@university.edu', '@institution.ac.in'],
      whitelistedEmails: ['student1@university.edu', 'candidate@institution.ac.in'],
    },
    proctoring: {
      trackTabSwitches: true,
      enforceFullscreen: true,
      maxTabSwitches: 3,
    },
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    attemptsCount: 18,
  },
  {
    id: 'asm-os-practice-test',
    title: 'Operating Systems Practice Quiz',
    description: 'Self-paced practice assessment for process scheduling and concurrency concepts.',
    durationMinutes: 20,
    type: 'practice',
    passingPercentage: 50,
    questions: INITIAL_MOCK_SETS[1].questions,
    totalMarks: 5,
    accessControl: {
      isPublic: true,
      hasAccessCode: false,
      accessCode: '',
      domainRestrictions: [],
      whitelistedEmails: [],
    },
    proctoring: {
      trackTabSwitches: false,
      enforceFullscreen: false,
      maxTabSwitches: 5,
    },
    status: 'active',
    createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
    attemptsCount: 42,
  }
];

const INITIAL_MOCK_ATTEMPTS: ExamAttempt[] = [
  {
    id: 'attempt-101',
    assessmentId: 'asm-dsa-midterm-2026',
    assessmentTitle: 'Data Structures & Algorithms Formal Mid-Term Exam',
    candidateName: 'Alex Mercer',
    candidateEmail: 'alex.mercer@university.edu',
    startTime: new Date(Date.now() - 3600000 * 4).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 3.3).toISOString(),
    durationSeconds: 2520,
    score: 21,
    totalMarks: 24,
    percentage: 87.5,
    passed: true,
    tabSwitchCount: 1,
    answers: {
      'q-101': 1,
      'q-102': 1,
      'q-103': 1,
      'q-104': 1,
      'q-105': 1,
      'q-106': 0,
    },
    markedForReview: ['q-104'],
    cognitiveBreakdown: {
      K1: { total: 2, correct: 2, percentage: 100 },
      K2: { total: 3, correct: 3, percentage: 100 },
      K3: { total: 4, correct: 4, percentage: 100 },
      K4: { total: 5, correct: 5, percentage: 100 },
      K5: { total: 5, correct: 5, percentage: 100 },
      K6: { total: 5, correct: 2, percentage: 40 },
    },
  },
  {
    id: 'attempt-102',
    assessmentId: 'asm-dsa-midterm-2026',
    assessmentTitle: 'Data Structures & Algorithms Formal Mid-Term Exam',
    candidateName: 'Jordan Vance',
    candidateEmail: 'jordan.vance@university.edu',
    startTime: new Date(Date.now() - 3600000 * 10).toISOString(),
    endTime: new Date(Date.now() - 3600000 * 9.2).toISOString(),
    durationSeconds: 2700,
    score: 14,
    totalMarks: 24,
    percentage: 58.3,
    passed: false,
    tabSwitchCount: 4, // Exceeded limit flag!
    answers: {
      'q-101': 1,
      'q-102': 0,
      'q-103': 1,
      'q-104': 0,
      'q-105': 1,
      'q-106': 2,
    },
    markedForReview: ['q-102', 'q-106'],
    cognitiveBreakdown: {
      K1: { total: 2, correct: 2, percentage: 100 },
      K2: { total: 3, correct: 0, percentage: 0 },
      K3: { total: 4, correct: 4, percentage: 100 },
      K4: { total: 5, correct: 0, percentage: 0 },
      K5: { total: 5, correct: 5, percentage: 100 },
      K6: { total: 5, correct: 0, percentage: 0 },
    },
  }
];

const INITIAL_MOCK_LOGS: GenerationLog[] = [
  {
    id: 'gen-log-01',
    subject: 'Computer Science & Engineering',
    topic: 'Trees, Graphs & Sorting Algorithms',
    difficulty: 'Mixed',
    questionCount: 6,
    bloomMatrix: { K1: 1, K2: 1, K3: 1, K4: 1, K5: 1, K6: 1 },
    timestamp: new Date(Date.now() - 86400000 * 2).toISOString(),
    status: 'completed',
    generatedSetId: 'set-data-structures-master',
  },
  {
    id: 'gen-log-02',
    subject: 'Computer Science & Engineering',
    topic: 'Process Scheduling & Synchronization',
    difficulty: 'Medium',
    questionCount: 4,
    bloomMatrix: { K1: 1, K2: 1, K3: 1, K4: 1, K5: 0, K6: 0 },
    timestamp: new Date(Date.now() - 86400000 * 5).toISOString(),
    status: 'completed',
    generatedSetId: 'set-operating-systems',
  }
];

interface MCQStoreState {
  questionSets: QuestionSet[];
  assessments: Assessment[];
  attempts: ExamAttempt[];
  generationLogs: GenerationLog[];
  
  // Selection state for Builder pre-population
  selectedQuestionsForBuilder: MCQQuestion[];
  
  // Actions
  addQuestionSet: (set: QuestionSet) => void;
  updateQuestionSet: (id: string, partial: Partial<QuestionSet>) => void;
  deleteQuestionSet: (id: string) => void;
  duplicateQuestionSet: (id: string) => void;
  addQuestionToSet: (setId: string, question: MCQQuestion) => void;
  updateQuestionInSet: (setId: string, questionId: string, partial: Partial<MCQQuestion>) => void;
  deleteQuestionFromSet: (setId: string, questionId: string) => void;
  
  addAssessment: (assessment: Assessment) => void;
  updateAssessment: (id: string, partial: Partial<Assessment>) => void;
  deleteAssessment: (id: string) => void;
  
  recordAttempt: (attempt: ExamAttempt) => void;
  addGenerationLog: (log: GenerationLog) => void;
  
  setSelectedQuestionsForBuilder: (questions: MCQQuestion[]) => void;
}

export const useMCQStore = create<MCQStoreState>()(
  persist(
    (set, get) => ({
      questionSets: INITIAL_MOCK_SETS,
      assessments: INITIAL_MOCK_ASSESSMENTS,
      attempts: INITIAL_MOCK_ATTEMPTS,
      generationLogs: INITIAL_MOCK_LOGS,
      selectedQuestionsForBuilder: [],

      addQuestionSet: (newSet) =>
        set((state) => ({ questionSets: [newSet, ...state.questionSets] })),

      updateQuestionSet: (id, partial) =>
        set((state) => ({
          questionSets: state.questionSets.map((s) => (s.id === id ? { ...s, ...partial } : s)),
        })),

      deleteQuestionSet: (id) =>
        set((state) => ({
          questionSets: state.questionSets.filter((s) => s.id !== id),
        })),

      duplicateQuestionSet: (id) => {
        const target = get().questionSets.find((s) => s.id === id);
        if (!target) return;
        const duplicated: QuestionSet = {
          ...target,
          id: `set-${Date.now()}`,
          title: `${target.title} (Copy)`,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ questionSets: [duplicated, ...state.questionSets] }));
      },

      addQuestionToSet: (setId, question) =>
        set((state) => ({
          questionSets: state.questionSets.map((s) => {
            if (s.id !== setId) return s;
            const updatedQuestions = [...s.questions, question];
            return {
              ...s,
              questions: updatedQuestions,
              questionCount: updatedQuestions.length,
            };
          }),
        })),

      updateQuestionInSet: (setId, questionId, partial) =>
        set((state) => ({
          questionSets: state.questionSets.map((s) => {
            if (s.id !== setId) return s;
            return {
              ...s,
              questions: s.questions.map((q) => (q.id === questionId ? { ...q, ...partial } : q)),
            };
          }),
        })),

      deleteQuestionFromSet: (setId, questionId) =>
        set((state) => ({
          questionSets: state.questionSets.map((s) => {
            if (s.id !== setId) return s;
            const updatedQuestions = s.questions.filter((q) => q.id !== questionId);
            return {
              ...s,
              questions: updatedQuestions,
              questionCount: updatedQuestions.length,
            };
          }),
        })),

      addAssessment: (newAssessment) =>
        set((state) => ({ assessments: [newAssessment, ...state.assessments] })),

      updateAssessment: (id, partial) =>
        set((state) => ({
          assessments: state.assessments.map((a) => (a.id === id ? { ...a, ...partial } : a)),
        })),

      deleteAssessment: (id) =>
        set((state) => ({
          assessments: state.assessments.filter((a) => a.id !== id),
        })),

      recordAttempt: (attempt) =>
        set((state) => ({
          attempts: [attempt, ...state.attempts],
          assessments: state.assessments.map((a) =>
            a.id === attempt.assessmentId ? { ...a, attemptsCount: (a.attemptsCount || 0) + 1 } : a
          ),
        })),

      addGenerationLog: (log) =>
        set((state) => ({ generationLogs: [log, ...state.generationLogs] })),

      setSelectedQuestionsForBuilder: (questions) =>
        set({ selectedQuestionsForBuilder: questions }),
    }),
    {
      name: 'syllabus-mcq-assessment-storage',
    }
  )
);
