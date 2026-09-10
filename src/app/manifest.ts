import type { MetadataRoute } from 'next'

// What a phone reads when somebody adds the site to their home screen.
//
// Without this, "Add to Home Screen" saves a screenshot of whatever page they
// were on under a truncated page title, and Android never offers to install at
// all. With it they get the monogram, the platform's name, and the charcoal
// carried through the splash screen and the address bar.
//
// Deliberately no service worker. The offline half of this belongs in the
// native app, and a service worker on a site where adverts expire and prices
// change is the fastest route to somebody being shown last week's version of a
// page with no way to explain why.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Talent House Collective',
    // What fits under an icon on a home screen. Twelve characters is roughly
    // where Android starts cutting, and a truncated name looks like a bug.
    short_name: 'Talent House',
    description: 'The professional platform for spa and wellness careers.',
    start_url: '/',
    // Standalone rather than fullscreen: the platform is a site people move
    // around, and taking the back gesture away from them to save a status bar
    // is a bad trade.
    display: 'standalone',
    background_color: '#f1f1f1',
    theme_color: '#1c1c1c',
    orientation: 'portrait',
    categories: ['business', 'productivity'],
    lang: 'en-GB',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      // Cropped by the launcher to a circle, a squircle or a rounded square
      // depending on the phone. The mark is drawn smaller so none of it is cut.
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    shortcuts: [
      { name: 'Browse roles', short_name: 'Roles', url: '/jobs' },
      { name: 'Academy', short_name: 'Academy', url: '/academy' },
    ],
  }
}
