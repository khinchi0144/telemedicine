'use client';

import * as React from 'react';
import { cn } from '@/lib/utils/cn';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
  className?: string;
  'aria-describedby'?: string;
  'aria-label'?: string;
}

/**
 * Six separate OTP boxes.
 *
 * - digits only
 * - auto advances, backspace moves back
 * - pasting a full code fills every box
 * - arrow keys move between boxes
 * - fully keyboard and screen reader accessible
 */
export function OTPInput({
  length = 6,
  value,
  onChange,
  onComplete,
  disabled,
  invalid,
  autoFocus,
  className,
  ...aria
}: OTPInputProps) {
  const inputs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, ' ').slice(0, length).split('');

  const focusAt = React.useCallback(
    (index: number) => {
      const target = inputs.current[index];
      if (target) {
        target.focus();
        target.select?.();
      }
    },
    [],
  );

  const commit = (next: string) => {
    onChange(next);
    if (next.length === length) onComplete?.(next);
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, '').slice(-1);
    if (!digit) return;
    const chars = value.padEnd(length, ' ').split('');
    chars[index] = digit;
    const next = chars.join('').replace(/\s/g, '').slice(0, length);
    commit(next);
    if (index < length - 1) focusAt(index + 1);
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const chars = value.padEnd(length, ' ').split('');
      if (chars[index] && chars[index] !== ' ') {
        chars[index] = ' ';
        onChange(chars.join('').replace(/\s/g, '').slice(0, length));
      } else if (index > 0) {
        chars[index - 1] = ' ';
        onChange(chars.join('').replace(/\s/g, '').slice(0, length));
        focusAt(index - 1);
      }
      return;
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      focusAt(index - 1);
    }
    if (event.key === 'ArrowRight' && index < length - 1) {
      event.preventDefault();
      focusAt(index + 1);
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const pasted = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    if (!pasted) return;
    commit(pasted);
    focusAt(Math.min(pasted.length, length - 1));
  };

  return (
    <div
      className={cn('flex items-center justify-center gap-2 sm:gap-2.5', className)}
      role="group"
      aria-label={aria['aria-label'] ?? 'Enter the verification code'}
      aria-describedby={aria['aria-describedby']}
    >
      {Array.from({ length }).map((_, index) => {
        const char = digits[index] === ' ' ? '' : digits[index];
        return (
          <input
            key={index}
            ref={(element) => {
              inputs.current[index] = element;
            }}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            maxLength={1}
            value={char}
            disabled={disabled}
            autoFocus={autoFocus && index === 0}
            aria-label={`Digit ${index + 1} of ${length}`}
            aria-invalid={invalid || undefined}
            onChange={(event) => handleChange(index, event.target.value)}
            onKeyDown={(event) => handleKeyDown(index, event)}
            onPaste={handlePaste}
            onFocus={(event) => event.currentTarget.select()}
            className={cn(
              'h-14 w-12 rounded-xl border bg-card text-center text-xl font-semibold tabular-nums text-foreground shadow-xs transition-colors sm:h-16 sm:w-14 sm:text-2xl',
              'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25',
              'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
              invalid ? 'border-destructive' : 'border-input',
              char ? 'border-primary/50' : undefined,
            )}
          />
        );
      })}
    </div>
  );
}
