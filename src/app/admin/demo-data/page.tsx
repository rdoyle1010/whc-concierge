'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { AlertTriangle, Check, Loader2, Play, Trash2 } from 'lucide-react'

// The screen that makes the platform look like a working business.
//
// An empty marketplace demonstrates nothing. A spa director being shown an
// empty jobs board and an empty candidate list cannot tell the difference
// between a product that is new and a product that does not work, and will
// assume the second. This puts three properties, eight roles, six people and
// a scored pipeline in, in one click, and takes them out in one more.
//
// The seeding itself has always been a script. A script is the right tool for
// somebody with a terminal open. It is the wrong tool twenty minutes before a
// call, which is when this is actually needed.

type Status = {
  live: boolean
  properties: number
  roles: number
  people: number
  signins: number
  applications: number
}

type Report = {
  properties: number
  roles: number
  people: number
  applications: number
  dropped: string[]
  notes: string[]
}

const EMPTY: Status = { live: false, properties: 0, roles: 0, people: 0, signins: 0, applications: 0 }

export default function DemoDataPage() {
  const [status, setStatus] = useState<Status>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<'seed' | 'clear' | null>(null)
  const [report, setReport] = useState<Report | null>(null)
  const [error, setError] = useState('')
  const [confirmClear, setConfirmClear] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/demo-data', { cache: 'no-store' })
      if (!res.ok) throw new Error('Could not read the current state')
      setStatus(await res.json())
      setError('')
    } catch (e: any) {
      setError(e?.message || 'Could not read the current state')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { refresh() }, [refresh])

  async function run(action: 'seed' | 'clear') {
    setBusy(action)
    setError('')
    setReport(null)
    try {
      const res = await fetch('/api/admin/demo-data', { method: action === 'seed' ? 'POST' : 'DELETE' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'That did not work')
      if (action === 'seed') setReport(data)
      setConfirmClear(false)
      await refresh()
    } catch (e: any) {
      setError(e?.message || 'That did not work')
    } finally {
      setBusy(null)
    }
  }

  return (
    <DashboardShell role="admin">
      <div className="max-w-3xl">
        <p className="dashboard-eyebrow">Controls</p>
        <h1 className="dashboard-title">Demonstration Data</h1>
        <p className="dashboard-intro">
          Three invented properties, eight roles, six professionals and a scored application
          pipeline, so the platform has something in it when you are showing it to somebody.
        </p>

        {/* The state, first and unmissable. The whole risk of this feature is
            leaving it switched on after the call. */}
        <div className={`mt-7 border p-5 ${status.live ? 'border-[#d9ab63] bg-[#fdf1df]' : 'border-border bg-surface'}`}>
          {loading ? (
            <p className="text-[13px] text-secondary inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Checking what is in there...
            </p>
          ) : status.live ? (
            <>
              <p className="text-[13px] font-semibold text-[#7a4a00] inline-flex items-center gap-2">
                <AlertTriangle size={15} /> Demonstration data is live on the site right now.
              </p>
              <p className="mt-2 text-[12.5px] leading-6 text-[#7a4a00]">
                Everybody can see it, not just you. The roles appear on the public jobs board and
                real professionals could apply to them. Take it out when the call is over.
              </p>
              <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-1.5 text-[12.5px] sm:grid-cols-4">
                {([['Properties', status.properties], ['Roles', status.roles], ['People', status.people], ['Applications', status.applications]] as const).map(([label, value]) => (
                  <div key={label}>
                    <dt className="text-[11px] uppercase tracking-[0.12em] text-[#7a4a00]/70">{label}</dt>
                    <dd className="text-[16px] font-semibold text-[#7a4a00]">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          ) : (
            <p className="text-[13px] text-secondary inline-flex items-center gap-2">
              <Check size={15} className="text-positive" /> Nothing is in. The site is showing real data only.
            </p>
          )}
        </div>

        {error && (
          <p className="mt-4 border border-[#d99089] bg-[#fbe9e7] px-4 py-3 text-[12.5px] text-[#8a1c14]">{error}</p>
        )}

        <div className="mt-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => run('seed')}
            disabled={!!busy || loading}
            className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
          >
            {busy === 'seed' ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
            {busy === 'seed' ? 'Putting it in...' : status.live ? 'Top it up' : 'Load demonstration data'}
          </button>

          {status.live && (
            confirmClear ? (
              <>
                <button
                  type="button"
                  onClick={() => run('clear')}
                  disabled={!!busy}
                  className="btn-secondary inline-flex items-center gap-2 border-[#d99089] text-[#8a1c14] disabled:opacity-50"
                >
                  {busy === 'clear' ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                  {busy === 'clear' ? 'Removing...' : 'Yes, remove all of it'}
                </button>
                <button type="button" onClick={() => setConfirmClear(false)} disabled={!!busy} className="btn-secondary">
                  Keep it
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setConfirmClear(true)}
                disabled={!!busy}
                className="btn-secondary inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Trash2 size={14} /> Remove it
              </button>
            )
          )}
        </div>

        {report && (
          <div className="mt-6 border border-border bg-white p-5">
            <p className="text-[13px] font-semibold text-ink">Added just now</p>
            <p className="mt-1.5 text-[12.5px] leading-6 text-secondary">
              {report.properties} properties, {report.roles} roles, {report.people} people and{' '}
              {report.applications} applications. The match scores are the platform&apos;s own
              matcher running against these profiles, not numbers that were typed in - so the
              reasoning on screen is the reasoning the product would give a real client.
            </p>
            {!report.properties && !report.roles && !report.people && (
              <p className="mt-2 text-[12.5px] text-muted">
                Nothing new went in, which means it was already there.
              </p>
            )}
            {report.notes?.length > 0 && (
              <div className="mt-3">
                <p className="text-[12px] font-semibold text-[#7a4a00]">Some rows did not go in:</p>
                <ul className="mt-1 space-y-0.5">
                  {report.notes.map(note => (
                    <li key={note} className="text-[11.5px] leading-5 text-[#7a4a00]">- {note}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-[13px] font-semibold text-ink">What goes in, and why it is invented</p>
          <p className="mt-2 text-[12.5px] leading-6 text-secondary">
            Fennwood Hall Hotel &amp; Spa, Harbourstone House and The Calder Wellness Club do not
            exist. That is deliberate. A fabricated vacancy carrying a real hotel&apos;s name, on a
            live recruitment site, is a job a therapist could apply for at a company that never
            advertised it. The postcodes are real so that distance and radius search behave
            properly in the demonstration.
          </p>
          <p className="mt-2.5 text-[12.5px] leading-6 text-secondary">
            Everything is removable, and removal is matched on the demonstration email domain as
            well as the record id, so it can only ever take out its own rows.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
