import { SyllabusData } from './syllabus';

export interface CurriculumCourse {
  code: string;
  name: string;
  credits: number;
  type: 'Theory' | 'Lab' | 'Project' | 'Elective';
  syllabusStatus: 'complete' | 'draft' | 'missing' | 'processing';
  description?: string;
  hasSyllabus?: boolean;
}

export interface CurriculumSemester {
  semesterNumber: number;
  totalCredits: number;
  courses: CurriculumCourse[];
}

export interface DepartmentCurriculum {
  departmentCode: string;
  departmentName: string;
  degreeProgram: string;
  academicYear: string;
  semesters: CurriculumSemester[];
}

export interface DepartmentSummary {
  code: string;
  name: string;
  courseCount: number;
  syllabusCount: number;
  completionRate: number;
}
