export const APP_NAME = 'MediCare';
export const APP_TAGLINE = 'Your Health, Our Priority';
export const APP_DESCRIPTION =
  'Connect with healthcare professionals and manage your healthcare journey.';

export const APP_SUPPORT_EMAIL = 'support@medicare.example';
export const APP_SUPPORT_PHONE = '1800 000 0000';

/** Routes that are always reachable without a session. */
export const PUBLIC_ROUTES = [
  '/',
  '/auth',
  '/auth/login',
  '/auth/forgot-password',
  '/auth/register',
  '/auth/register/patient',
  '/auth/register/doctor',
  '/auth/register/pharmacy',
] as const;

/** Route prefixes protected by the role based access control layer. */
export const PROTECTED_ROUTES = {
  PATIENT: ['/patient'],
  DOCTOR: ['/doctor'],
  PHARMACY: ['/pharmacy'],
  ADMIN: ['/admin'],
} as const;
