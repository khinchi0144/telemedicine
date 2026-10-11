'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { LogOut, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react';
import { toast } from 'sonner';

import { Logo } from '@/components/common/Logo';
import { Badge } from '@/components/ui/badge';
import { SidebarLink, isActive } from './SidebarLink';
import { apiRequest } from '@/lib/utils/api-client';
import { cn } from '@/lib/utils/cn';
import { humanizeStatus } from '@/lib/utils/format';
import { ROLE_LABEL, ROLE_NAV } from '@/lib/navigation';
import type { SessionUser } from '@/types/auth';

export interface SidebarProps {
  user: SessionUser;
  collapsed: boolean;
  onToggle: () => void;
  onNavigate?: () => void;
  /** Mobile drawer renders the same content inside an overlay. */
  variant?: 'fixed' | 'drawer';
}

/** Role aware navigation sidebar, shared by all four workspaces. */
export function Sidebar({
  user,
  collapsed,
  onToggle,
  onNavigate,
  variant = 'fixed',
}: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const groups = ROLE_NAV[user.role] ?? [];
  const isDrawer = variant === 'drawer';
  const compact = collapsed && !isDrawer;

  const handleSignOut = async () => {
    try {
      await apiRequest('/api/auth/logout', { method: 'POST' });
      router.replace('/auth');
      router.refresh();
    } catch {
      toast.error('We could not sign you out. Please try again.');
    }
  };

  return (
    <div
      className={cn(
        'flex h-full flex-col bg-navy-950 text-sidebar-foreground',
        isDrawer && 'rounded-r-2xl',
      )}
    >
      <div
        className={cn(
          'flex h-16 shrink-0 items-center border-b border-white/10 px-4',
          compact && 'justify-center px-0',
        )}
      >
        {isDrawer && (
          <button
            type="button"
            onClick={onNavigate}
            className="mr-auto rounded-md p-1 text-sidebar-muted transition-colors hover:text-white"
            aria-label="Close navigation"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        )}
        <Logo href="/" size="sm" inverted showText={!compact} />
      </div>

      <nav
        aria-label="Workspace"
        className="flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 py-5"
      >
        {groups.map((group) => (
          <div key={group.label} className="space-y-1">
            {compact ? (
              <div className="mx-auto mb-2 h-px w-6 bg-white/10" />
            ) : (
              <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-sidebar-muted/70">
                {group.label}
              </p>
            )}
            <ul className="space-y-0.5">
              {group.items.map((item) => (
                <li key={item.label}>
                  <SidebarLink
                    item={item}
                    active={isActive(pathname, item.href)}
                    collapsed={compact}
                    onNavigate={onNavigate}
                  />
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>

      <div className="shrink-0 border-t border-white/10 p-3">
        {!compact && (
          <div className="mb-3 rounded-xl bg-white/[0.05] p-3">
            <p className="truncate text-[13px] font-semibold text-white">
              {user.fullName}
            </p>
            <p className="mt-0.5 truncate text-[11px] text-sidebar-muted">
              {ROLE_LABEL[user.role]}
            </p>
            {user.verificationStatus && (
              <Badge
                variant={
                  user.verificationStatus === 'VERIFIED' ? 'success' : 'warning'
                }
                className="mt-2"
              >
                {humanizeStatus(user.verificationStatus)}
              </Badge>
            )}
          </div>
        )}

        <button
          type="button"
          onClick={handleSignOut}
          title="Sign out"
          className={cn(
            'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-white/10 hover:text-white',
            compact && 'justify-center px-0',
          )}
        >
          <LogOut className="size-[18px] shrink-0" aria-hidden="true" />
          {compact ? <span className="sr-only">Sign out</span> : 'Sign out'}
        </button>

        {!isDrawer && (
          <button
            type="button"
            onClick={onToggle}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className={cn(
              'mt-1 hidden w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-muted transition-colors hover:bg-white/10 hover:text-white lg:flex',
              compact && 'justify-center px-0',
            )}
          >
            {collapsed ? (
              <PanelLeftOpen className="size-[18px]" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-[18px]" aria-hidden="true" />
            )}
            {compact ? <span className="sr-only">Expand sidebar</span> : 'Collapse'}
          </button>
        )}
      </div>
    </div>
  );
}
