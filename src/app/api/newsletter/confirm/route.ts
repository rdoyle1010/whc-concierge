import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken, newsletterUnsubscribeUrl } from '@/lib/privacy-consent'
import { newsletterWelcomeHtml, newsletterWelcomeSubject } from '@/lib/newsletter-welcome-email'
import { sendTransactionalEmail } from '@/lib/send-email'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://talenthousecollective.co.uk'

export async function GET(req: NextRequest) {
  const token = String(req.nextUrl.searchParams.get('token') || '')
  if (!token) return NextResponse.redirect(`${SITE}/?newsletter=invalid`)

  const admin = createAdminClient()
  const { data: subscriber } = await admin.from('newsletter_subscribers')
    .select('id,email,status,confirmation_expires_at')
    .eq('confirmation_token_hash', hashToken(token))
    .maybeSingle()

  if (!subscriber || subscriber.status !== 'pending') return NextResponse.redirect(`${SITE}/?newsletter=invalid`)
  if (!subscriber.confirmation_expires_at || new Date(subscriber.confirmation_expires_at).getTime() < Date.now()) {
    return NextResponse.redirect(`${SITE}/?newsletter=expired`)
  }

  const now = new Date().toISOString()
  const { error } = await admin.from('newsletter_subscribers').update({
    status: 'confirmed',
    confirmed_at: now,
    confirmation_token_hash: null,
    confirmation_expires_at: null,
    updated_at: now,
  }).eq('id', subscriber.id)

  // Somebody who confirms and then hears nothing until the next issue happens
  // to go out has been left wondering whether it worked. The welcome goes now.
  // Somebody who confirms and then hears nothing until the next issue happens
  // to go out has been left wondering whether it worked. The welcome goes now,
  // and whether it arrived is recorded rather than lost to a function log.
  if (!error && subscriber.email) {
    await sendTransactionalEmail({
      to: subscriber.email,
      subject: newsletterWelcomeSubject(),
      html: newsletterWelcomeHtml({ unsubscribeUrl: newsletterUnsubscribeUrl(subscriber.id) }),
      kind: 'newsletter_welcome',
    })
  }

  return NextResponse.redirect(`${SITE}/?newsletter=${error ? 'invalid' : 'confirmed'}`)
}
