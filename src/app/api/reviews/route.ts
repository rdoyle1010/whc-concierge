import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(req: NextRequest) {
  try {
    const { reviewer_id, reviewed_id, rating, criteria_scores, comment, type } = await req.json()

    if (!reviewer_id || !reviewed_id || (!rating && !criteria_scores)) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Prevent self-reviews
    if (reviewer_id === reviewed_id) {
      return NextResponse.json({ error: 'Cannot review yourself' }, { status: 400 })
    }

    // Calculate overall rating from criteria if provided
    let finalRating = rating
    if (criteria_scores) {
      const values = Object.values(criteria_scores) as number[]
      if (values.length > 0) {
        finalRating = Math.round((values.reduce((a, b) => a + b, 0) / values.length) * 10) / 10
      }
    }

    const supabase = createAdminClient()

    // Insert review with criteria_scores
    const { error: reviewError } = await supabase.from('reviews').insert({
      reviewer_id, reviewed_id,
      rating: finalRating,
      criteria_scores: criteria_scores || null,
      comment: comment || null,
      type: type || 'candidate',
    })

    if (reviewError) return NextResponse.json({ error: reviewError.message }, { status: 500 })

    // Update aggregate score on the reviewed profile
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
