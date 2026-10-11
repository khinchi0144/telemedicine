import { cn } from '@/lib/utils/cn';

/** Donut with a centred summary — verification / status split. */

export interface DonutDatum {
  label: string;
  value: number;
  color: string;
}

export interface DonutChartProps {
  data: DonutDatum[];
  className?: string;
  size?: number;
  centerLabel?: string;
  centerValue?: string;
}

export function DonutChart({
  data,
  className,
  size = 148,
  centerLabel,
  centerValue,
}: DonutChartProps) {
  const total = data.reduce((sum, datum) => sum + datum.value, 0);
  const radius = size / 2 - 12;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
    >
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={centerLabel ?? 'Distribution'}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth="10"
        />
        {total > 0 &&
          data.map((datum) => {
            const dash = (datum.value / total) * circumference;
            const element = (
              <circle
                key={datum.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={datum.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                transform={`rotate(-90 ${size / 2} ${size / 2})`}
              />
            );
            offset += dash;
            return element;
          })}
      </svg>
      {(centerValue || centerLabel) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          {centerValue && (
            <span className="font-display text-2xl font-bold text-navy-900">
              {centerValue}
            </span>
          )}
          {centerLabel && (
            <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {centerLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
