'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { LogIn, UserPlus } from 'lucide-react';
import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { FormField, useFieldAria } from './FormField';
import { PasswordField } from './PasswordField';
import { GoogleButton } from './GoogleButton';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { loginSchema, type LoginInput } from '@/lib/validations/auth';
import type { LoginResult } from '@/types/auth';

export interface LoginFormProps {
  googleEnabled: boolean;
}

export function LoginForm({ googleEnabled }: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = React.useState<string | null>(null);
  const nextPath = searchParams.get('next');

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { identifier: '', password: '', rememberMe: true },
  });

  const identifierAria = useFieldAria('identifier', { required: true });

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);
    try {
      const result = await apiRequest<LoginResult>('/api/auth/login', {
        method: 'POST',
        body: {
          identifier: values.identifier,
          password: values.password,
          rememberMe: values.rememberMe,
        },
      });
      // Only same-origin, role scoped paths may be used as a redirect target.
      const safeNext =
        nextPath && nextPath.startsWith('/') && !nextPath.startsWith('//')
          ? nextPath
          : null;
      router.replace(safeNext ?? result.redirectTo);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
        Object.entries(error.toFieldErrors()).forEach(([field, value]) => {
          form.setError(field as keyof LoginInput, value);
        });
      } else {
        setServerError('Something went wrong. Please try again.');
      }
    }
  });

  return (
    <form onSubmit={onSubmit} className="space-y-5" noValidate>
      {serverError && <Alert variant="error">{serverError}</Alert>}

      <FormProvider {...form}>
        <FormField name="identifier" label="Mobile number or email" required>
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

      <div className="space-y-1.5">
        <FormProvider {...form}>
          <PasswordField
            name="password"
            label="Password"
            autoComplete="current-password"
            placeholder="Enter your password"
          />
        </FormProvider>
        <div className="flex justify-end pt-0.5">
          <Link
            href="/auth/forgot-password"
            className="rounded-md text-[13px] font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Forgot password?
          </Link>
        </div>
      </div>

      <label className="flex cursor-pointer items-center gap-2.5 text-sm text-muted-foreground">
        <input
          type="checkbox"
          className="size-4 rounded border-input accent-primary focus-visible:ring-2 focus-visible:ring-ring"
          {...form.register('rememberMe')}
        />
        Keep me signed in on this device
      </label>

      <Button type="submit" size="lg" block loading={form.formState.isSubmitting}>
        <LogIn aria-hidden="true" />
        Login
      </Button>

      <GoogleButton enabled={googleEnabled} />

      <p className="text-center text-sm text-muted-foreground">
        New to MediCare?{' '}
        <Link
          href="/auth/register"
          className="inline-flex items-center gap-1 rounded-md font-medium text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <UserPlus className="size-3.5" aria-hidden="true" />
          Create an account
        </Link>
      </p>
    </form>
  );
}
