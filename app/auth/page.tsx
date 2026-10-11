import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthLanding } from '@/components/auth/AuthLanding';
import { getSessionUser } from '@/lib/auth/dal';
import { APP_TAGLINE } from '@/lib/constants/app';
import { ROLE_HOME } from '@/lib/constants/roles';

export const metadata: Metadata = {
  title: 'Welcome',
  description: APP_TAGLINE,
};

/**
 * Authentication landing page.
 * No role selection here — login and registration are offered first, and the
 * account type is chosen during registration.
 */
export default async function AuthPage() {
  const user = await getSessionUser();
  if (user) redirect(ROLE_HOME[user.role] ?? '/patient');

  return <AuthLanding />;
}
