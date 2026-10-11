'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';

import { OTPVerification } from '@/components/auth/OTPVerification';
import { SuccessScreen } from '@/components/auth/SuccessScreen';
import { PharmacyBasicStep } from './PharmacyBasicStep';
import { PharmacyDetailsStep } from './PharmacyDetailsStep';
import { PharmacyDocumentsStep } from './PharmacyDocumentsStep';
import { PharmacyAddressStep } from './PharmacyAddressStep';
import type { PharmacyBasicInput } from '@/lib/validations/pharmacy';
import type {
  PharmacyAddressInput,
  PharmacyDetailsValues,
} from '@/lib/validations/pharmacy';
import { PHARMACY_STEPS } from '@/types/pharmacy';
import { ApiError, apiRequest } from '@/lib/utils/api-client';
import { maskMobile, normalizeMobile } from '@/lib/utils/format';
import type { RegisterResult } from '@/types/auth';
import type { DocumentUploadResult } from '@/types/document';

type StepId = (typeof PHARMACY_STEPS)[number]['id'];

/**
 * Pharmacy registration wizard.
 *
 * Step 1 → Basic details      Step 4 → Document upload
 * Step 2 → OTP verification   Step 5 → Address & operating hours
 * Step 3 → Pharmacy details  Step 6 → Registration submitted
 */
export function PharmacyRegistration() {
  const router = useRouter();
  const [step, setStep] = React.useState<StepId>('basic');
  const [basic, setBasic] = React.useState<PharmacyBasicInput | null>(null);
  const [details, setDetails] = React.useState<PharmacyDetailsValues | null>(null);
  const [address, setAddress] = React.useState<PharmacyAddressInput | null>(null);
  const [documents, setDocuments] = React.useState<
    Record<string, DocumentUploadResult | null>
  >({});
  const [serverError, setServerError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);

  const stepIndex = PHARMACY_STEPS.findIndex((item) => item.id === step);

  const goTo = (next: StepId) => {
    setServerError(null);
    setStep(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const documentIds = Object.values(documents)
    .filter((document): document is DocumentUploadResult => Boolean(document))
    .map((document) => document.id);

  /** Submits the wizard; the address step passes its freshly validated values. */
  const submit = async (addressDetails?: PharmacyAddressInput) => {
    const finalAddress = addressDetails ?? address;
    if (!basic || !details || !finalAddress) return;
    setSubmitting(true);
    setServerError(null);
    try {
      await apiRequest<RegisterResult>('/api/auth/register/pharmacy', {
        method: 'POST',
        body: {
          basic: { ...basic, mobile: normalizeMobile(basic.mobile) },
          pharmacy: details,
          address: finalAddress,
          documentIds,
        },
      });
      goTo('submitted');
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : 'Something went wrong. Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'submitted') {
    return (
      <SuccessScreen
        variant="pending"
        title="Registration Submitted"
        message="Your pharmacy profile is under verification. We will notify you once your details are approved."
        points={[
          'We verify your drug licence, GST and registration certificates.',
          'You can sign in to track the status of your application.',
          'The pharmacy dashboard unlocks automatically after approval.',
        ]}
        actionLabel="Go to Login"
        onAction={() => {
          router.push('/auth/login');
          router.refresh();
        }}
      />
    );
  }

  if (step === 'otp' && basic) {
    return (
      <OTPVerification
        role="PHARMACY"
        mobile={normalizeMobile(basic.mobile)}
        maskedMobile={maskMobile(basic.mobile)}
        onVerified={() => goTo('pharmacy')}
        onBack={() => goTo('basic')}
        onChangeMobile={() => goTo('basic')}
      />
    );
  }

  if (step === 'basic') {
    return (
      <PharmacyBasicStep
        onBack={() => router.push('/auth/register')}
        onContinue={(values) => {
          setBasic(values);
          goTo('otp');
        }}
      />
    );
  }

  if (step === 'pharmacy') {
    return (
      <PharmacyDetailsStep
        onBack={() => goTo('otp')}
        onContinue={(values) => {
          setDetails(values);
          goTo('documents');
        }}
      />
    );
  }

  if (step === 'documents') {
    return (
      <PharmacyDocumentsStep
        documents={documents}
        onChange={(type, document) =>
          setDocuments((previous) => ({ ...previous, [type]: document }))
        }
        onBack={() => goTo('pharmacy')}
        onContinue={() => goTo('address')}
      />
    );
  }

  return (
    <PharmacyAddressStep
      stepIndex={stepIndex}
      submitting={submitting}
      serverError={serverError}
      onBack={() => goTo('documents')}
      onSubmit={(values) => {
        setAddress(values);
        void submit(values);
      }}
    />
  );
}
