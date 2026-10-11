import { ProtectedLayout } from '@/components/dashboard/ProtectedLayout';

/**
 * Server side guard: only PATIENT accounts can render /patient.
 * The guard runs before the shell renders, so an unauthorised user never
 * receives any dashboard markup.
 */
export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout allowed={['PATIENT']}>{children}</ProtectedLayout>;
}
