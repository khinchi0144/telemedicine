import type { LucideIcon } from 'lucide-react';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Sparkline, type SparkPoint } from '@/components/ui/charts';
import { cn } from '@/lib/utils/cn';

export interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  /** Percentage change; omit when there is nothing to compare against. */
  delta?: number;
  deltaLabel?: string;
  hint?: string;
  trend?: SparkPoint[];
  tone?: 'teal' | 'navy' | 'success' | 'warning';
  className?: string;
}

/** KPI tile used across every dashboard overview. */
export function StatCard({
  label,
  value,
  icon: Icon,
  delta,
  deltaLabel,
  hint,
  trend,
  tone = 'teal',
  className,
}: StatCardProps) {
  const toneStyles: Record<NonNullable<StatCardProps['tone']>, string> = {
    teal: 'bg-teal-50 text-teal-700',
    navy: 'bg-navy-50 text-navy-700',
    success: 'bg-success/10 text-[#0b7a3d]',
    warning: 'bg-warning/10 text-[#9a5b04]',
  };

  const positive = (delta ?? 0) >= 0;

  return (
    <Card interactive className={cn('p-5', className)}>
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            'flex size-10 items-center justify-center rounded-xl',
            toneStyles[tone],
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        {typeof delta === 'number' && (
          <span
            className={cn(
              'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold',
              positive
                ? 'bg-success/10 text-[#0b7a3d]'
                : 'bg-destructive/10 text-destructive',
            )}
          >
            {positive ? (
              <ArrowUpRight className="size-3" aria-hidden="true" />
            ) : (
              <ArrowDownRight className="size-3" aria-hidden="true" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
      </div>

      <p className="mt-4 font-display text-[26px] font-extrabold leading-none tracking-tight text-navy-900">
        {value}
      </p>
      <p className="mt-1.5 text-[13px] font-medium text-navy-600">{label}</p>
      {(hint || deltaLabel) && (
        <p className="mt-0.5 text-xs text-muted-foreground">{hint ?? deltaLabel}</p>
      )}

      {trend && trend.length > 1 && (
        <div className="mt-4">
          <Sparkline data={trend} tone={tone} height={36} />
        </div>
      )}
    </Card>
  );
}
