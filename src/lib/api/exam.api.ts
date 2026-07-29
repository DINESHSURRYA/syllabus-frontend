/**
 * Exam Feature API Wrapper
 */

import { client } from './client';
import { API } from './endpoints';

export async function getExams() {
  return client.get(API.exam.list);
}
