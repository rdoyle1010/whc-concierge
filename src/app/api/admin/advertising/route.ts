import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { createAdminClient } from '@/lib/supabase/admin'

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle()
  return profile?.role === 'admin' ? user : null
}

export async function GET() {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('ad_placements').select('*').order('created_at', { ascending: false })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ adverts: data || [] })
}

export async function POST(req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const action = String(body.action || '')
  const id = String(body.id || '')
  const admin = createAdminClient()
  const { data: advert } = await admin.from('ad_placements').select('*').eq('id', id).maybeSingle()
  if (!advert) return NextResponse.json({ error: 'Advert not found' }, { status: 404 })

  let update: Record<string, any> | null = null
  if (action === 'approve') {
    if (advert.payment_status !== 'paid') return NextResponse.json({ error: 'This advert cannot go live until Stripe confirms payment.' }, { status: 400 })
    update = { review_status: 'approved', status: 'active', approved_at: new Date().toISOString() }
  }
  if (action === 'reject') update = { review_status: 'rejected', status: 'paused' }
  if (action === 'pause') update = { status: 'paused' }
  if (action === 'resume') {
    if (advert.payment_status !== 'paid' || advert.review_status !== 'approved') return NextResponse.json({ error: 'Only paid, approved adverts can be resumed.' }, { status: 400 })
    update = { status: 'active' }
  }
  if (action === 'archive') update = { review_status: 'archived', status: 'archived', end_date: new Date().toISOString().slice(0, 10) }
  if (!update) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  const { error } = await admin.from('ad_placements').update({ ...update, updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

