'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import type { NavItem } from '@/lib/navigation';

/** A path is active when it matches exactly or is a child route. */
export function isActive(pathname: string, href: string): boolean {
  // Section roots (e.g. /patient) only stay active on an exact match, so the
  // overview is not highlighted while a sub page is open.
  if (href.split('/').filter(Boolean).length === 1) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export interface SidebarLinkProps {
  item: NavItem;
  active: boolean;
  collapsed?: boolean;
  onNavigate?: () => void;
}

/**
 * One sidebar row.
 *
 * Modules without a backend render as a disabled control carrying a "Soon"
 * marker and a tooltip, rather than a link to a page that does not exist.
 */
export function SidebarLink({
  item,
  active,
  collapsed,
  onNavigate,
}: SidebarLinkProps) {
  const Icon = item.icon;

  const base = cn(
    'group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
    collapsed && 'justify-center px-0',
    item.comingSoon
      ? 'cursor-not-allowed text-sidebar-muted/55'
      : active
        ? 'bg-white/[0.10] text-white'
        : 'text-sidebar-foreground hover:bg-white/[0.07] hover:text-white',
  );

  if (item.comingSoon) {
    return (
      <button
        type="button"
        disabled
        aria-disabled="true"
        title={`${item.label} — not available yet`}
        className={base}
      >
        <Icon className="size-[18px] shrink-0" aria-hidden="true" />
        {collapsed ? (
          <span className="sr-only">{item.label} (not available yet)</span>
        ) : (
          <>
            <span className="flex-1 truncate text-left">{item.label}</span>
            <span className="inline-flex items-center gap-1 rounded bg-white/10 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-sidebar-muted">
              <Lock className="size-2.5" aria-hidden="true" />
              Soon
            </span>
          </>
        )}
      </button>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={base}
      title={collapsed ? item.label : undefined}
    >
      {active && (
        <span
          aria-hidden="true"
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-teal-400"
        />
      )}
      <Icon className="size-[18px] shrink-0" aria-hidden="true" />
      {collapsed ? (
        <span className="sr-only">{item.label}</span>
      ) : (
        <span className="truncate">{item.label}</span>
      )}
    </Link>
  );
}
