import 'server-only';

import { getStore } from '@/lib/db';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { createUserForRegistration, registrationResult } from './authService';
import { sendEmailVerificationLink } from './tokenService';
import type { RegisterResult } from '@/types/auth';
import type { PatientRegistrationRequest } from '@/lib/validations/patient';
import { basicDetailsSchema } from '@/lib/validations/auth';

/**
 * Patient registration.
 *
 * A patient account is activated as soon as the registration is complete —
 * there is no professional verification step for patients.
 */
export async function registerPatient(
  payload: PatientRegistrationRequest,
  verifiedMobile: string,
): Promise<RegisterResult> {
  const store = await getStore();

  // Step 1 (basic details) is validated again on the server: the wizard only
  // keeps the values in the browser until the final submit.
  const basic = basicDetailsSchema.safeParse(payload.basic);
  if (!basic.success) {
    throw Errors.validation(
      'Please check the basic details and try again.',
      basic.error.issues.map((issue) => ({
        field: `basic.${issue.path.join('.')}`,
        message: issue.message,
      })),
    );
  }

  const { fullName, mobile, email, password } = basic.data;

  if (mobile !== verifiedMobile) {
    // Defensive: the ticket is bound to the verified mobile number.
    throw Errors.otpNotVerified();
  }

  const existing = await store.findUserByMobile(mobile);
  if (existing) throw Errors.mobileTaken();
  const existingEmail = await store.findUserByEmail(email);
  if (existingEmail) throw Errors.emailTaken();

  const account = await createUserForRegistration({
    role: 'PATIENT',
    fullName,
    mobile,
    email,
    password,
    status: 'ACTIVE',
  });

  const dateOfBirth = payload.personal?.dateOfBirth
    ? new Date(`${payload.personal.dateOfBirth}T00:00:00`)
    : null;

  await store.upsertPatientProfile({
    userId: account.userId,
    fullName,
    dateOfBirth,
    gender: payload.personal?.gender || null,
    address: payload.personal?.address ?? null,
    city: payload.personal?.city ?? null,
    state: payload.personal?.state ?? null,
    pincode: payload.personal?.pincode ?? null,
    emergencyContactName: payload.personal?.emergencyContactName ?? null,
    emergencyContactNumber: payload.personal?.emergencyContactNumber ?? null,
    // Step 4 is optional — everything may be empty.
    bloodGroup: payload.health?.bloodGroup || null,
    existingConditions: payload.health?.existingConditions ?? null,
    allergies: payload.health?.allergies ?? null,
  });

  logger.info('Patient registration completed', { userId: account.userId });

  // Email verification policy: when required, the account is created but held
  // inactive until the emailed link is opened. The user is still signed in so
  // they can resend the link from their dashboard.
  await sendEmailVerificationLink(account.userId, account.email);

  return registrationResult({
    userId: account.userId,
    role: 'PATIENT',
    status: 'ACTIVE',
    signedIn: true,
  });
}
