import { ProtectedLayout } from '@/components/dashboard/ProtectedLayout';

/**
 * Server side guard: only ADMIN accounts can render /admin.
 * The guard runs before the shell renders, so an unauthorised user never
 * receives any dashboard markup.
 */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <ProtectedLayout allowed={['ADMIN']}>{children}</ProtectedLayout>;
}