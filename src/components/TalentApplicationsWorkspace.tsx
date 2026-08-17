'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { FileText, Clock, CheckCircle, XCircle, Star, Eye, MessageSquare, Briefcase, ArrowRight, X, Send, PencilLine } from 'lucide-react'
import Pagination from '@/components/Pagination'
import Link from 'next/link'
import ReviewForm from '@/components/ReviewForm'

const FLOW = ['pending','reviewed','shortlisted','interview','offered','accepted','rejected']
const config: Record<string,{icon:React.ReactNode;color:string;bg:string;label:string}> = {
  draft:{icon:<PencilLine size={14}/>,color:'text-[#9c7a42]',bg:'bg-[#f8f1e4]',label:'Ready to Send'},
  pending:{icon:<Clock size={14}/>,color:'text-amber-600',bg:'bg-amber-50',label:'Submitted'},
  reviewed:{icon:<Eye size={14}/>,color:'text-blue-600',bg:'bg-blue-50',label:'Under Review'},
  shortlisted:{icon:<Star size={14}/>,color:'text-emerald-600',bg:'bg-emerald-50',label:'Shortlisted'},
  interview:{icon:<MessageSquare size={14}/>,color:'text-violet-600',bg:'bg-violet-50',label:'Interview'},
  offered:{icon:<Briefcase size={14}/>,color:'text-accent',bg:'bg-[#FDF6EC]',label:'Offered'},
  accepted:{icon:<CheckCircle size={14}/>,color:'text-emerald-600',bg:'bg-emerald-50',label:'Accepted'},
  rejected:{icon:<XCircle size={14}/>,color:'text-red-500',bg:'bg-red-50',label:'Rejected'},
}

export default function TalentApplicationsWorkspace(){
  const supabase=createClient()
  const [apps,setApps]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [filter,setFilter]=useState('all')
  const [page,setPage]=useState(1)
  const [perPage,setPerPage]=useState(25)
  const [draft,setDraft]=useState<any|null>(null)
  const [letter,setLetter]=useState('')
  const [sending,setSending]=useState(false)
  const [sendError,setSendError]=useState('')
  const [reviewing,setReviewing]=useState<{userId:string;name:string}|null>(null)

  useEffect(()=>{(async()=>{
    const {data:{user}}=await supabase.auth.getUser(); if(!user)return
    const {data:profile}=await supabase.from('candidate_profiles').select('id').eq('user_id',user.id).single(); if(!profile){setLoading(false);return}
    const {data,error}=await supabase.from('applications').select('*, job_listings(job_title,location,salary_min,salary_max,employer_id,is_live,expires_at)').eq('candidate_id',profile.id).order('created_at',{ascending:false})
    if(error){setError('We could not load your applications just now. Please refresh the page.');setLoading(false);return}
    let rows=data||[]
    const ids=Array.from(new Set(rows.map((a:any)=>a.job_listings?.employer_id).filter(Boolean)))
    if(ids.length){const {data:emps}=await supabase.from('employer_profiles').select('id,user_id,company_name,property_name').in('id',ids); const map=new Map((emps||[]).map((e:any)=>[e.id,e])); rows=rows.map((a:any)=>a.job_listings?{...a,job_listings:{...a.job_listings,employer_profiles:map.get(a.job_listings.employer_id)||null}}:a)}
    setApps(rows);setLoading(false)
  })()},[])

  const counts:Record<string,number>={all:apps.length}; apps.forEach(a=>counts[a.status]=(counts[a.status]||0)+1)
  const filtered=filter==='all'?apps:apps.filter(a=>a.status===filter)
  const shown=filtered.slice((page-1)*perPage,page*perPage)

  async function remove(app:any){if(!confirm(app.status==='draft'?'Remove this saved role?':`Withdraw your application for ${app.job_listings?.job_title||'this role'}?`))return; const r=await fetch('/api/applications/withdraw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({applicationId:app.id})}); const j=await r.json().catch(()=>({})); if(!r.ok){alert(j.error||'Could not remove this application.');return} setApps(x=>x.filter(v=>v.id!==app.id))}
  function edit(app:any){setDraft(app);setLetter(app.cover_letter||app.cover_note||'');setSendError('')}
  async function send(){if(!draft||sending)return;setSending(true);setSendError('');const r=await fetch('/api/applications/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({applicationId:draft.id,coverLetter:letter})}).catch(()=>null);const j=r?await r.json().catch(()=>({})):{};setSending(false);if(!r?.ok){setSendError(j.error||'Could not send your application.');return}setApps(x=>x.map(v=>v.id===draft.id?{...v,status:'pending',cover_letter:letter,submitted_at:new Date().toISOString(),updated_at:new Date().toISOString()}:v));setDraft(null)}

  return <>
    <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-semibold tracking-tight text-ink">My Applications</h1><p className="mt-1 text-[13px] text-muted">Matched roles stay private until you review them and press Send Application.</p></div><Link href="/roles/match" className="btn-secondary text-[12px] flex items-center gap-1">Find Matches <ArrowRight size={12}/></Link></div>
    <div className="flex flex-wrap gap-2 mb-6">{['all','draft','pending','reviewed','shortlisted','interview','offered','accepted','rejected'].map(s=>{const n=counts[s]||0;if(s!=='all'&&!n)return null;return <button type="button" key={s} onClick={()=>{setFilter(s);setPage(1)}} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium ${filter===s?'bg-ink text-white':'bg-surface text-muted hover:text-ink'}`}>{s==='all'?'All':config[s]?.label||s}{n>0&&<span className="ml-1 opacity-60">({n})</span>}</button>})}</div>
    {loading?<div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-ink border-t-transparent rounded-full"/></div>:error?<div className="dashboard-card text-center py-12 text-[13px] text-red-600">{error}</div>:!apps.length?<div className="dashboard-card text-center py-16"><FileText size={40} className="mx-auto mb-3 text-muted/40"/><p className="text-[15px] font-medium text-ink mb-1">Nothing saved yet</p><p className="text-[13px] text-muted mb-6">Use Match to find roles that fit your experience.</p><Link href="/roles/match" className="btn-primary inline-flex items-center gap-1.5">Find Matches <ArrowRight size={13}/></Link></div>:!filtered.length?<div className="dashboard-card text-center py-12 text-[13px] text-muted">No applications with this status.</div>:<div className="space-y-3">{shown.map(app=>{const c=config[app.status]||config.pending;const property=app.job_listings?.employer_profiles?.property_name||app.job_listings?.employer_profiles?.company_name||'';const terminal=['accepted','rejected'].includes(app.status);const isDraft=app.status==='draft';const closed=app.job_listings&&(!app.job_listings.is_live||(app.job_listings.expires_at&&new Date(app.job_listings.expires_at).getTime()<=Date.now()));const current=FLOW.indexOf(app.status);return <div key={app.id} className={`bg-white border rounded-xl p-5 ${isDraft?'border-[#d7c293]':'border-border'}`}><div className="flex items-start justify-between gap-4 mb-3"><div><h3 className="text-[16px] font-medium text-ink">{app.job_listings?.job_title||'Role no longer available'}</h3><p className="text-[13px] text-muted">{property}{app.job_listings?.location?` · ${app.job_listings.location}`:''}</p></div><span className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${c.bg} ${c.color}`}>{c.icon}{c.label}</span></div>{isDraft?<div className="rounded-xl bg-[#faf8f3] border border-[#e8e0d0] p-4 mb-4"><p className="text-[12px] font-semibold text-ink mb-1">Not sent to the property yet</p><p className="text-[12px] leading-5 text-muted">Add or edit your covering letter, review the application and send only when you are ready.</p></div>:!terminal?<div className="flex items-center gap-1 mb-3">{FLOW.slice(0,-2).map((s,i)=><div key={s} className="flex items-center flex-1"><div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold ${i<=current?'bg-ink text-white':'bg-surface text-muted'}`}>{i+1}</div>{i<FLOW.length-3&&<div className={`flex-1 h-[2px] mx-0.5 ${i<current?'bg-ink':'bg-border'}`}/>}</div>)}</div>:null}<div className="flex flex-wrap items-center gap-3 text-[11px] text-muted"><span>{isDraft?'Saved':'Applied'} {new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>{app.match_score&&<span>· {app.match_score}% match</span>}{isDraft&&!closed&&<button type="button" onClick={()=>edit(app)} className="ml-auto btn-primary !py-2 !px-3 inline-flex items-center gap-1.5"><PencilLine size={12}/>Review & Send</button>}{isDraft&&closed&&<span className="ml-auto text-red-500 font-medium">Role closed</span>}{app.status==='accepted'&&app.job_listings?.employer_profiles?.user_id&&<button type="button" onClick={()=>setReviewing({userId:app.job_listings.employer_profiles.user_id,name:property||'this employer'})} className="inline-flex items-center gap-1 font-medium text-amber-500"><Star size={11}/>Review employer</button>}{!terminal&&<button type="button" onClick={()=>remove(app)} className={`${isDraft?'':'ml-auto'} inline-flex items-center gap-1 font-semibold text-red-500`}><X size={12}/>{isDraft?'Remove':'Withdraw application'}</button>}</div></div>})}<Pagination page={page} perPage={perPage} total={filtered.length} onPageChange={setPage} onPerPageChange={setPerPage}/></div>}
    {draft&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={()=>!sending&&setDraft(null)}><div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-xl" onClick={e=>e.stopPropagation()}><div className="flex justify-between gap-4 mb-5"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[#9c7a42] font-semibold">Ready to Send</p><h2 className="text-[22px] font-semibold text-ink mt-1">{draft.job_listings?.job_title}</h2><p className="text-[12px] text-muted">{draft.job_listings?.employer_profiles?.property_name||draft.job_listings?.employer_profiles?.company_name}</p></div><button type="button" onClick={()=>setDraft(null)} disabled={sending}><X size={20}/></button></div><label className="block text-[12px] font-semibold text-ink mb-2">Covering letter <span className="font-normal text-muted">(optional)</span></label><textarea value={letter} onChange={e=>setLetter(e.target.value)} rows={10} maxLength={5000} className="input-field resize-y text-[13px] leading-6" placeholder="Tell the property why this role interests you and what you would bring to the team."/><div className="mt-2 flex justify-between text-[11px] text-muted"><span>Everyone can add a covering letter before sending.</span><span>{letter.length}/5000</span></div>{sendError&&<div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{sendError}</div>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setDraft(null)} disabled={sending} className="btn-secondary">Keep as Draft</button><button type="button" onClick={send} disabled={sending} className="btn-primary inline-flex items-center gap-2"><Send size={14}/>{sending?'Sending…':'Send Application'}</button></div></div></div>}
    {reviewing&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setReviewing(null)}><div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-ink">Review {reviewing.name}</h2><button type="button" onClick={()=>setReviewing(null)}><X size={20}/></button></div><ReviewForm reviewedId={reviewing.userId} reviewedName={reviewing.name} type="employer"/></div></div>}
  </>
}
