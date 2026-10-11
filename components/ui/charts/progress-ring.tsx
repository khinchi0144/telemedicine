import { cn } from '@/lib/utils/cn';

/** Circular progress — profile completeness. */

export interface ProgressRingProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  tone?: 'teal' | 'success' | 'warning' | 'navy';
  label?: string;
  className?: string;
}

const RING_TONE: Record<NonNullable<ProgressRingProps['tone']>, string> = {
  teal: 'var(--color-teal-600)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
  navy: 'var(--color-navy-700)',
};

export function ProgressRing({
  value,
  max = 100,
  size = 96,
  strokeWidth = 8,
  tone = 'teal',
  label,
  className,
}: ProgressRingProps) {
  const percent = Math.min(100, Math.max(0, (value / (max || 1)) * 100));
  const radius = size / 2 - strokeWidth / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
    >
      <svg
        width={size}
        height={size}
        role="img"
        aria-label={`${Math.round(percent)}% ${label ?? 'complete'}`}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-muted)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={RING_TONE[tone]}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={circumference - (percent / 100) * circumference}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-700 ease-[cubic-bezier(0.16,1,0.3,1)]"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="font-display text-lg font-bold text-navy-900">
          {Math.round(percent)}%
        </span>
      </div>
    </div>
  );
}
