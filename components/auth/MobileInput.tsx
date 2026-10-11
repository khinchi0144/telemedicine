'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { fieldAria } from './FormField';
import { useFormContext } from 'react-hook-form';
import { Phone } from 'lucide-react';

export interface MobileInputProps {
  /** Field name when used inside react-hook-form. */
  name?: string;
  value?: string;
  onChange?: (value: string) => void;
  label?: string;
  required?: boolean;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  error?: string;
}

/**
 * Indian mobile number input with a fixed +91 prefix.
 * Works both standalone (login page) and inside react-hook-form.
 */
export function MobileInput({
  name,
  value,
  onChange,
  label = 'Mobile number',
  required = true,
  placeholder = '98765 43210',
  className,
  disabled,
  error,
}: MobileInputProps) {
  const context = useFormContext();
  const fieldName = name ?? 'mobile';
  const aria = fieldAria(fieldName, { required });

  const fieldState = context
    ? context.getFieldState(fieldName, { errors: context.formState.errors } as never)
    : null;
  const invalid = error ? true : (fieldState?.invalid ?? false);

  const registration = context?.register(fieldName) ?? {};

  return (
    <div className="space-y-1.5">
      <label
        htmlFor={aria.id}
        className="block text-[13.5px] font-medium leading-none text-foreground"
      >
        {label}
        {required && (
          <span className="ml-0.5 text-destructive" aria-hidden="true">
            *
          </span>
        )}
      </label>

      <div
        className={cn(
          'flex items-stretch overflow-hidden rounded-lg border border-input bg-card shadow-xs transition-colors',
          'focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/25',
          invalid && 'border-destructive',
          disabled && 'bg-muted opacity-70',
          className,
        )}
      >
        <span className="flex select-none items-center gap-1.5 border-r border-input bg-muted/60 px-3 text-sm font-medium text-muted-foreground">
          <Phone className="size-3.5" aria-hidden="true" />
          +91
        </span>
        <Input
          {...registration}
          {...(value !== undefined
            ? {
                value,
                onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
                  onChange?.(event.target.value),
              }
            : {})}
          id={aria.id}
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          maxLength={11}
          placeholder={placeholder}
          disabled={disabled}
          aria-label="Mobile number without country code"
          aria-invalid={invalid || undefined}
          className="h-11 flex-1 border-0 bg-transparent shadow-none focus-visible:border-0 focus-visible:ring-0"
        />
      </div>

      {(error || (fieldState?.error?.message as string | undefined)) && (
        <p
          id={`field-${fieldName}-error`}
          role="alert"
          className="text-[13px] font-medium text-destructive"
        >
          {error ?? (fieldState?.error?.message as string)}
        </p>
      )}
    </div>
  );
}

