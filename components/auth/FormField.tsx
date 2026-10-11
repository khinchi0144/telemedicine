'use client';

import * as React from 'react';
import { useFormContext } from 'react-hook-form';
import { AlertCircle } from 'lucide-react';

import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils/cn';

/**
 * Accessible form field wrapper.
 *
 * Renders the label, the optional / required hint, the description and the
 * inline error message, and keeps the ids stable so every control can wire up
 * `aria-describedby` through `fieldAria()`.
 */
export interface FormFieldProps {
  /** react-hook-form field name (also used to build stable ids). */
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  optional?: boolean;
  className?: string;
  /**
   * Error message for controlled steps that do not use react-hook-form.
   * When omitted the message is read from the form context instead.
   */
  error?: string;
  children: React.ReactNode;
}

/** Stable ids so the control and its message stay linked. */
export function fieldAria(name: string, options?: { required?: boolean }) {
  return {
    id: `field-${name}`,
    name,
    'aria-describedby': `field-${name}-error`,
    'aria-required': options?.required || undefined,
  } as const;
}

/**
 * ARIA attributes for a control inside a <FormField>.
 *
 * Works both inside a react-hook-form provider (where the field state is
 * known) and on its own, so the same helper can be used by the multi step
 * wizards and by standalone forms.
 */
export function useFieldAria(name: string, options?: { required?: boolean }) {
  const context = useFormContext();
  const base = {
    id: `field-${name}`,
    name,
    'aria-describedby': `field-${name}-error`,
    'aria-required': options?.required || undefined,
  } as const;

  if (!context) return base;

  const {
    getFieldState,
    formState: { errors },
  } = context;
  const fieldState = getFieldState(name, { errors } as never);

  return {
    ...base,
    'aria-invalid': fieldState.invalid || undefined,
    'aria-describedby': fieldState.invalid ? `field-${name}-error` : undefined,
  } as const;
}

export function FormField({
  name,
  label,
  description,
  required,
  optional,
  className,
  error: errorProp,
  children,
}: FormFieldProps) {
  // Controlled steps (e.g. the optional health information) render fields
  // without a react-hook-form provider, so the context is optional here.
  const context = useFormContext();
  const formError = context
    ? ((context.getFieldState(name, {
        errors: context.formState.errors,
      } as never).error?.message as string | undefined) ?? undefined)
    : undefined;
  const error = errorProp ?? formError;

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between gap-3">
        <Label htmlFor={`field-${name}`} className="text-[13.5px]">
          {label}
          {required && (
            <span className="ml-0.5 text-destructive" aria-hidden="true">
              *
            </span>
          )}
        </Label>
        {optional && (
          <span className="shrink-0 text-xs font-medium text-muted-foreground">
            Optional
          </span>
        )}
      </div>

      {description && (
        <p
          id={`field-${name}-description`}
          className="text-xs leading-relaxed text-muted-foreground"
        >
          {description}
        </p>
      )}

      {children}

      {/*
        The error node is always rendered so `aria-describedby` always points
        at a real element; it is visually hidden when there is no error.
      */}
      <p
        id={`field-${name}-error`}
        role="alert"
        className={cn(
          'flex items-start gap-1.5 text-[13px] font-medium text-destructive',
          !error && 'sr-only',
        )}
      >
        {error && <AlertCircle className="mt-px size-3.5 shrink-0" aria-hidden="true" />}
        {error}
      </p>
    </div>
  );
}
