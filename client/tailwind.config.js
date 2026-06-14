/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#fdf8f3',
          100: '#f9ede0',
          200: '#f2d9bc',
          300: '#e8bd91',
          400: '#da9562',
          500: '#c45c26',
          600: '#b34d1e',
          700: '#8f3d17',
          800: '#733213',
          900: '#5e2a12',
        },
        forest: {
          50: '#f0f9f4',
          100: '#d8f0e5',
          200: '#b3e0cc',
          300: '#7ec9a8',
          400: '#4dab84',
          500: '#2d6a4f',
          600: '#256040',
          700: '#1d4d32',
          800: '#173d28',
          900: '#123221',
        },
        cream: '#fdf8f3',
        parchment: '#f5ead5',
        amber: {
          warm: '#f4a261',
          deep: '#e76f51',
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        warm: '0 4px 24px -4px rgba(196,92,38,0.15)',
        'warm-lg': '0 12px 40px -8px rgba(196,92,38,0.20)',
        card: '0 2px 12px -2px rgba(26,26,46,0.08), 0 1px 3px rgba(26,26,46,0.06)',
        'card-hover': '0 8px 28px -4px rgba(26,26,46,0.14), 0 2px 6px rgba(26,26,46,0.08)',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: 0 }, to: { opacity: 1 } },
        slideUp: { from: { opacity: 0, transform: 'translateY(12px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        pulseSoft: { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.6 } },
      },
    },
  },
  plugins: [],
};
