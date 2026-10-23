import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyNewsletterUnsubscribeToken } from '@/lib/privacy-consent'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://talenthousecollective.co.uk'

async function unsubscribe(req: NextRequest) {
  const id = String(req.nextUrl.searchParams.get('id') || '')
  const token = String(req.nextUrl.searchParams.get('token') || '')
  if (!id || !verifyNewsletterUnsubscribeToken(id, token)) return false

  const now = new Date().toISOString()
  const admin = createAdminClient()
  await admin.from('newsletter_subscribers').update({ status: 'unsubscribed', unsubscribed_at: now, updated_at: now }).eq('id', id)
  return true
}

export async function GET(req: NextRequest) {
  const done = await unsubscribe(req)
  return NextResponse.redirect(`${SITE}/?newsletter=${done ? 'unsubscribed' : 'invalid'}`)
}

// The one-click form, for the List-Unsubscribe-Post header. A mail client
// sends this on the reader's behalf and shows them nothing, so it has to act
// immediately and answer plainly - no redirect, no confirmation screen. Both
// Gmail and Yahoo require it of anyone sending in volume.
export async function POST(req: NextRequest) {
  const done = await unsubscribe(req)
  return new NextResponse(done ? 'Unsubscribed' : 'Invalid unsubscribe link', {
    status: done ? 200 : 400,
    headers: { 'Content-Type': 'text/plain' },
  })
}
