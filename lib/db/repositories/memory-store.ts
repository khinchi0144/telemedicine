import 'server-only';

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

import { createId } from '@/lib/utils/crypto';
import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import { logger } from '@/lib/utils/logger';
import { WEEK_DAY_OPTIONS } from '@/lib/constants/options';
import type { VerificationStatus } from '@/types/auth';
import type {
  AppointmentRecord,
  ConsultationSignalRecord,
  ConversationRecord,
  CreateAppointmentInput,
  CreateConsultationSignalInput,
  CreateDocumentInput,
  CreateMedicalRecordInput,
  CreateMessageInput,
  CreateOtpChallengeInput,
  CreateOrderInput,
  CreatePrescriptionInput,
  CreateUserInput,
  DoctorAvailabilityInput,
  DoctorAvailabilityRecord,
  DocumentRecord,
  DocumentStatus,
  DoctorProfileRecord,
  EmailVerificationTokenRecord,
  LinkedAccountRecord,
  MedicalRecordRecord,
  MedicineInventoryRecord,
  MessageRecord,
  OtpChallengeRecord,
  OrderItemRecord,
  PasswordResetTokenRecord,
  PatientProfileRecord,
  PharmacyOperatingHoursRecord,
  PharmacyOrderRecord,
  PharmacyProfileRecord,
  PrescriptionItemRecord,
  PrescriptionRecord,
  PrescriptionWithItems,
  ProfessionalProfileEntry,
  UpdateAppointmentInput,
  UpdateMedicineInventoryInput,
  UpdateOtpChallengeInput,
  UpdateUserInput,
  UpsertConversationInput,
  UpsertDoctorProfileInput,
  UpsertLinkedAccountInput,
  UpsertMedicineInventoryInput,
  UpsertPatientProfileInput,
  UpsertPharmacyProfileInput,
  UserRecord,
  OrderWithItems,
} from '../types';
import type {
  DataStore,
  DoctorDirectoryFilter,
  PharmacyDirectoryFilter,
} from '../store';
import type { OrderStatus } from '@prisma/client';

interface MemoryState {
  users: UserRecord[];
  patientProfiles: PatientProfileRecord[];
  doctorProfiles: DoctorProfileRecord[];
  doctorAvailability: DoctorAvailabilityRecord[];
  pharmacyProfiles: PharmacyProfileRecord[];
  pharmacyHours: PharmacyOperatingHoursRecord[];
  documents: DocumentRecord[];
  otpChallenges: OtpChallengeRecord[];
  linkedAccounts: LinkedAccountRecord[];
  emailVerificationTokens: EmailVerificationTokenRecord[];
  passwordResetTokens: PasswordResetTokenRecord[];
  appointments: AppointmentRecord[];
  prescriptions: PrescriptionRecord[];
  prescriptionItems: PrescriptionItemRecord[];
  conversations: ConversationRecord[];
  messages: MessageRecord[];
  medicalRecords: MedicalRecordRecord[];
  consultationSignals: ConsultationSignalRecord[];
  medicines: MedicineInventoryRecord[];
  orders: PharmacyOrderRecord[];
  orderItems: OrderItemRecord[];
}

const EMPTY_STATE: MemoryState = {
  users: [],
  patientProfiles: [],
  doctorProfiles: [],
  doctorAvailability: [],
  pharmacyProfiles: [],
  pharmacyHours: [],
  documents: [],
  otpChallenges: [],
  linkedAccounts: [],
  emailVerificationTokens: [],
  passwordResetTokens: [],
  appointments: [],
  prescriptions: [],
  prescriptionItems: [],
  conversations: [],
  messages: [],
  medicalRecords: [],
  consultationSignals: [],
  medicines: [],
  orders: [],
  orderItems: [],
};

const DATA_DIR = path.join(process.cwd(), '.data');
const DATA_FILE = path.join(DATA_DIR, 'medicare-dev-store.json');

/** JSON stores dates as strings — revive them into Date objects. */
function reviveDates<T extends object>(record: T): T {
  const output = { ...record } as Record<string, unknown>;
  for (const key of Object.keys(output)) {
    if (
      typeof output[key] === 'string' &&
      /\d{4}-\d{2}-\d{2}T/.test(output[key] as string)
    ) {
      output[key] = new Date(output[key] as string);
    }
  }
  return output as T;
}

function reviveUser(user: UserRecord): UserRecord {
  return reviveDates(user);
}

function now() {
  return new Date();
}

/**
 * File backed development datastore.
 *
 * Lets the complete registration flow be exercised without PostgreSQL or any
 * external credentials. It is only selected when DATABASE_URL is empty and is
 * never used in production, so swapping to PostgreSQL requires no change in
 * the service layer.
 */
export class MemoryDataStore implements DataStore {
  readonly kind = 'memory' as const;
  private state: MemoryState = structuredClone(EMPTY_STATE);
  private loaded = false;

  private load() {
    if (this.loaded) return;
    this.loaded = true;
    try {
      if (!existsSync(DATA_FILE)) return;
      const raw = JSON.parse(readFileSync(DATA_FILE, 'utf8')) as { state?: MemoryState };
      const parsed = { ...structuredClone(EMPTY_STATE), ...(raw.state ?? {}) };
      this.state = {
        ...parsed,
        users: (parsed.users ?? []).map(reviveUser),
        patientProfiles: (parsed.patientProfiles ?? []).map(reviveDates),
        doctorProfiles: (parsed.doctorProfiles ?? []).map(reviveDates),
        pharmacyProfiles: (parsed.pharmacyProfiles ?? []).map(reviveDates),
        documents: (parsed.documents ?? []).map(reviveDates),
        otpChallenges: (parsed.otpChallenges ?? []).map(reviveDates),
        linkedAccounts: (parsed.linkedAccounts ?? []).map(reviveDates),
        appointments: (parsed.appointments ?? []).map(reviveDates),
        prescriptions: (parsed.prescriptions ?? []).map(reviveDates),
        conversations: (parsed.conversations ?? []).map(reviveDates),
        messages: (parsed.messages ?? []).map(reviveDates),
        medicalRecords: (parsed.medicalRecords ?? []).map(reviveDates),
        consultationSignals: (parsed.consultationSignals ?? []).map(reviveDates),
        medicines: (parsed.medicines ?? []).map(reviveDates),
        orders: (parsed.orders ?? []).map(reviveDates),
      };
    } catch (error) {
      logger.warn('Could not read the development datastore, starting empty', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
      this.state = structuredClone(EMPTY_STATE);
    }
  }

  private persist() {
    if (env.isProduction) return;
    try {
      if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(DATA_FILE, JSON.stringify({ state: this.state }, null, 2));
    } catch (error) {
      logger.warn('Could not persist the development datastore', {
        reason: error instanceof Error ? error.message : 'unknown',
      });
    }
  }

  private assertEmailAvailable(email: string | null | undefined, exceptId?: string) {
    if (!email) return;
    const target = email.toLowerCase();
    if (this.state.users.some((user) => user.email === target && user.id !== exceptId)) {
      throw Errors.emailTaken();
    }
  }

  private assertMobileAvailable(mobile: string, exceptId?: string) {
    if (this.state.users.some((user) => user.mobile === mobile && user.id !== exceptId)) {
      throw Errors.mobileTaken();
    }
  }

  // --- users ---------------------------------------------------------------
  async findUserById(id: string) {
    this.load();
    return this.state.users.find((user) => user.id === id) ?? null;
  }

  async findUserByEmail(email: string) {
    this.load();
    const target = email.toLowerCase();
    return this.state.users.find((user) => user.email === target) ?? null;
  }

  async findUserByMobile(mobile: string) {
    this.load();
    return this.state.users.find((user) => user.mobile === mobile) ?? null;
  }

  async createUser(input: CreateUserInput): Promise<UserRecord> {
    this.load();
    this.assertEmailAvailable(input.email);
    this.assertMobileAvailable(input.mobile);
    const timestamp = now();
    const user: UserRecord = {
      id: input.id ?? createId('usr'),
      role: input.role,
      email: input.email ? input.email.toLowerCase() : null,
      mobile: input.mobile,
      passwordHash: input.passwordHash ?? null,
      status: input.status ?? 'ACTIVE',
      isEmailVerified: input.isEmailVerified ?? false,
      isMobileVerified: input.isMobileVerified ?? false,
      lastLoginAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.users.push(user);
    this.persist();
    return user;
  }

  async updateUser(id: string, patch: UpdateUserInput): Promise<UserRecord> {
    this.load();
    const index = this.state.users.findIndex((user) => user.id === id);
    if (index === -1) throw Errors.notFound('Account not found.');
    const current = this.state.users[index];
    if (patch.email !== undefined) this.assertEmailAvailable(patch.email, id);
    const updated: UserRecord = {
      ...current,
      ...(patch.email !== undefined
        ? { email: patch.email ? patch.email.toLowerCase() : null }
        : {}),
      ...(patch.passwordHash !== undefined ? { passwordHash: patch.passwordHash } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.isEmailVerified !== undefined
        ? { isEmailVerified: patch.isEmailVerified }
        : {}),
      ...(patch.isMobileVerified !== undefined
        ? { isMobileVerified: patch.isMobileVerified }
        : {}),
      ...(patch.lastLoginAt !== undefined ? { lastLoginAt: patch.lastLoginAt } : {}),
      updatedAt: now(),
    };
    this.state.users[index] = updated;
    this.persist();
    return updated;
  }

  async findUserByLinkedAccount(provider: 'GOOGLE', providerAccountId: string) {
    this.load();
    const linked = this.state.linkedAccounts.find(
      (account) =>
        account.provider === provider &&
        account.providerAccountId === providerAccountId,
    );
    if (!linked) return null;
    return this.state.users.find((user) => user.id === linked.userId) ?? null;
  }

  async upsertLinkedAccount(input: UpsertLinkedAccountInput): Promise<LinkedAccountRecord> {
    this.load();
    const timestamp = now();
    const existing = this.state.linkedAccounts.find(
      (account) => account.userId === input.userId,
    );
    if (existing) {
      existing.provider = input.provider;
      existing.providerAccountId = input.providerAccountId;
      existing.updatedAt = timestamp;
      this.persist();
      return existing;
    }
    const record: LinkedAccountRecord = {
      id: createId('lnk'),
      userId: input.userId,
      provider: input.provider,
      providerAccountId: input.providerAccountId,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.linkedAccounts.push(record);
    this.persist();
    return record;
  }


  // --- patient profile -----------------------------------------------------
  async getPatientProfileByUserId(userId: string) {
    this.load();
    return this.state.patientProfiles.find((p) => p.userId === userId) ?? null;
  }

  async upsertPatientProfile(input: UpsertPatientProfileInput) {
    this.load();
    const timestamp = now();
    const index = this.state.patientProfiles.findIndex((p) => p.userId === input.userId);
    const existing = index >= 0 ? this.state.patientProfiles[index] : null;
    const record: PatientProfileRecord = {
      id: existing?.id ?? createId('pat'),
      userId: input.userId,
      fullName: input.fullName,
      dateOfBirth: input.dateOfBirth ?? null,
      gender: input.gender ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      pincode: input.pincode ?? null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactNumber: input.emergencyContactNumber ?? null,
      bloodGroup: input.bloodGroup ?? null,
      existingConditions: input.existingConditions ?? null,
      allergies: input.allergies ?? null,
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    if (index >= 0) this.state.patientProfiles[index] = record;
    else this.state.patientProfiles.push(record);
    this.persist();
    return record;
  }

  // --- doctor profile ------------------------------------------------------
  async getDoctorProfileByUserId(userId: string) {
    this.load();
    return this.state.doctorProfiles.find((p) => p.userId === userId) ?? null;
  }

  async upsertDoctorProfile(input: UpsertDoctorProfileInput) {
    this.load();
    const timestamp = now();
    const index = this.state.doctorProfiles.findIndex((p) => p.userId === input.userId);
    const existing = index >= 0 ? this.state.doctorProfiles[index] : null;
    const record: DoctorProfileRecord = {
      id: existing?.id ?? createId('doc'),
      userId: input.userId,
      fullName: input.fullName,
      medicalRegistrationNumber: input.medicalRegistrationNumber,
      medicalCouncil: input.medicalCouncil,
      specialization: input.specialization,
      qualification: input.qualification,
      experienceYears: input.experienceYears,
      profilePhoto: input.profilePhoto ?? existing?.profilePhoto ?? null,
      clinicName: input.clinicName,
      clinicAddress: input.clinicAddress,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      consultationMode: input.consultationMode,
      consultationFee: input.consultationFee ?? existing?.consultationFee ?? null,
      verificationStatus: existing?.verificationStatus ?? 'PENDING_VERIFICATION',
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    if (index >= 0) this.state.doctorProfiles[index] = record;
    else this.state.doctorProfiles.push(record);
    this.persist();
    return record;
  }

  // --- doctor availability --------------------------------------------------
  async getDoctorAvailability(doctorId: string) {
    this.load();
    return this.state.doctorAvailability.filter((row) => row.doctorId === doctorId);
  }

  async replaceDoctorAvailability(
    doctorId: string,
    slots: DoctorAvailabilityInput[],
  ) {
    this.load();
    this.state.doctorAvailability = this.state.doctorAvailability.filter(
      (row) => row.doctorId !== doctorId,
    );
    for (const slot of slots) {
      this.state.doctorAvailability.push({
        id: createId('dav'),
        doctorId,
        day: slot.day,
        isEnabled: slot.isEnabled,
        startTime: slot.startTime,
        endTime: slot.endTime,
      });
    }
    this.persist();
    return this.getDoctorAvailability(doctorId);
  }

  // --- pharmacy profile ----------------------------------------------------
  async getPharmacyProfileByUserId(userId: string) {
    this.load();
    return this.state.pharmacyProfiles.find((p) => p.userId === userId) ?? null;
  }

  async upsertPharmacyProfile(input: UpsertPharmacyProfileInput) {
    this.load();
    const timestamp = now();
    const index = this.state.pharmacyProfiles.findIndex((p) => p.userId === input.userId);
    const existing = index >= 0 ? this.state.pharmacyProfiles[index] : null;
    const record: PharmacyProfileRecord = {
      id: existing?.id ?? createId('phr'),
      userId: input.userId,
      pharmacyName: input.pharmacyName,
      ownerName: input.ownerName,
      drugLicenseNumber: input.drugLicenseNumber ?? null,
      gstNumber: input.gstNumber ?? null,
      pharmacyRegistrationNumber: input.pharmacyRegistrationNumber ?? null,
      pharmacyType: input.pharmacyType,
      address: input.address,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      contactNumber: input.contactNumber,
      verificationStatus: existing?.verificationStatus ?? 'PENDING_VERIFICATION',
      createdAt: existing?.createdAt ?? timestamp,
      updatedAt: timestamp,
    };
    if (index >= 0) this.state.pharmacyProfiles[index] = record;
    else this.state.pharmacyProfiles.push(record);

    // Operating hours are replaced as a set so the seven days stay consistent.
    this.state.pharmacyHours = this.state.pharmacyHours.filter(
      (row) => row.pharmacyId !== record.id,
    );
    for (const day of WEEK_DAY_OPTIONS) {
      const hours = input.operatingHours[day.value];
      this.state.pharmacyHours.push({
        id: createId('hrs'),
        pharmacyId: record.id,
        day: day.value,
        isClosed: hours?.isClosed ?? false,
        openTime: hours?.openTime ?? '09:00',
        closeTime: hours?.closeTime ?? '21:00',
      });
    }
    this.persist();
    return record;
  }

  // --- admin: verification console -----------------------------------------
  async listProfessionalProfiles(role: 'DOCTOR' | 'PHARMACY') {
    this.load();
    const profiles =
      role === 'DOCTOR' ? this.state.doctorProfiles : this.state.pharmacyProfiles;

    return profiles
      .map((profile) => {
        const user = this.state.users.find((item) => item.id === profile.userId);
        const documents = this.state.documents.filter(
          (doc) => doc.userId === profile.userId,
        );

        const base = {
          profileId: profile.id,
          userId: profile.userId,
          role,
          mobile: user?.mobile ?? '',
          email: user?.email ?? null,
          accountStatus: user?.status ?? ('ACTIVE' as const),
          verificationStatus: profile.verificationStatus,
          createdAt: profile.createdAt,
          documentCount: documents.length,
        };

        if (role === 'DOCTOR') {
          const doctor = profile as DoctorProfileRecord;
          return {
            ...base,
            displayName: doctor.fullName,
            descriptor: doctor.specialization,
            registrationNumber: doctor.medicalRegistrationNumber,
            location: [doctor.city, doctor.state].filter(Boolean).join(', '),
          } satisfies ProfessionalProfileEntry;
        }

        const pharmacy = profile as PharmacyProfileRecord;
        return {
          ...base,
          displayName: pharmacy.pharmacyName,
          descriptor: pharmacy.pharmacyType,
          registrationNumber: pharmacy.drugLicenseNumber ?? '—',
          location: [pharmacy.city, pharmacy.state].filter(Boolean).join(', '),
        } satisfies ProfessionalProfileEntry;
      })
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async updateProfileVerificationStatus(
    profileId: string,
    role: 'DOCTOR' | 'PHARMACY',
    status: VerificationStatus,
  ) {
    this.load();
    const profiles =
      role === 'DOCTOR' ? this.state.doctorProfiles : this.state.pharmacyProfiles;
    const profile = profiles.find((item) => item.id === profileId);
    if (!profile) return null;
    profile.verificationStatus = status;
    profile.updatedAt = now();
    this.persist();
    return profile;
  }

  // --- documents (private storage) -----------------------------------------
  async createDocument(input: CreateDocumentInput): Promise<DocumentRecord> {
    this.load();
    if (this.state.documents.some((doc) => doc.storageKey === input.storageKey)) {
      throw Errors.conflict('This document has already been uploaded.');
    }
    const timestamp = now();
    const record: DocumentRecord = {
      id: input.id ?? createId('doc'),
      userId: input.userId ?? null,
      registrationId: input.registrationId ?? null,
      documentType: input.documentType,
      fileName: input.fileName,
      storageKey: input.storageKey,
      mimeType: input.mimeType,
      fileSize: input.fileSize,
      verificationStatus: 'PENDING',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.documents.push(record);
    this.persist();
    return record;
  }

  async getDocumentById(id: string) {
    this.load();
    return this.state.documents.find((doc) => doc.id === id) ?? null;
  }

  async listDocumentsByUserId(userId: string) {
    this.load();
    return this.state.documents.filter((doc) => doc.userId === userId);
  }

  async listDocumentsByRegistrationId(registrationId: string) {
    this.load();
    return this.state.documents.filter((doc) => doc.registrationId === registrationId);
  }

  async attachDocumentsToUser(registrationId: string, userId: string) {
    this.load();
    let attached = 0;
    for (const doc of this.state.documents) {
      if (doc.registrationId === registrationId) {
        doc.userId = userId;
        doc.registrationId = null;
        doc.updatedAt = now();
        attached += 1;
      }
    }
    if (attached > 0) this.persist();
    return attached;
  }

  async updateDocumentVerificationStatus(id: string, status: DocumentStatus) {
    this.load();
    const doc = this.state.documents.find((item) => item.id === id);
    if (!doc) return null;
    doc.verificationStatus = status;
    doc.updatedAt = now();
    this.persist();
    return doc;
  }

  async deleteDocument(id: string) {
    this.load();
    const before = this.state.documents.length;
    this.state.documents = this.state.documents.filter((doc) => doc.id !== id);
    if (this.state.documents.length === before) return false;
    this.persist();
    return true;
  }

  // --- OTP challenges ------------------------------------------------------
  async createOtpChallenge(input: CreateOtpChallengeInput): Promise<OtpChallengeRecord> {
    this.load();
    const timestamp = now();
    const record: OtpChallengeRecord = {
      id: input.id ?? createId('otp'),
      userId: input.userId ?? null,
      mobile: input.mobile,
      purpose: input.purpose,
      codeHash: input.codeHash,
      salt: input.salt,
      attempts: 0,
      maxAttempts: input.maxAttempts ?? 5,
      registrationId: input.registrationId ?? null,
      expiresAt: input.expiresAt,
      consumedAt: null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.otpChallenges.push(record);
    this.persist();
    return record;
  }

  async getOtpChallenge(id: string) {
    this.load();
    return this.state.otpChallenges.find((row) => row.id === id) ?? null;
  }

  async updateOtpChallenge(id: string, patch: UpdateOtpChallengeInput) {
    this.load();
    const record = this.state.otpChallenges.find((row) => row.id === id);
    if (!record) return null;
    if (patch.attempts !== undefined) record.attempts = patch.attempts;
    if (patch.consumedAt !== undefined) record.consumedAt = patch.consumedAt;
    if (patch.expiresAt !== undefined) record.expiresAt = patch.expiresAt;
    record.updatedAt = now();
    this.persist();
    return record;
  }

  async deleteOtpChallenge(id: string) {
    this.load();
    const before = this.state.otpChallenges.length;
    this.state.otpChallenges = this.state.otpChallenges.filter((row) => row.id !== id);
    if (this.state.otpChallenges.length === before) return false;
    this.persist();
    return true;
  }

  async deleteOtpChallengesForMobile(mobile: string, purpose: string) {
    this.load();
    const before = this.state.otpChallenges.length;
    this.state.otpChallenges = this.state.otpChallenges.filter(
      (row) => !(row.mobile === mobile && row.purpose === purpose),
    );
    const removed = before - this.state.otpChallenges.length;
    if (removed > 0) this.persist();
    return removed;
  }

  async deleteExpiredOtpChallenges() {
    this.load();
    const timestamp = now();
    const before = this.state.otpChallenges.length;
    this.state.otpChallenges = this.state.otpChallenges.filter(
      (row) => row.expiresAt > timestamp,
    );
    const removed = before - this.state.otpChallenges.length;
    if (removed > 0) this.persist();
    return removed;
  }

  async getPharmacyOperatingHours(pharmacyId: string) {
    this.load();
    return this.state.pharmacyHours.filter((row) => row.pharmacyId === pharmacyId);
  }

  // --- email verification tokens -------------------------------------------
  async createEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    this.load();
    // Only one live token per user: issuing a new one invalidates the old.
    await this.deleteEmailVerificationTokensForUser(userId);
    const record: EmailVerificationTokenRecord = {
      id: createId('evt'),
      userId,
      tokenHash,
      expiresAt,
      createdAt: now(),
    };
    this.state.emailVerificationTokens.push(record);
    this.persist();
    return record;
  }

  async findEmailVerificationToken(tokenHash: string) {
    this.load();
    return (
      this.state.emailVerificationTokens.find(
        (row) => row.tokenHash === tokenHash,
      ) ?? null
    );
  }

  async deleteEmailVerificationTokensForUser(userId: string) {
    this.load();
    const before = this.state.emailVerificationTokens.length;
    this.state.emailVerificationTokens =
      this.state.emailVerificationTokens.filter((row) => row.userId !== userId);
    const removed = before - this.state.emailVerificationTokens.length;
    if (removed > 0) this.persist();
    return removed;
  }

  async deleteExpiredEmailVerificationTokens() {
    this.load();
    const timestamp = now();
    const before = this.state.emailVerificationTokens.length;
    this.state.emailVerificationTokens =
      this.state.emailVerificationTokens.filter((row) => row.expiresAt > timestamp);
    const removed = before - this.state.emailVerificationTokens.length;
    if (removed > 0) this.persist();
    return removed;
  }

  // --- password reset tokens -----------------------------------------------
  async createPasswordResetToken(userId: string, tokenHash: string, expiresAt: Date) {
    this.load();
    // Re-issue invalidates every outstanding link for that user.
    await this.invalidatePasswordResetTokensForUser(userId);
    const record: PasswordResetTokenRecord = {
      id: createId('prt'),
      userId,
      tokenHash,
      expiresAt,
      usedAt: null,
      createdAt: now(),
    };
    this.state.passwordResetTokens.push(record);
    this.persist();
    return record;
  }

  async findPasswordResetToken(tokenHash: string) {
    this.load();
    return (
      this.state.passwordResetTokens.find((row) => row.tokenHash === tokenHash) ?? null
    );
  }

  async invalidatePasswordResetTokensForUser(userId: string) {
    this.load();
    const timestamp = now();
    let touched = 0;
    for (const row of this.state.passwordResetTokens) {
      if (row.userId === userId && !row.usedAt) {
        row.usedAt = timestamp;
        touched += 1;
      }
    }
    if (touched > 0) this.persist();
    return touched;
  }

  async deleteExpiredPasswordResetTokens() {
    this.load();
    const timestamp = now();
    const before = this.state.passwordResetTokens.length;
    this.state.passwordResetTokens = this.state.passwordResetTokens.filter(
      (row) => row.expiresAt > timestamp,
    );
    const removed = before - this.state.passwordResetTokens.length;
    if (removed > 0) this.persist();
    return removed;
  }

  // --- directories (patient facing) ----------------------------------------
  async listDoctorProfiles(filter: DoctorDirectoryFilter = {}) {
    this.load();
    const text = filter.text?.trim().toLowerCase();
    return this.state.doctorProfiles
      .filter((profile) => {
        if (
          filter.verificationStatus &&
          profile.verificationStatus !== filter.verificationStatus
        ) {
          return false;
        }
        if (filter.city && profile.city.toLowerCase() !== filter.city.toLowerCase()) {
          return false;
        }
        if (filter.specialization && profile.specialization !== filter.specialization) {
          return false;
        }
        if (text) {
          const haystack =
            `${profile.fullName} ${profile.clinicName} ${profile.specialization} ${profile.city}`.toLowerCase();
          if (!haystack.includes(text)) return false;
        }
        return true;
      })
      .sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  async getDoctorProfileById(profileId: string) {
    this.load();
    return this.state.doctorProfiles.find((profile) => profile.id === profileId) ?? null;
  }

  async listPharmacyProfiles(filter: PharmacyDirectoryFilter = {}) {
    this.load();
    const text = filter.text?.trim().toLowerCase();
    return this.state.pharmacyProfiles
      .filter((profile) => {
        if (
          filter.verificationStatus &&
          profile.verificationStatus !== filter.verificationStatus
        ) {
          return false;
        }
        if (filter.city && profile.city.toLowerCase() !== filter.city.toLowerCase()) {
          return false;
        }
        if (text) {
          const haystack =
            `${profile.pharmacyName} ${profile.ownerName} ${profile.address} ${profile.city}`.toLowerCase();
          if (!haystack.includes(text)) return false;
        }
        return true;
      })
      .sort((a, b) => a.pharmacyName.localeCompare(b.pharmacyName));
  }

  // --- appointments ---------------------------------------------------------
  async createAppointment(input: CreateAppointmentInput) {
    this.load();
    const timestamp = now();
    const record: AppointmentRecord = {
      id: input.id ?? createId('apt'),
      patientUserId: input.patientUserId,
      doctorUserId: input.doctorUserId,
      doctorProfileId: input.doctorProfileId,
      scheduledDate: input.scheduledDate,
      startTime: input.startTime,
      endTime: input.endTime,
      status: input.status ?? 'REQUESTED',
      reason: input.reason ?? null,
      meetingUrl: input.meetingUrl ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.appointments.push(record);
    this.persist();
    return record;
  }

  /**
   * Atomic reservation for the in-memory dev store. The overlap check and the
   * push run with no intervening `await`, so Node's single-threaded event loop
   * cannot interleave a second booking between them. Returns null when the
   * slot is already taken, mirroring the Prisma advisory-locked path.
   */
  async reserveAppointment(input: CreateAppointmentInput) {
    this.load();
    const target = input.scheduledDate.getTime();
    const clash = this.state.appointments.find(
      (row) =>
        row.doctorProfileId === input.doctorProfileId &&
        row.scheduledDate.getTime() === target &&
        row.startTime === input.startTime &&
        row.status !== 'CANCELLED',
    );
    if (clash) return null;
    const timestamp = now();
    const record: AppointmentRecord = {
      id: input.id ?? createId('apt'),
      patientUserId: input.patientUserId,
      doctorUserId: input.doctorUserId,
      doctorProfileId: input.doctorProfileId,
      scheduledDate: input.scheduledDate,
      startTime: input.startTime,
      endTime: input.endTime,
      status: input.status ?? 'REQUESTED',
      reason: input.reason ?? null,
      meetingUrl: input.meetingUrl ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.appointments.push(record);
    this.persist();
    return record;
  }

  async getAppointmentById(id: string) {
    this.load();
    return this.state.appointments.find((row) => row.id === id) ?? null;
  }

  async listAppointmentsByPatient(patientUserId: string) {
    this.load();
    return this.state.appointments
      .filter((row) => row.patientUserId === patientUserId)
      .sort(
        (a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime(),
      );
  }

  async listAppointmentsByDoctor(doctorUserId: string) {
    this.load();
    return this.state.appointments
      .filter((row) => row.doctorUserId === doctorUserId)
      .sort(
        (a, b) => b.scheduledDate.getTime() - a.scheduledDate.getTime(),
      );
  }

  async findAppointmentAt(
    doctorProfileId: string,
    scheduledDate: Date,
    startTime: string,
  ) {
    this.load();
    const target = scheduledDate.getTime();
    return (
      this.state.appointments.find(
        (row) =>
          row.doctorProfileId === doctorProfileId &&
          row.scheduledDate.getTime() === target &&
          row.startTime === startTime &&
          row.status !== 'CANCELLED',
      ) ?? null
    );
  }

  async updateAppointment(id: string, patch: UpdateAppointmentInput) {
    this.load();
    const index = this.state.appointments.findIndex((row) => row.id === id);
    if (index === -1) throw Errors.notFound('That appointment could not be found.');
    const current = this.state.appointments[index];
    const updated: AppointmentRecord = {
      ...current,
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.meetingUrl !== undefined ? { meetingUrl: patch.meetingUrl } : {}),
      ...(patch.reason !== undefined ? { reason: patch.reason } : {}),
      updatedAt: now(),
    };
    this.state.appointments[index] = updated;
    this.persist();
    return updated;
  }

  /**
   * Conditional status transition: only applies when the row still holds one
   * of the expected statuses, mirroring the Prisma `updateMany` guard so both
   * drivers reject stale overwrites of a concurrent cancellation/transition.
   */
  async transitionAppointmentStatus(
    id: string,
    expectedStatuses: UpdateAppointmentInput['status'][],
    patch: UpdateAppointmentInput,
  ) {
    this.load();
    const index = this.state.appointments.findIndex((row) => row.id === id);
    if (index === -1) return null;
    const current = this.state.appointments[index];
    if (
      !expectedStatuses.some((status) => status !== undefined && status === current.status)
    ) {
      return null;
    }
    return this.updateAppointment(id, patch);
  }

  // --- prescriptions --------------------------------------------------------
  async createPrescription(input: CreatePrescriptionInput): Promise<PrescriptionWithItems> {
    this.load();
    const appointmentId = input.appointmentId ?? null;

    // One prescription per appointment. The check and the push run with no
    // `await` between them, so in Node's single-threaded event loop a second
    // concurrent call cannot interleave here — this is atomic for the dev
    // datastore. Mirrors the Postgres unique index used in production.
    if (
      appointmentId !== null &&
      this.state.prescriptions.some((row) => row.appointmentId === appointmentId)
    ) {
      throw Errors.conflict('A prescription already exists for this appointment.');
    }

    const timestamp = now();
    const id = createId('rx');
    const record: PrescriptionRecord = {
      id,
      patientUserId: input.patientUserId,
      doctorUserId: input.doctorUserId,
      appointmentId,
      diagnosis: input.diagnosis ?? null,
      notes: input.notes ?? null,
      status: input.status ?? 'ACTIVE',
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    const items: PrescriptionItemRecord[] = input.items.map((item) => ({
      id: createId('rxi'),
      prescriptionId: id,
      medicineName: item.medicineName,
      dosage: item.dosage ?? null,
      frequency: item.frequency ?? null,
      duration: item.duration ?? null,
      instructions: item.instructions ?? null,
    }));
    this.state.prescriptions.push(record);
    this.state.prescriptionItems.push(...items);
    this.persist();
    return { ...record, items };
  }

  async getPrescriptionById(id: string): Promise<PrescriptionWithItems | null> {
    this.load();
    const record = this.state.prescriptions.find((row) => row.id === id) ?? null;
    if (!record) return null;
    return {
      ...record,
      items: this.state.prescriptionItems.filter(
        (item) => item.prescriptionId === id,
      ),
    };
  }

  async getPrescriptionByAppointment(
    appointmentId: string,
  ): Promise<PrescriptionWithItems | null> {
    this.load();
    const record =
      this.state.prescriptions.find((row) => row.appointmentId === appointmentId) ??
      null;
    if (!record) return null;
    return {
      ...record,
      items: this.state.prescriptionItems.filter(
        (item) => item.prescriptionId === record.id,
      ),
    };
  }

  async listPrescriptionsByPatient(
    patientUserId: string,
  ): Promise<PrescriptionWithItems[]> {
    this.load();
    return this.state.prescriptions
      .filter((row) => row.patientUserId === patientUserId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((record) => ({
        ...record,
        items: this.state.prescriptionItems.filter(
          (item) => item.prescriptionId === record.id,
        ),
      }));
  }

  // --- conversations & messages --------------------------------------------
  async getOrCreateConversation(input: UpsertConversationInput) {
    this.load();
    const existing = this.state.conversations.find(
      (row) =>
        row.patientUserId === input.patientUserId &&
        row.doctorUserId === input.doctorUserId,
    );
    if (existing) return existing;
    const timestamp = now();
    const record: ConversationRecord = {
      id: createId('cnv'),
      patientUserId: input.patientUserId,
      doctorUserId: input.doctorUserId,
      lastMessageAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.conversations.push(record);
    this.persist();
    return record;
  }

  async listConversationsByUser(userId: string) {
    this.load();
    return this.state.conversations
      .filter(
        (row) => row.patientUserId === userId || row.doctorUserId === userId,
      )
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());
  }

  async getConversationById(id: string) {
    this.load();
    return this.state.conversations.find((row) => row.id === id) ?? null;
  }

  async listMessages(conversationId: string) {
    this.load();
    return this.state.messages
      .filter((row) => row.conversationId === conversationId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async createMessage(input: CreateMessageInput) {
    this.load();
    const timestamp = now();
    const record: MessageRecord = {
      id: createId('msg'),
      conversationId: input.conversationId,
      senderUserId: input.senderUserId,
      body: input.body,
      createdAt: timestamp,
    };
    this.state.messages.push(record);
    const conversation = this.state.conversations.find(
      (row) => row.id === input.conversationId,
    );
    if (conversation) {
      conversation.lastMessageAt = timestamp;
      conversation.updatedAt = timestamp;
    }
    this.persist();
    return record;
  }

  // --- medical records ------------------------------------------------------
  async createMedicalRecord(input: CreateMedicalRecordInput) {
    this.load();
    const timestamp = now();
    const record: MedicalRecordRecord = {
      id: createId('mrc'),
      patientUserId: input.patientUserId,
      recordType: input.recordType,
      title: input.title,
      description: input.description ?? null,
      documentId: input.documentId ?? null,
      recordDate: input.recordDate ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.medicalRecords.push(record);
    this.persist();
    return record;
  }

  async getMedicalRecordById(id: string) {
    this.load();
    return this.state.medicalRecords.find((row) => row.id === id) ?? null;
  }

  async listMedicalRecordsByPatient(patientUserId: string) {
    this.load();
    return this.state.medicalRecords
      .filter((row) => row.patientUserId === patientUserId)
      .sort(
        (a, b) =>
          (b.recordDate ?? b.createdAt).getTime() -
          (a.recordDate ?? a.createdAt).getTime(),
      );
  }

  async deleteMedicalRecord(id: string) {
    this.load();
    const before = this.state.medicalRecords.length;
    this.state.medicalRecords = this.state.medicalRecords.filter(
      (row) => row.id !== id,
    );
    const removed = before - this.state.medicalRecords.length;
    if (removed > 0) this.persist();
    return removed > 0;
  }

  // --- medicine inventory ---------------------------------------------------
  async createMedicine(input: UpsertMedicineInventoryInput) {
    this.load();
    const timestamp = now();
    const record: MedicineInventoryRecord = {
      id: createId('med'),
      pharmacyUserId: input.pharmacyUserId,
      name: input.name,
      brand: input.brand ?? null,
      strength: input.strength ?? null,
      unit: input.unit ?? 'TABLET',
      priceInPaise: input.priceInPaise,
      stockQuantity: input.stockQuantity,
      requiresRx: input.requiresRx ?? false,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.medicines.push(record);
    this.persist();
    return record;
  }

  async updateMedicine(id: string, patch: UpdateMedicineInventoryInput) {
    this.load();
    const index = this.state.medicines.findIndex((row) => row.id === id);
    if (index === -1) throw Errors.notFound('That medicine could not be found.');
    const current = this.state.medicines[index];
    const updated: MedicineInventoryRecord = {
      ...current,
      ...(patch.name !== undefined ? { name: patch.name } : {}),
      ...(patch.brand !== undefined ? { brand: patch.brand } : {}),
      ...(patch.strength !== undefined ? { strength: patch.strength } : {}),
      ...(patch.unit !== undefined ? { unit: patch.unit } : {}),
      ...(patch.priceInPaise !== undefined
        ? { priceInPaise: patch.priceInPaise }
        : {}),
      ...(patch.stockQuantity !== undefined
        ? { stockQuantity: patch.stockQuantity }
        : {}),
      ...(patch.requiresRx !== undefined ? { requiresRx: patch.requiresRx } : {}),
      updatedAt: now(),
    };
    this.state.medicines[index] = updated;
    this.persist();
    return updated;
  }

  async getMedicineById(id: string) {
    this.load();
    return this.state.medicines.find((row) => row.id === id) ?? null;
  }

  async listMedicinesByPharmacy(pharmacyUserId: string) {
    this.load();
    return this.state.medicines
      .filter((row) => row.pharmacyUserId === pharmacyUserId)
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async searchMedicines(text: string, pharmacyUserIds: string[]) {
    this.load();
    if (pharmacyUserIds.length === 0) return [];
    const allowed = new Set(pharmacyUserIds);
    const needle = text.trim().toLowerCase();
    return this.state.medicines
      .filter((row) => {
        if (!allowed.has(row.pharmacyUserId)) return false;
        if (!needle) return true;
        const haystack = `${row.name} ${row.brand ?? ''} ${row.strength ?? ''}`.toLowerCase();
        return haystack.includes(needle);
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  // --- pharmacy orders ------------------------------------------------------
  async createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
    this.load();
    if (input.items.length === 0) {
      throw Errors.validation('Please add at least one medicine to your order.');
    }
    // Stock is validated here (not in the service) so the check and the
    // decrement happen together inside the single writer of this datastore.
    for (const item of input.items) {
      if (!item.medicineId) continue;
      const medicine = this.state.medicines.find(
        (row) => row.id === item.medicineId,
      );
      if (!medicine) {
        throw Errors.notFound('A medicine in your order is no longer available.');
      }
      if (medicine.stockQuantity < item.quantity) {
        throw Errors.conflict(
          `Only ${medicine.stockQuantity} unit(s) of ${medicine.name} are in stock.`,
        );
      }
    }
    const timestamp = now();
    const orderId = createId('ord');
    const items: OrderItemRecord[] = input.items.map((item) => {
      if (item.medicineId) {
        const medicine = this.state.medicines.find(
          (row) => row.id === item.medicineId,
        );
        if (medicine) medicine.stockQuantity -= item.quantity;
      }
      return {
        id: createId('ori'),
        orderId,
        medicineId: item.medicineId,
        medicineName: item.medicineName,
        quantity: item.quantity,
        unitPriceInPaise: item.unitPriceInPaise,
      };
    });
    const order: PharmacyOrderRecord = {
      id: orderId,
      patientUserId: input.patientUserId,
      pharmacyUserId: input.pharmacyUserId,
      status: 'PLACED',
      totalInPaise: items.reduce(
        (sum, item) => sum + item.quantity * item.unitPriceInPaise,
        0,
      ),
      deliveryAddress: input.deliveryAddress ?? null,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    this.state.orders.push(order);
    this.state.orderItems.push(...items);
    this.persist();
    return { ...order, items };
  }

  async getOrderById(id: string): Promise<OrderWithItems | null> {
    this.load();
    const record = this.state.orders.find((row) => row.id === id) ?? null;
    if (!record) return null;
    return {
      ...record,
      items: this.state.orderItems.filter((item) => item.orderId === id),
    };
  }

  async listOrdersByPatient(patientUserId: string): Promise<OrderWithItems[]> {
    this.load();
    return this.state.orders
      .filter((row) => row.patientUserId === patientUserId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((record) => ({
        ...record,
        items: this.state.orderItems.filter(
          (item) => item.orderId === record.id,
        ),
      }));
  }

  async updateOrderStatus(id: string, status: OrderStatus) {
    this.load();
    const index = this.state.orders.findIndex((row) => row.id === id);
    if (index === -1) throw Errors.notFound('That order could not be found.');
    const updated: PharmacyOrderRecord = {
      ...this.state.orders[index],
      status,
      updatedAt: now(),
    };
    this.state.orders[index] = updated;
    this.persist();
    return updated;
  }

  // --- video signalling -----------------------------------------------------
  async createSignal(input: CreateConsultationSignalInput) {
    this.load();
    const record: ConsultationSignalRecord = {
      id: createId('sgl'),
      appointmentId: input.appointmentId,
      senderUserId: input.senderUserId,
      payload: input.payload,
      createdAt: now(),
    };
    this.state.consultationSignals.push(record);
    this.persist();
    return record;
  }

  async listSignalsSince(appointmentId: string, since: Date) {
    this.load();
    const floor = since.getTime();
    return this.state.consultationSignals
      .filter(
        (row) =>
          row.appointmentId === appointmentId && row.createdAt.getTime() >= floor,
      )
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async pruneSignals(appointmentId: string, before: Date) {
    this.load();
    const cutoff = before.getTime();
    const total = this.state.consultationSignals.length;
    this.state.consultationSignals = this.state.consultationSignals.filter(
      (row) =>
        !(row.appointmentId === appointmentId && row.createdAt.getTime() < cutoff),
    );
    const removed = total - this.state.consultationSignals.length;
    if (removed > 0) this.persist();
    return removed;
  }
}
