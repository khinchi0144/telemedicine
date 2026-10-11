import * as React from 'react';

import { cn } from '@/lib/utils/cn';

export const Input = React.forwardRef<
  HTMLInputElement,
  React.InputHTMLAttributes<HTMLInputElement>
>(({ className, type, ...props }, ref) => (
  <input
    type={type}
    ref={ref}
    className={cn(
      'flex h-11 w-full rounded-lg border border-input bg-card px-3.5 py-2 text-[15px] text-foreground shadow-xs transition-colors',
      'file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25',
      'aria-[invalid=true]:border-destructive aria-[invalid=true]:focus-visible:ring-destructive/25',
      'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
      className,
    )}
    {...props}
  />
));
Input.displayName = 'Input';

export const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      'flex min-h-24 w-full rounded-lg border border-input bg-card px-3.5 py-2.5 text-[15px] text-foreground shadow-xs transition-colors',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/25',
      'aria-[invalid=true]:border-destructive',
      'disabled:cursor-not-allowed disabled:bg-muted disabled:opacity-70',
      className,
    )}
    {...props}
  />
));
Textarea.displayName = 'Textarea';
