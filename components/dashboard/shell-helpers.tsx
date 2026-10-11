'use client';

import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { isActive } from './SidebarLink';
import { mobileNav, ROLE_LABEL, ROLE_NAV } from '@/lib/navigation';
import type { SessionUser } from '@/types/auth';

/** Mobile bottom navigation — the four enabled workspace entries. */
export function BottomNav({
  role,
  pathname,
}: {
  role: SessionUser['role'];
  pathname: string;
}) {
  const items = mobileNav(role);
  return (
    <nav
      aria-label="Primary"
      className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur-xl lg:hidden"
    >
      <ul className="mx-auto grid max-w-lg grid-cols-4">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.label}>
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex flex-col items-center gap-1 px-1 py-2.5 text-[10px] font-semibold transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
              >
                <Icon className="size-5" aria-hidden="true" />
                <span className="max-w-full truncate">{item.short ?? item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function Breadcrumbs({ crumbs }: { crumbs: string[] }) {
  return (
    <nav aria-label="Breadcrumb" className="hidden sm:block">
      <ol className="flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
        {crumbs.map((crumb, index) => (
          <li key={crumb + index} className="flex items-center gap-1.5">
            {index > 0 && <span aria-hidden="true">/</span>}
            <span className={cn(index === crumbs.length - 1 && 'text-navy-600')}>
              {crumb}
            </span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

/** Workspace › section › page, de-duplicated and human readable. */
export function buildBreadcrumbs(
  pathname: string,
  title: string,
  role: string,
): string[] {
  const label = ROLE_LABEL[role as keyof typeof ROLE_LABEL] ?? 'Workspace';
  const segments = pathname.split('/').filter(Boolean);
  const parts = [label, ...segments.slice(1).map(prettySegment), title];
  return parts.filter((value, index) => parts.indexOf(value) === index);
}

export function prettySegment(segment: string): string {
  return segment
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

/**
 * Human heading for the current route.
 *
 * Prefers the matching navigation label so the page title always matches the
 * sidebar entry the user clicked; falls back to the last URL segment.
 */
export function titleForPath(pathname: string, role: string): string {
  const nav = ROLE_NAV[role as keyof typeof ROLE_NAV] ?? [];
  const match = nav
    .flatMap((group) => group.items)
    .find((item) => item.href === pathname);

  if (match) return match.label;

  const segments = pathname.split('/').filter(Boolean);
  const last = segments[segments.length - 1];
  return last ? prettySegment(last) : 'Overview';
}
