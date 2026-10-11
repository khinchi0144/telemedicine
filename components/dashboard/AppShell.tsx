'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Menu, Search } from 'lucide-react';

import { Sidebar } from './Sidebar';
import {
  BottomNav,
  Breadcrumbs,
  buildBreadcrumbs,
  titleForPath,
} from './shell-helpers';
import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';
import { ROLE_LABEL } from '@/lib/navigation';
import type { SessionUser } from '@/types/auth';

export interface AppShellProps {
  user: SessionUser;
  children: React.ReactNode;
  /** Optional override; by default the heading comes from the active route. */
  title?: string;
  subtitle?: string;
}

/**
 * Dashboard shell: fixed collapsible sidebar on desktop, drawer + bottom
 * navigation on mobile. Shared by all four workspaces so the chrome never
 * drifts between roles.
 */
export function AppShell({ user, children, title, subtitle }: AppShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = React.useState(false);
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  // Track the route the drawer was opened on, so it closes on navigation
  // without an effect that synchronises state during render.
  const [openedAt, setOpenedAt] = React.useState(pathname);

  const drawerVisible = drawerOpen && openedAt === pathname;

  const heading = title ?? titleForPath(pathname, user.role);
  const crumbs = buildBreadcrumbs(pathname, heading, user.role);

  const openDrawer = () => {
    setOpenedAt(pathname);
    setDrawerOpen(true);
  };

  return (
    <div className="min-h-dvh bg-background">
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-40 hidden shrink-0 transition-[width] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] lg:block',
          collapsed ? 'w-[76px]' : 'w-[264px]',
        )}
      >
        <Sidebar
          user={user}
          collapsed={collapsed}
          onToggle={() => setCollapsed((value) => !value)}
        />
      </aside>

      <AnimatePresence>
        {drawerVisible && (
          <>
            <motion.button
              type="button"
              aria-label="Close navigation"
              className="fixed inset-0 z-40 bg-navy-950/45 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 w-[278px] max-w-[85vw] shadow-2xl lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            >
              <Sidebar
                user={user}
                collapsed={false}
                variant="drawer"
                onToggle={() => {}}
                onNavigate={() => setDrawerOpen(false)}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <div
        className={cn(
          'flex min-h-dvh flex-col transition-[padding] duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]',
          collapsed ? 'lg:pl-[76px]' : 'lg:pl-[264px]',
        )}
      >
        <Topbar
          user={user}
          crumbs={crumbs}
          onOpenNav={openDrawer}
          title={heading}
          subtitle={subtitle}
        />

        <main
          id="main-content"
          className="flex-1 px-4 py-6 pb-28 sm:px-6 sm:py-8 lg:pb-10"
        >
          {children}
        </main>

        <BottomNav role={user.role} pathname={pathname} />
      </div>
    </div>
  );

}

function Topbar({
  user,
  title,
  crumbs,
  subtitle,
  onOpenNav,
}: {
  user: SessionUser;
  title: string;
  crumbs: string[];
  subtitle?: string;
  onOpenNav: () => void;
}) {
  return (
    <header className="sticky top-0 z-30 border-b border-border/80 bg-card/85 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button
          variant="ghost"
          size="icon-sm"
          className="lg:hidden"
          onClick={onOpenNav}
          aria-label="Open navigation"
        >
          <Menu aria-hidden="true" />
        </Button>

        <Logo href="/" size="sm" showText={false} className="lg:hidden" />

        <div className="min-w-0 flex-1">
          <Breadcrumbs crumbs={crumbs} />
          <h1 className="truncate font-display text-[17px] font-bold tracking-tight text-navy-900">
            {title}
          </h1>
        </div>

        <button
          type="button"
          className="hidden h-9 w-64 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm text-muted-foreground transition-colors hover:border-navy-300 md:flex"
          aria-label="Search — coming soon"
          title="Search (coming soon)"
        >
          <Search className="size-4" aria-hidden="true" />
          Search…
        </button>

        <button
          type="button"
          className="relative flex size-9 items-center justify-center rounded-lg border border-input bg-card text-navy-600 transition-colors hover:border-navy-300 hover:text-navy-900"
          aria-label="Notifications — none yet"
          title="Notifications"
        >
          <Bell className="size-4" aria-hidden="true" />
          <span className="absolute right-2 top-2 size-1.5 rounded-full bg-teal-500" />
        </button>

        <span className="hidden rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-xs font-semibold text-navy-700 sm:inline">
          {ROLE_LABEL[user.role]}
        </span>
      </div>

      {subtitle && (
        <p className="border-t border-border/60 bg-surface-muted/60 px-4 py-2 text-xs text-muted-foreground sm:px-6">
          {subtitle}
        </p>
      )}
    </header>
  );
}

