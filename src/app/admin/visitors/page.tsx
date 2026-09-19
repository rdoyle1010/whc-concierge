'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { RefreshCw } from 'lucide-react'

// How many people are actually looking, including everybody who never signed
// up. Counted without a cookie: a visitor is a hash that rotates every day, so
// this says how many people came and nothing about who they were.
//
// That rotation is the thing this screen has to be honest about. It is a
// deliberate privacy property - nobody can be followed from one day to the
// next - and it means the monthly figure counts a returning reader once per
// day. The screen used to call that number "People", which turned one person
// testing her own website for a month into a month of interest.

type Ranked = { label: string; visits: number }

type Stats = {
  days: number
  audience: 'everybody' | 'strangers'
  visits: number
  neverSignedIn: number
  pagesOpened: number
  typical: number
  busiest: number
  countingSince: string | null
  daily: { day: string; visits: number }[]
  pages: Ranked[]
  referrers: Ranked[]
  returnLegs: Ranked[]
  devices: Ranked[]
  unavailable?: boolean
  reason?: string
}

const RANGES = [7, 30, 90]

export default function AdminVisitorsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [days, setDays] = useState(30)
  const [strangersOnly, setStrangersOnly] = useState(false)
  const [countMe, setCountMe] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (range: number, strangers: boolean) => {
    setLoading(true); setError('')
    const query = `days=${range}${strangers ? '&audience=strangers' : ''}`
    const res = await fetch(`/api/admin/visitors?${query}`, { cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(body.error || 'Could not load visitor numbers.'); return }
    setStats(body)
  }, [])

  useEffect(() => { load(days, strangersOnly) }, [days, strangersOnly, load])
  useEffect(() => {
    fetch('/api/admin/counting-me', { cache: 'no-store' })
      .then(res => res.json())
      .then(body => setCountMe(Boolean(body?.countMe)))
      .catch(() => setCountMe(null))
  }, [])

  async function setCounting(next: boolean) {
    setCountMe(next)
    await fetch('/api/admin/counting-me', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ countMe: next }),
    }).catch(() => { /* the toggle is a preference, not a transaction */ })
  }

  const peak = Math.max(1, stats?.busiest || 1)
  const perVisit = stats?.visits ? (stats.pagesOpened / stats.visits).toFixed(1) : '0'
  const mobile = stats?.devices.find(device => device.label === 'mobile')?.visits || 0
  const deviceTotal = (stats?.devices || []).reduce((sum, device) => sum + device.visits, 0)

  return (
    <DashboardShell role="admin">
      <div className="max-w-6xl">
        <p className="eyebrow">Platform</p>
        <h1 className="text-[32px] mt-1">Who is looking</h1>
        <p className="text-[13px] text-secondary mt-2 max-w-2xl">
          Everybody who visited the website, whether or not they signed up. No cookie is set and
          nobody is identified.
        </p>
        <p className="text-[12px] text-muted mt-2 max-w-2xl leading-5">
          Read one number carefully. Nothing here follows a person from one day to the next, by
          design, so a visit is one person on one day. Somebody who reads the Journal on Monday and
          comes back on Thursday is two visits, not one returning reader. Compare the typical day
          rather than the monthly total.
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-6">
          {RANGES.map(range => (
            <button key={range} type="button" onClick={() => setDays(range)}
              className={`px-3.5 py-1.5 text-[12px] font-medium border ${days === range ? 'bg-[#222321] text-white border-[#222321]' : 'border-border text-secondary'}`}>
              Last {range} days
            </button>
          ))}
          <span className="mx-1 h-4 w-px bg-border" />
          {/* The question she actually asks of this screen is whether people
              who are not her, and not already members, are finding the site. */}
          <button type="button" onClick={() => setStrangersOnly(false)}
            className={`px-3.5 py-1.5 text-[12px] font-medium border ${!strangersOnly ? 'bg-[#222321] text-white border-[#222321]' : 'border-border text-secondary'}`}>
            Everybody
          </button>
          <button type="button" onClick={() => setStrangersOnly(true)}
            className={`px-3.5 py-1.5 text-[12px] font-medium border ${strangersOnly ? 'bg-[#222321] text-white border-[#222321]' : 'border-border text-secondary'}`}>
            Only people who never signed in
          </button>
          <button type="button" onClick={() => load(days, strangersOnly)} className="ml-auto flex items-center gap-1.5 text-[12px] text-secondary hover:text-ink">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

        {countMe !== null && (
          <label className="mt-3 flex w-fit items-center gap-2 text-[12px] text-secondary">
            <input type="checkbox" checked={countMe} onChange={event => setCounting(event.target.checked)} />
            Count my own visits. Off by default on any browser that has opened an admin page, because
            testing the site daily was the largest single source of traffic on this screen.
          </label>
        )}

        {error && <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}

        {stats?.unavailable && (
          <p className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            Visitor counting is not switched on yet. Run the site_visits migration in Supabase and
            numbers will start appearing from that moment onwards.
          </p>
        )}

        {loading && !stats ? (
          <p className="mt-8 text-[13px] text-secondary">Loading...</p>
        ) : stats && !stats.unavailable ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
              <div className="dashboard-card">
                <p className="eyebrow">Visits</p>
                <p className="text-[32px] mt-1">{stats.visits.toLocaleString('en-GB')}</p>
                <p className="text-[12px] text-secondary">in the last {stats.days} days, one per person per day</p>
              </div>
              <div className="dashboard-card">
                <p className="eyebrow">A typical day</p>
                <p className="text-[32px] mt-1">{stats.typical.toLocaleString('en-GB')}</p>
                <p className="text-[12px] text-secondary">busiest day {stats.busiest.toLocaleString('en-GB')}</p>
              </div>
              <div className="dashboard-card">
                <p className="eyebrow">Never signed in</p>
                <p className="text-[32px] mt-1">{stats.neverSignedIn.toLocaleString('en-GB')}</p>
                <p className="text-[12px] text-secondary">
                  {stats.visits ? Math.round((stats.neverSignedIn / stats.visits) * 100) : 0}% of all visits
                </p>
              </div>
              <div className="dashboard-card">
                <p className="eyebrow">Pages opened</p>
                <p className="text-[32px] mt-1">{stats.pagesOpened.toLocaleString('en-GB')}</p>
                <p className="text-[12px] text-secondary">{perVisit} a visit, repeats in a day counted once</p>
              </div>
            </div>

            <div className="dashboard-card mt-4">
              <p className="eyebrow">Visits a day</p>
              <div className="mt-4 flex items-end gap-[3px] h-32">
                {stats.daily.map(entry => (
                  <div key={entry.day} className="flex-1 group relative" title={`${entry.day}: ${entry.visits}`}>
                    <div className="w-full bg-[#222321]" style={{ height: `${Math.max(2, (entry.visits / peak) * 128)}px` }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                <span>{stats.daily[0]?.day}</span>
                <span>Busiest day: {stats.busiest}</span>
                <span>{stats.daily[stats.daily.length - 1]?.day}</span>
              </div>
              {stats.countingSince && stats.countingSince !== stats.daily[0]?.day && (
                <p className="mt-2 text-[11px] text-muted">
                  Counting started on {stats.countingSince}. The flat days before it are missing data, not a quiet fortnight.
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="dashboard-card">
                <p className="eyebrow">Most-read pages</p>
                <ul className="mt-3 space-y-2">
                  {stats.pages.length === 0 && <li className="text-[13px] text-secondary">Nothing yet.</li>}
                  {stats.pages.map(page => (
                    <li key={page.label} className="flex justify-between gap-3 text-[13px]">
                      <span className="truncate text-secondary">{page.label}</span>
                      <strong className="shrink-0 text-ink">{page.visits}</strong>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="space-y-4">
                <div className="dashboard-card">
                  <p className="eyebrow">Where they came from</p>
                  <ul className="mt-3 space-y-2">
                    {stats.referrers.length === 0 && <li className="text-[13px] text-secondary">Nothing yet.</li>}
                    {stats.referrers.map(source => (
                      <li key={source.label} className="flex justify-between gap-3 text-[13px]">
                        <span className="truncate text-secondary">{source.label}</span>
                        <strong className="shrink-0 text-ink">{source.visits}</strong>
                      </li>
                    ))}
                  </ul>
                  {stats.returnLegs.length > 0 && (
                    <>
                      {/* Stripe is not a place anybody discovered the website.
                          Listed beside LinkedIn it made the whole card misread. */}
                      <p className="mt-4 border-t border-border pt-3 text-[11px] text-muted">Not a source, but worth knowing</p>
                      <ul className="mt-2 space-y-2">
                        {stats.returnLegs.map(leg => (
                          <li key={leg.label} className="flex justify-between gap-3 text-[13px]">
                            <span className="truncate text-secondary">{leg.label}</span>
                            <strong className="shrink-0 text-ink">{leg.visits}</strong>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
                <div className="dashboard-card">
                  <p className="eyebrow">On what</p>
                  <ul className="mt-3 space-y-2">
                    {stats.devices.map(device => (
                      <li key={device.label} className="flex justify-between gap-3 text-[13px]">
                        <span className="capitalize text-secondary">{device.label}</span>
                        <strong className="text-ink">{device.visits}</strong>
                      </li>
                    ))}
                  </ul>
                  {deviceTotal > 0 && (
                    <p className="mt-3 text-[11px] text-muted">
                      {Math.round((mobile / deviceTotal) * 100)}% of {strangersOnly ? 'these visits' : 'all visits'} are on a phone.
                      {!strangersOnly && ' Your own browser counts here too unless you have left it out above.'}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardShell>
  )
}
