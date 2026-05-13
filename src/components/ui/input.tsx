import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded border border-border-subtle bg-surface px-3 text-body text-primary placeholder:text-tertiary',
          'transition-colors duration-200 ease-out-expo',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 focus-visible:border-border-strong',
          'disabled:cursor-not-allowed disabled:opacity-50',
          'file:border-0 file:bg-transparent file:text-body file:font-medium',
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
