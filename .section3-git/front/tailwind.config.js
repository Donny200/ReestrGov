export default {content: [
  './index.html',
  './src/**/*.{js,ts,jsx,tsx}'
],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f1f5f9',
          100: '#e2e8f0',
          200: '#c7d2e0',
          300: '#9aabc4',
          400: '#647fa4',
          500: '#3f5c86',
          600: '#2b456b',
          700: '#1e3557',
          800: '#152845',
          900: '#0d1b30',
          950: '#070f1c',
        },
        teal: {
          50: '#effcfa',
          100: '#d6f6f2',
          200: '#aeece6',
          300: '#79dbd5',
          400: '#45c2bf',
          500: '#1fa5a4',
          600: '#158485',
          700: '#14696b',
          800: '#145456',
          900: '#134647',
        },
        flag: {
          green: '#1eaf5b',
          blue: '#1a8fd1',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Manrope', 'Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(13, 27, 48, 0.04), 0 8px 24px -12px rgba(13, 27, 48, 0.12)',
        pop: '0 24px 60px -24px rgba(13, 27, 48, 0.35)',
      },
    },
  },
}
