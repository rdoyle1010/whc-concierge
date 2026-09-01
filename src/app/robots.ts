import { MetadataRoute } from 'next'

// The one robots source.
//
// There were two: this generated route and a static public/robots.txt. In the
// App Router the static file wins silently, so this file was dead and the
// rules nobody had reviewed were the ones actually being served. The static
// file is deleted; this is now the only place the rules live, which means
// they are versioned, reviewable and testable.
//
// What is disallowed, and why:
//   - the three signed-in workspaces and the legacy /hotel routes: private,
//     and every one of them redirects an anonymous crawler to /login anyway,
//     so crawling them produces nothing but duplicates of the sign-in page
//   - /api: nothing there is meant to be indexed
//   - the authentication and recovery pages: thin and duplicate, and indexing
//     a password-reset screen helps nobody
//   - /verify and /certificates: a certificate check is a private act between
//     the holder and whoever they showed it to, and the codes should not be
//     enumerable from a search index
//   - /coming-soon: an unfinished page that must never outrank a real one
export default function robots(): MetadataRoute.Robots {
  const base = 'https://talent.wellnesshousecollective.co.uk'
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/talent/',
        '/employer/',
        '/hotel/',
        '/api/',
        '/login',
        '/register/',
        '/forgot-password',
        '/reset-password',
        '/mfa-challenge',
        '/verify/',
        '/certificates/',
        '/coming-soon',
      ],
    },
    sitemap: `${base}/sitemap.xml`,
    host: base,
  }
}
