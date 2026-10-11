'use client';

import * as React from 'react';
import Link from 'next/link';
import { CheckCircle2, KeyRound } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import type { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { PasswordField } from './PasswordField';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { resetPasswordSchema } from '@/lib/validations/auth';

type ResetValues = z.infer<typeof resetPasswordSchema>;

/**
 * Password reset completion form.
 *
 * The token comes from the emailed link and is posted alongside the new
 * password. On success the token is burned server side, so the link cannot be
 * replayed — the user must sign in with the new password.
 */
export function ResetPasswordForm({ token }: { token: string }) {
  const [done, setDone] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<ResetValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await apiRequest('/api/auth/reset-password', {
        method: 'POST',
        body: { token: values.token, password: values.password },
      });
      setDone(true);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'Something went wrong. Please try again.',
      );
    }
  });

  if (done) {
    return (
      <div className="space-y-5">
        <Alert variant="success" title="Password updated">
          Your password has been changed. You can sign in with it now.
        </Alert>
        <Button asChild block size="lg">
          <Link href="/auth/login">
            <CheckCircle2 aria-hidden="true" />
            Go to sign in
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <FormProvider {...form}>
        <PasswordField
          name="password"
          label="New password"
          autoComplete="new-password"
          showStrength
          hint="At least 8 characters with an uppercase letter, a lowercase letter and a number."
        />
        <PasswordField
          name="confirmPassword"
          label="Confirm new password"
          autoComplete="new-password"
        />
      </FormProvider>

      <Button type="submit" size="lg" block loading={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          'Updating…'
        ) : (
          <>
            <KeyRound aria-hidden="true" />
            Update password
          </>
        )}
      </Button>
    </form>
  );
}