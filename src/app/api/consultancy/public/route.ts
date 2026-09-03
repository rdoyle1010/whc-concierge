import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { isFeatured, parseProjects, projectClientLabel } from '@/lib/consultancy'
import { getRequestUser } from '@/lib/request-user'

// The public directory, and a single public listing.
//
// Read through the service role so the ordering can put paid placements first
// without leaning on a client-side sort that a browser could simply ignore -
// and so a listing pulled from public view stops being served immediately,
// rather than when a cache decides.

export async function GET(req: NextRequest) {
  const admin = createAdminClient()
  const id = req.nextUrl.searchParams.get('id')

  const columns = 'id, practice_name, contact_name, headline, summary, specialisms, engagement_types, projects, years_experience, based_in, works_with, website_url, linkedin_url, logo_url, cover_image_url, day_rate_from, featured, featured_until, updated_at'

  if (id) {
    const { data, error } = await admin.from('consultancy_profiles')
      .select(`${columns}, user_id, is_live, approval_status`).eq('id', id).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!data) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // A listing that is not published yet is visible to exactly one person:
    // the consultant who wrote it. Anybody else gets the same 404 they would
    // have got before, so a draft cannot be found by guessing an id.
    const published = data.is_live === true && data.approval_status === 'approved'
    if (!published) {
      const user = await getRequestUser(req)
      if (!user || user.id !== data.user_id) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json({ profile: shape(data), preview: true })
    }

    // Counted here rather than on the client, where an ad blocker or a second
    // tab would make the number meaningless to the consultant reading it.
    // Never allowed to fail the page: a counter is not worth a 500 to a hotel
    // reading a listing.
    try { await admin.rpc('increment_consultancy_view', { profile_id: id }) } catch { /* counted best-effort */ }

    return NextResponse.json({ profile: shape(data) })
  }

  const { data, error } = await admin.from('consultancy_profiles')
    .select(columns)
    .eq('is_live', true).eq('approval_status', 'approved')
    .order('featured', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(200)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ profiles: (data || []).map(shape) })
}

function shape(row: any) {
  const projects = parseProjects(row.projects).map(project => ({
    ...project,
    // The client name is resolved to what may actually be shown before it
    // leaves the server, so a confidential engagement cannot be read out of
    // the response by anyone curious enough to open the network tab.
    client: projectClientLabel(project),
  }))
  return {
    id: row.id,
    practice_name: row.practice_name,
    contact_name: row.contact_name,
    headline: row.headline,
    summary: row.summary,
    specialisms: Array.isArray(row.specialisms) ? row.specialisms : [],
    engagement_types: Array.isArray(row.engagement_types) ? row.engagement_types : [],
    projects,
    years_experience: row.years_experience,
    based_in: row.based_in,
    works_with: row.works_with,
    website_url: row.website_url,
    linkedin_url: row.linkedin_url,
    logo_url: row.logo_url,
    cover_image_url: row.cover_image_url,
    day_rate_from: row.day_rate_from,
    featured: isFeatured(row),
  }
}
