import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

// tailwind-merge needs to know about our custom font-size utilities
// (text-display-xl, text-body, text-caption, ...) — otherwise it treats them
// as text-color classes and silently strips real colors that share the same
// merge group (e.g. text-accent-on on a button that also sets text-body).
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: [
            'display-xl',
            'display-lg',
            'h2',
            'h3',
            'body-lg',
            'body',
            'caption',
            'code',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
