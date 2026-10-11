import type { LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils/cn';

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  /** Short, honest note about *why* the space is empty. */
  note?: string;
  action?: React.ReactNode;
  className?: string;
  compact?: boolean;
}

/**
 * Empty state used wherever a module has no records yet.
 *
 * It always explains what will appear there and why it is empty today, so the
 * screen never looks broken or looks like data failed to load.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  note,
  action,
  className,
  compact = false,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-surface-muted/60 text-center',
        compact ? 'px-5 py-8' : 'px-6 py-14',
        className,
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-2xl bg-card text-muted-foreground shadow-[0_2px_10px_-6px_rgba(16,42,67,0.3)]">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <h3 className="mt-4 font-display text-[15px] font-bold text-navy-900">
        {title}
      </h3>
      <p className="mt-1.5 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
        {description}
      </p>
      {note && (
        <p className="mt-3 max-w-sm rounded-lg bg-card px-3 py-2 text-[11px] leading-relaxed text-muted-foreground">
          {note}
        </p>
      )}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

/** Section wrapper that keeps a consistent title / action rhythm. */
export function Panel({
  title,
  description,
  action,
  children,
  className,
  bodyClassName,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <Card className={cn('overflow-hidden', className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border px-5 py-4">
        <div className="min-w-0">
          <h2 className="font-display text-[15px] font-bold tracking-tight text-navy-900">
            {title}
          </h2>
          {description && (
            <p className="mt-0.5 text-[13px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>
        {action}
      </div>
      <div className={cn('p-5', bodyClassName)}>{children}</div>
    </Card>
  );
}
