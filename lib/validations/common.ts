import { z } from 'zod';

import { normalizeMobile } from '@/lib/utils/format';

/**
 * Shared, user friendly validation primitives.
 * Every message is written for a non technical audience.
 */

/** Full name: letters, spaces, apostrophes, dots and hyphens. */
export const fullNameSchema = z
  .string()
  .trim()
  .min(2, 'Please enter your full name.')
  .max(80, 'Please enter a name shorter than 80 characters.')
  .regex(
    /^[\p{L}\p{M}][\p{L}\p{M}\s.'-]*$/u,
    'Please enter your full name using letters only.',
  );

/** Indian mobile number, accepts +91 / 0 prefixes and normalises to 10 digits. */
export const mobileNumberSchema = z
  .string()
  .trim()
  .min(1, 'Please enter your mobile number.')
  .transform((value) => normalizeMobile(value))
  .refine(
    (value) => /^[6-9]\d{9}$/.test(value),
    'Please enter a valid 10 digit mobile number.',
  );

export const emailSchema = z
  .email('Please enter a valid email address.')
  .trim()
  .toLowerCase()
  .max(120, 'Please enter a shorter email address.');

/**
 * Password policy: at least 8 characters with an uppercase letter, a
 * lowercase letter and a number. Shown to the user as a checklist.
 */
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long.')
  .max(72, 'Password must be 72 characters or fewer.')
  .regex(/[a-z]/, 'Please include at least one lowercase letter.')
  .regex(/[A-Z]/, 'Please include at least one uppercase letter.')
  .regex(/\d/, 'Please include at least one number.');

export const confirmPasswordSchema = z
  .string()
  .min(1, 'Please confirm your password.');

/** Six digit one time password. */
export const otpSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Please enter the 6 digit OTP.');

export const pincodeSchema = z
  .string()
  .trim()
  .regex(/^\d{6}$/, 'Please enter a valid 6 digit PIN code.');

export const citySchema = z
  .string()
  .trim()
  .min(2, 'Please enter your city.')
  .max(60, 'Please enter a shorter city name.');

export const stateSchema = z.string().trim().min(2, 'Please select your state.');

export const addressSchema = z
  .string()
  .trim()
  .min(5, 'Please enter your address.')
  .max(300, 'Please enter a shorter address.');

/** Free text that the user is allowed to leave empty. */
export function optionalText(max = 500, message?: string) {
  return z
    .string()
    .trim()
    .max(max, message ?? `Please keep this under ${max} characters.`)
    .optional()
    .transform((value) => (value ? value : undefined));
}

/**
 * Pick-one-of field that also tolerates an empty string.
 *
 * Optional selects (such as the patient's blood group) submit `''` when the
 * user skips them. Accepting `''` and normalising it to `undefined` is what
 * keeps an optional field genuinely optional.
 */
export function optionalEnumField(values: readonly string[]) {
  return z
    .string()
    .trim()
    .refine((value) => value === '' || values.includes(value), {
      // Replaces Zod's default enum message, which leaks the raw option list.
      message: 'Please select a valid option from the list.',
    })
    .transform((value) => (value === '' ? undefined : value));
}

/**
 * Required pick-one-of field with user friendly messages.
 *
 * A plain `z.enum` would surface `expected one of "A+"|"A-"...` on an invalid
 * value, so both the "missing" and the "not in the list" cases are handled.
 */
export function requiredEnumField(
  values: readonly string[],
  missing_message: string,
) {
  return z
    .string()
    .trim()
    .refine((value) => value.length > 0, missing_message)
    .refine((value) => values.includes(value), {
      message: 'Please select a valid option from the list.',
    });
}

/** Required free text (used for qualifications, condition lists, ...). */
export const shortTextSchema = (min: number, max: number, message: string) =>
  z.string().trim().min(min, message).max(max, `Please keep this under ${max} characters.`);

export const dobSchema = z
  .string()
  .trim()
  .min(1, 'Please enter your date of birth.')
  .refine((value) => /^\d{4}-\d{2}-\d{2}$/.test(value), 'Please enter a valid date.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return false;
    return date < new Date();
  }, 'Date of birth must be in the past.')
  .refine((value) => {
    const date = new Date(`${value}T00:00:00`);
    const age = (Date.now() - date.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
    return age >= 0 && age <= 120;
  }, 'Please enter a valid date of birth.');

/** "HH:mm" 24 hour time used by the pharmacy opening hours. */
export const timeSchema = z
  .string()
  .trim()
  .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Please enter a valid time.');

/** Password confirmation, resolved against the sibling `password` field. */
export function passwordsMatch(
  password: string | undefined,
  confirmPassword: string,
): boolean {
  return Boolean(password) && password === confirmPassword;
}
