'use client';

import { useMemo } from 'react';

import { cn } from '@/lib/utils/cn';

export interface PasswordRule {
  id: string;
  label: string;
  passed: boolean;
}

export interface PasswordStrength {
  score: 0 | 1 | 2 | 3 | 4;
  percent: number;
  label: string;
  barClass: string;
  rules: PasswordRule[];
}

const LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];
const BAR_CLASSES = [
  'bg-destructive',
  'bg-destructive',
  'bg-warning',
  'bg-primary',
  'bg-success',
];

/**
 * Client side password strength feedback.
 * Mirrors the zod policy in lib/validations/common.ts — the server is still
 * the authority, this only guides the user while typing.
 */
export function usePasswordStrength(password: string): PasswordStrength {
  return useMemo(() => {
    const rules: PasswordRule[] = [
      { id: 'length', label: 'At least 8 characters', passed: password.length >= 8 },
      { id: 'lower', label: 'A lowercase letter', passed: /[a-z]/.test(password) },
      { id: 'upper', label: 'An uppercase letter', passed: /[A-Z]/.test(password) },
      { id: 'number', label: 'A number', passed: /\d/.test(password) },
    ];

    let score = rules.filter((rule) => rule.passed).length;
    if (password.length >= 12 && /[^A-Za-z0-9]/.test(password)) score = 5;
    if (!password) score = 0;
    const bounded = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;

    return {
      score: bounded,
      percent: password ? ((bounded + 1) / 5) * 100 : 0,
      label: LABELS[bounded],
      barClass: BAR_CLASSES[bounded],
      rules,
    };
  }, [password]);
}

/** Convenience wrapper for conditional class names. */
export { cn };
