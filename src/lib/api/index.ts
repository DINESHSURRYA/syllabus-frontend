/**
 * Centralized API Module Barrel Export
 */

export * from './config';
export * from './endpoints';
export * from './client';

export * as syllabusApi from './syllabus.api';
export * as curriculumApi from './curriculum.api';
export * as analyticsApi from './analytics.api';
export * as timelineApi from './timeline.api';
export * as uploadApi from './upload.api';
export * as verificationApi from './verification.api';
export * as assessmentApi from './assessment.api';
export * as examApi from './exam.api';
export * as mcqApi from './mcq.api';
export * as profileApi from './profile.api';
export * as settingsApi from './settings.api';
export * as dashboardApi from './dashboard.api';

// Also direct function exports for convenient import access
export * from './syllabus.api';
export * from './curriculum.api';
export * from './analytics.api';
export * from './timeline.api';
export * from './upload.api';
export * from './verification.api';
export * from './assessment.api';
export * from './exam.api';
export * from './mcq.api';
export * from './profile.api';
export * from './settings.api';
export * from './dashboard.api';
