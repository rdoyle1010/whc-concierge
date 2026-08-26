import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyNewsletterUnsubscribeToken } from '@/lib/privacy-consent'

const SITE = 'https://talent.wellnesshousecollective.co.uk'

export async function GET(req: NextRequest) {
  const id = String(req.nextUrl.searchParams.get('id') || '')
  const token = String(req.nextUrl.searchParams.get('token') || '')
  if (!id || !verifyNewsletterUnsubscribeToken(id, token)) return NextResponse.redirect(`${SITE}/?newsletter=invalid`)

  const now = new Date().toISOString()
  const admin = createAdminClient()
  await admin.from('newsletter_subscribers').update({ status: 'unsubscribed', unsubscribed_at: now, updated_at: now }).eq('id', id)
  return NextResponse.redirect(`${SITE}/?newsletter=unsubscribed`)
}
