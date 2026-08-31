import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { marketingUnsubscribeUrl, newsletterUnsubscribeUrl } from '@/lib/privacy-consent'
import { renderNewsletterHtml } from '@/lib/newsletter-template'

const RESEND_API_KEY = process.env.RESEND_API_KEY
const FROM_EMAIL = 'WHC Concierge <noreply@mail.wellnesshousecollective.co.uk>'
const MAX_RECIPIENTS_PER_SEND = 500

async function requireAdmin() {
  const cookieStore = await cookies()
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, { cookies: { getAll() { return cookieStore.getAll() }, setAll() {} } })
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null
  const admin = createAdminClient()
  const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).single()
  return profile?.role === 'admin' ? user : null
}

async function featuredCardsHtml(admin: any, featuredIds: any[]): Promise<string> {
  if (!Array.isArray(featuredIds) || featuredIds.length === 0) return ''
  const candIds = featuredIds.filter((f: any) => f?.type === 'candidate').map((f: any) => f.id)
  const empIds = featuredIds.filter((f: any) => f?.type === 'employer').map((f: any) => f.id)
  const [{ data: cands }, { data: emps }] = await Promise.all([
    candIds.length ? admin.from('candidate_profiles').select('id, full_name, headline, hourly_rate, role_level, profile_image_url').in('id', candIds) : Promise.resolve({ data: [] }),
    empIds.length ? admin.from('employer_profiles').select('id, company_name, property_name, tagline, logo_url').in('id', empIds) : Promise.resolve({ data: [] }),
  ])
  const site = 'https://talent.wellnesshousecollective.co.uk'
  const esc = (t: any) => String(t || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  const card = (img: string | null, title: string, sub: string, href: string) => `<a href="${href}" style="display:flex;align-items:center;gap:14px;padding:14px;border:1px solid #e5e5e5;border-radius:12px;text-decoration:none;margin-bottom:10px;background:#fff">${img ? `<img src="${img}" width="52" height="52" style="border-radius:50%;object-fit:cover" alt="" />` : `<div style="width:52px;height:52px;border-radius:50%;background:#111111;color:#fff;text-align:center;line-height:52px;font-weight:600">${esc(title)[0] || 'W'}</div>`}<span><span style="display:block;font-weight:600;color:#1a1a1a">${esc(title)}</span><span style="display:block;font-size:12px;color:#555555;margin-top:2px">${esc(sub)}</span></span></a>`
  let html = ''
  for (const c of cands || []) html += card(c.profile_image_url, c.full_name || 'Professional', `${c.headline || c.role_level || 'Wellness professional'}${c.hourly_rate ? ` · £${c.hourly_rate}/hr agency` : ''}`, `${site}/agency/${c.id}`)
  for (const e of emps || []) html += card(e.logo_url, e.property_name || e.company_name || 'Property', e.tagline || 'Preferred Employer', `${site}/properties/${e.id}`)
  return html ? `<div style="margin:28px 0"><p style="font-size:11px;letter-spacing:1px;text-transform:uppercase;color:#555555;font-weight:600;margin-bottom:12px">Featured this week</p>${html}</div>` : ''
}

export async function GET() {
  const user = await requireAdmin()
  if (!user) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const [{ data: campaigns }, { data: cands }, { data: emps }, { data: audience }, { data: optedIn }, { data: newsletter }] = await Promise.all([
    admin.from('campaigns').select('*').order('created_at', { ascending: false }),
    admin.from('candidate_profiles').select('id, full_name, headline, hourly_rate, profile_image_url, is_featured, featured_until, agency_tier').or('is_featured.eq.true,agency_tier.eq.featured'),
    admin.from('employer_profiles').select('id, company_name, property_name, preferred_employer, preferred_until, logo_url').eq('preferred_employer', true),
    admin.from('profiles').select('id,role,email').not('email', 'is', null),
    admin.from('privacy_preferences').select('user_id').eq('marketing_email_status', 'confirmed'),
    admin.from('newsletter_subscribers').select('id,email,status').eq('status', 'confirmed'),
  ])
  const optedInSet = new Set((optedIn || []).map((r: any) => r.user_id))
  const eligible = (audience || []).filter((r: any) => optedInSet.has(r.id))
  const roles = eligible.map((r: any) => r.role)
  const profileEmails = new Set(eligible.map((r: any) => String(r.email || '').toLowerCase()))
  const newsletterOnly = (newsletter || []).filter((r: any) => !profileEmails.has(String(r.email || '').toLowerCase()))
  const excluded_without_confirmed_consent = (audience || []).filter((r: any) => r.email && !optedInSet.has(r.id)).length
  return NextResponse.json({
    campaigns: campaigns || [],
    promotion: { featured_candidates: (cands || []).filter((c: any) => c.is_featured), agency_featured: (cands || []).filter((c: any) => c.agency_tier === 'featured'), preferred_employers: emps || [] },
    audiences: {
      all: eligible.length + newsletterOnly.length,
      candidates: roles.filter((r: string) => r === 'candidate').length,
      employers: roles.filter((r: string) => r === 'employer').length,
      newsletterOnly: newsletterOnly.length,
      newsletter: (newsletter || []).length,
      excluded_without_confirmed_consent,
      note: 'newsletterOnly counts confirmed standalone subscribers with no WHC profile - they are only reached by sends to All.',
    },
  })
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
      if (id) {
        const { data: existing } = await admin.from('campaigns').select('status').eq('id', id).maybeSingle()
        if (existing?.status === 'sent') return NextResponse.json({ error: 'This newsletter has been sent and can no longer be edited. Duplicate it instead.' }, { status: 400 })
      }
      const clean = {
        name: data?.name || 'Untitled newsletter', description: data?.description || null, type: data?.type || 'Email', status: data?.status || 'draft',
        target_audience: data?.target_audience || 'All', content: data?.content || null,
        preheader: data?.preheader || null, header_image_url: data?.header_image_url || null, body_image_url: data?.body_image_url || null,
        cta_label: data?.cta_label || null, cta_url: data?.cta_url || null, footer_text: data?.footer_text || null, layout_style: data?.layout_style || 'editorial',
        featured_ids: Array.isArray(data?.featured_ids) ? data.featured_ids : null,
      }
      const result = id ? await admin.from('campaigns').update(clean).eq('id', id).select('id').single() : await admin.from('campaigns').insert(clean).select('id').single()
      if (result.error) return NextResponse.json({ error: result.error.message }, { status: 500 })
      return NextResponse.json({ success: true, id: result.data?.id })
    }

    if (action === 'delete') {
      const { error } = await admin.from('campaigns').delete().eq('id', body.id)
      return error ? NextResponse.json({ error: error.message }, { status: 500 }) : NextResponse.json({ success: true })
    }

    const { data: campaign } = await admin.from('campaigns').select('*').eq('id', body.id).maybeSingle()
    if (!campaign) return NextResponse.json({ error: 'Newsletter not found.' }, { status: 404 })
    if (!campaign.content || !String(campaign.content).trim()) return NextResponse.json({ error: 'Add newsletter content before sending.' }, { status: 400 })
    const cards = await featuredCardsHtml(admin, campaign.featured_ids)

    if (action === 'send_test') {
      if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email is not configured (RESEND_API_KEY missing).' }, { status: 500 })
      if (!user.email) return NextResponse.json({ error: 'Your admin account has no email address.' }, { status: 400 })
      const html = renderNewsletterHtml(campaign, { featuredHtml: cards, test: true })
      const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM_EMAIL, to: user.email, subject: `[TEST] ${campaign.name || 'WHC Newsletter'}`, html }) })
      if (!res.ok) return NextResponse.json({ error: 'Test send failed - check Resend logs.' }, { status: 502 })
      return NextResponse.json({ success: true, email: user.email })
    }

    if (action !== 'send') return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
    if (!RESEND_API_KEY) return NextResponse.json({ error: 'Email is not configured (RESEND_API_KEY missing).' }, { status: 500 })
    if (campaign.status === 'sent') return NextResponse.json({ error: 'This newsletter has already been sent.' }, { status: 400 })

    const aud = String(campaign.target_audience || 'all').toLowerCase()
    let profileQuery = admin.from('profiles').select('id,email,role').not('email', 'is', null)
    if (aud.includes('candidate')) profileQuery = profileQuery.eq('role', 'candidate')
    if (aud.includes('employer')) profileQuery = profileQuery.eq('role', 'employer')
    const { data: profiles } = await profileQuery
    const ids = (profiles || []).map((r: any) => r.id)
    const { data: optIns } = ids.length ? await admin.from('privacy_preferences').select('user_id').in('user_id', ids).eq('marketing_email_status', 'confirmed') : { data: [] as any[] }
    const allowed = new Set((optIns || []).map((r: any) => r.user_id))
    const excludedWithoutConfirmedConsent = (profiles || []).filter((r: any) => r.email && !allowed.has(r.id))
    const profileRecipients = (profiles || []).filter((r: any) => r.email && allowed.has(r.id)).map((r: any) => ({ email: r.email, unsubscribe: marketingUnsubscribeUrl(r.id) }))

    let newsletterRecipients: any[] = []
    if (!aud.includes('candidate') && !aud.includes('employer')) {
      const { data: standalone } = await admin.from('newsletter_subscribers').select('id,email').eq('status', 'confirmed')
      newsletterRecipients = (standalone || []).map((r: any) => ({ email: r.email, unsubscribe: newsletterUnsubscribeUrl(r.id) }))
    }

    const uniqueMap = new Map<string, { email: string; unsubscribe: string }>()
    for (const r of [...profileRecipients, ...newsletterRecipients]) if (r.email) uniqueMap.set(String(r.email).toLowerCase(), r)
    const recipients = Array.from(uniqueMap.values())
    if (!recipients.length) return NextResponse.json({ error: 'No confirmed recipients are available for this audience.', excluded_without_confirmed_consent: excludedWithoutConfirmedConsent.length }, { status: 400 })
    if (recipients.length > MAX_RECIPIENTS_PER_SEND) return NextResponse.json({ error: `Confirmed audience is ${recipients.length} people - above the ${MAX_RECIPIENTS_PER_SEND} per-send cap.` }, { status: 400 })

    let sent = 0, failed = 0
    for (let i = 0; i < recipients.length; i += 10) {
      const batch = recipients.slice(i, i + 10)
      const results = await Promise.allSettled(batch.map(async recipient => {
        const html = renderNewsletterHtml(campaign, { featuredHtml: cards, unsubscribeUrl: recipient.unsubscribe })
        const res = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: FROM_EMAIL, to: recipient.email, subject: campaign.name || 'News from WHC Concierge', html }) })
        if (!res.ok) throw new Error(String(res.status))
      }))
      for (const r of results) r.status === 'fulfilled' ? sent++ : failed++
    }
    await admin.from('campaigns').update({ status: 'sent', sent_at: new Date().toISOString(), recipients_count: sent }).eq('id', campaign.id)
    return NextResponse.json({ success: true, sent, failed, excluded_without_confirmed_consent: excludedWithoutConfirmedConsent.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
