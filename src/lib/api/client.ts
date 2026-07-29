/**
 * Reusable Centralized HTTP Client
 */

import { API_CONFIG } from './config';

export class ApiError extends Error {
  public status: number;
  public statusText: string;
  public data: any;

  constructor(status: number, statusText: string, data: any, message?: string) {
    const detailMsg =
      message ||
      (typeof data === 'string'
        ? data
        : data?.detail || data?.message || data?.error || statusText || `HTTP Error ${status}`);
    super(detailMsg);
    this.name = 'ApiError';
    this.status = status;
    this.statusText = statusText;
    this.data = data;
  }
}

export interface RequestOptions extends Omit<RequestInit, 'body'> {
  body?: any;
  params?: Record<string, string | number | boolean | undefined | null>;
  timeout?: number;
  authToken?: string;
  skipBaseUrl?: boolean;
}

// Token provider placeholder for future authentication
let authTokenGetter: (() => string | null) | null = null;
let tokenRefreshHandler: (() => Promise<string | null>) | null = null;

export function setAuthTokenGetter(getter: () => string | null) {
  authTokenGetter = getter;
}

export function setTokenRefreshHandler(handler: () => Promise<string | null>) {
  tokenRefreshHandler = handler;
}

/**
 * Builds full URL combining base URL, path, and query parameters.
 */
export function buildUrl(endpoint: string, params?: Record<string, any>, skipBaseUrl: boolean = false): string {
  let fullUrl: string;

  if (skipBaseUrl || endpoint.startsWith('http://') || endpoint.startsWith('https://')) {
    fullUrl = endpoint;
  } else {
    // Relative routes pointing to Next.js proxy (like /api/evaluator) should remain relative in browser
    if (endpoint.startsWith('/api/evaluator') || endpoint.startsWith('/api/syllabus/check-course-code')) {
      fullUrl = endpoint;
    } else {
      const base = API_CONFIG.baseUrl.endsWith('/') ? API_CONFIG.baseUrl.slice(0, -1) : API_CONFIG.baseUrl;
      const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
      fullUrl = `${base}${path}`;
    }
  }

  if (params) {
    const url = new URL(fullUrl, typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });
    return url.toString();
  }

  return fullUrl;
}

/**
 * Central HTTP Client implementation
 */
export async function httpClient<T = any>(endpoint: string, options: RequestOptions = {}): Promise<T> {
  const {
    body,
    params,
    headers = {},
    method = 'GET',
    timeout = API_CONFIG.timeout,
    authToken,
    skipBaseUrl = false,
    ...restOptions
  } = options;

  const url = buildUrl(endpoint, params, skipBaseUrl);

  const controller = new AbortController();
  const timeoutId = timeout > 0 ? setTimeout(() => controller.abort(), timeout) : null;

  // Prepare headers
  const reqHeaders: Record<string, string> = {};

  // Add default headers if body is not FormData
  if (!(body instanceof FormData)) {
    Object.assign(reqHeaders, API_CONFIG.defaultHeaders);
  }

  // Set explicit headers
  if (headers) {
    if (headers instanceof Headers) {
      headers.forEach((val, key) => {
        reqHeaders[key] = val;
      });
    } else if (Array.isArray(headers)) {
      headers.forEach(([key, val]) => {
        reqHeaders[key] = val;
      });
    } else {
      Object.assign(reqHeaders, headers);
    }
  }

  // Authorization token
  const token = authToken || (authTokenGetter ? authTokenGetter() : null);
  if (token && !reqHeaders['Authorization']) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  // Prepare body
  let reqBody: BodyInit | null = null;
  if (body !== undefined && body !== null) {
    if (body instanceof FormData || typeof body === 'string' || body instanceof Blob) {
      reqBody = body;
    } else {
      reqBody = JSON.stringify(body);
    }
  }

  try {
    const response = await fetch(url, {
      ...restOptions,
      method,
      headers: reqHeaders,
      body: reqBody,
      signal: controller.signal,
    });

    if (timeoutId) clearTimeout(timeoutId);

    // 401 Unauthorized handling (token refresh support)
    if (response.status === 401 && tokenRefreshHandler) {
      const newToken = await tokenRefreshHandler();
      if (newToken) {
        return httpClient<T>(endpoint, {
          ...options,
          authToken: newToken,
        });
      }
    }

    if (!response.ok) {
      let errorData: any;
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        errorData = await response.json().catch(() => ({}));
      } else {
        errorData = await response.text().catch(() => '');
      }
      throw new ApiError(response.status, response.statusText, errorData);
    }

    // Handle empty body responses
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return (await response.json()) as T;
    }

    return (await response.text()) as unknown as T;
  } catch (error: any) {
    if (timeoutId) clearTimeout(timeoutId);

    if (error.name === 'AbortError') {
      throw new ApiError(408, 'Request Timeout', null, `Request timed out after ${timeout}ms`);
    }

    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError(0, 'Network Error', null, error.message || 'Failed to communicate with server');
  }
}

export const client = {
  get: <T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}) =>
    httpClient<T>(endpoint, { ...options, method: 'GET' }),

  post: <T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    httpClient<T>(endpoint, { ...options, method: 'POST', body }),

  put: <T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    httpClient<T>(endpoint, { ...options, method: 'PUT', body }),

  patch: <T = any>(endpoint: string, body?: any, options: Omit<RequestOptions, 'method' | 'body'> = {}) =>
    httpClient<T>(endpoint, { ...options, method: 'PATCH', body }),

  delete: <T = any>(endpoint: string, options: Omit<RequestOptions, 'method'> = {}) =>
    httpClient<T>(endpoint, { ...options, method: 'DELETE' }),

  request: <T = any>(options: RequestOptions & { endpoint: string }) =>
    httpClient<T>(options.endpoint, options),
};
