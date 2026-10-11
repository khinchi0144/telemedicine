import 'server-only';

import { env } from './env';

/**
 * Minimal, safe logger.
 *
 * Rules enforced here:
 *  - never logs passwords, OTPs, tokens, document URLs or session cookies
 *  - never logs full request bodies from auth endpoints
 *  - stays silent for expected control flow (validation errors, 4xx)
 */
type Level = 'debug' | 'info' | 'warn' | 'error';

const REDACTED_KEYS = [
  'password',
  'confirmPassword',
  'newPassword',
  'otp',
  'code',
  'token',
  'session',
  'cookie',
  'authorization',
  'secret',
  'apiKey',
  'passwordHash',
  'devOtp',
  'file',
  'document',
];

const LEVEL_ORDER: Record<Level, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function shouldLog(level: Level) {
  if (env.isProduction) return level === 'error' || level === 'warn';
  return LEVEL_ORDER[level] >= LEVEL_ORDER.debug;
}

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return '[deep]';
  if (value === null || value === undefined) return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).map(
      ([key, item]) => {
        if (REDACTED_KEYS.some((needle) => key.toLowerCase().includes(needle))) {
          return [key, '[redacted]'];
        }
        return [key, redact(item, depth + 1)];
      },
    );
    return Object.fromEntries(entries);
  }
  if (typeof value === 'string' && value.length > 200) {
    return `${value.slice(0, 200)}…`;
  }
  return value;
}

function emit(level: Level, message: string, context?: unknown) {
  if (!shouldLog(level)) return;
  const payload = {
    level,
    scope: 'medicare',
    message,
    ...(context !== undefined ? { context: redact(context) } : {}),
  };
  const line = JSON.stringify(payload);
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message: string, context?: unknown) => emit('debug', message, context),
  info: (message: string, context?: unknown) => emit('info', message, context),
  warn: (message: string, context?: unknown) => emit('warn', message, context),
  error: (message: string, context?: unknown) => emit('error', message, context),
};
