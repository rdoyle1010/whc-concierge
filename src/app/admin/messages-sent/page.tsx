'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Mail, MessageSquare, Search, AlertTriangle } from 'lucide-react'

// What the platform has sent, to whom, and whether it arrived.
//
// A failed send used to print to a serverless console and vanish within days,
// so a person asking "I never got my email" could only be answered with a
// guess. Skipped is kept as distinct from failed on purpose: never attempted
// and rejected by the provider are different problems with different fixes.

const CHANNELS = [
  { value: '', label: 'Everything' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'Text' },
] as const

const STATUSES = [
  { value: '', label: 'Any outcome' },
  { value: 'sent', label: 'Sent' },
  { value: 'failed', label: 'Failed' },
  { value: 'skipped', label: 'Never sent' },
] as const

export default function AdminMessagesSentPage() {
  const [rows, setRows] = useState<any[]>([])
  const [counts, setCounts] = useState<any>(null)
  const [unavailable, setUnavailable] = useState(false)
  const [loading, setLoading] = useState(true)
  const [channel, setChannel] = useState('')
  const [status, setStatus] = useState('')
  const [search, setSearch] = useState('')

  useEffect(() => {
    let active = true
    setLoading(true)
    const params = new URLSearchParams()
    if (channel) params.set('channel', channel)
    if (status) params.set('status', status)
    if (search.trim()) params.set('q', search.trim())
    // Debounced, so typing an address does not fire a query per keystroke.
    const timer = setTimeout(() => {
      fetch(`/api/admin/messages-sent?${params}`, { cache: 'no-store' })
        .then(res => res.ok ? res.json() : null)
        .then(json => {
          if (!active) return
          setRows(json?.rows || [])
          setCounts(json?.counts || null)
          setUnavailable(Boolean(json?.unavailable))
        })
        .catch(() => {})
        .finally(() => { if (active) setLoading(false) })
    }, search ? 300 : 0)
    return () => { active = false; clearTimeout(timer) }
  }, [channel, status, search])

  const badge = (value: string) =>
    value === 'sent' ? 'bg-emerald-50 text-emerald-700'
      : value === 'failed' ? 'bg-red-50 text-red-700'
      : 'bg-[#f1f1f1] text-secondary'

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-7">
        <p className="dashboard-eyebrow">People &amp; operations</p>
        <h1 className="dashboard-title">Messages we sent</h1>
        <p className="dashboard-intro">
          Every email and text the platform has sent, and what happened to it. The last 200, newest first.
        </p>
      </div>

      {unavailable ? (
        <div className="dashboard-card flex gap-2.5">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" />
          <p className="text-[13px] leading-6 text-secondary">
            The message log table has not been created yet. Run the email_log migration and everything sent from then on
            appears here.
          </p>
        </div>
      ) : (
        <>
          {counts && (
            <div className="mb-6 grid grid-cols-3 gap-4 sm:max-w-lg">
              {[['Sent', counts.sent], ['Failed', counts.failed], ['Never sent', counts.skipped]].map(([label, value]) => (
                <div key={String(label)} className="dashboard-card">
                  <p className="text-[22px] font-semibold text-ink">{String(value)}</p>
                  <p className="text-[11px] text-muted">{String(label)}</p>
                </div>
              ))}
            </div>
          )}

          <div className="mb-6 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search} onChange={event => setSearch(event.target.value)}
                placeholder="Search by email address or mobile number"
                aria-label="Search messages by email address or mobile number"
                className="input-field pl-10"
              />
            </div>
            <select value={channel} onChange={event => setChannel(event.target.value)} aria-label="Filter by channel" className="input-field sm:w-44">
              {CHANNELS.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <select value={status} onChange={event => setStatus(event.target.value)} aria-label="Filter by outcome" className="input-field sm:w-44">
              {STATUSES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </div>

          {loading ? <div className="skeleton h-64 w-full" /> : rows.length === 0 ? (
            <p className="py-12 text-center text-muted">
              Nothing recorded{search || channel || status ? ' for that' : ' yet'}. Anything sent before the log existed
              will not appear here.
            </p>
          ) : (
            <div className="space-y-2">
              {rows.map(row => (
                <div key={row.id} className="dashboard-card !p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="flex items-center gap-2 text-[13px] font-medium text-ink">
                        {row.channel === 'sms' ? <MessageSquare size={13} className="text-muted" /> : <Mail size={13} className="text-muted" />}
                        <span className="truncate">{row.subject || row.kind}</span>
                      </p>
                      <p className="mt-1 text-[12px] text-muted">
                        {row.recipient} &middot; {row.kind.replace(/_/g, ' ')} &middot; {new Date(row.created_at).toLocaleString('en-GB')}
                      </p>
                    </div>
                    <span className={`shrink-0 px-2 py-1 text-[11px] font-medium ${badge(row.status)}`}>
                      {row.status === 'skipped' ? 'never sent' : row.status}
                    </span>
                  </div>
                  {row.error && <p className="mt-2 text-[11px] leading-5 text-red-600">{row.error}</p>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}
