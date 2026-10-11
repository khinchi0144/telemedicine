'use client';

import * as React from 'react';
import { Mail, Send } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { FormField, useFieldAria } from './FormField';
import { Input } from '@/components/ui/input';
import { forgotPasswordSchema } from '@/lib/validations/auth';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import type { z } from 'zod';

type ForgotValues = z.infer<typeof forgotPasswordSchema>;

/**
 * Password reset request.
 *
 * The response is intentionally generic: it never reveals whether an account
 * exists, which prevents account enumeration.
 */
export function ForgotPasswordForm() {
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<ForgotValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { identifier: '' },
  });

  const identifierAria = useFieldAria('identifier', { required: true });

  const onSubmit = form.handleSubmit(async (values) => {
    setError(null);
    try {
      await apiRequest('/api/auth/forgot-password', {
        method: 'POST',
        body: values,
      });
      setSent(true);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'Something went wrong. Please try again.',
      );
    }
  });

  if (sent) {
    return (
      <div className="space-y-5">
        <Alert variant="success" title="Check your inbox">
          If an account exists for that mobile number or email, reset
          instructions have been sent. The link expires in 30 minutes.
        </Alert>
        <Button variant="outline" block onClick={() => setSent(false)}>
          Send to a different account
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {error && <Alert variant="error">{error}</Alert>}

      <FormProvider {...form}>
        <FormField
          name="identifier"
          label="Registered mobile number or email"
          required
        >
          <Input
            {...form.register('identifier')}
            {...identifierAria}
            type="text"
            inputMode="email"
            autoComplete="username"
            autoCapitalize="none"
            spellCheck={false}
            placeholder="98765 43210 or you@example.com"
          />
        </FormField>
      </FormProvider>

      <Button type="submit" size="lg" block loading={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? (
          'Sending…'
        ) : (
          <>
            <Send aria-hidden="true" />
            Send reset instructions
          </>
        )}
      </Button>

      <p className="flex items-start gap-2 text-xs leading-relaxed text-muted-foreground">
        <Mail className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        For your security we always show the same confirmation, whether or not
        the account exists.
      </p>
    </form>
  );
}
