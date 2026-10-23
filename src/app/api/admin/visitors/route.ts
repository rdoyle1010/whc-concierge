import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { londonDateOffset } from '@/lib/agency-time'
import { isOwnHost, returnLegLabel, typicalDay } from '@/lib/visit-counting'

// How many people are actually looking.
//
// Everything else on this platform counts people who registered. This counts
// the ones who did not: how many came, what they read, where they came from,
// and how many of them then signed up. A quiet week and a broken funnel look
// identical without it.
//
// The headline used to read "142 people visited in the last 30 days" and that
// was not true. A visitor is a hash that rotates every night, on purpose, so
// nobody can be followed from one day to the next - which means somebody who
// came back on five days is five of that 142. The figure is visits, it always
// was, and calling it people made a month of one person's testing look like a
// month of interest. It is named honestly now, and there is a median day
// beside it, which is the number a quiet week can actually be compared with.

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Please sign in to continue. If you have just signed in, refresh the page.' }, { status: 401 })
  const admin = createAdminClient()
  const params = new URL(req.url).searchParams
  const days = Math.min(180, Math.max(1, Number(params.get('days')) || 30))
  // "Everybody" includes signed-in members moving around the platform, which
  // is most of the traffic and none of the question when what she wants to
  // know is whether strangers are finding her.
  const strangersOnly = params.get('audience') === 'strangers'
  const from = londonDateOffset(-(days - 1))

  const { data, error } = await admin.from('site_visits')
    .select('day,path,visitor_hash,referrer_host,device,signed_in')
    .gte('day', from)
    .limit(50000)

  // The table arrives with a migration. Until that is run, say so plainly
  // rather than showing zeroes that read as "nobody came".
  if (error) return NextResponse.json({ unavailable: true, reason: error.message })

  const all = data || []

  // A visitor signed in on one page and signed out on another is not a
  // stranger, so the whole of that day's browsing comes out together rather
  // than half of it counting.
  const everSignedIn = new Set<string>()
  for (const row of all) if (row.signed_in) everSignedIn.add(row.visitor_hash)
  const rows = strangersOnly ? all.filter(row => !everSignedIn.has(row.visitor_hash)) : all

  const visitors = new Set<string>()
  const signedOut = new Set<string>()
  const byDay = new Map<string, Set<string>>()
  const byPath = new Map<string, Set<string>>()
  const byReferrer = new Map<string, Set<string>>()
  const byReturnLeg = new Map<string, Set<string>>()
  const byDevice = new Map<string, Set<string>>()

  for (const row of rows) {
    const key = row.visitor_hash
    visitors.add(key)
    if (!everSignedIn.has(key)) signedOut.add(key)
    bucket(byDay, row.day, key)
    bucket(byPath, row.path, key)
    bucket(byDevice, row.device || 'unknown', key)

    const host = row.referrer_host || ''
    // Our own hosts are not a source. Rows written before deploy previews
    // were excluded still carry one, so they are dropped on the way out too.
    if (host && isOwnHost(host)) continue
    const returning = host ? returnLegLabel(host) : null
    if (returning) bucket(byReturnLeg, returning, key)
    else bucket(byReferrer, host || 'Direct or typed in', key)
  }

  const dayKeys: string[] = []
  for (let offset = days - 1; offset >= 0; offset--) dayKeys.push(londonDateOffset(-offset))
  const daily = dayKeys.map(day => ({ day, visits: byDay.get(day)?.size || 0 }))
  const busiest = daily.reduce((most, entry) => Math.max(most, entry.visits), 0)

  return NextResponse.json({
    days,
    audience: strangersOnly ? 'strangers' : 'everybody',
    // Named for what it is. One person on five days is five.
    visits: visitors.size,
    neverSignedIn: signedOut.size,
    // Not page views: a refresh, a back button and a second look at teatime
    // all collapse into the row already there.
    pagesOpened: rows.length,
    typical: typicalDay(daily),
    busiest,
    countingSince: daily.find(entry => entry.visits > 0)?.day || null,
    daily,
    pages: rank(byPath, 15),
    referrers: rank(byReferrer, 10),
    returnLegs: rank(byReturnLeg, 5),
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
    .map(([label, set]) => ({ label, visits: set.size }))
    .sort((a, b) => b.visits - a.visits)
    .slice(0, limit)
}
