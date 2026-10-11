import type { Role, RegisterableRole } from '@/types/auth';

export interface RoleDefinition {
  role: RegisterableRole;
  title: string;
  description: string;
  /** Landing page once the account is created. */
  homePath: string;
  /** Registration wizard route. */
  registerPath: string;
  /** Icon key resolved inside components/auth/RoleCard.tsx. */
  icon: 'user' | 'stethoscope' | 'store';
  /** Trust bullet shown under the description. */
  highlights: string[];
}

/**
 * Single source of truth for role metadata.
 * UI, routing guards and API validation all read from here.
 */
export const ROLE_DEFINITIONS: Record<RegisterableRole, RoleDefinition> = {
  PATIENT: {
    role: 'PATIENT',
    title: 'Patient',
    description: 'For individuals seeking medical care',
    homePath: '/patient',
    registerPath: '/auth/register/patient',
    icon: 'user',
    highlights: [
      'Book and manage consultations',
      'Maintain your health information',
      'Access prescriptions and reports',
    ],
  },
  DOCTOR: {
    role: 'DOCTOR',
    title: 'Doctor',
    description: 'For verified medical professionals',
    homePath: '/doctor',
    registerPath: '/auth/register/doctor',
    icon: 'stethoscope',
    highlights: [
      'Verified professional profile',
      'Manage consultations and availability',
      'Securely share prescriptions',
    ],
  },
  PHARMACY: {
    role: 'PHARMACY',
    title: 'Pharmacy',
    description: 'For registered pharmacies',
    homePath: '/pharmacy',
    registerPath: '/auth/register/pharmacy',
    icon: 'store',
    highlights: [
      'Verified pharmacy profile',
      'Manage orders and inventory',
      'Update store timings and details',
    ],
  },
};

export const ROLE_ORDER: RegisterableRole[] = ['PATIENT', 'DOCTOR', 'PHARMACY'];

/** Where a signed-in user of a given role belongs. */
export const ROLE_HOME: Record<Role, string> = {
  PATIENT: '/patient',
  DOCTOR: '/doctor',
  PHARMACY: '/pharmacy',
  ADMIN: '/admin',
};

/** Path segment owned by a role — used by the proxy and the page guards. */
export const ROLE_PROTECTED_PREFIX: Record<Role, string> = {
  PATIENT: '/patient',
  DOCTOR: '/doctor',
  PHARMACY: '/pharmacy',
  ADMIN: '/admin',
};

export function isRole(value: unknown): value is Role {
  return (
    typeof value === 'string' &&
    ['PATIENT', 'DOCTOR', 'PHARMACY', 'ADMIN'].includes(value)
  );
}
