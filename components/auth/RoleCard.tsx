'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Check, Store, Stethoscope, User } from 'lucide-react';

import { cn } from '@/lib/utils/cn';
import { ROLE_DEFINITIONS } from '@/lib/constants/roles';
import type { RoleDefinition } from '@/lib/constants/roles';
import type { RegisterableRole } from '@/types/auth';

const ICONS = {
  user: User,
  stethoscope: Stethoscope,
  store: Store,
} as const;

export interface RoleCardProps {
  role: RegisterableRole;
  /** Highlights the card as the active selection. */
  selected?: boolean;
  onSelect?: (role: RegisterableRole) => void;
  className?: string;
}

/**
 * Large, tappable account type card.
 * Implemented as a real button so it is reachable with the keyboard and
 * announced correctly by screen readers.
 */
export function RoleCard({ role, selected, onSelect, className }: RoleCardProps) {
  const router = useRouter();
  const definition: RoleDefinition = ROLE_DEFINITIONS[role];
  const Icon = ICONS[definition.icon];
  const isSelected = selected ?? false;

  const handleSelect = () => {
    onSelect?.(role);
    if (!onSelect) router.push(definition.registerPath);
  };

  return (
    <div
      className={cn(
        'group relative flex h-full flex-col rounded-2xl border bg-card p-5 text-left transition-all duration-150 sm:p-6',
        'medicare-card-shadow focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background',
        isSelected
          ? 'border-primary ring-2 ring-primary/20'
          : 'border-border hover:-translate-y-0.5 hover:border-primary/45 hover:shadow-md',
        className,
      )}
    >
      <button
        type="button"
        onClick={handleSelect}
        aria-pressed={isSelected}
        className="flex h-full w-full flex-col rounded-xl text-left focus-visible:outline-none"
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={cn(
              'flex size-12 shrink-0 items-center justify-center rounded-xl transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : 'bg-accent text-primary group-hover:bg-primary/12',
            )}
            aria-hidden="true"
          >
            <Icon className="size-6" strokeWidth={2} />
          </span>
          {isSelected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/12 px-2.5 py-1 text-xs font-semibold text-primary">
              <Check className="size-3.5" aria-hidden="true" />
              Selected
            </span>
          )}
        </div>

        <h3 className="mt-4 text-lg font-semibold tracking-tight">
          {definition.title}
        </h3>
        <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
          {definition.description}
        </p>

        <ul className="mt-4 space-y-1.5">
          {definition.highlights.map((item) => (
            <li
              key={item}
              className="flex items-start gap-2 text-[13px] leading-snug text-muted-foreground"
            >
              <Check className="mt-0.5 size-3.5 shrink-0 text-primary/70" aria-hidden="true" />
              {item}
            </li>
          ))}
        </ul>

        <span
          className={cn(
            'mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors',
            isSelected
              ? 'bg-primary text-primary-foreground'
              : 'bg-secondary text-secondary-foreground group-hover:bg-primary group-hover:text-primary-foreground',
          )}
        >
          Continue as {definition.title}
          <ArrowRight className="size-4" aria-hidden="true" />
        </span>
      </button>
    </div>
  );
}
