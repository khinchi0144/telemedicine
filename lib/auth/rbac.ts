import type { Role, SessionClaims } from '@/types/auth';
import { ROLE_HOME } from '@/lib/constants/roles';

/**
 * Role based access control.
 *
 * Used by the proxy (fast redirect), by the server component guards and by
 * every API route. Client side hiding is never the only line of defence.
 */

export function isAuthenticated(claims: SessionClaims | null): claims is SessionClaims {
  return Boolean(claims?.sub);
}

export function hasRole(claims: SessionClaims | null, roles: Role[]): boolean {
  return isAuthenticated(claims) && roles.includes(claims.role);
}

export function homeForRole(role: Role): string {
  return ROLE_HOME[role] ?? '/auth';
}

/** Professional dashboards stay locked until an admin verifies the account. */
export function isAccountUsable(claims: SessionClaims | null): boolean {
  return isAuthenticated(claims) && claims.status === 'ACTIVE';
}

/**
 * Can this signed-in user open `pathname`?
 * `/admin` is reserved for ADMIN, every other protected area is role specific.
 */
export function canAccessPath(claims: SessionClaims | null, pathname: string): boolean {
  if (!isAuthenticated(claims)) return false;
  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return claims.role === 'ADMIN';
  }
  if (pathname.startsWith('/patient')) return claims.role === 'PATIENT';
  if (pathname.startsWith('/doctor')) return claims.role === 'DOCTOR';
  if (pathname.startsWith('/pharmacy')) return claims.role === 'PHARMACY';
  return true;
}

const PROTECTED_PREFIXES = ['/patient', '/doctor', '/pharmacy', '/admin'];

/** Route prefixes that require a session. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}

/** Paths a signed-in user should not see again (login / register). */
export function isAuthPath(pathname: string): boolean {
  return (
    pathname === '/auth' ||
    pathname === '/auth/login' ||
    pathname === '/auth/register' ||
    pathname.startsWith('/auth/register/') ||
    pathname === '/auth/forgot-password'
  );
}
