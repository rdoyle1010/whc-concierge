/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // WHC brand: monochrome editorial - black ink, white ground, soft
        // grey surfaces. Matches wellnesshousecollective.co.uk.
        ink: '#1a1a1a',
        body: '#3d3d3d',
        muted: '#8a8a8a',
        secondary: '#555555',
        surface: '#f5f5f5',
        border: '#e5e5e5',
        parchment: '#ffffff',
        accent: '#111111',
        success: '#22C55E',
        gold: { DEFAULT: '#111111', light: '#333333', dark: '#000000' },
        navy: { DEFAULT: '#111111', light: '#333333', dark: '#000000' },
        match: {
          perfect: { bg: '#dcfce7', text: '#166534' },
          strong: { bg: '#dbeafe', text: '#1e40af' },
          good: { bg: '#fef9c3', text: '#854d0e' },
          partial: { bg: '#f3f4f6', text: '#374151' },
        },
      },
      fontFamily: {
        sans: ['var(--font-poppins)', 'Poppins', 'Segoe UI', 'sans-serif'],
        // The platform's display face is Manrope, as on the main WHC site.
        // Legacy font-serif usages resolve to it so nothing looks templated.
        serif: ['var(--font-manrope)', 'Manrope', 'Segoe UI', 'sans-serif'],
      },
      fontSize: { eyebrow: ['11px', { letterSpacing: '0.08em', lineHeight: '1.4' }] },
    },
  },
  plugins: [],
}
