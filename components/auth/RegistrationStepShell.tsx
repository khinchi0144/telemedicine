'use client';

import { ArrowLeft } from 'lucide-react';
import { FormProvider, type UseFormReturn } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { RegistrationProgress, type ProgressStep } from './RegistrationProgress';
import { cn } from '@/lib/utils/cn';

export interface RegistrationStepShellProps {
  steps: readonly ProgressStep[];
  currentStep: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  /**
   * When provided the step content is wrapped in a react-hook-form provider,
   * so the shared field components can read the form state.
   */
  form?: UseFormReturn<Record<string, unknown>>;
  onBack?: () => void;
  backLabel?: string;
  submitLabel?: string;
  onSubmit?: () => void | Promise<void>;
  loading?: boolean;
  submitDisabled?: boolean;
  error?: string | null;
  /** Sticky action bar on mobile, inline on desktop. */
  stickyActions?: boolean;
  footerNote?: React.ReactNode;
  className?: string;
}

/**
 * The frame every registration step renders into: progress indicator, title,
 * description, inline error and the Back / Continue action bar.
 * The action bar is sticky on mobile so it is always reachable with a thumb.
 */
export function RegistrationStepShell({
  steps,
  currentStep,
  title,
  description,
  children,
  form,
  onBack,
  backLabel = 'Back',
  submitLabel = 'Continue',
  onSubmit,
  loading = false,
  submitDisabled = false,
  error,
  stickyActions = true,
  footerNote,
  className,
}: RegistrationStepShellProps) {
  return (
    <form
      className="flex min-h-0 flex-1 flex-col"
      onSubmit={(event) => {
        event.preventDefault();
        void onSubmit?.();
      }}
    >
      <div className={cn('min-w-0 space-y-6', className)}>
        <RegistrationProgress steps={steps} currentStep={currentStep} />

        <div className="space-y-1.5">
          <h2 className="text-xl font-semibold tracking-tight sm:text-2xl">{title}</h2>
          {description && (
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          )}
        </div>

        {error && <Alert variant="error">{error}</Alert>}

        <div className="space-y-5">
          {form ? <FormProvider {...form}>{children}</FormProvider> : children}
        </div>
      </div>

      <div
        className={cn(
          'mt-8 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-between',
          stickyActions &&
            'medicare-safe-bottom sticky bottom-0 -mx-6 mt-auto border-t border-border bg-card/95 px-6 py-4 backdrop-blur sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none',
        )}
      >
        {onBack ? (
          <Button
            type="button"
            variant="ghost"
            onClick={onBack}
            disabled={loading}
            className="sm:mr-auto"
          >
            <ArrowLeft aria-hidden="true" />
            {backLabel}
          </Button>
        ) : (
          <span className="hidden sm:block" />
        )}

        <Button
          type="submit"
          size="lg"
          loading={loading}
          disabled={submitDisabled}
          className="w-full sm:w-auto sm:min-w-48"
        >
          {submitLabel}
        </Button>

        {footerNote && (
          <p className="w-full text-center text-xs text-muted-foreground sm:w-auto">
            {footerNote}
          </p>
        )}
      </div>
    </form>
  );
}
