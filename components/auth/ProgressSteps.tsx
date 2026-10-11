/**
 * Backwards compatible alias for the shared {@link RegistrationProgress}
 * component. The responsive implementation lives in `RegistrationProgress.tsx`
 * so patient, doctor and pharmacy wizards all share one stepper — this file
 * only keeps the original import path working.
 */
export { RegistrationProgress as ProgressSteps } from './RegistrationProgress';
export type {
  ProgressStep,
  RegistrationProgressProps,
} from './RegistrationProgress';
