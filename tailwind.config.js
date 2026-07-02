/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './features/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    screens: {
      xs: '420px',
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
    extend: {
      colors: {
        // Core surface palette (dark logistics theme)
        bg:      '#0a0e17',
        panel:   '#0e1420',
        panel2:  '#111827',
        panel3:  '#141d2e',
        line:    '#1f2d45',
        // Text
        text:    '#f1f5f9',
        muted:   '#64748b',
        muted2:  '#475569',
        // Accent
        gold:    '#f59e0b',
        green:   '#10b981',
        red:     '#ef4444',
        blue:    '#3b82f6',
        purple:  '#8b5cf6',
        cyan:    '#06b6d4',
        reddark: '#7f1d1d',
      },
      fontFamily: {
        sans:  ['Inter', 'system-ui', 'sans-serif'],
        mono:  ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'fade-up':   'fadeUp 0.3s ease-out',
        'kpi-entry': 'kpiEntry 0.4s ease-out',
        'skeleton':  'skeleton 1.5s ease-in-out infinite',
      },
      keyframes: {
        fadeUp:   { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        kpiEntry: { from: { opacity: '0', transform: 'scale(0.97)' },     to: { opacity: '1', transform: 'scale(1)' } },
        skeleton: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.4' } },
      },
    },
  },
  plugins: [],
};
