// The Consultancy directory.
//
// Agency sells hours. Residency sells weeks. Consultancy sells judgement - and
// judgement is bought on evidence, not on a rate card. So the listing is built
// around projects and outcomes rather than availability, and it is free to
// enter: a directory nobody is in has nothing to show a hotel, and a
// consultant will not pay to find out whether it works. The money comes later,
// from the ones who want to be seen first.
//
// It is also deliberately the opposite of Residency, which is anonymous by
// design. A consultant's name, practice and past work are the product. Hiding
// them would leave nothing to show.

export const CONSULTANCY_SPECIALISMS = [
  'Spa design & concept development',
  'Pre-opening & mobilisation',
  'Spa operations & performance',
  'Commercial & revenue strategy',
  'Retail strategy & buying',
  'Treatment menu & protocol design',
  'Brand alignment & positioning',
  'B2B brand sales & distribution',
  'Product house partnerships',
  'Training & academy build',
  'Recruitment & team structure',
  'Membership & loyalty',
  'Wellness programming',
  'Guest experience & service design',
  'Feasibility & business planning',
  'Technology & systems implementation',
  'Sustainability & wellbeing standards',
  'Interim leadership',
] as const

export type ConsultancySpecialism = typeof CONSULTANCY_SPECIALISMS[number]

// How the work is bought. A hotel that wants a two-day diagnostic and one that
// wants an interim director are not the same enquiry, and saying so up front
// stops both sides wasting a call.
export const ENGAGEMENT_TYPES = [
  { value: 'project', label: 'Project', hint: 'A defined piece of work with a start and an end' },
  { value: 'retainer', label: 'Retainer', hint: 'Ongoing advice on a monthly basis' },
  { value: 'day_rate', label: 'Day rate', hint: 'Bought by the day, as needed' },
  { value: 'advisory', label: 'Advisory', hint: 'Board or non-executive input' },
  { value: 'interim', label: 'Interim leadership', hint: 'Covering a role while it is recruited' },
] as const

export type EngagementType = typeof ENGAGEMENT_TYPES[number]['value']

export const WORKS_WITH = [
  { value: 'uk', label: 'UK' },
  { value: 'uk_europe', label: 'UK & Europe' },
  { value: 'global', label: 'Worldwide' },
] as const

// Budget bands on an enquiry. A hotel that will not name a number will name a
// band, and a band is enough for a consultant to decide whether to take the
// call - which is the whole job of an enquiry form.
export const BUDGET_BANDS = [
  { value: 'under_5k', label: 'Under £5,000' },
  { value: '5k_15k', label: '£5,000 - £15,000' },
  { value: '15k_50k', label: '£15,000 - £50,000' },
  { value: 'over_50k', label: 'Over £50,000' },
  { value: 'unsure', label: 'Not yet defined' },
] as const

export type ConsultancyProject = {
  title: string
  client: string
  confidential: boolean
  year: string
  location: string
  summary: string
  outcome: string
  image_url: string
}

const text = (value: unknown, max: number) =>
  typeof value === 'string' ? value.trim().slice(0, max) : ''

/**
 * Projects are stored as jsonb, so a row could hold an older shape or
 * something typed by hand. Anything without a title is not a project.
 */
export function parseProjects(value: unknown): ConsultancyProject[] {
  if (!Array.isArray(value)) return []
  return value
    .filter(entry => entry && typeof entry === 'object')
    .map(entry => {
      const raw = entry as Record<string, unknown>
      return {
        title: text(raw.title, 160),
        client: text(raw.client, 160),
        confidential: Boolean(raw.confidential),
        year: text(raw.year, 12),
        location: text(raw.location, 120),
        summary: text(raw.summary, 1200),
        outcome: text(raw.outcome, 600),
        image_url: text(raw.image_url, 600),
      }
    })
    .filter(project => project.title)
    .slice(0, 12)
}

/**
 * What a project should be called on a public page. Most serious work is under
 * NDA, and a consultant who cannot name the client would otherwise have to
 * leave their best project out entirely - so the property type stands in for
 * the name rather than the whole entry disappearing.
 */
export function projectClientLabel(project: ConsultancyProject): string {
  if (!project.confidential) return project.client || 'Private client'
  return project.client ? `Confidential - ${project.client}` : 'Confidential client'
}

export function parseSpecialisms(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set<string>(CONSULTANCY_SPECIALISMS)
  return Array.from(new Set(value.filter((item): item is string => typeof item === 'string' && allowed.has(item))))
}

export function parseEngagementTypes(value: unknown): EngagementType[] {
  if (!Array.isArray(value)) return []
  const allowed = new Set(ENGAGEMENT_TYPES.map(type => type.value))
  return Array.from(new Set(value.filter((item): item is EngagementType => typeof item === 'string' && allowed.has(item as EngagementType))))
}

/**
 * A listing goes public only when it has enough on it to be worth a hotel's
 * time. An empty profile in a showcase directory damages the consultant and
 * the platform alike, so this is what the publish button checks.
 */
export function missingForPublication(profile: {
  practice_name?: string | null
  headline?: string | null
  summary?: string | null
  specialisms?: unknown
  projects?: unknown
}): string[] {
  const missing: string[] = []
  if (!text(profile.practice_name, 200)) missing.push('Practice or trading name')
  if (!text(profile.headline, 200)) missing.push('Headline')
  if (text(profile.summary, 4000).length < 120) missing.push('A summary of at least a couple of sentences')
  if (parseSpecialisms(profile.specialisms).length === 0) missing.push('At least one specialism')
  if (parseProjects(profile.projects).length === 0) missing.push('At least one project')
  return missing
}

export function isFeatured(profile: { featured?: boolean | null; featured_until?: string | null }, now = new Date()): boolean {
  if (!profile.featured) return false
  if (!profile.featured_until) return true
  const until = Date.parse(profile.featured_until)
  return Number.isFinite(until) && until > now.getTime()
}
