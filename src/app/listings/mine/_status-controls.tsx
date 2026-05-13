'use client';

import * as React from 'react';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';
import {
  allowedListingTransitions,
  type ListingStatusInput,
} from '@/lib/validation/listing';

import { changeListingStatus } from '../_actions';

const transitionLabels: Record<ListingStatusInput, string> = {
  DRAFT: 'Make draft',
  ACTIVE: 'Publish',
  PAUSED: 'Pause',
  CLOSED: 'Close',
};

interface ListingStatusControlsProps {
  listingId: string;
  status: ListingStatusInput;
}

export function ListingStatusControls({ listingId, status }: ListingStatusControlsProps) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);

  const moves = allowedListingTransitions[status];
  if (moves.length === 0 && status !== 'CLOSED') return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {moves.map((next) => (
        <Button
          key={next}
          size="sm"
          variant={next === 'CLOSED' ? 'destructive' : next === 'ACTIVE' ? 'default' : 'outline'}
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await changeListingStatus(listingId, next);
              if (!res.ok) setError(res.error ?? 'Could not change status');
            });
          }}
        >
          {pending ? 'Working…' : transitionLabels[next]}
        </Button>
      ))}
      {status === 'CLOSED' ? (
        <span className="text-caption text-tertiary">Closed listings are final.</span>
      ) : null}
      {error ? <span className="text-caption text-danger">{error}</span> : null}
    </div>
  );
}
