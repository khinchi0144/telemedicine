import 'server-only';

import { env } from '@/lib/utils/env';
import { logger } from '@/lib/utils/logger';
import { APP_NAME } from '@/lib/constants/app';

/**
 * Transactional email abstraction.
 *
 * Mirrors the SMS gateway so the auth services never talk to a provider
 * directly: adding SES / Postmark / Resend is one case here, not a change
 * spread across the auth layer.
 *
 * Safety rules baked into this module:
 *   - a delivery failure NEVER blocks the request that triggered it (a user
 *     must still be able to register if the mail provider is down)
 *   - links are only written to the log in development
 *   - no medical information is ever included in a message
 */

export type EmailKind = 'VERIFY_EMAIL' | 'RESET_PASSWORD';

export interface EmailMessage {
  to: string;
  kind: EmailKind;
  /** Absolute URL the recipient follows. */
  actionUrl: string;
}

export async function sendTransactionalEmail(message: EmailMessage): Promise<boolean> {
  const subject = subjectFor(message.kind);
  const body = bodyFor(message);

  if (env.emailLogEnabled) {
    // Development: the link has to be reachable without a mail provider.
    logger.info('Email (not sent — development mode)', {
      kind: message.kind,
      // Recipient is logged; the token lives in the URL and is single use.
      to: message.to,
      link: message.actionUrl,
    });
    return true;
  }

  try {
    await deliver(message.to, subject, body);
    logger.info('Email sent', { kind: message.kind });
    return true;
  } catch (error) {
    // Never surface this to the caller: the account is created either way and
    // the user can request a new link.
    logger.error('Email delivery failed', {
      kind: message.kind,
      reason: error instanceof Error ? error.message : 'unknown',
    });
    return false;
  }
}

function subjectFor(kind: EmailKind): string {
  return kind === 'VERIFY_EMAIL'
    ? `Verify your ${APP_NAME} email address`
    : `Reset your ${APP_NAME} password`;
}

function bodyFor(message: EmailMessage): string {
  const intro =
    message.kind === 'VERIFY_EMAIL'
      ? 'Confirm your email address to activate your MediCare account.'
      : 'Use the link below to choose a new password. It can be used once.';

  return [
    `Hi,`,
    ``,
    intro,
    ``,
    message.actionUrl,
    ``,
    `If you did not request this, you can safely ignore this email.`,
    `— The ${APP_NAME} team`,
  ].join('\n');
}

/**
 * Actual delivery.
 *
 * A real provider (SES / Postmark / Resend) is wired here when its credentials
 * are configured. Until then this throws, and `sendTransactionalEmail` records
 * the failure without breaking the request.
 */
async function deliver(to: string, subject: string, body: string): Promise<void> {
  const apiKey = process.env.EMAIL_API_KEY;
  const from = process.env.EMAIL_FROM;
  const endpoint = process.env.EMAIL_API_URL;

  if (!apiKey || !from || !endpoint) {
    throw new Error(
      'No transactional email provider is configured (EMAIL_API_KEY / EMAIL_FROM / EMAIL_API_URL).',
    );
  }

  // Provider-agnostic HTTP call. Swap the URL/payload for the chosen vendor.
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from, to, subject, text: body }),
  });

  if (!response.ok) {
    throw new Error(`Provider responded with ${response.status}`);
  }
}