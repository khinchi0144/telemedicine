'use client';

import * as React from 'react';
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group';
import { Check } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

/**
 * Card style radio group — large, tappable options used for gender,
 * consultation mode and pharmacy type.
 */
export function RadioCardGroup({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>) {
  return (
    <RadioGroupPrimitive.Root
      className={cn('grid gap-2.5 sm:grid-cols-2', className)}
      {...props}
    />
  );
}

export const RadioCard = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & {
    description?: string;
  }
>(({ className, children, description, ...props }, ref) => (
  <RadioGroupPrimitive.Item
    ref={ref}
    className={cn(
      'group relative flex cursor-pointer items-start gap-3 rounded-xl border border-input bg-card p-3.5 transition-colors',
      'hover:border-primary/50 hover:bg-accent/40',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
      'data-[state=checked]:border-primary data-[state=checked]:bg-primary/6 data-[state=checked]:ring-1 data-[state=checked]:ring-primary/30',
      'aria-[disabled=true]:cursor-not-allowed aria-[disabled=true]:opacity-60',
      className,
    )}
    {...props}
  >
    <span
      className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-input bg-card transition-colors group-data-[state=checked]:border-primary group-data-[state=checked]:bg-primary"
      aria-hidden="true"
    >
      <Check className="size-3 text-primary-foreground opacity-0 transition-opacity group-data-[state=checked]:opacity-100" />
    </span>
    <span className="min-w-0 flex-1">
      <span className="block text-sm font-medium leading-tight">{children}</span>
      {description && (
        <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
          {description}
        </span>
      )}
    </span>
  </RadioGroupPrimitive.Item>
));
RadioCard.displayName = 'RadioCard';
