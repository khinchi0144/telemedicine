'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { CalendarPlus, Clock } from 'lucide-react';
import { toast } from 'sonner';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input, Textarea } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { cn } from '@/lib/utils/cn';

interface SlotOption {
  startTime: string;
  endTime: string;
  available: boolean;
}

function messageOf(error: unknown, fallback: string): string {
  return error instanceof ApiError ? error.message : fallback;
}

function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Inline booking flow shown on a doctor card: pick a day → pick a free 30
 * minute slot → confirm. Slots come from
 * `GET /api/patient/doctors/[id]/slots`, and the booking POST re-validates
 * the slot server side, so a stale picker can never double book.
 */
export function BookAppointmentPanel({ doctorId }: { doctorId: string }) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState('');
  const [slots, setSlots] = React.useState<SlotOption[] | null>(null);
  const [selected, setSelected] = React.useState<SlotOption | null>(null);
  const [reason, setReason] = React.useState('');
  const [loadingSlots, setLoadingSlots] = React.useState(false);
  const [booking, setBooking] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const loadSlots = async (day: string) => {
    setSelected(null);
    setSlots(null);
    if (!day) return;
    setLoadingSlots(true);
    setError(null);
    try {
      const data = await apiRequest<{ slots: SlotOption[] }>(
        `/api/patient/doctors/${doctorId}/slots?date=${day}`,
      );
      setSlots(data.slots);
    } catch (err) {
      setError(messageOf(err, 'We could not load available times.'));
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleDateChange = (value: string) => {
    setDate(value);
    void loadSlots(value);
  };

  const book = async () => {
    if (!selected || !date) return;
    setBooking(true);
    setError(null);
    try {
      await apiRequest('/api/patient/appointments', {
        method: 'POST',
        body: {
          doctorProfileId: doctorId,
          date,
          startTime: selected.startTime,
          endTime: selected.endTime,
          ...(reason.trim() ? { reason: reason.trim() } : {}),
        },
      });
      toast.success('Appointment booked', {
        description: `${date} at ${selected.startTime} — see it under My appointments.`,
      });
      setOpen(false);
      setDate('');
      setSlots(null);
      setSelected(null);
      setReason('');
      router.refresh();
    } catch (err) {
      setError(messageOf(err, 'We could not book that slot.'));
      void loadSlots(date);
    } finally {
      setBooking(false);
    }
  };

  if (!open) {
    return (
      <Button size="sm" onClick={() => setOpen(true)}>
        <CalendarPlus aria-hidden="true" />
        Book appointment
      </Button>
    );
  }

  return (
    <div className="w-full space-y-4 rounded-xl border border-border bg-surface-muted/60 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="font-display text-sm font-bold text-navy-900">
            Choose a date and time
          </p>
          <p className="text-xs text-muted-foreground">
            Appointments are 30 minutes long.
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>
          Close
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor={`book-date-${doctorId}`}>Consultation date</Label>
        <Input
          id={`book-date-${doctorId}`}
          type="date"
          min={todayIso()}
          value={date}
          onChange={(event) => handleDateChange(event.target.value)}
        />
      </div>

      {error && <Alert variant="error">{error}</Alert>}

      {loadingSlots && (
        <p className="text-sm text-muted-foreground">Loading available times…</p>
      )}

      {!loadingSlots && slots && slots.length === 0 && (
        <p className="text-sm text-muted-foreground">
          This doctor has not published availability for that day. Please try
          another date.
        </p>
      )}

      {!loadingSlots && slots && slots.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">
            Available times
          </p>
          <div className="flex flex-wrap gap-2">
            {slots.map((slot) => (
              <button
                key={slot.startTime}
                type="button"
                disabled={!slot.available}
                onClick={() => setSelected(slot)}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[13px] font-semibold transition-colors',
                  !slot.available &&
                    'cursor-not-allowed border-border bg-muted text-muted-foreground line-through opacity-70',
                  slot.available &&
                    selected?.startTime !== slot.startTime &&
                    'border-border bg-card text-navy-800 hover:border-teal-300 hover:bg-teal-50',
                  slot.available &&
                    selected?.startTime === slot.startTime &&
                    'border-primary bg-primary text-primary-foreground',
                )}
                aria-label={
                  slot.available
                    ? `Book ${slot.startTime}`
                    : `${slot.startTime} unavailable`
                }
              >
                <Clock className="size-3.5" aria-hidden="true" />
                {slot.startTime}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-1.5">
        <Label htmlFor={`book-reason-${doctorId}`}>
          Reason for visit <span className="text-muted-foreground">(optional)</span>
        </Label>
        <Textarea
          id={`book-reason-${doctorId}`}
          value={reason}
          maxLength={300}
          placeholder="e.g. recurring headaches for the past week"
          onChange={(event) => setReason(event.target.value)}
          className="min-h-16"
        />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">
          {selected
            ? `Selected: ${date} · ${selected.startTime}–${selected.endTime}`
            : 'Pick a time slot to continue.'}
        </p>
        <Button size="sm" onClick={book} loading={booking} disabled={!selected}>
          Confirm booking
        </Button>
      </div>
    </div>
  );
}