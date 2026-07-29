import { ENV } from './env';

export const API_CONFIG = {
  baseUrl: ENV.API_URL,
  timeoutMs: ENV.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  retries: 3,
};
