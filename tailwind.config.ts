import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        surface: 'rgb(var(--surface-rgb, 248 250 252) / <alpha-value>)',
        accent: 'rgb(var(--accent-rgb, 6 182 212) / <alpha-value>)',
        background: 'rgb(var(--background-rgb, 3 4 7) / <alpha-value>)',
        success: 'rgb(var(--success-rgb, 16 185 129) / <alpha-value>)',
        error: 'rgb(var(--error-rgb, 244 63 94) / <alpha-value>)',
        muted: 'rgb(var(--muted-rgb, 148 163 184) / <alpha-value>)',
        brand: {
          50: '#f5f7ff',
          100: '#e8edff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#090a0f',
        },
        cyber: {
          black: '#050608',
          dark: '#0a0d14',
          card: '#0e131f',
          border: '#1e293b',
          glow: '#06b6d4',
          emerald: '#10b981',
          purple: '#a855f7',
        }
      },
      boxShadow: {
        soft: '0 20px 45px -20px rgba(15, 23, 42, 0.25)',
        cyber: '0 0 25px -5px rgba(6, 182, 212, 0.25)',
        'cyber-emerald': '0 0 25px -5px rgba(16, 185, 129, 0.25)',
        'cyber-glow': '0 0 35px 0px rgba(255, 255, 255, 0.15)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 8s linear infinite',
        'glow-pulse': 'glowPulse 2s ease-in-out infinite alternate',
      },
      keyframes: {
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(1000%)' },
        },
        glowPulse: {
          '0%': { boxShadow: '0 0 15px rgba(6, 182, 212, 0.2)' },
          '100%': { boxShadow: '0 0 30px rgba(6, 182, 212, 0.6)' },
        }
      }
    },
  },
  plugins: [],
} satisfies Config;
