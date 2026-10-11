import { z } from 'zod';

import {
  addressSchema,
  citySchema,
  pincodeSchema,
  requiredEnumField,
  timeSchema,
} from './common';
import {
  CONSULTATION_MODE_OPTIONS,
  SPECIALIZATION_OPTIONS,
} from '@/lib/constants/options';
import { INDIAN_STATES, MEDICAL_COUNCILS } from '@/lib/constants/geo';

/** Reusable "pick a state" field so every address form behaves identically. */
export const stateFieldSchema = requiredEnumField(
  INDIAN_STATES,
  'Please select your state.',
);

/** Step 3 — professional information. */
export const doctorProfessionalSchema = z.object({
  medicalRegistrationNumber: z
    .string()
    .trim()
    .min(4, 'Please enter your medical registration number.')
    .max(40, 'Please enter a shorter registration number.')
    .regex(/^[A-Za-z0-9/-]+$/, 'Please use only letters, numbers, - and /.'),
  medicalCouncil: requiredEnumField(
    MEDICAL_COUNCILS,
    'Please select your medical council.',
  ),
  specialization: z
    .string()
    .trim()
    .min(2, 'Please select your specialization.')
    .refine(
      (value) =>
        (SPECIALIZATION_OPTIONS as readonly string[]).includes(value) ||
        value.length > 1,
      'Please select your specialization from the list.',
    ),
  qualification: z
    .string()
    .trim()
    .min(2, 'Please enter your qualification.')
    .max(160, 'Please enter a shorter qualification.'),
  experienceYears: z
    .string()
    .trim()
    .regex(/^\d{1,2}$/, 'Please enter your years of experience as a number.')
    .refine(
      (value) => Number(value) <= 70,
      'Please enter a valid number of years of experience.',
    ),
});

export type DoctorProfessionalInput = z.infer<typeof doctorProfessionalSchema>;

/** One weekly availability slot. */
const doctorAvailabilitySlotSchema = z.object({
  day: z.enum([
    'MONDAY',
    'TUESDAY',
    'WEDNESDAY',
    'THURSDAY',
    'FRIDAY',
    'SATURDAY',
    'SUNDAY',
  ] as const),
  isEnabled: z.boolean(),
  startTime: timeSchema,
  endTime: timeSchema,
});

export type DoctorAvailabilitySlotInput = z.infer<
  typeof doctorAvailabilitySlotSchema
>;

/**
 * The whole week. An empty array is valid — it means "no consultation slots
 * published yet", which is different from an invalid week.
 *
 * `superRefine` (not `.refine`) is used so the "end must be later than start"
 * error lands on the individual slot that is wrong, rather than on the array.
 */
export const doctorAvailabilitySchema = z
  .array(doctorAvailabilitySlotSchema)
  .max(7, 'A week has seven days.')
  .superRefine((slots, ctx) => {
    const seen = new Set<string>();
    slots.forEach((slot, index) => {
      if (seen.has(slot.day)) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'day'],
          message: 'Each day can only be configured once.',
        });
      }
      seen.add(slot.day);

      if (slot.isEnabled && slot.startTime >= slot.endTime) {
        ctx.addIssue({
          code: 'custom',
          path: [index, 'endTime'],
          message: 'The end time must be later than the start time.',
        });
      }
    });
  });

export type DoctorAvailabilityValues = z.infer<typeof doctorAvailabilitySchema>;

/** Step 5 — clinic / practice information. */
export const doctorClinicSchema = z.object({
  clinicName: z
    .string()
    .trim()
    .min(2, 'Please enter your clinic or hospital name.')
    .max(120, 'Please enter a shorter clinic name.'),
  clinicAddress: addressSchema,
  city: citySchema,
  state: stateFieldSchema,
  pincode: pincodeSchema,
  consultationMode: requiredEnumField(
    CONSULTATION_MODE_OPTIONS.map((option) => option.value),
    'Please select a consultation mode.',
  ),
  /**
   * Fee per consultation.
   *
   * Optional on purpose: a doctor may leave it blank and be contacted
   * directly. `undefined` is normalised to `null` so the stored column is
   * always "a number or nothing" — never the string "undefined".
   */
  consultationFee: z
    .string()
    .trim()
    .optional()
    .transform((value) => value ?? '')
    .refine((value) => value === '' || /^\d{1,5}$/.test(value), {
      message: 'Please enter the consultation fee as a whole number of rupees.',
    })
    .refine((value) => value === '' || Number(value) <= 100000, {
      message: 'Please enter a consultation fee below 100000.',
    })
    .transform((value) => (value === '' ? null : Number(value))),
  /**
   * Weekly consultation windows. Optional — a doctor who has not settled on a
   * timetable yet can submit without one and publish it later.
   */
  availability: doctorAvailabilitySchema.default([]),
});

export type DoctorClinicInput = z.infer<typeof doctorClinicSchema>;

/**
 * Raw form shape for the clinic step.
 *
 * `consultationFee` is typed as a string on the way in (that is what an `<input>`
 * produces) and is transformed to `number | null` by the schema, so the form
 * must be typed with `z.input` and the wizard with `z.output`.
 */
export type DoctorClinicFormValues = z.input<typeof doctorClinicSchema>;

/** Full payload accepted by POST /api/auth/register/doctor. */
export const doctorRegistrationSchema = z.object({
  basic: z.object({
    fullName: z.string().min(1),
    mobile: z.string().min(1),
    email: z.string().min(1),
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
  }),
  professional: doctorProfessionalSchema,
  // `availability` lives inside `clinic` — the wizard collects both on step 5.
  clinic: doctorClinicSchema,
  documentIds: z.array(z.string().min(1)).max(10).default([]),
  oauthTicket: z.string().optional(),
});

export type DoctorRegistrationRequest = z.infer<typeof doctorRegistrationSchema>;

/** States offered in the clinic address dropdown. */
export { INDIAN_STATES };
