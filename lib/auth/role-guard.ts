import { redirect } from 'next/navigation';

import { getSessionUser } from '@/lib/auth/dal';
import { homeForRole } from '@/lib/auth/rbac';
import type { Role } from '@/types/auth';

/**
 * Layout level guard for a protected area.
 *
 * The check runs on the server before any page renders, so the protection
 * never depends on the client. The API repeats the same check for data access.
 */
export async function requireRoleLayout(allowed: Role[]) {
  const user = await getSessionUser();
  if (!user) redirect('/auth/login');
  if (!allowed.includes(user.role)) redirect(homeForRole(user.role));
  return user;
}
