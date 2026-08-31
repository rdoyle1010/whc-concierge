'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Download, Search } from 'lucide-react'

// Newsletter subscribers: counts, a searchable list, CSV export of confirmed
// addresses and a two-click remove per row - plus the signup popup settings
// that drive /api/newsletter/config.

type Subscriber = {
  id: string
  email: string
  status: 'pending' | 'confirmed' | 'unsubscribed'
  requested_at: string | null
  confirmed_at: string | null
  unsubscribed_at: string | null
  source: string | null
  created_at: string
}

type PopupSettings = {
  enabled: boolean
  heading: string
  text: string
  button: string
  delaySeconds: number
  frequencyDays: number
}

const STATUS_STYLES: Record<string, string> = {
  confirmed: 'bg-surface text-ink border border-border',
  pending: 'bg-surface text-secondary border border-border',
  unsubscribed: 'bg-surface text-muted border border-border',
}

function formatDate(value: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function AdminNewsletterPage() {
  const [rows, setRows] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [removingId, setRemovingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  const [popup, setPopup] = useState<PopupSettings | null>(null)
  const [popupSaving, setPopupSaving] = useState(false)
  const [popupMessage, setPopupMessage] = useState('')
  const [popupError, setPopupError] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/admin/newsletter')
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not load subscribers.'); return }
      setRows(json.subscribers || [])
    } catch { setError('Could not load subscribers.') } finally { setLoading(false) }
  }

  useEffect(() => {
    load()
    fetch('/api/newsletter/config', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (data) setPopup(data) })
      .catch(() => setPopupError('Could not load popup settings.'))
  }, [])

  const counts = useMemo(() => ({
    confirmed: rows.filter(row => row.status === 'confirmed').length,
    pending: rows.filter(row => row.status === 'pending').length,
    unsubscribed: rows.filter(row => row.status === 'unsubscribed').length,
  }), [rows])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter(row => row.email.toLowerCase().includes(q))
  }, [rows, search])

  async function removeSubscriber(id: string) {
    if (removingId) return
    setRemovingId(id); setError('')
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'remove', id }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not remove the subscriber.'); return }
      const now = new Date().toISOString()
      setRows(current => current.map(row => row.id === id ? { ...row, status: 'unsubscribed', unsubscribed_at: now } : row))
    } catch { setError('Could not remove the subscriber.') } finally { setRemovingId(null); setConfirmId(null) }
  }

  function exportCsv() {
    const confirmed = rows.filter(row => row.status === 'confirmed')
    const escapeCell = (value: string | null) => `"${String(value ?? '').replace(/"/g, '""')}"`
    const lines = [
      ['email', 'confirmed_at', 'source'].join(','),
      ...confirmed.map(row => [escapeCell(row.email), escapeCell(row.confirmed_at), escapeCell(row.source)].join(',')),
    ]
    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `newsletter-confirmed-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  async function savePopup(event: React.FormEvent) {
    event.preventDefault()
    if (!popup || popupSaving) return
    setPopupSaving(true); setPopupMessage(''); setPopupError('')
    try {
      const res = await fetch('/api/admin/newsletter', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_popup', ...popup }),
      })
      const json = await res.json()
      if (!res.ok) { setPopupError(json.error || 'Could not save popup settings.'); return }
      setPopupMessage('Popup settings saved.')
    } catch { setPopupError('Could not save popup settings.') } finally { setPopupSaving(false) }
  }

  return (
    <DashboardShell role="admin">
      <div className="max-w-5xl">
        <p className="text-[11px] uppercase tracking-[0.18em] text-accent font-semibold mb-1.5">Content &amp; revenue</p>
        <h1 className="font-serif text-[26px] font-bold text-ink mb-2">Newsletter</h1>
        <p className="text-[13.5px] text-secondary mb-6 max-w-2xl">Everyone who has signed up to the mailing list, with double opt-in status. Export confirmed addresses for a send, remove anyone who asks, and manage the signup popup shown across the public site.</p>

        {error && <p className="text-[12.5px] text-red-600 font-medium mb-4">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="dashboard-card">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted font-semibold">Confirmed</p>
            <p className="text-[28px] font-bold text-ink mt-1">{counts.confirmed}</p>
          </div>
          <div className="dashboard-card">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted font-semibold">Pending</p>
            <p className="text-[28px] font-bold text-ink mt-1">{counts.pending}</p>
          </div>
          <div className="dashboard-card">
            <p className="text-[11px] uppercase tracking-[0.14em] text-muted font-semibold">Unsubscribed</p>
            <p className="text-[28px] font-bold text-ink mt-1">{counts.unsubscribed}</p>
          </div>
        </div>

        <div className="dashboard-card mb-6">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
            <h2 className="font-serif text-lg font-semibold text-ink">Subscribers</h2>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <input
                  type="search"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search by email"
                  className="input-field !pl-9 text-[12.5px] w-56"
                />
              </div>
              <button type="button" onClick={exportCsv} disabled={counts.confirmed === 0} className="btn-secondary text-[12px] inline-flex items-center gap-1.5 disabled:opacity-50">
                <Download size={13} /> Export confirmed CSV
              </button>
            </div>
          </div>

          {loading ? <p className="text-[13px] text-secondary">Loading...</p> : filtered.length === 0 ? (
            <p className="text-[13px] text-secondary">{search ? 'No subscribers match that search.' : 'No subscribers yet.'}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="py-2 pr-4 text-[11px] uppercase tracking-[0.12em] text-muted font-semibold">Email</th>
                    <th className="py-2 pr-4 text-[11px] uppercase tracking-[0.12em] text-muted font-semibold">Status</th>
                    <th className="py-2 pr-4 text-[11px] uppercase tracking-[0.12em] text-muted font-semibold">Requested</th>
                    <th className="py-2 pr-4 text-[11px] uppercase tracking-[0.12em] text-muted font-semibold">Confirmed</th>
                    <th className="py-2 pr-4 text-[11px] uppercase tracking-[0.12em] text-muted font-semibold">Source</th>
                    <th className="py-2 text-[11px] uppercase tracking-[0.12em] text-muted font-semibold"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(row => (
                    <tr key={row.id} className="border-b border-border last:border-0">
                      <td className="py-2.5 pr-4 text-[12.5px] text-ink font-medium break-all">{row.email}</td>
                      <td className="py-2.5 pr-4">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_STYLES[row.status] || STATUS_STYLES.pending}`}>{row.status}</span>
                      </td>
                      <td className="py-2.5 pr-4 text-[12px] text-secondary whitespace-nowrap">{formatDate(row.requested_at)}</td>
                      <td className="py-2.5 pr-4 text-[12px] text-secondary whitespace-nowrap">{formatDate(row.confirmed_at)}</td>
                      <td className="py-2.5 pr-4 text-[12px] text-secondary whitespace-nowrap">{row.source || '-'}</td>
                      <td className="py-2.5 text-right">
                        {row.status === 'unsubscribed' ? (
                          <span className="text-[11.5px] text-muted">Removed</span>
                        ) : confirmId === row.id ? (
                          <span className="inline-flex items-center gap-1.5">
                            <button type="button" disabled={removingId === row.id} onClick={() => removeSubscriber(row.id)} className="text-[11.5px] font-semibold text-red-600 px-2.5 py-1.5 hover:bg-red-50 rounded-lg">
                              {removingId === row.id ? 'Removing...' : 'Confirm'}
                            </button>
                            <button type="button" onClick={() => setConfirmId(null)} className="text-[11.5px] font-semibold text-secondary px-2.5 py-1.5 hover:bg-surface rounded-lg">Cancel</button>
                          </span>
                        ) : (
                          <button type="button" onClick={() => setConfirmId(row.id)} className="text-[11.5px] font-semibold text-secondary px-2.5 py-1.5 hover:bg-surface rounded-lg">Remove</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-[11px] text-muted mt-3">Removing a subscriber marks them unsubscribed - their consent record is kept for compliance. The list shows the most recent 500 signups.</p>
        </div>

        <div className="dashboard-card max-w-3xl">
          <h2 className="font-serif text-lg font-semibold text-ink mb-1">Signup popup</h2>
          <p className="text-[12.5px] text-secondary mb-4">Controls the newsletter popup shown to visitors across the public site.</p>
          {!popup ? (
            <p className="text-[13px] text-secondary">{popupError || 'Loading...'}</p>
          ) : (
            <form onSubmit={savePopup} className="space-y-4">
              <label className="flex items-center gap-2.5 text-[13px] text-ink font-medium">
                <input type="checkbox" checked={popup.enabled} onChange={e => setPopup({ ...popup, enabled: e.target.checked })} className="h-4 w-4 accent-[#0b2f4d]" />
                Show the signup popup
              </label>
              <div>
                <label htmlFor="popup-heading" className="block text-[12px] font-semibold text-ink mb-1">Heading</label>
                <input id="popup-heading" type="text" value={popup.heading} onChange={e => setPopup({ ...popup, heading: e.target.value })} className="input-field w-full text-[13px]" />
              </div>
              <div>
                <label htmlFor="popup-text" className="block text-[12px] font-semibold text-ink mb-1">Supporting text</label>
                <textarea id="popup-text" rows={2} value={popup.text} onChange={e => setPopup({ ...popup, text: e.target.value })} className="input-field w-full text-[13px]" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label htmlFor="popup-button" className="block text-[12px] font-semibold text-ink mb-1">Button label</label>
                  <input id="popup-button" type="text" value={popup.button} onChange={e => setPopup({ ...popup, button: e.target.value })} className="input-field w-full text-[13px]" />
                </div>
                <div>
                  <label htmlFor="popup-delay" className="block text-[12px] font-semibold text-ink mb-1">Delay (seconds)</label>
                  <input id="popup-delay" type="number" min={0} max={60} value={popup.delaySeconds} onChange={e => setPopup({ ...popup, delaySeconds: Number(e.target.value) })} className="input-field w-full text-[13px]" />
                </div>
                <div>
                  <label htmlFor="popup-frequency" className="block text-[12px] font-semibold text-ink mb-1">Show again after (days)</label>
                  <input id="popup-frequency" type="number" min={1} max={90} value={popup.frequencyDays} onChange={e => setPopup({ ...popup, frequencyDays: Number(e.target.value) })} className="input-field w-full text-[13px]" />
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={popupSaving} className="btn-primary text-[12.5px]">{popupSaving ? 'Saving...' : 'Save popup settings'}</button>
                {popupMessage && <p className="text-[12px] text-secondary font-medium">{popupMessage}</p>}
                {popupError && <p className="text-[12px] text-red-600 font-medium">{popupError}</p>}
              </div>
            </form>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
