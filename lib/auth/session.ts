import 'server-only';

import { cookies } from 'next/headers';
import { SignJWT, jwtVerify } from 'jose';

import { env, getSessionSecret } from '@/lib/utils/env';
import type { Role, SessionClaims, SessionUser, UserStatus } from '@/types/auth';

export const SESSION_COOKIE = 'medicare_session';
export const REGISTRATION_TICKET_COOKIE = 'medicare_registration';

const ISSUER = 'medicare';
const AUDIENCE = 'medicare:web';

function secretKey(): Uint8Array {
  return new TextEncoder().encode(getSessionSecret());
}

/**
 * Issues a signed, HTTP-only session cookie.
 *
 * The cookie only carries the user id, role and status — never personal or
 * medical data — so a tampered cookie cannot be used to read records.
 */
export async function createSessionToken(input: {
  userId: string;
  role: Role;
  status: UserStatus;
}): Promise<string> {
  return new SignJWT({ role: input.role, status: input.status })
    .setProtectedHeader({ alg: 'HS256' })
    .setSubject(input.userId)
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setIssuedAt()
    .setExpirationTime(`${env.SESSION_MAX_AGE}s`)
    .sign(secretKey());
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.isProduction,
    path: '/',
    maxAge: env.SESSION_MAX_AGE,
  };
}

export async function setSessionCookie(input: {
  userId: string;
  role: Role;
  status: UserStatus;
}) {
  const token = await createSessionToken(input);
  const store = await cookies();
  store.set(SESSION_COOKIE, token, sessionCookieOptions());
  return token;
}

export async function clearSessionCookie() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Verifies the session cookie signature and expiry. Never throws. */
export async function verifySessionToken(
  token: string | undefined,
): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secretKey(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    if (!payload.sub || typeof payload.role !== 'string') return null;
    return {
      sub: payload.sub,
      role: payload.role as Role,
      status: payload.status as UserStatus,
      iat: payload.iat ?? 0,
      exp: payload.exp ?? 0,
    };
  } catch {
    return null;
  }
}

export async function readSessionCookie(): Promise<SessionClaims | null> {
  const store = await cookies();
  return verifySessionToken(store.get(SESSION_COOKIE)?.value);
}

/** Build the safe user representation exposed to the UI. */
export function toSessionUser(input: {
  id: string;
  role: Role;
  email: string | null;
  mobile: string;
  status: UserStatus;
  fullName: string;
  verificationStatus?: string | null;
}): SessionUser {
  return {
    id: input.id,
    role: input.role,
    email: input.email,
    mobile: input.mobile,
    status: input.status,
    fullName: input.fullName,
    verificationStatus: (input.verificationStatus as SessionUser['verificationStatus']) ?? null,
  };
}
