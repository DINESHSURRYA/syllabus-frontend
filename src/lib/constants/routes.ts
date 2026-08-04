export const ROUTES = {
  HOME: '/',
  SPLASH: '/splash',
  DASHBOARD: '/dashboard',
  UPLOAD: '/upload',
  PROCESSING: '/processing',
  VERIFICATION: '/verification',
  SUCCESS: '/success',
  SYLLABUS: {
    LIST: '/syllabus',
    DETAIL: (id: string) => `/syllabus/${id}`,
  },
  CURRICULUM: '/curriculum',
  TIMELINE: '/timeline',
  ANALYTICS: '/analytics',
  MCQ: {
    BANK: '/mcq/bank',
    GENERATOR: '/mcq/generator',
  },
  EXAM: {
    PORTAL: '/exam/portal',
    RESULTS: (attemptId: string) => `/exam/results/${attemptId}`,
  },
  ASSESSMENTS: {
    BUILDER: '/assessments/builder',
    MANAGE: '/assessments/manage',
    ANALYTICS: '/assessments/analytics',
  },
  PROFILE: '/profile',
  SETTINGS: '/settings',
};
