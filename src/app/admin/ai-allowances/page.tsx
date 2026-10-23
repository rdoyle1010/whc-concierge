'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Check, RotateCcw, Loader2 } from 'lucide-react'

// What free members get, and what it actually cost.
//
// Two halves, and the second is the one that matters. The allowances are easy
// to set and easy to put back. The month's real spend, read from the ledger
// rather than estimated, is the thing that answers "what does a member cost
// me" with a number instead of a worry.

type Allowance = {
  bucket: string; label: string; why: string
  fallback: number; current: number; overridden: boolean
  calls: number; people: number; pence: number; pencePerCall: number
}
type Month = { people: number; pence: number; pencePerPerson: number; ceilingPencePerPerson: number }

const money = (pence: number) => pence < 100 ? `${pence.toFixed(2)}p` : `£${(pence / 100).toFixed(2)}`

export default function AiAllowancesPage() {
  const [allowances, setAllowances] = useState<Allowance[]>([])
  const [month, setMonth] = useState<Month | null>(null)
  const [period, setPeriod] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<Record<string, string>>({})

  async function load() {
    setLoading(true)
    const res = await fetch('/api/admin/ai-allowances', { cache: 'no-store' })
    const body = await res.json().catch(() => null)
    if (!res.ok || !body) {
      setError(body?.error || 'Could not load the allowances.')
      setLoading(false)
      return
    }
    setAllowances(body.allowances || [])
    setMonth(body.month || null)
    setPeriod(body.period || '')
    setError('')
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function send(bucket: string, action: 'set' | 'reset', limit?: string) {
    setBusy(bucket); setNote(''); setError('')
    const res = await fetch('/api/admin/ai-allowances', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, bucket, limit: limit === undefined ? undefined : Number(limit) }),
    })
    const body = await res.json().catch(() => null)
    setBusy('')
    if (!res.ok || !body?.success) { setError(body?.error || 'That did not save.'); return }
    setNote(action === 'reset' ? 'Put back to the default.' : 'Saved.')
    setDraft(current => ({ ...current, [bucket]: '' }))
    load()
  }

  return (
    <DashboardShell role="admin">
      <div className="max-w-4xl">
        <h1 className="text-[27px] font-semibold tracking-[-.03em] text-ink">What free members get</h1>
        <p className="mt-2 text-[13px] leading-6 text-muted">
          Members join free, so every AI call is a cost carried before anybody pays.
          These are the monthly limits on the two features that cost money, set per person
          and reset on the first of each month. Paying members are not limited.
        </p>
        <p className="mt-3 text-[13px] leading-6 text-muted">
          Writing a profile stays free on purpose. It is what turns a thin profile into
          something an employer reads, which is the thing this platform sells. Charging
          for it would be charging people to fill in our own catalogue. The limit is here
          to stop somebody using the site as a free writing tool, not to stop members
          finishing their profiles.
        </p>

        {loading ? (
          <div className="mt-8 flex items-center gap-2 text-[13px] text-muted">
            <Loader2 size={15} className="animate-spin" /> Loading
          </div>
        ) : (
          <>
            {month && (
              <div className="mt-7 rounded-2xl border border-border bg-[#ede8df] p-6">
                <p className="text-[10px] uppercase tracking-[.16em] text-[#222321] font-semibold">
                  This month so far · {period}
                </p>
                <div className="mt-4 grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-[27px] font-semibold tracking-[-.03em] text-ink tabular-nums">
                      {money(month.pence)}
                    </p>
                    <p className="text-[12px] text-muted">spent on AI for members</p>
                  </div>
                  <div>
                    <p className="text-[27px] font-semibold tracking-[-.03em] text-ink tabular-nums">
                      {money(month.pencePerPerson)}
                    </p>
                    <p className="text-[12px] text-muted">
                      per person, across {month.people} {month.people === 1 ? 'member' : 'members'}
                    </p>
                  </div>
                  <div>
                    <p className="text-[27px] font-semibold tracking-[-.03em] text-ink tabular-nums">
                      {money(month.ceilingPencePerPerson)}
                    </p>
                    <p className="text-[12px] text-muted">the most one free member could cost</p>
                  </div>
                </div>
                <p className="mt-4 text-[12px] leading-5 text-muted">
                  Measured from the tokens these calls really used, not estimated. Signing in,
                  browsing roles, applying and messaging all cost nothing: AI only runs when
                  somebody presses a button asking for it.
                </p>
              </div>
            )}

            {note && <p className="mt-5 text-[13px] text-emerald-700">{note}</p>}
            {error && <p className="mt-5 text-[13px] text-red-600">{error}</p>}

            <div className="mt-7 space-y-4">
              {allowances.map(entry => (
                <div key={entry.bucket} className="bg-white border border-border rounded-xl p-5">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <h2 className="text-[16px] font-medium text-ink">{entry.label}</h2>
                      <p className="mt-1 text-[12px] leading-5 text-muted">{entry.why}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[22px] font-semibold text-ink tabular-nums">{entry.current}</p>
                      <p className="text-[11px] text-muted">a month, each</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <input
                      type="number"
                      min={0}
                      max={500}
                      id={`allowance-${entry.bucket}`}
                      value={draft[entry.bucket] ?? ''}
                      onChange={event => setDraft(current => ({ ...current, [entry.bucket]: event.target.value }))}
                      placeholder={String(entry.current)}
                      className="w-28 rounded-lg border border-border px-3 py-2 text-[13px] tabular-nums"
                    />
                    <button
                      type="button"
                      disabled={busy === entry.bucket || !draft[entry.bucket]}
                      onClick={() => send(entry.bucket, 'set', draft[entry.bucket])}
                      className="btn-primary inline-flex items-center gap-1.5 !py-2 !px-3 text-[12px] disabled:opacity-40"
                    >
                      <Check size={13} /> Save
                    </button>
                    {entry.overridden && (
                      <button
                        type="button"
                        disabled={busy === entry.bucket}
                        onClick={() => send(entry.bucket, 'reset')}
                        className="btn-secondary inline-flex items-center gap-1.5 !py-2 !px-3 text-[12px]"
                      >
                        <RotateCcw size={13} /> Back to {entry.fallback}
                      </button>
                    )}
                    {busy === entry.bucket && <Loader2 size={15} className="animate-spin text-muted" />}
                    <span className="text-[11px] text-muted">
                      {entry.overridden ? `You changed this. The default is ${entry.fallback}.` : 'This is the default.'}
                    </span>
                  </div>

                  <div className="mt-4 border-t border-border pt-3 text-[12px] text-muted">
                    {entry.calls
                      ? <>Used {entry.calls} {entry.calls === 1 ? 'time' : 'times'} this month by {entry.people} {entry.people === 1 ? 'person' : 'people'}, costing {money(entry.pence)}. That is {money(entry.pencePerCall)} a press.</>
                      : <>Not used yet this month.</>}
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-7 text-[12px] leading-5 text-muted">
              Setting an allowance to zero switches that feature off for free members entirely.
              Interview Ready is not here: it runs on credits, which is the right model for it,
              because it helps one person win one job rather than making the register better.
            </p>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
