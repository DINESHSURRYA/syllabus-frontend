/**
 * Profile Feature API Wrapper
 */

import { client } from './client';
import { API } from './endpoints';

export async function getUserProfile() {
  return client.get(API.profile.me);
}
