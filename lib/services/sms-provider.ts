import 'server-only';

import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { APP_NAME } from '@/lib/constants/app';
import type { OtpPurpose, RegisterableRole } from '@/types/auth';

/**
 * SMS gateway abstraction.
 *
 * The OTP service never talks to a provider directly, so a new gateway only
 * requires a new case here. Messages never contain medical information — only
 * the brand, the code and an expiry hint.
 */

export interface SmsMessage {
  mobile: string;
  code: string;
  purpose: OtpPurpose;
  role?: RegisterableRole;
  /** True when no real gateway should be contacted. */
  mock: boolean;
}

function buildMessage(input: Omit<SmsMessage, 'mock'>): string {
  const minutes = Math.max(1, Math.round(env.OTP_EXPIRY_SECONDS / 60));
  return `${input.code} is your ${APP_NAME} verification code. It expires in ${minutes} minutes. Do not share it with anyone.`;
}

export async function sendOtpSms(input: SmsMessage): Promise<void> {
  if (input.mock) {
    // Development convenience: the code is returned by the API response
    // instead of being delivered, and never reaches the logs.
    return;
  }

  const message = buildMessage(input);

  switch (env.OTP_PROVIDER) {
    case 'twilio':
      await sendViaTwilio(input.mobile, message);
      return;
    case 'msg91':
      await sendViaMsg91(input.mobile, message);
      return;
    case 'custom':
      await sendViaCustomGateway(input.mobile, message);
      return;
    default:
      throw Errors.server();
  }
}

async function sendViaTwilio(mobile: string, message: string) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } = process.env;
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN) {
    logger.error('Twilio credentials are missing');
    throw Errors.server();
  }
  const body = new URLSearchParams({
    To: mobile,
    From: env.OTP_SENDER_ID,
    Body: message,
  });
  const response = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    },
  );
  if (!response.ok) {
    logger.error('Twilio rejected the OTP message', { status: response.status });
    throw Errors.server();
  }
}

async function sendViaMsg91(mobile: string, message: string) {
  if (!env.OTP_API_KEY) {
    logger.error('MSG91 credentials are missing');
    throw Errors.server();
  }
  const response = await fetch('https://control.msg91.com/api/v5/flow/', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', authkey: env.OTP_API_KEY },
    body: JSON.stringify({
      sender: env.OTP_SENDER_ID,
      route: '4',
      country: '91',
      sms: { message, to: [mobile] },
    }),
  });
  if (!response.ok) {
    logger.error('MSG91 rejected the OTP message', { status: response.status });
    throw Errors.server();
  }
}

async function sendViaCustomGateway(mobile: string, message: string) {
  if (!env.OTP_GATEWAY_URL) {
    logger.error('OTP_GATEWAY_URL is not configured');
    throw Errors.server();
  }
  const response = await fetch(env.OTP_GATEWAY_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(env.OTP_API_KEY ? { Authorization: `Bearer ${env.OTP_API_KEY}` } : {}),
    },
    body: JSON.stringify({ to: mobile, message, sender: env.OTP_SENDER_ID }),
  });
  if (!response.ok) {
    logger.error('Custom OTP gateway rejected the message', {
      status: response.status,
    });
    throw Errors.server();
  }
}
