import { NextRequest, NextResponse } from 'next/server'
import { adminRequestUser } from '@/lib/admin-api-auth'
import { createAdminClient } from '@/lib/supabase/admin'

// Who is actually using this, split by workspace, with a time that means
// something.
//
// Minutes are counted as distinct five-minute buckets in which somebody was
// seen, not wall-clock time with a tab open. A laptop left running overnight
// is not eight hours of engagement, and a number that says it is will be
// trusted once and never again.

const BUCKET_MINUTES = 5

type Row = {
  user_id: string
  day: string
  role: string | null
  first_seen_at: string
  last_seen_at: string
  buckets: number[] | null
  page_views: number
}

function ukToday(): string {
  const now = new Date()
  const uk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))
  return `${uk.getFullYear()}-${String(uk.getMonth() + 1).padStart(2, '0')}-${String(uk.getDate()).padStart(2, '0')}`
}

function daysAgo(count: number): string {
  const now = new Date()
  const uk = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }))
  uk.setDate(uk.getDate() - count)
  return `${uk.getFullYear()}-${String(uk.getMonth() + 1).padStart(2, '0')}-${String(uk.getDate()).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  if (!await adminRequestUser()) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const window = Number(req.nextUrl.searchParams.get('days') || 1)
  const days = [1, 7, 30].includes(window) ? window : 1
  const from = days === 1 ? ukToday() : daysAgo(days - 1)

  const admin = createAdminClient()
  const { data, error } = await admin.from('user_activity')
    .select('user_id, day, role, first_seen_at, last_seen_at, buckets, page_views')
    .gte('day', from)
    .order('last_seen_at', { ascending: false })
    .limit(4000)

  // The table arrives with a migration. Until it is run, say so rather than
  // showing an empty list that reads as "nobody has ever used this".
  if (error) return NextResponse.json({ people: [], quiet: [], unavailable: true })

  const rows = (data || []) as Row[]

  // Collapse per-day rows into one line per person over the window.
  const byUser = new Map<string, {
    userId: string; role: string | null; minutes: number; views: number
    firstSeen: string; lastSeen: string; days: Set<string>
  }>()
  for (const row of rows) {
    const existing = byUser.get(row.user_id)
    const minutes = (row.buckets?.length || 0) * BUCKET_MINUTES
    if (!existing) {
      byUser.set(row.user_id, {
        userId: row.user_id,
        role: row.role,
        minutes,
        views: row.page_views || 0,
        firstSeen: row.first_seen_at,
        lastSeen: row.last_seen_at,
        days: new Set([row.day]),
      })
      continue
    }
    existing.minutes += minutes
    existing.views += row.page_views || 0
    existing.role = existing.role || row.role
    if (row.last_seen_at > existing.lastSeen) existing.lastSeen = row.last_seen_at
    if (row.first_seen_at < existing.firstSeen) existing.firstSeen = row.first_seen_at
    existing.days.add(row.day)
  }

  const userIds = Array.from(byUser.keys())
  const names = await namesFor(admin, userIds)

  const people = Array.from(byUser.values())
    .map(entry => ({
      userId: entry.userId,
      // The workspace they were in beats the role on their profile: a talent
      // account that has switched to consultancy only should read as a
      // consultant, which is what she is actually doing on the platform.
      role: entry.role || names[entry.userId]?.role || 'unknown',
      name: names[entry.userId]?.name || 'Unknown',
      email: names[entry.userId]?.email || null,
      minutes: entry.minutes,
      views: entry.views,
      days: entry.days.size,
      firstSeen: entry.firstSeen,
      lastSeen: entry.lastSeen,
    }))
    .sort((a, b) => b.minutes - a.minutes || b.views - a.views)

  return NextResponse.json({
    days,
    people,
    totals: {
      people: people.length,
      talent: people.filter(person => person.role === 'talent').length,
      employer: people.filter(person => person.role === 'employer').length,
      consultant: people.filter(person => person.role === 'consultant').length,
      admin: people.filter(person => person.role === 'admin').length,
      minutes: people.reduce((sum, person) => sum + person.minutes, 0),
    },
  })
}

// Names and addresses come from auth and the profile tables, never from the
// activity row - that table deliberately holds an id and a clock and nothing
// else, so it never becomes a record of what anybody was reading.
async function namesFor(admin: any, userIds: string[]) {
  const out: Record<string, { name: string; email: string | null; role: string | null }> = {}
  if (!userIds.length) return out
  const ids = userIds.slice(0, 500)

  const [{ data: profiles }, { data: candidates }, { data: employers }] = await Promise.all([
    admin.from('profiles').select('id, full_name, email, role').in('id', ids),
    admin.from('candidate_profiles').select('user_id, full_name').in('user_id', ids),
    admin.from('employer_profiles').select('user_id, property_name, company_name').in('user_id', ids),
  ])

  for (const profile of profiles || []) {
    out[profile.id] = {
      name: profile.full_name || 'Unknown',
      email: profile.email || null,
      role: profile.role === 'candidate' ? 'talent' : profile.role || null,
    }
  }
  for (const candidate of candidates || []) {
    const entry = out[candidate.user_id] || (out[candidate.user_id] = { name: 'Unknown', email: null, role: 'talent' })
    if (candidate.full_name) entry.name = candidate.full_name
  }
  for (const employer of employers || []) {
    const entry = out[employer.user_id] || (out[employer.user_id] = { name: 'Unknown', email: null, role: 'employer' })
    entry.name = employer.property_name || employer.company_name || entry.name
  }
  return out
}
