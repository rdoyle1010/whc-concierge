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
  const cookieStore = await cookies()
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

  // The command-centre view: campaigns + the paying-promotion roster +
  // audience sizes, in one call.
  const [{ data: campaigns }, { data: cands }, { data: emps }, { data: audience }] = await Promise.all([
    admin.from('campaigns').select('*').order('created_at', { ascending: false }),
    admin.from('candidate_profiles').select('id, full_name, headline, hourly_rate, profile_image_url, is_featured, featured_until, agency_tier, agency_available, agency_listed_until').or('is_featured.eq.true,agency_tier.eq.featured'),
    admin.from('employer_profiles').select('id, company_name, property_name, preferred_employer, preferred_until, logo_url').eq('preferred_employer', true),
    admin.from('profiles').select('role').not('email', 'is', null),
  ])

  const roles = (audience || []).map((r: any) => r.role)
  return NextResponse.json({
    campaigns: campaigns || [],
    promotion: {
      featured_candidates: (cands || []).filter((c: any) => c.is_featured),
      agency_featured: (cands || []).filter((c: any) => c.agency_tier === 'featured'),
      preferred_employers: emps || [],
    },
    audiences: {
      all: roles.length,
      candidates: roles.filter((r: string) => r === 'candidate').length,
      employers: roles.filter((r: string) => r === 'employer').length,
    },
  })
}

// Render paying members as showcase cards inside the email - this is the
// product they pay for: premium visibility in the newsletter.
async function featuredCardsHtml(admin: any, featuredIds: any[]): Promise<string> {
  if (!Array.isArray(featuredIds) || featuredIds.length === 0) return ''
  const candIds = featuredIds.filter((f: any) => f?.type === 'candidate').map((f: any) => f.id)
  const empIds = featuredIds.filter((f: any) => f?.type === 'employer').map((f: any) => f.id)
  const [{ data: cands }, { data: emps }] = await Promise.all([
    candIds.length ? admin.from('candidate_profiles').select('id, full_name, headline, hourly_rate, role_level, profile_image_url').in('id', candIds) : Promise.resolve({ data: [] }),
    empIds.length ? admin.from('employer_profiles').select('id, company_name, property_name, tagline, logo_url').in('id', empIds) : Promise.resolve({ data: [] }),
  ])
  const site = 'https://talent.wellnesshousecollective.co.uk'
  const esc = (t: any) => String(t || '').replace(/</g, '&lt;')
  const card = (img: string | null, title: string, sub: string, href: string) => `
    <a href="${href}" style="display:flex;align-items:center;gap:14px;padding:14px;border:1px solid #EEE9E0;border-radius:12px;text-decoration:none;margin-bottom:10px;background:#FDFBF7;">
      ${img ? `<img src="${img}" width="52" height="52" style="border-radius:50%;object-fit:cover;" alt="" />` : `<div style="width:52px;height:52px;border-radius:50%;background:#1A1A1A;color:#C9A96E;text-align:center;line-height:52px;font-weight:600;">${esc(title)[0] || 'W'}</div>`}
      <span>
        <span style="display:block;font-weight:600;color:#1A1A1A;">${esc(title)}</span>
        <span style="display:block;font-size:12px;color:#6B7280;margin-top:2px;">${esc(sub)}</span>
      </span>
    </a>`
  let html = ''
  for (const c of cands || []) html += card(c.profile_image_url, c.full_name || 'Professional', `${c.headline || c.role_level || 'Wellness professional'}${c.hourly_rate ? ` · £${c.hourly_rate}/hr agency` : ''}`, `${site}/agency/${c.id}`)
  for (const e of emps || []) html += card(e.logo_url, e.property_name || e.company_name || 'Property', e.tagline || 'Preferred Employer', `${site}/properties/${e.id}`)
  if (!html) return ''
  return `<div style="margin:28px 0;"><p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#C9A96E;font-weight:600;margin-bottom:12px;">Featured this week</p>${html}</div>`
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
      const clean: Record<string, any> = {
        name: data?.name || 'Untitled campaign',
        description: data?.description || null,
        type: data?.type || null,
        status: data?.status || 'draft',
        start_date: data?.start_date || null,
        end_date: data?.end_date || null,
        target_audience: data?.target_audience || null,
        content: data?.content || null,
        featured_ids: Array.isArray(data?.featured_ids) ? data.featured_ids : null,
      }
      // Drift-safe: strip featured_ids if the live column is missing
      const write = async () => id
        ? admin.from('campaigns').update(clean).eq('id', id)
        : admin.from('campaigns').insert(clean).select('id').single()
      let res: any = await write()
      if (res.error && /featured_ids/.test(res.error.message || '')) { delete clean.featured_ids; res = await write() }
      if (res.error) return NextResponse.json({ error: res.error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: id || res.data?.id })
    }

    if (action === 'delete') {
      const { error } = await admin.from('campaigns').delete().eq('id', body.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ success: true })
    }

    // Send a test copy to the admin only - see exactly what recipients get
    if (action === 'send_test') {
      if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email is not configured (RESEND_API_KEY missing).' }, { status: 500 })
      const { data: campaign } = await admin.from('campaigns').select('*').eq('id', body.id).maybeSingle()
      if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 })
      if (!campaign.content || !String(campaign.content).trim()) return NextResponse.json({ error: 'The campaign has no content to send.' }, { status: 400 })
      if (!user.email) return NextResponse.json({ error: 'Your admin account has no email address.' }, { status: 400 })
      const testCards = await featuredCardsHtml(admin, campaign.featured_ids)
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ from: FROM_EMAIL, to: user.email, subject: `[TEST] ${campaign.name || 'Campaign'}`, html: wrapper(String(campaign.content).replace(/</g, '&lt;') + testCards) }),
      })
      if (!res.ok) return NextResponse.json({ error: 'Test send failed - check resend.com/logs.' }, { status: 502 })
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
      const cards = await featuredCardsHtml(admin, campaign.featured_ids)
      const html = wrapper(String(campaign.content).replace(/</g, '&lt;') + cards)

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
