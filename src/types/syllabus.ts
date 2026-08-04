export interface TopicItem {
  name: string;
  subtopics: string[];
  level?: string;
  type?: string;
  hierarchyReason?: string;
  parentId?: string;
}

export interface UnitItem {
  unit_number: number;
  title: string;
  hours: string;
  level?: string;
  hierarchyReason?: string;
  topics: TopicItem[];
}

export interface SyllabusCourseHours {
  lecture: string;
  tutorial: string;
  practical: string;
  total: string;
}

export interface SyllabusCourse {
  code: string;
  title: string;
  programme: string;
  department: string;
  semester: string;
  credits: string;
  hours: SyllabusCourseHours;
  prerequisites: string;
  objectives: string[];
  outcomes: string[];
}

export interface SyllabusTable {
  id: string;
  category: string;
  page?: number;
  headers: string[];
  rows: string[][];
}

export interface SyllabusData {
  id?: string;
  isCodeMismatch?: boolean;
  userCourseCode?: string;
  pdfCourseCode?: string;
  mismatchWarning?: string;
  course: SyllabusCourse;
  units: UnitItem[];
  labExperiments?: string[];
  experiments?: string[];
  textbooks: string[];
  reference_books: string[];
  assessment: Record<string, any>;
  additional_information: Record<string, any>;
  tables?: SyllabusTable[];
}

export interface CourseOutcome {
  id: string;
  statement: string;
  bloomLevel?: string;
  mappingScores?: Record<string, number>;
}

export interface ProgramOutcome {
  id: string;
  code: string;
  title: string;
  description: string;
}

export interface CoPoMatrix {
  courseOutcomes: CourseOutcome[];
  programOutcomes: ProgramOutcome[];
  matrix: Record<string, Record<string, number>>;
}

export interface PendingExtractionFile {
  file: File;
  courseCode: string;
}

export interface ExtractionProgressState {
  isExtracting: boolean;
  step: number;
  progress: number;
  statusText: string;
  error?: string | null;
}

// ----------------------------------------------------------------------------
// Dynamic Syllabus Extraction & Interactive Cards Specifications
// ----------------------------------------------------------------------------

export interface CourseInfo {
  code: string;
  title: string;
  department: string;
  semester: string;
  credits: number;
  lecture_hours: number;
  tutorial_hours: number;
  practical_hours: number;
}

export interface Topic {
  title: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  bloom_level?: 'Remember' | 'Understand' | 'Apply' | 'Analyze' | 'Evaluate' | 'Create';
  dependency?: string;
  prerequisite?: string;
  subtopics: string[];
}

export interface Unit {
  unit_number: number;
  title: string;
  hours: number;
  topics: Topic[];
}

export interface DynamicCourseOutcome {
  code: string;
  description: string;
  bloom_level?: string;
}

export interface COPOMappingItem {
  co_code: string;
  po_code: string;
  correlation_value: number; // 0, 1, 2, 3
}

export interface Book {
  title: string;
  authors?: string;
  publisher?: string;
  year?: string;
  book_type?: 'textbook' | 'reference';
}

export interface SyllabusExtractionPayload {
  course_info: CourseInfo;
  units: Unit[];
  course_outcomes: DynamicCourseOutcome[];
  co_po_pso_matrix: COPOMappingItem[];
  textbooks: Book[];
  reference_books: Book[];
  assessment_pattern?: Record<string, any>;
}

export interface ExtractionJobResponse {
  id: string;
  filename: string;
  status: 'UPLOADING' | 'READING_PDF' | 'GPT_PROCESSING' | 'BUILDING_JSON' | 'VALIDATION' | 'COMPLETED' | 'FAILED';
  progress: number;
  logs: string[];
  extracted_json?: SyllabusExtractionPayload;
  error_message?: string;
}
