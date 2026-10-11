'use client';

import * as React from 'react';
import { useFormContext, useWatch } from 'react-hook-form';
import { Eye, EyeOff } from 'lucide-react';

import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils/cn';
import { FormField, useFieldAria } from './FormField';
import { usePasswordStrength } from '@/lib/hooks/use-password-strength';

export interface PasswordFieldProps {
  name: string;
  label: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  showStrength?: boolean;
  hint?: string;
  error?: string;
}

/**
 * Password input with a visibility toggle and an optional strength checklist.
 * The policy is enforced by zod on the server, this only helps the user.
 */
export function PasswordField({
  name,
  label,
  autoComplete = 'current-password',
  placeholder = 'Enter your password',
  required = true,
  showStrength = false,
  hint,
  error,
}: PasswordFieldProps) {
  const [visible, setVisible] = React.useState(false);
  const context = useFormContext();
  if (!context) {
    throw new Error(
      `PasswordField ("${name}") must be rendered inside a react-hook-form provider.`,
    );
  }

  const { register, control } = context;
  const aria = useFieldAria(name, { required });
  const value = useWatch({ control, name, defaultValue: '' }) ?? '';
  const strength = usePasswordStrength(String(value));

  return (
    <FormField
      name={name}
      label={label}
      required={required}
      description={hint}
      error={error}
    >
      <div className="relative">
        <Input
          {...register(name)}
          {...aria}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          placeholder={placeholder}
          className={cn('pr-11')}
        />
        <button
          type="button"
          onClick={() => setVisible((previous) => !previous)}
          className="absolute right-1 top-1 flex size-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          aria-label={visible ? `Hide ${label.toLowerCase()}` : `Show ${label.toLowerCase()}`}
          aria-pressed={visible}
        >
          {visible ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>

      {showStrength && value.length > 0 && (
        <div className="mt-2.5 space-y-2" aria-live="polite">
          <div className="flex items-center gap-2">
            <div className="h-1 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-300',
                  strength.barClass,
                )}
                style={{ width: `${strength.percent}%` }}
              />
            </div>
            <span className="w-20 text-right text-[11px] font-medium text-muted-foreground">
              {strength.label}
            </span>
          </div>
          <ul className="grid grid-cols-2 gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            {strength.rules.map((rule) => (
              <li
                key={rule.id}
                className={cn(
                  'flex items-center gap-1.5',
                  rule.passed && 'text-success',
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    'flex size-3.5 items-center justify-center rounded-full border text-[9px] font-bold',
                    rule.passed
                      ? 'border-success bg-success/12 text-success'
                      : 'border-border',
                  )}
                >
                  {rule.passed ? '✓' : ''}
                </span>
                {rule.label}
              </li>
            ))}
          </ul>
        </div>
      )}
    </FormField>
  );
}
