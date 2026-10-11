import 'server-only';

import type { OrderStatus, PrismaClient } from '@prisma/client';

import type { DataStore } from '../store';
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
  DocumentRecord,
  DocumentStatus,
  DoctorProfileRecord,
  LinkedAccountRecord,
  MedicalRecordRecord,
  MedicineInventoryRecord,
  MessageRecord,
  OtpChallengeRecord,
  OrderWithItems,
  PatientProfileRecord,
  PharmacyOperatingHoursRecord,
  PharmacyOrderRecord,
  PharmacyProfileRecord,
  PrescriptionWithItems,
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
} from '../types';
import type {
  DoctorDirectoryFilter,
  PharmacyDirectoryFilter,
} from '../store';
import {
  AppointmentRepository,
  ConversationRepository,
  DirectoryRepository,
  MedicalRecordRepository,
  PrescriptionRepository,
  SignalRepository,
} from './prisma/care-repository';
import { CommerceRepository } from './prisma/commerce-repository';
import { DocumentRepository } from './prisma/document-repository';
import { OtpRepository } from './prisma/otp-repository';
import { TokenRepository } from './prisma/token-repository';
import { PharmacyProfileRepository } from './prisma/pharmacy-repository';
import {
  DoctorProfileRepository,
  PatientProfileRepository,
} from './prisma/profile-repository';
import { UserRepository } from './prisma/user-repository';

/**
 * PostgreSQL implementation of the store contract.
 * Composed from focused repositories so every aggregate stays readable.
 */
export class PrismaDataStore implements DataStore {
  readonly kind = 'postgres' as const;

  private readonly users: UserRepository;
  private readonly patients: PatientProfileRepository;
  private readonly doctors: DoctorProfileRepository;
  private readonly pharmacies: PharmacyProfileRepository;
  private readonly documents: DocumentRepository;
  private readonly otp: OtpRepository;
  private readonly tokens: TokenRepository;
  private readonly directories: DirectoryRepository;
  private readonly appointments: AppointmentRepository;
  private readonly prescriptions: PrescriptionRepository;
  private readonly conversations: ConversationRepository;
  private readonly medicalRecords: MedicalRecordRepository;
  private readonly signals: SignalRepository;
  private readonly commerce: CommerceRepository;

  constructor(client: PrismaClient) {
    this.users = new UserRepository(client);
    this.patients = new PatientProfileRepository(client);
    this.doctors = new DoctorProfileRepository(client);
    this.pharmacies = new PharmacyProfileRepository(client);
    this.documents = new DocumentRepository(client);
    this.otp = new OtpRepository(client);
    this.tokens = new TokenRepository(client);
    this.directories = new DirectoryRepository(client);
    this.appointments = new AppointmentRepository(client);
    this.prescriptions = new PrescriptionRepository(client);
    this.conversations = new ConversationRepository(client);
    this.medicalRecords = new MedicalRecordRepository(client);
    this.signals = new SignalRepository(client);
    this.commerce = new CommerceRepository(client);
  }

  // --- users ---------------------------------------------------------------
  findUserById(id: string) {
    return this.users.findUserById(id);
  }
  findUserByEmail(email: string) {
    return this.users.findUserByEmail(email);
  }
  findUserByMobile(mobile: string) {
    return this.users.findUserByMobile(mobile);
  }
  createUser(input: CreateUserInput): Promise<UserRecord> {
    return this.users.createUser(input);
  }
  updateUser(id: string, patch: UpdateUserInput): Promise<UserRecord> {
    return this.users.updateUser(id, patch);
  }

  // --- profiles ------------------------------------------------------------
  getPatientProfileByUserId(userId: string): Promise<PatientProfileRecord | null> {
    return this.patients.getByUserId(userId);
  }
  upsertPatientProfile(input: UpsertPatientProfileInput) {
    return this.patients.upsert(input);
  }
  getDoctorProfileByUserId(userId: string): Promise<DoctorProfileRecord | null> {
    return this.doctors.getByUserId(userId);
  }
  upsertDoctorProfile(input: UpsertDoctorProfileInput) {
    return this.doctors.upsert(input);
  }
  getDoctorAvailability(doctorId: string) {
    return this.doctors.getAvailability(doctorId);
  }
  replaceDoctorAvailability(
    doctorId: string,
    slots: Parameters<DoctorProfileRepository['replaceAvailability']>[1],
  ) {
    return this.doctors.replaceAvailability(doctorId, slots);
  }
  getPharmacyProfileByUserId(userId: string): Promise<PharmacyProfileRecord | null> {
    return this.pharmacies.getByUserId(userId);
  }
  upsertPharmacyProfile(input: UpsertPharmacyProfileInput) {
    return this.pharmacies.upsert(input);
  }
  getPharmacyOperatingHours(
    pharmacyId: string,
  ): Promise<PharmacyOperatingHoursRecord[]> {
    return this.pharmacies.getOperatingHours(pharmacyId);
  }

  // --- admin: verification console -----------------------------------------
  /**
   * Joins professional profiles with their account and document count.
   *
   * Prisma cannot express a polymorphic join, so the profile list and the
   * matching accounts are fetched separately and merged here — keeping the
   * merge in one place means the UI receives the same shape from both stores.
   */
  async listProfessionalProfiles(role: 'DOCTOR' | 'PHARMACY') {
    const [profiles, accounts] = await Promise.all([
      role === 'DOCTOR' ? this.doctors.listAll() : this.pharmacies.listAll(),
      this.users.listByRole(role),
    ]);

    const accountsById = new Map(accounts.map((user) => [user.id, user]));
    const documentCounts = await this.documents.countByUserIds(
      profiles.map((profile) => profile.userId),
    );

    return profiles.map((profile) => {
      const user = accountsById.get(profile.userId);
      const base = {
        profileId: profile.id,
        userId: profile.userId,
        role,
        mobile: user?.mobile ?? '',
        email: user?.email ?? null,
        accountStatus: user?.status ?? ('ACTIVE' as const),
        verificationStatus: profile.verificationStatus,
        createdAt: profile.createdAt,
        documentCount: documentCounts.get(profile.userId) ?? 0,
      };

      if (role === 'DOCTOR') {
        const doctor = profile as DoctorProfileRecord;
        return {
          ...base,
          displayName: doctor.fullName,
          descriptor: doctor.specialization,
          registrationNumber: doctor.medicalRegistrationNumber,
          location: [doctor.city, doctor.state].filter(Boolean).join(', '),
        };
      }

      const pharmacy = profile as PharmacyProfileRecord;
      return {
        ...base,
        displayName: pharmacy.pharmacyName,
        descriptor: pharmacy.pharmacyType,
        registrationNumber: pharmacy.drugLicenseNumber ?? '—',
        location: [pharmacy.city, pharmacy.state].filter(Boolean).join(', '),
      };
    });
  }

  updateProfileVerificationStatus(
    profileId: string,
    role: 'DOCTOR' | 'PHARMACY',
    status: VerificationStatus,
  ): Promise<DoctorProfileRecord | PharmacyProfileRecord | null> {
    return role === 'DOCTOR'
      ? this.doctors.updateVerificationStatus(profileId, status)
      : this.pharmacies.updateVerificationStatus(profileId, status);
  }

  // --- documents -----------------------------------------------------------
  createDocument(input: CreateDocumentInput): Promise<DocumentRecord> {
    return this.documents.create(input);
  }
  getDocumentById(id: string) {
    return this.documents.getById(id);
  }
  listDocumentsByUserId(userId: string) {
    return this.documents.listByUserId(userId);
  }
  listDocumentsByRegistrationId(registrationId: string) {
    return this.documents.listByRegistrationId(registrationId);
  }
  attachDocumentsToUser(registrationId: string, userId: string) {
    return this.documents.attachToUser(registrationId, userId);
  }
  updateDocumentVerificationStatus(id: string, status: DocumentStatus) {
    return this.documents.updateStatus(id, status);
  }
  deleteDocument(id: string) {
    return this.documents.delete(id);
  }

  // --- OTP -----------------------------------------------------------------
  createOtpChallenge(input: CreateOtpChallengeInput): Promise<OtpChallengeRecord> {
    return this.otp.create(input);
  }
  getOtpChallenge(id: string) {
    return this.otp.getById(id);
  }
  updateOtpChallenge(id: string, patch: UpdateOtpChallengeInput) {
    return this.otp.update(id, patch);
  }
  deleteOtpChallenge(id: string) {
    return this.otp.delete(id);
  }
  deleteOtpChallengesForMobile(mobile: string, purpose: string) {
    return this.otp.deleteForMobile(
      mobile,
      purpose as Parameters<OtpRepository['deleteForMobile']>[1],
    );
  }
  deleteExpiredOtpChallenges() {
    return this.otp.deleteExpired();
  }

  // --- linked accounts -----------------------------------------------------
  findUserByLinkedAccount(provider: 'GOOGLE', providerAccountId: string) {
    return this.users.findUserByLinkedAccount(provider, providerAccountId);
  }
  upsertLinkedAccount(input: UpsertLinkedAccountInput): Promise<LinkedAccountRecord> {
    return this.users.upsertLinkedAccount(input);
  }

  // --- account tokens -------------------------------------------------------
  createEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return this.tokens.createEmailToken(userId, tokenHash, expiresAt);
  }
  findEmailVerificationToken(tokenHash: string) {
    return this.tokens.findEmailToken(tokenHash);
  }
  deleteEmailVerificationTokensForUser(userId: string) {
    return this.tokens.deleteEmailTokensForUser(userId);
  }
  deleteExpiredEmailVerificationTokens() {
    return this.tokens.deleteExpiredEmailTokens();
  }
  createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ) {
    return this.tokens.createResetToken(userId, tokenHash, expiresAt);
  }
  findPasswordResetToken(tokenHash: string) {
    return this.tokens.findResetToken(tokenHash);
  }
  invalidatePasswordResetTokensForUser(userId: string) {
    return this.tokens.invalidateResetTokensForUser(userId);
  }
  deleteExpiredPasswordResetTokens() {
    return this.tokens.deleteExpiredResetTokens();
  }

  // --- directories (patient facing) -----------------------------------------
  listDoctorProfiles(filter?: DoctorDirectoryFilter): Promise<DoctorProfileRecord[]> {
    return this.directories.listDoctors(filter);
  }
  getDoctorProfileById(profileId: string) {
    return this.directories.getDoctorById(profileId);
  }
  listPharmacyProfiles(
    filter?: PharmacyDirectoryFilter,
  ): Promise<PharmacyProfileRecord[]> {
    return this.directories.listPharmacies(filter);
  }

  // --- appointments ----------------------------------------------------------
  createAppointment(input: CreateAppointmentInput): Promise<AppointmentRecord> {
    return this.appointments.create(input);
  }
  getAppointmentById(id: string) {
    return this.appointments.getById(id);
  }
  listAppointmentsByPatient(patientUserId: string) {
    return this.appointments.listByPatient(patientUserId);
  }
  listAppointmentsByDoctor(doctorUserId: string) {
    return this.appointments.listByDoctor(doctorUserId);
  }
  findAppointmentAt(
    doctorProfileId: string,
    scheduledDate: Date,
    startTime: string,
  ) {
    return this.appointments.findAt(doctorProfileId, scheduledDate, startTime);
  }
  updateAppointment(id: string, patch: UpdateAppointmentInput) {
    return this.appointments.update(id, patch);
  }
  transitionAppointmentStatus(
    id: string,
    expectedStatuses: Parameters<AppointmentRepository['transitionStatus']>[1],
    patch: UpdateAppointmentInput,
  ) {
    return this.appointments.transitionStatus(id, expectedStatuses, patch);
  }

  // --- prescriptions ----------------------------------------------------------
  createPrescription(input: CreatePrescriptionInput): Promise<PrescriptionWithItems> {
    return this.prescriptions.create(input);
  }
  getPrescriptionById(id: string) {
    return this.prescriptions.getById(id);
  }
  listPrescriptionsByPatient(patientUserId: string) {
    return this.prescriptions.listByPatient(patientUserId);
  }

  // --- conversations & messages ------------------------------------------------
  getOrCreateConversation(input: UpsertConversationInput) {
    return this.conversations.getOrCreate(input);
  }
  listConversationsByUser(userId: string) {
    return this.conversations.listByUser(userId);
  }
  getConversationById(id: string) {
    return this.conversations.getById(id);
  }
  listMessages(conversationId: string): Promise<MessageRecord[]> {
    return this.conversations.listMessages(conversationId);
  }
  createMessage(input: CreateMessageInput): Promise<MessageRecord> {
    return this.conversations.createMessage(input);
  }

  // --- medical records ----------------------------------------------------------
  createMedicalRecord(input: CreateMedicalRecordInput): Promise<MedicalRecordRecord> {
    return this.medicalRecords.create(input);
  }
  getMedicalRecordById(id: string) {
    return this.medicalRecords.getById(id);
  }
  listMedicalRecordsByPatient(patientUserId: string) {
    return this.medicalRecords.listByPatient(patientUserId);
  }
  deleteMedicalRecord(id: string) {
    return this.medicalRecords.delete(id);
  }

  // --- medicine inventory -------------------------------------------------------
  createMedicine(input: UpsertMedicineInventoryInput): Promise<MedicineInventoryRecord> {
    return this.commerce.createMedicine(input);
  }
  updateMedicine(id: string, patch: UpdateMedicineInventoryInput) {
    return this.commerce.updateMedicine(id, patch);
  }
  getMedicineById(id: string) {
    return this.commerce.getMedicineById(id);
  }
  listMedicinesByPharmacy(pharmacyUserId: string) {
    return this.commerce.listMedicinesByPharmacy(pharmacyUserId);
  }
  searchMedicines(text: string, pharmacyUserIds: string[]) {
    return this.commerce.searchMedicines(text, pharmacyUserIds);
  }

  // --- pharmacy orders ----------------------------------------------------------
  createOrder(input: CreateOrderInput): Promise<OrderWithItems> {
    return this.commerce.createOrder(input);
  }
  getOrderById(id: string) {
    return this.commerce.getOrderById(id);
  }
  listOrdersByPatient(patientUserId: string) {
    return this.commerce.listOrdersByPatient(patientUserId);
  }
  updateOrderStatus(id: string, status: OrderStatus): Promise<PharmacyOrderRecord> {
    return this.commerce.updateOrderStatus(id, status);
  }

  // --- video signalling ---------------------------------------------------------
  createSignal(input: CreateConsultationSignalInput): Promise<ConsultationSignalRecord> {
    return this.signals.create(input);
  }
  listSignalsSince(appointmentId: string, since: Date) {
    return this.signals.listSince(appointmentId, since);
  }
  pruneSignals(appointmentId: string, before: Date) {
    return this.signals.prune(appointmentId, before);
  }
}
