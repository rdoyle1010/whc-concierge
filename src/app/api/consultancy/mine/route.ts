import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'
import {
  missingForPublication, parseEngagementTypes, parseProjects, parseSpecialisms, WORKS_WITH,
} from '@/lib/consultancy'

// A consultant's own listing: read it, save it, publish it.
//
// Publishing is the only guarded step. An empty entry in a showcase directory
// damages the consultant as much as the platform, so the same check that greys
// out the button also runs here - a form can be bypassed, a server cannot.

const WORKS_WITH_VALUES = new Set<string>(WORKS_WITH.map(option => option.value))
const text = (value: unknown, max: number) => {
  const trimmed = typeof value === 'string' ? value.trim() : ''
  return trimmed ? trimmed.slice(0, max) : null
}

// A link a hotel clicks from a WHC page is a link WHC is vouching for.
function safeUrl(value: unknown): string | null {
  const raw = text(value, 500)
  if (!raw) return null
  const withScheme = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`
  try {
    const url = new URL(withScheme)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.toString() : null
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('consultancy_profiles').select('*').eq('user_id', user.id).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  let enquiries: any[] = []
  if (data?.id) {
    const { data: rows } = await admin.from('consultancy_enquiries')
      .select('id, property_name, subject, message, budget_band, timeline, status, created_at')
      .eq('consultancy_id', data.id).order('created_at', { ascending: false }).limit(50)
    enquiries = rows || []
  }
  return NextResponse.json({ profile: data || null, enquiries })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const admin = createAdminClient()

  const practiceName = text(body.practice_name, 200)
  if (!practiceName) return NextResponse.json({ error: 'Your practice or trading name is needed.' }, { status: 400 })

  const years = Number(body.years_experience)
  const dayRate = Number(body.day_rate_from)
  const update: Record<string, any> = {
    user_id: user.id,
    practice_name: practiceName,
    contact_name: text(body.contact_name, 200),
    headline: text(body.headline, 200),
    summary: text(body.summary, 4000),
    specialisms: parseSpecialisms(body.specialisms),
    engagement_types: parseEngagementTypes(body.engagement_types),
    projects: parseProjects(body.projects),
    years_experience: Number.isFinite(years) && years >= 0 && years <= 70 ? Math.round(years) : null,
    based_in: text(body.based_in, 160),
    works_with: WORKS_WITH_VALUES.has(String(body.works_with)) ? String(body.works_with) : 'uk',
    website_url: safeUrl(body.website_url),
    linkedin_url: safeUrl(body.linkedin_url),
    logo_url: text(body.logo_url, 600),
    cover_image_url: text(body.cover_image_url, 600),
    day_rate_from: Number.isFinite(dayRate) && dayRate > 0 && dayRate <= 100000 ? Math.round(dayRate) : null,
    updated_at: new Date().toISOString(),
  }

  const wantsLive = Boolean(body.is_live)
  if (wantsLive) {
    const missing = missingForPublication(update)
    if (missing.length) {
      return NextResponse.json({ error: `Not ready to publish yet - still needed: ${missing.join(', ')}.` }, { status: 400 })
    }
  }
  update.is_live = wantsLive

  const { data: existing } = await admin.from('consultancy_profiles').select('id, approval_status').eq('user_id', user.id).maybeSingle()

  // An edit to an approved listing returns it to review. The alternative is a
  // listing that passed moderation on its old contents and is now showing
  // something nobody at WHC has read, on a page carrying her name.
  if (existing?.approval_status === 'approved') {
    update.approval_status = 'pending'
    update.approval_notes = null
  }

  const { data, error } = existing
    ? await admin.from('consultancy_profiles').update(update).eq('id', existing.id).select('*').single()
    : await admin.from('consultancy_profiles').insert(update).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ profile: data, returnedToReview: existing?.approval_status === 'approved' })
}
