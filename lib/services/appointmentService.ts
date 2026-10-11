import 'server-only';

import { getStore } from '@/lib/db';
import type {
  AppointmentRecord,
  DoctorProfileRecord,
} from '@/lib/db/types';
import { createId } from '@/lib/utils/crypto';
import { Errors } from '@/lib/utils/errors';
import type { BookAppointmentInput, DoctorSearchParams } from '@/lib/validations/care';

/**
 * Appointment booking and the doctor directory the booking flow starts from.
 *
 * Lifecycle decisions (documented so the doctor module can pick them up
 * later): a booked slot is written straight as `CONFIRMED` with an in-app
 * meeting URL, because there is no doctor-side confirmation UI yet — an
 * appointment that silently waited for confirmation nobody could give would
 * strand every booking. Cancelling sets `CANCELLED`; `COMPLETED` / `NO_SHOW`
 * remain for the doctor's workflow.
 */

const SLOT_STEP_MINUTES = 30;
const WEEKDAYS = [
  'SUNDAY',
  'MONDAY',
  'TUESDAY',
  'WEDNESDAY',
  'THURSDAY',
  'FRIDAY',
  'SATURDAY',
] as const;

export interface SlotOption {
  startTime: string;
  endTime: string;
  /** False when another patient already holds this slot. */
  available: boolean;
}

export interface AppointmentListItem {
  appointment: AppointmentRecord;
  doctorName: string;
  doctorSpecialization: string;
  doctorProfileId: string;
}

function minutesOf(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

function timeOf(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** UTC-midnight Date for a "YYYY-MM-DD" day, matching the Prisma column. */
function dayToDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

/**
 * Verified doctors matching the search params. Only `VERIFIED` profiles are
 * ever listed — a patient cannot book an account still under review.
 */
export async function searchDoctors(params: DoctorSearchParams) {
  const store = await getStore();
  return store.listDoctorProfiles({
    verificationStatus: 'VERIFIED',
    ...(params.q ? { text: params.q } : {}),
    ...(params.city ? { city: params.city } : {}),
    ...(params.specialization ? { specialization: params.specialization } : {}),
  });
}

/**
 * Bookable slots for one calendar day: the doctor's enabled weekly window,
 * split into 30 minute steps, with taken or already-passed times marked.
 */
export async function getDoctorSlots(
  doctorProfileId: string,
  date: string,
): Promise<{ doctor: DoctorProfileRecord; slots: SlotOption[] }> {
  const store = await getStore();
  const doctor = await store.getDoctorProfileById(doctorProfileId);
  if (!doctor) throw Errors.notFound('That doctor could not be found.');

  const day = dayToDate(date);
  const weekday = WEEKDAYS[day.getUTCDay()];
  const availability = await store.getDoctorAvailability(doctorProfileId);
  const window = availability.find((row) => row.day === weekday && row.isEnabled);

  const slots: SlotOption[] = [];
  if (window) {
    // Booked times for this doctor + day (doctorUserId comes from the profile).
    const appointments = await store.listAppointmentsByDoctor(doctor.userId);
    const booked = new Set(
      appointments
        .filter(
          (row) =>
            row.status !== 'CANCELLED' &&
            row.scheduledDate.getTime() === day.getTime(),
        )
        .map((row) => row.startTime),
    );
    const dayStartMinutes = day.getTime();
    const now = Date.now();

    for (
      let start = minutesOf(window.startTime);
      start + SLOT_STEP_MINUTES <= minutesOf(window.endTime);
      start += SLOT_STEP_MINUTES
    ) {
      const startTime = timeOf(start);
      const slotStartsAt = dayStartMinutes + start * 60_000;
      slots.push({
        startTime,
        endTime: timeOf(start + SLOT_STEP_MINUTES),
        available: !booked.has(startTime) && slotStartsAt > now,
      });
    }
  }
  return { doctor, slots };
}

/**
 * Books one slot for the signed-in patient.
 *
 * Re-validates everything server side: the doctor exists, the day is not in
 * the past, the requested times sit inside the doctor's enabled availability
 * window, and the slot is free for *both* the doctor and the patient.
 */
export async function bookAppointment(
  patientUserId: string,
  input: BookAppointmentInput,
): Promise<AppointmentRecord> {
  const store = await getStore();
  const { doctor, slots } = await getDoctorSlots(input.doctorProfileId, input.date);

  if (doctor.verificationStatus !== 'VERIFIED') {
    throw Errors.forbidden('This doctor is not accepting online bookings yet.');
  }

  const slot = slots.find((row) => row.startTime === input.startTime);
  if (!slot || slot.endTime !== input.endTime) {
    throw Errors.validation('Please pick a slot from the available times.');
  }
  if (!slot.available) {
    throw Errors.conflict('That time slot is no longer available. Please pick another.');
  }

  const scheduledDate = dayToDate(input.date);
  const slotStartsAt = scheduledDate.getTime() + minutesOf(input.startTime) * 60_000;
  if (slotStartsAt <= Date.now()) {
    throw Errors.validation('That slot has already passed. Please pick a future time.');
  }

  // Exact-slot recheck guards against a race with another booking.
  const clash = await store.findAppointmentAt(
    doctor.id,
    scheduledDate,
    input.startTime,
  );
  if (clash) {
    throw Errors.conflict('That slot was just taken. Please pick another time.');
  }

  const mine = await store.listAppointmentsByPatient(patientUserId);
  const patientClash = mine.some(
    (row) =>
      row.status !== 'CANCELLED' &&
      row.scheduledDate.getTime() === scheduledDate.getTime() &&
      row.startTime === input.startTime,
  );
  if (patientClash) {
    throw Errors.conflict('You already have an appointment at that time.');
  }

  const id = createId('apt');
  return store.createAppointment({
    id,
    patientUserId,
    doctorUserId: doctor.userId,
    doctorProfileId: doctor.id,
    scheduledDate,
    startTime: input.startTime,
    endTime: input.endTime,
    status: 'CONFIRMED',
    reason: input.reason ?? null,
    // Top-level route (not under /patient) so the doctor can open the same
    // URL; the page itself guards on appointment membership, not role.
    meetingUrl: `/consultations/${id}`,
  });
}

/** Cancels one of the patient's own upcoming appointments. */
export async function cancelAppointment(
  patientUserId: string,
  appointmentId: string,
  reason?: string,
): Promise<AppointmentRecord> {
  const store = await getStore();
  const appointment = await store.getAppointmentById(appointmentId);
  if (!appointment || appointment.patientUserId !== patientUserId) {
    throw Errors.notFound('That appointment could not be found.');
  }
  if (appointment.status !== 'CONFIRMED' && appointment.status !== 'REQUESTED') {
    throw Errors.conflict('This appointment can no longer be cancelled from here.');
  }
  if (appointment.scheduledDate.getTime() < Date.now()) {
    throw Errors.conflict('Past appointments cannot be cancelled.');
  }
  return store.updateAppointment(appointmentId, {
    status: 'CANCELLED',
    ...(reason ? { reason } : {}),
  });
}

/** The patient's appointments, newest first, with the doctor's display info. */
export async function listPatientAppointments(
  patientUserId: string,
): Promise<AppointmentListItem[]> {
  const store = await getStore();
  const appointments = await store.listAppointmentsByPatient(patientUserId);
  const profiles = new Map<string, DoctorProfileRecord | null>();
  for (const appointment of appointments) {
    if (!profiles.has(appointment.doctorProfileId)) {
      profiles.set(
        appointment.doctorProfileId,
        await store.getDoctorProfileById(appointment.doctorProfileId),
      );
    }
  }
  return appointments.map((appointment) => {
    const profile = profiles.get(appointment.doctorProfileId) ?? null;
    return {
      appointment,
      doctorName: profile?.fullName ?? 'Doctor',
      doctorSpecialization: profile?.specialization ?? '',
      doctorProfileId: appointment.doctorProfileId,
    };
  });
}

/** One appointment owned by the patient (used by the video room page). */
export async function getPatientAppointment(
  patientUserId: string,
  appointmentId: string,
): Promise<AppointmentListItem> {
  const store = await getStore();
  const appointment = await store.getAppointmentById(appointmentId);
  if (!appointment || appointment.patientUserId !== patientUserId) {
    throw Errors.notFound('That appointment could not be found.');
  }
  const profile = await store.getDoctorProfileById(appointment.doctorProfileId);
  return {
    appointment,
    doctorName: profile?.fullName ?? 'Doctor',
    doctorSpecialization: profile?.specialization ?? '',
    doctorProfileId: appointment.doctorProfileId,
  };
}