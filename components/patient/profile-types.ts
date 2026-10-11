import type { z } from 'zod';

import { patientProfileUpdateSchema } from '@/lib/validations/patient';

/**
 * Form shape of the patient profile.
 *
 * Derived straight from the schema so the editor can never drift from what the
 * API accepts: `input` is what the `<input>` elements produce, `output` is the
 * normalised shape the server validates and stores.
 */
export type ProfileValues = z.input<typeof patientProfileUpdateSchema>;
export type ProfileOutput = z.output<typeof patientProfileUpdateSchema>;

export const EMPTY_PROFILE: ProfileValues = {
  fullName: '',
  dateOfBirth: '',
  gender: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  emergencyContactName: '',
  emergencyContactNumber: '',
  bloodGroup: '',
  existingConditions: '',
  allergies: '',
};

/** Rows rendered by the read-only summary view. */
export const SUMMARY_FIELDS: { key: keyof ProfileValues & string; label: string }[] = [
  { key: 'fullName', label: 'Full name' },
  { key: 'dateOfBirth', label: 'Date of birth' },
  { key: 'gender', label: 'Gender' },
  { key: 'bloodGroup', label: 'Blood group' },
  { key: 'address', label: 'Address' },
  { key: 'city', label: 'City' },
  { key: 'state', label: 'State' },
  { key: 'pincode', label: 'Pincode' },
  { key: 'emergencyContactName', label: 'Emergency contact' },
  { key: 'emergencyContactNumber', label: 'Emergency number' },
  { key: 'existingConditions', label: 'Conditions' },
  { key: 'allergies', label: 'Allergies' },
];