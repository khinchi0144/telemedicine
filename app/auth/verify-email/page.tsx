import type { Metadata } from 'next';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { VerifyEmailPanel } from '@/components/auth/VerifyEmailPanel';
import { InvalidLinkNotice } from '@/components/auth/InvalidLinkNotice';

export const metadata: Metadata = {
  title: 'Verify your email',
  description: 'Confirm your MediCare email address.',
};

/**
 * Landing page for the emailed verification link.
 *
 * Only the presence of a token is checked here; every meaningful check happens
 * server side in `POST /api/auth/verify-email`.
 */
export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthLayout
      title="Verify your email"
      description="Confirming your address keeps your MediCare account secure and lets us send you health reminders."
      showAside={false}
    >
      {token ? (
        <VerifyEmailPanel token={token} />
      ) : (
        <InvalidLinkNotice
          title="This link is incomplete"
          description="Open the most recent verification email and use the link exactly as it appears."
        />
      )}
    </AuthLayout>
  );
}