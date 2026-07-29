export const MAX_UPLOAD_SIZE = 50; // MB
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE * 1024 * 1024;
export const ALLOWED_FILE_TYPES = ['.pdf', '.txt', '.docx', '.json'];
export const ACCEPT_MAP = {
  'application/pdf': ['.pdf'],
  'text/plain': ['.txt'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/json': ['.json'],
};
