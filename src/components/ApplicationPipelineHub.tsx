'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle, Clock, Briefcase } from 'lucide-react'

type Role = 'talent' | 'employer'
type InterviewDraft = { applicationId:string; roundNumber:number; method:'teams'|'video'|'phone'|'in_person'; slots:string[]; note:string }

type PipelineItem = {
  id: string
  status: string
  candidate?: { full_name?: string; headline?: string } | null
  job?: { job_title?: string } | null
  employer?: { property_name?: string; company_name?: string } | null
  interviews?: any[]
  offer?: any | null
}

function methodLabel(method: string) {
  return method === 'teams' ? 'Microsoft Teams' : method === 'video' ? 'Video call' : method === 'phone' ? 'Phone call' : 'In person'
}

function when(value: string) {
  return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function ApplicationPipelineHub({ role }: { role: Role }) {
  const [items, setItems] = useState<PipelineItem[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [offerDraft, setOfferDraft] = useState<{ applicationId:string; salary:string; period:string; startDate:string; note:string } | null>(null)
  const [interviewDraft, setInterviewDraft] = useState<InterviewDraft | null>(null)

  async function load() {
    setLoading(true)
    const url = role === 'employer' ? '/api/employer/applications/pipeline' : '/api/talent/applications/pipeline-list'
    const res = await fetch(url, { cache: 'no-store' }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    if (!res?.ok) setError(body.error || 'Could not load recruitment progress.')
    else { setItems(body.items || []); setError('') }
    setLoading(false)
  }

  useEffect(() => { load() }, [role])

  async function confirmInterview(interviewId: string, selectedSlot: string) {
    setBusy(interviewId); setError('')
    const res = await fetch('/api/talent/applications/interview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interviewId, selectedSlot }) }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) { setError(body.error || 'Could not confirm the interview time.'); return }
    await load()
  }

  async function sendInterview() {
    if (!interviewDraft) return
    const slots = interviewDraft.slots.filter(Boolean)
    if (!slots.length) { setError('Add at least one interview date and time.'); return }
    setBusy(`interview-${interviewDraft.applicationId}`); setError('')
    const res = await fetch('/api/employer/applications/interview', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: interviewDraft.applicationId, roundNumber: interviewDraft.roundNumber, interviewMethod: interviewDraft.method, slots, note: interviewDraft.note }) }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) { setError(body.error || 'Could not send the interview invitation.'); return }
    setInterviewDraft(null)
    await load()
  }

  async function respondOffer(applicationId: string, action: 'accept' | 'decline') {
    if (action === 'decline' && !confirm('Decline this job offer?')) return
    setBusy(`offer-${applicationId}`); setError('')
    const res = await fetch('/api/talent/applications/offer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId, action }) }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) { setError(body.error || 'Could not respond to the offer.'); return }
    await load()
  }

  async function sendOffer() {
    if (!offerDraft) return
    setBusy(`offer-${offerDraft.applicationId}`); setError('')
    const res = await fetch('/api/employer/applications/offer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: offerDraft.applicationId, salaryAmount: offerDraft.salary, salaryPeriod: offerDraft.period, startDate: offerDraft.startDate, note: offerDraft.note }) }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) { setError(body.error || 'Could not send the offer.'); return }
    setOfferDraft(null)
    await load()
  }

  if (loading || (!items.length && !error)) return null

  return <div className="mb-7 rounded-[22px] border border-[#ded8cc] bg-white p-5 shadow-[0_12px_35px_rgba(22,40,55,0.05)]">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#a48752]">Live recruitment progress</p><h2 className="mt-1 text-[22px] font-semibold tracking-[-.025em] text-ink">Interviews & offers</h2><p className="mt-1 text-[12px] leading-5 text-muted">{role === 'talent' ? 'Choose interview times and respond to offers here.' : 'Track each interview round, then progress to another interview or make an offer.'}</p></div>
      <button type="button" onClick={load} className="text-[11px] font-semibold text-[#0b2f4d]">Refresh</button>
    </div>
    {error && <div className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}
    <div className="space-y-4">{items.map(item => {
      const latestInterview = [...(item.interviews || [])].sort((a,b) => b.round_number - a.round_number)[0]
      const title = item.job?.job_title || 'Role'
      const person = role === 'employer' ? (item.candidate?.full_name || 'Candidate') : (item.employer?.property_name || item.employer?.company_name || 'Property')
      return <div key={item.id} className="rounded-2xl border border-[#e7e1d7] bg-[#fcfbf8] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink">{title}</p><p className="mt-0.5 text-[12px] text-muted">{person}</p>
            {(item.interviews || []).length > 0 && <div className="mt-4 space-y-2">{(item.interviews || []).map(interview => <div key={interview.id} className="rounded-xl border border-[#e4ddd1] bg-white p-3">
              <div className="flex flex-wrap items-center gap-2"><CalendarDays size={14} className="text-[#9c7a42]"/><span className="text-[12px] font-semibold text-ink">Interview {interview.round_number}</span><span className="text-[10px] uppercase tracking-wide text-muted">{methodLabel(interview.interview_method)}</span><span className={`ml-auto rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${interview.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{interview.status}</span></div>
              {interview.status === 'confirmed' && interview.selected_slot ? <p className="mt-2 flex items-center gap-1.5 text-[12px] text-secondary"><CheckCircle size={13} className="text-emerald-600"/>{when(interview.selected_slot)}</p> : role === 'talent' ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{(interview.proposed_slots || []).map((slot:string) => <button key={slot} type="button" disabled={busy===interview.id} onClick={()=>confirmInterview(interview.id,slot)} className="rounded-xl border border-[#dcd4c8] bg-[#faf8f4] px-3 py-2 text-left text-[11px] font-medium text-[#17344d] hover:border-[#b99a63]"><Clock size={12} className="mr-1 inline"/>{when(slot)}</button>)}</div> : <div className="mt-2 flex flex-wrap gap-2">{(interview.proposed_slots || []).map((slot:string) => <span key={slot} className="rounded-full bg-[#f5f1e9] px-2.5 py-1 text-[10px] text-secondary">{when(slot)}</span>)}</div>}
            </div>)}</div>}
            {item.offer && <div className="mt-3 rounded-xl border border-[#e1d4b9] bg-[#fffaf0] p-3"><div className="flex items-center gap-2"><Briefcase size={14} className="text-[#9c7a42]"/><span className="text-[12px] font-semibold text-ink">Job offer</span><span className="ml-auto text-[10px] font-semibold uppercase text-[#9c7a42]">{item.offer.status}</span></div>{item.offer.salary_amount && <p className="mt-2 text-[12px] text-secondary">£{Number(item.offer.salary_amount).toLocaleString('en-GB')} {item.offer.salary_period}</p>}{item.offer.start_date && <p className="mt-1 text-[11px] text-muted">Start date: {new Date(item.offer.start_date+'T12:00:00').toLocaleDateString('en-GB',{dateStyle:'medium'})}</p>}{item.offer.employer_note && <p className="mt-2 text-[11px] leading-5 text-secondary">{item.offer.employer_note}</p>}</div>}
          </div>
          <div className="w-full shrink-0 lg:w-[240px]">
            {role === 'employer' && item.status === 'interview' && latestInterview?.status === 'confirmed' && !item.offer && <div className="grid gap-2">
              {latestInterview.round_number < 3 && <button type="button" onClick={()=>setInterviewDraft({applicationId:item.id,roundNumber:latestInterview.round_number+1,method:'teams',slots:['','','',''],note:''})} className="btn-secondary w-full">Arrange Interview {latestInterview.round_number+1}</button>}
              <button type="button" onClick={()=>setOfferDraft({applicationId:item.id,salary:'',period:'annual',startDate:'',note:''})} className="btn-primary w-full">Make offer</button>
            </div>}
            {role === 'talent' && item.offer?.status === 'offered' && <div className="grid gap-2"><button type="button" disabled={busy===`offer-${item.id}`} onClick={()=>respondOffer(item.id,'accept')} className="btn-primary">Accept offer</button><button type="button" disabled={busy===`offer-${item.id}`} onClick={()=>respondOffer(item.id,'decline')} className="btn-secondary text-red-600">Decline offer</button></div>}
            {item.status === 'accepted' && <div className="rounded-xl bg-emerald-50 p-3 text-center text-[12px] font-semibold text-emerald-700">Hired / Offer accepted</div>}
          </div>
        </div>
      </div>
    })}</div>

    {interviewDraft && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={()=>!busy&&setInterviewDraft(null)}><div className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl" onClick={e=>e.stopPropagation()}><h3 className="text-2xl font-semibold text-ink">Arrange Interview {interviewDraft.roundNumber}</h3><p className="mt-1 text-[12px] text-muted">Choose the format and offer up to four times.</p><div className="mt-5"><label className="mb-1 block text-[11px] font-semibold text-ink">Interview format</label><select className="input-field" value={interviewDraft.method} onChange={e=>setInterviewDraft({...interviewDraft,method:e.target.value as InterviewDraft['method']})}><option value="teams">Microsoft Teams</option><option value="video">Video call</option><option value="phone">Phone call</option><option value="in_person">In person</option></select></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{interviewDraft.slots.map((slot,index)=><div key={index}><label className="mb-1 block text-[10px] text-muted">Option {index+1}</label><input type="datetime-local" className="input-field" value={slot} onChange={e=>{const slots=[...interviewDraft.slots];slots[index]=e.target.value;setInterviewDraft({...interviewDraft,slots})}}/></div>)}</div><div className="mt-4"><label className="mb-1 block text-[11px] font-semibold text-ink">Note</label><textarea rows={4} className="input-field resize-y" value={interviewDraft.note} onChange={e=>setInterviewDraft({...interviewDraft,note:e.target.value})}/></div><div className="mt-5 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={()=>setInterviewDraft(null)}>Cancel</button><button type="button" className="btn-primary" disabled={busy===`interview-${interviewDraft.applicationId}`} onClick={sendInterview}>Send interview options</button></div></div></div>}

    {offerDraft && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={()=>!busy&&setOfferDraft(null)}><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl" onClick={e=>e.stopPropagation()}><h3 className="text-2xl font-semibold text-ink">Make job offer</h3><p className="mt-1 text-[12px] text-muted">Add the key offer details. The candidate will review and accept or decline in My Applications.</p><div className="mt-5 grid gap-3 sm:grid-cols-2"><div><label className="mb-1 block text-[11px] font-semibold text-ink">Salary / rate</label><input className="input-field" type="number" value={offerDraft.salary} onChange={e=>setOfferDraft({...offerDraft,salary:e.target.value})}/></div><div><label className="mb-1 block text-[11px] font-semibold text-ink">Period</label><select className="input-field" value={offerDraft.period} onChange={e=>setOfferDraft({...offerDraft,period:e.target.value})}><option value="annual">Annual</option><option value="monthly">Monthly</option><option value="daily">Daily</option><option value="hourly">Hourly</option></select></div><div className="sm:col-span-2"><label className="mb-1 block text-[11px] font-semibold text-ink">Proposed start date</label><input className="input-field" type="date" value={offerDraft.startDate} onChange={e=>setOfferDraft({...offerDraft,startDate:e.target.value})}/></div><div className="sm:col-span-2"><label className="mb-1 block text-[11px] font-semibold text-ink">Offer note</label><textarea className="input-field resize-y" rows={5} value={offerDraft.note} onChange={e=>setOfferDraft({...offerDraft,note:e.target.value})} placeholder="Congratulations, we would be delighted to offer you the role…"/></div></div><div className="mt-5 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={()=>setOfferDraft(null)}>Cancel</button><button type="button" className="btn-primary" disabled={busy===`offer-${offerDraft.applicationId}`} onClick={sendOffer}>Send offer</button></div></div></div>}
  </div>
}
