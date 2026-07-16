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
        scan: 'scan 3s linear infinite',
        flicker: 'flicker 4s ease-in-out infinite',
      },
      keyframes: {
        'pulse-heart': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
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
