import Link from 'next/link';

import { Logo } from '@/components/common/Logo';
import { APP_NAME } from '@/lib/constants/app';

export interface LegalSection {
  heading: string;
  body: string;
}

export interface LegalPageProps {
  title: string;
  updated: string;
  intro: string;
  sections: LegalSection[];
  footerNote?: React.ReactNode;
}

/** Shared layout for the Terms, Privacy and Support pages. */
export function LegalPage({
  title,
  updated,
  intro,
  sections,
  footerNote,
}: LegalPageProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-surface-muted">
      <header className="border-b border-border/70 bg-card/85">
        <div className="mx-auto flex h-16 w-full max-w-4xl items-center justify-between px-4 sm:px-6">
          <Logo href="/" size="sm" />
          <Link
            href="/auth"
            className="rounded-md text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Back
          </Link>
        </div>
      </header>

      <main id="main-content" className="mx-auto w-full max-w-4xl flex-1 px-4 py-10 sm:px-6">
        <article className="rounded-2xl border border-border bg-card p-6 medicare-card-shadow sm:p-10">
          <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{updated}</p>
          <p className="mt-5 text-[15px] leading-relaxed text-muted-foreground">
            {intro}
          </p>

          <div className="mt-8 space-y-6">
            {sections.map((section) => (
              <section key={section.heading} className="space-y-2">
                <h2 className="text-lg font-semibold tracking-tight">
                  {section.heading}
                </h2>
                <p className="text-[15px] leading-relaxed text-muted-foreground">
                  {section.body}
                </p>
              </section>
            ))}
          </div>

          {footerNote && (
            <p className="mt-8 border-t border-border pt-6 text-sm text-muted-foreground">
              {footerNote}
            </p>
          )}
        </article>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
      </main>
    </div>
  );
}
