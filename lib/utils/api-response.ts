import { NextResponse } from 'next/server';

import { AppError, isAppError } from './errors';
import { logger } from './logger';
import type { ApiErrorBody, ApiErrorCode } from '@/types/api';

const STATUS_BY_CODE: Record<ApiErrorCode, number> = {
  VALIDATION_ERROR: 422,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  EMAIL_ALREADY_REGISTERED: 409,
  MOBILE_ALREADY_REGISTERED: 409,
  INVALID_OTP: 400,
  OTP_EXPIRED: 400,
  OTP_MAX_ATTEMPTS: 429,
  OTP_NOT_VERIFIED: 400,
  INVALID_TOKEN: 400,
  EMAIL_NOT_VERIFIED: 403,
  RATE_LIMITED: 429,
  CSRF_INVALID: 403,
  INVALID_DOCUMENT_TYPE: 400,
  FILE_TOO_LARGE: 413,
  UPLOAD_FAILED: 500,
  ACCOUNT_SUSPENDED: 403,
  SERVER_ERROR: 500,
};

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ data }, { status: 200, ...init });
}

export function created<T>(data: T) {
  return NextResponse.json({ data }, { status: 201 });
}

export function fail(error: AppError) {
  const body: ApiErrorBody = {
    code: error.code,
    message: error.message,
    ...(error.fieldErrors?.length ? { fieldErrors: error.fieldErrors } : {}),
  };
  return NextResponse.json(body, {
    status: error.status || STATUS_BY_CODE[error.code] || 400,
  });
}

/**
 * Converts anything thrown inside a route handler into a safe HTTP response.
 * Unexpected errors are logged server side (without sensitive data) and the
 * user only ever sees a generic message — raw database errors never leak.
 */
export function handleRouteError(error: unknown, context: string) {
  if (isAppError(error)) {
    if (error.status >= 500) {
      logger.error(`${context} failed`, { code: error.code });
    } else {
      logger.debug(`${context} rejected`, { code: error.code });
    }
    return fail(error);
  }

  logger.error(`${context} crashed`, {
    errorName: error instanceof Error ? error.name : 'UnknownError',
    // Deliberately no stack / message in production to avoid leaking internals.
    ...(process.env.NODE_ENV !== 'production' && error instanceof Error
      ? { reason: error.message }
      : {}),
  });
  return fail(
    new AppError(
      'SERVER_ERROR',
      'Something went wrong on our side. Please try again.',
      500,
    ),
  );
}
