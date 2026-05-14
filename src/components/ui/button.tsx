import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '@/lib/utils';

// Hover behaviour per ux-design §8.1: 200ms · ease-out-expo · 4px translateY lift
// on filled / outlined buttons. Ghost + link don't lift (they're tertiary and
// shouldn't pull weight visually). motion-safe: prefix respects §8.4 reduced-motion.
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded font-medium transition duration-200 ease-out-expo focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 disabled:pointer-events-none disabled:opacity-50 active:translate-y-0 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default:
          'bg-accent text-accent-on shadow-sm hover:bg-accent/90 motion-safe:hover:-translate-y-1 hover:shadow-md hover:shadow-accent/20',
        outline:
          'border border-border-strong bg-transparent text-primary hover:bg-surface-elevated motion-safe:hover:-translate-y-1',
        ghost: 'text-secondary hover:bg-surface-elevated hover:text-primary',
        destructive:
          'border border-danger/30 bg-danger/10 text-danger hover:bg-danger/20 motion-safe:hover:-translate-y-1',
        link: 'text-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 text-body [&_svg]:size-5',
        sm: 'h-8 px-3 text-body [&_svg]:size-4',
        lg: 'h-12 px-6 text-body-lg [&_svg]:size-5',
        icon: 'size-10 [&_svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
