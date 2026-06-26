/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        /* MongoDB green scale — Forest → Leaf */
        brand: {
          50:  '#E3FCF7',
          100: '#C0EFE3',
          200: '#8FDDC8',
          300: '#56C9AB',
          400: '#00A35C',
          500: '#00684A',
          600: '#005a3f',
          700: '#004d35',
          800: '#023430',
          900: '#001E2B',
        },
        /* Kept as warm secondary for impact/urgency contexts */
        forest: {
          50:  '#f0f9f4',
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
        /* MongoDB Leaf — used as vivid accent only */
        leaf: '#00ED64',
        mist: '#E3FCF7',
        cream: '#fdf8f3',
        parchment: '#f5ead5',
        amber: {
          warm: '#f4a261',
          deep: '#e76f51',
        },
      },
      borderRadius: {
        /* MongoDB uses tighter radius than typical SaaS */
        DEFAULT: '6px',
        sm: '4px',
        md: '6px',
        lg: '8px',
        xl: '10px',
        '2xl': '12px',
        '3xl': '16px',
        '4xl': '20px',
        full: '9999px',
      },
      boxShadow: {
        warm:  '0 4px 24px -4px rgba(0,104,74,0.18)',
        'warm-lg': '0 12px 40px -8px rgba(0,104,74,0.22)',
        card:  '0 1px 4px rgba(0,30,43,0.08), 0 0 0 1px rgba(0,30,43,0.06)',
        'card-hover': '0 8px 32px rgba(0,30,43,0.14), 0 0 0 1px rgba(0,30,43,0.09)',
        'card-lift':  '0 16px 48px rgba(0,30,43,0.18), 0 4px 12px rgba(0,30,43,0.10)',
        atlas: '0 2px 8px rgba(0,30,43,0.14)',
        'glow-brand': '0 0 24px rgba(0,104,74,0.25)',
      },
      animation: {
        'fade-in':     'fadeIn 0.2s ease-out',
        'slide-up':    'slideUp 0.25s cubic-bezier(0.16,1,0.3,1)',
        'slide-in-left':'slideInLeft 0.25s cubic-bezier(0.16,1,0.3,1)',
        'scale-in':    'scaleIn 0.18s cubic-bezier(0.16,1,0.3,1)',
        'pulse-soft':  'pulseSoft 2s ease-in-out infinite',
        'shimmer':     'shimmer 1.8s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:      { from: { opacity: 0 },              to: { opacity: 1 } },
        slideUp:     { from: { opacity: 0, transform: 'translateY(8px)' },  to: { opacity: 1, transform: 'translateY(0)' } },
        slideInLeft: { from: { opacity: 0, transform: 'translateX(-6px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        scaleIn:     { from: { opacity: 0, transform: 'scale(0.97)' },      to: { opacity: 1, transform: 'scale(1)' } },
        pulseSoft:   { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.5 } },
        shimmer:     { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
