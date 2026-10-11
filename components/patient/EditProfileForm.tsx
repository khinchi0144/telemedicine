'use client';

import * as React from 'react';
import { PencilLine } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import { ProfileEditForm } from './ProfileEditForm';
import { SUMMARY_FIELDS, type ProfileValues } from './profile-types';
import { maskMobile } from '@/lib/utils/format';

function pretty(value: string | undefined): string {
  return value ? value : 'Not provided';
}

/** Identity block — read-only because changing it needs a verified flow. */
function IdentityCard({
  user,
}: {
  user: { fullName: string; email: string | null; mobile: string };
}) {
  return (
    <Card className="h-fit space-y-4 p-5">
      <h2 className="font-display text-[15px] font-bold text-navy-900">
        Account identity
      </h2>
      <dl className="space-y-3 text-[13px]">
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Mobile</dt>
          <dd className="font-semibold text-navy-900">{maskMobile(user.mobile)}</dd>
        </div>
        <div className="flex items-baseline justify-between gap-3">
          <dt className="text-muted-foreground">Email</dt>
          <dd className="truncate font-semibold text-navy-900">
            {user.email ?? 'Not provided'}
          </dd>
        </div>
      </dl>
      <p className="text-xs leading-relaxed text-muted-foreground">
        Your mobile number and email are verified during sign up. Contact support if
        either needs to change.
      </p>
    </Card>
  );
}

/**
 * Patient profile — read view plus an inline editor.
 *
 * Identity fields (email, mobile, role) are rendered read-only on purpose:
 * changing them needs a separate verified flow, and offering an input here
 * would promise something the API does not do.
 */
export function EditProfileForm({
  user,
  profile,
}: {
  user: { fullName: string; email: string | null; mobile: string };
  profile: ProfileValues | null;
}) {
  const [editing, setEditing] = React.useState(false);

  if (!profile) {
    return (
      <Alert variant="warning" title="No profile found">
        We could not find a profile for this account. Please contact support so we
        can restore it.
      </Alert>
    );
  }

  if (!editing) {
    return (
      <div className="grid gap-5 lg:grid-cols-[1fr_320px]">
        <Card className="p-5 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="font-display text-[15px] font-bold text-navy-900">
                Personal details
              </h2>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Everything your doctor sees before a consultation.
              </p>
            </div>
            <Button size="sm" onClick={() => setEditing(true)}>
              <PencilLine aria-hidden="true" />
              Edit profile
            </Button>
          </div>

          <dl className="mt-5 grid gap-x-8 gap-y-3.5 sm:grid-cols-2">
            {SUMMARY_FIELDS.map(({ key, label }) => (
              <div
                key={key}
                className="flex items-baseline justify-between gap-4 border-b border-border/70 pb-3"
              >
                <dt className="text-[13px] text-muted-foreground">{label}</dt>
                <dd className="truncate text-[13px] font-semibold text-navy-900">
                  {pretty(profile[key])}
                </dd>
              </div>
            ))}
          </dl>
        </Card>

        <IdentityCard user={user} />
      </div>
    );
  }

  return (
    <ProfileEditForm
      profile={profile}
      onSaved={() => setEditing(false)}
      onCancel={() => setEditing(false)}
    />
  );
}