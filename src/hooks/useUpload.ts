"use client";

import { useState } from 'react';
import { useSyllabusStore } from '@/stores/syllabus.store';
import { validateUploadFile } from '@/validation/upload';

export function useUpload() {
  const { setPendingExtraction, setExtractionProgress, clearPendingExtraction } = useSyllabusStore();
  const [file, setFile] = useState<File | null>(null);
  const [courseCode, setCourseCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSelectFile = (selectedFile: File) => {
    const validation = validateUploadFile(selectedFile);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid file');
      setFile(null);
      return;
    }
    setError(null);
    setFile(selectedFile);
  };

  const handleStartUpload = () => {
    if (!file) {
      setError('Please select a file to upload.');
      return;
    }
    setPendingExtraction({ file, courseCode });
    setExtractionProgress({ isExtracting: true, step: 1, progress: 10, statusText: 'Preparing upload...' });
  };

  return {
    file,
    courseCode,
    error,
    setCourseCode,
    handleSelectFile,
    handleStartUpload,
    clearPendingExtraction,
  };
}
