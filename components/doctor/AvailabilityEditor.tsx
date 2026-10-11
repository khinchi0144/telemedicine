'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useFieldArray, useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Clock, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { Alert } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils/cn';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { WEEK_DAY_OPTIONS } from '@/lib/constants/options';
import {
  doctorAvailabilitySchema,
  type DoctorAvailabilitySlotInput,
  type DoctorAvailabilityValues,
} from '@/lib/validations/doctor';

interface SavedSlot {
  day: string;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
}

function nextFreeDay(fields: { day: string }[]): DoctorAvailabilitySlotInput['day'] {
  const taken = new Set(fields.map((field) => field.day));
  const free = WEEK_DAY_OPTIONS.find((option) => !taken.has(option.value));
  return (free?.value ?? 'MONDAY') as DoctorAvailabilitySlotInput['day'];
}


type SlotErrors = Array<{
  startTime?: { message?: string };
  endTime?: { message?: string };
  day?: { message?: string };
  message?: string;
}>;

function slotError(
  errors: { availability?: unknown },
  index: number,
  key: 'startTime' | 'endTime' | 'day',
): string | undefined {
  const list = errors.availability as SlotErrors | undefined;
  const slot = list?.[index];
  if (key === 'startTime') return slot?.startTime?.message ?? slot?.message;
  return slot?.[key]?.message;
}

function DayRow({
  index,
  day,
  isEnabled,
  startTime,
  endTime,
  startError,
  endError,
  onToggle,
  onStart,
  onEnd,
  onRemove,
}: {
  index: number;
  day: string;
  isEnabled: boolean;
  startTime: string;
  endTime: string;
  startError?: string;
  endError?: string;
  onToggle: (checked: boolean) => void;
  onStart: (value: string) => void;
  onEnd: (value: string) => void;
  onRemove: () => void;
}) {
  const dayMeta = WEEK_DAY_OPTIONS.find((option) => option.value === day);
  return (
    <li
      className={cn(
        'rounded-xl border border-border bg-card p-3.5 transition-colors',
        isEnabled && 'border-primary/35 bg-accent/30',
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Switch
            id={`availability-${index}`}
            checked={isEnabled}
            onCheckedChange={onToggle}
            aria-label={`Consult on ${dayMeta?.label ?? day}`}
          />
          <label
            htmlFor={`availability-${index}`}
            className="text-sm font-medium text-navy-900"
          >
            {dayMeta?.label ?? day}
          </label>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onRemove}
          aria-label={`Remove ${dayMeta?.label ?? day}`}
        >
          <Trash2 aria-hidden="true" />
          Remove
        </Button>
      </div>
      {isEnabled && (
        <div className="mt-3 flex flex-wrap items-end gap-3 pl-11">
          <div>
            <label
              htmlFor={`start-${index}`}
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              From
            </label>
            <Input
              id={`start-${index}`}
              type="time"
              step={900}
              className="w-[132px]"
              value={startTime}
              onChange={(event) => onStart(event.target.value)}
              aria-invalid={Boolean(startError) || undefined}
            />
          </div>
          <div>
            <label
              htmlFor={`end-${index}`}
              className="mb-1 block text-xs font-medium text-muted-foreground"
            >
              To
            </label>
            <Input
              id={`end-${index}`}
              type="time"
              step={900}
              className="w-[132px]"
              value={endTime}
              onChange={(event) => onEnd(event.target.value)}
              aria-invalid={Boolean(endError) || undefined}
            />
          </div>
        </div>
      )}
      {(startError || endError) && (
        <p className="mt-2 pl-11 text-xs text-destructive">
          {startError ?? endError}
        </p>
      )}
    </li>
  );
}


/**
 * Weekly availability editor.
 *
 * Seeded with the saved week from the server; starts empty when nothing is
 * saved yet. Validation runs through the shared `doctorAvailabilitySchema`,
 * so duplicate days, bad times, and end-times not later than start-times are
 * rejected before the PUT.
 */
export function AvailabilityEditor({ initial }: { initial: SavedSlot[] }) {
  const router = useRouter();
  const [serverError, setServerError] = React.useState<string | null>(null);

  const form = useForm<{ availability: DoctorAvailabilityValues }>({
    resolver: zodResolver(z.object({ availability: doctorAvailabilitySchema })),
    defaultValues: {
      availability:
        initial.length > 0
          ? initial.map((slot) => ({
              day: slot.day as DoctorAvailabilitySlotInput['day'],
              isEnabled: slot.isEnabled,
              startTime: slot.startTime,
              endTime: slot.endTime,
            }))
          : [],
    },
  });

  const { fields, append, update, remove } = useFieldArray({
    control: form.control,
    name: 'availability',
  });

  const {
    handleSubmit,
    formState: { isSubmitting, errors },
  } = form;

  const onSubmit = async (values: { availability: DoctorAvailabilityValues }) => {
    setServerError(null);
    try {
      await apiRequest('/api/doctor/availability', {
        method: 'PUT',
        body: { availability: values.availability },
      });
      toast.success('Availability saved.', {
        description: 'Patients will see the new timings when booking.',
      });
      router.refresh();
    } catch (error) {
      if (error instanceof ApiError && error.fieldErrors.length > 0) {
        for (const fieldError of error.fieldErrors) {
          const match = /availability\.(\d+)\.(day|startTime|endTime)/.exec(
            fieldError.field,
          );
          if (match) {
            form.setError(
              `availability.${match[1]}.${match[2]}` as never,
              { message: fieldError.message },
            );
          }
        }
        setServerError(error.message);
      } else {
        setServerError(
          error instanceof ApiError
            ? error.message
            : 'We could not save your availability.',
        );
      }
    }
  };

  const enabledCount = fields.filter((field) => field.isEnabled).length;
  const arrayError =
    typeof errors.availability?.message === 'string'
      ? errors.availability.message
      : null;

  return (
    <FormProvider {...form}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Card className="p-5 sm:p-6">
          <fieldset className="space-y-4">
            <legend className="text-sm font-semibold text-foreground">
              Weekly consultation timings
            </legend>
            <p className="text-[13px] leading-relaxed text-muted-foreground">
              Turn on the days you consult and set your usual window. Existing
              appointments are never changed.
            </p>

            {serverError && (
              <Alert variant="error" title="Something went wrong">
                {serverError}
              </Alert>
            )}
            {arrayError && <Alert variant="error">{arrayError}</Alert>}

            <ul className="space-y-2.5">
              {fields.map((field, index) => (
                <DayRow
                  key={field.id}
                  index={index}
                  day={field.day}
                  isEnabled={field.isEnabled}
                  startTime={field.startTime}
                  endTime={field.endTime}
                  startError={slotError(errors, index, 'startTime')}
                  endError={slotError(errors, index, 'endTime')}
                  onToggle={(checked) =>
                    update(index, { ...fields[index], isEnabled: checked })
                  }
                  onStart={(value) =>
                    update(index, { ...fields[index], startTime: value })
                  }
                  onEnd={(value) =>
                    update(index, { ...fields[index], endTime: value })
                  }
                  onRemove={() => remove(index)}
                />
              ))}
            </ul>


            {fields.length === 0 && (
              <p className="rounded-xl border border-dashed border-border bg-surface-muted/60 px-4 py-6 text-center text-sm text-muted-foreground">
                No days configured yet — add a day below to start publishing
                timings.
              </p>
            )}

            {fields.length < 7 && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  append({
                    day: nextFreeDay(fields),
                    isEnabled: false,
                    startTime: '09:00',
                    endTime: '17:00',
                  })
                }
              >
                <Plus aria-hidden="true" />
                Add another day
              </Button>
            )}

            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Clock className="size-3.5" aria-hidden="true" />
              {enabledCount === 0
                ? 'No days enabled — patients will see no slots until you enable one.'
                : `${enabledCount} day${enabledCount === 1 ? '' : 's'} enabled.`}
            </p>
          </fieldset>
        </Card>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            Saving replaces the whole week at once.
          </p>
          <Button type="submit" loading={isSubmitting}>
            Save availability
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

