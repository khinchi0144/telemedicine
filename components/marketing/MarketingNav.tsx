'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { ArrowRight, LayoutDashboard, LogIn, Menu, X } from 'lucide-react';

import { Logo } from '@/components/common/Logo';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

const NAV_LINKS = [
  { href: '/#services', label: 'Services' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#doctors', label: 'Doctors' },
  { href: '/#pharmacies', label: 'Pharmacies' },
  { href: '/#faq', label: 'FAQ' },
];

export interface MarketingNavProps {
  /** Signed-in users get a shortcut straight to their workspace. */
  dashboardHref?: string;
}

/**
 * Sticky marketing navigation.
 * Transparent over the hero, frosted once the user scrolls.
 */
export function MarketingNav({ dashboardHref }: MarketingNavProps) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [scrolled, setScrolled] = React.useState(false);
  const [menuOpen, setMenuOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Track the route the menu was opened on, so it closes on navigation
  // without an effect that synchronises state during render.
  const [openedAt, setOpenedAt] = React.useState(pathname);
  const open = openedAt === pathname && menuOpen;
  const setOpen = (value: boolean) => {
    setMenuOpen(value);
    if (value) setOpenedAt(pathname);
  };

  return (
    <header
      className={cn(
        'fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow,border-color] duration-300',
        scrolled || open
          ? 'border-b border-border/70 glass shadow-[0_1px_0_rgba(16,42,67,0.04)]'
          : 'border-b border-transparent bg-transparent',
      )}
    >
      <nav
        aria-label="Main"
        className="mx-auto flex h-[72px] w-full max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8"
      >
        <Logo href="/" size="sm" />

        <ul className="hidden items-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="relative rounded-lg px-3.5 py-2 text-sm font-medium text-navy-600 transition-colors hover:text-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="hidden items-center gap-2.5 lg:flex">
          {dashboardHref ? (
            <Button asChild variant="ghost" size="sm">
              <Link href={dashboardHref}>
                <LayoutDashboard aria-hidden="true" />
                Dashboard
              </Link>
            </Button>
          ) : null}
          <Button asChild variant="ghost" size="sm">
            <Link href="/auth/login">
              <LogIn aria-hidden="true" />
              Sign in
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/auth/register">
              Get started
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg border border-border bg-card text-navy-800 lg:hidden"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={reduce ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={reduce ? undefined : { height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden border-t border-border/70 lg:hidden"
          >
            <div className="space-y-1 px-4 py-4 sm:px-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-navy-700 hover:bg-navy-50"
                >
                  {link.label}
                </Link>
              ))}
              <div className="grid grid-cols-2 gap-2.5 pt-3">
                {dashboardHref ? (
                  <Button asChild variant="outline">
                    <Link href={dashboardHref}>Dashboard</Link>
                  </Button>
                ) : null}
                <Button asChild variant="outline">
                  <Link href="/auth/login">Sign in</Link>
                </Button>
                <Button asChild className={cn(dashboardHref && 'col-span-2')}>
                  <Link href="/auth/register">Create an account</Link>
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}