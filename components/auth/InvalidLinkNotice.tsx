'use client';

import * as React from 'react';
import Link from 'next/link';
import { Loader2, TriangleAlert } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ApiError, apiRequest } from '@/lib/utils/api-client';

/**
 * Shown when a single use link is missing, already used or expired.
 *
 * Deliberately says nothing about *why* the link failed: revealing whether a
 * token existed would let an attacker probe for valid ones.
 */
export function InvalidLinkNotice({
  title,
  description,
  resend = false,
}: {
  title: string;
  description: string;
  /** Offers a "send me another link" action (needs a session). */
  resend?: boolean;
}) {
  const [sending, setSending] = React.useState(false);
  const [sent, setSent] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const resendLink = async () => {
    setSending(true);
    setError(null);
    try {
      await apiRequest('/api/auth/resend-verification', { method: 'POST' });
      setSent(true);
    } catch (submitError) {
      setError(
        submitError instanceof ApiError
          ? submitError.message
          : 'We could not send a new link. Please try again shortly.',
      );
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-5">
      <Alert variant="warning" title={title}>
        {description}
      </Alert>

      {sent && (
        <Alert variant="success" title="Check your inbox">
          If your address still needs confirming, a new link is on its way.
        </Alert>
      )}
      {error && <Alert variant="error">{error}</Alert>}

      {resend && !sent && (
        <Button
          type="button"
          variant="outline"
          block
          onClick={resendLink}
          disabled={sending}
          loading={sending}
        >
          {sending ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              Sending…
            </>
          ) : (
            <>
              <TriangleAlert aria-hidden="true" />
              Send me another link
            </>
          )}
        </Button>
      )}

      <Button asChild variant={resend ? 'ghost' : 'primary'} block>
        <Link href="/auth/login">Back to sign in</Link>
      </Button>
    </div>
  );
}