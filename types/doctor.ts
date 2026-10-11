import type { RegisterableRole, VerificationStatus } from './auth';
import type { DocumentType } from './document';
import {
  CONSULTATION_MODE_OPTIONS,
  SPECIALIZATION_OPTIONS,
} from '@/lib/constants/options';

export type ConsultationMode =
  (typeof CONSULTATION_MODE_OPTIONS)[number]['value'];
export type Specialization = (typeof SPECIALIZATION_OPTIONS)[number];

export interface DoctorBasicDetails {
  fullName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Step 3 — professional information. */
export interface DoctorProfessionalDetails {
  medicalRegistrationNumber: string;
  medicalCouncil: string;
  specialization: string;
  qualification: string;
  experienceYears: string;
}

/** Step 5 — clinic / practice information. */
export interface DoctorClinicDetails {
  clinicName: string;
  clinicAddress: string;
  city: string;
  state: string;
  pincode: string;
  consultationMode: ConsultationMode | '';
}

export interface DoctorRegistrationPayload {
  basic: DoctorBasicDetails;
  professional: DoctorProfessionalDetails;
  clinic: DoctorClinicDetails;
  documentIds: string[];
  oauthTicket?: string;
}

export interface DoctorRegistrationInput extends DoctorRegistrationPayload {
  role: RegisterableRole;
}

export const DOCTOR_DOCUMENT_TYPES: DocumentType[] = [
  'MEDICAL_REGISTRATION_CERTIFICATE',
  'QUALIFICATION_CERTIFICATE',
  'IDENTITY_PROOF',
  'PROFILE_PHOTO',
];

export const DOCTOR_STEPS = [
  { id: 'basic', title: 'Basic Details', short: 'Account' },
  { id: 'otp', title: 'OTP Verification', short: 'Verify' },
  { id: 'professional', title: 'Professional Details', short: 'Professional' },
  { id: 'documents', title: 'Document Upload', short: 'Documents' },
  { id: 'clinic', title: 'Clinic / Practice Details', short: 'Clinic' },
  { id: 'submitted', title: 'Registration Submitted', short: 'Done' },
] as const;

export type DoctorStepId = (typeof DOCTOR_STEPS)[number]['id'];

export interface DoctorRoleHomeData {
  role: 'DOCTOR';
  fullName: string;
  clinicName: string | null;
  specialization: string | null;
  city: string | null;
  verificationStatus: VerificationStatus;
}
