/**
 * Analytics Feature API Wrapper
 */

import { client } from './client';
import { API } from './endpoints';

export async function getAnalyticsDashboard(courseId?: string) {
  const params = courseId ? { course_id: courseId } : undefined;
  return client.get(API.analytics.dashboard, { params });
}
