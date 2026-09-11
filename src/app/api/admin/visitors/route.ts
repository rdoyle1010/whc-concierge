import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { londonDateOffset } from '@/lib/agency-time'

// How many people are actually looking.
//
// Everything else on this platform counts people who registered. This counts
// the ones who did not: how many came, what they read, where they came from,
// and how many of them then signed up. A quiet week and a broken funnel look
// identical without it.

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const admin = createAdminClient()
  const days = Math.min(180, Math.max(1, Number(new URL(req.url).searchParams.get('days')) || 30))
  const from = londonDateOffset(-(days - 1))

  const { data, error } = await admin.from('site_visits')
    .select('day,path,visitor_hash,referrer_host,device,signed_in')
    .gte('day', from)
    .limit(50000)

  // The table arrives with a migration. Until that is run, say so plainly
  // rather than showing zeroes that read as "nobody came".
  if (error) return NextResponse.json({ unavailable: true, reason: error.message })

  const rows = data || []
  const visitors = new Set<string>()
  const signedOut = new Set<string>()
  const byDay = new Map<string, Set<string>>()
  const byPath = new Map<string, Set<string>>()
  const byReferrer = new Map<string, Set<string>>()
  const byDevice = new Map<string, Set<string>>()

  for (const row of rows) {
    const key = row.visitor_hash
    visitors.add(key)
    if (!row.signed_in) signedOut.add(key)
    bucket(byDay, row.day, key)
    bucket(byPath, row.path, key)
    bucket(byReferrer, row.referrer_host || 'Direct or typed in', key)
    bucket(byDevice, row.device || 'unknown', key)
  }

  // A visitor who was signed in on one page and signed out on another is not
  // an anonymous visitor, so they are removed from that count rather than
  // counted twice.
  for (const row of rows) if (row.signed_in) signedOut.delete(row.visitor_hash)

  const dayKeys: string[] = []
  for (let offset = days - 1; offset >= 0; offset--) dayKeys.push(londonDateOffset(-offset))

  return NextResponse.json({
    days,
    pageViews: rows.length,
    visitors: visitors.size,
    neverSignedIn: signedOut.size,
    daily: dayKeys.map(day => ({ day, visitors: byDay.get(day)?.size || 0 })),
    pages: rank(byPath, 15),
    referrers: rank(byReferrer, 10),
    devices: rank(byDevice, 4),
  })
}

function bucket(map: Map<string, Set<string>>, key: string, value: string) {
  const existing = map.get(key)
  if (existing) existing.add(value)
  else map.set(key, new Set([value]))
}

function rank(map: Map<string, Set<string>>, limit: number) {
  return [...map.entries()]
    .map(([label, set]) => ({ label, visitors: set.size }))
    .sort((a, b) => b.visitors - a.visitors)
    .slice(0, limit)
}
