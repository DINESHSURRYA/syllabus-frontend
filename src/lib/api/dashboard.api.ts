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
    if (typeof data?.total === 'number') return data.total;
    if (typeof data?.count === 'number') return data.count;
    if (typeof data?.pagination?.totalItems === 'number') return data.pagination.totalItems;
    if (Array.isArray(data)) return data.length;
    if (Array.isArray(data?.items)) return data.items.length;
    return 0;
  } catch (err) {
    console.warn("Could not fetch total syllabi count:", err);
    return 0;
  }
}

