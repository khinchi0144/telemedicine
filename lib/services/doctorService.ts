import 'server-only';

import { getStore } from '@/lib/db';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { createUserForRegistration, registrationResult } from './authService';
import { sendEmailVerificationLink } from './tokenService';
import { assertDocumentsBelongToTicket } from './documentService';
import { basicDetailsSchema } from '@/lib/validations/auth';
import type { DoctorRegistrationRequest } from '@/lib/validations/doctor';
import type { RegisterResult } from '@/types/auth';
import { ROLE_DOCUMENTS } from '@/lib/constants/documents';
import type { DocumentType } from '@/types/document';

/** Documents a doctor must upload before the registration can be submitted. */
const REQUIRED_DOCTOR_DOCUMENTS: DocumentType[] = ROLE_DOCUMENTS.DOCTOR.filter(
  (doc) => doc.required,
).map((doc) => doc.type);

/**
 * Doctor registration.
 *
 * A doctor account is created in PENDING_VERIFICATION status and the user is
 * NOT signed in: the professional dashboard stays locked until an admin
 * verifies the submitted documents.
 */
export async function registerDoctor(
  payload: DoctorRegistrationRequest,
  ticket: { jti: string; mobile: string },
): Promise<RegisterResult> {
  const store = await getStore();

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
  if (mobile !== ticket.mobile) throw Errors.otpNotVerified();

  const existing = await store.findUserByMobile(mobile);
  if (existing) throw Errors.mobileTaken();
  const existingEmail = await store.findUserByEmail(email);
  if (existingEmail) throw Errors.emailTaken();

  // Documents uploaded during the wizard must belong to this registration.
  await assertDocumentsBelongToTicket(
    payload.documentIds ?? [],
    ticket.jti,
    REQUIRED_DOCTOR_DOCUMENTS,
  );

  const account = await createUserForRegistration({
    role: 'DOCTOR',
    fullName,
    mobile,
    email,
    password,
    status: 'PENDING_VERIFICATION',
  });

  const profilePhotos = await store.listDocumentsByRegistrationId(
    ticket.jti,
  );
  const profilePhoto =
    profilePhotos.find((doc) => doc.documentType === 'PROFILE_PHOTO')?.storageKey ??
    null;

  const profile = await store.upsertDoctorProfile({
    userId: account.userId,
    fullName,
    medicalRegistrationNumber: payload.professional.medicalRegistrationNumber,
    medicalCouncil: payload.professional.medicalCouncil,
    specialization: payload.professional.specialization,
    qualification: payload.professional.qualification,
    experienceYears: Number(payload.professional.experienceYears),
    profilePhoto,
    clinicName: payload.clinic.clinicName,
    clinicAddress: payload.clinic.clinicAddress,
    city: payload.clinic.city,
    state: payload.clinic.state,
    pincode: payload.clinic.pincode,
    consultationMode: payload.clinic.consultationMode as never,
    consultationFee: payload.clinic.consultationFee ?? null,
  });

  // Weekly consultation windows — optional, so an absent array is not an error.
  // Only days the doctor actually enabled are stored.
  const enabledSlots = (payload.clinic.availability ?? []).filter(
    (slot) => slot.isEnabled,
  );
  if (enabledSlots.length > 0) {
    await store.replaceDoctorAvailability(profile.id, enabledSlots);
  }

  // Documents move from the registration ticket onto the new account.
  const attached = await store.attachDocumentsToUser(
    ticket.jti,
    account.userId,
  );

  logger.info('Doctor registration submitted', {
    userId: account.userId,
    documents: attached,
  });

  // Professionals always confirm their address too, but their account stays
  // PENDING_VERIFICATION until an admin approves it either way.
  await sendEmailVerificationLink(account.userId, account.email);

  return registrationResult({
    userId: account.userId,
    role: 'DOCTOR',
    status: 'PENDING_VERIFICATION',
    signedIn: false,
    profileId: profile.id,
  });
}
