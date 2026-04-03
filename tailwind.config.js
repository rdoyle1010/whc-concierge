/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#000000',
        parchment: '#FFFFFF',
        muted: '#F5F5F5',
        stone: '#E5E5E5',
        warm: '#9CA3AF',
        navy: {
          DEFAULT: '#1a1a2e',
          light: '#2d2d44',
          dark: '#0f0f1a',
        },
        gold: {
          DEFAULT: '#000000',
          light: '#1a1a1a',
          dark: '#000000',
        },
      },
      fontFamily: {
        serif: ['Inter', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
