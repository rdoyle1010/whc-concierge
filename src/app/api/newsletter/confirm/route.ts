import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { hashToken } from '@/lib/privacy-consent'

const SITE = 'https://talent.wellnesshousecollective.co.uk'

export async function GET(req: NextRequest) {
  const token = String(req.nextUrl.searchParams.get('token') || '')
  if (!token) return NextResponse.redirect(`${SITE}/?newsletter=invalid`)

  const admin = createAdminClient()
  const { data: subscriber } = await admin.from('newsletter_subscribers')
    .select('id,status,confirmation_expires_at')
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

  return NextResponse.redirect(`${SITE}/?newsletter=${error ? 'invalid' : 'confirmed'}`)
}
