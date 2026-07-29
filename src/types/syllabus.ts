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
