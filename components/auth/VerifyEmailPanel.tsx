'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Loader2, MailCheck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { InvalidLinkNotice } from './InvalidLinkNotice';
import { apiRequest } from '@/lib/utils/api-client';

type Status = 'verifying' | 'done' | 'invalid';

/**
 * Consumes an email verification token.
 *
 * The token is posted once on mount. A success navigates to the dashboard, and
 * any failure (unknown, expired, already used) shows the same neutral notice,
 * because distinguishing them would leak which tokens are valid.
 */
export function VerifyEmailPanel({ token }: { token: string }) {
  const router = useRouter();
  const [status, setStatus] = React.useState<Status>('verifying');
  const [message, setMessage] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const result = await apiRequest<{
          verified: boolean;
          alreadyVerified: boolean;
          message: string;
        }>('/api/auth/verify-email', {
          method: 'POST',
          body: { token },
        });

        if (cancelled) return;
        setMessage(result.message);
        setStatus('done');
        // Give the success state a moment to register, then continue.
        setTimeout(() => router.push('/patient'), 1800);
      } catch (error) {
        if (cancelled) return;
        void error;
        setStatus('invalid');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token, router]);

  if (status === 'invalid') {
    return (
      <InvalidLinkNotice
        title="This verification link is not valid"
        description="Verification links can only be used once and expire after 24 hours. Request a fresh one and try again."
      />
    );
  }

  if (status === 'done') {
    return (
      <div className="space-y-5">
        <Alert variant="success" title="Email verified">
          {message ?? 'Your email address has been verified.'}
        </Alert>
        <Button asChild block size="lg">
          <a href="/patient">
            <CheckCircle2 aria-hidden="true" />
            Continue to your dashboard
          </a>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5 text-center" aria-live="polite">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-teal-50 text-primary">
        <Loader2 className="size-6 animate-spin" aria-hidden="true" />
      </span>
      <p className="text-sm text-muted-foreground">
        Confirming your email address…
      </p>
      <p className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <MailCheck className="size-3.5" aria-hidden="true" />
        This only takes a moment.
      </p>
    </div>
  );
}