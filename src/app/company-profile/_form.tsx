'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { cn } from '@/lib/utils';
import {
  channelTypeAllValues,
  channelTypeLabels,
  type ChannelTypeInput,
} from '@/lib/validation/company';

import {
  submitCompanyProfile,
  type CompanyProfileActionState,
} from './_actions';

const initialState: CompanyProfileActionState = { ok: true };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-caption text-danger">{message}</p>;
}

interface CompanyProfileFormProps {
  role: 'ADVERTISER' | 'PUBLISHER';
  industries: Array<{ id: string; name: string }>;
}

export function CompanyProfileForm({ role, industries }: CompanyProfileFormProps) {
  const [rawState, action] = useFormState(submitCompanyProfile, initialState);
  const state = rawState ?? initialState;

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}

      <fieldset className="flex flex-col gap-5">
        <legend className="text-caption uppercase text-tertiary">Basics</legend>

        <div>
          <label
            htmlFor="name"
            className="mb-1.5 block text-caption uppercase text-tertiary"
          >
            Company name
          </label>
          <Input id="name" name="name" required maxLength={200} />
          <FieldError message={state.fieldErrors?.name} />
        </div>

        <div>
          <label
            htmlFor="legalName"
            className="mb-1.5 block text-caption uppercase text-tertiary"
          >
            Legal name <span className="lowercase text-tertiary">(if different)</span>
          </label>
          <Input id="legalName" name="legalName" maxLength={200} />
          <FieldError message={state.fieldErrors?.legalName} />
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="taxId"
              className="mb-1.5 block text-caption uppercase text-tertiary"
            >
              Tax / Registration ID
            </label>
            <Input id="taxId" name="taxId" maxLength={40} />
            <FieldError message={state.fieldErrors?.taxId} />
          </div>

          <div>
            <label
              htmlFor="foundingYear"
              className="mb-1.5 block text-caption uppercase text-tertiary"
            >
              Founding year
            </label>
            <Input
              id="foundingYear"
              name="foundingYear"
              type="number"
              inputMode="numeric"
              min={1800}
              max={new Date().getFullYear()}
            />
            <FieldError message={state.fieldErrors?.foundingYear} />
          </div>
        </div>

        <div>
          <label
            htmlFor="country"
            className="mb-1.5 block text-caption uppercase text-tertiary"
          >
            Country
          </label>
          <Input
            id="country"
            name="country"
            defaultValue="AM"
            maxLength={2}
            className="uppercase"
          />
          <p className="mt-1 text-caption text-tertiary">2-letter ISO code (AM, RU, US…)</p>
          <FieldError message={state.fieldErrors?.country} />
        </div>

        <div>
          <label
            htmlFor="address"
            className="mb-1.5 block text-caption uppercase text-tertiary"
          >
            Address
          </label>
          <textarea
            id="address"
            name="address"
            rows={3}
            maxLength={500}
            className="flex w-full rounded border border-border-subtle bg-surface px-3 py-2 text-body text-primary placeholder:text-tertiary focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          <FieldError message={state.fieldErrors?.address} />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-caption uppercase text-tertiary">Industries</legend>
        <p className="text-body text-secondary">
          Pick all that describe your business. Up to 8.
        </p>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {industries.map((ind) => (
            <label
              key={ind.id}
              className={cn(
                'flex cursor-pointer items-center gap-3 rounded border border-border-subtle bg-surface px-3 py-2',
                'transition-colors duration-200 ease-out-expo hover:border-border-strong'
              )}
            >
              <input
                type="checkbox"
                name="industryIds"
                value={ind.id}
                className="h-4 w-4 accent-accent"
              />
              <span className="text-body text-primary">{ind.name}</span>
            </label>
          ))}
        </div>
        <FieldError message={state.fieldErrors?.industryIds} />
      </fieldset>

      {role === 'ADVERTISER' ? (
        <fieldset className="flex flex-col gap-3">
          <legend className="text-caption uppercase text-tertiary">
            Channels of interest
          </legend>
          <p className="text-body text-secondary">
            Where do you typically want your ads to run? Optional — helps us
            route relevant opportunities to your inbox.
          </p>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
            {channelTypeAllValues.map((ch: ChannelTypeInput) => (
              <label
                key={ch}
                className={cn(
                  'flex cursor-pointer items-center gap-2 rounded border border-border-subtle bg-surface px-3 py-2',
                  'transition-colors duration-200 ease-out-expo hover:border-border-strong'
                )}
              >
                <input
                  type="checkbox"
                  name="channelsOfInterest"
                  value={ch}
                  className="h-4 w-4 accent-accent"
                />
                <span className="text-body text-primary">{channelTypeLabels[ch]}</span>
              </label>
            ))}
          </div>
        </fieldset>
      ) : null}

      <fieldset className="flex flex-col gap-3">
        <legend className="text-caption uppercase text-tertiary">Logo</legend>
        <p className="text-body text-secondary">
          Optional. JPG, PNG, or WEBP, up to 2 MB. Used on your public profile
          and listing cards.
        </p>
        <input
          type="file"
          name="logo"
          accept="image/jpeg,image/png,image/webp"
          className="text-body text-primary file:mr-4 file:rounded file:border-0 file:bg-surface-elevated file:px-3 file:py-2 file:text-body file:font-medium file:text-primary hover:file:bg-border-subtle"
        />
        <FieldError message={state.fieldErrors?.logo} />
      </fieldset>

      <SubmitButton size="lg" pendingLabel="Saving…" className="w-full">
        Submit for verification
      </SubmitButton>

      <p className="text-caption text-tertiary">
        Submitting creates your company profile in <strong>Pending</strong>{' '}
        status. Our team reviews it within 1 business day before you can{' '}
        {role === 'ADVERTISER' ? 'submit inquiries' : 'publish listings'}.
      </p>
    </form>
  );
}
