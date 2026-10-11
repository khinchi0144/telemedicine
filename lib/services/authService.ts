import 'server-only';

import { getStore } from '@/lib/db';
import { hashPassword, verifyPassword } from '@/lib/auth/password';
import { toSessionUser } from '@/lib/auth/session';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { normalizeMobile } from '@/lib/utils/format';
import { env } from '@/lib/utils/env';
import { ROLE_HOME } from '@/lib/constants/roles';
import type { LoginResult, RegisterResult, SessionUser } from '@/types/auth';
import type { RegisterableRole } from '@/types/auth';
import { resolveFullName } from './userService';

/**
 * Authentication service.
 *
 * Orchestrates registration and login. All role specific record creation lives
 * in the patient / doctor / pharmacy services, so this module only deals with
 * identity concerns: uniqueness, password handling and account status.
 */

/** Normalises the login identifier (mobile number or email). */
export function parseIdentifier(identifier: string): {
  kind: 'email' | 'mobile';
  value: string;
} {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return { kind: 'email', value: trimmed.toLowerCase() };
  }
  return { kind: 'mobile', value: normalizeMobile(trimmed) };
}

export async function findUserByIdentifier(identifier: string) {
  const store = await getStore();
  const parsed = parseIdentifier(identifier);
  return parsed.kind === 'email'
    ? store.findUserByEmail(parsed.value)
    : store.findUserByMobile(parsed.value);
}

/**
 * Creates the user record shared by every registration flow.
 * Professional accounts start as PENDING_VERIFICATION and are never
 * auto-approved.
 */
export async function createUserForRegistration(input: {
  role: RegisterableRole;
  fullName: string;
  mobile: string;
  email: string;
  password?: string;
  status?: 'ACTIVE' | 'PENDING_VERIFICATION';
  /**
   * Only OAuth / already-proven identities start verified. Password accounts
   * stay unverified until the emailed link is opened.
   */
  isEmailVerified?: boolean;
}): Promise<{ userId: string; email: string; mobile: string }> {
  const store = await getStore();

  const existingMobile = await store.findUserByMobile(input.mobile);
  if (existingMobile) throw Errors.mobileTaken();

  const existingEmail = await store.findUserByEmail(input.email);
  if (existingEmail) throw Errors.emailTaken();

  const user = await store.createUser({
    role: input.role,
    email: input.email,
    mobile: input.mobile,
    passwordHash: input.password ? await hashPassword(input.password) : null,
    status: input.status ?? 'ACTIVE',
    isEmailVerified: input.isEmailVerified ?? false,
    isMobileVerified: true,
  });

  logger.info('Account created', { role: input.role, userId: user.id });

  return { userId: user.id, email: user.email ?? input.email, mobile: user.mobile };
}

export interface LoginInput {
  identifier: string;
  password: string;
}

export async function authenticate({
  identifier,
  password,
}: LoginInput): Promise<LoginResult> {
  const store = await getStore();
  const user = await findUserByIdentifier(identifier);

  // Uniform error message: never reveal whether the account exists.
  if (!user) {
    // Constant-ish work factor to avoid user enumeration by timing.
    await verifyPassword(password, '$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidinv');
    throw Errors.invalidCredentials();
  }

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) throw Errors.invalidCredentials();

  if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
    throw Errors.accountSuspended();
  }

  // Password accounts must confirm their address before signing in, but only
  // when the deployment enforces it. Administrators are exempt because their
  // accounts are provisioned internally.
  if (
    env.emailVerificationRequired &&
    !user.isEmailVerified &&
    user.role !== 'ADMIN'
  ) {
    throw Errors.emailNotVerified();
  }

  const fullName = await resolveFullName(user.id, user.role, user.email);
  const verificationStatus = await resolveVerificationStatus(user.id, user.role as RegisterableRole);

  const sessionUser: SessionUser = toSessionUser({
    id: user.id,
    role: user.role,
    email: user.email,
    mobile: user.mobile,
    status: user.status,
    fullName,
    verificationStatus,
  });

  await store.updateUser(user.id, { lastLoginAt: new Date() });
  logger.info('User signed in', { role: user.role, userId: user.id });

  return {
    user: sessionUser,
    redirectTo: ROLE_HOME[user.role] ?? '/patient',
  };
}

/** Builds the response returned after a successful registration. */
export function registrationResult(input: {
  userId: string;
  role: RegisterableRole;
  status: RegisterResult['status'];
  signedIn: boolean;
  /** Professional accounts only — the id the admin review queue keys on. */
  profileId?: string;
}): RegisterResult {
  return {
    userId: input.userId,
    role: input.role,
    status: input.status,
    signedIn: input.signedIn,
    ...(input.profileId ? { profileId: input.profileId } : {}),
    redirectTo: input.signedIn ? ROLE_HOME[input.role] : '/auth/login',
  };
}

async function resolveVerificationStatus(
  userId: string,
  role: RegisterableRole,
): Promise<string | null> {
  const store = await getStore();
  if (role === 'DOCTOR') {
    const profile = await store.getDoctorProfileByUserId(userId);
    return profile?.verificationStatus ?? null;
  }
  if (role === 'PHARMACY') {
    const profile = await store.getPharmacyProfileByUserId(userId);
    return profile?.verificationStatus ?? null;
  }
  return null;
}
