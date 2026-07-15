import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { reviewSchema, validateRequest } from '@/lib/validations'

// Reviews are trust-critical: the reviewer is ALWAYS the authenticated user
// (never taken from the request body), and a review is only accepted where a
// real working relationship exists — an accepted application to one of the
// employer's roles, or an accepted agency booking between the two parties.
// `reviewed_id` is the reviewee's auth user id (profiles are updated via user_id).

function getAuthedUser() {
  const cookieStore = cookies()
  const supabaseAuth = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  return supabaseAuth.auth.getUser()
}

const ACCEPTED_BOOKING_STATUSES = ['accepted', 'confirmed'] // confirmed = legacy

async function hasWorkedTogether(
  admin: ReturnType<typeof createAdminClient>,
  employerProfileId: string,
  candidateProfileId: string,
): Promise<boolean> {
  // 1. Accepted agency booking between the two parties
  const { data: booking } = await admin
    .from('agency_bookings')
    .select('id')
    .eq('employer_id', employerProfileId)
    .eq('candidate_id', candidateProfileId)
    .in('status', ACCEPTED_BOOKING_STATUSES)
    .limit(1)
    .maybeSingle()
  if (booking) return true

  // 2. Accepted application to one of the employer's roles
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
    // -- Auth: reviewer is the logged-in user, full stop --
    const { data: { user } } = await getAuthedUser()
    if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

    const body = await req.json()
    const validation = validateRequest(reviewSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: 'Validation failed', errors: validation.errors }, { status: 400 })
    }
    const { reviewed_id, rating, criteria_scores, comment, type } = validation.data!
    const reviewer_id = user.id

    // Prevent self-reviews
    if (reviewer_id === reviewed_id) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
    }

    const supabase = createAdminClient()

    // -- Relationship: reviewer and reviewee must have actually worked together --
    let employerProfileId: string | null = null
    let candidateProfileId: string | null = null

    if (type === 'employer') {
      // A candidate reviewing an employer
      const [{ data: cand }, { data: emp }] = await Promise.all([
        supabase.from('candidate_profiles').select('id').eq('user_id', reviewer_id).maybeSingle(),
        supabase.from('employer_profiles').select('id').eq('user_id', reviewed_id).maybeSingle(),
      ])
      candidateProfileId = cand?.id || null
      employerProfileId = emp?.id || null
    } else {
      // An employer reviewing a candidate
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

    const workedTogether = await hasWorkedTogether(supabase, employerProfileId, candidateProfileId)
    if (!workedTogether) {
      return NextResponse.json(
        { error: 'You can only review someone you have worked with through a placement or agency booking' },
        { status: 403 }
      )
    }

    // -- One review per reviewer per reviewee --
    const { data: existing } = await supabase
      .from('reviews')
      .select('id')
      .eq('reviewer_id', reviewer_id)
      .eq('reviewed_id', reviewed_id)
      .limit(1)
      .maybeSingle()
    if (existing) {
      return NextResponse.json({ error: 'You have already reviewed this profile' }, { status: 409 })
    }

    // Calculate overall rating from criteria if provided
    let finalRating = rating
    if (criteria_scores) {
      const values = Object.values(criteria_scores) as number[]
      if (values.length > 0) {
        finalRating = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      }
    }

    // Insert review with criteria_scores
    const { error: reviewError } = await supabase.from('reviews').insert({
      reviewer_id, reviewed_id,
      rating: finalRating,
      criteria_scores: criteria_scores || null,
      comment: comment || null,
      type: type || 'candidate',
    })

    if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })

    // Update aggregate score on the reviewed profile (keyed on auth user_id)
    const { data: reviews } = await supabase
      .from('reviews')
      .select('rating')
      .eq('reviewed_id', reviewed_id)

    if (reviews && reviews.length > 0) {
      const avgScore = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      const table = type === 'employer' ? 'employer_profiles' : 'candidate_profiles'

      await supabase.from(table).update({
        review_score: Math.round(avgScore * 10) / 10,
        review_count: reviews.length,
      }).eq('user_id', reviewed_id)
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
