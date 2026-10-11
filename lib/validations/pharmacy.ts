import { z } from 'zod';

import {
  addressSchema,
  citySchema,
  mobileNumberSchema,
  optionalText,
  pincodeSchema,
  requiredEnumField,
  timeSchema,
} from './common';
import { PHARMACY_TYPE_OPTIONS, WEEK_DAY_OPTIONS } from '@/lib/constants/options';
import { stateFieldSchema } from './doctor';

/** Step 3 — pharmacy details. */
export const pharmacyDetailsSchema = z.object({
  drugLicenseNumber: z
    .string()
    .trim()
    .min(4, 'Please enter your drug license number.')
    .max(40, 'Please enter a shorter license number.')
    .regex(/^[A-Za-z0-9/-]+$/, 'Please use only letters, numbers, - and /.'),
  gstNumber: z
    .string()
    .trim()
    .min(4, 'Please enter your GST number.')
    .max(20, 'Please enter a shorter GST number.')
    .regex(
      /^[0-9]{2}[A-Z]{5}[0-9A-Z]{1,14}$/i,
      'Please enter a valid 15 character GST number.',
    ),
  // Optional: not every registration type has one.
  pharmacyRegistrationNumber: optionalText(
    40,
    'Please keep the registration number under 40 characters.',
  ),
  pharmacyType: requiredEnumField(
    PHARMACY_TYPE_OPTIONS.map((option) => option.value),
    'Please select your pharmacy type.',
  ),
});

export type PharmacyDetailsInput = z.input<typeof pharmacyDetailsSchema>;
export type PharmacyDetailsValues = z.output<typeof pharmacyDetailsSchema>;

const dayHoursSchema = z.object({
  isClosed: z.boolean(),
  openTime: timeSchema,
  closeTime: timeSchema,
});

/** Step 5 — address, contact number and weekly operating hours. */
export const pharmacyAddressSchema = z.object({
  address: addressSchema,
  city: citySchema,
  state: stateFieldSchema,
  pincode: pincodeSchema,
  contactNumber: mobileNumberSchema,
  operatingHours: z
    .object(
      Object.fromEntries(
        WEEK_DAY_OPTIONS.map((day) => [day.value, dayHoursSchema]),
      ) as Record<(typeof WEEK_DAY_OPTIONS)[number]['value'], typeof dayHoursSchema>,
    )
    .superRefine((hours, ctx) => {
      for (const day of WEEK_DAY_OPTIONS) {
        const value = hours[day.value];
        if (!value || value.isClosed) continue;
        if (value.openTime >= value.closeTime) {
          ctx.addIssue({
            code: 'custom',
            path: [day.value, 'closeTime'],
            message: 'Closing time must be later than opening time.',
          });
        }
      }
    }),
});

export type PharmacyAddressInput = z.infer<typeof pharmacyAddressSchema>;

/** Full payload accepted by POST /api/auth/register/pharmacy. */
export const pharmacyRegistrationSchema = z.object({
  basic: z.object({
    pharmacyName: z.string().min(1),
    ownerName: z.string().min(1),
    mobile: z.string().min(1),
    email: z.string().min(1),
    password: z.string().min(1),
    confirmPassword: z.string().min(1),
  }),
  pharmacy: pharmacyDetailsSchema,
  address: pharmacyAddressSchema,
  documentIds: z.array(z.string().min(1)).max(10).default([]),
  oauthTicket: z.string().optional(),
});

export type PharmacyRegistrationRequest = z.infer<
  typeof pharmacyRegistrationSchema
>;

/** Step 1 of the pharmacy wizard has two extra identity fields. */
export const pharmacyBasicSchema = z
  .object({
    pharmacyName: z
      .string()
      .trim()
      .min(2, 'Please enter your pharmacy name.')
      .max(120, 'Please enter a shorter pharmacy name.'),
    ownerName: z
      .string()
      .trim()
      .min(2, 'Please enter the owner or authorized person name.')
      .max(80, 'Please enter a shorter name.'),
    mobile: mobileNumberSchema,
    email: z
      .email('Please enter a valid email address.')
      .trim()
      .toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters long.')
      .max(72, 'Password must be 72 characters or fewer.')
      .regex(/[a-z]/, 'Please include at least one lowercase letter.')
      .regex(/[A-Z]/, 'Please include at least one uppercase letter.')
      .regex(/\d/, 'Please include at least one number.'),
    confirmPassword: z.string().min(1, 'Please confirm your password.'),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmPassword'],
        message: 'Passwords do not match.',
      });
    }
  });

export type PharmacyBasicInput = z.input<typeof pharmacyBasicSchema>;
