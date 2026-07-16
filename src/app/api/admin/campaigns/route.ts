import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

// Campaigns that actually SEND. A campaign row is drafted, then dispatched
// to a real audience (candidates / employers / everyone) via Resend.
// Sends are batched and capped per invocation to stay inside serverless limits.

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'
const MAX_RECIPIENTS_PER_SEND = 200

async function requireAdmin() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } }
  )
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  if (profile?.role !== 'admin') return null
  return user
}

const wrapper = (content: string) => `
  <div style="font-family: Inter, -apple-system, sans-serif; max-width: 560px; margin: 0 auto; padding: 40px 20px;">
    <p style="font-size: 16px; font-weight: 600; margin-bottom: 24px;">WHC Concierge</p>
    <div style="color: #374151; white-space: pre-wrap;">${content}</div>
    <p style="margin-top: 40px; font-size: 12px; color: #9CA3AF;">Wellness House Collective &middot; wellnesshousecollective.co.uk</p>
  </div>
`

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const { data } = await admin.from('campaigns').select('*').order('created_at', { ascending: false })
  return NextResponse.json({ campaigns: data || [] })
}

export async function POST(req: NextRequest) {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const admin = createAdminClient()
  try {
    const body = await req.json()
    const { action } = body

    if (action === 'save') {
      const { id, data } = body
      const clean = {
        name: data?.name || 'Untitled campaign',
        description: data?.description || null,
        type: data?.type || null,
        status: data?.status || 'draft',
        start_date: data?.start_date || null,
        end_date: data?.end_date || null,
        target_audience: data?.target_audience || null,
        content: data?.content || null,
      }
      if (id) {
        const { error } = await admin.from('campaigns').update(clean).eq('id', id)
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ success: true, id })
      }
      const { data: row, error } = await admin.from('campaigns').insert(clean).select('id').single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: row.id })
    }

    if (action === 'delete') {
      const { error } = await admin.from('campaigns').delete().eq('id', body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    if (action === 'send') {
      if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email is not configured (RESEND_API_KEY missing).' }, { status: 500 })
      const { data: campaign } = await admin.from('campaigns').select('*').eq('id', body.id).maybeSingle()
      if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      if (campaign.status === 'sent') return NextResponse.json({ error: 'This campaign has already been sent.' }, { status: 400 })
      if (String(campaign.type || '').toLowerCase() !== 'email') {
        return NextResponse.json({ error: 'Only Email campaigns can be sent from here.' }, { status: 400 })
      }
      if (!campaign.content || !String(campaign.content).trim()) {
        return NextResponse.json({ error: 'The campaign has no content to send.' }, { status: 400 })
      }

      // Audience from the profiles table (id, email, role)
      const aud = String(campaign.target_audience || '').toLowerCase()
      let q = admin.from('profiles').select('email, role').not('email', 'is', null)
      if (aud.includes('candidate')) q = q.eq('role', 'candidate')
      if (aud.includes('employer')) q = q.eq('role', 'employer')
      const { data: recipients } = await q
      const emails = Array.from(new Set((recipients || []).map((r: any) => r.email).filter(Boolean)))

      if (emails.length === 0) return NextResponse.json({ error: 'No recipients found for this audience.' }, { status: 400 })
      if (emails.length > MAX_RECIPIENTS_PER_SEND) {
        return NextResponse.json({ error: `Audience is ${emails.length} people - above the ${MAX_RECIPIENTS_PER_SEND} per-send cap. Split the audience (this cap exists so sends complete reliably).` }, { status: 400 })
      }

      const subject = campaign.name || 'News from WHC Concierge'
      const html = wrapper(String(campaign.content).replace(/</g, '&lt;'))

      let sent = 0
      let failed = 0
      // Small parallel batches - kind to Resend's rate limits, fast enough for our size
      for (let i = 0; i < emails.length; i += 10) {
        const batch = emails.slice(i, i + 10)
        const results = await Promise.allSettled(batch.map(async (to) => {
          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
          })
          if (!res.ok) throw new Error(String(res.status))
        }))
        for (const r of results) r.status === 'fulfilled' ? sent++ : failed++
      }

      // Drift-safe: sent_at/recipients_count are added by migration; if a
      // column is missing, still record the sent status.
      let upd = await admin.from('campaigns').update({ status: 'sent', sent_at: new Date().toISOString(), recipients_count: sent }).eq('id', campaign.id)
      if (upd.error) await admin.from('campaigns').update({ status: 'sent' }).eq('id', campaign.id)

      return NextResponse.json({ success: true, sent, failed })
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
