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

    let reviews: any[] = []
    for (const reviewedColumn of ['reviewed_id', 'reviewee_id']) {
      const { data, error } = await admin
        .from('reviews')
        .select('id,reviewer_id,rating,text,comment,criteria_scores,booking_id,created_at,type')
        .eq(reviewedColumn, employer.user_id)
        .eq('type', 'employer')
        .order('created_at', { ascending: false })
        .limit(30)
      if (!error) { reviews = data || []; break }
    }

    const reviewerIds = [...new Set(reviews.map(r => r.reviewer_id).filter(Boolean))]
    const { data: candidates } = reviewerIds.length
      ? await admin.from('candidate_profiles').select('user_id,full_name,current_role').in('user_id', reviewerIds)
      : { data: [] as any[] }
    const candidateMap = new Map((candidates || []).map((c: any) => [c.user_id, c]))

    const publicReviews = reviews
      .filter(r => Number(r.rating) >= 1 && Number(r.rating) <= 5)
      .map(r => {
        const reviewer = candidateMap.get(r.reviewer_id)
        return {
          id: r.id,
          rating: Number(r.rating),
          comment: r.comment || r.text || '',
          criteria_scores: r.criteria_scores || null,
          created_at: r.created_at,
          verified: true,
          source: r.booking_id ? 'Completed WHC agency shift' : 'WHC placement',
          reviewer_name: reviewer?.full_name || 'WHC professional',
          reviewer_role: reviewer?.current_role || null,
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
