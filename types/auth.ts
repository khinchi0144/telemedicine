/**
 * Shared authentication & identity types.
 * These types are the contract between the UI, the API routes and the
 * service layer — they never leak database internals.
 */

export const ROLES = ['PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN'] as const;
export type Role = (typeof ROLES)[number];

export const USER_STATUSES = [
  'ACTIVE',
  'PENDING_VERIFICATION',
  'REJECTED',
  'SUSPENDED',
  'DELETED',
] as const;
export type UserStatus = (typeof USER_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  'PENDING_VERIFICATION',
  'VERIFIED',
  'REJECTED',
  'SUSPENDED',
] as const;
export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const OTP_PURPOSES = ['REGISTRATION', 'LOGIN', 'RESET_PASSWORD'] as const;
export type OtpPurpose = (typeof OTP_PURPOSES)[number];

/** Roles that can start a registration flow (admin accounts are provisioned). */
export const REGISTERABLE_ROLES = ['PATIENT', 'DOCTOR', 'PHARMACY'] as const;
export type RegisterableRole = (typeof REGISTERABLE_ROLES)[number];

/** Minimal, safe user representation attached to a session. */
export interface SessionUser {
  id: string;
  role: Role;
  fullName: string;
  email: string | null;
  mobile: string;
  status: UserStatus;
  /** Present for professional accounts (doctor / pharmacy). */
  verificationStatus?: VerificationStatus | null;
}

/** Claims encoded (signed, not encrypted) inside the session cookie. */
export interface SessionClaims {
  sub: string;
  role: Role;
  status: UserStatus;
  /** Issued at (seconds). */
  iat: number;
  /** Expiry (seconds). */
  exp: number;
}

/** Claims of the short lived "mobile number verified" ticket. */
export interface RegistrationTicketClaims {
  /** Ticket id — documents uploaded before the account exists use it. */
  jti: string;
  role: RegisterableRole;
  mobile: string;
  purpose: OtpPurpose;
  iat: number;
  exp: number;
}

/** Result of requesting an OTP. */
export interface SendOtpResult {
  challengeId: string;
  /** Seconds the client must wait before requesting a new code. */
  resendAfterSeconds: number;
  expiresInSeconds: number;
  /** Only populated when MOCK_OTP_ENABLED=true (development only). */
  devOtp?: string;
  /** Phone number partially masked, e.g. +91 98******10. */
  maskedMobile: string;
}

/** Result of verifying an OTP. */
export interface VerifyOtpResult {
  verified: true;
  registrationId: string;
  expiresInSeconds: number;
}

export interface LoginResult {
  user: SessionUser;
  redirectTo: string;
}

export interface RegisterResult {
  userId: string;
  role: RegisterableRole;
  status: UserStatus;
  /** Where the client should send the user after a successful registration. */
  redirectTo: string;
  /** True when the client is also signed in (patient registration). */
  signedIn: boolean;
  /**
   * Role profile id for professional registrations (doctor / pharmacy).
   * Lets an operator reference the profile that is awaiting verification.
   */
  profileId?: string;
}

export function isRegisterableRole(value: unknown): value is RegisterableRole {
  return (
    typeof value === 'string' &&
    (REGISTERABLE_ROLES as readonly string[]).includes(value)
  );
}
