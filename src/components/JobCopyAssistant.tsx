'use client'

import { useState } from 'react'
import { Sparkles, Check, X } from 'lucide-react'

// Two small helpers for writing an advert, sharing one route.
//
// Both draft and neither publishes. What comes back is shown next to what
// the employer wrote, and it only replaces it if they press Use. A property
// whose advert says something they did not mean is a problem that surfaces
// at interview, in front of the person they were trying to impress.

type Role = Record<string, unknown>

async function callAssistant(payload: Record<string, unknown>) {
  const res = await fetch('/api/employer/jobs/ai', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  const body = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(body?.error || 'The writing assistant failed.')
  return body
}

/** Rewrites one field the employer has already written. */
export function PolishButton({ field, text, role, jobId, onApply }: {
  field: string
  text: string
  role: Role
  jobId?: string
  onApply: (value: string) => void
}) {
  const [busy, setBusy] = useState(false)
  const [suggestion, setSuggestion] = useState('')
  const [error, setError] = useState('')

  async function run() {
    setBusy(true); setError(''); setSuggestion('')
    try {
      const body = await callAssistant({ mode: 'polish', field, text, role, jobId })
      setSuggestion(String(body.text || ''))
    } catch (e: any) {
      setError(e?.message || 'The writing assistant failed.')
    } finally {
      setBusy(false)
    }
  }

  const tooShort = text.trim().length < 10

  return <div className="mt-1.5">
    <button type="button" onClick={run} disabled={busy || tooShort}
      className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-secondary hover:text-ink disabled:opacity-40">
      <Sparkles size={12} />{busy ? 'Reading it…' : 'Tidy this up'}
    </button>
    {tooShort && <span className="ml-2 text-[10.5px] text-muted">Write a line or two first.</span>}
    {error && <p className="mt-1.5 text-[11px] text-red-600">{error}</p>}

    {suggestion && <div className="mt-2 rounded-xl border border-border bg-[#f1f1f1] p-3">
      <p className="text-[10px] uppercase tracking-[.12em] font-semibold text-muted">Suggested</p>
      <p className="mt-1.5 whitespace-pre-wrap text-[12.5px] leading-6 text-ink">{suggestion}</p>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => { onApply(suggestion); setSuggestion('') }}
          className="btn-primary !py-1.5 !px-3 text-[11px] inline-flex items-center gap-1.5"><Check size={12} />Use this</button>
        <button type="button" onClick={() => setSuggestion('')}
          className="btn-secondary !py-1.5 !px-3 text-[11px] inline-flex items-center gap-1.5"><X size={12} />Keep mine</button>
      </div>
    </div>}
  </div>
}

/** Turns rough notes into first drafts of the fields nobody enjoys writing. */
export function StoryDrafter({ role, jobId, onApply }: {
  role: Role
  jobId?: string
  onApply: (draft: Record<string, string>) => void
}) {
  const [open, setOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState<Record<string, string> | null>(null)

  async function run() {
    setBusy(true); setError(''); setDraft(null)
    try {
      const body = await callAssistant({ mode: 'draft_story', notes, role, jobId })
      const proposed = body.draft || {}
      // A model that fills every box with something plausible is worse than
      // one that leaves gaps, so an empty answer is respected as an answer.
      if (!Object.keys(proposed).length) {
        setError('There was not enough in those notes to say anything true. Add a few more details.')
        return
      }
      setDraft(proposed)
    } catch (e: any) {
      setError(e?.message || 'The writing assistant failed.')
    } finally {
      setBusy(false)
    }
  }

  const LABELS: Record<string, string> = {
    why_role_exists: 'Why the role exists',
    success_90_days: 'Success in ninety days',
    reporting_line: 'Reporting line',
    opening_hours: 'Opening hours',
    commercial_responsibility: 'Commercial responsibility',
    why_move: 'Why move here',
    career_progression: 'Where it leads',
    interview_process: 'Interview process',
  }

  if (!open) {
    return <button type="button" onClick={() => setOpen(true)}
      className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-secondary hover:text-ink">
      <Sparkles size={13} />Draft these from a few notes
    </button>
  }

  return <div className="rounded-xl border border-border bg-white p-4">
    <p className="text-[12px] font-semibold text-ink">Tell it about the role in your own words</p>
    <p className="mt-1 text-[11px] leading-5 text-muted">Rough notes are fine. It only uses what you write here and what is already on the role, and it leaves anything it cannot support blank rather than making it up. Everything comes back for you to edit.</p>
    <textarea rows={4} value={notes} onChange={e => setNotes(e.target.value)} className="input-field mt-3"
      placeholder="Maternity cover turned permanent. Spa does about 40k a month, retail is weak and that is the main thing to fix. Reports to the GM. Small team, four therapists. We are refurbishing the thermal suite in the spring." />

    {error && <p className="mt-2 text-[11px] text-red-600">{error}</p>}

    <div className="mt-3 flex gap-2">
      <button type="button" onClick={run} disabled={busy || notes.trim().length < 20}
        className="btn-primary !py-2 text-[12px] disabled:opacity-40">{busy ? 'Writing…' : 'Draft it'}</button>
      <button type="button" onClick={() => { setOpen(false); setDraft(null); setError('') }}
        className="btn-secondary !py-2 text-[12px]">Close</button>
    </div>

    {draft && <div className="mt-4 border-t border-border pt-4">
      <p className="text-[10px] uppercase tracking-[.12em] font-semibold text-muted">Suggested, for you to edit</p>
      <div className="mt-2 space-y-3">
        {Object.entries(draft).map(([field, value]) => <div key={field}>
          <p className="text-[11px] font-semibold text-ink">{LABELS[field] || field}</p>
          <p className="mt-0.5 whitespace-pre-wrap text-[12px] leading-6 text-secondary">{value}</p>
        </div>)}
      </div>
      <div className="mt-3 flex gap-2">
        <button type="button" onClick={() => { onApply(draft); setDraft(null); setOpen(false) }}
          className="btn-primary !py-1.5 !px-3 text-[11px] inline-flex items-center gap-1.5"><Check size={12} />Put these in the form</button>
        <button type="button" onClick={() => setDraft(null)}
          className="btn-secondary !py-1.5 !px-3 text-[11px]">Discard</button>
      </div>
      <p className="mt-2 text-[10.5px] leading-4 text-muted">Read them before you save. Nothing here has been published.</p>
    </div>}
  </div>
}
