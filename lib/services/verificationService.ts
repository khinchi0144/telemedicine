import 'server-only';

import { getStore } from '@/lib/db';
import { VERIFICATION_STATUSES } from '@/types/auth';
import type { ProfessionalProfileEntry } from '@/lib/db/types';
import type { Role, VerificationStatus } from '@/types/auth';

export interface VerificationQueue {
  entries: ProfessionalProfileEntry[];
  counts: {
    total: number;
    pending: number;
    verified: number;
    rejected: number;
  };
}

export const REVIEWABLE_ROLES = ['DOCTOR', 'PHARMACY'] as const;
export type ReviewableRole = (typeof REVIEWABLE_ROLES)[number];

export function isReviewableRole(value: string): value is ReviewableRole {
  return (REVIEWABLE_ROLES as readonly string[]).includes(value);
}

/** Only these transitions are allowed, so the API can never set a bad status. */
export function isReviewDecision(
  value: unknown,
): value is Extract<VerificationStatus, 'VERIFIED' | 'REJECTED'> {
  return value === 'VERIFIED' || value === 'REJECTED';
}

export function isVerificationStatus(value: unknown): value is VerificationStatus {
  return (
    typeof value === 'string' &&
    (VERIFICATION_STATUSES as readonly string[]).includes(value)
  );
}

/** The real verification queue for one professional role. */
export async function getVerificationQueue(
  role: ReviewableRole,
): Promise<VerificationQueue> {
  const store = await getStore();
  const entries = await store.listProfessionalProfiles(role);

  const counts = entries.reduce(
    (acc, entry) => {
      acc.total += 1;
      if (entry.verificationStatus === 'VERIFIED') acc.verified += 1;
      else if (entry.verificationStatus === 'REJECTED') acc.rejected += 1;
      else acc.pending += 1;
      return acc;
    },
    { total: 0, pending: 0, verified: 0, rejected: 0 },
  );

  return { entries, counts };
}

/** Combined doctor + pharmacy queue used by the admin dashboard. */
export async function getPlatformOverview(): Promise<{
  doctors: VerificationQueue;
  pharmacies: VerificationQueue;
}> {
  const [doctors, pharmacies] = await Promise.all([
    getVerificationQueue('DOCTOR'),
    getVerificationQueue('PHARMACY'),
  ]);
  return { doctors, pharmacies };
}

export type ReviewOutcome =
  | { ok: true; entry: ProfessionalProfileEntry }
  | { ok: false; error: string; code: 400 | 404 };

/**
 * Records an admin decision on a professional profile.
 *
 * The caller is responsible for authenticating and authorising (see the route);
 * this function only enforces data integrity and returns a typed outcome.
 */
export async function reviewProfile(input: {
  role: Role;
  profileId: string;
  decision: Extract<VerificationStatus, 'VERIFIED' | 'REJECTED'>;
}): Promise<ReviewOutcome> {
  if (!isReviewableRole(input.role)) {
    return { ok: false, error: 'Only doctor and pharmacy profiles can be reviewed.', code: 400 };
  }

  const store = await getStore();
  const updated = await store.updateProfileVerificationStatus(
    input.profileId,
    input.role,
    input.decision,
  );

  if (!updated) {
    return { ok: false, error: 'That profile no longer exists.', code: 404 };
  }

  const queue = await getVerificationQueue(input.role);
  const entry = queue.entries.find((item) => item.profileId === input.profileId);

  if (!entry) {
    return { ok: false, error: 'That profile no longer exists.', code: 404 };
  }

  return { ok: true, entry };
}