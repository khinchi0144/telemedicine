import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils/cn';

const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide transition-colors',
  {
    variants: {
      variant: {
        default: 'border-teal-200/70 bg-teal-50 text-teal-800',
        secondary: 'border-navy-200/70 bg-navy-50 text-navy-700',
        outline: 'border-border bg-transparent text-navy-600',
        success: 'border-success/25 bg-success/10 text-[#0b7a3d]',
        warning: 'border-warning/25 bg-warning/10 text-[#9a5b04]',
        destructive: 'border-destructive/25 bg-destructive/10 text-destructive',
        info: 'border-info/25 bg-info/10 text-info',
        muted: 'border-transparent bg-muted text-muted-foreground',
        navy: 'border-transparent bg-navy-900 text-white',
      },
      size: {
        sm: 'px-2 py-0 text-[10px]',
        md: '',
      },
    },
    defaultVariants: { variant: 'default', size: 'md' },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, size, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />;
}

export { badgeVariants };