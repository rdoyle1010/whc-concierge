import type { FeaturedCard } from '@/lib/newsletter-blocks'

// How a profile row becomes a card. Shared so the admin preview builds the
// same card from the same fields the send will use - the preview used to
// invent its own placeholder, which is why featuring somebody looked broken.

const SITE = 'https://talenthousecollective.co.uk'

export function candidateCard(row: any): FeaturedCard {
  return {
    image: row.profile_image_url || '',
    title: row.full_name || 'Professional',
    subtitle: `${row.headline || row.role_level || 'Wellness professional'}${row.hourly_rate ? ` · £${row.hourly_rate}/hr agency` : ''}`,
    href: `${SITE}/agency/${row.id}`,
  }
}

export function employerCard(row: any): FeaturedCard {
  return {
    image: row.logo_url || '',
    title: row.property_name || row.company_name || 'Property',
    subtitle: row.tagline || 'Preferred Employer',
    href: `${SITE}/properties/${row.id}`,
  }
}
