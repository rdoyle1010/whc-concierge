// What a free member gets, and why it is not nothing.
//
// The question that produced this file was whether AI should be paid only.
// The answer is that it depends entirely which AI.
//
// Writing a profile is not a member perk. What this platform sells to hotels
// is a register of well-presented spa professionals, and a thin profile is
// unsold stock. When the writer turns "I do massage, 11 years" into something
// a spa director reads to the end, it is not doing the therapist a favour, it
// is making the inventory sellable. Charging for that is charging people to
// fill in our own catalogue, at the exact moment a new member is most likely
// to give up. Two pence to convert a signup into a complete profile is the
// cheapest acquisition anybody in this industry will ever find.
//
// Winning one particular job is different. Interview Ready helps one person
// beat other people to one role, which is a benefit to them rather than to
// the marketplace, and it is where willingness to pay actually lives. It is
// already credit-gated and stays that way. This file does not touch it.
//
// So: free, and bounded. An allowance does what a paywall was meant to do,
// which is cap the exposure, without costing a single genuine signup.

/** The kinds of call an allowance covers. Interview Ready is not one: it has credits. */
export type AllowanceBucket = 'profile_writing' | 'cv_reading'

export const ALLOWANCE_BUCKETS: AllowanceBucket[] = ['profile_writing', 'cv_reading']

/**
 * The defaults, chosen against what the calls actually cost rather than
 * against a feeling.
 *
 * At Sonnet rates a profile field is roughly 0.6p and a CV read roughly 1.8p,
 * measured from the token counts these routes really send. Twenty-five and
 * three puts the worst case a free member can reach at about twenty pence a
 * month, and that is a member who has rewritten every box on their profile
 * twice over. The median member will spend two or three pence and never see
 * a limit exists.
 *
 * They are deliberately generous. A limit that a genuine user hits is not a
 * cost control, it is a lost member, and the thing being protected against is
 * the person who signs up to use a free writing tool - who hits twenty-five
 * in an afternoon and stops.
 */
export const ALLOWANCE_DEFAULT: Record<AllowanceBucket, number> = {
  profile_writing: 25,
  cv_reading: 3,
}

export const ALLOWANCE_LABEL: Record<AllowanceBucket, string> = {
  profile_writing: 'Writing and improving profile text',
  cv_reading: 'Reading a CV into a profile',
}

export const ALLOWANCE_WHY: Record<AllowanceBucket, string> = {
  profile_writing:
    'Every bio, headline, commercial summary and consultancy box, for talent and consultants. About 0.6p a press. Twenty-five is more than anybody filling in their own profile honestly will use, and an afternoon of work for anybody who is not.',
  cv_reading:
    'Uploading a CV and having the profile filled in from it. The largest single thing a member hands the platform, at about 1.8p a read. Three covers a first go, a correction, and a mistake.',
}

/** Paid members are not metered. They are the reason the free ones are affordable. */
export function isMeteredTier(membershipTier: unknown): boolean {
  const tier = String(membershipTier || '').trim().toLowerCase()
  return tier === '' || tier === 'free' || tier === 'none'
}

/** The month an allowance belongs to, as the database stores it. */
export function allowancePeriod(now: Date = new Date()): string {
  return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * What a limit must be for it to be worth saving.
 *
 * Zero is allowed and means off, which is a real decision somebody might make
 * for one bucket. The ceiling is a guard against the extra digit: two hundred
 * and fifty CV reads a month is not a generous allowance, it is an unnoticed
 * bill.
 */
export function limitIsSane(value: unknown): { ok: true; limit: number } | { ok: false; reason: string } {
  const limit = Number(value)
  if (!Number.isInteger(limit)) return { ok: false, reason: 'An allowance has to be a whole number.' }
  if (limit < 0) return { ok: false, reason: 'An allowance cannot be negative. Set it to zero to switch the feature off.' }
  if (limit > 500) return { ok: false, reason: 'That is over five hundred a month per person. Check the zeros.' }
  return { ok: true, limit }
}

export type Allowances = Partial<Record<AllowanceBucket, number>>

export function limitFor(bucket: AllowanceBucket, overrides: Allowances = {}): number {
  const override = overrides[bucket]
  return Number.isInteger(override) && (override as number) >= 0 ? (override as number) : ALLOWANCE_DEFAULT[bucket]
}

/** What to say when somebody has used the month up. Never a dead end. */
export function exhaustedMessage(bucket: AllowanceBucket, limit: number): string {
  const each = bucket === 'cv_reading' ? 'CV reads' : 'rewrites'
  return `You have used this month's ${limit} free ${each}. It resets on the first of next month, and membership removes the limit. You can still write and edit anything by hand in the meantime.`
}

/**
 * Whether writing this field spends an allowance.
 *
 * Talent and consultant boxes do. Employer boxes do not, and that is a
 * commercial decision rather than an oversight: a property that cannot face
 * writing an advert does not post the job, and a posted job is where this
 * platform earns. Putting a meter in front of the revenue event to save a
 * fraction of a penny would be the most expensive economy available.
 */
export function fieldIsMetered(field: string): boolean {
  return field.startsWith('talent_') || field.startsWith('practice_')
}
