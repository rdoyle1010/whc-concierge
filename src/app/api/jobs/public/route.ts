import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_PER_PAGE = 12
const MAX_PER_PAGE = 50

export async function GET(req: NextRequest) {
  const pageParam = Number(req.nextUrl.searchParams.get('page'))
  const perPageParam = Number(req.nextUrl.searchParams.get('per_page'))
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1
  const perPage = Number.isFinite(perPageParam) && perPageParam > 0
    ? Math.min(Math.floor(perPageParam), MAX_PER_PAGE)
    : DEFAULT_PER_PAGE
  const search = (req.nextUrl.searchParams.get('search') || '').trim()
  const location = (req.nextUrl.searchParams.get('location') || '').trim()
  const offset = (page - 1) * perPage

  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_public_jobs_page', {
    p_search: search || null,
    p_location: location || null,
    p_offset: offset,
    p_limit: perPage,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const rows = (data || []).map((row: any) => ({
    id: row.id,
    job_title: row.job_title,
    job_description: row.job_description,
    salary_min: row.salary_min,
    salary_max: row.salary_max,
    salary_display_text: row.salary_display_text,
    job_type: row.job_type,
    location: row.location,
    tier: row.tier,
    posted_date: row.posted_date,
    employer_profiles: row.employer || null,
  }))
  const total = data?.[0]?.total_count ? Number(data[0].total_count) : 0

  return NextResponse.json({
    rows,
    pagination: {
      page,
      per_page: perPage,
      total,
      total_pages: Math.max(1, Math.ceil(total / perPage)),
      has_more: offset + rows.length < total,
    },
  })
}
