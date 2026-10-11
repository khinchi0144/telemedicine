'use client';

import { Toaster as SonnerToaster } from 'sonner';

/**
 * Global toast host.
 * Positioned top-centre on mobile, bottom-right on larger screens so it never
 * covers the primary action area of a form.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-center"
      offset={16}
      duration={4200}
      visibleToasts={3}
      closeButton
      icons={{
        success: (
          <span className="flex size-5 items-center justify-center rounded-full bg-success text-[11px] text-success-foreground">
            ✓
          </span>
        ),
        error: (
          <span className="flex size-5 items-center justify-center rounded-full bg-destructive text-[11px] text-destructive-foreground">
            !
          </span>
        ),
        warning: (
          <span className="flex size-5 items-center justify-center rounded-full bg-warning text-[11px] text-warning-foreground">
            !
          </span>
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            'group rounded-xl border border-border bg-card text-card-foreground shadow-lg text-sm',
          description: 'text-muted-foreground',
          actionButton:
            'bg-primary text-primary-foreground rounded-lg text-xs font-medium px-3 h-8',
          cancelButton:
            'bg-muted text-muted-foreground rounded-lg text-xs font-medium px-3 h-8',
          error: 'border-destructive/25',
          success: 'border-success/25',
        },
      }}
    />
  );
}