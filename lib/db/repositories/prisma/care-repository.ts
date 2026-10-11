import 'server-only';

import type { AppointmentStatus, Prisma, PrismaClient } from '@prisma/client';

import { createId } from '@/lib/utils/crypto';
import type { DoctorDirectoryFilter, PharmacyDirectoryFilter } from '../../store';
import type {
  AppointmentRecord,
  ConsultationSignalRecord,
  ConversationRecord,
  CreateAppointmentInput,
  CreateConsultationSignalInput,
  CreateMedicalRecordInput,
  CreateMessageInput,
  CreatePrescriptionInput,
  DoctorProfileRecord,
  MedicalRecordRecord,
  MessageRecord,
  PharmacyProfileRecord,
  PrescriptionWithItems,
  UpdateAppointmentInput,
  UpsertConversationInput,
} from '../../types';

/**
 * Care aggregates: directories, appointments, prescriptions, messaging,
 * medical records and video signalling. Mirrors the record shapes returned by
 * the memory datastore so services never branch on the storage engine.
 */
export class DirectoryRepository {
  constructor(private readonly client: PrismaClient) {}

  async listDoctors(filter: DoctorDirectoryFilter = {}): Promise<DoctorProfileRecord[]> {
    const where: Prisma.DoctorProfileWhereInput = {
      ...(filter.verificationStatus
        ? { verificationStatus: filter.verificationStatus }
        : {}),
      ...(filter.city
        ? { city: { equals: filter.city, mode: 'insensitive' as const } }
        : {}),
      ...(filter.specialization ? { specialization: filter.specialization } : {}),
      ...(filter.text
        ? {
            OR: [
              { fullName: { contains: filter.text, mode: 'insensitive' as const } },
              { clinicName: { contains: filter.text, mode: 'insensitive' as const } },
              {
                specialization: {
                  contains: filter.text,
                  mode: 'insensitive' as const,
                },
              },
            ],
          }
        : {}),
    };
    return (await this.client.doctorProfile.findMany({
      where,
      orderBy: { fullName: 'asc' },
    })) as DoctorProfileRecord[];
  }

  async getDoctorById(profileId: string): Promise<DoctorProfileRecord | null> {
    return (await this.client.doctorProfile.findUnique({
      where: { id: profileId },
    })) as DoctorProfileRecord | null;
  }

  async listPharmacies(
    filter: PharmacyDirectoryFilter = {},
  ): Promise<PharmacyProfileRecord[]> {
    const where: Prisma.PharmacyProfileWhereInput = {
      ...(filter.verificationStatus
        ? { verificationStatus: filter.verificationStatus }
        : {}),
      ...(filter.city
        ? { city: { equals: filter.city, mode: 'insensitive' as const } }
        : {}),
      ...(filter.text
        ? {
            OR: [
              {
                pharmacyName: { contains: filter.text, mode: 'insensitive' as const },
              },
              { ownerName: { contains: filter.text, mode: 'insensitive' as const } },
              { address: { contains: filter.text, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    return (await this.client.pharmacyProfile.findMany({
      where,
      orderBy: { pharmacyName: 'asc' },
    })) as PharmacyProfileRecord[];
  }
}

export class AppointmentRepository {
  constructor(private readonly client: PrismaClient) {}

  async create(input: CreateAppointmentInput): Promise<AppointmentRecord> {
    return (await this.client.appointment.create({
      data: {
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
      },
    })) as AppointmentRecord;
  }

  /**
   * Atomic slot reservation. Acquires a per-doctor+day advisory lock, re-checks
   * for an overlap, and inserts inside the SAME transaction. A concurrent
   * booking for the same doctor+day blocks on the lock, then sees the committed
   * row and bails — so only one can ever win the slot. Returns null on a lost
   * race so the caller can surface a controlled conflict. Unrelated doctors and
   * days use different lock keys and never block each other.
   */
  async reserve(input: CreateAppointmentInput): Promise<AppointmentRecord | null> {
    const lockKey = `${input.doctorProfileId}:${input.scheduledDate.toISOString()}`;
    return this.client.$transaction(async (tx) => {
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;
      const clash = await tx.appointment.findFirst({
        where: {
          doctorProfileId: input.doctorProfileId,
          scheduledDate: input.scheduledDate,
          startTime: input.startTime,
          status: { not: 'CANCELLED' },
        },
      });
      if (clash) return null;
      return (await tx.appointment.create({
        data: {
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
        },
      })) as AppointmentRecord;
    });
  }

  async getById(id: string): Promise<AppointmentRecord | null> {
    return (await this.client.appointment.findUnique({ where: { id } })) as
      | AppointmentRecord
      | null;
  }

  /** Newest first — matching the memory datastore's ordering. */
  async listByPatient(patientUserId: string): Promise<AppointmentRecord[]> {
    return (await this.client.appointment.findMany({
      where: { patientUserId },
      orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
    })) as AppointmentRecord[];
  }

  async listByDoctor(doctorUserId: string): Promise<AppointmentRecord[]> {
    return (await this.client.appointment.findMany({
      where: { doctorUserId },
      orderBy: [{ scheduledDate: 'desc' }, { createdAt: 'desc' }],
    })) as AppointmentRecord[];
  }

  /** Exact-slot lookup used to reject double bookings. */
  async findAt(
    doctorProfileId: string,
    scheduledDate: Date,
    startTime: string,
  ): Promise<AppointmentRecord | null> {
    return (await this.client.appointment.findFirst({
      where: {
        doctorProfileId,
        scheduledDate,
        startTime,
        status: { not: 'CANCELLED' },
      },
    })) as AppointmentRecord | null;
  }

  async update(
    id: string,
    patch: UpdateAppointmentInput,
  ): Promise<AppointmentRecord> {
    return (await this.client.appointment.update({
      where: { id },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.meetingUrl !== undefined ? { meetingUrl: patch.meetingUrl } : {}),
        ...(patch.reason !== undefined ? { reason: patch.reason } : {}),
      },
    })) as AppointmentRecord;
  }

  /**
   * Conditional status transition: the write only applies when the row still
   * holds one of the expected statuses. Returns null when a concurrent
   * cancellation or another transition already moved it.
   */
  async transitionStatus(
    id: string,
    expectedStatuses: AppointmentStatus[],
    patch: UpdateAppointmentInput,
  ): Promise<AppointmentRecord | null> {
    const result = await this.client.appointment.updateMany({
      where: { id, status: { in: expectedStatuses } },
      data: {
        ...(patch.status !== undefined ? { status: patch.status } : {}),
        ...(patch.meetingUrl !== undefined ? { meetingUrl: patch.meetingUrl } : {}),
        ...(patch.reason !== undefined ? { reason: patch.reason } : {}),
      },
    });
    if (result.count === 0) return null;
    return this.getById(id);
  }
}

export class PrescriptionRepository {
  constructor(private readonly client: PrismaClient) {}

  /** Prescription + items written in one transaction so they cannot split. */
  async create(input: CreatePrescriptionInput): Promise<PrescriptionWithItems> {
    return (await this.client.$transaction(async (tx) => {
      const prescription = await tx.prescription.create({
        data: {
          id: createId('rx'),
          patientUserId: input.patientUserId,
          doctorUserId: input.doctorUserId,
          appointmentId: input.appointmentId ?? null,
          diagnosis: input.diagnosis ?? null,
          notes: input.notes ?? null,
          status: input.status ?? 'ACTIVE',
          items: {
            create: input.items.map((item) => ({
              id: createId('rxi'),
              medicineName: item.medicineName,
              dosage: item.dosage ?? null,
              frequency: item.frequency ?? null,
              duration: item.duration ?? null,
              instructions: item.instructions ?? null,
            })),
          },
        },
        include: { items: true },
      });
      return prescription as PrescriptionWithItems;
    })) as PrescriptionWithItems;
  }

  async getById(id: string): Promise<PrescriptionWithItems | null> {
    const row = await this.client.prescription.findUnique({
      where: { id },
      include: { items: true },
    });
    return row as PrescriptionWithItems | null;
  }

  async listByPatient(patientUserId: string): Promise<PrescriptionWithItems[]> {
    const rows = await this.client.prescription.findMany({
      where: { patientUserId },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    return rows as PrescriptionWithItems[];
  }
}

export class ConversationRepository {
  constructor(private readonly client: PrismaClient) {}

  async getOrCreate(input: UpsertConversationInput): Promise<ConversationRecord> {
    const existing = await this.client.conversation.findFirst({
      where: {
        patientUserId: input.patientUserId,
        doctorUserId: input.doctorUserId,
      },
    });
    if (existing) return existing as ConversationRecord;
    return (await this.client.conversation.create({
      data: {
        id: createId('cnv'),
        patientUserId: input.patientUserId,
        doctorUserId: input.doctorUserId,
      },
    })) as ConversationRecord;
  }

  async listByUser(userId: string): Promise<ConversationRecord[]> {
    return (await this.client.conversation.findMany({
      where: { OR: [{ patientUserId: userId }, { doctorUserId: userId }] },
      orderBy: { lastMessageAt: 'desc' },
    })) as ConversationRecord[];
  }

  async getById(id: string): Promise<ConversationRecord | null> {
    return (await this.client.conversation.findUnique({ where: { id } })) as
      | ConversationRecord
      | null;
  }

  /** Oldest first. */
  async listMessages(conversationId: string): Promise<MessageRecord[]> {
    return (await this.client.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
    })) as MessageRecord[];
  }

  /** Appends the message and bumps the conversation's activity stamp. */
  async createMessage(input: CreateMessageInput): Promise<MessageRecord> {
    return (await this.client.$transaction(async (tx) => {
      const message = await tx.message.create({
        data: {
          id: createId('msg'),
          conversationId: input.conversationId,
          senderUserId: input.senderUserId,
          body: input.body,
        },
      });
      await tx.conversation.update({
        where: { id: input.conversationId },
        data: { lastMessageAt: message.createdAt },
      });
      return message;
    })) as MessageRecord;
  }
}

export class MedicalRecordRepository {
  constructor(private readonly client: PrismaClient) {}

  async create(input: CreateMedicalRecordInput): Promise<MedicalRecordRecord> {
    return (await this.client.medicalRecord.create({
      data: {
        id: createId('mrc'),
        patientUserId: input.patientUserId,
        recordType: input.recordType,
        title: input.title,
        description: input.description ?? null,
        documentId: input.documentId ?? null,
        recordDate: input.recordDate ?? null,
      },
    })) as MedicalRecordRecord;
  }

  async getById(id: string): Promise<MedicalRecordRecord | null> {
    return (await this.client.medicalRecord.findUnique({ where: { id } })) as
      | MedicalRecordRecord
      | null;
  }

  /** Newest first by the day the record refers to. */
  async listByPatient(patientUserId: string): Promise<MedicalRecordRecord[]> {
    return (await this.client.medicalRecord.findMany({
      where: { patientUserId },
      orderBy: [{ recordDate: 'desc' }, { createdAt: 'desc' }],
    })) as MedicalRecordRecord[];
  }

  async delete(id: string): Promise<boolean> {
    try {
      await this.client.medicalRecord.delete({ where: { id } });
      return true;
    } catch {
      // Prisma raises when the row does not exist — the contract returns false.
      return false;
    }
  }
}

export class SignalRepository {
  constructor(private readonly client: PrismaClient) {}

  async create(input: CreateConsultationSignalInput): Promise<ConsultationSignalRecord> {
    return (await this.client.consultationSignal.create({
      data: {
        id: createId('sgl'),
        appointmentId: input.appointmentId,
        senderUserId: input.senderUserId,
        payload: input.payload,
      },
    })) as ConsultationSignalRecord;
  }

  async listSince(
    appointmentId: string,
    since: Date,
  ): Promise<ConsultationSignalRecord[]> {
    return (await this.client.consultationSignal.findMany({
      where: { appointmentId, createdAt: { gte: since } },
      orderBy: { createdAt: 'asc' },
    })) as ConsultationSignalRecord[];
  }

  async prune(appointmentId: string, before: Date): Promise<number> {
    const result = await this.client.consultationSignal.deleteMany({
      where: { appointmentId, createdAt: { lt: before } },
    });
    return result.count;
  }
}
