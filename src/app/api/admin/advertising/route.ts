import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { AD_PLACEMENTS } from '@/lib/advertising'
import { sendAdvertLiveEmail, sendAdvertRejectedEmail } from '@/lib/advertising-emails'

// Delegated to the shared admin guard, which enforces two-step
// verification as well as the admin role.
async function requireAdmin() {
  return adminRequestUser()
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

  const now = new Date()
  const today = now.toISOString().slice(0, 10)
  let update: Record<string, any> | null = null

  if (action === 'approve') {
    if (advert.payment_status !== 'paid') return NextResponse.json({ error: 'This advert cannot go live until Stripe confirms payment.' }, { status: 400 })
    update = { review_status: 'approved', status: 'active', approved_at: now.toISOString(), start_date: today, end_date: null }
  }
  if (action === 'reject') update = { review_status: 'rejected', status: 'paused' }
  if (action === 'pause') update = { status: 'paused' }
  if (action === 'resume') {
    if (advert.payment_status !== 'paid' || advert.review_status !== 'approved') return NextResponse.json({ error: 'Only paid, approved adverts can be resumed.' }, { status: 400 })
    update = { status: 'active', start_date: advert.start_date || today }
  }
  if (action === 'archive') update = { review_status: 'archived', status: 'archived', end_date: today }
  // Archiving used to be a one-way door: an archived advert showed only an
  // Archive control, so a brand that had paid and been archived by mistake
  // could never be put back. Restore returns it to live, on the same terms
  // Approve applies.
  if (action === 'restore') {
    if (!['paid', 'direct'].includes(String(advert.payment_status))) {
      return NextResponse.json({ error: 'Only paid or direct adverts can be restored.' }, { status: 400 })
    }
    update = { review_status: 'approved', status: 'active', approved_at: now.toISOString(), start_date: advert.start_date || today, end_date: null }
  }
  if (!update) return NextResponse.json({ error: 'Unknown action' }, { status: 400 })

  const { error } = await admin.from('ad_placements').update({ ...update, updated_at: now.toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const placementLabel = AD_PLACEMENTS[advert.placement as keyof typeof AD_PLACEMENTS]?.label || advert.placement
  if (action === 'approve' && advert.contact_email && !advert.live_email_sent_at) {
    const sent = await sendAdvertLiveEmail(advert.contact_email, advert.brand_name, placementLabel, new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(now))
    if (sent) await admin.from('ad_placements').update({ live_email_sent_at: now.toISOString() }).eq('id', id)
  }
  if (action === 'reject' && advert.contact_email && !advert.rejected_email_sent_at) {
    const sent = await sendAdvertRejectedEmail(advert.contact_email, advert.brand_name, placementLabel)
    if (sent) await admin.from('ad_placements').update({ rejected_email_sent_at: now.toISOString() }).eq('id', id)
  }

  return NextResponse.json({ success: true })
}
