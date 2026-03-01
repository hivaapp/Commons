import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Söhne', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        commons: {
          bg: '#FAF9F7',
          surface: '#FFFFFF',
          surfaceAlt: '#F3F1EC',
          border: '#E6E2D9',
          text: '#21201C',
          textMid: '#6B6860',
          textLight: '#AAA49C',
          brand: '#D97757',
          brandHover: '#C4663F',
          brandTint: '#FAF0EB',
          success: '#417A55',
          successBg: '#EBF5EE',
          warning: '#A0622A',
          warningBg: '#FDF4EC',
          error: '#C0392B',
          errorBg: '#FDECEA',
        },
      },
      maxWidth: {
        prose: '800px',
      },
      keyframes: {
        'slide-up': {
          from: { transform: 'translateY(100%)' },
          to: { transform: 'translateY(0)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateX(100%)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'toast-out': {
          from: { opacity: '1', transform: 'translateX(0)' },
          to: { opacity: '0', transform: 'translateX(100%)' },
        },
      },
      animation: {
        'slide-up': 'slide-up 0.25s ease-out',
        'slide-down': 'slide-down 0.2s ease-out',
        'toast-in': 'toast-in 0.25s ease-out',
        'toast-out': 'toast-out 0.2s ease-in forwards',
      },
    },
  },
  plugins: [],
};

export default config;
