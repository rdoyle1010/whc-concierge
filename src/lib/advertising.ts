export const AD_TERMS_VERSION = '2026-08-25'

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

export const AD_BILLING_COPY = {
  short: 'Rolling monthly subscription. Renews every month until cancelled.',
  approval: 'Your advert is reviewed by WHC before it can appear publicly.',
  start: 'Billing starts at checkout. Public display starts only after WHC approval.',
} as const
