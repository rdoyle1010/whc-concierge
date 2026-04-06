import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/', '/talent/dashboard', '/employer/dashboard', '/hotel/dashboard'],
    },
    sitemap: 'https://talent.wellnesshousecollective.co.uk/sitemap.xml',
  }
}
