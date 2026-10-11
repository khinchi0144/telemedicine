'use client';

import { useForm, Controller, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { RegistrationStepShell } from '@/components/auth/RegistrationStepShell';
import { FormField, useFieldAria } from '@/components/auth/FormField';
import { MobileInput } from '@/components/auth/MobileInput';
import { Input, Textarea } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Alert } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  pharmacyAddressSchema,
  type PharmacyAddressInput,
} from '@/lib/validations/pharmacy';
import { WEEK_DAY_OPTIONS } from '@/lib/constants/options';
import { INDIAN_STATES } from '@/lib/constants/geo';
import { PHARMACY_STEPS } from '@/types/pharmacy';
import type { DayOfWeek } from '@/types/pharmacy';

const DEFAULT_HOURS = {
  isClosed: false,
  openTime: '09:00',
  closeTime: '21:00',
} as const;

function defaultHours(): PharmacyAddressInput['operatingHours'] {
  return WEEK_DAY_OPTIONS.reduce(
    (hours, day) => ({
      ...hours,
      [day.value]:
        day.value === 'SUNDAY'
          ? { ...DEFAULT_HOURS, isClosed: true }
          : { ...DEFAULT_HOURS },
    }),
    {} as PharmacyAddressInput['operatingHours'],
  );
}

export interface PharmacyAddressStepProps {
  stepIndex: number;
  submitting: boolean;
  serverError: string | null;
  onBack: () => void;
  onSubmit: (values: PharmacyAddressInput) => void;
}

/** Step 5 — address, contact number and weekly operating hours. */
export function PharmacyAddressStep({
  stepIndex,
  submitting,
  serverError,
  onBack,
  onSubmit,
}: PharmacyAddressStepProps) {
  const form = useForm<PharmacyAddressInput>({
    resolver: zodResolver(pharmacyAddressSchema),
    mode: 'onBlur',
    defaultValues: {
      address: '',
      city: '',
      state: '',
      pincode: '',
      contactNumber: '',
      operatingHours: defaultHours(),
    },
  });

  const addressAria = useFieldAria('address', { required: true });
  const cityAria = useFieldAria('city', { required: true });
  const pincodeAria = useFieldAria('pincode', { required: true });

  const operatingHours = useWatch({ control: form.control, name: 'operatingHours' });

  const setDay = (
    day: DayOfWeek,
    patch: Partial<{ isClosed: boolean; openTime: string; closeTime: string }>,
  ) => {
    form.setValue(
      `operatingHours.${day}`,
      { ...DEFAULT_HOURS, ...operatingHours[day], ...patch },
      { shouldValidate: true },
    );
  };


  return (
    <RegistrationStepShell
      steps={PHARMACY_STEPS}
      currentStep={stepIndex}
      form={form as never}
      title="Address & Operating Hours"
      description="Tell customers where you are and when the pharmacy is open."
      onBack={onBack}
      onSubmit={form.handleSubmit(onSubmit)}
      loading={submitting}
      submitLabel="Submit Registration"
      error={serverError}
      footerNote="Your account stays in PENDING_VERIFICATION until the review is complete."
    >
      <FormField name="address" label="Address" required>
        <Textarea
          {...form.register('address')}
          {...addressAria}
          rows={2}
          placeholder="Shop / building, street, landmark"
        />
      </FormField>

      <div className="grid gap-5 sm:grid-cols-3">
        <FormField name="city" label="City" required>
          <Input {...form.register('city')} {...cityAria} />
        </FormField>

        <FormField name="state" label="State" required>
          <Controller
            control={form.control}
            name="state"
            render={({ field }) => (
              <Select value={field.value || undefined} onValueChange={field.onChange}>
                <SelectTrigger
                  id="field-state"
                  aria-invalid={form.formState.errors.state ? true : undefined}
                >
                  <SelectValue placeholder="Select state" />
                </SelectTrigger>
                <SelectContent>
                  {INDIAN_STATES.map((state) => (
                    <SelectItem key={state} value={state}>
                      {state}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </FormField>

        <FormField name="pincode" label="Pincode" required>
          <Input
            {...form.register('pincode')}
            {...pincodeAria}
            inputMode="numeric"
            maxLength={6}
            placeholder="560001"
          />
        </FormField>
      </div>

      <MobileInput name="contactNumber" label="Contact Number" />

      <OperatingHoursEditor
        hours={operatingHours}
        onChange={setDay}
        errors={form.formState.errors.operatingHours as unknown as
          | Record<string, { closeTime?: { message?: string } }>
          | undefined}
      />

      <Alert variant="warning" title="What happens next">
        We verify your drug licence, GST and registration certificates. The
        pharmacy dashboard opens only after approval.
      </Alert>
    </RegistrationStepShell>
  );
}

/** Weekly opening hours with a per-day "closed" toggle. */
function OperatingHoursEditor({
  hours,
  onChange,
  errors,
}: {
  hours: PharmacyAddressInput['operatingHours'];
  onChange: (
    day: DayOfWeek,
    patch: Partial<{ isClosed: boolean; openTime: string; closeTime: string }>,
  ) => void;
  errors?: Record<string, { closeTime?: { message?: string } }>;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">Operating Hours</p>
        <p className="text-xs text-muted-foreground">Switch off the days you are closed</p>
      </div>

      <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        {WEEK_DAY_OPTIONS.map((day) => {
          const value = hours[day.value];
          const dayError = errors?.[day.value]?.closeTime;
          return (
            <li key={day.value} className="flex flex-wrap items-center gap-3 p-3">
              <span className="w-24 shrink-0 text-sm font-medium">{day.label}</span>

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <Switch
                  checked={!value.isClosed}
                  onCheckedChange={(checked) => onChange(day.value, { isClosed: !checked })}
                  aria-label={`${day.label} open`}
                />
                {value.isClosed ? 'Closed' : 'Open'}
              </label>

              <div className="ml-auto flex items-center gap-2">
                <Input
                  type="time"
                  value={value.openTime}
                  disabled={value.isClosed}
                  onChange={(event) => onChange(day.value, { openTime: event.target.value })}
                  className="h-9 w-28"
                  aria-label={`${day.label} opening time`}
                />
                <span className="text-xs text-muted-foreground" aria-hidden="true">
                  to
                </span>
                <Input
                  type="time"
                  value={value.closeTime}
                  disabled={value.isClosed}
                  onChange={(event) => onChange(day.value, { closeTime: event.target.value })}
                  className="h-9 w-28"
                  aria-invalid={dayError ? true : undefined}
                  aria-label={`${day.label} closing time`}
                />
              </div>

              {dayError?.message && (
                <p role="alert" className="w-full text-[13px] font-medium text-destructive">
                  {dayError.message}
                </p>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
