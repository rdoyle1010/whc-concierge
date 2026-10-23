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
        // Ivory, forest, stone, charcoal. No metal.
        //
        // Nine shades of grey with accent set to the same value as ink, which
        // is to say no accent at all. That is the palette this replaces, and
        // it is why the site read as an unstyled admin tool rather than as
        // something a five-star spa would buy from.
        //
        // The ratio is the mechanism, not the colours. Roughly sixty-five per
        // cent ivory, twenty forest or charcoal, ten taupe and sage, and the
        // rest white. A palette without a ratio still ends up looking cheap,
        // because everything gets painted.
        //
        // There is deliberately no fifth accent. Brass was proposed and
        // measured at 2.89:1 on the ivory, which fails as text, fails as a
        // button and fails as an icon, and white on a brass button is 3.2:1
        // where 4.5 is the floor. It also puts the page back in the exact
        // cluster a spa director has seen a hundred times this year: cream
        // ground, serif headline, warm metallic rule. Forest does the accent
        // work at 11.99:1 and asks for nothing.
        ink: '#222321',
        body: '#3a3832',
        muted: '#6e6a60',
        secondary: '#57544c',
        surface: '#ede8df',
        stone: '#e3dcd1',
        border: '#dcd4c8',
        parchment: '#f6f3ed',
        accent: '#28322b',
        // Warm taupe and muted sage. Decoration only, and the readiness check
        // named after them enforces it: 2.10:1 and 2.99:1 on the ivory, so a
        // sentence written in either is a sentence somebody cannot read. They
        // are for hairlines, fills behind dark type, and quiet detail.
        taupe: '#b5a898',
        sage: '#879080',
        // The large dark bands. Forest rather than a near-black, because a
        // full-bleed surface at the value of body text reads as a hole in the
        // page rather than as a material: there is nothing for the eye to
        // place it against. Ivory on this is 11.99:1 and white is 13.28:1.
        charcoal: '#28322b',
        success: '#22C55E',
        // No gold, and no brass, which is the same thing wearing a better
        // name. It was declared here and used nowhere for the life of the
        // project, and the one time it was used, on an underline, it made the
        // page look like every AI-generated luxury landing page there is.
        navy: { DEFAULT: '#222321', light: '#3a4239', dark: '#161814' },
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
        // A serif that is actually a serif.
        //
        // This mapped to Manrope, which is a sans, so every price on the
        // shop rendered in the body face one weight lighter. Cormorant
        // Garamond was already being downloaded on every page and used by
        // one CMS token, so the editorial voice was paid for and never
        // heard.
        serif: ['var(--font-editorial)', 'Cormorant Garamond', 'Georgia', 'serif'],
      },
      fontSize: { eyebrow: ['11px', { letterSpacing: '0.08em', lineHeight: '1.4' }] },
    },
  },
  plugins: [],
}
