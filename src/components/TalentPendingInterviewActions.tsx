'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle, Clock } from 'lucide-react'

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

export default function TalentPendingInterviewActions() {
  const [items, setItems] = useState<PipelineItem[]>([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

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

  async function accept(interviewId: string, selectedSlot: string) {
    setBusy(`${interviewId}:${selectedSlot}`)
    setError('')
    const res = await fetch('/api/talent/applications/interview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ interviewId, selectedSlot }),
    }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) {
      setError(body.error || 'Could not accept this interview time.')
      return
    }
    await load()
    window.location.reload()
  }

  const pending = items.flatMap(item =>
    (item.interviews || [])
      .filter((interview: any) => interview.status === 'proposed' && Array.isArray(interview.proposed_slots) && interview.proposed_slots.length)
      .map(interview => ({
        item,
        interview,
      }))
  )

  if (!pending.length && !error) return null

  return (
    <section className="mb-6 rounded-[22px] border border-[#d8c9ad] bg-[#fffaf0] p-5 shadow-[0_10px_30px_rgba(22,40,55,0.04)]">
      <div className="mb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a48752]">Interview action required</p>
        <h2 className="mt-1 text-[21px] font-semibold tracking-[-.025em] text-ink">Choose and accept your interview time</h2>
        <p className="mt-1 text-[12px] leading-5 text-muted">Each interview round must be accepted separately. Select one of the times below to confirm it with the property.</p>
      </div>

      {error && <div className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}

      <div className="space-y-4">
        {pending.map(({ item, interview }) => (
          <div key={interview.id} className="rounded-2xl border border-[#e1d4b9] bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-[14px] font-semibold text-ink">{item.job?.job_title || 'Role'}</p>
                <p className="mt-0.5 text-[11px] text-muted">{item.employer?.property_name || item.employer?.company_name || 'Property'}</p>
              </div>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[9px] font-semibold uppercase text-amber-700">Interview {interview.round_number} proposed</span>
            </div>

            <div className="mt-3 flex items-center gap-2 text-[11px] text-secondary">
              <CalendarDays size={13} className="text-[#9c7a42]" />
              <span>{methodLabel(interview.interview_method)}</span>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {(interview.proposed_slots || []).map(slot => {
                const key = `${interview.id}:${slot}`
                return (
                  <button
                    key={slot}
                    type="button"
                    disabled={busy === key}
                    onClick={() => accept(interview.id, slot)}
                    className="rounded-xl border border-[#cdb98f] bg-[#fffdf8] px-4 py-3 text-left transition hover:border-[#a9874e] disabled:opacity-60"
                  >
                    <span className="flex items-center gap-2 text-[12px] font-semibold text-[#17344d]"><Clock size={13} />{when(slot)}</span>
                    <span className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700"><CheckCircle size={13} />{busy === key ? 'Confirming…' : 'Accept this interview time'}</span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
