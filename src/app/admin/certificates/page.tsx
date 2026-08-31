'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { BadgeCheck, ExternalLink, ShieldQuestion, Sparkles, X } from 'lucide-react'

// The certificate review queue: every structured submission from talent,
// newest first, with verify / more info / reject and a note that goes
// straight to the professional.

type Row = {
  id: string
  candidate_id: string
  title: string
  awarding_body: string | null
  country: string | null
  year_awarded: number | null
  document_url: string
  status: 'submitted' | 'verified' | 'rejected' | 'more_info'
  review_note: string | null
  verified_at: string | null
  created_at: string
  candidate: { full_name: string | null; role_level: string | null } | null
}

const STATUS_COLORS: Record<string, string> = {
  submitted: 'bg-amber-50 text-amber-700',
  verified: 'bg-green-50 text-green-700',
  rejected: 'bg-red-50 text-red-600',
  more_info: 'bg-blue-50 text-blue-700',
}

export default function AdminCertificatesPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [assist, setAssist] = useState<Record<string, any>>({})
  const [assistBusy, setAssistBusy] = useState<string | null>(null)

  async function runAssist(id: string) {
    if (assistBusy) return
    setAssistBusy(id); setError('')
    try {
      const res = await fetch('/api/admin/certificates/assist', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'AI assist failed.'); return }
      setAssist(current => ({ ...current, [id]: json }))
    } catch { setError('AI assist failed.') } finally { setAssistBusy(null) }
  }

  async function load() {
    try {
      const res = await fetch('/api/admin/certificates')
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not load certificates.'); return }
      setRows(json.rows || [])
    } catch { setError('Could not load certificates.') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function decide(id: string, decision: 'verified' | 'rejected' | 'more_info') {
    if (busy) return
    setBusy(id); setError('')
    try {
      const res = await fetch('/api/admin/certificates', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, decision, note: notes[id] || '' }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not save the decision.'); return }
      setRows(current => current.map(row => row.id === id ? { ...row, status: decision, review_note: notes[id] || null } : row))
    } catch { setError('Could not save the decision.') } finally { setBusy(null) }
  }

  const pending = rows.filter(row => row.status === 'submitted')
  const rest = rows.filter(row => row.status !== 'submitted')

  function CertificateCard({ row }: { row: Row }) {
    return (
      <div className="dashboard-card">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <p className="text-[14px] font-semibold text-ink inline-flex items-center gap-1.5">
              {row.status === 'verified' && <BadgeCheck size={15} className="text-green-600" />}
              {row.title}
            </p>
            <p className="text-[12px] text-secondary mt-0.5">
              {row.candidate?.full_name || 'Unknown professional'}{row.candidate?.role_level ? ` · ${row.candidate.role_level}` : ''}
            </p>
            <p className="text-[11.5px] text-muted mt-0.5">
              {[row.awarding_body, row.country, row.year_awarded].filter(Boolean).join(' · ') || 'No details supplied'}
              {' · submitted '}{new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${STATUS_COLORS[row.status]}`}>{row.status === 'more_info' ? 'More info' : row.status}</span>
            <a href={row.document_url} target="_blank" rel="noopener noreferrer" className="btn-secondary text-[11.5px] inline-flex items-center gap-1"><ExternalLink size={12} /> Open document</a>
          </div>
        </div>
        {row.status === 'submitted' ? (
          <div>
            {!assist[row.id] && (
              <button type="button" disabled={assistBusy === row.id} onClick={() => runAssist(row.id)} className="mb-2 inline-flex items-center gap-1.5 rounded-lg border border-[#e5e5e5] bg-[#f5f6f8] px-3 py-1.5 text-[12px] font-semibold text-[#10283b] hover:bg-[#f5f6f8]">
                <Sparkles size={13} /> {assistBusy === row.id ? 'Reviewing...' : 'AI review'}
              </button>
            )}
            {assist[row.id] && (
              <div className="mb-3 rounded-lg border border-[#e5e5e5] bg-[#f5f6f8] p-3">
                <p className="text-[10.5px] font-semibold uppercase tracking-[0.12em] text-[#10283b] mb-1.5 inline-flex items-center gap-1"><Sparkles size={11} /> AI assessment{assist[row.id].recognition ? ` · ${String(assist[row.id].recognition).replace('_', ' ')}` : ''}</p>
                <p className="text-[12.5px] text-gray-700 leading-relaxed mb-2">{assist[row.id].assessment}</p>
                {assist[row.id].equivalence_note && <p className="text-[12px] text-gray-600 mb-2"><strong className="text-ink">Equivalence:</strong> {assist[row.id].equivalence_note}</p>}
                {Array.isArray(assist[row.id].checks) && assist[row.id].checks.length > 0 && (
                  <ul className="mb-2 space-y-0.5">{assist[row.id].checks.map((check: string, i: number) => <li key={i} className="text-[12px] text-gray-600">☐ {check}</li>)}</ul>
                )}
                {assist[row.id].drafts && (
                  <div className="flex flex-wrap gap-1.5 pt-1 border-t border-[#eeeeee]">
                    <span className="text-[11px] text-gray-500 py-1">Use drafted message:</span>
                    {(['verified', 'more_info', 'rejected'] as const).map(kind => assist[row.id].drafts[kind] && (
                      <button key={kind} type="button" onClick={() => setNotes(current => ({ ...current, [row.id]: assist[row.id].drafts[kind] }))} className="rounded-full border border-[#e5e5e5] bg-white px-2.5 py-1 text-[11px] font-semibold text-[#10283b] hover:bg-[#f5f6f8]">
                        {kind === 'verified' ? 'Verify + congratulate' : kind === 'more_info' ? 'Ask for more info' : 'Decline kindly'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
            <textarea rows={2} value={notes[row.id] || ''} onChange={e => setNotes(current => ({ ...current, [row.id]: e.target.value }))}
              placeholder="Note to the professional (required for reject / more info) - e.g. The document is cropped, please upload the full certificate showing the awarding body."
              className="input-field text-[12px] w-full mb-2" />
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy === row.id} onClick={() => decide(row.id, 'verified')} className="btn-primary text-[12px]">Verify</button>
              <button type="button" disabled={busy === row.id} onClick={() => decide(row.id, 'more_info')} className="btn-secondary text-[12px]">Ask for more info</button>
              <button type="button" disabled={busy === row.id} onClick={() => decide(row.id, 'rejected')} className="text-[12px] font-semibold text-red-600 px-3 py-2 hover:bg-red-50 rounded-lg inline-flex items-center gap-1"><X size={13} /> Reject</button>
            </div>
          </div>
        ) : row.review_note ? (
          <p className="text-[12px] text-secondary bg-[#fafafa] rounded px-3 py-2"><ShieldQuestion size={12} className="inline mr-1 -mt-0.5" /> {row.review_note}</p>
        ) : null}
      </div>
    )
  }

  return (
    <DashboardShell role="admin">
      <div className="max-w-3xl">
        <p className="dashboard-eyebrow">People & operations</p>
        <h1 className="dashboard-title">Certificate review</h1>
        <p className="dashboard-intro mb-6 max-w-2xl">Every certificate a professional submits lands here with its details and document. Verify it, ask for more information, or reject it - your note goes straight to the professional, and verified certificates carry a trust badge on their profile.</p>

        {error && <p className="text-[12.5px] text-red-600 font-medium mb-4">{error}</p>}
        {loading ? <p className="text-[13px] text-secondary">Loading...</p> : (
          <div className="space-y-6">
            <div>
              <h2 className="font-serif text-lg font-semibold text-ink mb-3">Waiting for review {pending.length > 0 && <span className="ml-1 px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 text-[12px] align-middle">{pending.length}</span>}</h2>
              {pending.length === 0 ? <p className="text-[13px] text-secondary">Nothing waiting - all caught up.</p> : (
                <div className="space-y-3">{pending.map(row => <CertificateCard key={row.id} row={row} />)}</div>
              )}
            </div>
            {rest.length > 0 && (
              <div>
                <h2 className="font-serif text-lg font-semibold text-ink mb-3">Reviewed</h2>
                <div className="space-y-3">{rest.map(row => <CertificateCard key={row.id} row={row} />)}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
