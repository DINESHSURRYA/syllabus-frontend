/**
 * Central API Configuration
 * Manages Base URLs, Timeout, and Default Headers for HTTP Client
 */

export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  timeout: Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 300000,
  defaultHeaders: {
    'Content-Type': 'application/json',
  },
} as const;

export type ApiConfig = typeof API_CONFIG;
