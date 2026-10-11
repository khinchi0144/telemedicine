import type { RegisterableRole, Role } from './auth';
import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from '@/lib/constants/options';

export type Gender = (typeof GENDER_OPTIONS)[number]['value'];
export type BloodGroup = (typeof BLOOD_GROUP_OPTIONS)[number]['value'];

/** Step 1 — account credentials (shared shape, validated in lib/validations). */
export interface PatientBasicDetails {
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Step 3 — personal information. */
export interface PatientPersonalDetails {
  dateOfBirth: string;
  gender: Gender | '';
  address: string;
  city: string;
  state: string;
  pincode: string;
  emergencyContactName: string;
  emergencyContactNumber: string;
}

/** Step 4 — optional health information. Every field may stay empty. */
export interface PatientHealthDetails {
  bloodGroup: BloodGroup | '';
  existingConditions: string;
  allergies: string;
  emergencyContact: string;
}

export interface PatientRegistrationPayload {
  basic: PatientBasicDetails;
  personal: PatientPersonalDetails;
  health: PatientHealthDetails;
  /** Optional Google identity ticket to link instead of using a password. */
  oauthTicket?: string;
}

export interface PatientRegistrationInput extends PatientRegistrationPayload {
  role: RegisterableRole;
}

export const PATIENT_STEPS = [
  { id: 'basic', title: 'Basic Details', short: 'Account' },
  { id: 'otp', title: 'OTP Verification', short: 'Verify' },
  { id: 'personal', title: 'Personal Details', short: 'Personal' },
  { id: 'health', title: 'Health Information', short: 'Health' },
  { id: 'success', title: 'Registration Complete', short: 'Done' },
] as const;

export type PatientStepId = (typeof PATIENT_STEPS)[number]['id'];

export interface PatientRoleHomeData {
  role: Role;
  fullName: string;
  mobile: string;
  email: string | null;
  city: string | null;
  status: string;
}
