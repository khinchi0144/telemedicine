import 'server-only';

import type { Prisma, PrismaClient } from '@prisma/client';

import { createId } from '@/lib/utils/crypto';
import type { VerificationStatus } from '@/types/auth';
import type {
  DoctorAvailabilityInput,
  DoctorAvailabilityRecord,
  DoctorProfileRecord,
  PatientProfileRecord,
  UpsertDoctorProfileInput,
  UpsertPatientProfileInput,
} from '../../types';

export class PatientProfileRepository {
  constructor(private readonly client: PrismaClient) {}

  async getByUserId(userId: string): Promise<PatientProfileRecord | null> {
    return (await this.client.patientProfile.findUnique({
      where: { userId },
    })) as PatientProfileRecord | null;
  }

  async upsert(input: UpsertPatientProfileInput): Promise<PatientProfileRecord> {
    const data: Prisma.PatientProfileUncheckedCreateInput = {
      id: createId('pat'),
      userId: input.userId,
      fullName: input.fullName,
      dateOfBirth: input.dateOfBirth ?? null,
      gender: (input.gender as never) ?? null,
      address: input.address ?? null,
      city: input.city ?? null,
      state: input.state ?? null,
      pincode: input.pincode ?? null,
      emergencyContactName: input.emergencyContactName ?? null,
      emergencyContactNumber: input.emergencyContactNumber ?? null,
      bloodGroup: input.bloodGroup ?? null,
      existingConditions: input.existingConditions ?? null,
      allergies: input.allergies ?? null,
    };
    return (await this.client.patientProfile.upsert({
      where: { userId: input.userId },
      create: data,
      update: data,
    })) as PatientProfileRecord;
  }
}

export class DoctorProfileRepository {
  constructor(private readonly client: PrismaClient) {}

  async getByUserId(userId: string): Promise<DoctorProfileRecord | null> {
    return (await this.client.doctorProfile.findUnique({
      where: { userId },
    })) as DoctorProfileRecord | null;
  }

  async upsert(input: UpsertDoctorProfileInput): Promise<DoctorProfileRecord> {
    const data: Prisma.DoctorProfileUncheckedCreateInput = {
      id: createId('doc'),
      userId: input.userId,
      fullName: input.fullName,
      medicalRegistrationNumber: input.medicalRegistrationNumber,
      medicalCouncil: input.medicalCouncil,
      specialization: input.specialization,
      qualification: input.qualification,
      experienceYears: input.experienceYears,
      profilePhoto: input.profilePhoto ?? null,
      clinicName: input.clinicName,
      clinicAddress: input.clinicAddress,
      city: input.city,
      state: input.state,
      pincode: input.pincode,
      consultationMode: input.consultationMode,
      consultationFee: input.consultationFee ?? null,
    };
    return (await this.client.doctorProfile.upsert({
      where: { userId: input.userId },
      create: data,
      update: data,
    })) as DoctorProfileRecord;
  }

  /** Newest first — the verification queue reviews the latest applications. */
  async listAll(): Promise<DoctorProfileRecord[]> {
    return (await this.client.doctorProfile.findMany({
      orderBy: { createdAt: 'desc' },
    })) as DoctorProfileRecord[];
  }

  async updateVerificationStatus(
    profileId: string,
    status: VerificationStatus,
  ): Promise<DoctorProfileRecord | null> {
    return (await this.client.doctorProfile.update({
      where: { id: profileId },
      data: { verificationStatus: status },
    })) as DoctorProfileRecord;
  }

  async getAvailability(doctorId: string): Promise<DoctorAvailabilityRecord[]> {
    return (await this.client.doctorAvailability.findMany({
      where: { doctorId },
      orderBy: { day: 'asc' },
    })) as DoctorAvailabilityRecord[];
  }

  /** Replaces the whole week in a transaction so it can never be half written. */
  async replaceAvailability(
    doctorId: string,
    slots: DoctorAvailabilityInput[],
  ): Promise<DoctorAvailabilityRecord[]> {
    return (await this.client.$transaction(async (tx) => {
      await tx.doctorAvailability.deleteMany({ where: { doctorId } });
      if (slots.length > 0) {
        await tx.doctorAvailability.createMany({
          data: slots.map((slot) => ({
            id: createId('dav'),
            doctorId,
            day: slot.day,
            isEnabled: slot.isEnabled,
            startTime: slot.startTime,
            endTime: slot.endTime,
          })),
        });
      }
      return tx.doctorAvailability.findMany({
        where: { doctorId },
        orderBy: { day: 'asc' },
      });
    })) as DoctorAvailabilityRecord[];
  }
}
