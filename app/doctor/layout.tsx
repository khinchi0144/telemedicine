import { ProtectedLayout } from '@/components/dashboard/ProtectedLayout';

/**
 * Server side guard: only DOCTOR accounts can render /doctor.
 * The guard runs before the shell renders, so an unauthorised user never
 * receives any dashboard markup.
 */
export default function DoctorLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout allowed={['DOCTOR']}>{children}</ProtectedLayout>;
}