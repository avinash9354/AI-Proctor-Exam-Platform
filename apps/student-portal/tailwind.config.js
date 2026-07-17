/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] },
      colors: {
        bg: { primary: '#0a0e1a', secondary: '#0f1629', card: '#141d33' },
        border: { DEFAULT: '#1e2d50', glow: '#3b5bdb' },
        accent: { blue: '#4c7ef3', purple: '#7c3aed', green: '#10b981', amber: '#f59e0b', red: '#ef4444' },
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      keyframes: {
        glow: { from: { boxShadow: '0 0 10px rgba(76,126,243,0.2)' }, to: { boxShadow: '0 0 20px rgba(76,126,243,0.4)' } },
      },
    },
  },
  plugins: [],
};
