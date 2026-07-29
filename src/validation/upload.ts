import { ALLOWED_FILE_TYPES, MAX_UPLOAD_SIZE_BYTES } from '@/lib/constants/upload';

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateUploadFile(file: File): FileValidationResult {
  if (!file) {
    return { isValid: false, error: 'No file selected.' };
  }

  if (file.size > MAX_UPLOAD_SIZE_BYTES) {
    return { isValid: false, error: 'File size exceeds 50MB limit.' };
  }

  const ext = '.' + file.name.split('.').pop()?.toLowerCase();
  if (!ALLOWED_FILE_TYPES.includes(ext)) {
    return { isValid: false, error: `Invalid file extension (${ext}). Allowed: PDF, DOCX, TXT, JSON.` };
  }

  return { isValid: true };
}
