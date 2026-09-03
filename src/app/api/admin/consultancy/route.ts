import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { createNotification } from '@/lib/notifications'

// Moderation for the Consultancy directory.
//
// Every listing appears on a page carrying WHC's name, so somebody reads it
// before a hotel does. An edit to an approved listing puts it back here, which
// is why the queue is ordered by when it was last touched rather than created.

export async function GET() {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data, error } = await admin.from('consultancy_profiles')
    .select('*').order('updated_at', { ascending: false }).limit(300)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ rows: data || [] })
}

export async function POST(req: NextRequest) {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json().catch(() => ({}))
  const id = String(body.id || '')
  const action = String(body.action || '')
  if (!id) return NextResponse.json({ error: 'Missing listing' }, { status: 400 })

  const admin = createAdminClient()
  const { data: listing } = await admin.from('consultancy_profiles').select('id, user_id, practice_name').eq('id', id).maybeSingle()
  if (!listing) return NextResponse.json({ error: 'Listing not found' }, { status: 404 })

  if (action === 'approve') {
    const { error } = await admin.from('consultancy_profiles')
      .update({ approval_status: 'approved', approval_notes: null }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await createNotification(listing.user_id, 'general', 'Consultancy listing approved',
      'Your listing is live in the Consultancy directory. Properties can find and contact you.', '/talent/consultancy').catch(() => {})
    return NextResponse.json({ success: true })
  }

  if (action === 'reject') {
    const reason = String(body.reason || '').trim().slice(0, 500)
    // Taking a listing down without also clearing is_live would leave the
    // consultant looking at a live badge on a listing nobody can reach.
    const { error } = await admin.from('consultancy_profiles')
      .update({ approval_status: 'rejected', approval_notes: reason || null, is_live: false }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    await createNotification(listing.user_id, 'general', 'Consultancy listing not approved',
      reason ? `Your listing was not approved: ${reason}` : 'Your listing was not approved. Update it and resubmit.',
      '/talent/consultancy').catch(() => {})
    return NextResponse.json({ success: true })
  }

  if (action === 'feature') {
    // A complimentary feature, given rather than sold - the paid route runs
    // through Stripe. Both write the same two columns, so a bought placement
    // and a gifted one behave identically and expire the same way.
    const days = Number(body.days) > 0 ? Math.min(365, Math.round(Number(body.days))) : 30
    const on = body.featured !== false
    const until = new Date(Date.now() + days * 86400000).toISOString()
    const { error } = await admin.from('consultancy_profiles')
      .update({ featured: on, featured_until: on ? until : null }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
