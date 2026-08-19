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

function roundLabel(round: number) {
  if (round === 1) return 'First interview'
  if (round === 2) return 'Second interview'
  return 'Final interview'
}

function roundAction(round: number) {
  if (round === 1) return 'Accept first interview'
  if (round === 2) return 'Accept second interview'
  return 'Accept final interview'
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
      .map(interview => ({ item, interview }))
  )

  if (!pending.length && !error) return null

  return (
    <section className="mb-7 overflow-hidden rounded-[22px] border border-[#cfb77f] bg-white shadow-[0_16px_40px_rgba(22,40,55,0.07)]">
      <div className="border-b border-[#e8deca] bg-[#fff8e9] px-5 py-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9c7a42]">Action required</p>
        <h2 className="mt-1 text-[24px] font-semibold tracking-[-.025em] text-ink">Your next interview stage</h2>
        <p className="mt-1 max-w-2xl text-[12px] leading-5 text-secondary">The property has invited you to the next stage. Each interview round must be accepted separately. Choose one time below to confirm your attendance.</p>
      </div>

      <div className="p-5">
        {error && <div className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}

        <div className="space-y-4">
          {pending.map(({ item, interview }) => {
            const label = roundLabel(interview.round_number)
            const action = roundAction(interview.round_number)
            return (
              <div key={interview.id} className="rounded-2xl border border-[#ded6c7] bg-[#fcfbf8] p-5">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#a48752]">Stage {interview.round_number} of 3</p>
                    <h3 className="mt-1 text-[21px] font-semibold text-ink">{label}</h3>
                    <p className="mt-1 text-[13px] font-medium text-[#17344d]">{item.job?.job_title || 'Role'}</p>
                    <p className="mt-0.5 text-[11px] text-muted">{item.employer?.property_name || item.employer?.company_name || 'Property'}</p>
                  </div>
                  <span className="w-fit rounded-full bg-amber-50 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-wide text-amber-700">Awaiting your confirmation</span>
                </div>

                <div className="mt-4 flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[12px] text-secondary">
                  <CalendarDays size={14} className="text-[#9c7a42]" />
                  <span><strong className="text-ink">Format:</strong> {methodLabel(interview.interview_method)}</span>
                </div>

                <div className="mt-4">
                  <p className="mb-2 text-[11px] font-semibold text-ink">Choose one time to confirm your {label.toLowerCase()}:</p>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {(interview.proposed_slots || []).map(slot => {
                      const key = `${interview.id}:${slot}`
                      return (
                        <button
                          key={slot}
                          type="button"
                          disabled={busy === key}
                          onClick={() => accept(interview.id, slot)}
                          className="rounded-xl border border-[#cdb98f] bg-white px-4 py-3 text-left transition hover:border-[#9c7a42] hover:shadow-sm disabled:opacity-60"
                        >
                          <span className="flex items-center gap-2 text-[12px] font-semibold text-[#17344d]"><Clock size={13} />{when(slot)}</span>
                          <span className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700"><CheckCircle size={13} />{busy === key ? 'Confirming…' : action}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
