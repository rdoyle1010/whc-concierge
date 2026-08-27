import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getRequestUser } from '@/lib/request-user'

const FIELDS = ['linkedin_url','instagram_url','facebook_url','tiktok_url','youtube_url'] as const

function cleanUrl(value: unknown) {
  const raw = String(value || '').trim()
  if (!raw) return null
  try {
    const url = new URL(raw)
    if (!['http:','https:'].includes(url.protocol)) return null
    return url.toString()
  } catch {
    return null
  }
}

export async function GET() {
  const admin = createAdminClient()
  const { data, error } = await admin.from('public_social_links').select('*').eq('id', 1).maybeSingle()
  if (error) return NextResponse.json({ error: 'Could not load social links.' }, { status: 500 })
  return NextResponse.json({ links: data || {} }, { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } })
}

export async function POST(req: NextRequest) {
  const user = await getRequestUser(req)
  if (!user) return NextResponse.json({ error: 'Please sign in again.' }, { status: 401 })

  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  if (profile?.role !== 'admin') return NextResponse.json({ error: 'Admin access required.' }, { status: 403 })

  const body = await req.json().catch(() => ({}))
  const payload: Record<string, string | null> = {}
  for (const field of FIELDS) {
    const raw = String(body?.[field] || '').trim()
    const value = cleanUrl(raw)
    if (raw && !value) return NextResponse.json({ error: `Please enter a valid ${field.replace('_url','').replace('_',' ')} URL.` }, { status: 400 })
    payload[field] = value
  }

  const { data, error } = await admin.from('public_social_links').upsert({ id: 1, ...payload, updated_at: new Date().toISOString() }).select('*').single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ links: data })
}
