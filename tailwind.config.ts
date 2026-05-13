import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--bg-primary)',
        surface: {
          DEFAULT: 'var(--surface)',
          elevated: 'var(--surface-elevated)',
        },
        border: {
          subtle: 'var(--border-subtle)',
          strong: 'var(--border-strong)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          on: 'var(--accent-on)',
        },
        primary: 'var(--text-primary)',
        secondary: 'var(--text-secondary)',
        tertiary: 'var(--text-tertiary)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        info: 'var(--info)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'monospace'],
      },
      fontSize: {
        'display-xl': ['48px', { lineHeight: '1.1', fontWeight: '500' }],
        'display-lg': ['36px', { lineHeight: '1.15', fontWeight: '500' }],
        'h2': ['28px', { lineHeight: '1.25', fontWeight: '500' }],
        'h3': ['20px', { lineHeight: '1.35', fontWeight: '500' }],
        'body-lg': ['16px', { lineHeight: '1.55', fontWeight: '400' }],
        'body': ['14px', { lineHeight: '1.55', fontWeight: '400' }],
        'caption': ['12px', { lineHeight: '1.4', fontWeight: '500', letterSpacing: '0.05em' }],
        'code': ['13px', { lineHeight: '1.45', fontWeight: '400' }],
      },
      spacing: {
        '1': '4px',
        '2': '8px',
        '3': '12px',
        '4': '16px',
        '6': '24px',
        '8': '32px',
        '12': '48px',
        '16': '64px',
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        lg: '10px',
        xl: '12px',
        full: '999px',
      },
      transitionTimingFunction: {
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
      },
      transitionDuration: {
        '200': '200ms',
      },
    },
  },
  plugins: [],
};

export default config;
