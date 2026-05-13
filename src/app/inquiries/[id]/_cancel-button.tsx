'use client';

import * as React from 'react';
import { useTransition } from 'react';

import { Button } from '@/components/ui/button';

import { cancelInquiry } from '../_actions';

export function CancelInquiryButton({ inquiryId }: { inquiryId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = React.useState<string | null>(null);
  const [confirming, setConfirming] = React.useState(false);

  if (!confirming) {
    return (
      <div>
        <Button variant="destructive" onClick={() => setConfirming(true)}>
          Cancel inquiry
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-danger/30 bg-danger/10 p-5">
      <p className="text-body text-primary">
        Cancelling tells our team to stop working on this. Are you sure?
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="destructive"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const res = await cancelInquiry(inquiryId);
              if (!res.ok) setError(res.error ?? 'Could not cancel');
              else setConfirming(false);
            });
          }}
        >
          {pending ? 'Cancelling…' : 'Yes, cancel it'}
        </Button>
        <Button variant="ghost" onClick={() => setConfirming(false)} disabled={pending}>
          Keep it
        </Button>
      </div>
      {error ? <p className="text-caption text-danger">{error}</p> : null}
    </div>
  );
}
