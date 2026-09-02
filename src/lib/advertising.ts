export const AD_TERMS_VERSION = '2026-08-25'

export const AD_PLACEMENTS = {
  homepage_spotlight: {
    label: 'Homepage Spotlight',
    description: 'Premium placement immediately below the homepage hero.',
    monthlyPence: 40000,
    page: 'Homepage',
  },
  homepage_cta_band: {
    label: 'Homepage Closing Panel',
    description: 'The full-width panel that closes the homepage - the last thing every visitor sees.',
    monthlyPence: 45000,
    page: 'Homepage',
  },
  auth_panel: {
    label: 'Sign-in Panel',
    description: 'The brand panel beside every sign-in and registration screen, seen on each return visit.',
    monthlyPence: 35000,
    page: 'Sign in & register',
  },
  academy_sponsor: {
    label: 'Academy Sponsor',
    description: 'Reach working spa and wellness professionals in the WHC Academy.',
    monthlyPence: 25000,
    page: 'Academy',
  },
  jobs_talent_sponsor: {
    label: 'Jobs & Talent Sponsor',
    description: 'Appear alongside role discovery and the talent audience.',
    monthlyPence: 30000,
    page: 'Jobs board',
  },
  job_detail_sponsor: {
    label: 'Job Page Sponsor',
    description: 'Appear on individual job listings as candidates read the role.',
    monthlyPence: 25000,
    page: 'Job pages',
  },
  journal_sponsor: {
    label: 'Journal Sponsor',
    description: 'Sponsor the WHC Journal - industry reading for spa professionals and leaders.',
    monthlyPence: 20000,
    page: 'Journal',
  },
  journal_article_sponsor: {
    label: 'Journal Article Sponsor',
    description: 'Appear within Journal articles as they are read.',
    monthlyPence: 15000,
    page: 'Journal articles',
  },
  talent_dashboard_sponsor: {
    label: 'Talent Dashboard Sponsor',
    description: 'Reach signed-in spa professionals inside their WHC dashboard.',
    monthlyPence: 25000,
    page: 'Talent dashboard',
  },
  employer_dashboard_sponsor: {
    label: 'Employer Dashboard Sponsor',
    description: 'Reach spa and hotel employers inside their recruitment dashboard.',
    monthlyPence: 20000,
    page: 'Employer dashboard',
  },
  agency_page_sponsor: {
    label: 'Agency Sponsor',
    description: 'Appear on the WHC flexible-work and agency pages.',
    monthlyPence: 15000,
    page: 'Agency',
  },
  residency_page_sponsor: {
    label: 'Residency Sponsor',
    description: 'Appear alongside international residency opportunities.',
    monthlyPence: 15000,
    page: 'Residency',
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
