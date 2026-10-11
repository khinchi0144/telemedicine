import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { ResetPasswordForm } from '@/components/auth/ResetPasswordForm';
import { InvalidLinkNotice } from '@/components/auth/InvalidLinkNotice';

export const metadata: Metadata = {
  title: 'Choose a new password',
  description: 'Set a new password for your MediCare account.',
};

/**
 * The token arrives as a query parameter from the emailed link.
 *
 * This page is a server component: it never trusts the token itself, it only
 * checks that one is present. Every real check (valid, expired, already used)
 * happens server side in `POST /api/auth/reset-password`.
 */
export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <AuthLayout
      title="Choose a new password"
      description="Pick a strong password you have not used on MediCare before. You will sign in with it straight away."
    >
      {token ? (
        <ResetPasswordForm token={token} />
      ) : (
        <InvalidLinkNotice
          title="This link is incomplete"
          description="Open the most recent password reset email and use the link exactly as it appears."
        />
      )}

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Changed your mind?{' '}
        <Link
          href="/auth/login"
          className="rounded-md font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          Back to login
        </Link>
      </p>
    </AuthLayout>
  );
}