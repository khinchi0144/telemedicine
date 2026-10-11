import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from 'lucide-react';

import { cn } from '@/lib/utils/cn';

const alertVariants = cva(
  'flex w-full gap-3 rounded-xl border p-4 text-sm [&>svg]:size-5 [&>svg]:shrink-0',
  {
    variants: {
      variant: {
        info: 'border-primary/25 bg-primary/6 text-foreground [&>svg]:text-primary',
        success: 'border-success/30 bg-success/8 text-foreground [&>svg]:text-success',
        warning: 'border-warning/35 bg-warning/10 text-foreground [&>svg]:text-warning',
        error: 'border-destructive/30 bg-destructive/8 text-foreground [&>svg]:text-destructive',
      },
    },
    defaultVariants: { variant: 'info' },
  },
);

const ICON_MAP: Record<NonNullable<AlertProps['variant']>, typeof Info> = {
  info: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  error: AlertCircle,
};

export interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  title?: string;
  /** Hide the decorative icon when the message is already prefixed. */
  hideIcon?: boolean;
}

export function Alert({
  className,
  variant = 'info',
  title,
  hideIcon,
  children,
  ...props
}: AlertProps) {
  const Icon = ICON_MAP[variant ?? 'info'];
  return (
    <div
      role={variant === 'error' ? 'alert' : 'status'}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      {!hideIcon && <Icon aria-hidden="true" />}
      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className="font-medium leading-tight">{title}</p>}
        <div className="leading-relaxed text-muted-foreground">{children}</div>
      </div>
    </div>
  );
}
