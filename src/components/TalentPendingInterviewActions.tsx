'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle, Clock, MessageSquare } from 'lucide-react'

type PendingInterview = {
  id: string
  round_number: number
  interview_method: string
  proposed_slots?: string[] | null
}

type PipelineItem = {
  id: string
  job?: { job_title?: string } | null
  employer?: { property_name?: string; company_name?: string } | null
  interviews?: PendingInterview[]
}

function when(value: string) {
  return new Date(value).toLocaleString('en-GB', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function methodLabel(method: string) {
  return method === 'teams'
    ? 'Microsoft Teams'
    : method === 'video'
      ? 'Video call'
      : method === 'phone'
        ? 'Phone call'
        : 'In person'
}

function roundLabel(round: number) {
  if (round === 1) return 'First interview'
  if (round === 2) return 'Second interview'
  return 'Final interview'
}

function confirmLabel(round: number) {
  if (round === 1) return 'Confirm first interview'
  if (round === 2) return 'Confirm second interview'
  return 'Confirm final interview'
}

export default function TalentPendingInterviewActions() {
  const [items, setItems] = useState<PipelineItem[]>([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [selectedSlots, setSelectedSlots] = useState<Record<string, string>>({})
  const [notes, setNotes] = useState<Record<string, string>>({})

  async function load() {
    const res = await fetch('/api/talent/applications/pipeline-list', { cache: 'no-store' }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    if (!res?.ok) {
      setError(body.error || 'Could not load interview invitations.')
      return
    }
    setItems(body.items || [])
    setError('')
  }

  useEffect(() => { load() }, [])

  async function accept(interviewId: string) {
    const selectedSlot = selectedSlots[interviewId]
    if (!selectedSlot) {
      setError('Please select an interview time before confirming.')
      return
    }

    setBusy(interviewId)
    setError('')
    const res = await fetch('/api/talent/applications/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        interviewId,
        selectedSlot,
        note: notes[interviewId] || '',
      }),
    }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) {
      setError(body.error || 'Could not confirm this interview time.')
      return
    }
    await load()
    window.location.reload()
  }

  async function requestAlternative(interviewId: string) {
    const note = (notes[interviewId] || '').trim()
    if (note.length < 10) {
      setError('Add a note first telling the property when you are available, then request new times.')
      return
    }
    setBusy(interviewId)
    setError('')
    const res = await fetch('/api/talent/applications/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interviewId, action: 'request_alternative', note }),
    }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) {
      setError(body.error || 'Could not request alternative times.')
      return
    }
    await load()
    window.location.reload()
  }

  const pending = items.flatMap(item =>
    (item.interviews || [])
      .filter((interview: any) => interview.status === 'proposed' && Array.isArray(interview.proposed_slots) && interview.proposed_slots.length)
      .map(interview => ({ item, interview }))
  )

  if (!pending.length && !error) return null

  return (
    <section className="mb-7 overflow-hidden rounded-[22px] border border-[#555555] bg-white shadow-[0_16px_40px_rgba(28,28,28,0.07)]">
      <div className="border-b border-[#dddddd] bg-amber-50 px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1c1c1c]">Action required</p>
        <h2 className="mt-1 text-[24px] font-semibold tracking-[-.025em] text-ink">Confirm your next interview</h2>
        <p className="mt-1 max-w-2xl text-[12px] leading-5 text-secondary">Select the interview time you want, add a note to the property if needed, then click the confirmation button. Your interview is not confirmed until you press confirm.</p>
      </div>

      <div className="p-5">
        {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}

        <div className="space-y-4">
          {pending.map(({ item, interview }) => {
            const label = roundLabel(interview.round_number)
            const action = confirmLabel(interview.round_number)
            const selected = selectedSlots[interview.id] || ''
            return (
              <div key={interview.id} className="rounded-2xl border border-[#dddddd] bg-[#f1f1f1] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1c1c1c]">Stage {interview.round_number} of 3</p>
                    <h3 className="mt-1 text-[21px] font-semibold text-ink">{label}</h3>
                    <p className="mt-1 text-[13px] font-medium text-[#1c1c1c]">{item.job?.job_title || 'Role'}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{item.employer?.property_name || item.employer?.company_name || 'Property'}</p>
                  </div>
                  <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">Not yet confirmed</span>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px] text-secondary">
                  <CalendarDays size={14} className="text-[#1c1c1c]" />
                  <span><strong className="text-ink">Format:</strong> {methodLabel(interview.interview_method)}</span>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold text-ink">1. Select your interview time</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(interview.proposed_slots || []).map(slot => {
                      const isSelected = selected === slot
                      return (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => setSelectedSlots(current => ({ ...current, [interview.id]: slot }))}
                          className={`rounded-xl border px-4 py-3 text-left transition ${isSelected ? 'border-[#1c1c1c] bg-[#e7e7e7] shadow-sm' : 'border-[#555555] bg-white hover:border-[#1c1c1c]'}`}
                        >
                          <span className="flex items-center gap-2 text-[12px] font-semibold text-[#1c1c1c]"><Clock size={13} />{when(slot)}</span>
                          <span className={`mt-2 flex items-center gap-1.5 text-[11px] font-semibold ${isSelected ? 'text-emerald-700' : 'text-muted'}`}><CheckCircle size={13} />{isSelected ? 'Selected' : 'Click to select this time'}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="mt-4">
                  <label htmlFor={`note-${interview.id}`} className="mb-2 flex items-center gap-2 text-[11px] font-semibold text-ink">
                    <MessageSquare size={13} className="text-[#1c1c1c]" />2. Add a note to the property <span className="font-normal text-muted">(optional)</span>
                  </label>
                  <textarea
                    id={`note-${interview.id}`}
                    value={notes[interview.id] || ''}
                    onChange={event => setNotes(current => ({ ...current, [interview.id]: event.target.value }))}
                    maxLength={1500}
                    rows={3}
                    placeholder="For example: Thank you, I look forward to meeting you."
                    className="w-full rounded-xl border border-[#dddddd] bg-white px-3 py-3 text-[12px] text-ink outline-none transition placeholder:text-muted focus:border-[#1c1c1c]"
                  />
                </div>

                <div className="mt-4 border-t border-[#dddddd] pt-4">
                  <p className="mb-3 text-[11px] text-secondary">3. Confirm your attendance. This will notify the property that you have accepted this interview time.</p>
                  <button
                    type="button"
                    disabled={!selected || busy === interview.id}
                    onClick={() => accept(interview.id)}
                    className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#1c1c1c] px-5 py-3 text-[12px] font-semibold text-white transition hover:bg-[#333333] disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <CheckCircle size={15} />
                    {busy === interview.id ? 'Confirming interview…' : action}
                  </button>
                  <button
                    type="button"
                    disabled={busy === interview.id}
                    onClick={() => requestAlternative(interview.id)}
                    className="mt-2 block text-[11px] font-semibold text-[#1c1c1c] underline disabled:opacity-40 sm:ml-3 sm:mt-0 sm:inline-block"
                  >
                    None of these times work - request alternatives
                  </button>
                  <p className="mt-2 text-[10px] text-muted">To request alternatives, first use the note box above to say when you are available.</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
