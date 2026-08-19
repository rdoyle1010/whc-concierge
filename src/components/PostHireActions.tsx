'use client'

import { useEffect, useState } from 'react'
import { CheckCircle, Archive, Mail } from 'lucide-react'

type Item = {
  id: string
  status: string
  candidate?: { full_name?: string } | null
  job?: { job_title?: string } | null
  offer?: { status?: string } | null
}

export default function PostHireActions() {
  const [items, setItems] = useState<Item[]>([])
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  async function load() {
    const res = await fetch('/api/employer/applications/pipeline', { cache:'no-store' }).catch(()=>null)
    const body = res ? await res.json().catch(()=>({})) : {}
    if (!res?.ok) { setError(body.error || 'Could not load completed offers.'); return }
    setItems((body.items || []).filter((item:Item) => item.status === 'accepted' && item.offer?.status === 'accepted'))
    setError('')
  }

  useEffect(()=>{ load() },[])

  async function complete(item:Item) {
    const candidate = item.candidate?.full_name || 'this candidate'
    const role = item.job?.job_title || 'this role'
    if (!confirm(`Complete the hire for ${candidate} and close ${role}? Other applicants will be told the role has been filled.`)) return
    setBusy(item.id); setError('')
    const res = await fetch('/api/employer/applications/complete-hire', {
      method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ applicationId:item.id }),
    }).catch(()=>null)
    const body = res ? await res.json().catch(()=>({})) : {}
    setBusy('')
    if (!res?.ok) { setError(body.error || 'Could not complete the hire.'); return }
    await load()
    window.dispatchEvent(new CustomEvent('recruitment-pipeline-refresh'))
  }

  if (!items.length && !error) return null

  return <section className="mb-7 rounded-[22px] border border-emerald-200 bg-emerald-50/50 p-5">
    <div className="flex items-start gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-emerald-700"><CheckCircle size={18}/></div>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-emerald-700">Offer accepted</p>
        <h2 className="mt-1 text-[21px] font-semibold text-ink">Complete successful hire</h2>
        <p className="mt-1 text-[12px] leading-5 text-muted">Close the vacancy, archive the successful placement and send the final candidate communications in one action.</p>
      </div>
    </div>
    {error && <div className="mt-4 rounded-xl bg-red-50 px-3 py-2 text-[12px] text-red-600">{error}</div>}
    <div className="mt-4 space-y-3">{items.map(item => <div key={item.id} className="flex flex-col gap-4 rounded-2xl border border-emerald-100 bg-white p-4 md:flex-row md:items-center md:justify-between">
      <div><p className="text-[14px] font-semibold text-ink">{item.job?.job_title || 'Role'}</p><p className="mt-1 text-[12px] text-muted">{item.candidate?.full_name || 'Candidate'} has accepted the offer.</p><div className="mt-2 flex flex-wrap gap-3 text-[10px] text-muted"><span className="inline-flex items-center gap-1"><Archive size={11}/>Placement archived</span><span className="inline-flex items-center gap-1"><Mail size={11}/>Congratulations + role-filled emails</span></div></div>
      <button type="button" disabled={busy===item.id} onClick={()=>complete(item)} className="btn-primary shrink-0">{busy===item.id ? 'Completing…' : 'Complete hire & close role'}</button>
    </div>)}</div>
  </section>
}
