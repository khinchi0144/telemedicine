import Link from 'next/link';
import { Mail, Phone, ShieldCheck, MapPin } from 'lucide-react';

import { Logo } from '@/components/common/Logo';
import { APP_NAME, APP_SUPPORT_EMAIL, APP_SUPPORT_PHONE } from '@/lib/constants/app';

const COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'How it works', href: '/#how-it-works' },
      { label: 'Services', href: '/#services' },
      { label: 'Our doctors', href: '/#doctors' },
      { label: 'Pharmacy network', href: '/#pharmacies' },
    ],
  },
  {
    title: 'Account types',
    links: [
      { label: 'Register as patient', href: '/auth/register/patient' },
      { label: 'Register as doctor', href: '/auth/register/doctor' },
      { label: 'Register as pharmacy', href: '/auth/register/pharmacy' },
      { label: 'Sign in', href: '/auth/login' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms of use', href: '/terms' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Support', href: '/support' },
    ],
  },
];

/** Premium marketing footer with a navy brand block. */
export function MarketingFooter() {
  return (
    <footer className="mt-24 bg-navy-950 text-sidebar-foreground">
      <div className="mx-auto w-full max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_2fr]">
          <div className="space-y-5">
            <Logo href="/" size="md" inverted />
            <p className="max-w-sm text-sm leading-relaxed text-sidebar-muted">
              {APP_NAME} connects patients with verified healthcare professionals
              and registered pharmacies — securely, and from wherever you are.
            </p>

            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-teal-400" aria-hidden="true" />
                <span>{APP_SUPPORT_PHONE}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-teal-400" aria-hidden="true" />
                <span>{APP_SUPPORT_EMAIL}</span>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 shrink-0 text-teal-400" aria-hidden="true" />
                <span>Pan India · 9:00 – 21:00 IST</span>
              </li>
            </ul>
          </div>

          <div className="grid gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="mb-3.5 text-sm font-semibold text-white">{column.title}</h3>
                <ul className="space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-sidebar-muted transition-colors hover:text-teal-300"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-7 sm:flex-row sm:items-center">
          <p className="text-xs text-sidebar-muted">
            © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
          </p>
          <p className="flex items-center gap-2 text-xs text-sidebar-muted">
            <ShieldCheck className="size-3.5 text-teal-400" aria-hidden="true" />
            {APP_NAME} does not provide medical advice. Consult a qualified
            professional for diagnosis or treatment.
          </p>
        </div>
      </div>
    </footer>
  );
}