'use client';

import * as React from 'react';
import { useFormState } from 'react-dom';

import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

import {
  submitInquiry,
  type InquirySubmitActionState,
} from '../_actions';

const initialState: InquirySubmitActionState = { ok: true };

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-caption text-danger">{message}</p>;
}

interface InquiryFormProps {
  listingId?: string;
  publisherCompanyId: string;
}

export function InquiryForm({ listingId, publisherCompanyId }: InquiryFormProps) {
  const [rawState, action] = useFormState(submitInquiry, initialState);
  const state = rawState ?? initialState;

  return (
    <form action={action} className="flex flex-col gap-6">
      {listingId ? (
        <input type="hidden" name="listingId" value={listingId} />
      ) : null}
      <input type="hidden" name="publisherCompanyId" value={publisherCompanyId} />

      {state.formError ? (
        <p className="rounded border border-danger/30 bg-danger/10 p-3 text-body text-danger">
          {state.formError}
        </p>
      ) : null}

      <div>
        <label
          htmlFor="campaignGoal"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Campaign goal
        </label>
        <textarea
          id="campaignGoal"
          name="campaignGoal"
          rows={5}
          minLength={20}
          maxLength={3000}
          required
          placeholder="What are you trying to achieve, who's the audience, any deal-breakers…"
          className="flex w-full rounded border border-border-subtle bg-surface px-3 py-2 text-body text-primary placeholder:text-tertiary focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        />
        <FieldError message={state.fieldErrors?.campaignGoal} />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-caption uppercase text-tertiary">
          Desired dates (optional)
        </legend>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="desiredDateFrom"
              className="mb-1.5 block text-caption text-tertiary"
            >
              From
            </label>
            <Input id="desiredDateFrom" name="desiredDateFrom" type="date" />
            <FieldError message={state.fieldErrors?.desiredDateFrom} />
          </div>
          <div>
            <label
              htmlFor="desiredDateTo"
              className="mb-1.5 block text-caption text-tertiary"
            >
              To
            </label>
            <Input id="desiredDateTo" name="desiredDateTo" type="date" />
            <FieldError message={state.fieldErrors?.desiredDateTo} />
          </div>
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-caption uppercase text-tertiary">
          Budget (private — only our team sees it)
        </legend>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
          <div>
            <label
              htmlFor="budgetRangeLow"
              className="mb-1.5 block text-caption text-tertiary"
            >
              From (USD)
            </label>
            <Input
              id="budgetRangeLow"
              name="budgetRangeLow"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="500"
            />
            <FieldError message={state.fieldErrors?.budgetRangeLow} />
          </div>
          <div>
            <label
              htmlFor="budgetRangeHigh"
              className="mb-1.5 block text-caption text-tertiary"
            >
              To (USD)
            </label>
            <Input
              id="budgetRangeHigh"
              name="budgetRangeHigh"
              type="number"
              inputMode="numeric"
              min={0}
              placeholder="2000"
            />
            <FieldError message={state.fieldErrors?.budgetRangeHigh} />
          </div>
        </div>
      </fieldset>

      <div>
        <label
          htmlFor="notes"
          className="mb-1.5 block text-caption uppercase text-tertiary"
        >
          Anything else (optional)
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          maxLength={3000}
          className="flex w-full rounded border border-border-subtle bg-surface px-3 py-2 text-body text-primary placeholder:text-tertiary focus-visible:border-border-strong focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
        />
        <FieldError message={state.fieldErrors?.notes} />
      </div>

      <SubmitButton size="lg" pendingLabel="Sending…" className="w-full">
        Send inquiry
      </SubmitButton>

      <p className="text-caption text-tertiary">
        Our team responds within 4 business hours. You&apos;ll see the
        conversation in <strong>My inquiries</strong>.
      </p>
    </form>
  );
}
