import type { Metadata } from 'next';
import Link from 'next/link';

import { AuthLayout } from '@/components/auth/AuthLayout';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Reset password',
  description: 'Request a password reset link for your MediCare account.',
};

export default function ForgotPasswordPage() {
  return (
    <AuthLayout
      title="Reset your password"
      description="Enter the mobile number or email registered with your account. We will send reset instructions if the account exists."
    >
      <ForgotPasswordForm />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        Remembered it?{' '}
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
