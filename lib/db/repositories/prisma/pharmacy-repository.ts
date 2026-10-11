import 'server-only';

import type { PrismaClient } from '@prisma/client';

import { createId } from '@/lib/utils/crypto';
import { WEEK_DAY_OPTIONS } from '@/lib/constants/options';
import type { VerificationStatus } from '@/types/auth';
import type {
  PharmacyOperatingHoursRecord,
  PharmacyProfileRecord,
  UpsertPharmacyProfileInput,
} from '../../types';

export class PharmacyProfileRepository {
  constructor(private readonly client: PrismaClient) {}

  async getByUserId(userId: string): Promise<PharmacyProfileRecord | null> {
    return (await this.client.pharmacyProfile.findUnique({
      where: { userId },
    })) as PharmacyProfileRecord | null;
  }

  async upsert(input: UpsertPharmacyProfileInput): Promise<PharmacyProfileRecord> {
    const details = {
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
    };

    const profile = (await this.client.pharmacyProfile.upsert({
      where: { userId: input.userId },
      create: { id: createId('phr'), userId: input.userId, ...details },
      update: details,
    })) as PharmacyProfileRecord;

    // Operating hours are replaced as a set so the seven days stay consistent.
    await this.client.pharmacyOperatingHours.deleteMany({
      where: { pharmacyId: profile.id },
    });
    await this.client.pharmacyOperatingHours.createMany({
      data: WEEK_DAY_OPTIONS.map((day) => {
        const hours = input.operatingHours[day.value];
        return {
          id: createId('hrs'),
          pharmacyId: profile.id,
          day: day.value,
          isClosed: hours?.isClosed ?? false,
          openTime: hours?.openTime ?? '09:00',
          closeTime: hours?.closeTime ?? '21:00',
        };
      }),
    });

    return profile;
  }

  async getOperatingHours(
    pharmacyId: string,
  ): Promise<PharmacyOperatingHoursRecord[]> {
    return (await this.client.pharmacyOperatingHours.findMany({
      where: { pharmacyId },
    })) as PharmacyOperatingHoursRecord[];
  }

  /** Newest first — the verification queue reviews the latest applications. */
  async listAll(): Promise<PharmacyProfileRecord[]> {
    return (await this.client.pharmacyProfile.findMany({
      orderBy: { createdAt: 'desc' },
    })) as PharmacyProfileRecord[];
  }

  async updateVerificationStatus(
    profileId: string,
    status: VerificationStatus,
  ): Promise<PharmacyProfileRecord | null> {
    return (await this.client.pharmacyProfile.update({
      where: { id: profileId },
      data: { verificationStatus: status },
    })) as PharmacyProfileRecord;
  }
}
