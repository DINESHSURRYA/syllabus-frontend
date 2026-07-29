/**
 * Central API Endpoint Definitions
 * No hardcoded API endpoint strings should exist outside this file.
 */

export const API = {
  syllabus: {
    list: '/api/syllabus',
    upload: '/api/syllabus/upload',
    extract: '/api/syllabus/extract',
    verify: (id: string) => `/api/syllabus/${encodeURIComponent(id)}/verify`,
    save: (id?: string) => (id ? `/api/syllabus/${encodeURIComponent(id)}/save` : '/api/syllabus/save'),
    saveFallback: '/api/syllabus/save',
    getById: (id: string) => `/api/syllabus/${encodeURIComponent(id)}`,
    checkDuplicate: '/api/syllabus/check-duplicate',
    checkCourseCode: '/api/syllabus/check-course-code',
    archive: (id: string, archiveOnly: boolean = true) =>
      `/api/syllabus/${encodeURIComponent(id)}?archive_only=${archiveOnly}`,
    restore: (id: string) => `/api/syllabus/${encodeURIComponent(id)}/restore`,
    permanentDelete: (id: string) => `/api/syllabus/${encodeURIComponent(id)}?permanent=true`,
    emptyRecycleBin: '/api/syllabus/recycle-bin/empty',
    bulkDeleteRecycleBin: '/api/syllabus/recycle-bin/bulk-delete',
    bulkRestoreRecycleBin: '/api/syllabus/recycle-bin/bulk-restore',
    versions: (id: string) => `/api/syllabus/${encodeURIComponent(id)}/versions`,
    restoreVersion: (id: string) => `/api/syllabus/${encodeURIComponent(id)}/restore-version`,
    deleteVersion: (id: string, versionNumber: number) =>
      `/api/syllabus/${encodeURIComponent(id)}/versions/${versionNumber}`,
    download: (id: string, format: string) => `/api/syllabus/${encodeURIComponent(id)}/download/${format}`,
    file: (id: string) => `/api/syllabus/${encodeURIComponent(id)}/file`,
    processingStatus: (jobId: string) => `/api/syllabus/processing-status/${jobId}`,
    process: '/api/syllabus/process',
    generateCoPoMapping: '/api/syllabus/generate-co-po-mapping',
    saved: '/api/syllabus/saved',
  },

  curriculum: {
    hierarchy: '/api/curriculum/hierarchy',
    hierarchyById: (id: string) => `/api/curriculum/${encodeURIComponent(id)}/hierarchy`,
    analytics: '/api/curriculum/analytics',
    analyticsById: (id: string) => `/api/curriculum/analytics?syllabusId=${encodeURIComponent(id)}`,
    generate: '/api/curriculum/generate',
    generateHierarchy: '/api/curriculum/generate-hierarchy',
    generateUnitHierarchy: '/api/curriculum/generate-unit-hierarchy',
    courses: (courseId: string) => `/api/courses/${encodeURIComponent(courseId)}`,
    topicDetails: (topicId: string) => `/api/curriculum/topics/${encodeURIComponent(topicId)}/details`,
    search: '/api/search',
    ekgFullGraph: (courseId: string = 'default') => `/api/ekg/${encodeURIComponent(courseId)}/full-graph`,
    ekgTimePlan: (courseId: string = 'default', targetHours: number, periodDuration: number) =>
      `/api/ekg/${encodeURIComponent(courseId)}/time-plan?target_hours=${targetHours}&period_duration_mins=${periodDuration}`,
  },

  timeline: {
    generate: '/api/timeline/generate',
    generateTopics: '/api/timeline/generate-topics',
    bySyllabusId: (syllabusId: string) => `/api/timeline/syllabus/${encodeURIComponent(syllabusId)}`,
    all: '/api/timeline/all',
  },

  analytics: {
    dashboard: '/api/analytics/dashboard',
  },

  evaluator: {
    upload: '/api/evaluator/upload',
    startInterview: '/api/evaluator/start_interview',
    submitAnswer: '/api/evaluator/submit_answer',
    stopInterview: '/api/evaluator/stop_interview',
    chat: '/api/evaluator/chat',
    adminInterviews: '/api/evaluator/admin/interviews',
    adminInterviewDetail: (threadId: string) => `/api/evaluator/admin/interviews/${threadId}`,
    adminLogs: '/api/evaluator/admin/logs',
    report: (threadId: string) => `/api/evaluator/report/${threadId}`,
  },

  upload: {
    file: '/api/syllabus/upload',
  },

  verification: {
    verify: (id: string) => `/api/syllabus/${encodeURIComponent(id)}/verify`,
  },

  assessment: {
    list: '/api/assessment',
    attended: '/api/assessments/attended',
    attendedDetail: (candidateId: string, assessmentCode: string) =>
      `/api/assessments/attended/${encodeURIComponent(candidateId)}/${encodeURIComponent(assessmentCode)}`,
  },

  exam: {
    list: '/api/exam',
  },

  mcq: {
    generate: '/api/v1/questions/generate',
    history: '/api/v1/questions/history',
    historyById: (id: string) => `/api/v1/questions/history/${encodeURIComponent(id)}`,
    bank: '/api/v1/questions/history',
  },

  profile: {
    me: '/api/profile',
  },

  settings: {
    get: '/api/settings',
    update: '/api/settings',
  },

  dashboard: {
    stats: '/api/analytics/dashboard',
  },
} as const;
