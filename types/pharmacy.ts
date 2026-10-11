import type { RegisterableRole, VerificationStatus } from './auth';
import type { DocumentType } from './document';
import {
  PHARMACY_TYPE_OPTIONS,
  WEEK_DAY_OPTIONS,
} from '@/lib/constants/options';

export type PharmacyType = (typeof PHARMACY_TYPE_OPTIONS)[number]['value'];
export type DayOfWeek = (typeof WEEK_DAY_OPTIONS)[number]['value'];

export interface DayHours {
  isClosed: boolean;
  openTime: string;
  closeTime: string;
}

export type OperatingHours = Record<DayOfWeek, DayHours>;

export interface PharmacyBasicDetails {
  pharmacyName: string;
  ownerName: string;
  mobile: string;
  email: string;
  password: string;
  confirmPassword: string;
}

/** Step 3 — pharmacy details. */
export interface PharmacyDetails {
  drugLicenseNumber: string;
  gstNumber: string;
  pharmacyRegistrationNumber: string;
  pharmacyType: PharmacyType | '';
}

/** Step 5 — address, contact number and operating hours. */
export interface PharmacyAddressDetails {
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  operatingHours: OperatingHours;
}

export interface PharmacyRegistrationPayload {
  basic: PharmacyBasicDetails;
  pharmacy: PharmacyDetails;
  address: PharmacyAddressDetails;
  documentIds: string[];
  oauthTicket?: string;
}

export interface PharmacyRegistrationInput extends PharmacyRegistrationPayload {
  role: RegisterableRole;
}

export const PHARMACY_DOCUMENT_TYPES: DocumentType[] = [
  'DRUG_LICENSE',
  'GST_CERTIFICATE',
  'PHARMACY_REGISTRATION_CERTIFICATE',
  'IDENTITY_PROOF',
  'PHARMACY_SHOP_PHOTO',
];

export const PHARMACY_STEPS = [
  { id: 'basic', title: 'Basic Details', short: 'Account' },
  { id: 'otp', title: 'OTP Verification', short: 'Verify' },
  { id: 'pharmacy', title: 'Pharmacy Details', short: 'Pharmacy' },
  { id: 'documents', title: 'Document Upload', short: 'Documents' },
  { id: 'address', title: 'Address & Hours', short: 'Address' },
  { id: 'submitted', title: 'Registration Submitted', short: 'Done' },
] as const;

export type PharmacyStepId = (typeof PHARMACY_STEPS)[number]['id'];

export interface PharmacyRoleHomeData {
  role: 'PHARMACY';
  pharmacyName: string | null;
  city: string | null;
  pharmacyType: PharmacyType | null;
  verificationStatus: VerificationStatus;
}
