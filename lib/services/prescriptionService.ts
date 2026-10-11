import 'server-only';

import { getStore } from '@/lib/db';
import type { PrescriptionWithItems } from '@/lib/db/types';
import { Errors } from '@/lib/utils/errors';
import type { DoctorCreatePrescriptionInput } from '@/lib/validations/care';

/**
 * Doctor-facing prescription writes.
 *
 * Identity is never taken from the request payload. The appointment id selects
 * the visit, the patient is read back from that appointment, and the doctor is
 * the authenticated session user — so a doctor can only prescribe for their own
 * eligible appointment. Verified doctors only, and appointment statuses are
 * never mutated as a side effect of writing a prescription.
 */

/** Statuses that may receive a prescription — an in-progress or finished visit. */
const ELIGIBLE_STATUSES = ['CONFIRMED', 'COMPLETED'];

export async function createDoctorPrescription(
  doctorUserId: string,
  input: DoctorCreatePrescriptionInput,
): Promise<PrescriptionWithItems> {
  const store = await getStore();

  const doctor = await store.getDoctorProfileByUserId(doctorUserId);
  if (!doctor) throw Errors.notFound('Your doctor profile could not be found.');
  if (doctor.verificationStatus !== 'VERIFIED') {
    throw Errors.forbidden(
      'Your account is pending verification. Prescriptions unlock once an admin approves your profile.',
    );
  }

  const appointment = await store.getAppointmentById(input.appointmentId);
  // A missing row, or one owned by another doctor, is indistinguishable.
  if (!appointment || appointment.doctorUserId !== doctorUserId) {
    throw Errors.notFound('That appointment could not be found.');
  }
  if (!ELIGIBLE_STATUSES.includes(appointment.status)) {
    throw Errors.conflict(
      'Prescriptions can only be written for confirmed or completed appointments.',
    );
  }

  return store.createPrescription({
    patientUserId: appointment.patientUserId,
    doctorUserId,
    appointmentId: appointment.id,
    diagnosis: input.diagnosis,
    notes: input.notes,
    items: input.items,
  });
}

export interface PrescriptionListItem {
  prescription: PrescriptionWithItems;
  doctorName: string;
}

export async function listPrescriptions(
  patientUserId: string,
): Promise<PrescriptionListItem[]> {
  const store = await getStore();
  const prescriptions = await store.listPrescriptionsByPatient(patientUserId);
  const items: PrescriptionListItem[] = [];
  for (const prescription of prescriptions) {
    const profile = await store.getDoctorProfileByUserId(prescription.doctorUserId);
    items.push({
      prescription,
      doctorName: profile?.fullName ?? 'Doctor',
    });
  }
  return items;
}