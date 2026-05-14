'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  channelTypeAllValues,
  channelTypeLabels,
} from '@/lib/validation/company';

import { createListing, type ListingActionState } from '../_actions';

const initialState: ListingActionState = { ok: true };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-caption text-danger">{message}</p>;
}

export function CreateListingForm() {
  const [rawState, action] = useFormState(createListing, initialState);
  const state = rawState ?? initialState;

  return (
    <form action={action} className="flex flex-col gap-6">
      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="title"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Listing title
        </label>
        <Input
          id="title"
          name="title"
          placeholder="Morning drive slot, 30s, Radio Yerevan"
          maxLength={200}
          required
        />
        <FieldError message={state.fieldErrors?.title} />
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="channelType"
            className="mb-1.5 block text-caption uppercase text-tertiary"
          >
            Channel type
          </label>
          <select
            id="channelType"
            name="channelType"
            required
            className="flex h-10 w-full rounded border border-border-subtle bg-surface px-3 text-body text-primary focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            defaultValue=""
          >
            <option value="" disabled>
              Select…
            </option>
            {channelTypeAllValues.map((c) => (
              <option key={c} value={c}>
                {channelTypeLabels[c]}
              </option>
            ))}
          </select>
          <FieldError message={state.fieldErrors?.channelType} />
        </div>

        <div>
          <label
            htmlFor="sourceChannelName"
            className="mb-1.5 block text-caption uppercase text-tertiary"
          >
            Source channel name
          </label>
          <Input
            id="sourceChannelName"
            name="sourceChannelName"
            placeholder="Radio Yerevan FM"
            maxLength={160}
            required
          />
          <p className="mt-1 text-caption text-tertiary">
            The specific station / billboard / show.
          </p>
          <FieldError message={state.fieldErrors?.sourceChannelName} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label
            htmlFor="availableFrom"
            className="mb-1.5 block text-caption uppercase text-tertiary"
          >
            Available from
          </label>
          <Input id="availableFrom" name="availableFrom" type="date" required />
          <FieldError message={state.fieldErrors?.availableFrom} />
        </div>
        <div>
          <label
            htmlFor="availableTo"
            className="mb-1.5 block text-caption uppercase text-tertiary"
          >
            Available to
          </label>
          <Input id="availableTo" name="availableTo" type="date" required />
          <FieldError message={state.fieldErrors?.availableTo} />
        </div>
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-caption uppercase text-tertiary">
          Audience (optional)
        </legend>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          <div>
            <label
              htmlFor="ageRange"
              className="mb-1.5 block text-caption text-tertiary"
            >
              Age range
            </label>
            <Input id="ageRange" name="ageRange" placeholder="25-44" maxLength={40} />
            <FieldError message={state.fieldErrors?.ageRange} />
          </div>
          <div>
            <label
              htmlFor="dailyReach"
              className="mb-1.5 block text-caption text-tertiary"
            >
              Daily reach
            </label>
            <Input
              id="dailyReach"
              name="dailyReach"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="50000"
            />
            <FieldError message={state.fieldErrors?.dailyReach} />
          </div>
          <div>
            <label
              htmlFor="region"
              className="mb-1.5 block text-caption text-tertiary"
            >
              Region
            </label>
            <Input id="region" name="region" placeholder="Yerevan" maxLength={120} />
            <FieldError message={state.fieldErrors?.region} />
          </div>
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="description"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={6}
          minLength={20}
          maxLength={5000}
          required
          placeholder="What's the slot, where does it run, what creative formats do you accept, any constraints…"
          className="flex w-full rounded border border-border-subtle bg-surface px-3 py-2 text-body text-primary placeholder:text-tertiary focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        />
        <FieldError message={state.fieldErrors?.description} />
      </div>

      <SubmitButton size="lg" pendingLabel="Creating…" className="w-full">
        Create as draft
      </SubmitButton>

      <p className="text-caption text-tertiary">
        Listings start as <strong>Draft</strong>. Activate from the listings
        page when you&apos;re ready to be discoverable.
      </p>
    </form>
  );
}
