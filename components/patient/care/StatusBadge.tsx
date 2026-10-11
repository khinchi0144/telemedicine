'use client';

import { Badge } from '@/components/ui/badge';
import { humanizeStatus } from '@/lib/utils/format';

type Tone = 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'info';

const APPOINTMENT_TONES: Record<string, Tone> = {
  REQUESTED: 'warning',
  CONFIRMED: 'success',
  CANCELLED: 'destructive',
  COMPLETED: 'secondary',
  NO_SHOW: 'warning',
};

const ORDER_TONES: Record<string, Tone> = {
  PLACED: 'info',
  CONFIRMED: 'info',
  PACKED: 'info',
  SHIPPED: 'warning',
  DELIVERED: 'success',
  CANCELLED: 'destructive',
};

const PRESCRIPTION_TONES: Record<string, Tone> = {
  ACTIVE: 'default',
  COMPLETED: 'secondary',
  CANCELLED: 'destructive',
};

function tone(map: Record<string, Tone>, status: string): Tone {
  return map[status] ?? 'secondary';
}

/** Lifecycle badge for an appointment row. */
export function AppointmentStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={tone(APPOINTMENT_TONES, status)}>{humanizeStatus(status)}</Badge>
  );
}

/** Lifecycle badge for a pharmacy order. */
export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge variant={tone(ORDER_TONES, status)}>{humanizeStatus(status)}</Badge>;
}

/** Lifecycle badge for a prescription. */
export function PrescriptionStatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={tone(PRESCRIPTION_TONES, status)}>{humanizeStatus(status)}</Badge>
  );
}