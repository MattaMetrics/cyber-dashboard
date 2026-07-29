/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: '#020617',
          cyan: '#38bdf8',
          blue: '#0ea5e9',
          glow: '#22d3ee',
        },
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['Orbitron', 'sans-serif'],
      },
      animation: {
        'pulse-heart': 'pulse-heart 0.85s ease-in-out infinite',
        'intake-pulse': 'intake-pulse 1s ease-in-out 4',
        'fade-in': 'fade-in 0.45s ease-out both',
        scan: 'scan 3s ease-in-out infinite',
        flicker: 'flicker 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-heart': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        'intake-pulse': {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.35' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scan: {
          '0%': { top: '0%' },
          '50%': { top: '100%' },
          '100%': { top: '0%' },
        },
        flicker: {
          '0%, 100%': { opacity: '1' },
          '92%': { opacity: '1' },
          '93%': { opacity: '0.4' },
          '94%': { opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
