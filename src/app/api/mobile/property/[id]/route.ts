import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

async function loadReviews(admin: ReturnType<typeof createAdminClient>, employerUserId?: string | null) {
  if (!employerUserId) return []
  // Old rows predate the type column, so a null type on a review of this
  // employer still counts as an employer review. The type column itself is
  // newer than some environments, so fall back to a plain select if the
  // typed query fails.
  const buildReviewQuery = (withType: boolean) => {
    let query = admin
      .from('reviews')
      .select(withType ? 'id,reviewer_id,rating,text,booking_id,created_at,type' : 'id,reviewer_id,rating,text,booking_id,created_at')
      .eq('reviewee_id', employerUserId)
    if (withType) query = query.or('type.eq.employer,type.is.null')
    return query.order('created_at', { ascending: false }).limit(20)
  }
  let { data: reviewRows, error: reviewError } = await buildReviewQuery(true)
  if (reviewError) ({ data: reviewRows } = await buildReviewQuery(false))
  const rows: any[] = reviewRows || []
  const reviewerIds = [...new Set(rows.map(row => row.reviewer_id).filter(Boolean))]
  const { data: candidates } = reviewerIds.length
    ? await admin.from('candidate_profiles').select('user_id,full_name,role_level').in('user_id', reviewerIds)
    : { data: [] as any[] }
  const candidateMap = new Map((candidates || []).map((row: any) => [row.user_id, row]))
  return rows
    .filter(row => Number(row.rating) >= 1 && Number(row.rating) <= 5)
    .map(row => {
      const reviewer: any = candidateMap.get(row.reviewer_id)
      return {
        id: row.id,
        rating: Number(row.rating),
        comment: row.text || '',
        created_at: row.created_at,
        source: row.booking_id ? 'Completed Talent House Agency shift' : 'Talent House placement',
        reviewer_name: reviewer?.full_name || 'Talent House professional',
        reviewer_role: reviewer?.role_level || null,
      }
    })
}

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { id } = await params
  const admin = createAdminClient()
  const { data: property, error } = await admin.from('employer_profiles').select('*').eq('id', id).eq('approval_status', 'approved').maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!property) return NextResponse.json({ error: 'Property not found.' }, { status: 404 })

  const [reviews, jobsResult] = await Promise.all([
    loadReviews(admin, property.user_id),
    admin.from('job_listings').select('id,job_title,location,job_type,contract_type,salary_display_text,job_image_url,is_featured').eq('employer_id', id).eq('is_live', true).order('posted_date', { ascending: false }).limit(10),
  ])
  const average = reviews.length ? Math.round((reviews.reduce((sum, row) => sum + row.rating, 0) / reviews.length) * 10) / 10 : null

  return NextResponse.json({
    property,
    reviews,
    review_summary: {
      count: reviews.length || Number(property.review_count || 0),
      average: average ?? (Number(property.review_score || 0) || null),
    },
    jobs: jobsResult.data || [],
  })
}
