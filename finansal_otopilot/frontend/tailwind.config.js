/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        accent: {
          mint: '#10b981',
          rose: '#f43f5e',
          amber: '#f59e0b',
          sky: '#0ea5e9',
          violet: '#8b5cf6',
          pink: '#ec4899',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'soft':   '0 1px 2px rgba(15,23,42,0.04), 0 4px 16px -4px rgba(15,23,42,0.06)',
        'glow-indigo': '0 0 24px rgba(99,102,241,0.35)',
        'glow-mint':   '0 0 24px rgba(16,185,129,0.35)',
        'glow-rose':   '0 0 24px rgba(244,63,94,0.35)',
        'glow-violet': '0 0 24px rgba(139,92,246,0.4)',
      },
      animation: {
        'float-soft': 'float-soft 3.5s ease-in-out infinite',
        'pulse-dot':  'pulse-dot 2s ease-in-out infinite',
        'fade-in-up': 'fade-in-up 0.5s ease-out both',
        'scale-in':   'scale-in 0.3s ease-out both',
        'slide-in-right': 'slide-in-right 0.4s ease-out both',
      },
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
};
