import { NextResponse, type NextRequest } from 'next/server';

import { createCsrfToken, csrfCookieOptions, CSRF_COOKIE } from '@/lib/auth/csrf';
import { SESSION_COOKIE, verifySessionToken } from '@/lib/auth/session';
import { isAuthPath, isProtectedPath } from '@/lib/auth/rbac';

/**
 * Next.js Proxy (formerly middleware).
 *
 * Responsibilities — deliberately limited to fast, optimistic checks:
 *  1. issue the double submit CSRF cookie
 *  2. send anonymous users away from protected areas
 *  3. send signed in users away from the auth screens
 *
 * The authoritative checks live in the server layouts (lib/auth/dal.ts) and
 * in every API route, so protection never depends on the client or on this
 * file alone.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const sessionToken = request.cookies.get(SESSION_COOKIE)?.value;
  const claims = await verifySessionToken(sessionToken);

  let response: NextResponse;

  if (isProtectedPath(pathname) && !claims) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/login';
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    response = NextResponse.redirect(url);
  } else if (isAuthPath(pathname) && claims) {
    const url = request.nextUrl.clone();
    url.pathname = homeFor(claims.role);
    url.search = '';
    response = NextResponse.redirect(url);
  } else {
    response = NextResponse.next();
  }

  if (!request.cookies.get(CSRF_COOKIE)) {
    response.cookies.set(CSRF_COOKIE, createCsrfToken(), csrfCookieOptions());
  }

  return response;
}

function homeFor(role: string) {
  if (role === 'DOCTOR') return '/doctor';
  if (role === 'PHARMACY') return '/pharmacy';
  if (role === 'ADMIN') return '/admin';
  return '/patient';
}

export const config = {
  matcher: [
    /*
     * Everything except:
     *  - api routes      (they run their own guards)
     *  - next internals
     *  - public files and uploaded assets
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
