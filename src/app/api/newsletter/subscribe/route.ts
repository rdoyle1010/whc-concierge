import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { NEWSLETTER_CONSENT_WORDING, PRIVACY_POLICY_VERSION, hashToken, newConfirmationToken, sendNewsletterDoubleOptInEmail } from '@/lib/privacy-consent'
import { enforceRateLimit } from '@/lib/rate-limit'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const email = String(body?.email || '').trim()
    const honeypot = String(body?.company || '').trim()
    if (honeypot) return NextResponse.json({ success: true })
    if (!EMAIL_RE.test(email) || email.length > 254) return NextResponse.json({ error: 'Please enter a valid email address.' }, { status: 400 })

    // This endpoint sends a real email, through Talent House's own domain, to any
    // address handed to it. The 120-second per-address hold below does
    // nothing against a list of distinct victim addresses, which turns the
    // newsletter form into a mail-bombing service and burns the sending
    // reputation every transactional email on the platform depends on.
    const limited = await enforceRateLimit(req, 'newsletter-subscribe', { windowMs: 60 * 60_000, maxRequests: 10 })
    if (limited) {
      // Deliberately the same shape as success: an attacker learns nothing
      // about whether the limit exists, and a genuine person who tried twice
      // is not told off.
      return NextResponse.json({ success: true, pending: true })
    }

    const admin = createAdminClient()
    const normalized = email.toLowerCase()
    const { data: existing } = await admin.from('newsletter_subscribers').select('id,status,requested_at').eq('email_normalized', normalized).maybeSingle()

    // Do not reveal whether an address is already subscribed.
    if (existing?.status === 'confirmed') return NextResponse.json({ success: true, pending: true })
    if (existing?.status === 'pending' && existing.requested_at && Date.now() - new Date(existing.requested_at).getTime() < 120000) {
      return NextResponse.json({ success: true, pending: true })
    }

    const token = newConfirmationToken()
    const now = new Date()
    const expires = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const record = {
      email,
      email_normalized: normalized,
      status: 'pending',
      confirmation_token_hash: hashToken(token),
      confirmation_expires_at: expires.toISOString(),
      requested_at: now.toISOString(),
      confirmed_at: null,
      unsubscribed_at: null,
      consent_policy_version: PRIVACY_POLICY_VERSION,
      consent_wording: NEWSLETTER_CONSENT_WORDING,
      source: 'newsletter_popup',
      updated_at: now.toISOString(),
    }

    let error
    if (existing?.id) ({ error } = await admin.from('newsletter_subscribers').update(record).eq('id', existing.id))
    else ({ error } = await admin.from('newsletter_subscribers').insert(record))
    if (error) return NextResponse.json({ error: 'We could not start your subscription. Please try again.' }, { status: 500 })

    const sent = await sendNewsletterDoubleOptInEmail(email, token)
    if (!sent) return NextResponse.json({ error: 'We could not send the confirmation email. Please try again later.' }, { status: 503 })

    return NextResponse.json({ success: true, pending: true })
  } catch {
    return NextResponse.json({ error: 'We could not start your subscription. Please try again.' }, { status: 500 })
  }
}
