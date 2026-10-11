'use client';

import * as React from 'react';
import { ArrowLeft, Clock, Loader2, RotateCw, ShieldCheck } from 'lucide-react';
import { useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { OTPInput } from './OTPInput';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { formatCountdown } from '@/lib/utils/format';
import type { RegisterableRole, SendOtpResult } from '@/types/auth';

const otpFormSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Please enter the 6 digit OTP.'),
});
type OtpFormValues = z.infer<typeof otpFormSchema>;

export interface OTPVerificationProps {
  role: RegisterableRole;
  mobile: string;
  maskedMobile: string;
  onVerified: () => void;
  onBack: () => void;
  /** Called when the user wants to correct the mobile number. */
  onChangeMobile?: () => void;
}

/**
 * Step 2 of every registration wizard: verify the 6 digit OTP.
 * Identical UX for patients, doctors and pharmacies.
 */
export function OTPVerification({
  role,
  mobile,
  maskedMobile,
  onVerified,
  onBack,
  onChangeMobile,
}: OTPVerificationProps) {
  const [challengeId, setChallengeId] = React.useState<string | null>(null);
  const [devOtp, setDevOtp] = React.useState<string | null>(null);
  const [secondsLeft, setSecondsLeft] = React.useState(0);
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [resending, setResending] = React.useState(false);

  const form = useForm<OtpFormValues>({
    resolver: zodResolver(otpFormSchema),
    defaultValues: { code: '' },
    mode: 'onSubmit',
  });

  const requestOtp = React.useCallback(
    async (isResend: boolean) => {
      setServerError(null);
      setResending(true);
      try {
        const result = await apiRequest<SendOtpResult>('/api/auth/send-otp', {
          method: 'POST',
          // The CSRF cookie is issued by the proxy on the first page load.
          body: { mobile, role, purpose: 'REGISTRATION' },
        });
        setChallengeId(result.challengeId);
        setDevOtp(result.devOtp ?? null);
        setSecondsLeft(result.resendAfterSeconds);
        if (isResend) {
          form.setValue('code', '');
          form.clearErrors('code');
        }
      } catch (error) {
        if (error instanceof ApiError) {
          setServerError(error.message);
          form.setError('code', { message: error.message });
        }
      } finally {
        setResending(false);
      }
    },
    [mobile, role, form],
  );

  // Request the first code as soon as the step is shown.
  // The call is deferred by a tick so the state updates land outside the
  // effect itself (no cascading render on mount).
  React.useEffect(() => {
    const timer = window.setTimeout(() => {
      void requestOtp(false);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [mobile, role, requestOtp]);

  React.useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((value) => Math.max(0, value - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [secondsLeft]);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!challengeId) return;
    setServerError(null);
    try {
      await apiRequest('/api/auth/verify-otp', {
        method: 'POST',
        body: { challengeId, code: values.code, role },
      });
      onVerified();
    } catch (error) {
      if (error instanceof ApiError) {
        setServerError(error.message);
        form.setError('code', { message: error.message });
      }
    }
  });

  const code = useWatch({ control: form.control, name: 'code' });
  const canResend = secondsLeft === 0 && !resending;


  return (
    <div className="space-y-6">
      <Alert variant="info" title={`We have sent a 6-digit OTP to ${maskedMobile}`}>
        Enter the code to verify your mobile number. It stays valid for a few minutes.
      </Alert>

      {devOtp && (
        <Alert variant="warning" title="Development mode">
          Mock OTP is enabled. Use{' '}
          <code className="rounded bg-warning/15 px-1.5 py-0.5 font-mono text-[13px] font-semibold">
            {devOtp}
          </code>{' '}
          to verify. This is never shown in production.
        </Alert>
      )}

      {serverError && <Alert variant="error">{serverError}</Alert>}

      <form onSubmit={onSubmit} className="space-y-5" noValidate>
        <div className="space-y-2">
          <label htmlFor="otp-code-0" className="text-[13.5px] font-medium text-foreground">
            Verification code
          </label>
          <OTPInput
            value={code}
            onChange={(value) => {
              form.setValue('code', value, { shouldValidate: true });
              if (serverError) setServerError(null);
            }}
            invalid={Boolean(form.formState.errors.code)}
            disabled={form.formState.isSubmitting}
            aria-describedby="field-code-error"
          />
          {form.formState.errors.code?.message && (
            <p
              id="field-code-error"
              role="alert"
              className="text-center text-[13px] font-medium text-destructive"
            >
              {form.formState.errors.code.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          size="lg"
          block
          loading={form.formState.isSubmitting}
          disabled={code.length !== 6}
        >
          <ShieldCheck aria-hidden="true" />
          Verify OTP
        </Button>
      </form>

      <div className="flex flex-col items-center gap-3 border-t border-border pt-5 text-sm">
        <Button type="button" variant="ghost" size="sm" disabled={!canResend} onClick={() => void requestOtp(true)}>
          {resending ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : (
            <RotateCw aria-hidden="true" />
          )}
          {secondsLeft > 0 ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" />
              Resend OTP in {formatCountdown(secondsLeft)}
            </span>
          ) : (
            'Resend OTP'
          )}
        </Button>

        <div className="flex items-center gap-4 text-muted-foreground">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 rounded-md font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back
          </button>
          {onChangeMobile && (
            <>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onChangeMobile}
                className="rounded-md font-medium text-foreground hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Change mobile number
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
