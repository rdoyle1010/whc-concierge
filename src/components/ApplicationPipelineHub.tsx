'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, CheckCircle, Clock, Briefcase, Link as LinkIcon, MapPin, ClipboardList, UserRound, Sparkles } from 'lucide-react'
import { useDialog } from '@/components/useDialog'

type Role = 'talent' | 'employer'
type InterviewDraft = { applicationId:string; roundNumber:number; method:'teams'|'video'|'phone'|'in_person'; slots:string[]; note:string }
type OfferDraft = { applicationId:string; note:string; loading:boolean }
type BriefingDraft = {
  interviewId:string
  meetingLink:string
  venueAddress:string
  contactName:string
  preparationRequired:string
  assessmentType:string
  assessmentDetails:string
  employerNote:string
}

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
  const [offerDraft, setOfferDraft] = useState<OfferDraft | null>(null)
  const [interviewDraft, setInterviewDraft] = useState<InterviewDraft | null>(null)
  const [briefingDraft, setBriefingDraft] = useState<BriefingDraft | null>(null)
  const interviewDialog = useDialog(() => { if (!busy) setInterviewDraft(null) }, 'pipeline-interview-dialog-heading', { enabled: Boolean(interviewDraft) })
  const briefingDialog = useDialog(() => setBriefingDraft(null), 'pipeline-briefing-dialog-heading', { enabled: Boolean(briefingDraft) })
  const offerDialog = useDialog(() => { if (!busy) setOfferDraft(null) }, 'pipeline-offer-dialog-heading', { enabled: Boolean(offerDraft) })

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

  async function openOffer(applicationId: string) {
    setOfferDraft({ applicationId, note: '', loading: true })
    const res = await fetch('/api/employer/applications/communication-ai', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ applicationId, type:'offer' }) }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    if (!res?.ok) {
      setOfferDraft(current => current ? { ...current, loading:false } : null)
      setError(body.error || 'Could not draft the offer message. You can write it manually.')
      return
    }
    setOfferDraft(current => current ? { ...current, note:body.note || '', loading:false } : null)
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
    if (!offerDraft || offerDraft.note.trim().length < 20) return
    setBusy(`offer-${offerDraft.applicationId}`); setError('')
    const res = await fetch('/api/employer/applications/offer', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ applicationId: offerDraft.applicationId, note: offerDraft.note.trim() }) }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) { setError(body.error || 'Could not send the offer.'); return }
    setOfferDraft(null)
    await load()
  }

  function openBriefing(interview:any) {
    setBriefingDraft({
      interviewId:interview.id,
      meetingLink:interview.meeting_link || '',
      venueAddress:interview.venue_address || '',
      contactName:interview.contact_name || '',
      preparationRequired:interview.preparation_required || '',
      assessmentType:interview.assessment_type || '',
      assessmentDetails:interview.assessment_details || '',
      employerNote:interview.employer_note || '',
    })
  }

  async function markInterviewComplete(interviewId: string) {
    setBusy(interviewId)
    const res = await fetch('/api/employer/applications/interview', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ interviewId }) }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) { setError(body.error || 'Could not mark the interview complete.'); return }
    await load()
  }

  async function saveBriefing() {
    if (!briefingDraft) return
    setBusy(`briefing-${briefingDraft.interviewId}`); setError('')
    const res = await fetch('/api/employer/applications/interview/briefing', { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(briefingDraft) }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    setBusy('')
    if (!res?.ok) { setError(body.error || 'Could not save the interview details.'); return }
    setBriefingDraft(null)
    await load()
  }

  if (loading || (!items.length && !error)) return null

  return <div className="mb-7 rounded-[22px] border border-[#e0dad2] bg-white p-5 shadow-[0_12px_35px_rgba(28,27,26,0.05)]">
    <div className="mb-5 flex items-start justify-between gap-4">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[#1c1b1a]">Live recruitment progress</p><h2 className="mt-1 text-[22px] font-semibold tracking-[-.025em] text-ink">Interviews & offers</h2><p className="mt-1 text-[12px] leading-5 text-muted">{role === 'talent' ? 'Choose interview times, review preparation details and respond to offers here.' : 'Track each interview round, add practical briefing details, then progress to another interview or make an offer.'}</p></div>
      <button type="button" onClick={load} className="text-[11px] font-semibold text-[#1c1b1a]">Refresh</button>
    </div>
    {error && <div role="alert" className="mb-4 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}
    <div className="space-y-4">{items.map(item => {
      const latestInterview = [...(item.interviews || [])].sort((a,b) => b.round_number - a.round_number)[0]
      const title = item.job?.job_title || 'Role'
      const person = role === 'employer' ? (item.candidate?.full_name || 'Candidate') : (item.employer?.property_name || item.employer?.company_name || 'Property')
      return <div key={item.id} className="rounded-2xl border border-[#e0dad2] bg-[#f3f0eb] p-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0 flex-1">
            <p className="text-[15px] font-semibold text-ink">{title}</p><p className="mt-0.5 text-[12px] text-muted">{person}</p>
            {(item.interviews || []).length > 0 && <div className="mt-4 space-y-2">{(item.interviews || []).map(interview => <div key={interview.id} className="rounded-xl border border-[#e0dad2] bg-white p-3">
              <div className="flex flex-wrap items-center gap-2"><CalendarDays size={14} className="text-[#1c1b1a]"/><span className="text-[12px] font-semibold text-ink">Interview {interview.round_number}</span><span className="text-[10px] uppercase tracking-wide text-muted">{methodLabel(interview.interview_method)}</span><span className={`ml-auto rounded-full px-2 py-1 text-[9px] font-semibold uppercase ${interview.status === 'confirmed' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{interview.status}</span></div>
              {interview.status === 'confirmed' && interview.selected_slot ? <p className="mt-2 flex items-center gap-1.5 text-[12px] text-secondary"><CheckCircle size={13} className="text-emerald-600"/>{when(interview.selected_slot)}</p> : role === 'talent' ? <div className="mt-3 grid gap-2 sm:grid-cols-2">{(interview.proposed_slots || []).map((slot:string) => <button key={slot} type="button" disabled={busy===interview.id} onClick={()=>confirmInterview(interview.id,slot)} className="rounded-xl border border-[#e0dad2] bg-[#f3f0eb] px-3 py-2 text-left text-[11px] font-medium text-[#1c1b1a] hover:border-[#57534e]"><Clock size={12} className="mr-1 inline"/>{when(slot)}</button>)}</div> : <div className="mt-2 flex flex-wrap gap-2">{(interview.proposed_slots || []).map((slot:string) => <span key={slot} className="rounded-full bg-[#f3f0eb] px-2.5 py-1 text-[10px] text-secondary">{when(slot)}</span>)}</div>}
              <div className="mt-3 grid gap-2 text-[11px] text-secondary sm:grid-cols-2">
                {interview.meeting_link && <p className="flex items-start gap-2"><LinkIcon size={13} className="mt-0.5 shrink-0 text-[#1c1b1a]"/><a className="break-all underline" href={interview.meeting_link} target="_blank" rel="noreferrer">Join interview</a></p>}
                {interview.venue_address && <p className="flex items-start gap-2"><MapPin size={13} className="mt-0.5 shrink-0 text-[#1c1b1a]"/>{interview.venue_address}</p>}
                {interview.contact_name && <p className="flex items-start gap-2"><UserRound size={13} className="mt-0.5 shrink-0 text-[#1c1b1a]"/>Ask for {interview.contact_name}</p>}
                {interview.preparation_required && <p className="flex items-start gap-2 sm:col-span-2"><ClipboardList size={13} className="mt-0.5 shrink-0 text-[#1c1b1a]"/><span><strong>Prepare:</strong> {interview.preparation_required}</span></p>}
                {interview.assessment_type && <p className="sm:col-span-2"><strong>{interview.assessment_type}:</strong> {interview.assessment_details || 'Further details to follow.'}</p>}
                {interview.employer_note && <p className="sm:col-span-2">{interview.employer_note}</p>}
              </div>
              {role === 'employer' && <button type="button" onClick={()=>openBriefing(interview)} className="mt-3 text-[11px] font-semibold text-[#1c1b1a] underline">{interview.meeting_link || interview.venue_address || interview.preparation_required ? 'Edit interview details' : 'Add interview details'}</button>}{role === 'employer' && interview.status === 'confirmed' && interview.selected_slot && new Date(interview.selected_slot).getTime() <= Date.now() && <button type="button" disabled={busy===interview.id} onClick={()=>markInterviewComplete(interview.id)} className="mt-3 ml-3 text-[11px] font-semibold text-emerald-700 underline disabled:opacity-40">Mark interview complete</button>}
            </div>)}</div>}
            {item.offer && <div className="mt-3 rounded-xl border border-[#e0dad2] bg-[#f3f0eb] p-3"><div className="flex items-center gap-2"><Briefcase size={14} className="text-[#1c1b1a]"/><span className="text-[12px] font-semibold text-ink">Job offer</span><span className="ml-auto text-[10px] font-semibold uppercase text-[#1c1b1a]">{item.offer.status}</span></div>{item.offer.employer_note && <p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-secondary">{item.offer.employer_note}</p>}{item.offer.status === 'offered' && <p className="mt-2 text-[10px] text-muted">Formal offer letter / contract with salary, start date and employment terms will be issued separately by the employer.</p>}</div>}
          </div>
          <div className="w-full shrink-0 lg:w-[240px]">
            {role === 'employer' && item.status === 'interview' && latestInterview?.status === 'confirmed' && latestInterview?.selected_slot && new Date(latestInterview.selected_slot).getTime() <= Date.now() && !item.offer && <div className="grid gap-2">
              {latestInterview.round_number < 3 && <button type="button" onClick={()=>setInterviewDraft({applicationId:item.id,roundNumber:latestInterview.round_number+1,method:'teams',slots:['','','',''],note:''})} className="btn-secondary w-full">Arrange Interview {latestInterview.round_number+1}</button>}
              <button type="button" onClick={()=>openOffer(item.id)} className="btn-primary w-full">Make offer</button>
            </div>}
            {role === 'talent' && item.offer?.status === 'offered' && <div className="grid gap-2"><button type="button" disabled={busy===`offer-${item.id}`} onClick={()=>respondOffer(item.id,'accept')} className="btn-primary">Accept offer</button><button type="button" disabled={busy===`offer-${item.id}`} onClick={()=>respondOffer(item.id,'decline')} className="btn-secondary text-red-600">Decline offer</button></div>}
            {item.status === 'accepted' && <div className="rounded-xl bg-emerald-50 p-3 text-center text-[12px] font-semibold text-emerald-700">Hired / Offer accepted</div>}
          </div>
        </div>
      </div>
    })}</div>

    {interviewDraft && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={()=>!busy&&setInterviewDraft(null)}><div {...interviewDialog.panelProps} className="w-full max-w-xl rounded-3xl bg-white p-6 shadow-2xl"><h3 id="pipeline-interview-dialog-heading" className="text-2xl font-semibold text-ink">Arrange Interview {interviewDraft.roundNumber}</h3><p className="mt-1 text-[12px] text-muted">Choose the format and offer up to four times. Practical briefing details can be added immediately after sending.</p><div className="mt-5"><label className="mb-1 block text-[11px] font-semibold text-ink">Interview format</label><select aria-label="Interview format" className="input-field" value={interviewDraft.method} onChange={e=>setInterviewDraft({...interviewDraft,method:e.target.value as InterviewDraft['method']})}><option value="teams">Microsoft Teams</option><option value="video">Video call</option><option value="phone">Phone call</option><option value="in_person">In person</option></select></div><div className="mt-4 grid gap-2 sm:grid-cols-2">{interviewDraft.slots.map((slot,index)=><div key={index}><label className="mb-1 block text-[10px] text-muted">Option {index+1}</label><input type="datetime-local" className="input-field" value={slot} onChange={e=>{const slots=[...interviewDraft.slots];slots[index]=e.target.value;setInterviewDraft({...interviewDraft,slots})}}/></div>)}</div><div className="mt-4"><label className="mb-1 block text-[11px] font-semibold text-ink">Initial note</label><textarea aria-label="Initial note" rows={4} className="input-field resize-y" value={interviewDraft.note} onChange={e=>setInterviewDraft({...interviewDraft,note:e.target.value})}/></div><div className="mt-5 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={()=>setInterviewDraft(null)}>Cancel</button><button type="button" className="btn-primary" disabled={busy===`interview-${interviewDraft.applicationId}`} onClick={sendInterview}>Send interview options</button></div></div></div>}

    {briefingDraft && <div className="fixed inset-0 z-[75] flex items-center justify-center bg-black/50 p-4"><div {...briefingDialog.panelProps} className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl"><h3 id="pipeline-briefing-dialog-heading" className="text-2xl font-semibold text-ink">Interview briefing</h3><p className="mt-1 text-[12px] text-muted">Add everything the candidate needs to arrive prepared and confident.</p><div className="mt-5 grid gap-4 sm:grid-cols-2"><div><label className="mb-1 block text-[11px] font-semibold">Teams / video link</label><input aria-label="Teams / video link" className="input-field" value={briefingDraft.meetingLink} onChange={e=>setBriefingDraft({...briefingDraft,meetingLink:e.target.value})}/></div><div><label className="mb-1 block text-[11px] font-semibold">Who to ask for</label><input aria-label="Who to ask for" className="input-field" value={briefingDraft.contactName} onChange={e=>setBriefingDraft({...briefingDraft,contactName:e.target.value})}/></div><div className="sm:col-span-2"><label className="mb-1 block text-[11px] font-semibold">On-site address / directions</label><textarea aria-label="On-site address / directions" className="input-field resize-y" rows={2} value={briefingDraft.venueAddress} onChange={e=>setBriefingDraft({...briefingDraft,venueAddress:e.target.value})}/></div><div className="sm:col-span-2"><label className="mb-1 block text-[11px] font-semibold">What should they prepare?</label><textarea aria-label="What should they prepare?" className="input-field resize-y" rows={3} value={briefingDraft.preparationRequired} onChange={e=>setBriefingDraft({...briefingDraft,preparationRequired:e.target.value})} placeholder="For example: bring uniform, prepare a 15-minute commercial presentation, bring qualification certificates..."/></div><div><label className="mb-1 block text-[11px] font-semibold">Assessment</label><select aria-label="Assessment" className="input-field" value={briefingDraft.assessmentType} onChange={e=>setBriefingDraft({...briefingDraft,assessmentType:e.target.value})}><option value="">None / not required</option><option value="Trade test">Trade test</option><option value="Treatment practical">Treatment practical</option><option value="Presentation">Presentation</option><option value="Case study">Case study</option><option value="Other assessment">Other assessment</option></select></div><div><label className="mb-1 block text-[11px] font-semibold">Assessment details</label><input aria-label="Assessment details" className="input-field" value={briefingDraft.assessmentDetails} onChange={e=>setBriefingDraft({...briefingDraft,assessmentDetails:e.target.value})}/></div><div className="sm:col-span-2"><label className="mb-1 block text-[11px] font-semibold">Additional note</label><textarea aria-label="Additional note" className="input-field resize-y" rows={4} value={briefingDraft.employerNote} onChange={e=>setBriefingDraft({...briefingDraft,employerNote:e.target.value})}/></div></div><div className="mt-5 flex justify-end gap-2"><button className="btn-secondary" type="button" onClick={()=>setBriefingDraft(null)}>Cancel</button><button className="btn-primary" type="button" disabled={busy===`briefing-${briefingDraft.interviewId}`} onClick={saveBriefing}>Save interview details</button></div></div></div>}

    {offerDraft && <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={()=>!busy&&setOfferDraft(null)}><div {...offerDialog.panelProps} className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#1c1b1a] text-white"><Sparkles size={17}/></div><div><h3 id="pipeline-offer-dialog-heading" className="text-2xl font-semibold text-ink">Make job offer</h3><p className="mt-1 text-[12px] leading-5 text-muted">Spa Platform drafts the congratulations message. Review and edit it before sending. The formal offer letter or contract with salary, start date and employment terms will follow separately.</p></div></div>{offerDraft.loading?<div className="mt-6 flex h-40 items-center justify-center text-[13px] text-muted">Drafting offer message…</div>:<div className="mt-5"><label className="mb-1 block text-[11px] font-semibold text-ink">Offer message</label><textarea aria-label="Offer message" className="input-field resize-y" rows={9} value={offerDraft.note} onChange={e=>setOfferDraft({...offerDraft,note:e.target.value})} placeholder="Congratulations, we would be delighted to offer you the role…"/></div>}<div className="mt-5 flex justify-end gap-2"><button type="button" className="btn-secondary" onClick={()=>setOfferDraft(null)}>Cancel</button><button type="button" className="btn-primary" disabled={offerDraft.loading||busy===`offer-${offerDraft.applicationId}`||offerDraft.note.trim().length<20} onClick={sendOffer}>Send offer</button></div></div></div>}
  </div>
}
