import type { SupabaseClient } from '@supabase/supabase-js'

// The opening month.
//
// Two offers, no codes, no small print: a property that registers inside the
// window gets one free Standard listing, a professional gets two free Academy
// courses. Both are the cheapest possible way to get somebody to do the thing
// the platform is for - post a role, finish a course - and both are worth more
// as habits than as revenue.
//
// The window is a constant rather than a database setting on purpose. An offer
// with an end date printed on the sign-up page has to end on that date, and a
// value somebody can quietly extend in an admin screen is not a deadline.
// London midnight, not UTC midnight. The page says the offer runs to the end
// of September and it has to actually end then for the person reading it,
// which in British Summer Time is an hour before the UTC date changes.
export const LAUNCH_OFFER_OPENS = '2026-08-31T23:00:00Z'
export const LAUNCH_OFFER_CLOSES = '2026-09-30T23:00:00Z'

// The two courses a new professional is given. Carol Joy London because it is
// the first brand masterclass and the one a therapist can use on the floor
// tomorrow; Consultation Excellence because it is the skill every other course
// on the platform assumes.
export const LAUNCH_COURSE_SLUGS = ['carol-joy-london-masterclass', 'consultation-excellence'] as const

export const LAUNCH_OFFER_TALENT = 'Register this month and two Academy courses are yours: the Carol Joy London Masterclass and Consultation Excellence.'
export const LAUNCH_OFFER_EMPLOYER = 'Register this month and your first Standard job listing is free.'

export function launchOfferOpen(at: Date = new Date()) {
  const now = at.getTime()
  return now >= Date.parse(LAUNCH_OFFER_OPENS) && now < Date.parse(LAUNCH_OFFER_CLOSES)
}

/** The closing date in the form the sign-up pages print. */
export function launchOfferClosesLabel() {
  return new Date(Date.parse(LAUNCH_OFFER_CLOSES) - 12 * 3600_000).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Europe/London',
  })
}

/**
 * Puts courses into somebody's Academy, already paid for.
 *
 * Idempotent by the table's own unique key, so a repeated grant - a retried
 * registration, a code redeemed twice, an administrator being generous - never
 * charges anybody twice or wipes progress somebody has already made. A course
 * already owned is left exactly as it is.
 */
export async function grantCourses(
  admin: SupabaseClient<any, any, any>,
  candidateId: string,
  slugs: readonly string[],
  reason: string,
): Promise<{ granted: string[] }> {
  if (!candidateId || !slugs.length) return { granted: [] }

  const { data: existing } = await admin.from('course_enrollments')
    .select('course_slug').eq('candidate_id', candidateId).in('course_slug', slugs as string[])
  const owned = new Set((existing || []).map((row: any) => row.course_slug))
  const wanted = slugs.filter(slug => !owned.has(slug))
  if (!wanted.length) return { granted: [] }

  const now = new Date().toISOString()
  const { error } = await admin.from('course_enrollments').insert(
    wanted.map(slug => ({
      candidate_id: candidateId,
      course_slug: slug,
      paid_at: now,
      // Nought, not null. A null here reads as "not paid for" everywhere the
      // Academy checks, and the point of a gift is that it is already paid.
      amount_paid: 0,
    })),
  )
  if (error) {
    console.error(`[launch offer] could not grant ${reason} to ${candidateId}:`, error.message)
    return { granted: [] }
  }
  return { granted: [...wanted] }
}

/** Adds free Standard listings to a property's account. */
export async function grantListingCredits(
  admin: SupabaseClient<any, any, any>,
  employerId: string,
  quantity: number,
): Promise<boolean> {
  if (!employerId || quantity < 1) return false
  const { data: current } = await admin.from('employer_profiles')
    .select('launch_listing_credits').eq('id', employerId).maybeSingle()
  const held = Number((current as any)?.launch_listing_credits || 0)
  const { error } = await admin.from('employer_profiles')
    .update({ launch_listing_credits: held + quantity }).eq('id', employerId)
  if (error) {
    // The column arrives with 20260910130000. Until that migration runs the
    // offer simply does not exist, which is better than a registration that
    // fails because of it.
    console.error('[launch offer] could not grant a listing credit:', error.message)
    return false
  }
  return true
}
