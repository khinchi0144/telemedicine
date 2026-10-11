import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

const buttonVariants = cva(
  [
    'relative inline-flex items-center justify-center gap-2 whitespace-nowrap',
    'font-medium transition-[background-color,color,box-shadow,transform] duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-55',
    'active:translate-y-px [&_svg]:pointer-events-none [&_svg]:shrink-0',
  ].join(' '),
  {
    variants: {
      variant: {
        primary: [
          'bg-primary text-primary-foreground shadow-[0_1px_2px_rgba(16,42,67,0.08)]',
          'hover:bg-[var(--primary-hover)] hover:shadow-[0_8px_22px_-8px_rgba(0,140,135,0.65)]',
        ].join(' '),
        secondary:
          'bg-secondary text-secondary-foreground border border-teal-200/70 hover:bg-teal-100',
        outline:
          'border border-input bg-card text-foreground hover:border-navy-300 hover:bg-navy-50/60 hover:text-navy-900',
        ghost: 'text-navy-600 hover:bg-navy-50 hover:text-navy-900',
        navy: 'bg-navy-900 text-white hover:bg-navy-800 shadow-[0_8px_22px_-10px_rgba(16,42,67,0.6)]',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-[#b91c1c]',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 rounded-lg px-3.5 text-[13px] [&_svg]:size-4',
        md: 'h-11 rounded-lg px-5 text-sm [&_svg]:size-4',
        lg: 'h-12 rounded-xl px-7 text-[15px] [&_svg]:size-[18px]',
        icon: 'size-11 rounded-lg [&_svg]:size-[18px]',
        'icon-sm': 'size-9 rounded-lg [&_svg]:size-4',
      },
      block: { true: 'w-full' },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  loading?: boolean;
}

export function Button({
  className,
  variant,
  size,
  block,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  // `asChild` renders a single child (usually a <Link>), so the loading
  // spinner cannot be injected without breaking the Slot contract.
  if (asChild) {
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, block }), className)}
        aria-busy={loading || undefined}
        {...props}
      >
        {children}
      </Comp>
    );
  }

  return (
    <Comp
      className={cn(buttonVariants({ variant, size, block }), className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden="true" />}
      <span>{children}</span>
    </Comp>
  );
}

export { buttonVariants };