import 'server-only';

import { getStore } from '@/lib/db';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import type { PatientProfileUpdateOutput } from '@/lib/validations/patient';

/**
 * Patient profile editing.
 *
 * Only the patient's own record is ever touched — the account row, role,
 * verification status and documents are deliberately not editable here, so a
 * profile edit can never escalate privileges.
 */
export async function updatePatientProfile(
  userId: string,
  patch: PatientProfileUpdateOutput,
) {
  const store = await getStore();

  const existing = await store.getPatientProfileByUserId(userId);
  if (!existing) throw Errors.notFound('Your profile could not be found.');

  // Optional fields are normalised to `null` so a value the user deliberately
  // cleared is stored as "not provided" instead of silently surviving.
  const merged = {
    fullName: patch.fullName,
    dateOfBirth: new Date(`${patch.dateOfBirth}T00:00:00`),
    gender: patch.gender,
    address: patch.address,
    city: patch.city,
    state: patch.state,
    pincode: patch.pincode,
    emergencyContactName: patch.emergencyContactName,
    emergencyContactNumber: patch.emergencyContactNumber,
    bloodGroup: patch.bloodGroup ?? null,
    existingConditions: patch.existingConditions ?? null,
    allergies: patch.allergies ?? null,
  };

  const updated = await store.upsertPatientProfile({ userId, ...merged });

  logger.info('Patient profile updated', { userId });
  return updated;
}