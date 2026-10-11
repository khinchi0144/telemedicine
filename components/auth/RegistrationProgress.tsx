import { cn } from '@/lib/utils/cn';

/**
 * Shared progress indicator for every multi step registration wizard
 * (patient, doctor and pharmacy all render this — never a per-role copy).
 *
 * Layout strategy
 * ---------------
 * A single horizontal row of long labels cannot shrink below its content
 * width, so forcing one used to push the last steps outside the card and
 * behind the information panel. Instead of clipping the overflow (which would
 * hide content) the children are made genuinely responsive:
 *
 * - every step is `flex-1 min-w-0`, so it may shrink below its content width
 * - labels wrap (`whitespace-normal` + `break-words`) instead of `nowrap`
 * - connectors are flexed and collapse on narrow screens
 * - below `sm` the row is replaced by a compact "Step x of y" progress bar,
 *   because four or six long labels are unreadable on a phone
 *
 * `min-w-0` on every step is the part that actually prevents the overflow:
 * a flex item defaults to `min-width: auto`, which refuses to shrink.
 */
export interface ProgressStep {
  id: string;
  title: string;
  short: string;
}

export interface RegistrationProgressProps {
  steps: readonly ProgressStep[];
  /** Zero based index of the active step. */
  currentStep: number;
  className?: string;
  /** Accessible label for the progress region. */
  label?: string;
}

export function RegistrationProgress({
  steps,
  currentStep,
  className,
  label = 'Registration progress',
}: RegistrationProgressProps) {
  const safeStep = Math.max(0, Math.min(currentStep, steps.length - 1));
  const percent =
    steps.length > 1 ? (safeStep / (steps.length - 1)) * 100 : 100;
  const current = steps[safeStep];
  const next = steps[safeStep + 1];

  /**
   * Five or more steps (doctor, pharmacy) cannot show full labels on a
   * tablet-width card without truncating them, so those wizards keep the
   * compact "Step x of y" view until extra-wide.
   */
  const dense = steps.length >= 5;
  const compactHidden = dense ? 'xl:hidden' : 'sm:hidden';
  const fullShown = dense ? 'xl:flex' : 'sm:flex';

  return (
    <nav aria-label={label} className={cn('w-full min-w-0', className)}>
      {/* Compact UI on phones: no four/six long labels squeezed into one row. */}
      <div className={cn('min-w-0', compactHidden)}>
        <div className="mb-2 flex items-baseline justify-between gap-3">
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            Step {safeStep + 1} of {steps.length}
          </span>
          <span className="min-w-0 text-right text-sm font-semibold text-foreground">
            {current?.title}
          </span>
        </div>
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-muted"
          role="progressbar"
          aria-valuemin={1}
          aria-valuemax={steps.length}
          aria-valuenow={safeStep + 1}
          aria-label={`${label}: step ${safeStep + 1} of ${steps.length}`}
        >
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            style={{ width: `${percent}%` }}
          />
        </div>
        {next && (
          <p className="mt-2 text-xs text-muted-foreground">
            Next: <span className="font-medium text-foreground">{next.title}</span>
          </p>
        )}
      </div>

      {/* Tablet and up: full numbered stepper that stays inside the card. */}
      <ol className={cn('hidden w-full min-w-0 items-stretch', fullShown)}>
        {steps.map((step, index) => {
          const isComplete = index < safeStep;
          const isCurrent = index === safeStep;
          const isLast = index === steps.length - 1;

          return (
            <li
              key={step.id}
              className={cn(
                'flex min-w-0 items-center gap-2',
                // Every step shares the row equally; `min-w-0` lets it shrink.
                !isLast && 'flex-1',
                isLast && 'shrink-0',
              )}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span
                  aria-current={isCurrent ? 'step' : undefined}
                  className={cn(
                    'flex size-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold tabular-nums transition-colors sm:size-8 sm:text-xs',
                    isComplete && 'border-primary bg-primary text-primary-foreground',
                    isCurrent && 'border-primary bg-card text-primary ring-2 ring-primary/20',
                    !isComplete && !isCurrent && 'border-border bg-card text-muted-foreground',
                  )}
                >
                  {index + 1}
                </span>
                <span
                  className={cn(
                    // Wrapping (not `whitespace-nowrap`) is what keeps the
                    // stepper inside its parent at every viewport width.
                    'min-w-0 break-words text-xs font-medium leading-tight sm:text-[13px] lg:text-sm',
                    isCurrent
                      ? 'text-foreground'
                      : isComplete
                        ? 'text-primary'
                        : 'text-muted-foreground',
                  )}
                >
                  {step.title}
                </span>
              </div>

              {!isLast && (
                <span
                  aria-hidden="true"
                  className={cn(
                    'mx-1 h-px min-w-2 flex-1 transition-colors sm:mx-2',
                    isComplete ? 'bg-primary/40' : 'bg-border',
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}