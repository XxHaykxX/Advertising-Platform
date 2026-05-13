'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import {
  channelTypeAllValues,
  channelTypeLabels,
} from '@/lib/validation/company';

import { updateListing, type ListingActionState } from '../../_actions';

const initialState: ListingActionState = { ok: true };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-caption text-danger">{message}</p>;
}

interface EditListingFormProps {
  listingId: string;
  defaults: {
    title: string;
    channelType: string;
    sourceChannelName: string;
    availableFrom: string;
    availableTo: string;
    description: string;
    ageRange: string;
    dailyReach: number | null;
    region: string;
  };
  disabled?: boolean;
  justCreated?: boolean;
}

export function EditListingForm({
  listingId,
  defaults,
  disabled,
  justCreated,
}: EditListingFormProps) {
  const boundAction = updateListing.bind(null, listingId);
  const [state, action] = useFormState(boundAction, initialState);

  return (
    <form action={action} className="flex flex-col gap-6">
      {justCreated && !state.formError && !state.fieldErrors ? (
        <p className="rounded border border-accent/30 bg-accent/10 p-3 text-body text-primary">
          Listing created as draft. Edit the details below, then publish when
          you&apos;re ready.
        </p>
      ) : null}

      {state.ok && !state.formError && !state.fieldErrors && !justCreated ? (
        <p className="rounded border border-accent/30 bg-accent/10 p-3 text-body text-primary">
          Saved.
        </p>
      ) : null}

      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}

      <fieldset disabled={disabled} className="flex flex-col gap-6">
        <div>
          <label
            htmlFor="title"
            className="mb-1.5 block text-caption uppercase text-tertiary"
          >
            Listing title
          </label>
          <Input id="title" name="title" defaultValue={defaults.title} required />
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
              defaultValue={defaults.channelType}
              className="flex h-10 w-full rounded border border-border-subtle bg-surface px-3 text-body text-primary focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              {channelTypeAllValues.map((c) => (
                <option key={c} value={c}>
                  {channelTypeLabels[c]}
                </option>
              ))}
            </select>
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
              defaultValue={defaults.sourceChannelName}
              required
            />
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
            <Input
              id="availableFrom"
              name="availableFrom"
              type="date"
              defaultValue={defaults.availableFrom}
              required
            />
          </div>
          <div>
            <label
              htmlFor="availableTo"
              className="mb-1.5 block text-caption uppercase text-tertiary"
            >
              Available to
            </label>
            <Input
              id="availableTo"
              name="availableTo"
              type="date"
              defaultValue={defaults.availableTo}
              required
            />
            <FieldError message={state.fieldErrors?.availableTo} />
          </div>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-caption uppercase text-tertiary">Audience</legend>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div>
              <label
                htmlFor="ageRange"
                className="mb-1.5 block text-caption text-tertiary"
              >
                Age range
              </label>
              <Input id="ageRange" name="ageRange" defaultValue={defaults.ageRange} />
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
                min={0}
                defaultValue={defaults.dailyReach ?? ''}
              />
            </div>
            <div>
              <label
                htmlFor="region"
                className="mb-1.5 block text-caption text-tertiary"
              >
                Region
              </label>
              <Input id="region" name="region" defaultValue={defaults.region} />
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
            defaultValue={defaults.description}
            className="flex w-full rounded border border-border-subtle bg-surface px-3 py-2 text-body text-primary placeholder:text-tertiary focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
          />
          <FieldError message={state.fieldErrors?.description} />
        </div>

        <SubmitButton size="lg" pendingLabel="Saving…" className="w-fit">
          Save changes
        </SubmitButton>
      </fieldset>
    </form>
  );
}
