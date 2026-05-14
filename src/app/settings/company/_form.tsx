'use client';

import * as React from 'react';
import Image from 'next/image';
import { useFormState } from 'react-dom';

import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import { cn } from '@/lib/utils';
import {
  channelTypeAllValues,
  channelTypeLabels,
  type ChannelTypeInput,
} from '@/lib/validation/company';

import { updateCompanyProfile, type EditCompanyState } from './_actions';

const initialState: EditCompanyState = { ok: true };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-caption text-danger">{message}</p>;
}

interface DefaultValues {
  name: string;
  legalName?: string | null;
  taxId?: string | null;
  foundingYear?: number | null;
  country?: string | null;
  address?: string | null;
  logoUrl?: string | null;
  selectedIndustryIds: string[];
  channelsOfInterest: string[];
}

interface Props {
  role: 'ADVERTISER' | 'PUBLISHER';
  industries: Array<{ id: string; name: string }>;
  defaults: DefaultValues;
}

export function EditCompanyForm({ role, industries, defaults }: Props) {
  const [rawState, action] = useFormState(updateCompanyProfile, initialState);
  const state = rawState ?? initialState;
  const selected = new Set(defaults.selectedIndustryIds);
  const selectedChannels = new Set(defaults.channelsOfInterest);

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}
      {state.ok && state.successFlash ? (
        <p className="rounded border border-success/30 bg-success/10 p-3 text-body text-success">
          {state.successFlash}
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
          <Input id="name" name="name" required maxLength={200} defaultValue={defaults.name} />
          <FieldError message={state.fieldErrors?.name} />
        </div>

        <div>
          <label
            htmlFor="legalName"
            className="mb-1.5 block text-caption uppercase text-tertiary"
          >
            Legal name
          </label>
          <Input
            id="legalName"
            name="legalName"
            maxLength={200}
            defaultValue={defaults.legalName ?? ''}
          />
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
            <Input
              id="taxId"
              name="taxId"
              maxLength={40}
              defaultValue={defaults.taxId ?? ''}
            />
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
              defaultValue={defaults.foundingYear ?? ''}
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
            defaultValue={defaults.country ?? 'AM'}
            maxLength={2}
            className="uppercase"
          />
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
            defaultValue={defaults.address ?? ''}
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
                defaultChecked={selected.has(ind.id)}
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
                  defaultChecked={selectedChannels.has(ch)}
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
        {defaults.logoUrl ? (
          <div className="flex items-center gap-3">
            <Image
              src={defaults.logoUrl}
              width={64}
              height={64}
              alt="Current logo"
              className="rounded border border-border-subtle bg-background"
              unoptimized
            />
            <p className="text-caption text-tertiary">
              Upload a new file to replace. The old one will be deleted.
            </p>
          </div>
        ) : (
          <p className="text-body text-secondary">
            Optional. JPG, PNG, or WEBP, up to 2 MB.
          </p>
        )}
        <input
          type="file"
          name="logo"
          accept="image/jpeg,image/png,image/webp"
          className="text-body text-primary file:mr-4 file:rounded file:border-0 file:bg-surface-elevated file:px-3 file:py-2 file:text-body file:font-medium file:text-primary hover:file:bg-border-subtle"
        />
        <FieldError message={state.fieldErrors?.logo} />
      </fieldset>

      <SubmitButton size="lg" pendingLabel="Saving…" className="w-fit">
        Save changes
      </SubmitButton>
    </form>
  );
}
