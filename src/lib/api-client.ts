/**
 * API Client for connecting Syllabus Frontend to Syllabus Backend
 */

import { AI_PROCESSING_PROMPT } from './constants';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function uploadSyllabusFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE_URL}/api/syllabus/upload`, {
    method: 'POST',
    body: formData,
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Upload failed (${res.status}): ${errText}`);
  }
  return res.json();
}



export async function generateTimeline(params: { courseId?: string; selectedUnitIds: string[]; targetHours: number; customHours?: number }) {
  const res = await fetch(`${API_BASE_URL}/api/timeline/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) throw new Error('Failed to generate timeline');
  return res.json();
}

export async function getAnalyticsDashboard(courseId?: string) {
  const url = courseId ? `${API_BASE_URL}/api/analytics/dashboard?course_id=${courseId}` : `${API_BASE_URL}/api/analytics/dashboard`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Failed to fetch analytics');
  return res.json();
}

export async function searchCurriculum(query: string) {
  const res = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}`);
  if (!res.ok) throw new Error('Search failed');
  return res.json();
}

export async function getTopicDetails(topicId: string) {
  const res = await fetch(`${API_BASE_URL}/api/curriculum/topics/${topicId}/details`);
  if (!res.ok) throw new Error('Failed to fetch topic details');
  return res.json();
}

export async function getBackendSettings() {
  const res = await fetch(`${API_BASE_URL}/api/settings`);
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function updateBackendSettings(settingsData: any) {
  const res = await fetch(`${API_BASE_URL}/api/settings`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(settingsData),
  });
  if (!res.ok) throw new Error('Failed to update settings');
  return res.json();
}

/**
 * Syllabus Repository Client APIs
 */
export async function getSyllabusList(params: {
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
}) {
  const query = new URLSearchParams();
  if (params.search) query.append('search', params.search);
  if (params.university) query.append('university', params.university);
  if (params.department) query.append('department', params.department);
  if (params.regulation) query.append('regulation', params.regulation);
  if (params.semester) query.append('semester', params.semester);
  if (params.academic_year) query.append('academic_year', params.academic_year);
  if (params.status) query.append('status', params.status);
  if (params.sort_by) query.append('sort_by', params.sort_by);
  if (params.order) query.append('order', params.order);
  if (params.page) query.append('page', params.page.toString());
  if (params.limit) query.append('limit', params.limit.toString());
  if (params.include_archived) query.append('include_archived', 'true');
  if (params.only_archived) query.append('only_archived', 'true');

  const res = await fetch(`${API_BASE_URL}/api/syllabus?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch syllabus repository list');
  return res.json();
}

export async function checkDuplicateSyllabus(file?: File, metadata?: any) {
  const formData = new FormData();
  if (file) {
    formData.append('file', file);
  }

  const res = await fetch(`${API_BASE_URL}/api/syllabus/check-duplicate`, {
    method: 'POST',
    body: file ? formData : JSON.stringify(metadata || {}),
    headers: file ? undefined : { 'Content-Type': 'application/json' },
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Duplicate check failed (${res.status}): ${errText}`);
  }
  return res.json();
}

export async function updateSyllabusRepository(courseId: string, updatedData: any) {
  const res = await fetch(`${API_BASE_URL}/api/syllabus/${encodeURIComponent(courseId)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(updatedData),
  });
  if (!res.ok) throw new Error('Failed to update syllabus');
  return res.json();
}

export async function deleteSyllabusRepository(courseId: string, archiveOnly: boolean = true) {
  const url = `${API_BASE_URL}/api/syllabus/${encodeURIComponent(courseId)}?archive_only=${archiveOnly}`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete syllabus');
  return res.json();
}

export async function restoreSyllabusRepository(courseId: string) {
  const url = `${API_BASE_URL}/api/syllabus/${encodeURIComponent(courseId)}/restore`;
  const res = await fetch(url, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to restore syllabus');
  return res.json();
}

export async function permanentDeleteSyllabusRepository(courseId: string) {
  const url = `${API_BASE_URL}/api/syllabus/${encodeURIComponent(courseId)}?permanent=true`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to permanently delete syllabus');
  return res.json();
}

export async function emptyRecycleBinRepository() {
  const url = `${API_BASE_URL}/api/syllabus/recycle-bin/empty`;
  const res = await fetch(url, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to empty recycle bin');
  return res.json();
}

export async function bulkDeleteRecycleBinRepository(syllabusIds: string[]) {
  const url = `${API_BASE_URL}/api/syllabus/recycle-bin/bulk-delete`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ syllabusIds }),
  });
  if (!res.ok) throw new Error('Failed to bulk delete selected syllabi');
  return res.json();
}

export async function bulkRestoreRecycleBinRepository(syllabusIds: string[]) {
  const url = `${API_BASE_URL}/api/syllabus/recycle-bin/bulk-restore`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ syllabusIds }),
  });
  if (!res.ok) throw new Error('Failed to bulk restore selected syllabi');
  return res.json();
}


export async function getSyllabusVersions(courseId: string) {
  const res = await fetch(`${API_BASE_URL}/api/syllabus/${encodeURIComponent(courseId)}/versions`);
  if (!res.ok) throw new Error('Failed to fetch versions');
  return res.json();
}

export async function restoreSyllabusVersion(courseId: string, versionNumber: number) {
  const res = await fetch(`${API_BASE_URL}/api/syllabus/${encodeURIComponent(courseId)}/restore-version`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ versionNumber }),
  });
  if (!res.ok) throw new Error('Failed to restore version');
  return res.json();
}

export async function deleteSyllabusVersion(courseId: string, versionNumber: number) {
  const res = await fetch(`${API_BASE_URL}/api/syllabus/${encodeURIComponent(courseId)}/versions/${versionNumber}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Failed to delete version');
  return res.json();
}

export async function verifySyllabusRepository(courseId: string) {
  const res = await fetch(`${API_BASE_URL}/api/syllabus/${encodeURIComponent(courseId)}/verify`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to verify syllabus');
  return res.json();
}

export function getSyllabusDownloadUrl(courseId: string, format: string) {
  return `${API_BASE_URL}/api/syllabus/${encodeURIComponent(courseId)}/download/${format}`;
}

export async function checkCourseCodeExists(courseCode: string): Promise<{ exists: boolean; message?: string }> {
  if (!courseCode || !courseCode.trim()) {
    return { exists: false };
  }
  const cleanCode = courseCode.trim().toUpperCase();

  try {
    const res = await fetch(`/api/syllabus/check-course-code?course_code=${encodeURIComponent(cleanCode)}`);
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn("Local route course code check failed, trying list search:", err);
  }

  try {
    const listData = await getSyllabusList({ search: cleanCode });
    const items = listData.items || [];
    const match = items.find((item: any) =>
      (item.courseCode || item.code || '').trim().toUpperCase() === cleanCode
    );
    if (match) {
      return { exists: true, message: 'Course code already exists' };
    }
    return { exists: false };
  } catch (err) {
    console.warn("Fallback course list search failed:", err);
  }

  return { exists: false };
}

export function getOriginalFileUrl(syllabusId: string) {
  return `${API_BASE_URL}/api/syllabus/${encodeURIComponent(syllabusId)}/file`;
}

export async function getCurriculumHierarchy(syllabusId: string, units?: string) {
  const query = new URLSearchParams();
  if (syllabusId) query.append('syllabusId', syllabusId);
  if (units) query.append('units', units);

  const res = await fetch(`${API_BASE_URL}/api/curriculum/hierarchy?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch curriculum hierarchy');
  return res.json();
}

export async function startExtraction(fileId: string, filename: string, courseCode?: string) {
  const codeParam = courseCode ? `&course_code=${encodeURIComponent(courseCode)}` : '';
  const res = await fetch(
    `${API_BASE_URL}/api/syllabus/extract?file_id=${encodeURIComponent(fileId)}&filename=${encodeURIComponent(filename)}${codeParam}`,
    {
      method: 'POST',
    }
  );
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Extraction initiation failed (${res.status}): ${errText}`);
  }
  return res.json();
}

/**
 * Poll processing status of background job
 */
export async function getProcessingStatus(jobId: string) {
  const res = await fetch(`${API_BASE_URL}/api/syllabus/processing-status/${jobId}`);
  if (!res.ok) throw new Error('Status check failed');
  return res.json();
}

/**
 * Direct Stage 2 Syllabus AI Processing Request
 */
export async function processSyllabus(
  documentText: string,
  promptText: string = AI_PROCESSING_PROMPT
) {
  const res = await fetch(`${API_BASE_URL}/api/syllabus/process`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      document_text: documentText,
      prompt: promptText,
    }),
  });

  if (!res.ok) {
    const errDetail = await res.text().catch(() => '');
    throw new Error(`Unable to connect to Processing Server (${res.status}): ${errDetail}`);
  }

  return res.json();
}

export async function getSyllabus(courseId: string) {
  const res = await fetch(`${API_BASE_URL}/api/syllabus/${courseId}`);
  if (!res.ok) throw new Error('Failed to fetch syllabus');
  return res.json();
}

export async function saveVerifiedSyllabus(courseId: string, courseData: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/api/syllabus/${encodeURIComponent(courseId)}/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(courseData),
    });
    if (res.ok) return await res.json();
  } catch (e) {
    console.warn("Direct courseId save failed, trying /api/syllabus/save fallback:", e);
  }

  const resFallback = await fetch(`${API_BASE_URL}/api/syllabus/save`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(courseData),
  });
  if (!resFallback.ok) {
    const errText = await resFallback.text().catch(() => '');
    throw new Error(`Failed to save syllabus to database (${resFallback.status}): ${errText}`);
  }
  return resFallback.json();
}

export async function getSyllabusTimeline(syllabusId: string) {
  const res = await fetch(`${API_BASE_URL}/api/timeline/syllabus/${encodeURIComponent(syllabusId)}`);
  if (!res.ok) throw new Error('Failed to fetch syllabus timeline state');
  return res.json();
}

/**
 * End-to-End Backend Syllabus Processing Pipeline
 * Frontend uploads original File via Multipart/FormData to FastAPI Backend.
 * Backend handles OCR, parsing, layout detection, and AI extraction exclusively.
 */
export async function uploadAndExtractSyllabusBackend(
  file: File,
  courseCode?: string,
  onProgress?: (stageIndex: number, totalStages: number, message: string) => void
) {
  // 1. Upload original file via Multipart/FormData to FastAPI backend (/api/syllabus/upload)
  const uploadRes = await uploadSyllabusFile(file);
  const fileId = uploadRes.fileId;
  const filename = uploadRes.filename || file.name;

  if (!fileId) {
    throw new Error('Backend file upload failed. No fileId returned.');
  }

  // 2. Trigger async background extraction job (/api/syllabus/extract)
  const extractRes = await startExtraction(fileId, filename, courseCode);
  const jobId = extractRes.jobId;

  if (!jobId) {
    throw new Error('Failed to initiate extraction pipeline on backend.');
  }

  // 3. Poll backend processing status (/api/syllabus/processing-status/{jobId})
  let completed = false;
  let attempts = 0;
  const maxAttempts = 180; // 6 minutes max
  let resultJson: any = null;

  while (!completed && attempts < maxAttempts) {
    attempts++;
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const statusRes = await getProcessingStatus(jobId);

    if (onProgress && statusRes.stageIndex && statusRes.totalStages) {
      onProgress(statusRes.stageIndex, statusRes.totalStages, statusRes.message || statusRes.currentStage || 'Processing...');
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

  // Check course code mismatch
  const extractedPdfCode = (
    resultJson.pdfCourseCode ||
    resultJson.courseCode ||
    resultJson.course_code ||
    (resultJson.course && resultJson.course.code) ||
    ""
  ).toUpperCase().replace(/\s+/g, "");

  const userCleanCode = (resultJson.userCourseCode || courseCode || "").toUpperCase().replace(/\s+/g, "");

  if (userCleanCode && extractedPdfCode && userCleanCode !== extractedPdfCode) {
    resultJson.isCodeMismatch = true;
    resultJson.userCourseCode = userCleanCode;
    resultJson.pdfCourseCode = extractedPdfCode;
    if (!resultJson.mismatchWarning) {
      resultJson.mismatchWarning = `Course Code Mismatch Warning: You entered '${userCleanCode}', but the uploaded document specifies course code '${extractedPdfCode}'. Please verify your document.`;
    }
  }

  const { normalizeBackendResponse } = await import('./normalizer');
  const normalized = normalizeBackendResponse(resultJson);

  return {
    success: true,
    syllabus: normalized,
    rawJson: resultJson,
    jobId,
  };
}


export async function generateCoPoMapping(params: {
  syllabusId?: string;
  courseCode?: string;
  courseName?: string;
  outcomes?: any[];
  units?: any[];
  syllabusData?: any;
}) {
  const res = await fetch(`${API_BASE_URL}/api/syllabus/generate-co-po-mapping`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    throw new Error(`Failed to generate CO-PO mapping (${res.status}): ${errText}`);
  }
  return res.json();
}




