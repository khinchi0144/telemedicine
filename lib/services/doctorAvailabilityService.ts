import 'server-only';

import { getStore } from '@/lib/db';
import type { DoctorAvailabilityRecord } from '@/lib/db/types';
import { Errors } from '@/lib/utils/errors';
import type { DoctorAvailabilityValues } from '@/lib/validations/doctor';

/**
 * Doctor-facing availability management.
 *
 * Read/write mirror of the registration-time availability capture: the doctor
 * identity always comes from the authenticated session (never from a query
 * param or payload), and only VERIFIED doctors may read or change clinical
 * availability. Writes reuse the transactional `replaceDoctorAvailability`
 * store method, so the week can never be half written. Existing appointments
 * are never touched — narrowing hours only affects future slot display.
 */

export async function getDoctorAvailabilitySettings(
  doctorUserId: string,
): Promise<DoctorAvailabilityRecord[]> {
  const store = await getStore();

  const doctor = await store.getDoctorProfileByUserId(doctorUserId);
  if (!doctor) throw Errors.notFound('Your doctor profile could not be found.');
  if (doctor.verificationStatus !== 'VERIFIED') {
    throw Errors.forbidden(
      'Your account is pending verification. Availability unlocks once an admin approves your profile.',
    );
  }

  return store.getDoctorAvailability(doctor.id);
}

export async function updateDoctorAvailabilitySettings(
  doctorUserId: string,
  slots: DoctorAvailabilityValues,
): Promise<DoctorAvailabilityRecord[]> {
  const store = await getStore();

  const doctor = await store.getDoctorProfileByUserId(doctorUserId);
  if (!doctor) throw Errors.notFound('Your doctor profile could not be found.');
  if (doctor.verificationStatus !== 'VERIFIED') {
    throw Errors.forbidden(
      'Your account is pending verification. Availability unlocks once an admin approves your profile.',
    );
  }

  return store.replaceDoctorAvailability(doctor.id, slots);
}
