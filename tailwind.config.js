/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0a0a0a',
        body: '#4a4a4a',
        muted: '#999999',
        secondary: '#666666',
        surface: '#fafafa',
        border: '#e5e5e5',
        parchment: '#ffffff',
        gold: { DEFAULT: '#0a0a0a', light: '#1a1a1a', dark: '#000000' },
        navy: { DEFAULT: '#0a0a0a', light: '#1a1a1a', dark: '#000000' },
        match: {
          perfect: { bg: '#dcfce7', text: '#166534' },
          strong: { bg: '#dbeafe', text: '#1e40af' },
          good: { bg: '#fef9c3', text: '#854d0e' },
          partial: { bg: '#f3f4f6', text: '#374151' },
        },
      },
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        serif: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        eyebrow: ['11px', { letterSpacing: '0.08em', lineHeight: '1.4' }],
      },
    },
  },
  plugins: [],
}
