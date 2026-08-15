export const AD_PLACEMENTS = {
  homepage_spotlight: {
    label: 'Homepage Spotlight',
    description: 'Premium placement immediately below the homepage hero.',
    monthlyPence: 40000,
  },
  academy_sponsor: {
    label: 'Academy Sponsor',
    description: 'Reach working spa and wellness professionals in the WHC Academy.',
    monthlyPence: 25000,
  },
  jobs_talent_sponsor: {
    label: 'Jobs & Talent Sponsor',
    description: 'Appear alongside role discovery and the talent audience.',
    monthlyPence: 30000,
  },
} as const

export type AdPlacementKey = keyof typeof AD_PLACEMENTS

export function isAdPlacement(value: unknown): value is AdPlacementKey {
  return typeof value === 'string' && value in AD_PLACEMENTS
}

