/**
 * Option lists shared by the registration forms.
 * Values are the ones persisted in the database (Prisma enum names).
 */

export const GENDER_OPTIONS = [
  { value: 'MALE', label: 'Male' },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER', label: 'Other' },
  { value: 'PREFER_NOT_TO_SAY', label: 'Prefer not to say' },
] as const;

export const BLOOD_GROUP_OPTIONS = [
  { value: 'A+', label: 'A+' },
  { value: 'A-', label: 'A-' },
  { value: 'B+', label: 'B+' },
  { value: 'B-', label: 'B-' },
  { value: 'AB+', label: 'AB+' },
  { value: 'AB-', label: 'AB-' },
  { value: 'O+', label: 'O+' },
  { value: 'O-', label: 'O-' },
  { value: 'UNKNOWN', label: 'Not sure' },
] as const;

export const CONSULTATION_MODE_OPTIONS = [
  { value: 'ONLINE', label: 'Online', description: 'Video consultations only' },
  { value: 'OFFLINE', label: 'Offline', description: 'In-person at your clinic' },
  { value: 'BOTH', label: 'Both', description: 'Online and in-person' },
] as const;

export const SPECIALIZATION_OPTIONS = [
  'General Physician',
  'Dermatologist',
  'Pediatrician',
  'Gynecologist',
  'Cardiologist',
  'Orthopedic',
  'ENT',
  'Psychiatrist',
  'Dentist',
  'Ophthalmologist',
  'Other',
] as const;

export const PHARMACY_TYPE_OPTIONS = [
  { value: 'RETAIL', label: 'Retail', description: 'Sells medicines to customers' },
  {
    value: 'WHOLESALE',
    label: 'Wholesale',
    description: 'Supplies pharmacies and distributors',
  },
  {
    value: 'RETAIL_WHOLESALE',
    label: 'Retail + Wholesale',
    description: 'Both retail and wholesale supply',
  },
] as const;

export const WEEK_DAY_OPTIONS = [
  { value: 'MONDAY', label: 'Monday', short: 'Mon' },
  { value: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { value: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { value: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { value: 'FRIDAY', label: 'Friday', short: 'Fri' },
  { value: 'SATURDAY', label: 'Saturday', short: 'Sat' },
  { value: 'SUNDAY', label: 'Sunday', short: 'Sun' },
] as const;

/** Categories a patient can pick when adding a medical record. */
export const MEDICAL_RECORD_TYPES = [
  'PRESCRIPTION',
  'LAB_REPORT',
  'IMAGING',
  'DISCHARGE_SUMMARY',
  'VACCINATION',
  'OTHER',
] as const;

export const MEDICAL_RECORD_TYPE_OPTIONS = [
  { value: 'PRESCRIPTION', label: 'Prescription' },
  { value: 'LAB_REPORT', label: 'Lab report' },
  { value: 'IMAGING', label: 'Imaging / scan' },
  { value: 'DISCHARGE_SUMMARY', label: 'Discharge summary' },
  { value: 'VACCINATION', label: 'Vaccination record' },
  { value: 'OTHER', label: 'Other document' },
] as const;

export const DOCUMENT_FILE_ACCEPT = '.pdf,.jpg,.jpeg,.png';
export const IMAGE_FILE_ACCEPT = '.jpg,.jpeg,.png';
