import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { LAUNCH_COURSE_SLUGS } from '@/lib/launch-offers'

// Administering the ambassador scheme.
//
// One brand, one hotel, one consultancy, four therapists, four residency
// hosts. Small on purpose: each of these is a real relationship somebody has
// to maintain, and a scheme with forty ambassadors has none.

const AREAS = new Set(['brand', 'hotel', 'consultancy', 'therapist', 'residency'])
const REWARDS = new Set(['academy_courses', 'free_listing', 'academy_bundle'])
const AUDIENCES = new Set(['talent', 'employer', 'any'])

const trim = (value: unknown, limit: number) => String(value ?? '').trim().slice(0, limit)

// Readable out loud, and unambiguous on a bad line. No O, I, 0 or 1: an
// ambassador reads these down the phone to a spa manager.
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function suggestCode(name: string) {
  const stem = name.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6) || 'THC'
  let tail = ''
  for (let i = 0; i < 4; i++) tail += ALPHABET[Math.floor(Math.random() * ALPHABET.length)]
  return `${stem}-${tail}`
}

export async function GET() {
  const user = await adminRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  const [{ data: ambassadors }, { data: codes }] = await Promise.all([
    admin.from('ambassadors').select('*').order('area').order('created_at'),
    admin.from('ambassador_codes').select('*').order('created_at', { ascending: false }),
  ])

  // Who used what. The whole reason the scheme has codes rather than a blanket
  // offer, so it is on the same screen as the codes themselves.
  const codeIds = (codes || []).map((row: any) => row.id)
  const { data: redemptions } = codeIds.length
    ? await admin.from('ambassador_redemptions').select('code_id,user_id,granted,created_at').in('code_id', codeIds).order('created_at', { ascending: false })
    : { data: [] as any[] }

  return NextResponse.json({
    ambassadors: ambassadors || [],
    codes: codes || [],
    redemptions: redemptions || [],
    defaults: { courseSlugs: [...LAUNCH_COURSE_SLUGS] },
  })
}

export async function POST(req: NextRequest) {
  const user = await adminRequestUser()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json().catch(() => ({}))
  const action = String(body.action || '')
  const admin = createAdminClient()

  if (action === 'create_ambassador') {
    const area = String(body.area || '')
    if (!AREAS.has(area)) return NextResponse.json({ error: 'Choose an area.' }, { status: 400 })
    const name = trim(body.name, 140)
    if (name.length < 2) return NextResponse.json({ error: 'Give the ambassador a name.' }, { status: 400 })

    const { data, error } = await admin.from('ambassadors').insert({
      area,
      name,
      organisation: trim(body.organisation, 200) || null,
      email: trim(body.email, 200).toLowerCase() || null,
      arrangement: trim(body.arrangement, 4000) || null,
      bio: trim(body.bio, 4000) || null,
      photo_url: trim(body.photo_url, 600) || null,
    }).select('*').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, ambassador: data, suggestedCode: suggestCode(name) })
  }

  if (action === 'update_ambassador') {
    const id = trim(body.id, 60)
    if (!id) return NextResponse.json({ error: 'Which ambassador?' }, { status: 400 })
    const patch: Record<string, any> = { updated_at: new Date().toISOString() }
    for (const field of ['name', 'organisation', 'email', 'arrangement', 'bio', 'photo_url'] as const) {
      if (field in body) patch[field] = trim(body[field], field === 'arrangement' || field === 'bio' ? 4000 : 600) || null
    }
    if (typeof body.is_active === 'boolean') patch.is_active = body.is_active
    if (body.area && AREAS.has(String(body.area))) patch.area = String(body.area)
    const { error } = await admin.from('ambassadors').update(patch).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'create_code') {
    const reward = String(body.reward || '')
    if (!REWARDS.has(reward)) return NextResponse.json({ error: 'Choose what the code gives.' }, { status: 400 })
    const audience = AUDIENCES.has(String(body.audience)) ? String(body.audience) : (reward === 'free_listing' ? 'employer' : 'talent')
    const code = trim(body.code, 40).toUpperCase() || suggestCode(trim(body.name, 40) || 'THC')
    const max = Math.max(1, Math.min(2000, Number(body.max_redemptions || 50)))
    const slugs = Array.isArray(body.reward_slugs)
      ? body.reward_slugs.map((slug: unknown) => trim(slug, 120)).filter(Boolean).slice(0, 20)
      : []

    const { data, error } = await admin.from('ambassador_codes').insert({
      ambassador_id: trim(body.ambassador_id, 60) || null,
      code,
      reward,
      reward_slugs: slugs,
      reward_quantity: Math.max(1, Math.min(50, Number(body.reward_quantity || 1))),
      audience,
      max_redemptions: max,
      expires_at: body.expires_at ? new Date(String(body.expires_at)).toISOString() : null,
      note: trim(body.note, 1000) || null,
    }).select('*').single()
    if (error) {
      if (error.code === '23505') return NextResponse.json({ error: 'That code already exists. Try another.' }, { status: 409 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ success: true, code: data })
  }

  if (action === 'update_code') {
    const id = trim(body.id, 60)
    if (!id) return NextResponse.json({ error: 'Which code?' }, { status: 400 })
    const patch: Record<string, any> = {}
    if (typeof body.is_active === 'boolean') patch.is_active = body.is_active
    if (body.max_redemptions != null) patch.max_redemptions = Math.max(1, Math.min(2000, Number(body.max_redemptions)))
    if ('expires_at' in body) patch.expires_at = body.expires_at ? new Date(String(body.expires_at)).toISOString() : null
    if ('note' in body) patch.note = trim(body.note, 1000) || null
    if (!Object.keys(patch).length) return NextResponse.json({ error: 'Nothing to change.' }, { status: 400 })
    const { error } = await admin.from('ambassador_codes').update(patch).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
