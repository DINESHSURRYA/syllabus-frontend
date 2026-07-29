/**
 * Syllabus Feature API Wrapper
 */

import { client, buildUrl } from './client';
import { API } from './endpoints';
import { AI_PROCESSING_PROMPT } from '../constants';
import { normalizeBackendResponse } from '../normalizer';

export interface SyllabusListParams {
  search?: string;
  university?: string;
  department?: string;
  regulation?: string;
  semester?: string;
  academic_year?: string;
  status?: string;
  sort_by?: string;
  order?: string;
  page?: number;
  limit?: number;
  include_archived?: boolean;
  only_archived?: boolean;
}

export interface CoPoMappingParams {
  syllabusId?: string;
  courseCode?: string;
  courseName?: string;
  outcomes?: any[];
  units?: any[];
  syllabusData?: any;
}

export async function uploadSyllabusFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return client.post(API.syllabus.upload, formData, { timeout: 300000 });
}

export async function getSyllabusList(params: SyllabusListParams = {}) {
  const queryParams: Record<string, any> = {};
  if (params.search) queryParams.search = params.search;
  if (params.university) queryParams.university = params.university;
  if (params.department) queryParams.department = params.department;
  if (params.regulation) queryParams.regulation = params.regulation;
  if (params.semester) queryParams.semester = params.semester;
  if (params.academic_year) queryParams.academic_year = params.academic_year;
  if (params.status) queryParams.status = params.status;
  if (params.sort_by) queryParams.sort_by = params.sort_by;
  if (params.order) queryParams.order = params.order;
  if (params.page) queryParams.page = params.page;
  if (params.limit) queryParams.limit = params.limit;
  if (params.include_archived) queryParams.include_archived = 'true';
  if (params.only_archived) queryParams.only_archived = 'true';

  return client.get(API.syllabus.list, { params: queryParams });
}

export async function checkDuplicateSyllabus(file?: File, metadata?: any) {
  if (file) {
    const formData = new FormData();
    formData.append('file', file);
    return client.post(API.syllabus.checkDuplicate, formData);
  }
  return client.post(API.syllabus.checkDuplicate, metadata || {});
}

export async function updateSyllabusRepository(courseId: string, updatedData: any) {
  return client.put(API.syllabus.getById(courseId), updatedData);
}

export async function deleteSyllabusRepository(courseId: string, archiveOnly: boolean = true) {
  return client.delete(API.syllabus.archive(courseId, archiveOnly));
}

export async function restoreSyllabusRepository(courseId: string) {
  return client.post(API.syllabus.restore(courseId));
}

export async function permanentDeleteSyllabusRepository(courseId: string) {
  return client.delete(API.syllabus.permanentDelete(courseId));
}

export async function emptyRecycleBinRepository() {
  return client.delete(API.syllabus.emptyRecycleBin);
}

export async function bulkDeleteRecycleBinRepository(syllabusIds: string[]) {
  return client.post(API.syllabus.bulkDeleteRecycleBin, { syllabusIds });
}

export async function bulkRestoreRecycleBinRepository(syllabusIds: string[]) {
  return client.post(API.syllabus.bulkRestoreRecycleBin, { syllabusIds });
}

export async function getSyllabusVersions(courseId: string) {
  return client.get(API.syllabus.versions(courseId));
}

export async function restoreSyllabusVersion(courseId: string, versionNumber: number) {
  return client.post(API.syllabus.restoreVersion(courseId), { versionNumber });
}

export async function deleteSyllabusVersion(courseId: string, versionNumber: number) {
  return client.delete(API.syllabus.deleteVersion(courseId, versionNumber));
}

export async function verifySyllabusRepository(courseId: string) {
  return client.post(API.syllabus.verify(courseId));
}

export function getSyllabusDownloadUrl(courseId: string, format: string) {
  return buildUrl(API.syllabus.download(courseId, format));
}

export function getOriginalFileUrl(syllabusId: string) {
  return buildUrl(API.syllabus.file(syllabusId));
}

export async function checkCourseCodeExists(courseCode: string): Promise<{ exists: boolean; message?: string }> {
  if (!courseCode || !courseCode.trim()) {
    return { exists: false };
  }
  const cleanCode = courseCode.trim().toUpperCase();

  try {
    const res = await client.get('/api/syllabus/check-course-code', {
      params: { course_code: cleanCode },
      skipBaseUrl: true,
    });
    if (res) return res;
  } catch (err) {
    console.warn('Local route course code check failed, trying list search:', err);
  }

  try {
    const listData = await getSyllabusList({ search: cleanCode });
    const items = listData.items || [];
    const match = items.find(
      (item: any) => (item.courseCode || item.code || '').trim().toUpperCase() === cleanCode
    );
    if (match) {
      return { exists: true, message: 'Course code already exists' };
    }
    return { exists: false };
  } catch (err) {
    console.warn('Fallback course list search failed:', err);
  }

  return { exists: false };
}

export async function startExtraction(fileId: string, filename: string, courseCode?: string) {
  const params: Record<string, string> = {
    file_id: fileId,
    filename,
  };
  if (courseCode) params.course_code = courseCode;

  return client.post(API.syllabus.extract, undefined, { params, timeout: 300000 });
}

export async function getProcessingStatus(jobId: string) {
  return client.get(API.syllabus.processingStatus(jobId), { timeout: 300000 });
}

export async function processSyllabus(documentText: string, promptText: string = AI_PROCESSING_PROMPT) {
  return client.post(
    API.syllabus.process,
    {
      document_text: documentText,
      prompt: promptText,
    },
    { timeout: 300000 }
  );
}

export async function getSyllabus(courseId: string) {
  return client.get(API.syllabus.getById(courseId));
}

export const getSyllabusById = getSyllabus;

export async function saveVerifiedSyllabus(courseId: string, courseData: any) {
  try {
    return await client.post(API.syllabus.save(courseId), courseData);
  } catch (e) {
    console.warn('Direct courseId save failed, trying /api/syllabus/save fallback:', e);
  }

  return client.post(API.syllabus.saveFallback, courseData);
}

export async function uploadAndExtractSyllabusBackend(
  file: File,
  courseCode?: string,
  onProgress?: (stageIndex: number, totalStages: number, message: string, percentage?: number) => void
) {
  const uploadRes = await uploadSyllabusFile(file);
  const fileId = uploadRes.fileId;
  const filename = uploadRes.filename || file.name;

  if (!fileId) {
    throw new Error('Backend file upload failed. No fileId returned.');
  }

  const extractRes = await startExtraction(fileId, filename, courseCode);
  const jobId = extractRes.jobId;

  if (!jobId) {
    throw new Error('Failed to initiate extraction pipeline on backend.');
  }

  let completed = false;
  let attempts = 0;
  const maxAttempts = 180;
  let resultJson: any = null;

  while (!completed && attempts < maxAttempts) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const statusRes = await getProcessingStatus(jobId);

    if (onProgress && statusRes.stageIndex && statusRes.totalStages) {
      onProgress(
        statusRes.stageIndex,
        statusRes.totalStages,
        statusRes.message || statusRes.currentStage || 'Processing...',
        statusRes.percentage
      );
    }

    if (statusRes.status === 'completed' && statusRes.result) {
      completed = true;
      resultJson = statusRes.result;
    } else if (statusRes.status === 'failed') {
      throw new Error(statusRes.error || statusRes.message || 'Backend extraction processing failed.');
    }
  }

  if (!resultJson) {
    throw new Error('Extraction timed out. The backend server took longer than expected.');
  }

  const extractedPdfCode = (
    resultJson.pdfCourseCode ||
    resultJson.courseCode ||
    resultJson.course_code ||
    (resultJson.course && resultJson.course.code) ||
    ''
  )
    .toUpperCase()
    .replace(/\s+/g, '');

  const userCleanCode = (resultJson.userCourseCode || courseCode || '').toUpperCase().replace(/\s+/g, '');

  if (userCleanCode && extractedPdfCode && userCleanCode !== extractedPdfCode) {
    resultJson.isCodeMismatch = true;
    resultJson.userCourseCode = userCleanCode;
    resultJson.pdfCourseCode = extractedPdfCode;
    if (!resultJson.mismatchWarning) {
      resultJson.mismatchWarning = `Course Code Mismatch Warning: You entered '${userCleanCode}', but the uploaded document specifies course code '${extractedPdfCode}'. Please verify your document.`;
    }
  }

  const normalized = normalizeBackendResponse(resultJson);

  return {
    success: true,
    syllabus: normalized,
    rawJson: resultJson,
    jobId,
  };
}

export async function generateCoPoMapping(params: CoPoMappingParams) {
  return client.post(API.syllabus.generateCoPoMapping, params, { timeout: 0 });
}
