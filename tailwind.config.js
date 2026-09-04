/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // WHC brand: a neutral grey scale, dark to mid, on off-white.
        // Manrope + Poppins. Grey is the brand colour - never navy, and
        // never warmed towards brown. Gold is a detail only (logo mark,
        // verified badge, hairlines), never a button or a background.
        ink: '#1c1c1c',
        body: '#3a3a3a',
        muted: '#6b6b6b',
        secondary: '#555555',
        surface: '#f1f1f1',
        stone: '#e7e7e7',
        border: '#dddddd',
        parchment: '#f7f7f7',
        accent: '#1c1c1c',
        success: '#22C55E',
        gold: { DEFAULT: '#b39a6b', light: '#c9b68f', dark: '#96804f' },
        navy: { DEFAULT: '#1c1c1c', light: '#333333', dark: '#0f0f0f' },
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
