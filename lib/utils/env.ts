import 'server-only';

import { z } from 'zod';

/**
 * Server side environment configuration.
 *
 * Nothing is hard coded: every value comes from the environment and has a
 * safe development default. In production the required values are enforced.
 */
const booleanish = z
  .string()
  .optional()
  .transform((value) => {
    if (value === undefined || value === '') return undefined;
    return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
  });

const intWithDefault = (fallback: number) =>
  z
    .string()
    .optional()
    .transform((value) => {
      const parsed = Number.parseInt(value ?? '', 10);
      return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
    });

const serverEnvSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  APP_URL: z
    .string()
    .default('http://localhost:3000')
    .transform((value) => value.replace(/\/$/, '')),
  DATABASE_URL: z.string().optional().default(''),
  SESSION_SECRET: z.string().optional().default(''),
  SESSION_MAX_AGE: intWithDefault(60 * 60 * 24 * 7),
  USE_MOCK_DB: booleanish,
  MOCK_OTP_ENABLED: booleanish,
  MOCK_OTP_CODE: z.string().optional().default('123456'),
  OTP_PROVIDER: z
    .enum(['twilio', 'msg91', 'custom', 'mock'])
    .optional()
    .default('mock'),
  OTP_SENDER_ID: z.string().optional().default('MediCare'),
  OTP_GATEWAY_URL: z.string().optional().default(''),
  OTP_API_KEY: z.string().optional().default(''),
  OTP_LENGTH: intWithDefault(6),
  OTP_EXPIRY_SECONDS: intWithDefault(300),
  OTP_RESEND_AFTER_SECONDS: intWithDefault(30),
  OTP_MAX_ATTEMPTS: intWithDefault(5),
  STORAGE_DRIVER: z.enum(['local', 's3']).optional().default('local'),
  STORAGE_LOCAL_DIR: z.string().optional().default('.storage'),
  AWS_REGION: z.string().optional().default(''),
  AWS_S3_BUCKET: z.string().optional().default(''),
  AWS_ACCESS_KEY_ID: z.string().optional().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().optional().default(''),
  AWS_ENDPOINT_URL: z.string().optional().default(''),
  AWS_FORCE_PATH_STYLE: booleanish,
  MAX_UPLOAD_SIZE_MB: intWithDefault(5),
  ALLOWED_DOCUMENT_MIME_TYPES: z.string().optional().default(''),
  GOOGLE_CLIENT_ID: z.string().optional().default(''),
  GOOGLE_CLIENT_SECRET: z.string().optional().default(''),
  ALLOWED_ORIGINS: z.string().optional().default(''),
  RATE_LIMIT_OTP_PER_15MIN: intWithDefault(5),
  RATE_LIMIT_OTP_PER_IP_15MIN: intWithDefault(30),
  RATE_LIMIT_LOGIN_PER_15MIN: intWithDefault(10),
  RATE_LIMIT_REGISTER_PER_HOUR: intWithDefault(20),
  RATE_LIMIT_UPLOAD_PER_HOUR: intWithDefault(40),
  SEED_DEMO_DATA: booleanish,
  /**
   * Email verification policy.
   * Required by default in production; relaxed in development so the local
   * signup flow does not depend on a real mail provider.
   */
  EMAIL_VERIFICATION_REQUIRED: booleanish,
  EMAIL_VERIFICATION_TTL_SECONDS: intWithDefault(24 * 60 * 60),
  PASSWORD_RESET_TTL_SECONDS: intWithDefault(60 * 60),
  /** Dev only: logs the email (and its link) instead of sending it. */
  EMAIL_LOG_ENABLED: booleanish,
});

const parsed = serverEnvSchema.safeParse({
  NODE_ENV: process.env.NODE_ENV,
  APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  SESSION_SECRET: process.env.SESSION_SECRET,
  SESSION_MAX_AGE: process.env.SESSION_MAX_AGE,
  USE_MOCK_DB: process.env.USE_MOCK_DB,
  MOCK_OTP_ENABLED: process.env.MOCK_OTP_ENABLED,
  MOCK_OTP_CODE: process.env.MOCK_OTP_CODE,
  OTP_PROVIDER: process.env.OTP_PROVIDER,
  OTP_SENDER_ID: process.env.OTP_SENDER_ID,
  OTP_GATEWAY_URL: process.env.OTP_GATEWAY_URL,
  OTP_API_KEY: process.env.OTP_API_KEY,
  OTP_LENGTH: process.env.OTP_LENGTH,
  OTP_EXPIRY_SECONDS: process.env.OTP_EXPIRY_SECONDS,
  OTP_RESEND_AFTER_SECONDS: process.env.OTP_RESEND_AFTER_SECONDS,
  OTP_MAX_ATTEMPTS: process.env.OTP_MAX_ATTEMPTS,
  STORAGE_DRIVER: process.env.STORAGE_DRIVER,
  STORAGE_LOCAL_DIR: process.env.STORAGE_LOCAL_DIR,
  AWS_REGION: process.env.AWS_REGION,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET,
  AWS_ACCESS_KEY_ID: process.env.AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY: process.env.AWS_SECRET_ACCESS_KEY,
  AWS_ENDPOINT_URL: process.env.AWS_ENDPOINT_URL,
  AWS_FORCE_PATH_STYLE: process.env.AWS_FORCE_PATH_STYLE,
  MAX_UPLOAD_SIZE_MB: process.env.MAX_UPLOAD_SIZE_MB,
  ALLOWED_DOCUMENT_MIME_TYPES: process.env.ALLOWED_DOCUMENT_MIME_TYPES,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET,
  ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS,
  RATE_LIMIT_OTP_PER_15MIN: process.env.RATE_LIMIT_OTP_PER_15MIN,
  RATE_LIMIT_OTP_PER_IP_15MIN: process.env.RATE_LIMIT_OTP_PER_IP_15MIN,
  RATE_LIMIT_LOGIN_PER_15MIN: process.env.RATE_LIMIT_LOGIN_PER_15MIN,
  RATE_LIMIT_REGISTER_PER_HOUR: process.env.RATE_LIMIT_REGISTER_PER_HOUR,
  RATE_LIMIT_UPLOAD_PER_HOUR: process.env.RATE_LIMIT_UPLOAD_PER_HOUR,
  SEED_DEMO_DATA: process.env.SEED_DEMO_DATA,
  EMAIL_VERIFICATION_REQUIRED: process.env.EMAIL_VERIFICATION_REQUIRED,
  EMAIL_VERIFICATION_TTL_SECONDS: process.env.EMAIL_VERIFICATION_TTL_SECONDS,
  PASSWORD_RESET_TTL_SECONDS: process.env.PASSWORD_RESET_TTL_SECONDS,
  EMAIL_LOG_ENABLED: process.env.EMAIL_LOG_ENABLED,
});

if (!parsed.success) {
  const issues = parsed.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('; ');
  throw new Error(`Invalid server environment configuration → ${issues}`);
}

const raw = parsed.data;

/**
 * The file backed development datastore is a convenience for local work.
 * It is never used in production: a production deployment without a
 * DATABASE_URL fails at runtime with a clear message (see lib/db/index.ts)
 * instead of silently writing data to a temporary folder.
 */
const mockDatabaseAllowed =
  !raw.DATABASE_URL && raw.USE_MOCK_DB !== false && raw.NODE_ENV !== 'production';

/**
 * Whether a patient must confirm their email address before signing in.
 *
 * Resolved before `env` because `env` itself depends on it. Defaults to `true`
 * in production (the safe choice) and `false` in development, so the local flow
 * works without a mail provider.
 */
const emailVerificationRequired =
  raw.EMAIL_VERIFICATION_REQUIRED ?? raw.NODE_ENV === 'production';

export const env = {
  ...raw,
  isProduction: raw.NODE_ENV === 'production',
  isDevelopment: raw.NODE_ENV === 'development',
  /**
   * True when the app runs without PostgreSQL using the local development
   * datastore. Never active in production.
   */
  useMockDb: mockDatabaseAllowed,
  hasDatabase: Boolean(raw.DATABASE_URL),
  /** Mock OTP is a development convenience and is hard-disabled in production. */
  mockOtpEnabled: raw.MOCK_OTP_ENABLED === true && raw.NODE_ENV !== 'production',
  googleOAuthEnabled: Boolean(raw.GOOGLE_CLIENT_ID && raw.GOOGLE_CLIENT_SECRET),
  maxUploadSizeBytes: raw.MAX_UPLOAD_SIZE_MB * 1024 * 1024,
  allowedDocumentMimeTypes: (
    raw.ALLOWED_DOCUMENT_MIME_TYPES ||
    'application/pdf,image/jpeg,image/png'
  )
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  allowedOrigins: raw.ALLOWED_ORIGINS.split(',')
    .map((value) => value.trim())
    .filter(Boolean),
  /**
   * Whether a patient must confirm their email address before signing in.
   * Doctors and pharmacies are always held at PENDING_VERIFICATION for manual
   * review regardless of this flag.
   */
  emailVerificationRequired,
  emailVerificationTtlMs: raw.EMAIL_VERIFICATION_TTL_SECONDS * 1000,
  passwordResetTtlMs: raw.PASSWORD_RESET_TTL_SECONDS * 1000,
  /**
   * Development convenience: emails are written to the log instead of being
   * sent, so links can be followed during local testing. Hard-disabled in
   * production.
   *
   * Defaults to ON outside production when no real provider is configured.
   * Without it, a local reset request would silently generate a token that is
   * never delivered anywhere — leaving the user locked out with no way to
   * discover the link.
   */
  emailLogEnabled:
    raw.EMAIL_LOG_ENABLED === undefined
      ? raw.NODE_ENV !== 'production' &&
        !process.env.EMAIL_API_KEY
      : raw.EMAIL_LOG_ENABLED === true && raw.NODE_ENV !== 'production',
} as const;

/**
 * Secret used to sign sessions, tickets and CSRF tokens.
 * In development a stable, clearly marked fallback keeps the flow testable
 * without configuration; production refuses to boot without a real secret.
 */
export function getSessionSecret(): string {
  if (raw.SESSION_SECRET && raw.SESSION_SECRET.length >= 32) {
    return raw.SESSION_SECRET;
  }
  if (env.isProduction) {
    throw new Error(
      'SESSION_SECRET must be set to a random value of at least 32 characters in production.',
    );
  }
  return 'medicare-development-only-secret-do-not-use-in-production';
}

/** Origins allowed to perform state changing API calls (CSRF defence). */
export function getAllowedOrigins(): string[] {
  return env.allowedOrigins.length > 0 ? env.allowedOrigins : [env.APP_URL];
}
