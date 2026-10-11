'use client';

import * as React from 'react';
import { Clock, Plus } from 'lucide-react';
import {
  useFieldArray,
  useFormContext,
  type FieldArrayPath,
} from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { WEEK_DAY_OPTIONS } from '@/lib/constants/options';
import { cn } from '@/lib/utils/cn';
import type {
  DoctorAvailabilitySlotInput,
  DoctorClinicFormValues,
} from '@/lib/validations/doctor';

const FIELD_NAME = 'availability' as FieldArrayPath<DoctorClinicFormValues>;

/** First weekday not already in the list. */
function nextFreeDay(fields: { day: string }[]): DoctorAvailabilitySlotInput['day'] {
  const taken = new Set(fields.map((field) => field.day));
  const free = WEEK_DAY_OPTIONS.find((option) => !taken.has(option.value));
  return (free?.value ?? 'MONDAY') as DoctorAvailabilitySlotInput['day'];
}

/**
 * Weekly consultation windows.
 *
 * Optional by design: every day starts disabled and only enabled days are
 * submitted, so a doctor who has not settled on a timetable is never blocked
 * from finishing registration.
 */
export function AvailabilityFields() {
  const form = useFormContext<DoctorClinicFormValues>();
  const { fields, append, update } = useFieldArray({
    control: form.control,
    name: FIELD_NAME,
  });

  const enabledCount = fields.filter((field) => field.isEnabled).length;
  const errors = form.formState.errors.availability;

  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-foreground">
        Available consultation timings
      </legend>
      <p className="text-[13px] leading-relaxed text-muted-foreground">
        Optional. Turn on the days you consult and set your usual window —
        patients only ever see this after your profile is approved.
      </p>

      <ul className="space-y-2.5">
        {fields.map((field, index) => {
          const dayMeta = WEEK_DAY_OPTIONS.find((d) => d.value === field.day);
          const startError =
            errors?.[index]?.startTime?.message ?? errors?.[index]?.message;
          const endError = errors?.[index]?.endTime?.message;

          return (
            <li
              key={field.id}
              className={cn(
                'rounded-xl border border-border bg-card p-3.5 transition-colors',
                field.isEnabled && 'border-primary/35 bg-accent/30',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Switch
                    id={`availability-${field.day}`}
                    checked={field.isEnabled}
                    onCheckedChange={(checked) =>
                      update(index, { ...fields[index], isEnabled: checked })
                    }
                    aria-label={`Consult on ${dayMeta?.label ?? field.day}`}
                  />
                  <label
                    htmlFor={`availability-${field.day}`}
                    className="text-sm font-medium text-navy-900"
                  >
                    {dayMeta?.label ?? field.day}
                  </label>
                </div>
              </div>

              {field.isEnabled && (
                <div className="mt-3 flex flex-wrap items-end gap-3 pl-11">
                  <div>
                    <label
                      htmlFor={`start-${field.day}`}
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      From
                    </label>
                    <Input
                      id={`start-${field.day}`}
                      type="time"
                      step={900}
                      className="w-[132px]"
                      value={field.startTime}
                      onChange={(event) =>
                        update(index, {
                          ...fields[index],
                          startTime: event.target.value,
                        })
                      }
                      aria-invalid={Boolean(startError) || undefined}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor={`end-${field.day}`}
                      className="mb-1 block text-xs font-medium text-muted-foreground"
                    >
                      To
                    </label>
                    <Input
                      id={`end-${field.day}`}
                      type="time"
                      step={900}
                      className="w-[132px]"
                      value={field.endTime}
                      onChange={(event) =>
                        update(index, {
                          ...fields[index],
                          endTime: event.target.value,
                        })
                      }
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
        })}
      </ul>

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
          ? 'No days enabled — you can publish timings later from your dashboard.'
          : `${enabledCount} day${enabledCount === 1 ? '' : 's'} enabled.`}
      </p>
    </fieldset>
  );
}