import type { Config } from 'tailwindcss';

const token = (name: string) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: token('canvas'),
        surface: {
          DEFAULT: token('surface'),
          subtle: token('surface-subtle'),
          raised: token('surface-raised'),
          inverse: token('surface-inverse'),
        },
        content: {
          DEFAULT: token('content'),
          strong: token('content-strong'),
          muted: token('content-muted'),
          subtle: token('content-subtle'),
          inverse: token('content-inverse'),
        },
        line: { DEFAULT: token('line'), strong: token('line-strong') },
        brand: {
          DEFAULT: token('brand'),
          hover: token('brand-hover'),
          pressed: token('brand-pressed'),
          subtle: token('brand-subtle'),
          fg: token('brand-fg'),
        },
        accent: {
          DEFAULT: token('accent'),
          hover: token('accent-hover'),
          pressed: token('accent-pressed'),
          subtle: token('accent-subtle'),
        },
        link: token('link'),
        positive: token('positive'),
        warning: token('warning'),
        danger: token('danger'),
        info: token('info'),
        focus: token('focus'),
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      borderRadius: {
        control: '0.625rem',
        surface: '1rem',
        overlay: '1.25rem',
        card: '1.25rem',
        pill: '9999px',
      },
      boxShadow: {
        xs: '0 1px 2px 0 rgb(0 0 0 / 0.04)',
        card: '0 1px 2px rgb(0 0 0 / 0.04), 0 8px 24px -16px rgb(0 0 0 / 0.12)',
        surface: '0 1px 2px rgb(0 0 0 / 0.04), 0 10px 30px -20px rgb(0 0 0 / 0.14)',
        elevated: '0 12px 32px -14px rgb(0 0 0 / 0.22)',
        pop: '0 20px 50px -16px rgb(0 0 0 / 0.3)',
        overlay: '0 32px 80px -20px rgb(0 0 0 / 0.45)',
        glow: '0 0 0 1px rgb(var(--brand) / 0.25), 0 10px 40px -10px rgb(var(--brand) / 0.45)',
      },
      backgroundImage: {
        'brand-gradient': 'linear-gradient(135deg, rgb(var(--brand)) 0%, rgb(var(--accent)) 100%)',
        'brand-gradient-soft': 'linear-gradient(135deg, rgb(var(--brand) / 0.12) 0%, rgb(var(--accent) / 0.12) 100%)',
      },
      keyframes: {
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96) translateY(-4px)' },
          '100%': { opacity: '1', transform: 'scale(1) translateY(0)' },
        },
        shimmer: { '0%': { transform: 'translateX(-100%)' }, '100%': { transform: 'translateX(100%)' } },
        'pulse-ring': {
          '0%': { boxShadow: '0 0 0 0 rgb(var(--positive) / 0.55)' },
          '100%': { boxShadow: '0 0 0 6px rgb(var(--positive) / 0)' },
        },
      },
      animation: {
        'fade-up': 'fade-up 0.45s cubic-bezier(0.22, 1, 0.36, 1) both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'pop-in': 'pop-in 0.15s ease-out both',
        shimmer: 'shimmer 1.6s linear infinite',
        'pulse-ring': 'pulse-ring 1.8s ease-out infinite',
      },
      transitionDuration: { fast: '150ms', base: '220ms', slow: '320ms' },
      transitionTimingFunction: { spring: 'cubic-bezier(0.22, 1, 0.36, 1)' },
    },
  },
  plugins: [],
} satisfies Config;
