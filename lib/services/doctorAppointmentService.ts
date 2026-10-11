import 'server-only';

import { getStore } from '@/lib/db';
import type { AppointmentRecord } from '@/lib/db/types';
import { Errors } from '@/lib/utils/errors';

/**
 * Doctor-facing appointment reads.
 *
 * Read-only mirror of the patient appointment list: the doctor identity always
 * comes from the authenticated session (never from a query param or payload),
 * and only VERIFIED doctors may see clinical appointment information. Each row
 * carries the minimum patient display info the dashboard needs — nothing else.
 */

export interface DoctorAppointmentListItem {
  appointment: AppointmentRecord;
  /** Display name from the patient's own profile, or a safe fallback. */
  patientName: string;
  /** The doctor's own consultation mode, for context on the row. */
  consultationMode: string;
}

export async function listDoctorAppointments(
  doctorUserId: string,
): Promise<DoctorAppointmentListItem[]> {
  const store = await getStore();

  const doctor = await store.getDoctorProfileByUserId(doctorUserId);
  if (!doctor) throw Errors.notFound('Your doctor profile could not be found.');
  if (doctor.verificationStatus !== 'VERIFIED') {
    throw Errors.forbidden(
      'Your account is pending verification. Appointments unlock once an admin approves your profile.',
    );
  }

  const appointments = await store.listAppointmentsByDoctor(doctorUserId);

  const patientNames = new Map<string, string>();
  for (const appointment of appointments) {
    if (!patientNames.has(appointment.patientUserId)) {
      const profile = await store.getPatientProfileByUserId(
        appointment.patientUserId,
      );
      patientNames.set(
        appointment.patientUserId,
        profile?.fullName ?? 'Patient',
      );
    }
  }

  return appointments.map((appointment) => ({
    appointment,
    patientName: patientNames.get(appointment.patientUserId) ?? 'Patient',
    consultationMode: doctor.consultationMode,
  }));
}

export type DoctorStatusUpdate = 'COMPLETED' | 'NO_SHOW' | 'CANCELLED';

/**
 * Doctor-side status management.
 *
 * Ownership comes from the session's doctor id: any appointment that is
 * missing or belongs to another doctor returns a generic 404. Only
 * CONFIRMED → COMPLETED / NO_SHOW / CANCELLED is allowed; terminal states
 * and patient-cancelled rows are rejected. The write itself is conditional on
 * the row still being CONFIRMED, so a concurrent patient cancellation or a
 * second transition surfaces as a 409 instead of an overwrite.
 */
export async function updateDoctorAppointmentStatus(
  doctorUserId: string,
  appointmentId: string,
  status: DoctorStatusUpdate,
): Promise<AppointmentRecord> {
  const store = await getStore();

  const doctor = await store.getDoctorProfileByUserId(doctorUserId);
  if (!doctor) throw Errors.notFound('Your doctor profile could not be found.');
  if (doctor.verificationStatus !== 'VERIFIED') {
    throw Errors.forbidden(
      'Your account is pending verification. Appointments unlock once an admin approves your profile.',
    );
  }

  const existing = await store.getAppointmentById(appointmentId);
  if (!existing || existing.doctorUserId !== doctorUserId) {
    throw Errors.notFound('That appointment could not be found.');
  }
  if (existing.status !== 'CONFIRMED') {
    throw Errors.conflict(
      'This appointment can no longer be updated. It may have been cancelled or already completed.',
    );
  }

  const updated = await store.transitionAppointmentStatus(
    appointmentId,
    ['CONFIRMED'],
    { status },
  );
  if (!updated) {
    throw Errors.conflict(
      'This appointment changed just now. Please refresh and try again.',
    );
  }
  return updated;
}
