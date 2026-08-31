'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Briefcase, Mail, Phone } from 'lucide-react'

// The managed-search desk: every employer brief, its status, your working
// notes, and the status controls that keep the employer informed.

type Row = {
  id: string
  service: 'managed' | 'executive'
  job_title: string
  role_level: string | null
  salary_min: number | null
  salary_max: number | null
  location: string | null
  timeline: string | null
  brief: string
  status: string
  admin_notes: string | null
  created_at: string
  employer: { company_name: string | null; property_name: string | null; contact_email: string | null; phone: string | null } | null
}

const STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'search_active', label: 'Search underway' },
  { value: 'shortlist_sent', label: 'Shortlist sent' },
  { value: 'placed', label: 'Placed' },
  { value: 'closed', label: 'Closed' },
]

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-50 text-blue-700', reviewing: 'bg-amber-50 text-amber-700',
  search_active: 'bg-[#e8eef4] text-[#0b2f4d]', shortlist_sent: 'bg-purple-50 text-purple-700',
  placed: 'bg-green-50 text-green-700', closed: 'bg-gray-100 text-gray-500',
}

export default function AdminRecruitmentPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [filter, setFilter] = useState('active')

  useEffect(() => {
    fetch('/api/admin/recruitment')
      .then(res => res.json())
      .then(json => {
        if (json.error) { setError(json.error); return }
        setRows(json.rows || [])
        setNotes(Object.fromEntries((json.rows || []).map((row: Row) => [row.id, row.admin_notes || ''])))
      })
      .catch(() => setError('Could not load requests.'))
      .finally(() => setLoading(false))
  }, [])

  async function save(id: string, status?: string) {
    if (busy) return
    setBusy(id); setError('')
    try {
      const res = await fetch('/api/admin/recruitment', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, adminNotes: notes[id] }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not save.'); return }
      if (status) setRows(current => current.map(row => row.id === id ? { ...row, status } : row))
    } catch { setError('Could not save.') } finally { setBusy(null) }
  }

  const active = new Set(['new', 'reviewing', 'search_active', 'shortlist_sent'])
  const visible = filter === 'active' ? rows.filter(row => active.has(row.status)) : filter === 'all' ? rows : rows.filter(row => row.status === filter)
  const salary = (row: Row) => row.salary_min || row.salary_max
    ? `£${Number(row.salary_min || 0).toLocaleString()}${row.salary_max ? ` - £${Number(row.salary_max).toLocaleString()}` : ''}`
    : 'Not stated'

  return (
    <DashboardShell role="admin">
      <div className="max-w-3xl">
        <p className="dashboard-eyebrow">Recruitment services</p>
        <h1 className="dashboard-title">Managed search requests</h1>
        <p className="dashboard-intro mb-5 max-w-2xl">Every brief employers send lands here. Changing the status tells the employer where their search stands; your notes stay private to admin.</p>

        <div className="flex flex-wrap gap-1.5 mb-5">
          {[{ value: 'active', label: 'Active' }, ...STATUSES, { value: 'all', label: 'All' }].map(option => (
            <button key={option.value} type="button" onClick={() => setFilter(option.value)}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-semibold ${filter === option.value ? 'bg-[#0b2f4d] text-white' : 'bg-white border border-border text-secondary hover:text-ink'}`}>
              {option.label}
            </button>
          ))}
        </div>

        {error && <p className="text-[12.5px] text-red-600 font-medium mb-4">{error}</p>}
        {loading ? <p className="text-[13px] text-secondary">Loading...</p> : visible.length === 0 ? (
          <p className="text-[13px] text-secondary">No requests here yet. When an employer sends a brief from their Managed Search page, it appears in this queue and you get an email.</p>
        ) : (
          <div className="space-y-4">
            {visible.map(row => (
              <div key={row.id} className="dashboard-card">
                <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="text-[15px] font-semibold text-ink inline-flex items-center gap-1.5"><Briefcase size={14} className="text-[#10283b]" /> {row.job_title}{row.service === 'executive' ? ' · Executive search' : ''}</p>
                    <p className="text-[12.5px] text-secondary mt-0.5">{row.employer?.property_name || row.employer?.company_name || 'Unknown property'} · {salary(row)}{row.location ? ` · ${row.location}` : ''}{row.timeline ? ` · ${row.timeline}` : ''}</p>
                    <p className="text-[11.5px] text-muted mt-0.5">
                      Sent {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                      {row.employer?.contact_email && <span className="ml-2 inline-flex items-center gap-1"><Mail size={11} /> {row.employer.contact_email}</span>}
                      {row.employer?.phone && <span className="ml-2 inline-flex items-center gap-1"><Phone size={11} /> {row.employer.phone}</span>}
                    </p>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0 ${STATUS_COLORS[row.status] || 'bg-gray-100 text-gray-500'}`}>{STATUSES.find(option => option.value === row.status)?.label || row.status}</span>
                </div>
                <p className="text-[12.5px] text-gray-700 leading-relaxed bg-[#fafafa] rounded-lg px-3 py-2.5 mb-3 whitespace-pre-wrap">{row.brief}</p>
                <textarea rows={2} value={notes[row.id] || ''} onChange={e => setNotes(current => ({ ...current, [row.id]: e.target.value }))}
                  placeholder="Private working notes - candidates approached, conversations, fee agreed..."
                  className="input-field text-[12px] w-full mb-2" />
                <div className="flex flex-wrap items-center gap-2">
                  <select value={row.status} onChange={e => save(row.id, e.target.value)} disabled={busy === row.id} className="input-field text-[12px] w-auto">
                    {STATUSES.map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
                  </select>
                  <button type="button" disabled={busy === row.id} onClick={() => save(row.id)} className="btn-secondary text-[12px]">{busy === row.id ? 'Saving...' : 'Save notes'}</button>
                  <span className="text-[11px] text-muted">Changing status notifies the employer.</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
