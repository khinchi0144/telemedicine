import type { ApiErrorCode, ApiFieldError } from '@/types/api';

/**
 * Application level error carrying a user safe message and a machine code.
 * Services throw these; route handlers translate them into HTTP responses.
 * Raw database/driver errors never reach the client.
 */
export class AppError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;
  readonly fieldErrors?: ApiFieldError[];

  constructor(
    code: ApiErrorCode,
    message: string,
    status = 400,
    fieldErrors?: ApiFieldError[],
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export const Errors = {
  validation: (message: string, fieldErrors?: ApiFieldError[]) =>
    new AppError('VALIDATION_ERROR', message, 422, fieldErrors),
  unauthorized: (message = 'Please sign in to continue.') =>
    new AppError('UNAUTHORIZED', message, 401),
  forbidden: (message = 'You do not have access to this resource.') =>
    new AppError('FORBIDDEN', message, 403),
  notFound: (message = 'The requested resource was not found.') =>
    new AppError('NOT_FOUND', message, 404),
  conflict: (message: string) => new AppError('CONFLICT', message, 409),
  emailTaken: () =>
    new AppError(
      'EMAIL_ALREADY_REGISTERED',
      'An account with this email address already exists. Try logging in instead.',
      409,
      [{ field: 'email', message: 'This email address is already registered.' }],
    ),
  mobileTaken: () =>
    new AppError(
      'MOBILE_ALREADY_REGISTERED',
      'An account with this mobile number already exists. Try logging in instead.',
      409,
      [{ field: 'mobile', message: 'This mobile number is already registered.' }],
    ),
  invalidOtp: () =>
    new AppError('INVALID_OTP', 'The OTP you entered is incorrect.', 400),
  otpExpired: () =>
    new AppError('OTP_EXPIRED', 'This OTP has expired. Please request a new one.', 400),
  otpMaxAttempts: () =>
    new AppError(
      'OTP_MAX_ATTEMPTS',
      'Too many incorrect attempts. Please request a new OTP.',
      429,
    ),
  otpNotVerified: () =>
    new AppError(
      'OTP_NOT_VERIFIED',
      'Please verify your mobile number before continuing.',
      400,
    ),
  rateLimited: (message = 'Too many requests. Please wait and try again.') =>
    new AppError('RATE_LIMITED', message, 429),
  csrf: () =>
    new AppError(
      'CSRF_INVALID',
      'Your session could not be verified. Please refresh the page and try again.',
      403,
    ),
  invalidDocumentType: (message = 'This document type is not allowed here.') =>
    new AppError('INVALID_DOCUMENT_TYPE', message, 400),
  fileTooLarge: (maxMb: number) =>
    new AppError(
      'FILE_TOO_LARGE',
      `The file is too large. Maximum allowed size is ${maxMb} MB.`,
      413,
    ),
  uploadFailed: () =>
    new AppError(
      'UPLOAD_FAILED',
      'We could not upload the file. Please try again.',
      500,
    ),
  accountSuspended: () =>
    new AppError(
      'ACCOUNT_SUSPENDED',
      'This account is not active. Please contact support.',
      403,
    ),
  invalidCredentials: () =>
    new AppError(
      'UNAUTHORIZED',
      'The mobile number / email or password you entered is incorrect.',
      401,
    ),
  /**
   * A verification or reset link is unknown, already used, or expired.
   * The message is deliberately identical in all three cases so an attacker
   * cannot probe which tokens exist.
   */
  emailNotVerified: () =>
    new AppError(
      'EMAIL_NOT_VERIFIED',
      'Please verify your email address before signing in. Check your inbox, or request a new link.',
      403,
    ),
  invalidToken: () =>
    new AppError(
      'INVALID_TOKEN',
      'This link is invalid or has expired. Please request a new one.',
      400,
    ),
  server: () =>
    new AppError(
      'SERVER_ERROR',
      'Something went wrong on our side. Please try again.',
      500,
    ),
};

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
