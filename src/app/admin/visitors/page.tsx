'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { RefreshCw } from 'lucide-react'

// How many people are actually looking, including everybody who never signed
// up. Counted without a cookie: a visitor is a hash that rotates every day, so
// this says how many people came and nothing about who they were.

type Stats = {
  days: number
  pageViews: number
  visitors: number
  neverSignedIn: number
  daily: { day: string; visitors: number }[]
  pages: { label: string; visitors: number }[]
  referrers: { label: string; visitors: number }[]
  devices: { label: string; visitors: number }[]
  unavailable?: boolean
  reason?: string
}

const RANGES = [7, 30, 90]

export default function AdminVisitorsPage() {
  const [stats, setStats] = useState<Stats | null>(null)
  const [days, setDays] = useState(30)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function load(range: number) {
    setLoading(true); setError('')
    const res = await fetch(`/api/admin/visitors?days=${range}`, { cache: 'no-store' })
    const body = await res.json().catch(() => ({}))
    setLoading(false)
    if (!res.ok) { setError(body.error || 'Could not load visitor numbers.'); return }
    setStats(body)
  }
  useEffect(() => { load(days) }, [days])

  const peak = Math.max(1, ...(stats?.daily || []).map(d => d.visitors))

  return (
    <DashboardShell role="admin">
      <div className="max-w-6xl">
        <p className="eyebrow">Platform</p>
        <h1 className="text-[32px] mt-1">Who is looking</h1>
        <p className="text-[13px] text-secondary mt-2 max-w-2xl">
          Everybody who visited the website, whether or not they signed up. No cookie is set and
          nobody is identified: a visitor is an anonymous daily count, which is enough to tell you
          whether people are finding you.
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-6">
          {RANGES.map(range => (
            <button key={range} type="button" onClick={() => setDays(range)}
              className={`px-3.5 py-1.5 text-[12px] font-medium border ${days === range ? 'bg-[#1c1c1c] text-white border-[#1c1c1c]' : 'border-border text-secondary'}`}>
              Last {range} days
            </button>
          ))}
          <button type="button" onClick={() => load(days)} className="ml-auto flex items-center gap-1.5 text-[12px] text-secondary hover:text-ink">
            <RefreshCw size={13} /> Refresh
          </button>
        </div>

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
            <div className="grid sm:grid-cols-3 gap-4 mt-6">
              <div className="dashboard-card">
                <p className="eyebrow">People</p>
                <p className="text-[32px] mt-1">{stats.visitors.toLocaleString('en-GB')}</p>
                <p className="text-[12px] text-secondary">visited in the last {stats.days} days</p>
              </div>
              <div className="dashboard-card">
                <p className="eyebrow">Never signed in</p>
                <p className="text-[32px] mt-1">{stats.neverSignedIn.toLocaleString('en-GB')}</p>
                <p className="text-[12px] text-secondary">
                  {stats.visitors ? Math.round((stats.neverSignedIn / stats.visitors) * 100) : 0}% of everybody who came
                </p>
              </div>
              <div className="dashboard-card">
                <p className="eyebrow">Pages read</p>
                <p className="text-[32px] mt-1">{stats.pageViews.toLocaleString('en-GB')}</p>
                <p className="text-[12px] text-secondary">
                  {stats.visitors ? (stats.pageViews / stats.visitors).toFixed(1) : '0'} pages each
                </p>
              </div>
            </div>

            <div className="dashboard-card mt-4">
              <p className="eyebrow">Visitors a day</p>
              <div className="mt-4 flex items-end gap-[3px] h-32">
                {stats.daily.map(entry => (
                  <div key={entry.day} className="flex-1 group relative" title={`${entry.day}: ${entry.visitors}`}>
                    <div className="w-full bg-[#1c1c1c]" style={{ height: `${Math.max(2, (entry.visitors / peak) * 128)}px` }} />
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[11px] text-muted">
                <span>{stats.daily[0]?.day}</span>
                <span>Busiest day: {peak}</span>
                <span>{stats.daily[stats.daily.length - 1]?.day}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="dashboard-card">
                <p className="eyebrow">Most-read pages</p>
                <ul className="mt-3 space-y-2">
                  {stats.pages.length === 0 && <li className="text-[13px] text-secondary">Nothing yet.</li>}
                  {stats.pages.map(page => (
                    <li key={page.label} className="flex justify-between gap-3 text-[13px]">
                      <span className="truncate text-secondary">{page.label}</span>
                      <strong className="shrink-0 text-ink">{page.visitors}</strong>
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
                        <strong className="shrink-0 text-ink">{source.visitors}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="dashboard-card">
                  <p className="eyebrow">On what</p>
                  <ul className="mt-3 space-y-2">
                    {stats.devices.map(device => (
                      <li key={device.label} className="flex justify-between gap-3 text-[13px]">
                        <span className="capitalize text-secondary">{device.label}</span>
                        <strong className="text-ink">{device.visitors}</strong>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </DashboardShell>
  )
}
