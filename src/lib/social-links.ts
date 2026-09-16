// Where Talent House can be found elsewhere.
//
// The footer held these and the Organization structured data held an empty
// sameAs array, which is the same list maintained in two places with one of
// them left blank. A search engine reading sameAs is how a brand gets
// connected to its own profiles, so an empty array is a small gift to
// whoever ranks above you.
export const SOCIAL_LINKS = {
  linkedin: 'https://www.linkedin.com/company/wellnesshousecollective/',
  instagram: 'https://www.instagram.com/wellnesshousecollective/',
  facebook: 'https://www.facebook.com/wellnesshousecollective',
} as const

export const SOCIAL_PROFILE_URLS: string[] = Object.values(SOCIAL_LINKS)
