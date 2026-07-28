/**
 * Syllabus Data Normalizer
 * Converts raw JSON output from the backend syllabus processing service
 * into the structured SyllabusData schema expected by the frontend Zustand store.
 */

import { SyllabusData, UnitItem, TopicItem } from './store';

/**
 * Helper function to convert unit index/number to Roman Numeral string (e.g. 1 -> UNIT I, 2 -> UNIT II)
 */
export const getUnitRomanTitle = (unitIndex: number | string): string => {
  const romanMap = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const num = typeof unitIndex === "number" ? unitIndex : parseInt(String(unitIndex), 10);
  const index = isNaN(num) || num < 1 ? 0 : num - 1;
  return `UNIT ${romanMap[index] || (index + 1)}`;
};

export const getUnitRoman = (unitIndex: number | string): string => {
  const romanMap = ["I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
  const num = typeof unitIndex === "number" ? unitIndex : parseInt(String(unitIndex), 10);
  const index = isNaN(num) || num < 1 ? 0 : num - 1;
  return romanMap[index] || `${index + 1}`;
};

export function sanitizeText(text: string): string {
  if (!text || typeof text !== 'string') return '';
  return text
    .replace(/[\uFFFD\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, '')
    .trim();
}

/**
 * Format unit card header strictly as UNIT I, UNIT II, etc. along with clean title.
 * Strips duplicate prefixes like "Unit 1:", "Unit 2:", "UNIT I:", "UNIT II:".
 */
export const formatUnitHeader = (unitIndex: number | string, rawTitle?: string): string => {
  const romanTitle = getUnitRomanTitle(unitIndex);
  if (!rawTitle) return romanTitle;

  // Clean rawTitle by stripping leading unit prefixes such as "Unit 1:", "Unit 1 -", "UNIT I:", "UNIT II -", "Unit II", etc.
  let clean = sanitizeText(rawTitle)
    .replace(/^(unit\s*(\d+|[ivx]+)[\s:\-]*)+/i, '')
    .trim();

  // If clean title is empty or matches romanTitle or just digits/roman, return pure romanTitle
  if (!clean || clean.toUpperCase() === romanTitle || /^(\d+|[ivx]+)$/i.test(clean)) {
    return romanTitle;
  }

  return `${romanTitle}: ${clean}`;
};


export function normalizeBackendResponse(raw: any): SyllabusData {
  if (!raw) return createEmptySyllabus();

  const c = raw.course || raw;

  const isCodeMismatch = Boolean(raw.isCodeMismatch || c.isCodeMismatch || raw.is_code_mismatch);
  const userCourseCode = raw.userCourseCode || c.userCourseCode || raw.user_course_code || '';
  const pdfCourseCode = raw.pdfCourseCode || c.pdfCourseCode || raw.pdf_course_code || '';
  const mismatchWarning = raw.mismatchWarning || c.mismatchWarning || raw.mismatch_warning || '';

  const code = sanitizeText(c.code || c.courseCode || c.course_code || raw.courseCode || raw.course_code || '');
  const title = sanitizeText(c.title || c.courseName || c.course_name || c.name || raw.courseName || raw.course_name || '');
  const programme = sanitizeText(c.programme || raw.programme || '');
  const department = sanitizeText(c.department || raw.department || '');
  const semester = sanitizeText(c.semester || raw.semester || '');
  const credits = sanitizeText(String(c.credits ?? raw.credits ?? ''));

  const lecture = String(c.hours?.lecture ?? c.lectureHours ?? c.lecture_hours ?? raw.lectureHours ?? raw.lecture_hours ?? '');
  const tutorial = String(c.hours?.tutorial ?? c.tutorialHours ?? c.tutorial_hours ?? raw.tutorialHours ?? raw.tutorial_hours ?? '');
  const practical = String(c.hours?.practical ?? c.practicalHours ?? c.practical_hours ?? raw.practicalHours ?? raw.practical_hours ?? '');
  const total = String(c.hours?.total ?? c.hours ?? c.totalHours ?? c.total_hours ?? raw.hours ?? raw.totalHours ?? raw.total_hours ?? '');

  const prerequisites = sanitizeText(c.prerequisites || raw.prerequisites || '');
  
  const rawObjectives = Array.isArray(c.courseObjectives)
    ? c.courseObjectives
    : Array.isArray(c.objectives)
    ? c.objectives
    : Array.isArray(c.course_objectives)
    ? c.course_objectives
    : Array.isArray(raw.courseObjectives)
    ? raw.courseObjectives
    : Array.isArray(raw.objectives)
    ? raw.objectives
    : Array.isArray(raw.course_objectives)
    ? raw.course_objectives
    : [];
  const objectives = rawObjectives
    .map((o: any) => sanitizeText(typeof o === 'string' ? o : o?.description || String(o)))
    .filter(Boolean);

  const rawOutcomes = Array.isArray(c.courseOutcomes)
    ? c.courseOutcomes
    : Array.isArray(c.outcomes)
    ? c.outcomes
    : Array.isArray(c.course_outcomes)
    ? c.course_outcomes
    : Array.isArray(raw.courseOutcomes)
    ? raw.courseOutcomes
    : Array.isArray(raw.outcomes)
    ? raw.outcomes
    : Array.isArray(raw.course_outcomes)
    ? raw.course_outcomes
    : [];
  const outcomes = rawOutcomes
    .map((o: any) => {
      if (typeof o === 'string') return sanitizeText(o);
      if (o && typeof o === 'object') {
        const desc = o.description || o.statement || o.title || '';
        const code = o.code ? `${o.code}: ` : '';
        return sanitizeText(`${code}${desc}`.trim() || String(o));
      }
      return sanitizeText(String(o));
    })
    .filter(Boolean);

  const units = normalizeUnits(raw.units || c.units || []);
  const rawTextbooks = Array.isArray(raw.textbooks) ? raw.textbooks : Array.isArray(c.textbooks) ? c.textbooks : Array.isArray(raw.references) ? raw.references : [];
  const textbooks = rawTextbooks.map((b: any) => sanitizeText(typeof b === 'string' ? b : b?.title || String(b))).filter(Boolean);

  const rawRefBooks = Array.isArray(raw.reference_books) ? raw.reference_books : Array.isArray(c.reference_books) ? c.reference_books : Array.isArray(raw.references) ? raw.references : [];
  const reference_books = rawRefBooks.map((r: any) => sanitizeText(typeof r === 'string' ? r : r?.title || String(r))).filter(Boolean);

  const rawExps = Array.isArray(raw.labExperiments)
    ? raw.labExperiments
    : Array.isArray(raw.experiments)
    ? raw.experiments
    : Array.isArray(raw.lab_experiments)
    ? raw.lab_experiments
    : Array.isArray(c.labExperiments)
    ? c.labExperiments
    : Array.isArray(c.experiments)
    ? c.experiments
    : Array.isArray(c.lab_experiments)
    ? c.lab_experiments
    : [];

  const labExperiments = rawExps
    .map((e: any) => sanitizeText(typeof e === 'string' ? e : e.title || e.name || e.description || String(e)))
    .filter(Boolean);

  return {
    id: raw.id || code || `course_${Date.now()}`,
    isCodeMismatch,
    userCourseCode,
    pdfCourseCode,
    mismatchWarning,
    course: {
      code,
      title,
      programme,
      department,
      semester,
      credits,
      hours: { lecture, tutorial, practical, total },
      prerequisites,
      objectives,
      outcomes,
    },
    units,
    labExperiments,
    experiments: labExperiments,
    textbooks,
    reference_books,
    assessment: raw.assessment || c.assessment || {},
    additional_information: raw.additional_information || raw.additionalInfo || {},
    tables: Array.isArray(raw.tables) ? raw.tables : Array.isArray(c.tables) ? c.tables : [],
  };
}

function normalizeUnits(rawUnits: any[]): UnitItem[] {
  if (!Array.isArray(rawUnits)) return [];

  return rawUnits.map((u: any, idx: number) => {
    const unitNum = u.unit_number || u.unitNumber || u.number || idx + 1;
    const title = sanitizeText(u.title || u.name || `Unit ${unitNum}`);
    const hours = String(u.hours || u.learningHours || u.teaching_hours || '9');
    const unitLevel = sanitizeText(u.level || 'Unit');
    const unitReason = sanitizeText(u.hierarchyReason || u.hierarchy_reason || `Curriculum unit ${unitNum} establishing foundational knowledge domain.`);

    const topics: TopicItem[] = [];
    if (Array.isArray(u.topics)) {
      u.topics.forEach((t: any) => {
        if (typeof t === 'string') {
          const cleanT = sanitizeText(t);
          if (cleanT) {
            topics.push({
              name: cleanT,
              subtopics: [],
              level: 'Concept',
              hierarchyReason: `Foundational topic establishing core domain concept for ${cleanT}.`
            });
          }
        } else if (typeof t === 'object' && t !== null) {
          const topicName = sanitizeText(t.name || t.title || t.topic_name || 'Topic');
          const topicLevel = sanitizeText(t.level || 'Concept');
          const topicType = sanitizeText(t.type || 'Theory');
          const topicReason = sanitizeText(t.hierarchyReason || t.hierarchy_reason || `Core concept topic establishing structural knowledge for ${topicName}.`);
          const parentId = t.parentId || `u${unitNum}`;

          let subtopics: string[] = [];
          if (Array.isArray(t.subtopics)) {
            subtopics = t.subtopics
              .map((st: any) => sanitizeText(typeof st === 'string' ? st : st.title || st.name || String(st)))
              .filter(Boolean);
          }
          if (topicName) {
            topics.push({
              name: topicName,
              subtopics,
              level: topicLevel,
              type: topicType,
              hierarchyReason: topicReason,
              parentId
            });
          }
        }
      });
    }

    return {
      unit_number: unitNum,
      title,
      hours,
      level: unitLevel,
      hierarchyReason: unitReason,
      topics,
    };
  });
}

function createEmptySyllabus(): SyllabusData {
  return {
    course: {
      code: '',
      title: '',
      programme: '',
      department: '',
      semester: '',
      credits: '',
      hours: { lecture: '', tutorial: '', practical: '', total: '' },
      prerequisites: '',
      objectives: [],
      outcomes: [],
    },
    units: [],
    textbooks: [],
    reference_books: [],
    assessment: {},
    additional_information: {},
  };
}
