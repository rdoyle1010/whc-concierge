'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { CalendarDays, MessageSquare, RotateCcw, FileText, Briefcase } from 'lucide-react'

function formatDate(value?: string | null) {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
}

function methodLabel(method: string) {
  return method === 'teams' ? 'Microsoft Teams' : method === 'video' ? 'Video call' : method === 'phone' ? 'Phone call' : 'In person'
}

export default function EmployerHiredPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [expanded, setExpanded] = useState<string | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch('/api/employer/hired', { cache:'no-store' }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    if (!res?.ok) setError(body.error || 'Could not load hired placements.')
    else { setItems(body.items || []); setError('') }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function reopen(applicationId: string) {
    if (!confirm('Reopen this recruitment record? The vacancy will remain closed and will not be advertised again.')) return
    setBusy(applicationId)
    const res = await fetch('/api/employer/hired', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ applicationId, action:'reopen_record' }) }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) { setError(body.error || 'Could not reopen the record.'); return }
    await load()
  }

  return <DashboardShell role="employer">
    <div className="mb-7">
      <p className="dashboard-eyebrow">Placement archive</p>
      <h1 className="dashboard-title">Hired</h1>
      <p className="dashboard-intro">Completed placements sit here away from active recruitment. Their application, interview and offer history remains available for record keeping and can be reopened without relisting the vacancy.</p>
    </div>

    {error && <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-[12px] text-red-600">{error}</div>}
    {loading ? <div className="flex h-52 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div>
    : items.length === 0 ? <div className="dashboard-card py-16 text-center text-[13px] text-gray-400">No completed hires yet.</div>
    : <div className="space-y-4">{items.map(item => {
      const candidate = item.candidate || {}
      const job = item.job || {}
      const isOpen = expanded === item.id
      return <div key={item.id} className="dashboard-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold text-ink">{candidate.full_name || 'Candidate'}</h2>
              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-emerald-700">Hired</span>
            </div>
            <p className="mt-1 text-[13px] text-gray-500">{job.job_title || 'Role'}{candidate.headline ? ` · ${candidate.headline}` : ''}</p>
            <p className="mt-2 text-[11px] text-gray-400">Hired {formatDate(item.hired_at)} · Archived {formatDate(item.archived_at)}{candidate.location ? ` · ${candidate.location}` : ''}</p>
            <div className="mt-4 flex flex-wrap gap-3">
              {candidate.user_id && <a href={`/employer/messages?to=${candidate.user_id}`} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#17344d] hover:underline"><MessageSquare size={13}/> View communication</a>}
              <button type="button" onClick={() => setExpanded(isOpen ? null : item.id)} className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#1a1a1a] hover:underline"><FileText size={13}/>{isOpen ? 'Hide recruitment history' : 'View recruitment history'}</button>
            </div>
          </div>
          <button type="button" disabled={busy===item.id} onClick={()=>reopen(item.id)} className="btn-secondary inline-flex items-center justify-center gap-2"><RotateCcw size={14}/>{busy===item.id ? 'Reopening…' : 'Reopen record'}</button>
        </div>

        {isOpen && <div className="mt-5 border-t border-[#e5e5e5] pt-5">
          {(item.cover_note || item.cover_letter) && <div className="rounded-xl bg-[#fafafa] p-4"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#1a1a1a]">Original covering letter</p><p className="whitespace-pre-wrap text-[12px] leading-6 text-gray-600">{item.cover_note || item.cover_letter}</p></div>}
          {(item.interviews || []).length > 0 && <div className="mt-4"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[.14em] text-[#1a1a1a]">Interview history</p><div className="space-y-2">{item.interviews.map((interview:any)=><div key={interview.id} className="rounded-xl border border-[#e5e5e5] bg-white p-3"><div className="flex items-center gap-2 text-[12px] font-semibold text-ink"><CalendarDays size={13}/> Interview {interview.round_number} · {methodLabel(interview.interview_method)}</div><p className="mt-1 text-[11px] text-gray-500">{interview.selected_slot ? new Date(interview.selected_slot).toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'}) : 'No confirmed time recorded'}</p>{interview.employer_note && <p className="mt-2 text-[11px] leading-5 text-gray-600">{interview.employer_note}</p>}</div>)}</div></div>}
          {item.offer && <div className="mt-4 rounded-xl border border-[#e5e5e5] bg-[#fffaf0] p-4"><div className="flex items-center gap-2"><Briefcase size={13}/><p className="text-[12px] font-semibold text-ink">Offer communication</p></div>{item.offer.employer_note && <p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-gray-600">{item.offer.employer_note}</p>}</div>}
        </div>}
      </div>
    })}</div>}
  </DashboardShell>
}
