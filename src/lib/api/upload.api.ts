/**
 * Upload Feature API Wrapper
 */

import { client } from './client';
import { API } from './endpoints';

export async function uploadFile(file: File) {
  const formData = new FormData();
  formData.append('file', file);
  return client.post(API.upload.file, formData);
}
