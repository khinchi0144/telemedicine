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
  DoctorProfileRecord,
  EmailVerificationTokenRecord,
  LinkedAccountRecord,
  MedicalRecordRecord,
  MedicineInventoryRecord,
  MessageRecord,
  OtpChallengeRecord,
  PasswordResetTokenRecord,
  PatientProfileRecord,
  PharmacyOperatingHoursRecord,
  PharmacyOrderRecord,
  PharmacyProfileRecord,
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
} from './types';
import type { VerificationStatus } from '@/types/auth';
import type { OrderStatus } from '@prisma/client';

/** Filter for the patient's "Find doctors" directory. */
export interface DoctorDirectoryFilter {
  verificationStatus?: VerificationStatus;
  city?: string;
  specialization?: string;
  /** Case-insensitive match across name / clinic / specialization. */
  text?: string;
}

/** Filter for the patient's "Nearby pharmacies" directory. */
export interface PharmacyDirectoryFilter {
  verificationStatus?: VerificationStatus;
  city?: string;
  text?: string;
}

/**
 * Persistence contract used by every service.
 *
 * Two implementations exist:
 *  - `prisma`  : PostgreSQL (production / staging)
 *  - `memory`  : file backed development datastore, used when no
 *                 DATABASE_URL is configured so the full UI can be tested.
 *
 * Business logic never imports Prisma directly, so swapping the driver is a
 * one line change in lib/db/index.ts.
 */
export interface DataStore {
  readonly kind: 'postgres' | 'memory';

  // --- users ---------------------------------------------------------------
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findUserByMobile(mobile: string): Promise<UserRecord | null>;
  createUser(input: CreateUserInput): Promise<UserRecord>;
  updateUser(id: string, patch: UpdateUserInput): Promise<UserRecord>;

  // --- role profiles -------------------------------------------------------
  getPatientProfileByUserId(userId: string): Promise<PatientProfileRecord | null>;
  upsertPatientProfile(input: UpsertPatientProfileInput): Promise<PatientProfileRecord>;

  getDoctorProfileByUserId(userId: string): Promise<DoctorProfileRecord | null>;
  upsertDoctorProfile(input: UpsertDoctorProfileInput): Promise<DoctorProfileRecord>;
  getDoctorAvailability(doctorId: string): Promise<DoctorAvailabilityRecord[]>;
  replaceDoctorAvailability(
    doctorId: string,
    slots: DoctorAvailabilityInput[],
  ): Promise<DoctorAvailabilityRecord[]>;

  getPharmacyProfileByUserId(userId: string): Promise<PharmacyProfileRecord | null>;
  upsertPharmacyProfile(
    input: UpsertPharmacyProfileInput,
  ): Promise<PharmacyProfileRecord>;
  getPharmacyOperatingHours(
    pharmacyId: string,
  ): Promise<PharmacyOperatingHoursRecord[]>;

  // --- admin: verification console -----------------------------------------
  /**
   * Lists professional profiles joined with their account, newest first.
   * Returns plain records so the admin UI never has to know the storage shape.
   */
  listProfessionalProfiles(
    role: 'DOCTOR' | 'PHARMACY',
  ): Promise<ProfessionalProfileEntry[]>;

  /** Sets the verification status of a doctor / pharmacy profile. */
  updateProfileVerificationStatus(
    profileId: string,
    role: 'DOCTOR' | 'PHARMACY',
    status: VerificationStatus,
  ): Promise<DoctorProfileRecord | PharmacyProfileRecord | null>;

  // --- documents (private storage) ----------------------------------------
  createDocument(input: CreateDocumentInput): Promise<DocumentRecord>;
  getDocumentById(id: string): Promise<DocumentRecord | null>;
  listDocumentsByUserId(userId: string): Promise<DocumentRecord[]>;
  listDocumentsByRegistrationId(registrationId: string): Promise<DocumentRecord[]>;
  /** Moves documents uploaded before the account existed onto the user. */
  attachDocumentsToUser(registrationId: string, userId: string): Promise<number>;
  updateDocumentVerificationStatus(
    id: string,
    status: DocumentRecord['verificationStatus'],
  ): Promise<DocumentRecord | null>;
  deleteDocument(id: string): Promise<boolean>;

  // --- OTP challenges ------------------------------------------------------
  createOtpChallenge(input: CreateOtpChallengeInput): Promise<OtpChallengeRecord>;
  getOtpChallenge(id: string): Promise<OtpChallengeRecord | null>;
  updateOtpChallenge(
    id: string,
    patch: UpdateOtpChallengeInput,
  ): Promise<OtpChallengeRecord | null>;
  deleteOtpChallenge(id: string): Promise<boolean>;
  deleteOtpChallengesForMobile(mobile: string, purpose: string): Promise<number>;
  deleteExpiredOtpChallenges(): Promise<number>;

  // --- linked OAuth accounts ----------------------------------------------
  findUserByLinkedAccount(
    provider: 'GOOGLE',
    providerAccountId: string,
  ): Promise<UserRecord | null>;
  upsertLinkedAccount(input: UpsertLinkedAccountInput): Promise<LinkedAccountRecord>;

  // --- account tokens (email verification / password reset) ---------------
  /** Invalidates any outstanding tokens for the user before issuing a new one. */
  createEmailVerificationToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<EmailVerificationTokenRecord>;
  findEmailVerificationToken(
    tokenHash: string,
  ): Promise<EmailVerificationTokenRecord | null>;
  deleteEmailVerificationTokensForUser(userId: string): Promise<number>;
  deleteExpiredEmailVerificationTokens(): Promise<number>;

  createPasswordResetToken(
    userId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<PasswordResetTokenRecord>;
  findPasswordResetToken(
    tokenHash: string,
  ): Promise<PasswordResetTokenRecord | null>;
  /** Marks every outstanding reset token as used (called after a reset). */
  invalidatePasswordResetTokensForUser(userId: string): Promise<number>;
  deleteExpiredPasswordResetTokens(): Promise<number>;

  // --- directories (patient facing) ----------------------------------------
  /** Profiles for the "Find doctors" directory, filtered by the caller. */
  listDoctorProfiles(filter?: DoctorDirectoryFilter): Promise<DoctorProfileRecord[]>;
  getDoctorProfileById(profileId: string): Promise<DoctorProfileRecord | null>;
  /** Profiles for "Nearby pharmacies", usually restricted to verified ones. */
  listPharmacyProfiles(filter?: PharmacyDirectoryFilter): Promise<PharmacyProfileRecord[]>;

  // --- appointments ---------------------------------------------------------
  createAppointment(input: CreateAppointmentInput): Promise<AppointmentRecord>;
  /**
   * Atomic slot reservation: checks for an overlap and inserts in one
   * non-interleaved step. Returns null when a concurrent booking already holds
   * the slot, so callers can surface a controlled conflict. Prisma serialises
   * per doctor+day with an advisory lock; the memory store relies on Node's
   * single-threaded, await-free critical section.
   */
  reserveAppointment(input: CreateAppointmentInput): Promise<AppointmentRecord | null>;
  getAppointmentById(id: string): Promise<AppointmentRecord | null>;
  /** Newest first. */
  listAppointmentsByPatient(patientUserId: string): Promise<AppointmentRecord[]>;
  /** Newest first. */
  listAppointmentsByDoctor(doctorUserId: string): Promise<AppointmentRecord[]>;
  /** Exact-slot lookup used to reject double bookings. */
  findAppointmentAt(
    doctorProfileId: string,
    scheduledDate: Date,
    startTime: string,
  ): Promise<AppointmentRecord | null>;
  updateAppointment(id: string, patch: UpdateAppointmentInput): Promise<AppointmentRecord>;
  /**
   * Conditional status transition used by doctor-side status changes.
   * Applies only when the row still holds one of `expectedStatuses`;
   * returns null when a concurrent write already moved it.
   */
  transitionAppointmentStatus(
    id: string,
    expectedStatuses: UpdateAppointmentInput['status'][],
    patch: UpdateAppointmentInput,
  ): Promise<AppointmentRecord | null>;

  // --- prescriptions --------------------------------------------------------
  createPrescription(input: CreatePrescriptionInput): Promise<PrescriptionWithItems>;
  getPrescriptionById(id: string): Promise<PrescriptionWithItems | null>;
  /** Newest first, each with its medicine lines. */
  listPrescriptionsByPatient(patientUserId: string): Promise<PrescriptionWithItems[]>;

  // --- conversations & messages --------------------------------------------
  /** Returns the existing pair conversation, creating it only when absent. */
  getOrCreateConversation(input: UpsertConversationInput): Promise<ConversationRecord>;
  /** Conversations where the user is the patient *or* the doctor, active first. */
  listConversationsByUser(userId: string): Promise<ConversationRecord[]>;
  getConversationById(id: string): Promise<ConversationRecord | null>;
  /** Oldest first. */
  listMessages(conversationId: string): Promise<MessageRecord[]>;
  /** Appends the message and bumps the conversation's `lastMessageAt`. */
  createMessage(input: CreateMessageInput): Promise<MessageRecord>;

  // --- medical records ------------------------------------------------------
  createMedicalRecord(input: CreateMedicalRecordInput): Promise<MedicalRecordRecord>;
  getMedicalRecordById(id: string): Promise<MedicalRecordRecord | null>;
  /** Newest first. */
  listMedicalRecordsByPatient(patientUserId: string): Promise<MedicalRecordRecord[]>;
  deleteMedicalRecord(id: string): Promise<boolean>;

  // --- medicine inventory ---------------------------------------------------
  createMedicine(input: UpsertMedicineInventoryInput): Promise<MedicineInventoryRecord>;
  updateMedicine(
    id: string,
    patch: UpdateMedicineInventoryInput,
  ): Promise<MedicineInventoryRecord>;
  getMedicineById(id: string): Promise<MedicineInventoryRecord | null>;
  listMedicinesByPharmacy(pharmacyUserId: string): Promise<MedicineInventoryRecord[]>;
  /** Case-insensitive name/brand match limited to the given pharmacies. */
  searchMedicines(
    text: string,
    pharmacyUserIds: string[],
  ): Promise<MedicineInventoryRecord[]>;

  // --- pharmacy orders ------------------------------------------------------
  /** Validates stock, decrements inventory and writes order + lines atomically. */
  createOrder(input: CreateOrderInput): Promise<OrderWithItems>;
  getOrderById(id: string): Promise<OrderWithItems | null>;
  /** Newest first, each with its lines. */
  listOrdersByPatient(patientUserId: string): Promise<OrderWithItems[]>;
  updateOrderStatus(id: string, status: OrderStatus): Promise<PharmacyOrderRecord>;

  // --- video signalling -----------------------------------------------------
  createSignal(input: CreateConsultationSignalInput): Promise<ConsultationSignalRecord>;
  /** Signals written at or after `since`, oldest first (polling reads). */
  listSignalsSince(appointmentId: string, since: Date): Promise<ConsultationSignalRecord[]>;
  /** Drops signals older than `before` so closed rooms leave no residue. */
  pruneSignals(appointmentId: string, before: Date): Promise<number>;
}
