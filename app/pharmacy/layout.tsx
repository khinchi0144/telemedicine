import { ProtectedLayout } from '@/components/dashboard/ProtectedLayout';

/**
 * Server side guard: only PHARMACY accounts can render /pharmacy.
 * The guard runs before the shell renders, so an unauthorised user never
 * receives any dashboard markup.
 */
export default function PharmacyLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout allowed={['PHARMACY']}>{children}</ProtectedLayout>;
}