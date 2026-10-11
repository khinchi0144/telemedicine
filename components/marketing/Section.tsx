import type { ReactNode } from 'react';

import { Reveal } from '@/components/motion/primitives';
import { cn } from '@/lib/utils/cn';

/**
 * Consistent section rhythm for the marketing page: the same eyebrow label,
 * heading and supporting copy everywhere, so the page never feels assembled
 * from mismatched blocks.
 */
export function Section({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  tone = 'light',
  align = 'center',
}: {
  id?: string;
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  className?: string;
  tone?: 'light' | 'muted' | 'navy';
  align?: 'center' | 'left';
}) {
  return (
    <section
      id={id}
      className={cn(
        'scroll-mt-24 py-16 sm:py-20 lg:py-24',
        tone === 'muted' && 'bg-surface-muted',
        tone === 'navy' && 'bg-navy-950 text-white',
        className,
      )}
    >
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
      {(title || eyebrow || description) && (
        <Reveal
          className={cn(
            'max-w-2xl',
            align === 'center' ? 'mx-auto text-center' : 'text-left',
          )}
        >
          {eyebrow && (
            <p
              className={cn(
                'text-xs font-bold uppercase tracking-[0.16em]',
                tone === 'navy' ? 'text-teal-300' : 'text-teal-600',
              )}
            >
              {eyebrow}
            </p>
          )}
          {title && (
            <h2
              className={cn(
                'mt-3 text-[2rem] font-extrabold leading-[1.12] tracking-[-0.03em] sm:text-[2.6rem]',
                tone === 'navy' ? 'text-white' : 'text-navy-900',
              )}
            >
              {title}
            </h2>
          )}
          {description && (
            <p
              className={cn(
                'mt-4 text-[17px] leading-relaxed',
                tone === 'navy' ? 'text-navy-200' : 'text-navy-600',
              )}
            >
              {description}
            </p>
          )}
        </Reveal>
      )}

        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

/** Section heading used where a bespoke alignment is needed. */
export function SectionHeading({
  eyebrow,
  title,
  description,
  className,
}: {
  eyebrow?: string;
  title?: ReactNode;
  description?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('max-w-2xl', className)}>
      {eyebrow && (
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-teal-600">
          {eyebrow}
        </p>
      )}
      <h2 className="mt-3 text-[2rem] font-extrabold leading-[1.12] tracking-[-0.03em] text-navy-900 sm:text-[2.6rem]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-[17px] leading-relaxed text-navy-600">{description}</p>
      )}
    </div>
  );
}