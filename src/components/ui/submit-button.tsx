'use client';

import * as React from 'react';
import { useFormStatus } from 'react-dom';

import { Button, type ButtonProps } from '@/components/ui/button';

interface SubmitButtonProps extends Omit<ButtonProps, 'type'> {
  /** Label rendered while the form action is pending. */
  pendingLabel?: string;
}

export function SubmitButton({
  children,
  disabled,
  pendingLabel,
  ...rest
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} {...rest}>
      {pending && pendingLabel ? pendingLabel : children}
    </Button>
  );
}
