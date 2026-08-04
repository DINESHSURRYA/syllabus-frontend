/**
 * Dashboard Feature API Wrapper
 */

import { client } from './client';
import { API } from './endpoints';
import { getSyllabusList } from './syllabus.api';

export async function getDashboardStats(courseId?: string) {
  const params = courseId ? { course_id: courseId } : undefined;
  return client.get(API.dashboard.stats, { params });
}

export async function getSyllabusCount(): Promise<number> {
  try {
    const data = await getSyllabusList({ limit: 1 });
    if (typeof data?.pagination?.totalItems === 'number') return data.pagination.totalItems;
    if (typeof data?.totalItems === 'number') return data.totalItems;
    if (typeof data?.total === 'number') return data.total;
    if (typeof data?.count === 'number') return data.count;
    if (Array.isArray(data?.items) && data.items.length > 0) {
      // If limit was set to 1 but total items wasn't in pagination, fetch full list length
      const fullList = await getSyllabusList({ limit: 1000 });
      if (typeof fullList?.pagination?.totalItems === 'number') return fullList.pagination.totalItems;
      if (Array.isArray(fullList?.items)) return fullList.items.length;
      if (Array.isArray(fullList)) return fullList.length;
    }
    if (Array.isArray(data)) return data.length;
  } catch (err) {
    console.warn("Primary syllabus count fetch failed, trying saved syllabi fallback:", err);
  }

  try {
    const savedData = await client.get('/api/syllabuses/saved');
    if (Array.isArray(savedData)) return savedData.length;
    if (Array.isArray(savedData?.items)) return savedData.items.length;
    if (typeof savedData?.pagination?.totalItems === 'number') return savedData.pagination.totalItems;
  } catch (err) {
    console.warn("Secondary syllabus count fetch failed:", err);
  }

  return 0;
}

