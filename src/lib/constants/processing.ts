export const DEFAULT_PROCESSING_BACKEND_URL =
  process.env.NEXT_PUBLIC_PROCESSING_BACKEND_URL || 'http://172.16.157.5:8080';

export const STAGE_2_STATUS_MESSAGES = [
  'Connecting to Processing Server...',
  'Uploading Extracted Content...',
  'Running AI Analysis...',
  'Identifying Course Details...',
  'Extracting Units...',
  'Organizing Topics...',
  'Generating Structured JSON...',
  'Finalizing...',
];
