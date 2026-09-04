import { NextRequest, NextResponse } from 'next/server'
import { unstable_cache } from 'next/cache'
import { createAdminClient } from '@/lib/supabase/admin'

const DEFAULT_PER_PAGE = 12
const MAX_PER_PAGE = 50

const readPublicJobs = unstable_cache(async (search: string, location: string, offset: number, perPage: number, sectorId: string, doorId: string) => {
  const admin = createAdminClient()
  const { data, error } = await admin.rpc('get_public_jobs_page', {
    p_search: search || null,
    p_location: location || null,
    p_offset: offset,
    p_limit: perPage,
    p_sector_id: sectorId || null,
    p_door_id: doorId || null,
  })
  if (error) throw new Error(error.message)
  const rows: any[] = data || []
  // The RPC returns a fixed set of columns - merge the rest in from
  // job_listings so Browse Roles can show them. Best-effort: on failure the
  // rows simply go out without them.
  //
  // salary_currency belongs here rather than in the RPC because it is the
  // difference between a Hong Kong role reading HK$45,000 and reading
  // £45,000, and the second is wrong by roughly a factor of ten.
  if (rows.length) {
    try {
      const ids = rows.map((row: any) => row.id).filter(Boolean)
      const { data: extras } = await admin
        .from('job_listings')
        .select('id, job_image_url, is_residency_role, salary_currency, country_code')
        .in('id', ids)
      const extraMap = new Map((extras || []).map((row: any) => [row.id, row]))
      for (const row of rows) {
        const extra = extraMap.get(row.id)
        if (extra) {
          row.job_image_url = extra.job_image_url
          row.is_residency_role = extra.is_residency_role
          row.salary_currency = extra.salary_currency
          row.country_code = extra.country_code
        }
      }
    } catch { /* best-effort merge */ }
  }
  return rows
}, ['public-jobs-page-v6'], { revalidate: 60, tags: ['public-jobs'] })

export async function GET(req: NextRequest) {
  const pageParam = Number(req.nextUrl.searchParams.get('page'))
  const perPageParam = Number(req.nextUrl.searchParams.get('per_page'))
  const page = Number.isFinite(pageParam) && pageParam > 0 ? Math.floor(pageParam) : 1
  const perPage = Number.isFinite(perPageParam) && perPageParam > 0
    ? Math.min(Math.floor(perPageParam), MAX_PER_PAGE)
    : DEFAULT_PER_PAGE
  const search = (req.nextUrl.searchParams.get('search') || '').trim()
  const location = (req.nextUrl.searchParams.get('location') || '').trim()
  // A sector filter is more specific than its door, so it wins when both are
  // sent. Ids are passed straight to the query, which only matches real rows.
  const sectorId = (req.nextUrl.searchParams.get('sector') || '').trim()
  const doorId = sectorId ? '' : (req.nextUrl.searchParams.get('door') || '').trim()
  const offset = (page - 1) * perPage

  try {
    const data = await readPublicJobs(search, location, offset, perPage, sectorId, doorId)
    const rows = data.map((row: any) => ({
      id: row.id,
      job_title: row.job_title,
      job_description: row.job_description,
      job_image_url: row.job_image_url,
      is_residency_role: row.is_residency_role,
      salary_min: row.salary_min,
      salary_max: row.salary_max,
      salary_currency: row.salary_currency || 'GBP',
      salary_display_text: row.salary_display_text,
      country_code: row.country_code || 'GB',
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
