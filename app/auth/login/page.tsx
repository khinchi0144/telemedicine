import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { LoginForm } from '@/components/auth/LoginForm';
import { getSessionUser } from '@/lib/auth/dal';
import { ROLE_HOME } from '@/lib/constants/roles';
import { isGoogleOAuthEnabled } from '@/lib/auth/oauth-config';

export const metadata: Metadata = {
  title: 'Login',
  description: 'Sign in to your MediCare account.',
};

export default async function LoginPage() {
  const user = await getSessionUser();
  if (user) redirect(ROLE_HOME[user.role] ?? '/patient');

  return (
    <AuthLayout
      title="Welcome back"
      description="Sign in with your registered mobile number or email address."
    >
      <LoginForm googleEnabled={isGoogleOAuthEnabled()} />
    </AuthLayout>
  );
}
