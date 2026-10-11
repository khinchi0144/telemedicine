import { cn } from '@/lib/utils/cn';

/**
 * Compact SVG trend line for stat cards.
 * Dependency free so it never pulls a charting library into the bundle.
 */

export interface SparkPoint {
  label: string;
  value: number;
}

export interface SparklineProps {
  data: SparkPoint[];
  className?: string;
  height?: number;
  tone?: 'teal' | 'navy' | 'success' | 'warning';
  showArea?: boolean;
  ariaLabel?: string;
}

const TONE_STROKE: Record<NonNullable<SparklineProps['tone']>, string> = {
  teal: 'var(--color-teal-600)',
  navy: 'var(--color-navy-700)',
  success: 'var(--color-success)',
  warning: 'var(--color-warning)',
};

export function Sparkline({
  data,
  className,
  height = 44,
  tone = 'teal',
  showArea = true,
  ariaLabel,
}: SparklineProps) {
  if (data.length < 2) return null;

  const width = 120;
  const max = Math.max(...data.map((point) => point.value));
  const min = Math.min(...data.map((point) => point.value));
  const range = max - min || 1;
  const step = width / (data.length - 1);

  const points = data.map((point, index) => ({
    x: index * step,
    y: height - 4 - ((point.value - min) / range) * (height - 8),
  }));

  // Smooth curve through the points (Catmull-Rom style bezier).
  const line = points.reduce((path, point, index, all) => {
    if (index === 0) return `M ${point.x} ${point.y}`;
    const previous = all[index - 1];
    const cx = (previous.x + point.x) / 2;
    return `${path} C ${cx} ${previous.y}, ${cx} ${point.y}, ${point.x} ${point.y}`;
  }, '');

  const gradientId = `spark-${tone}-${data.length}`;

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      className={cn('w-full overflow-visible', className)}
      style={{ height }}
      role="img"
      aria-label={ariaLabel ?? 'Trend chart'}
      preserveAspectRatio="none"
    >
      {showArea && (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={TONE_STROKE[tone]} stopOpacity="0.22" />
              <stop offset="100%" stopColor={TONE_STROKE[tone]} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d={`${line} L ${width} ${height} L 0 ${height} Z`}
            fill={`url(#${gradientId})`}
          />
        </>
      )}
      <path
        d={line}
        fill="none"
        stroke={TONE_STROKE[tone]}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={points[points.length - 1].x}
        cy={points[points.length - 1].y}
        r="2.75"
        fill={TONE_STROKE[tone]}
      />
    </svg>
  );
}
