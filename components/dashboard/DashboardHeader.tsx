'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LogOut, Menu, X } from 'lucide-react';

import { Logo } from '@/components/common/Logo';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/utils/api-client';
import { APP_NAME } from '@/lib/constants/app';
import { humanizeStatus } from '@/lib/utils/format';
import type { SessionUser } from '@/types/auth';

export interface DashboardHeaderProps {
  user: SessionUser;
  roleLabel: string;
  /** Extra badge, e.g. "PENDING_VERIFICATION". */
  status?: string | null;
}

const NAV_LINKS: Record<string, { href: string; label: string }[]> = {
  PATIENT: [{ href: '/patient', label: 'Home' }],
  DOCTOR: [{ href: '/doctor', label: 'Home' }],
  PHARMACY: [{ href: '/pharmacy', label: 'Home' }],
  ADMIN: [{ href: '/admin', label: 'Home' }],
};

/** Shared chrome for the three role dashboards. */
export function DashboardHeader({ user, roleLabel, status }: DashboardHeaderProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);
  const links = NAV_LINKS[user.role] ?? [];

  const signOut = async () => {
    setSigningOut(true);
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
      router.replace('/auth');
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Logo href="/" size="sm" />
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {roleLabel}
          </Badge>
        </div>

        <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium leading-tight">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">{roleLabel}</p>
          </div>
          {status && (
            <Badge
              variant={status === 'VERIFIED' ? 'success' : 'warning'}
              className="hidden lg:inline-flex"
            >
              {humanizeStatus(status)}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={signOut}
            loading={signingOut}
            className="hidden sm:inline-flex"
          >
            <LogOut aria-hidden="true" />
            Sign out
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </Button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-border bg-card px-4 py-3 md:hidden">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">{user.fullName}</p>
            <p className="text-xs text-muted-foreground">
              {APP_NAME} · {roleLabel}
            </p>
            {status && (
              <Badge
                variant={status === 'VERIFIED' ? 'success' : 'warning'}
                className="w-fit"
              >
                {humanizeStatus(status)}
              </Badge>
            )}
            <Button variant="outline" onClick={signOut} loading={signingOut}>
              <LogOut aria-hidden="true" />
              Sign out
            </Button>
          </div>
        </div>
      )}
    </header>
  );
}
