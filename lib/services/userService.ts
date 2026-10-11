import 'server-only';

import { getStore } from '@/lib/db';
import { Errors } from '@/lib/utils/errors';
import type { Role } from '@/types/auth';
import type {
  DoctorProfileRecord,
  PatientProfileRecord,
  PharmacyProfileRecord,
} from '@/lib/db/types';

/**
 * User lookup helpers shared by the services, the API and the dashboard
 * pages. Nothing here ever returns a password hash.
 */

export async function resolveFullName(
  userId: string,
  role: Role,
  email: string | null,
): Promise<string> {
  const store = await getStore();
  if (role === 'PATIENT') {
    const profile = await store.getPatientProfileByUserId(userId);
    if (profile?.fullName) return profile.fullName;
  }
  if (role === 'DOCTOR') {
    const profile = await store.getDoctorProfileByUserId(userId);
    if (profile?.fullName) return profile.fullName;
  }
  if (role === 'PHARMACY') {
    const profile = await store.getPharmacyProfileByUserId(userId);
    if (profile?.pharmacyName) return profile.pharmacyName;
    if (profile?.ownerName) return profile.ownerName;
  }
  return email?.split('@')[0] ?? 'MediCare user';
}

export async function getPatientProfile(
  userId: string,
): Promise<PatientProfileRecord> {
  const store = await getStore();
  const profile = await store.getPatientProfileByUserId(userId);
  if (!profile) throw Errors.notFound('Patient profile not found.');
  return profile;
}

export async function getDoctorProfile(
  userId: string,
): Promise<DoctorProfileRecord> {
  const store = await getStore();
  const profile = await store.getDoctorProfileByUserId(userId);
  if (!profile) throw Errors.notFound('Doctor profile not found.');
  return profile;
}

export async function getPharmacyProfile(
  userId: string,
): Promise<PharmacyProfileRecord> {
  const store = await getStore();
  const profile = await store.getPharmacyProfileByUserId(userId);
  if (!profile) throw Errors.notFound('Pharmacy profile not found.');
  return profile;
}

export async function isEmailAvailable(email: string): Promise<boolean> {
  const store = await getStore();
  return (await store.findUserByEmail(email.toLowerCase())) === null;
}

export async function isMobileAvailable(mobile: string): Promise<boolean> {
  const store = await getStore();
  return (await store.findUserByMobile(mobile)) === null;
}
