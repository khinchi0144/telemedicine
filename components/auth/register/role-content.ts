import { Stethoscope, Store, UserRound } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import type { RegisterableRole } from '@/types/auth';

/**
 * Presentation content for the registration account cards.
 *
 * Kept separate from the component so the copy can be reviewed (and translated)
 * without touching layout code. Routes are never defined here — the card reads
 * its destination from `ROLE_DEFINITIONS[role].registerPath`.
 */
export interface RoleAccent {
  icon: LucideIcon;
  /** Gradient utility classes for the 3D icon tile. */
  iconBg: string;
  /** Background/text utility classes for the feature check chips. */
  chipBg: string;
  /** rgba colour of the bloom that fades in on hover. */
  glow: string;
  /** Border colour applied on hover. */
  ring: string;
  /** CTA gradient utility classes. */
  button: string;
}

export const ROLE_ACCENT: Record<RegisterableRole, RoleAccent> = {
  PATIENT: {
    icon: UserRound,
    iconBg: 'bg-gradient-to-br from-teal-500 to-teal-700',
    chipBg: 'bg-teal-50 text-teal-700',
    glow: 'rgba(22,166,154,0.28)',
    ring: 'group-hover:border-teal-400/60',
    button: 'from-teal-500 to-teal-700',
  },
  DOCTOR: {
    icon: Stethoscope,
    iconBg: 'bg-gradient-to-br from-teal-400 to-primary',
    chipBg: 'bg-primary/10 text-primary',
    glow: 'rgba(8,127,140,0.30)',
    ring: 'group-hover:border-primary/55',
    button: 'from-primary to-teal-700',
  },
  PHARMACY: {
    icon: Store,
    iconBg: 'bg-gradient-to-br from-navy-600 to-navy-800',
    chipBg: 'bg-navy-50 text-navy-700',
    glow: 'rgba(20,43,59,0.24)',
    ring: 'group-hover:border-navy-400/50',
    button: 'from-navy-700 to-navy-900',
  },
};

/** Short marketing line shown under each card title. */
export const ROLE_TAGLINE: Record<RegisterableRole, string> = {
  PATIENT: 'Your personal healthcare companion.',
  DOCTOR: 'Manage your medical practice digitally.',
  PHARMACY: 'Bring your pharmacy online.',
};

/** Feature bullets shown on the card. */
export const ROLE_FEATURES: Record<RegisterableRole, string[]> = {
  PATIENT: [
    'Book online consultations.',
    'Connect with verified doctors.',
    'Manage prescriptions and medical records.',
  ],
  DOCTOR: [
    'Manage patient appointments.',
    'Conduct video consultations.',
    'Create digital prescriptions.',
  ],
  PHARMACY: [
    'Manage medicine inventory.',
    'Update medicine availability.',
    'Manage customer orders.',
  ],
};