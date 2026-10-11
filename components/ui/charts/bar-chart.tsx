import { cn } from '@/lib/utils/cn';

/** Vertical bars with rounded caps — weekly activity / volume. */

export interface BarDatum {
  label: string;
  value: number;
  /** Optional per-bar override; defaults to the chart's primary colour. */
  color?: string;
}

export interface BarChartProps {
  data: BarDatum[];
  className?: string;
  format?: (value: number) => string;
  ariaLabel?: string;
  /** Bar height in px. */
  height?: number;
}

export function BarChart({
  data,
  className,
  format,
  ariaLabel,
  height = 112,
}: BarChartProps) {
  const max = Math.max(...data.map((datum) => datum.value), 1);

  return (
    <div
      className={cn('flex items-end justify-between gap-2', className)}
      role="img"
      aria-label={ariaLabel ?? 'Bar chart'}
    >
      {data.map((datum) => {
        const ratio = (datum.value / max) * 100;
        return (
          <div
            key={datum.label}
            className="flex min-w-0 flex-1 flex-col items-center gap-2"
          >
            <div
              className="flex w-full items-end justify-center"
              style={{ height: `${height}px` }}
            >
              <div
                className="w-full max-w-9 rounded-t-lg bg-gradient-to-t from-teal-600 to-teal-400 transition-[height] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
                style={{ height: `${Math.max(ratio, 4)}%` }}
                title={`${datum.label}: ${format ? format(datum.value) : datum.value}`}
              />
            </div>
            <span className="truncate text-[11px] font-medium text-muted-foreground">
              {datum.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
