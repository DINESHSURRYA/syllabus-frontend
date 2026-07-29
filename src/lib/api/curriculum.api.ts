/**
 * Curriculum Feature API Wrapper
 */

import { client } from './client';
import { API } from './endpoints';

export async function getCurriculumHierarchy(syllabusId?: string, units?: string, forceRegenerate?: boolean) {
  const params: Record<string, string> = {};
  if (syllabusId) params.syllabusId = syllabusId;
  if (units) params.units = units;
  if (forceRegenerate) params.forceRegenerate = 'true';

  return client.get(API.curriculum.hierarchy, { params });
}

export async function getCurriculumAnalytics(syllabusId?: string) {
  const params: Record<string, string> = {};
  if (syllabusId) params.syllabusId = syllabusId;
  return client.get(API.curriculum.analytics, { params });
}

export async function searchCurriculum(query: string) {
  return client.get(API.curriculum.search, { params: { q: query } });
}

export async function getTopicDetails(topicId: string) {
  return client.get(API.curriculum.topicDetails(topicId));
}

export async function fetchCourseFromPostgres(courseId: string) {
  return client.get(API.curriculum.courses(courseId));
}

export async function generateHierarchy(payload: {
  courseCode?: string;
  courseTitle?: string;
  unit?: string;
  topics: string[];
}) {
  return client.post(API.curriculum.generateHierarchy, payload);
}

export async function generateUnitHierarchy(payload: any) {
  return client.post(API.curriculum.generateUnitHierarchy, payload);
}

export async function getEkgFullGraph(courseId: string = 'default') {
  return client.get(API.curriculum.ekgFullGraph(courseId));
}

export async function getEkgTimePlan(courseId: string = 'default', targetHours: number = 45, periodDuration: number = 50) {
  return client.get(API.curriculum.ekgTimePlan(courseId, targetHours, periodDuration));
}
