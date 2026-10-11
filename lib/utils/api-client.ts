'use client';

import type { ApiErrorBody, ApiErrorCode, ApiFieldError } from '@/types/api';

/**
 * Thin client for the MediCare API.
 *
 * Every mutation automatically carries the double submit CSRF token and the
 * credentials of the current origin. Errors are normalised into `ApiError`
 * so forms can show inline messages without knowing about HTTP.
 */
export class ApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors: ApiFieldError[];

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = body.code;
    this.fieldErrors = body.fieldErrors ?? [];
  }

  /** Map server field errors onto a react-hook-form compatible shape. */
  toFieldErrors(): Record<string, { message: string }> {
    return this.fieldErrors.reduce<Record<string, { message: string }>>(
      (acc, error) => {
        acc[error.field] = { message: error.message };
        return acc;
      },
      {},
    );
  }
}

export const CSRF_COOKIE_NAME = 'medicare_csrf';
export const CSRF_HEADER_NAME = 'x-csrf-token';

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split('=').slice(1).join('=')) : null;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Set to false for idempotent calls (e.g. sending an OTP). */
  csrf?: boolean;
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  url: string,
  options: RequestOptions = {},
): Promise<T> {
  const { method = 'GET', body, csrf = true, signal } = options;
  const isFormData = body instanceof FormData;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined && !isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  if (csrf && method !== 'GET') {
    const token = readCookie(CSRF_COOKIE_NAME);
    if (token) headers[CSRF_HEADER_NAME] = token;
  }

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : isFormData ? body : JSON.stringify(body),
      signal,
    });
  } catch {
    throw new ApiError(0, {
      code: 'SERVER_ERROR',
      message: 'We could not reach the server. Please check your connection.',
    });
  }

  const text = await response.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = null;
    }
  }

  if (!response.ok) {
    const body: ApiErrorBody =
      payload && typeof payload === 'object' && 'code' in payload
        ? (payload as ApiErrorBody)
        : {
            code: 'SERVER_ERROR',
            message: 'Something went wrong. Please try again.',
          };
    throw new ApiError(response.status, body);
  }

  return (payload as { data: T } | null)?.data as T;
}

/**
 * Upload with real progress reporting (fetch cannot report upload progress).
 * Falls back to apiRequest semantics and throws ApiError on failure.
 */
export function uploadWithProgress<T>(
  url: string,
  formData: FormData,
  onProgress?: (percent: number) => void,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('POST', url, true);
    xhr.withCredentials = true;
    xhr.setRequestHeader('Accept', 'application/json');
    const token = readCookie(CSRF_COOKIE_NAME);
    if (token) xhr.setRequestHeader(CSRF_HEADER_NAME, token);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    });

    xhr.addEventListener('load', () => {
      let payload: unknown = null;
      try {
        payload = JSON.parse(xhr.responseText || 'null');
      } catch {
        payload = null;
      }
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve((payload as { data: T })?.data);
        return;
      }
      const body: ApiErrorBody =
        payload && typeof payload === 'object' && 'code' in payload
          ? (payload as ApiErrorBody)
          : {
              code: 'UPLOAD_FAILED',
              message: 'The file could not be uploaded. Please try again.',
            };
      reject(new ApiError(xhr.status, body));
    });

    xhr.addEventListener('error', () =>
      reject(
        new ApiError(0, {
          code: 'UPLOAD_FAILED',
          message: 'The file could not be uploaded. Please try again.',
        }),
      ),
    );

    xhr.send(formData);
  });
}
