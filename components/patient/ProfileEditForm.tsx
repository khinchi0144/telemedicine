'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { Controller, useForm, FormProvider, type Control } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { Input, Textarea } from '@/components/ui/input';
import { FormField, useFieldAria } from '@/components/auth/FormField';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { patientProfileUpdateSchema } from '@/lib/validations/patient';
import { BLOOD_GROUP_OPTIONS, GENDER_OPTIONS } from '@/lib/constants/options';
import { INDIAN_STATES } from '@/lib/constants/geo';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import type { ProfileOutput, ProfileValues } from './profile-types';

/** Select wrapper so every dropdown on this form behaves identically. */
export function ControllerSelect({
  control,
  name,
  placeholder,
  options,
  invalid,
}: {
  control: Control<ProfileValues, unknown, ProfileOutput>;
  name: keyof ProfileValues;
  placeholder: string;
  options: { value: string; label: string }[];
  invalid?: boolean;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Select value={field.value || undefined} onValueChange={field.onChange}>
          <SelectTrigger id={`field-${name}`} aria-invalid={invalid || undefined}>
            <SelectValue placeholder={placeholder} />
          </SelectTrigger>
          <SelectContent>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    />
  );
}

/**
 * The editable half of the patient profile.
 *
 * Posts to `PATCH /api/patient/profile`, which re-checks the role and
 * re-validates the merged result server side, so a stale or hand-crafted
 * payload cannot change anything the patient does not own.
 */
export function ProfileEditForm({
  profile,
  onSaved,
  onCancel,
}: {
  profile: ProfileValues;
  onSaved: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();

  const form = useForm<ProfileValues, unknown, ProfileOutput>({
    resolver: zodResolver(patientProfileUpdateSchema),
    mode: 'onBlur',
    defaultValues: profile,
  });

  const nameAria = useFieldAria('fullName', { required: true });
  const addressAria = useFieldAria('address', { required: true });
  const cityAria = useFieldAria('city', { required: true });
  const pincodeAria = useFieldAria('pincode', { required: true });
  const emergencyNameAria = useFieldAria('emergencyContactName', { required: true });

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      await apiRequest('/api/patient/profile', { method: 'PATCH', body: values });
      toast.success('Your profile has been updated.');
      onSaved();
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'We could not save your changes. Please try again.',
      );
    }
  });

  const cancel = () => {
    form.reset();
    onCancel();
  };

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <Alert variant="info" title="Editing your profile">
        Changes are saved to your account and shown to the doctors you consult.
      </Alert>

      <FormProvider {...form}>
        <Card className="space-y-5 p-5 sm:p-6">
          <h2 className="font-display text-[15px] font-bold text-navy-900">
            Personal details
          </h2>

          <FormField name="fullName" label="Full name" required>
            <Input {...form.register('fullName')} {...nameAria} />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-2">
            <FormField name="dateOfBirth" label="Date of birth" required>
              <Input type="date" {...form.register('dateOfBirth')} />
            </FormField>

            <FormField name="gender" label="Gender" required>
              <ControllerSelect
                control={form.control}
                name="gender"
                placeholder="Select gender"
                options={GENDER_OPTIONS.map((o) => ({
                  value: o.value,
                  label: o.label,
                }))}
                invalid={Boolean(form.formState.errors.gender)}
              />
            </FormField>
          </div>

          <FormField name="address" label="Address" required>
            <Textarea
              {...form.register('address')}
              {...addressAria}
              rows={2}
              placeholder="Flat, building, street, landmark"
            />
          </FormField>

          <div className="grid gap-5 sm:grid-cols-3">
            <FormField name="city" label="City" required>
              <Input {...form.register('city')} {...cityAria} />
            </FormField>

            <FormField name="state" label="State" required>
              <ControllerSelect
                control={form.control}
                name="state"
                placeholder="Select state"
                options={INDIAN_STATES.map((s) => ({ value: s, label: s }))}
                invalid={Boolean(form.formState.errors.state)}
              />
            </FormField>

            <FormField name="pincode" label="Pincode" required>
              <Input
                {...form.register('pincode')}
                {...pincodeAria}
                inputMode="numeric"
                maxLength={6}
              />
            </FormField>
          </div>
        </Card>

        <Card className="space-y-5 p-5 sm:p-6">
          <h2 className="font-display text-[15px] font-bold text-navy-900">
            Emergency contact
          </h2>
          <div className="grid gap-5 sm:grid-cols-2">
            <FormField name="emergencyContactName" label="Contact name" required>
              <Input
                {...form.register('emergencyContactName')}
                {...emergencyNameAria}
              />
            </FormField>

            <FormField name="emergencyContactNumber" label="Contact number" required>
              <Input
                {...form.register('emergencyContactNumber')}
                inputMode="numeric"
                maxLength={10}
              />
            </FormField>
          </div>
        </Card>

        <Card className="space-y-5 p-5 sm:p-6">
          <div>
            <h2 className="font-display text-[15px] font-bold text-navy-900">
              Health information
            </h2>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              Optional, and entirely under your control. Only shared with the doctor
              you consult.
            </p>
          </div>

          <FormField name="bloodGroup" label="Blood group" optional>
            <ControllerSelect
              control={form.control}
              name="bloodGroup"
              placeholder="Select blood group"
              options={BLOOD_GROUP_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              }))}
            />
          </FormField>

          <FormField name="existingConditions" label="Existing conditions" optional>
            <Textarea
              {...form.register('existingConditions')}
              rows={2}
              placeholder="Diabetes, hypertension, or leave blank"
            />
          </FormField>

          <FormField name="allergies" label="Allergies" optional>
            <Textarea
              {...form.register('allergies')}
              rows={2}
              placeholder="Penicillin, peanuts, or leave blank"
            />
          </FormField>
        </Card>
      </FormProvider>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" size="lg" loading={form.formState.isSubmitting}>
          {form.formState.isSubmitting ? (
            'Saving…'
          ) : (
            <>
              <Check aria-hidden="true" />
              Save changes
            </>
          )}
        </Button>
        <Button type="button" size="lg" variant="outline" onClick={cancel}>
          <X aria-hidden="true" />
          Cancel
        </Button>
      </div>
    </form>
  );
}