/**
 * Assessment Feature API Wrapper
 */

import { client } from './client';
import { API } from './endpoints';

export async function getAssessments() {
  return client.get(API.assessment.list);
}
