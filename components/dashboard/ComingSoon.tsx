import Link from 'next/link';
import { Clock, Construction, type LucideIcon } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { APP_NAME } from '@/lib/constants/app';

export interface ComingSoonProps {
  title: string;
  description: string;
  roleLabel: string;
  icon: LucideIcon;
  status?: string | null;
  /** Summary cards describing the modules planned for the next phase. */
  planned?: { title: string; description: string }[];
  children?: React.ReactNode;
}

/**
 * Placeholder dashboard used by all four roles in this phase.
 * It shows who is signed in and the verification status, and states clearly
 * that the business modules arrive later.
 */
export function ComingSoon({
  title,
  description,
  roleLabel,
  icon: Icon,
  status,
  planned,
  children,
}: ComingSoonProps) {
  return (
    <div className="space-y-6">
      <Card className="p-6 sm:p-8">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Icon className="size-7" aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
              <Badge variant="secondary">{roleLabel}</Badge>
            </div>
            <p className="text-[15px] leading-relaxed text-muted-foreground">
              {description}
            </p>
          </div>
        </div>

        {status && status !== 'VERIFIED' && (
          <Alert variant="warning" title="Verification pending" className="mt-6">
            Your account is currently in <strong>{status.replace(/_/g, ' ').toLowerCase()}</strong>.
            Our team is reviewing your submitted details. The full dashboard
            unlocks automatically once the review is complete.
          </Alert>
        )}

        {status === 'VERIFIED' && (
          <Alert variant="success" title="Account verified" className="mt-6">
            Your professional profile has been verified. The dashboard modules
            below are being prepared.
          </Alert>
        )}

        {children}
      </Card>

      <Card className="p-6 sm:p-8">
        <div className="mb-5 flex items-center gap-2.5">
          <span className="flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Construction className="size-4" aria-hidden="true" />
          </span>
          <div>
            <h2 className="text-base font-semibold">Coming soon</h2>
            <p className="text-sm text-muted-foreground">
              These modules are planned for the next phase of {APP_NAME}.
            </p>
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {(planned ?? []).map((item) => (
            <li
              key={item.title}
              className="rounded-xl border border-dashed border-border bg-surface-muted p-4"
            >
              <div className="flex items-center gap-2">
                <Clock className="size-3.5 text-muted-foreground" aria-hidden="true" />
                <p className="text-sm font-medium">{item.title}</p>
              </div>
              <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                {item.description}
              </p>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex flex-wrap gap-2.5">
          <Button asChild variant="outline" size="sm">
            <Link href="/auth">Back to welcome</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}
