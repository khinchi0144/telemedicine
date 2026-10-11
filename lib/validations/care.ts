import { z } from 'zod';

import {
  optionalText,
  requiredEnumField,
  shortTextSchema,
  timeSchema,
} from './common';
import { MEDICAL_RECORD_TYPES } from '@/lib/constants/options';

/**
 * Payload schemas for the patient care modules (appointments, messaging,
 * records, pharmacy orders, video signalling).
 *
 * Every API route parses its request through one of these before the service
 * layer runs; ownership and business rules are re-checked in the service.
 */

/** "YYYY-MM-DD" that must be a real calendar day. */
export const daySchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Please choose a valid date.')
  .refine(
    (value) => !Number.isNaN(new Date(`${value}T00:00:00Z`).getTime()),
    'Please choose a valid date.',
  );

/** Optional date that tolerates an empty string from the form. */
const optionalDay = z
  .string()
  .trim()
  .refine(
    (value) => value === '' || /^\d{4}-\d{2}-\d{2}$/.test(value),
    'Please choose a valid date.',
  )
  .transform((value) => (value === '' ? undefined : value));

// --- doctors & appointments -------------------------------------------------

/** Query string accepted by the Find doctors / medicines search pages. */
export const doctorSearchSchema = z.object({
  q: z.string().trim().max(80, 'Please use a shorter search term.').optional(),
  city: z.string().trim().max(60, 'Please use a shorter city name.').optional(),
  specialization: z
    .string()
    .trim()
    .max(60, 'Please use a shorter specialization. ')
    .optional(),
});

export type DoctorSearchParams = z.infer<typeof doctorSearchSchema>;

/** `GET /api/patient/doctors/[id]/slots?date=YYYY-MM-DD` */
export const slotsQuerySchema = z.object({ date: daySchema });

/** `POST /api/patient/appointments` — booking one slot. */
export const bookAppointmentSchema = z.object({
  doctorProfileId: z.string().trim().min(1, 'Please choose a doctor.'),
  date: daySchema,
  startTime: timeSchema,
  endTime: timeSchema,
  reason: optionalText(300, 'Please keep the reason under 300 characters.'),
});

export type BookAppointmentInput = z.infer<typeof bookAppointmentSchema>;

/** `PATCH /api/patient/appointments/[id]` — patients may only cancel. */
export const cancelAppointmentSchema = z.object({
  status: z.literal('CANCELLED', {
    message: 'Appointments can only be cancelled.',
  }),
  reason: optionalText(300, 'Please keep the reason under 300 characters.'),
});

/**
 * `PATCH /api/doctor/appointments/[id]` — doctor-side status management.
 *
 * Only terminal transitions out of CONFIRMED are allowed; the service
 * re-checks ownership and the current status, and the store applies the
 * change conditionally so a stale update cannot overwrite a concurrent
 * cancellation or another transition.
 */
export const doctorUpdateAppointmentSchema = z.object({
  status: z.enum(['COMPLETED', 'NO_SHOW', 'CANCELLED'], {
    message: 'Please choose a valid status update.',
  }),
});

export type DoctorUpdateAppointmentInput = z.infer<
  typeof doctorUpdateAppointmentSchema
>;

// --- prescriptions -----------------------------------------------------------

/**
 * One medicine line on a prescription.
 *
 * Only `medicineName` is required; dosage / frequency / duration / instructions
 * are optional free text the doctor may leave blank. `medicineName` must be
 * non-empty so a prescription can never be saved with a nameless medicine.
 */
export const prescriptionItemSchema = z.object({
  medicineName: z
    .string()
    .trim()
    .min(1, 'Please enter the medicine name.')
    .max(160, 'Please keep the medicine name under 160 characters.'),
  dosage: optionalText(80, 'Please keep the dosage under 80 characters.'),
  frequency: optionalText(80, 'Please keep the frequency under 80 characters.'),
  duration: optionalText(80, 'Please keep the duration under 80 characters.'),
  instructions: optionalText(
    300,
    'Please keep the instructions under 300 characters.',
  ),
});

export type PrescriptionItemInput = z.infer<typeof prescriptionItemSchema>;

/**
 * `POST /api/doctor/prescriptions` — writing a prescription for an eligible
 * appointment. The appointment id is the only linkage the client sends; the
 * patient and doctor identities are resolved server-side from that appointment
 * and the authenticated session, so neither can be forged from the request.
 */
export const doctorCreatePrescriptionSchema = z.object({
  appointmentId: z
    .string()
    .trim()
    .min(1, 'Please choose the appointment this prescription is for.'),
  diagnosis: optionalText(300, 'Please keep the diagnosis under 300 characters.'),
  notes: optionalText(2000, "Please keep the notes under 2000 characters."),
  items: z
    .array(prescriptionItemSchema)
    .min(1, 'Please add at least one medicine to the prescription.')
    .max(30, 'A prescription can list at most 30 medicines.'),
});

export type DoctorCreatePrescriptionInput = z.infer<
  typeof doctorCreatePrescriptionSchema
>;

// --- messaging --------------------------------------------------------------

export const startConversationSchema = z.object({
  doctorUserId: z.string().trim().min(1, 'Please choose a doctor to message.'),
});

export const sendMessageSchema = z.object({
  body: z
    .string()
    .trim()
    .min(1, 'Please write a message before sending.')
    .max(2000, 'Please keep messages under 2000 characters.'),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;

// --- medical records --------------------------------------------------------

/** `POST /api/patient/records` — a patient adding a record to their own file. */
export const medicalRecordSchema = z.object({
  title: shortTextSchema(2, 120, 'Please give this record a title.'),
  recordType: requiredEnumField(
    MEDICAL_RECORD_TYPES,
    'Please choose what kind of record this is.',
  ),
  description: optionalText(1000, 'Please keep this under 1000 characters.'),
  recordDate: optionalDay,
});

export type MedicalRecordInput = z.infer<typeof medicalRecordSchema>;

// --- pharmacy orders --------------------------------------------------------

export const medicineSearchSchema = z.object({
  q: z.string().trim().max(80, 'Please use a shorter search term.').optional(),
  city: z.string().trim().max(60, 'Please use a shorter city name.').optional(),
});

/**
 * `POST /api/patient/orders`.
 *
 * Prices are deliberately NOT part of the payload: the service looks each
 * medicine up server side so a hand-crafted request cannot set its own price.
 */
export const placeOrderSchema = z.object({
  pharmacyUserId: z.string().trim().min(1, 'Please choose a pharmacy.'),
  deliveryAddress: optionalText(300, 'Please keep the address under 300 characters.'),
  items: z
    .array(
      z.object({
        medicineId: z.string().trim().min(1, 'Unknown medicine in your cart.'),
        quantity: z
          .number()
          .int('Please order a whole number of units.')
          .min(1, 'Please order at least one unit.')
          .max(20, 'Please order 20 units or fewer at a time.'),
      }),
    )
    .min(1, 'Please add at least one medicine to your order.')
    .max(30, 'Please order 30 lines or fewer at a time.'),
});

export type PlaceOrderInput = z.infer<typeof placeOrderSchema>;

/** `PATCH /api/patient/orders/[id]` — patients may only cancel. */
export const cancelOrderSchema = z.object({
  status: z.literal('CANCELLED', {
    message: 'Orders can only be cancelled.',
  }),
});

// --- video signalling -------------------------------------------------------

/** `POST /api/patient/consultations/[appointmentId]/signals` */
export const signalSchema = z.object({
  payload: z
    .string()
    .min(1, 'Signal payload cannot be empty.')
    .max(120_000, 'Signal payload is too large.'),
});

export type SignalInput = z.infer<typeof signalSchema>;
