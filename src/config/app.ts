import { ENV } from './env';

export const APP_CONFIG = {
  name: ENV.APP_NAME,
  version: '2.0.0',
  description: 'AI-Powered Syllabus Intelligence & Assessment Platform',
  maxUploadSizeBytes: 50 * 1024 * 1024, // 50MB
  allowedUploadExtensions: ['.pdf', '.docx', '.json', '.txt'],
  pagination: {
    defaultPageSize: 10,
    maxPageSize: 100,
  },
};
