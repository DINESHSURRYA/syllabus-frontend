/**
 * MCQ Feature API Wrapper
 * Standardized question generation and history API methods
 */

import { client } from './client';
import { API } from './endpoints';

export async function generateQuestions(payload: any) {
  return client.post(API.mcq.generate, payload);
}

export async function generateMcqQuestions(payload: any) {
  return generateQuestions(payload);
}

export async function fetchHistory() {
  return client.get(API.mcq.history);
}

export async function getMcqBank() {
  return fetchHistory();
}

export async function fetchHistoryById(id: string) {
  return client.get(API.mcq.historyById(id));
}

export async function getMcqHistoryById(id: string) {
  return fetchHistoryById(id);
}
