import 'server-only';

import { safeCompare } from '@/lib/utils/crypto';
import { Errors } from '@/lib/utils/errors';
import { env, getAllowedOrigins } from '@/lib/utils/env';
import { randomToken } from '@/lib/utils/crypto';

export const CSRF_COOKIE = 'medicare_csrf';
export const CSRF_HEADER = 'x-csrf-token';

/** 8 hours is plenty for a registration wizard. */
const CSRF_MAX_AGE = 60 * 60 * 8;

/** Creates a CSRF token if the request does not already carry one. */
export function createCsrfToken(): string {
  return randomToken(24);
}

export function csrfCookieOptions() {
  return {
    // Readable by the client so it can be echoed back in a header.
    httpOnly: false,
    sameSite: 'lax' as const,
    secure: env.isProduction,
    path: '/',
    maxAge: CSRF_MAX_AGE,
  };
}

/**
 * Rejects cross site form posts: the Origin (or Referer) must belong to the
 * application itself. Runs before the token comparison.
 */
export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  const candidate = origin ?? (referer ? safeOrigin(referer) : null);

  // Same-origin fetches from some browsers omit Origin on GET only; every
  // unsafe method in this app is expected to send it.
  if (!candidate) throw Errors.csrf();

  const allowed = getAllowedOrigins();
  const isAllowed = allowed.some((value) => candidate === value || candidate.startsWith(`${value}/`));
  if (!isAllowed) throw Errors.csrf();
}

function safeOrigin(url: string): string | null {
  try {
    return new URL(url).origin;
  } catch {
    return null;
  }
}

/**
 * Double submit cookie check. The client reads the cookie and sends it back in
 * the `x-csrf-token` header; an attacker on another origin can neither read
 * the cookie nor forge the header.
 */
export function assertCsrf(request: Request): void {
  assertSameOrigin(request);

  const cookieToken = readCookie(request, CSRF_COOKIE);
  const headerToken = request.headers.get(CSRF_HEADER);

  if (!cookieToken || !headerToken) throw Errors.csrf();
  if (!safeCompare(cookieToken, headerToken)) throw Errors.csrf();
}

function readCookie(request: Request, name: string): string | null {
  const header = request.headers.get('cookie');
  if (!header) return null;
  const match = header
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : null;
}
