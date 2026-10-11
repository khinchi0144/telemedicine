import { z } from 'zod';

import {
  addressSchema,
  citySchema,
  dobSchema,
  fullNameSchema,
  mobileNumberSchema,
  optionalEnumField,
  optionalText,
  pincodeSchema,
  requiredEnumField,
} from './common';
import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from '@/lib/constants/options';
import { INDIAN_STATES } from '@/lib/constants/geo';

/** Step 3 — personal information. */
export const patientPersonalSchema = z.object({
  dateOfBirth: dobSchema,
  gender: requiredEnumField(
    GENDER_OPTIONS.map((option) => option.value),
    'Please select your gender.',
  ),
  address: addressSchema,
  city: citySchema,
  state: requiredEnumField(INDIAN_STATES, 'Please select your state.'),
  pincode: pincodeSchema,
  emergencyContactName: z
    .string()
    .trim()
    .min(2, 'Please enter an emergency contact name.')
    .max(80, 'Please enter a shorter name.'),
  emergencyContactNumber: mobileNumberSchema,
});

export type PatientPersonalInput = z.infer<typeof patientPersonalSchema>;

/**
 * Step 4 — optional health information.
 * Every field may be left empty: registration never depends on it.
 */
export const patientHealthSchema = z.object({
  bloodGroup: optionalEnumField(
    BLOOD_GROUP_OPTIONS.map((option) => option.value),
  ),
  existingConditions: optionalText(
    500,
    'Please keep your conditions under 500 characters.',
  ),
  allergies: optionalText(500, 'Please keep your allergies under 500 characters.'),
  emergencyContact: optionalText(
    500,
    'Please keep your notes under 500 characters.',
  ),
});

export type PatientHealthInput = z.input<typeof patientHealthSchema>;
export type PatientHealthValues = z.output<typeof patientHealthSchema>;

/**
 * Payload accepted by `PATCH /api/patient/profile`.
 *
 * The editor always submits the whole form, so every field is present — but the
 * optional ones may legitimately be an empty string, which normalises to
 * `undefined`. The service merges onto the stored record before re-validating,
 * so a cleared field is stored as "not provided" rather than silently keeping
 * the old value.
 */
export const patientProfileUpdateSchema = z.object({
  fullName: fullNameSchema,
  dateOfBirth: dobSchema,
  gender: requiredEnumField(
    GENDER_OPTIONS.map((option) => option.value),
    'Please select your gender.',
  ),
  address: addressSchema,
  city: citySchema,
  state: requiredEnumField(INDIAN_STATES, 'Please select your state.'),
  pincode: pincodeSchema,
  emergencyContactName: z
    .string()
    .trim()
    .min(2, 'Please enter an emergency contact name.')
    .max(80, 'Please enter a shorter name.'),
  emergencyContactNumber: mobileNumberSchema,
  bloodGroup: optionalEnumField(BLOOD_GROUP_OPTIONS.map((option) => option.value)),
  existingConditions: optionalText(
    500,
    'Please keep your conditions under 500 characters.',
  ),
  allergies: optionalText(500, 'Please keep your allergies under 500 characters.'),
});

export type PatientProfileUpdateInput = z.input<typeof patientProfileUpdateSchema>;

/** Parsed output: optional strings are normalised to `undefined`. */
export type PatientProfileUpdateOutput = z.output<
  typeof patientProfileUpdateSchema
>;

/** Full payload accepted by POST /api/auth/register/patient. */
export const patientRegistrationSchema = z.object({
  basic: z.object({
    fullName: z.string().min(1),
    mobile: z.string().min(1),
    email: z.string().min(1),
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
  }),
  personal: patientPersonalSchema,
  health: patientHealthSchema.partial().optional(),
  oauthTicket: z.string().optional(),
});

export type PatientRegistrationRequest = z.infer<typeof patientRegistrationSchema>;
