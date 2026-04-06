const BASE_URL = 'https://talent.wellnesshousecollective.co.uk'

const PUBLISHER = {
  '@type': 'Organization',
  name: 'WHC Concierge',
  url: BASE_URL,
  logo: {
    '@type': 'ImageObject',
    url: `${BASE_URL}/images/whc-logo.jpg`,
  },
}

export function generateBlogJsonLd({ title, slug, excerpt, category, publishedAt, updatedAt, authorName }: {
  title: string
  slug: string
  excerpt?: string
  category?: string
  publishedAt: string
  updatedAt?: string
  authorName?: string
}) {
  const url = `${BASE_URL}/blog/${slug}`

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description: excerpt || '',
    author: {
      '@type': 'Organization',
      name: authorName || 'WHC Concierge',
      url: BASE_URL,
    },
    publisher: PUBLISHER,
    datePublished: new Date(publishedAt).toISOString(),
    dateModified: updatedAt ? new Date(updatedAt).toISOString() : new Date(publishedAt).toISOString(),
    url,
    mainEntityOfPage: { '@type': 'WebPage', '@id': url },
    ...(category ? { articleSection: category } : {}),
  }
}
