import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_PER_PAGE = 12
const MAX_PER_PAGE = 50

const readPublicJobs = unstable_cache(async (search: string, location: string, offset: number, perPage: number) => {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_public_jobs_page', {
    p_search: search || null,
    p_location: location || null,
    p_offset: offset,
    p_limit: perPage,
  })
  if (error) throw new Error(error.message)
  return data || []
}, ['public-jobs-page-v2'], { revalidate: 60 })

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

  try {
    const data = await readPublicJobs(search, location, offset, perPage)
    const rows = data.map((row: any) => ({
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
    }, {
      headers: {
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300',
      },
    })
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || 'Could not load roles.' }, { status: 500 })
  }
}
