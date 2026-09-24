const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        canvas: token('color-canvas'),
        surface: {
          DEFAULT: token('color-surface'),
          subtle: token('color-surface-subtle'),
          raised: token('color-surface-raised'),
          inverse: token('color-surface-inverse'),
        },
        content: {
          DEFAULT: token('color-content'),
          strong: token('color-content-strong'),
          muted: token('color-content-muted'),
          subtle: token('color-content-subtle'),
          inverse: token('color-content-inverse'),
        },
        line: {
          DEFAULT: token('color-line'),
          strong: token('color-line-strong'),
        },
        brand: {
          DEFAULT: token('color-brand'),
          hover: token('color-brand-hover'),
          pressed: token('color-brand-pressed'),
          subtle: token('color-brand-subtle'),
        },
        accent: {
          DEFAULT: token('color-accent'),
          hover: token('color-accent-hover'),
          pressed: token('color-accent-pressed'),
          subtle: token('color-accent-subtle'),
        },
        positive: token('color-positive'),
        warning: token('color-warning'),
        danger: token('color-danger'),
        info: token('color-info'),
        focus: token('color-focus'),
        navy: {
          50: '#f1f0ee',
          100: '#e6e5e2',
          200: '#d2d0cb',
          300: '#b6b6b2',
          400: '#8d8d8d',
          500: '#6e6e6c',
          600: '#454543',
          700: '#2b2b2a',
          800: '#171717',
          900: '#0a0a0a',
          950: '#050505',
        },
        teal: {
          50: '#fff7f1',
          100: '#faede3',
          200: '#f3d9c6',
          300: '#e9b997',
          400: '#d99362',
          500: '#b15f2c',
          600: '#97501f',
          700: '#7a4119',
          800: '#5d3216',
          900: '#452510',
        },
        flag: {
          green: '#1eaf5b',
          blue: '#1a8fd1',
        },
      },
      fontFamily: {
        sans: ['Onest', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Onest', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        control: '0.875rem',
        surface: '1.25rem',
        overlay: '1.5rem',
        card: '2rem',
        pill: '9999px',
      },
      boxShadow: {
        card: '0 1px 2px rgba(10, 10, 10, 0.04), 0 16px 34px -22px rgba(10, 10, 10, 0.26)',
        pop: '0 24px 60px -24px rgba(10, 10, 10, 0.36)',
        surface: '0 1px 2px rgba(10, 10, 10, 0.04), 0 10px 26px -20px rgba(10, 10, 10, 0.16)',
        elevated: '0 18px 42px -20px rgba(10, 10, 10, 0.24)',
        overlay: '0 28px 72px -24px rgba(10, 10, 10, 0.42)',
      },
      transitionDuration: {
        fast: '160ms',
        base: '220ms',
        slow: '280ms',
      },
    },
  },
};
