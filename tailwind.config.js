/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        // WHC brand: charcoal ink and accent on warm white, stone surfaces,
        // Manrope + Poppins. Charcoal is the brand colour - never navy.
        // Gold is a detail only (logo mark, verified badge, hairlines),
        // never a button or a background.
        ink: '#1c1b1a',
        body: '#3a3835',
        muted: '#6e6a66',
        secondary: '#57534e',
        surface: '#f3f0eb',
        stone: '#e9e4dd',
        border: '#e0dad2',
        parchment: '#f7f5f2',
        accent: '#1c1b1a',
        success: '#22C55E',
        gold: { DEFAULT: '#b39a6b', light: '#c9b68f', dark: '#96804f' },
        navy: { DEFAULT: '#1c1b1a', light: '#33302d', dark: '#0f0e0d' },
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
