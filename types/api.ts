/** Shared API envelope used by every route handler. */

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'EMAIL_ALREADY_REGISTERED'
  | 'MOBILE_ALREADY_REGISTERED'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'OTP_MAX_ATTEMPTS'
  | 'OTP_NOT_VERIFIED'
  | 'INVALID_TOKEN'
  | 'EMAIL_NOT_VERIFIED'
  | 'RATE_LIMITED'
  | 'CSRF_INVALID'
  | 'INVALID_DOCUMENT_TYPE'
  | 'FILE_TOO_LARGE'
  | 'UPLOAD_FAILED'
  | 'ACCOUNT_SUSPENDED'
  | 'SERVER_ERROR';

export interface ApiFieldError {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  code: ApiErrorCode;
  message: string;
  fieldErrors?: ApiFieldError[];
}

export interface ApiSuccessBody<T> {
  data: T;
}

export type ApiResponseBody<T> = ApiSuccessBody<T> | ApiErrorBody;

export function isApiError<T>(body: ApiResponseBody<T>): body is ApiErrorBody {
  return 'code' in body && 'message' in body;
}
