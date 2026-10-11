import Link from 'next/link';
import { cn } from '@/lib/utils/cn';
import { APP_NAME } from '@/lib/constants/app';

export interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  href?: string;
  textClassName?: string;
  /** Renders the mark on a dark surface (sidebar, footer). */
  inverted?: boolean;
}

const MARK_SIZE = {
  sm: 'size-9',
  md: 'size-10',
  lg: 'size-12',
  xl: 'size-14',
} as const;

const TEXT_SIZE = {
  sm: 'text-[17px]',
  md: 'text-xl',
  lg: 'text-2xl',
  xl: 'text-[28px]',
} as const;

/**
 * MediCare logo — a heart-pulse mark inside a teal gradient tile.
 *
 * The mark is drawn inline (no image request) so it stays crisp on any
 * density and inherits the current text colour.
 */
export function Logo({
  className,
  showText = true,
  size = 'md',
  href,
  textClassName,
  inverted = false,
}: LogoProps) {
  const content = (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <span
        className={cn(
          'relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl',
          'bg-gradient-to-br from-teal-500 to-teal-700 shadow-[0_6px_16px_-8px_rgba(0,140,135,0.9)]',
          MARK_SIZE[size],
        )}
        aria-hidden="true"
      >
        {/* soft highlight */}
        <span className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.45),transparent_58%)]" />
        <svg
          viewBox="0 0 24 24"
          fill="none"
          className="relative size-[58%] text-white"
        >
          <path
            d="M12 20.5s-7.5-4.6-7.5-9.6A4.4 4.4 0 0 1 12 8.2a4.4 4.4 0 0 1 7.5 2.7c0 5-7.5 9.6-7.5 9.6Z"
            stroke="currentColor"
            strokeWidth="1.9"
            strokeLinejoin="round"
          />
          <path
            d="M5.6 12.6h3l1.3-2.4 2 4.6 1.5-3.1 1.1 1.9h3.4"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>

      {showText && (
        <span className="flex flex-col leading-none">
          <span
            className={cn(
              'font-display font-extrabold tracking-[-0.03em]',
              TEXT_SIZE[size],
              inverted ? 'text-white' : 'text-navy-900',
              textClassName,
            )}
          >
            Medi<span className="text-primary">Care</span>
          </span>
          {size === 'lg' || size === 'xl' ? (
            <span
              className={cn(
                'mt-1 text-[11px] font-semibold uppercase tracking-[0.18em]',
                inverted ? 'text-sidebar-muted' : 'text-teal-600',
              )}
            >
              {APP_TAGLINE_SHORT}
            </span>
          ) : null}
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label={`${APP_NAME} home`} className="rounded-lg">
      {content}
    </Link>
  );
}

const APP_TAGLINE_SHORT = 'Your Health, Our Priority';
