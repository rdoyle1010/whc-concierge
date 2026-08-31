import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const admin = createAdminClient()

    const { data: employer } = await admin
      .from('employer_profiles')
      .select('id,user_id,company_name,property_name')
      .eq('id', id)
      .maybeSingle()

    if (!employer?.user_id) return NextResponse.json({ reviews: [], summary: { count: 0, average: null } })

    // Old rows predate the type column, so a null type on a review of this
    // employer still counts as an employer review. The type column itself is
    // newer than some environments, so fall back to a plain select if the
    // typed query fails.
    const buildReviewQuery = (withType: boolean) => {
      let query = admin
        .from('reviews')
        .select(withType ? 'id,reviewer_id,rating,text,criteria_scores,booking_id,created_at,type' : 'id,reviewer_id,rating,text,criteria_scores,booking_id,created_at')
        .eq('reviewee_id', employer.user_id)
      if (withType) query = query.or('type.eq.employer,type.is.null')
      return query.order('created_at', { ascending: false }).limit(30)
    }
    let { data: reviewRows, error: reviewError } = await buildReviewQuery(true)
    if (reviewError) ({ data: reviewRows } = await buildReviewQuery(false))
    const reviews: any[] = reviewRows || []

    const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id).filter(Boolean))]
    const { data: candidates } = reviewerIds.length
      ? await admin.from('candidate_profiles').select('user_id,full_name,role_level').in('user_id', reviewerIds)
      : { data: [] as any[] }
    const candidateMap = new Map((candidates || []).map((c: any) => [c.user_id, c]))

    const publicReviews = reviews
      .filter(r => Number(r.rating) >= 1 && Number(r.rating) <= 5)
      .map(r => {
        const reviewer = candidateMap.get(r.reviewer_id)
        return {
          id: r.id,
          rating: Number(r.rating),
          comment: r.text || '',
          criteria_scores: r.criteria_scores || null,
          created_at: r.created_at,
          verified: true,
          source: r.booking_id ? 'Completed WHC agency shift' : 'WHC placement',
          reviewer_name: reviewer?.full_name || 'WHC professional',
          reviewer_role: reviewer?.role_level || null,
        }
      })

    const average = publicReviews.length
      ? Math.round((publicReviews.reduce((sum, r) => sum + r.rating, 0) / publicReviews.length) * 10) / 10
      : null

    return NextResponse.json({ reviews: publicReviews, summary: { count: publicReviews.length, average } })
  } catch (error: any) {
    return NextResponse.json({ error: error.message, reviews: [], summary: { count: 0, average: null } }, { status: 500 })
  }
}
