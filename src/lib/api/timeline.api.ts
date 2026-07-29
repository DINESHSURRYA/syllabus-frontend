/**
 * Timeline Feature API Wrapper
 */

import { client } from './client';
import { API } from './endpoints';

export interface TimelineGenerateParams {
  courseId?: string;
  selectedUnitIds: string[];
  targetHours: number;
  customHours?: number;
}

export async function generateTimeline(params: TimelineGenerateParams) {
  return client.post(API.timeline.generate, params, { timeout: 180000 });
}

export async function generateTopicsProxy(unitTitle: string, totalHours: number, topics: any[]) {
  return client.post(API.timeline.generateTopics, { unitTitle, totalHours, topics });
}

export async function getSyllabusTimeline(syllabusId: string) {
  return client.get(API.timeline.bySyllabusId(syllabusId));
}
