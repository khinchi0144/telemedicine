import { getStore } from '@/lib/db';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { createUserForRegistration, registrationResult } from './authService';
import { sendEmailVerificationLink } from './tokenService';
import { assertDocumentsBelongToTicket } from './documentService';
import { pharmacyBasicSchema } from '@/lib/validations/pharmacy';
import { ROLE_DOCUMENTS, getDocumentDefinition } from '@/lib/constants/documents';
import type { PharmacyRegistrationRequest } from '@/lib/validations/pharmacy';
import type { RegisterResult } from '@/types/auth';
import type { DocumentType } from '@/types/document';

/**
 * Pharmacy registration.
 *
 * Like doctors, a pharmacy account is created in PENDING_VERIFICATION and is
 * never auto-approved. Required vs optional licence fields stay configurable
 * in lib/validations/pharmacy.ts.
 */
const REQUIRED_PHARMACY_DOCUMENTS: DocumentType[] = ROLE_DOCUMENTS.PHARMACY.filter(
  (doc) => doc.required,
).map((doc) => doc.type);

function documentLabel(type: DocumentType): string {
  return getDocumentDefinition('PHARMACY', type)?.label ?? type;
}

export async function registerPharmacy(
  payload: PharmacyRegistrationRequest,
  ticket: { jti: string; mobile: string },
): Promise<RegisterResult> {
  const store = await getStore();

  const basic = pharmacyBasicSchema.safeParse(payload.basic);
  if (!basic.success) {
    throw Errors.validation(
      'Please check the basic details and try again.',
      basic.error.issues.map((issue) => ({
        field: `basic.${issue.path.join('.')}`,
        message: issue.message,
      })),
    );
  }

  const { pharmacyName, ownerName, mobile, email, password } = basic.data;
  if (mobile !== ticket.mobile) throw Errors.otpNotVerified();

  const existing = await store.findUserByMobile(mobile);
  if (existing) throw Errors.mobileTaken();
  const existingEmail = await store.findUserByEmail(email);
  if (existingEmail) throw Errors.emailTaken();

  await assertDocumentsBelongToTicket(
    payload.documentIds ?? [],
    ticket.jti,
    REQUIRED_PHARMACY_DOCUMENTS,
  );

  const account = await createUserForRegistration({
    role: 'PHARMACY',
    fullName: ownerName,
    mobile,
    email,
    password,
    status: 'PENDING_VERIFICATION',
  });

  const profile = await store.upsertPharmacyProfile({
    userId: account.userId,
    pharmacyName,
    ownerName,
    drugLicenseNumber: payload.pharmacy.drugLicenseNumber,
    gstNumber: payload.pharmacy.gstNumber,
    pharmacyRegistrationNumber:
      payload.pharmacy.pharmacyRegistrationNumber ?? null,
    pharmacyType: payload.pharmacy.pharmacyType as never,
    address: payload.address.address,
    city: payload.address.city,
    state: payload.address.state,
    pincode: payload.address.pincode,
    contactNumber: payload.address.contactNumber,
    operatingHours: payload.address.operatingHours as never,
  });

  const attached = await store.attachDocumentsToUser(
    ticket.jti,
    account.userId,
  );

  logger.info('Pharmacy registration submitted', {
    userId: account.userId,
    documents: attached,
  });

  // The licence review is manual, but the owner still confirms their address.
  await sendEmailVerificationLink(account.userId, account.email);

  return registrationResult({
    userId: account.userId,
    role: 'PHARMACY',
    status: 'PENDING_VERIFICATION',
    signedIn: false,
    profileId: profile.id,
  });
}

export { documentLabel, REQUIRED_PHARMACY_DOCUMENTS };
