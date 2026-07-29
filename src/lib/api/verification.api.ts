/**
 * Verification Feature API Wrapper
 */

import { client } from './client';
import { API } from './endpoints';

export async function verifySyllabus(courseId: string) {
  return client.post(API.verification.verify(courseId));
}
