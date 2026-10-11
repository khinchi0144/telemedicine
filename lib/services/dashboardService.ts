import 'server-only';

import { getStore } from '@/lib/db';
import { humanizeStatus } from '@/lib/utils/format';
import type { Role, VerificationStatus } from '@/types/auth';

/**
 * Dashboard read model.
 *
 * Every field below comes from the real datastore (users, role profiles and
 * uploaded documents). Nothing is invented: modules whose backend does not
 * exist yet are reported as absent, so the UI can show an honest empty state
 * instead of fabricated rows.
 */

export interface DocumentSummary {
  id: string;
  documentType: string;
  fileName: string;
  verificationStatus: string;
  createdAt: Date;
}

export interface VerificationSummary {
  status: VerificationStatus | 'NOT_APPLICABLE';
  label: string;
  isVerified: boolean;
  isPending: boolean;
}

export interface DashboardData {
  role: Role;
  user: {
    id: string;
    fullName: string;
    email: string | null;
    mobile: string;
    status: string;
    memberSince: Date;
    lastLoginAt: Date | null;
  };
  verification: VerificationSummary;
  /** 0–100 completeness of the captured profile. */
  profileCompletion: number;
  documents: DocumentSummary[];
  documentsByStatus: Record<string, number>;
  facts: { label: string; value: string }[];
  /** Days since the account was created. */
  accountAgeDays: number;
}

const NOT_APPLICABLE: VerificationSummary = {
  status: 'NOT_APPLICABLE',
  label: 'Active',
  isVerified: false,
  isPending: false,
};

export async function getDashboardData(
  userId: string,
  role: Role,
  displayName: string,
): Promise<DashboardData> {
  const store = await getStore();
  const user = await store.findUserById(userId);

  const documents = await store.listDocumentsByUserId(userId);
  const documentsByStatus = documents.reduce<Record<string, number>>(
    (acc, doc) => {
      acc[doc.verificationStatus] = (acc[doc.verificationStatus] ?? 0) + 1;
      return acc;
    },
    {},
  );

  const verification =
    role === 'PATIENT'
      ? NOT_APPLICABLE
      : await getVerificationSummary(store, role, userId);

  const facts = await buildFacts(store, role, userId);

  const accountAgeDays = user
    ? Math.max(0, Math.floor((Date.now() - user.createdAt.getTime()) / 86_400_000))
    : 0;

  return {
    role,
    user: {
      id: userId,
      fullName: displayName,
      email: user?.email ?? null,
      mobile: user?.mobile ?? '',
      status: user?.status ?? 'ACTIVE',
      memberSince: user?.createdAt ?? new Date(),
      lastLoginAt: user?.lastLoginAt ?? null,
    },
    verification,
    profileCompletion: completionFor(facts),
    documents: documents
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((doc) => ({
        id: doc.id,
        documentType: doc.documentType,
        fileName: doc.fileName,
        verificationStatus: doc.verificationStatus,
        createdAt: doc.createdAt,
      })),
    documentsByStatus,
    facts,
    accountAgeDays,
  };
}

async function getVerificationSummary(
  store: Awaited<ReturnType<typeof getStore>>,
  role: Role,
  userId: string,
) {
  const raw =
    role === 'DOCTOR'
      ? (await store.getDoctorProfileByUserId(userId))?.verificationStatus
      : role === 'PHARMACY'
        ? (await store.getPharmacyProfileByUserId(userId))?.verificationStatus
        : undefined;

  const status = (raw ?? 'PENDING_VERIFICATION') as VerificationStatus;
  return {
    status,
    label: humanizeStatus(status),
    isVerified: status === 'VERIFIED',
    isPending: status === 'PENDING_VERIFICATION',
  };
}
async function buildFacts(
  store: Awaited<ReturnType<typeof getStore>>,
  role: Role,
  userId: string,
): Promise<{ label: string; value: string }[]> {
  if (role === 'PATIENT') {
    const profile = await store.getPatientProfileByUserId(userId);
    if (!profile) return [];
    return [
      { label: 'Full name', value: profile.fullName },
      {
        label: 'Date of birth',
        value: profile.dateOfBirth
          ? profile.dateOfBirth.toISOString().slice(0, 10)
          : 'Not provided',
      },
      { label: 'Gender', value: pretty(profile.gender) },
      {
        label: 'Location',
        value:
          [profile.city, profile.state].filter(Boolean).join(', ') || 'Not provided',
      },
      { label: 'Blood group', value: profile.bloodGroup ?? 'Not provided' },
      {
        label: 'Emergency contact',
        value: profile.emergencyContactName ?? 'Not provided',
      },
    ];
  }

  if (role === 'DOCTOR') {
    const profile = await store.getDoctorProfileByUserId(userId);
    if (!profile) return [];
    return [
      { label: 'Full name', value: profile.fullName },
      { label: 'Registration number', value: profile.medicalRegistrationNumber },
      { label: 'Medical council', value: profile.medicalCouncil },
      { label: 'Specialization', value: profile.specialization },
      { label: 'Qualification', value: profile.qualification },
      { label: 'Experience', value: `${profile.experienceYears} years` },
      { label: 'Clinic', value: profile.clinicName },
      {
        label: 'Location',
        value: [profile.city, profile.state].filter(Boolean).join(', '),
      },
      { label: 'Consultation mode', value: pretty(profile.consultationMode) },
    ];
  }

  if (role === 'PHARMACY') {
    const profile = await store.getPharmacyProfileByUserId(userId);
    if (!profile) return [];
    const hours = await store.getPharmacyOperatingHours(profile.id);
    const openDays = hours.filter((row) => !row.isClosed).length;
    return [
      { label: 'Pharmacy name', value: profile.pharmacyName },
      { label: 'Owner', value: profile.ownerName },
      { label: 'Drug licence', value: profile.drugLicenseNumber ?? 'Not provided' },
      { label: 'GST number', value: profile.gstNumber ?? 'Not provided' },
      {
        label: 'Registration number',
        value: profile.pharmacyRegistrationNumber ?? 'Not provided',
      },
      { label: 'Type', value: pretty(profile.pharmacyType) },
      {
        label: 'Address',
        value: `${profile.address}, ${profile.city}, ${profile.state}`,
      },
      { label: 'Open days', value: `${openDays} of 7` },
    ];
  }

  return [];
}

/** Share of the captured profile fields that actually hold a value. */
function completionFor(facts: { label: string; value: string }[]): number {
  if (facts.length === 0) return 0;
  const filled = facts.filter(
    (fact) => fact.value && fact.value !== 'Not provided' && fact.value !== '—',
  ).length;
  return Math.round((filled / facts.length) * 100);
}

function pretty(value: string | null | undefined): string {
  if (!value) return 'Not provided';
  return value
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

