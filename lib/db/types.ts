import type {
  AppointmentStatus,
  MedicalRecordType,
  MedicineUnit,
  OrderStatus,
  PrescriptionStatus,
} from '@prisma/client';
import type {
  OtpPurpose,
  Role,
  UserStatus,
  VerificationStatus,
} from '@/types/auth';
import type {
  DocumentStatus,
  DocumentType,
} from '@/types/document';
import type { ConsultationMode } from '@/types/doctor';
import type {
  DayOfWeek,
  OperatingHours,
  PharmacyType,
} from '@/types/pharmacy';

export type {
  DocumentStatus,
  DocumentType,
  OtpPurpose,
  Role,
  UserStatus,
  VerificationStatus,
};

/**
 * Transport records used by the store layer.
 *
 * They mirror the Prisma models but stay free of Prisma types so the same
 * service code runs against PostgreSQL and the local development datastore.
 */

export interface UserRecord {
  id: string;
  role: Role;
  email: string | null;
  mobile: string;
  passwordHash: string | null;
  status: UserStatus;
  isEmailVerified: boolean;
  isMobileVerified: boolean;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PatientProfileRecord {
  id: string;
  userId: string;
  fullName: string;
  dateOfBirth: Date | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  emergencyContactName: string | null;
  emergencyContactNumber: string | null;
  bloodGroup: string | null;
  existingConditions: string | null;
  allergies: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DoctorProfileRecord {
  id: string;
  userId: string;
  fullName: string;
  medicalRegistrationNumber: string;
  medicalCouncil: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  profilePhoto: string | null;
  clinicName: string;
  clinicAddress: string;
  city: string;
  state: string;
  pincode: string;
  consultationMode: ConsultationMode;
  consultationFee: number | null;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** A weekly consultation window for a doctor. */
export interface DoctorAvailabilityRecord {
  id: string;
  doctorId: string;
  day: DayOfWeek;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
}

export interface PharmacyOperatingHoursRecord {
  id: string;
  pharmacyId: string;
  day: DayOfWeek;
  isClosed: boolean;
  openTime: string;
  closeTime: string;
}

export interface PharmacyProfileRecord {
  id: string;
  userId: string;
  pharmacyName: string;
  ownerName: string;
  drugLicenseNumber: string | null;
  gstNumber: string | null;
  pharmacyRegistrationNumber: string | null;
  pharmacyType: PharmacyType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  verificationStatus: VerificationStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentRecord {
  id: string;
  userId: string | null;
  registrationId: string | null;
  documentType: DocumentType;
  fileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
  verificationStatus: DocumentStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface OtpChallengeRecord {
  id: string;
  userId: string | null;
  mobile: string;
  purpose: OtpPurpose;
  codeHash: string;
  salt: string;
  attempts: number;
  maxAttempts: number;
  registrationId: string | null;
  expiresAt: Date;
  consumedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface LinkedAccountRecord {
  id: string;
  userId: string;
  provider: 'GOOGLE';
  providerAccountId: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Single use account tokens.
 *
 * Only the SHA-256 hash of the raw token is persisted — the raw value exists
 * solely inside the link that is emailed to the account owner.
 */
export interface EmailVerificationTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface PasswordResetTokenRecord {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Care: appointments, prescriptions, messaging, medical records, video
// ---------------------------------------------------------------------------

export interface AppointmentRecord {
  id: string;
  patientUserId: string;
  doctorUserId: string;
  doctorProfileId: string;
  /** Calendar day of the visit (UTC midnight, matching the Prisma model). */
  scheduledDate: Date;
  /** 24h "HH:mm" slot boundaries inside the doctor's availability. */
  startTime: string;
  endTime: string;
  status: AppointmentStatus;
  reason: string | null;
  meetingUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface PrescriptionItemRecord {
  id: string;
  prescriptionId: string;
  medicineName: string;
  dosage: string | null;
  frequency: string | null;
  duration: string | null;
  instructions: string | null;
}

export interface PrescriptionRecord {
  id: string;
  patientUserId: string;
  doctorUserId: string;
  appointmentId: string | null;
  diagnosis: string | null;
  notes: string | null;
  status: PrescriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

/** A prescription joined with its medicine lines in one read. */
export type PrescriptionWithItems = PrescriptionRecord & {
  items: PrescriptionItemRecord[];
};

export interface ConversationRecord {
  id: string;
  patientUserId: string;
  doctorUserId: string;
  lastMessageAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageRecord {
  id: string;
  conversationId: string;
  senderUserId: string;
  body: string;
  createdAt: Date;
}

/** A file or note a patient keeps in their own health record. */
export interface MedicalRecordRecord {
  id: string;
  patientUserId: string;
  recordType: MedicalRecordType;
  title: string;
  description: string | null;
  documentId: string | null;
  /** Calendar day the record refers to (report date, visit date, …). */
  recordDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/** One WebRTC signalling exchange inside a video room. */
export interface ConsultationSignalRecord {
  id: string;
  appointmentId: string;
  senderUserId: string;
  /** SDP / candidate JSON as a string — the payload shape stays opaque here. */
  payload: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Pharmacy commerce: inventory + orders
// ---------------------------------------------------------------------------

export interface MedicineInventoryRecord {
  id: string;
  pharmacyUserId: string;
  name: string;
  brand: string | null;
  strength: string | null;
  unit: MedicineUnit;
  priceInPaise: number;
  stockQuantity: number;
  requiresRx: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrderItemRecord {
  id: string;
  orderId: string;
  medicineId: string | null;
  medicineName: string;
  quantity: number;
  /** Snapshot of `MedicineInventory.priceInPaise` at order time. */
  unitPriceInPaise: number;
}

export interface PharmacyOrderRecord {
  id: string;
  patientUserId: string;
  pharmacyUserId: string;
  status: OrderStatus;
  totalInPaise: number;
  deliveryAddress: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/** An order joined with its medicine lines in one read. */
export type OrderWithItems = PharmacyOrderRecord & { items: OrderItemRecord[] };

// ---------------------------------------------------------------------------
// Store inputs
// ---------------------------------------------------------------------------

export interface CreateUserInput {
  id?: string;
  role: Role;
  email?: string | null;
  mobile: string;
  passwordHash?: string | null;
  status?: UserStatus;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
}

export interface UpdateUserInput {
  email?: string | null;
  passwordHash?: string | null;
  status?: UserStatus;
  isEmailVerified?: boolean;
  isMobileVerified?: boolean;
  lastLoginAt?: Date | null;
}

export interface UpsertPatientProfileInput {
  userId: string;
  fullName: string;
  dateOfBirth?: Date | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  pincode?: string | null;
  emergencyContactName?: string | null;
  emergencyContactNumber?: string | null;
  bloodGroup?: string | null;
  existingConditions?: string | null;
  allergies?: string | null;
}

/**
 * A professional profile joined with its account row.
 *
 * The admin verification console needs both halves (licence details *and* the
 * account status / mobile number) so it never has to join tables itself.
 */
export interface ProfessionalProfileEntry {
  profileId: string;
  userId: string;
  role: 'DOCTOR' | 'PHARMACY';
  displayName: string;
  mobile: string;
  email: string | null;
  accountStatus: UserStatus;
  verificationStatus: VerificationStatus;
  /** Specialization for doctors, pharmacy type for pharmacies. */
  descriptor: string;
  /** Registration number / drug licence number. */
  registrationNumber: string;
  location: string;
  createdAt: Date;
  documentCount: number;
}

export interface UpsertDoctorProfileInput {
  userId: string;
  fullName: string;
  medicalRegistrationNumber: string;
  medicalCouncil: string;
  specialization: string;
  qualification: string;
  experienceYears: number;
  profilePhoto?: string | null;
  clinicName: string;
  clinicAddress: string;
  city: string;
  state: string;
  pincode: string;
  consultationMode: ConsultationMode;
  consultationFee?: number | null;
}

/** Replaces a doctor's whole weekly availability in one call. */
export interface DoctorAvailabilityInput {
  day: DayOfWeek;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
}

export interface UpsertPharmacyProfileInput {
  userId: string;
  pharmacyName: string;
  ownerName: string;
  drugLicenseNumber?: string | null;
  gstNumber?: string | null;
  pharmacyRegistrationNumber?: string | null;
  pharmacyType: PharmacyType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  contactNumber: string;
  operatingHours: OperatingHours;
}

export interface CreateDocumentInput {
  id?: string;
  userId?: string | null;
  registrationId?: string | null;
  documentType: DocumentType;
  fileName: string;
  storageKey: string;
  mimeType: string;
  fileSize: number;
}

export interface CreateOtpChallengeInput {
  id?: string;
  userId?: string | null;
  mobile: string;
  purpose: OtpPurpose;
  codeHash: string;
  salt: string;
  registrationId?: string | null;
  expiresAt: Date;
  maxAttempts?: number;
}

export interface UpdateOtpChallengeInput {
  attempts?: number;
  consumedAt?: Date | null;
  expiresAt?: Date;
}

export interface UpsertLinkedAccountInput {
  userId: string;
  provider: 'GOOGLE';
  providerAccountId: string;
}

/** Booking a slot on a doctor's calendar. `id` lets the caller pre-compute a
 * meeting URL for the appointment it is about to create. */
export interface CreateAppointmentInput {
  id?: string;
  patientUserId: string;
  doctorUserId: string;
  doctorProfileId: string;
  scheduledDate: Date;
  startTime: string;
  endTime: string;
  status?: AppointmentStatus;
  reason?: string | null;
  meetingUrl?: string | null;
}

/** Partial update — anything omitted keeps its current value. */
export interface UpdateAppointmentInput {
  status?: AppointmentStatus;
  meetingUrl?: string | null;
  reason?: string | null;
}

/** A prescription written by a doctor, created with its medicine lines. */
export interface CreatePrescriptionInput {
  patientUserId: string;
  doctorUserId: string;
  appointmentId?: string | null;
  diagnosis?: string | null;
  notes?: string | null;
  status?: PrescriptionStatus;
  items: Array<{
    medicineName: string;
    dosage?: string | null;
    frequency?: string | null;
    duration?: string | null;
    instructions?: string | null;
  }>;
}

/** One conversation per patient / doctor pair — reuses the existing row. */
export interface UpsertConversationInput {
  patientUserId: string;
  doctorUserId: string;
}

export interface CreateMessageInput {
  conversationId: string;
  senderUserId: string;
  body: string;
}

export interface CreateMedicalRecordInput {
  patientUserId: string;
  recordType: MedicalRecordType;
  title: string;
  description?: string | null;
  documentId?: string | null;
  recordDate?: Date | null;
}

export interface CreateConsultationSignalInput {
  appointmentId: string;
  senderUserId: string;
  payload: string;
}

/** A line of stock a verified pharmacy publishes for patients to search. */
export interface UpsertMedicineInventoryInput {
  pharmacyUserId: string;
  name: string;
  brand?: string | null;
  strength?: string | null;
  unit?: MedicineUnit;
  priceInPaise: number;
  stockQuantity: number;
  requiresRx?: boolean;
}

export interface UpdateMedicineInventoryInput {
  name?: string;
  brand?: string | null;
  strength?: string | null;
  unit?: MedicineUnit;
  priceInPaise?: number;
  stockQuantity?: number;
  requiresRx?: boolean;
}

/**
 * Placing an order. Prices are snapshotted onto the lines at creation time so
 * later inventory price changes never rewrite order history.
 */
export interface CreateOrderInput {
  patientUserId: string;
  pharmacyUserId: string;
  deliveryAddress?: string | null;
  items: Array<{
    medicineId: string | null;
    medicineName: string;
    quantity: number;
    unitPriceInPaise: number;
  }>;
}
