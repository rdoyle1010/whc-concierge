import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { enforceRateLimit } from '@/lib/rate-limit'
import { londonToday } from '@/lib/agency-time'

// Counting the people who never sign up.
//
// Best-effort in the same way as view tracking: every path returns 204, so a
// blocked beacon, a missing table or a malformed body can never surface an
// error to somebody reading a page.
//
// Cookieless. A visitor is a hash of address, browser and a salt that
// includes today's date, so the same person is one visitor today and an
// unrelated one tomorrow. Nothing is written to their device, which is why
// this runs whatever they told the cookie banner.

export const dynamic = 'force-dynamic'

const MAX_PATH = 300

function noContent() {
  return new NextResponse(null, { status: 204 })
}

/** Paths nobody needs counted, and paths that would leak something. */
function countable(path: string): boolean {
  if (!path.startsWith('/')) return false
  if (path.startsWith('/api/')) return false
  if (path.startsWith('/admin')) return false
  // A reset link or a magic link carries its token in the query string. The
  // path alone is stored, never the query, but these pages are not visitor
  // interest either.
  if (path.startsWith('/auth/')) return false
  return true
}

export function visitorHash(parts: { ip: string; agent: string; day: string; salt: string }): string {
  return createHash('sha256')
    .update(`${parts.day}:${parts.salt}:${parts.ip}:${parts.agent}`)
    .digest('hex')
    .slice(0, 32)
}

export function deviceFrom(agent: string): 'mobile' | 'tablet' | 'desktop' {
  const ua = agent.toLowerCase()
  if (/ipad|tablet|playbook|silk/.test(ua)) return 'tablet'
  if (/mobi|iphone|android.*mobile|windows phone/.test(ua)) return 'mobile'
  return 'desktop'
}

/** Obvious crawlers, which are not people looking at the website. */
export function looksLikeBot(agent: string): boolean {
  if (!agent) return true
  return /bot|crawler|spider|crawling|slurp|bingpreview|headlesschrome|lighthouse|pingdom|uptime|curl\/|wget|python-requests|axios\//i.test(agent)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null)
    const raw = typeof body?.path === 'string' ? body.path.split('?')[0].split('#')[0].trim() : ''
    const path = raw.slice(0, MAX_PATH)
    if (!path || !countable(path)) return noContent()

    const agent = req.headers.get('user-agent') || ''
    if (looksLikeBot(agent)) return noContent()

    const ip = (req.headers.get('x-nf-client-connection-ip')
      || req.headers.get('x-forwarded-for') || '').split(',')[0].trim() || 'unknown'

    // Generous on purpose: somebody reading twenty pages in ten minutes is a
    // good sign, not an attack. This is here so nobody can fill the table
    // with invented paths, and a visitor will never meet it.
    if (await enforceRateLimit(req, 'track-visit', { windowMs: 60 * 60 * 1000, maxRequests: 300 })) {
      return noContent()
    }

    const day = londonToday()
    const salt = process.env.INTERNAL_API_SECRET
      || process.env.SUPABASE_SERVICE_ROLE_KEY
      || 'talent-house'

    // Referrer host only. The full referring URL can carry somebody's search
    // terms, and knowing they came from Google is the whole of the useful
    // part anyway.
    let referrerHost: string | null = null
    if (typeof body?.referrer === 'string' && body.referrer) {
      try {
        const url = new URL(body.referrer)
        referrerHost = url.host.toLowerCase().slice(0, 120) || null
        if (referrerHost && referrerHost.includes('talenthousecollective')) referrerHost = null
      } catch {
        referrerHost = null
      }
    }

    // The presence of the session cookie, not a verified session. This fires
    // on every page a visitor opens, and validating a token with Supabase on
    // each one would put a network round trip in front of a number that only
    // needs to be roughly right.
    const signedIn = req.cookies.getAll().some(cookie =>
      cookie.name.startsWith('sb-') && cookie.name.includes('auth-token') && !!cookie.value)

    const admin = createAdminClient()

    // Repeats collapse into the row already there rather than erroring.
    await admin.from('site_visits')
      .upsert({
        day,
        path,
        visitor_hash: visitorHash({ ip, agent, day, salt }),
        referrer_host: referrerHost,
        device: deviceFrom(agent),
        signed_in: signedIn,
      }, { onConflict: 'day,visitor_hash,path', ignoreDuplicates: true })

    return noContent()
  } catch {
    return noContent()
  }
}
