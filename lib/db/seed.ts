import 'server-only';

import { env } from '@/lib/utils/env';
import { Errors } from '@/lib/utils/errors';
import type { DataStore } from './store';
import { hashPassword } from '@/lib/auth/password';

/** Demo account password used by the seeded development accounts. */
const DEMO_PASSWORD = 'MediCare@123';

const DEMO_ACCOUNTS = [
  {
    role: 'PATIENT' as const,
    fullName: 'Demo Patient',
    email: 'patient@medicare.dev',
    mobile: '9876500001',
  },
  {
    role: 'DOCTOR' as const,
    fullName: 'Demo Doctor',
    email: 'doctor@medicare.dev',
    mobile: '9876500002',
  },
  {
    role: 'PHARMACY' as const,
    fullName: 'Demo Pharmacy Owner',
    email: 'pharmacy@medicare.dev',
    mobile: '9876500003',
  },
  {
    // Needed to exercise the admin verification console end to end.
    role: 'ADMIN' as const,
    fullName: 'Demo Admin',
    email: 'admin@medicare.dev',
    mobile: '9876500004',
  },
];

/**
 * Seeds one demo account per role so the complete flow (including login and
 * the role based dashboards) can be tested without a real database.
 * Development only.
 */
export async function seedDemoData(store: DataStore): Promise<void> {
  if (store.kind !== 'memory' || !env.SEED_DEMO_DATA) return;

  for (const account of DEMO_ACCOUNTS) {
    const existing = await store.findUserByMobile(account.mobile);
    if (existing) continue;

    const user = await store.createUser({
      role: account.role,
      email: account.email,
      mobile: account.mobile,
      passwordHash: await hashPassword(DEMO_PASSWORD),
      status: 'ACTIVE',
      isEmailVerified: true,
      isMobileVerified: true,
    });

    if (account.role === 'PATIENT') {
      await store.upsertPatientProfile({
        userId: user.id,
        fullName: account.fullName,
        dateOfBirth: new Date('1992-05-14'),
        gender: 'OTHER',
        address: '221, Lake View Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        emergencyContactName: 'Demo Contact',
        emergencyContactNumber: '9876500099',
        bloodGroup: 'O+',
      });
    }

    if (account.role === 'DOCTOR') {
      await store.upsertDoctorProfile({
        userId: user.id,
        fullName: account.fullName,
        medicalRegistrationNumber: 'KMC-123456',
        medicalCouncil: 'Karnataka Medical Council',
        specialization: 'General Physician',
        qualification: 'MBBS, MD',
        experienceYears: 8,
        clinicName: 'MediCare Demo Clinic',
        clinicAddress: '18, MG Road',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        consultationMode: 'BOTH',
      });
    }

    if (account.role === 'PHARMACY') {
      const hours = {
        MONDAY: { isClosed: false, openTime: '09:00', closeTime: '21:00' },
        TUESDAY: { isClosed: false, openTime: '09:00', closeTime: '21:00' },
        WEDNESDAY: { isClosed: false, openTime: '09:00', closeTime: '21:00' },
        THURSDAY: { isClosed: false, openTime: '09:00', closeTime: '21:00' },
        FRIDAY: { isClosed: false, openTime: '09:00', closeTime: '21:00' },
        SATURDAY: { isClosed: false, openTime: '09:00', closeTime: '21:00' },
        SUNDAY: { isClosed: true, openTime: '09:00', closeTime: '21:00' },
      } as const;
      await store.upsertPharmacyProfile({
        userId: user.id,
        pharmacyName: 'MediCare Demo Pharmacy',
        ownerName: account.fullName,
        drugLicenseNumber: 'KA-20B-778899',
        gstNumber: '29ABCDE1234F1Z5',
        pharmacyRegistrationNumber: 'PHA-2024-5566',
        pharmacyType: 'RETAIL_WHOLESALE',
        address: '5, Market Street',
        city: 'Bengaluru',
        state: 'Karnataka',
        pincode: '560001',
        contactNumber: account.mobile,
        operatingHours: hours,
      });
    }
  }
}

/** Exposed for the development sign-in helper shown on the login page. */
export function demoAccounts() {
  return DEMO_ACCOUNTS.map((account) => ({
    ...account,
    password: DEMO_PASSWORD,
  }));
}

export { DEMO_PASSWORD };

/** Throws when demo seeding is requested outside development. */
export function assertDemoAllowed() {
  if (env.isProduction) throw Errors.forbidden();
}
