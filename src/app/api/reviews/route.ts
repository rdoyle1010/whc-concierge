import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { reviewSchema, validateRequest } from '@/lib/validations'

async function getAuthedUser() {
  const cookieStore = await cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

const ACCEPTED_BOOKING_STATUSES = ['accepted', 'confirmed', 'completed']

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
  for (const col of ['reviewed_id', 'reviewee_id']) {
    const { data, error } = await admin
      .from('reviews').select('id')
      .eq('reviewer_id', reviewerId).eq(col, reviewedId)
      .limit(1).maybeSingle()
    if (!error && data) return data
  }
  return null
}

async function fetchRatingsFor(admin: any, reviewedId: string) {
  for (const col of ['reviewed_id', 'reviewee_id']) {
    const { data, error } = await admin.from('reviews').select('rating').eq(col, reviewedId)
    if (!error) return data
  }
  return null
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
      .select('id')
      .eq('id', bookingId)
      .eq('employer_id', employerProfileId)
      .eq('candidate_id', candidateProfileId)
      .in('status', ACCEPTED_BOOKING_STATUSES)
      .maybeSingle()
    return !!booking
  }

  const { data: booking } = await admin
    .from('agency_bookings')
    .select('id')
    .eq('employer_id', employerProfileId)
    .eq('candidate_id', candidateProfileId)
    .in('status', ACCEPTED_BOOKING_STATUSES)
    .limit(1)
    .maybeSingle()
  if (booking) return true

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
    const { data: { user } } = await getAuthedUser()
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
          ? 'You can only review this completed or agreed agency shift.'
          : 'You can only review someone you have worked with through a placement or agency booking' },
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
      reviewed_id,
      reviewee_id: reviewed_id,
      rating: ratingInt,
      criteria_scores: criteria_scores || null,
      text: comment || '',
      comment: comment || null,
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

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
