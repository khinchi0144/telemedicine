import 'server-only';

import { cache } from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';

import { getStore } from '@/lib/db';
import { Errors } from '@/lib/utils/errors';
import { homeForRole } from './rbac';
import {
  readSessionCookie,
  verifySessionToken,
  SESSION_COOKIE,
} from './session';
import type { Role, SessionClaims, SessionUser } from '@/types/auth';

/**
 * Data Access Layer.
 *
 * Every page, layout and route handler resolves the current user through this
 * module. It is the single place where a session is turned into a verified,
 * database backed user — the "authorisation as close to the data as possible"
 * pattern recommended by the Next.js security guide.
 */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const claims = await readSessionCookie();
  if (!claims) return null;
  return resolveUser(claims);
});

async function resolveUser(claims: SessionClaims): Promise<SessionUser | null> {
  const store = await getStore();
  const user = await store.findUserById(claims.sub);
  if (!user) return null;
  // A role or status change invalidates an existing cookie.
  if (user.role !== claims.role || user.status !== claims.status) return null;

  const fullName = await resolveFullName(store, user.id, user.role, user.email);
  const verificationStatus = await resolveVerificationStatus(
    store,
    user.id,
    user.role,
  );

  return {
    id: user.id,
    role: user.role,
    email: user.email,
    mobile: user.mobile,
    status: user.status,
    fullName,
    verificationStatus: (verificationStatus as SessionUser['verificationStatus']) ?? null,
  };
}

async function resolveFullName(
  store: Awaited<ReturnType<typeof getStore>>,
  userId: string,
  role: Role,
  email: string | null,
): Promise<string> {
  if (role === 'PATIENT') {
    const profile = await store.getPatientProfileByUserId(userId);
    if (profile?.fullName) return profile.fullName;
  }
  if (role === 'DOCTOR') {
    const profile = await store.getDoctorProfileByUserId(userId);
    if (profile?.fullName) return profile.fullName;
  }
  if (role === 'PHARMACY') {
    const profile = await store.getPharmacyProfileByUserId(userId);
    if (profile?.pharmacyName) return profile.pharmacyName;
    if (profile?.ownerName) return profile.ownerName;
  }
  return email?.split('@')[0] ?? 'MediCare user';
}

async function resolveVerificationStatus(
  store: Awaited<ReturnType<typeof getStore>>,
  userId: string,
  role: Role,
): Promise<string | null> {
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

// ---------------------------------------------------------------------------
// Server component guards (redirect based)
// ---------------------------------------------------------------------------

/** Page guard: sends anonymous visitors to the login page. */
export async function requireSession(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');
  return user;
}

/**
 * Role guard for a protected area (used by app/(role)/layout.tsx).
 * A signed-in user with the wrong role is redirected to their own home page
 * instead of seeing a confusing error.
 */
export async function requireRole(allowed: Role[]): Promise<SessionUser> {
  const user = await requireSession();
  if (!allowed.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}

// ---------------------------------------------------------------------------
// Route handler guards (throw based — used by the API)
// ---------------------------------------------------------------------------

/** API guard: returns the verified user or throws a 401/403 AppError. */
export async function requireApiUser(allowed?: Role[]): Promise<SessionUser> {
  const jar = await cookies();
  const claims = await verifySessionToken(jar.get(SESSION_COOKIE)?.value);
  if (!claims) throw Errors.unauthorized();

  const user = await resolveUser(claims);
  if (!user) throw Errors.unauthorized();
  if (user.status === 'SUSPENDED' || user.status === 'DELETED') {
    throw Errors.accountSuspended();
  }
  if (allowed && !allowed.includes(user.role)) throw Errors.forbidden();
  return user;
}

/** Optional variant: returns null instead of throwing. */
export async function getApiUser(): Promise<SessionUser | null> {
  try {
    return await requireApiUser();
  } catch {
    return null;
  }
}
