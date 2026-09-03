import { NextRequest, NextResponse } from 'next/server'
import { createNotification } from '@/lib/notifications'
import { createAdminClient } from '@/lib/supabase/admin'
import { reviewSchema, validateRequest } from '@/lib/validations'
import { getRequestUser } from '@/lib/request-user'

const REVIEWABLE_BOOKING_STATUSES = ['confirmed', 'completed']

async function insertReviewDefensively(admin: any, row: Record<string, any>) {
  const attempt: Record<string, any> = { ...row }
  let lastError: any = null
  for (let strips = 0; strips <= 6; strips++) {
    const { error } = await admin.from('reviews').insert(attempt)
    if (!error) return { error: null }
    lastError = error
    const m = /Could not find the '([^']+)' column/.exec(error.message || '')
    if (m && Object.prototype.hasOwnProperty.call(attempt, m[1])) {
      delete attempt[m[1]]
      continue
    }
    break
  }
  return { error: lastError }
}

async function findExistingReview(admin: any, reviewerId: string, reviewedId: string) {
  const { data, error } = await admin
    .from('reviews').select('id')
    .eq('reviewer_id', reviewerId).eq('reviewee_id', reviewedId)
    .limit(1).maybeSingle()
  if (!error && data) return data
  return null
}

async function fetchRatingsFor(admin: any, reviewedId: string) {
  const { data, error } = await admin.from('reviews').select('rating').eq('reviewee_id', reviewedId)
  if (!error) return data
  return null
}

function londonClockKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London',
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(date)
  const values = Object.fromEntries(parts.map(part => [part.type, part.value]))
  return `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`
}

function shiftHasEnded(booking: any) {
  if (!booking?.shift_date) return false
  const end = String(booking.shift_end_time || '23:59:59').slice(0, 8)
  return `${booking.shift_date}T${end}` <= londonClockKey()
}

async function hasWorkedTogether(
  admin: ReturnType<typeof createAdminClient>,
  employerProfileId: string,
  candidateProfileId: string,
  bookingId?: string | null,
): Promise<boolean> {
  if (bookingId) {
    const { data: booking } = await admin
      .from('agency_bookings')
      .select('id,status,paid_at,shift_date,shift_end_time')
      .eq('id', bookingId)
      .eq('employer_id', employerProfileId)
      .eq('candidate_id', candidateProfileId)
      .in('status', REVIEWABLE_BOOKING_STATUSES)
      .maybeSingle()
    return Boolean(booking?.paid_at && shiftHasEnded(booking))
  }

  const { data: booking } = await admin
    .from('agency_bookings')
    .select('id,status,paid_at,shift_date,shift_end_time')
    .eq('employer_id', employerProfileId)
    .eq('candidate_id', candidateProfileId)
    .in('status', REVIEWABLE_BOOKING_STATUSES)
    .not('paid_at', 'is', null)
    .limit(20)
  if ((booking || []).some(shiftHasEnded)) return true

  const { data: jobs } = await admin
    .from('job_listings')
    .select('id')
    .eq('employer_id', employerProfileId)
  const jobIds = (jobs || []).map(j => j.id)
  if (jobIds.length === 0) return false

  const { data: application } = await admin
    .from('applications')
    .select('id')
    .eq('candidate_id', candidateProfileId)
    .eq('status', 'accepted')
    .in('role_id', jobIds)
    .limit(1)
    .maybeSingle()
  return !!application
}

export async function POST(req: NextRequest) {
  try {
    const user = await getRequestUser(req)
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const validation = validateRequest(reviewSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 })
    }
    const { reviewed_id, rating, criteria_scores, comment, type, booking_id } = validation.data!
    const reviewer_id = user.id

    if (reviewer_id === reviewed_id) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
    }

    const supabase = createAdminClient()
    let employerProfileId: string | null = null
    let candidateProfileId: string | null = null

    if (type === 'employer') {
      const [{ data: cand }, { data: emp }] = await Promise.all([
        supabase.from('candidate_profiles').select('id').eq('user_id', reviewer_id).maybeSingle(),
        supabase.from('employer_profiles').select('id').eq('user_id', reviewed_id).maybeSingle(),
      ])
      candidateProfileId = cand?.id || null
      employerProfileId = emp?.id || null
    } else {
      const [{ data: emp }, { data: cand }] = await Promise.all([
        supabase.from('employer_profiles').select('id').eq('user_id', reviewer_id).maybeSingle(),
        supabase.from('candidate_profiles').select('id').eq('user_id', reviewed_id).maybeSingle(),
      ])
      employerProfileId = emp?.id || null
      candidateProfileId = cand?.id || null
    }

    if (!employerProfileId || !candidateProfileId) {
      return NextResponse.json({ error: 'Review not permitted for this profile' }, { status: 403 })
    }

    const workedTogether = await hasWorkedTogether(
      supabase,
      employerProfileId,
      candidateProfileId,
      booking_id || null,
    )
    if (!workedTogether) {
      return NextResponse.json(
        { error: booking_id
          ? 'Agency reviews unlock after the paid shift has finished.'
          : 'You can only review someone you have worked with through a completed agency shift or accepted placement' },
        { status: 403 }
      )
    }

    if (booking_id) {
      const { data: existingForBooking } = await supabase
        .from('reviews').select('id')
        .eq('reviewer_id', reviewer_id).eq('booking_id', booking_id)
        .limit(1).maybeSingle()
      if (existingForBooking) {
        return NextResponse.json({ error: 'You have already reviewed this shift' }, { status: 409 })
      }
    } else {
      const existing = await findExistingReview(supabase, reviewer_id, reviewed_id)
      if (existing) {
        return NextResponse.json({ error: 'You have already reviewed this profile' }, { status: 409 })
      }
    }

    let finalRating = rating
    if (criteria_scores) {
      const values = Object.values(criteria_scores) as number[]
      if (values.length > 0) finalRating = values.reduce((a, b) => a + b, 0) / values.length
    }
    const ratingInt = Math.min(5, Math.max(1, Math.round(finalRating || 1)))

    const { error: reviewError } = await insertReviewDefensively(supabase, {
      reviewer_id,
      reviewee_id: reviewed_id,
      rating: ratingInt,
      criteria_scores: criteria_scores || null,
      text: comment || '',
      type: type || 'candidate',
      booking_id: booking_id || null,
    })

    if (reviewError) {
      console.error('Review insert failed:', reviewError.message)
      return NextResponse.json({ error: 'Your review could not be saved. Please try again.' }, { status: 500 })
    }

    const reviews = await fetchRatingsFor(supabase, reviewed_id)
    const rated = (reviews || []).filter((r: any) => typeof r.rating === 'number')
    if (rated.length > 0) {
      const avgScore = rated.reduce((sum: number, r: any) => sum + r.rating, 0) / rated.length
      const table = type === 'employer' ? 'employer_profiles' : 'candidate_profiles'
      const { error: aggError } = await supabase.from(table).update({
        review_score: Math.round(avgScore * 10) / 10,
        review_count: rated.length,
      }).eq('user_id', reviewed_id)
      if (aggError) console.error('Review aggregate update failed (non-fatal):', aggError.message)
    }

    // Tell the person they have been reviewed.
    //
    // The review_received notification type exists, has an icon in the bell
    // and in the activity centre, and is accepted by the notifications API -
    // and no code path anywhere created one. A property could leave a
    // five-star review of a therapist and the therapist would never be told;
    // they would only find it by visiting their reviews page unprompted.
    try {
      // The link has to land on a page that actually shows the review.
      // Talent have /talent/reviews; a property's reviews live on its public
      // profile, so the employer notification points there rather than at a
      // page that does not exist.
      let link = '/talent/reviews'
      if (type === 'employer') {
        const { data: employer } = await supabase.from('employer_profiles')
          .select('id').eq('user_id', reviewed_id).maybeSingle()
        link = employer?.id ? `/properties/${employer.id}#reviews` : '/employer/profile'
      }
      await createNotification(
        reviewed_id,
        'review_received',
        ratingInt >= 4 ? `You have a new ${ratingInt}-star review` : 'You have a new review',
        comment
          ? `"${String(comment).slice(0, 120)}${String(comment).length > 120 ? '…' : ''}"`
          : 'A review has been left on your Talent House profile.',
        link,
      )
    } catch { /* the review itself is saved either way */ }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
