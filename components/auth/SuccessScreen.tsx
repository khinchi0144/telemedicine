import { CheckCircle2, Clock, ShieldCheck, type LucideIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/cn';

export interface SuccessScreenProps {
  /** Visual style: green success (created) or amber pending (verification). */
  variant?: 'success' | 'pending';
  icon?: LucideIcon;
  title: string;
  message: string;
  /** Bullet points summarising what happens next. */
  points?: string[];
  actionLabel: string;
  actionHref?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  secondaryActionHref?: string;
  onSecondaryAction?: () => void;
  children?: React.ReactNode;
}

/**
 * Shared terminal screen for every registration wizard.
 * Uses `role="status"` so assistive technology announces the outcome.
 */
export function SuccessScreen({
  variant = 'success',
  icon,
  title,
  message,
  points,
  actionLabel,
  actionHref,
  onAction,
  secondaryActionLabel,
  secondaryActionHref,
  onSecondaryAction,
  children,
}: SuccessScreenProps) {
  const Icon = icon ?? (variant === 'success' ? CheckCircle2 : Clock);
  const tone =
    variant === 'success'
      ? 'bg-success/12 text-success ring-success/20'
      : 'bg-warning/15 text-warning ring-warning/25';

  return (
    <div role="status" className="space-y-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <span
          className={cn(
            'flex size-16 items-center justify-center rounded-2xl ring-4',
            tone,
          )}
        >
          <Icon className="size-8" strokeWidth={2} aria-hidden="true" />
        </span>
        <div className="space-y-2">
          <h2 className="text-2xl font-semibold tracking-tight">{title}</h2>
          <p className="mx-auto max-w-md text-[15px] leading-relaxed text-muted-foreground">
            {message}
          </p>
        </div>
      </div>

      {points && points.length > 0 && (
        <ul className="mx-auto max-w-md space-y-2.5 rounded-xl border border-border bg-surface-muted p-4 text-left">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-2.5 text-sm text-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              <span className="leading-relaxed">{point}</span>
            </li>
          ))}
        </ul>
      )}

      {children}

      <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
        {onAction ? (
          <Button size="lg" onClick={onAction} className="sm:min-w-52">
            {actionLabel}
          </Button>
        ) : (
          <Button size="lg" asChild className="sm:min-w-52">
            <a href={actionHref}>{actionLabel}</a>
          </Button>
        )}

        {secondaryActionLabel &&
          (onSecondaryAction ? (
            <Button size="lg" variant="outline" onClick={onSecondaryAction}>
              {secondaryActionLabel}
            </Button>
          ) : (
            <Button size="lg" variant="outline" asChild>
              <a href={secondaryActionHref}>{secondaryActionLabel}</a>
            </Button>
          ))}
      </div>
    </div>
  );
}
