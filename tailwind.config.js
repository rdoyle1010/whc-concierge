/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // WHC brand: navy ink and accent on white, soft grey surfaces,
        // Manrope + Poppins. Navy is the brand colour - never black.
        ink: '#10283b',
        body: '#3d4b57',
        muted: '#6b7580',
        secondary: '#5a6a76',
        surface: '#f5f6f8',
        border: '#e3e7eb',
        parchment: '#ffffff',
        accent: '#0b2f4d',
        success: '#22C55E',
        gold: { DEFAULT: '#0b2f4d', light: '#315675', dark: '#07243b' },
        navy: { DEFAULT: '#0b2f4d', light: '#123f64', dark: '#07243b' },
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
