/**
 * Settings Feature API Wrapper
 */

import { client } from './client';
import { API } from './endpoints';

export async function getBackendSettings() {
  return client.get(API.settings.get);
}

export async function updateBackendSettings(settingsData: any) {
  return client.put(API.settings.update, settingsData);
}
