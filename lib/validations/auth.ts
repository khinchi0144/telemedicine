import { z } from 'zod';

import {
  confirmPasswordSchema,
  emailSchema,
  mobileNumberSchema,
  otpSchema,
  passwordSchema,
  passwordsMatch,
} from './common';
import { REGISTERABLE_ROLES, type RegisterableRole } from '@/types/auth';

/**
 * Authentication schemas (login, OTP) plus the step 1 "basic details" schema
 * shared by all three registration flows.
 */

/** Step 1 of every registration wizard. */
const basicDetailsShape = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, 'Please enter your full name.')
    .max(80, 'Please enter a name shorter than 80 characters.'),
  mobile: mobileNumberSchema,
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: confirmPasswordSchema,
});

export const basicDetailsSchema = basicDetailsShape.superRefine((value, ctx) => {
  if (value.password !== value.confirmPassword) {
    ctx.addIssue({
      code: 'custom',
      path: ['confirmPassword'],
      message: 'Passwords do not match.',
    });
  }
});

export type BasicDetailsInput = z.input<typeof basicDetailsShape>;
export type BasicDetailsValues = z.output<typeof basicDetailsShape>;

/** Convenience helper reused by the service layer. */
export function passwordsDoNotMatch(
  password: string,
  confirmPassword: string,
): boolean {
  return !passwordsMatch(password, confirmPassword);
}

/** Login: mobile number or email + password. */
export const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Please enter your mobile number or email address.')
    .refine(
      (value) => value.includes('@') || /^[+\d][\d\s-]{9,15}$/.test(value),
      'Please enter a valid mobile number or email address.',
    ),
  password: z.string().min(1, 'Please enter your password.'),
  rememberMe: z.boolean().optional().default(false),
});
/** Form shape (input) and parsed shape (output) of the login form. */
export type LoginInput = z.input<typeof loginSchema>;
export type LoginValues = z.output<typeof loginSchema>;

/** Request an OTP for registration or for an existing account. */
export const sendOtpSchema = z.object({
  role: z.enum(REGISTERABLE_ROLES).optional(),
  mobile: mobileNumberSchema,
  purpose: z.enum(['REGISTRATION', 'LOGIN']).default('REGISTRATION'),
});
export type SendOtpInput = z.infer<typeof sendOtpSchema>;

/** Verify the OTP challenge. */
export const verifyOtpSchema = z.object({
  challengeId: z.string().min(1),
  code: otpSchema,
  role: z.enum(REGISTERABLE_ROLES).optional(),
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/** Forgot password — only a generic confirmation is ever returned. */
export const forgotPasswordSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Please enter your registered mobile number or email address.'),
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

/**
 * Reset password — the token comes from the emailed link.
 *
 * The server only needs the token and the new password: the "confirm" field is
 * a UI affordance that stops typos before submission, not a security control,
 * so requiring it from an API client would be noise.
 */
export const resetPasswordRequestSchema = z.object({
  token: z.string().trim().min(10, 'This reset link is invalid.'),
  password: passwordSchema,
});
export type ResetPasswordRequestInput = z.infer<
  typeof resetPasswordRequestSchema
>;

/** Client-side form schema: same fields plus the confirmation check. */
export const resetPasswordSchema = resetPasswordRequestSchema
  .extend({ confirmPassword: confirmPasswordSchema })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      });
    }
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/** Email verification link. */
export const verifyEmailSchema = z.object({
  token: z.string().trim().min(10, 'This verification link is invalid.'),
});
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;

/** Map a zod issue list onto the API field error contract. */
export function toFieldErrors(
  error: z.ZodError,
): { field: string; message: string }[] {
  return error.issues.map((issue) => ({
    field: issue.path.join('.') || 'form',
    message: issue.message,
  }));
}

export function isRegisterableRoleValue(
  value: unknown,
): value is RegisterableRole {
  return (
    typeof value === 'string' &&
    (REGISTERABLE_ROLES as readonly string[]).includes(value)
  );
}
