/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#10283b',
        body: '#4f5d67',
        muted: '#8a949b',
        secondary: '#65717a',
        surface: '#f3f1ec',
        border: '#ddd9d1',
        parchment: '#f8f6f1',
        accent: '#C9A96E',
        success: '#22C55E',
        gold: { DEFAULT: '#C9A96E', light: '#D4B87E', dark: '#B8945A' },
        navy: { DEFAULT: '#0b2f4d', light: '#123f64', dark: '#07243b' },
        match: {
          perfect: { bg: '#dcfce7', text: '#166534' },
          strong: { bg: '#dbeafe', text: '#1e40af' },
          good: { bg: '#fef9c3', text: '#854d0e' },
          partial: { bg: '#f3f4f6', text: '#374151' },
        },
      },
      fontFamily: {
        sans: ['var(--font-manrope)', 'Manrope', 'Segoe UI', 'sans-serif'],
        // Legacy font-serif classes still exist in older screens. Mapping
        // them to Manrope removes the old serif without risking functional
        // changes across the large route set.
        serif: ['var(--font-manrope)', 'Manrope', 'Segoe UI', 'sans-serif'],
      },
      fontSize: { eyebrow: ['11px', { letterSpacing: '0.08em', lineHeight: '1.4' }] },
    },
  },
  plugins: [],
}
