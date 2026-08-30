'use client'

import { useEffect, useState } from 'react'
import { calculateMatchScore } from '@/lib/matching'
import { FileText, Clock, CheckCircle, XCircle, Star, Eye, MessageSquare, Briefcase, ArrowRight, X, Send, PencilLine, ChevronDown, MapPin, Banknote, BriefcaseBusiness, Sparkles } from 'lucide-react'
import Pagination from '@/components/Pagination'
import MatchBreakdown from '@/components/MatchBreakdown'
import Link from 'next/link'
import ReviewForm from '@/components/ReviewForm'

const FLOW = ['pending','reviewed','shortlisted','interview','offered','accepted','rejected']
const ACTIVE_FLOW = ['pending','reviewed','shortlisted','interview','offered']
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

type AiResult = { summary:string; strengths:string[]; gaps:string[]; covering_letter:string }

function salaryText(job:any){
  if(job?.salary_min&&job?.salary_max)return `£${Math.round(job.salary_min/1000)}k–£${Math.round(job.salary_max/1000)}k`
  if(job?.salary_min)return `From £${Math.round(job.salary_min/1000)}k`
  return 'Salary not stated'
}

export default function TalentApplicationsWorkspace(){
  const [apps,setApps]=useState<any[]>([])
  const [profile,setProfile]=useState<any|null>(null)
  const [counts,setCounts]=useState<Record<string,number>>({all:0})
  const [total,setTotal]=useState(0)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [filter,setFilter]=useState(()=>typeof window!=='undefined'&&new URLSearchParams(window.location.search).get('review')==='draft'?'draft':'all')
  const [page,setPage]=useState(1)
  const [perPage,setPerPage]=useState(25)
  const [draft,setDraft]=useState<any|null>(null)
  const [letter,setLetter]=useState('')
  const [sending,setSending]=useState(false)
  const [sendError,setSendError]=useState('')
  const [submitted,setSubmitted]=useState<{jobTitle:string;property:string}|null>(null)
  const [reviewing,setReviewing]=useState<{userId:string;name:string}|null>(null)
  const [expanded,setExpanded]=useState<Record<string,boolean>>({})
  const [aiLoading,setAiLoading]=useState<'analyse'|'draft'|'improve'|null>(null)
  const [aiError,setAiError]=useState('')
  const [aiResult,setAiResult]=useState<AiResult|null>(null)

  async function loadApplications(){
    setLoading(true);setError('')
    const params=new URLSearchParams({page:String(page),per_page:String(perPage)})
    if(filter!=='all')params.set('status',filter)
    const res=await fetch(`/api/applications/mine?${params.toString()}`,{cache:'no-store'}).catch(()=>null)
    const body=res?await res.json().catch(()=>({})):{}
    if(!res?.ok){setError(body.error||'We could not load your applications just now. Please refresh the page.');setLoading(false);return}
    setApps(body.applications||[]);setProfile(body.profile||null);setCounts(body.counts||{all:0});setTotal(body.pagination?.total||0);setLoading(false)
  }

  useEffect(()=>{let active=true;(async()=>{
    setLoading(true);setError('')
    const params=new URLSearchParams({page:String(page),per_page:String(perPage)})
    if(filter!=='all')params.set('status',filter)
    const res=await fetch(`/api/applications/mine?${params.toString()}`,{cache:'no-store'}).catch(()=>null)
    const body=res?await res.json().catch(()=>({})):{}
    if(!active)return
    if(!res?.ok){setError(body.error||'We could not load your applications just now. Please refresh the page.');setLoading(false);return}
    setApps(body.applications||[]);setProfile(body.profile||null);setCounts(body.counts||{all:0});setTotal(body.pagination?.total||0);setLoading(false)
  })();return()=>{active=false}},[page,perPage,filter])

  function withMatch(app:any){
    if(app.match_detail||!profile||!app.job_listings)return app
    const match=calculateMatchScore(profile,app.job_listings)
    const next={...app,match_detail:match}
    setApps(current=>current.map(item=>item.id===app.id?next:item))
    return next
  }

  function toggleDetails(app:any){
    if(!expanded[app.id]) withMatch(app)
    setExpanded(x=>({...x,[app.id]:!x[app.id]}))
  }

  async function remove(app:any){if(!confirm(app.status==='draft'?'Remove this saved role?':`Withdraw your application for ${app.job_listings?.job_title||'this role'}?`))return; const r=await fetch('/api/applications/withdraw',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({applicationId:app.id})}); const j=await r.json().catch(()=>({})); if(!r.ok){alert(j.error||'Could not remove this application.');return} if(apps.length===1&&page>1)setPage(page-1);else await loadApplications()}
  function edit(app:any){const ready=withMatch(app);setDraft(ready);setLetter(app.cover_letter||app.cover_note||'');setSendError('');setAiError('');setAiResult(null)}
  async function send(){if(!draft||sending)return;setSending(true);setSendError('');const sentDraft=draft;const r=await fetch('/api/applications/submit',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({applicationId:draft.id,coverLetter:letter})}).catch(()=>null);const j=r?await r.json().catch(()=>({})):{};setSending(false);if(!r?.ok){setSendError(j.error||'Could not send your application.');return}setDraft(null);setSubmitted({jobTitle:sentDraft.job_listings?.job_title||'your role',property:sentDraft.job_listings?.employer_profiles?.property_name||sentDraft.job_listings?.employer_profiles?.company_name||'the property'});await loadApplications()}

  async function runAi(mode:'analyse'|'draft'|'improve'){
    if(!draft||aiLoading)return
    setAiLoading(mode);setAiError('')
    const res=await fetch('/api/applications/ai',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({applicationId:draft.id,mode,currentLetter:letter})}).catch(()=>null)
    const body=res?await res.json().catch(()=>({})):{}
    setAiLoading(null)
    if(!res?.ok){setAiError(body.error||'The AI assistant could not help just now. Please try again.');return}
    const result:AiResult={summary:body.summary||'',strengths:body.strengths||[],gaps:body.gaps||[],covering_letter:body.covering_letter||''}
    setAiResult(result)
    if((mode==='draft'||mode==='improve')&&result.covering_letter)setLetter(result.covering_letter)
  }

  const JobAndMatch=({app,compact=false}:{app:any;compact?:boolean})=>{
    const job=app.job_listings
    const match=app.match_detail
    if(!job)return null
    return <div className={`${compact?'mt-5':'mt-4'} space-y-4`}>
      <div className="grid gap-2 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface/60 p-3"><p className="text-[10px] uppercase tracking-[.12em] text-muted mb-1">Location</p><p className="flex items-center gap-1.5 text-[12px] font-medium text-ink"><MapPin size={12}/>{job.location||'Not stated'}</p></div>
        <div className="rounded-xl border border-border bg-surface/60 p-3"><p className="text-[10px] uppercase tracking-[.12em] text-muted mb-1">Contract</p><p className="flex items-center gap-1.5 text-[12px] font-medium text-ink"><BriefcaseBusiness size={12}/>{(job.contract_type||job.job_type||'Not stated').replaceAll('_',' ')}</p></div>
        <div className="rounded-xl border border-border bg-surface/60 p-3"><p className="text-[10px] uppercase tracking-[.12em] text-muted mb-1">Salary</p><p className="flex items-center gap-1.5 text-[12px] font-medium text-ink"><Banknote size={12}/>{salaryText(job)}</p></div>
      </div>
      <div className="rounded-xl border border-border p-4">
        <p className="text-[10px] uppercase tracking-[.14em] text-[#9c7a42] font-semibold mb-2">Job description</p>
        <p className="text-[13px] leading-6 text-secondary whitespace-pre-line">{job.job_description||job.description||'The property has not added a full job description.'}</p>
        <Link href={`/jobs/${job.id}`} className="mt-3 inline-flex text-[12px] font-semibold text-[#0b2f4d] hover:underline">View full role →</Link>
      </div>
      {match&&<div className="rounded-xl border border-[#e3dac8] bg-[#fcfaf5] p-4">
        <div className="flex items-start justify-between gap-3 mb-3"><div><p className="text-[10px] uppercase tracking-[.14em] text-[#9c7a42] font-semibold">Why you match</p><p className="mt-1 text-[13px] leading-5 text-secondary">{match.matchExplanation||'Your profile has been compared with the requirements of this role.'}</p></div><span className="rounded-full bg-white border border-[#e0d7c7] px-3 py-1 text-[13px] font-semibold text-ink shrink-0">{match.score}%</span></div>
        {match.matchingSkills?.length>0&&<div className="flex flex-wrap gap-1.5 mb-3">{match.matchingSkills.slice(0,6).map((s:string)=><span key={s} className="rounded-full border border-[#dfd5c2] bg-white px-2.5 py-1 text-[10px] font-medium text-[#765d34]">✓ {s}</span>)}</div>}
        {match.breakdown&&<MatchBreakdown breakdown={match.breakdown} score={match.score} label={match.label} colour={match.colour}/>} 
      </div>}
    </div>
  }

  return <>
    <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-semibold tracking-tight text-ink">My Applications</h1><p className="mt-1 text-[13px] text-muted">Matched roles stay private until you review the role, your match and your covering letter, then press Send Application.</p></div><Link href="/roles/match" className="btn-secondary text-[12px] flex items-center gap-1">Find Matches <ArrowRight size={12}/></Link></div>
    <div className="flex flex-wrap gap-2 mb-6">{['all','draft','pending','reviewed','shortlisted','interview','offered','accepted','rejected'].map(s=>{const n=counts[s]||0;if(s!=='all'&&!n)return null;return <button type="button" key={s} onClick={()=>{setFilter(s);setPage(1)}} className={`px-3 py-1.5 rounded-lg text-[12px] font-medium ${filter===s?'bg-ink text-white':'bg-surface text-muted hover:text-ink'}`}>{s==='all'?'All':config[s]?.label||s}{n>0&&<span className="ml-1 opacity-60">({n})</span>}</button>})}</div>
    {loading?<div className="h-64 flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-ink border-t-transparent rounded-full"/></div>:error?<div className="dashboard-card text-center py-12 text-[13px] text-red-600">{error}</div>:counts.all===0&&!(counts.draft||0)?<div className="dashboard-card text-center py-16"><FileText size={40} className="mx-auto mb-3 text-muted/40"/><p className="text-[15px] font-medium text-ink mb-1">Nothing saved yet</p><p className="text-[13px] text-muted mb-6">Use Match to find roles that fit your experience.</p><Link href="/roles/match" className="btn-primary inline-flex items-center gap-1.5">Find Matches <ArrowRight size={13}/></Link></div>:!apps.length?<div className="dashboard-card text-center py-12 text-[13px] text-muted">No applications with this status.</div>:<div className="space-y-3">{apps.map(app=>{const c=app.offer_declined?{icon:config.rejected.icon,color:'text-[#6E747E]',bg:'bg-[#EFECE6]',label:'Offer declined by you'}:config[app.status]||config.pending;const property=app.job_listings?.employer_profiles?.property_name||app.job_listings?.employer_profiles?.company_name||'';const terminal=['accepted','rejected'].includes(app.status);const isDraft=app.status==='draft';const closed=app.job_listings&&(!app.job_listings.is_live||(app.job_listings.expires_at&&new Date(app.job_listings.expires_at).getTime()<=Date.now()));const current=ACTIVE_FLOW.indexOf(app.status);const open=!!expanded[app.id];return <div key={app.id} className={`bg-white border rounded-xl p-5 ${isDraft?'border-[#d7c293]':'border-border'}`}><div className="flex items-start justify-between gap-4 mb-3"><div><h3 className="text-[16px] font-medium text-ink">{app.job_listings?.job_title||'Role no longer available'}</h3><p className="text-[13px] text-muted">{property}{app.job_listings?.location?` · ${app.job_listings.location}`:''}</p></div><span className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${c.bg} ${c.color}`}>{c.icon}{c.label}</span></div>{isDraft?<div className="rounded-xl bg-[#faf8f3] border border-[#e8e0d0] p-4 mb-4"><p className="text-[12px] font-semibold text-ink mb-1">Not sent to the property yet</p><p className="text-[12px] leading-5 text-muted">Check the full role and why WHC matched you before deciding whether to send it.</p></div>:!terminal?<div className="mb-4"><div className="flex items-center gap-1">{ACTIVE_FLOW.map((s,i)=><div key={s} className="flex items-center flex-1 last:flex-none"><div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-semibold ${i<=current?'bg-ink text-white':'bg-surface text-muted'}`}>{i+1}</div>{i<ACTIVE_FLOW.length-1&&<div className={`flex-1 h-[2px] mx-1 ${i<current?'bg-ink':'bg-border'}`}/>}</div>)}</div><div className="mt-1 grid grid-cols-5 gap-1 text-center text-[9px] leading-3 text-muted">{ACTIVE_FLOW.map(s=><span key={s}>{config[s].label}</span>)}</div></div>:null}<button type="button" onClick={()=>toggleDetails(app)} className="mb-4 inline-flex items-center gap-1.5 text-[12px] font-semibold text-[#0b2f4d] hover:underline"><ChevronDown size={13} className={open?'rotate-180 transition-transform':'transition-transform'}/>{open?'Hide role & match':'View role & match'}</button>{open&&<JobAndMatch app={apps.find(x=>x.id===app.id)||app}/>}<div className="flex flex-wrap items-center gap-3 text-[11px] text-muted mt-4"><span>{isDraft?'Saved':'Applied'} {new Date(app.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}</span>{app.match_score&&<span>· {app.match_score}% match</span>}{isDraft&&!closed&&<button type="button" onClick={()=>edit(app)} className="ml-auto btn-primary !py-2 !px-3 inline-flex items-center gap-1.5"><PencilLine size={12}/>Review & Send</button>}{isDraft&&closed&&<span className="ml-auto text-red-500 font-medium">Role closed</span>}{app.status==='accepted'&&app.job_listings?.employer_profiles?.user_id&&<button type="button" onClick={()=>setReviewing({userId:app.job_listings.employer_profiles.user_id,name:property||'this employer'})} className="inline-flex items-center gap-1 font-medium text-amber-500"><Star size={11}/>Review employer</button>}{!terminal&&<button type="button" onClick={()=>remove(app)} className={`${isDraft?'':'ml-auto'} inline-flex items-center gap-1 font-semibold text-red-500`}><X size={12}/>{isDraft?'Remove':'Withdraw application'}</button>}</div></div>})}<Pagination page={page} perPage={perPage} total={total} onPageChange={setPage} onPerPageChange={(next)=>{setPerPage(next);setPage(1)}}/></div>}
    {draft&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4" onClick={()=>!sending&&!aiLoading&&setDraft(null)}><div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl" onClick={e=>e.stopPropagation()}><div className="flex justify-between gap-4 mb-5"><div><p className="text-[10px] uppercase tracking-[0.16em] text-[#9c7a42] font-semibold">Review before sending</p><h2 className="text-[22px] font-semibold text-ink mt-1">{draft.job_listings?.job_title}</h2><p className="text-[12px] text-muted">{draft.job_listings?.employer_profiles?.property_name||draft.job_listings?.employer_profiles?.company_name}</p></div><button type="button" onClick={()=>setDraft(null)} disabled={sending||!!aiLoading}><X size={20}/></button></div><JobAndMatch app={draft} compact/>

      <div className="mt-6 rounded-2xl border border-[#ded3bd] bg-[#fcfaf5] p-5">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#0b2f4d] text-white"><Sparkles size={16}/></div>
          <div className="flex-1"><p className="text-[13px] font-semibold text-ink">WHC AI Application Assistant</p><p className="mt-1 text-[12px] leading-5 text-muted">Uses your WHC profile and this role to help you present your real experience clearly. It will not invent qualifications or send anything for you.</p></div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3">
          <button type="button" onClick={()=>runAi('analyse')} disabled={!!aiLoading} className="btn-secondary !px-3 !py-2.5 text-[11px] disabled:opacity-50">{aiLoading==='analyse'?'Checking…':'Check my application'}</button>
          <button type="button" onClick={()=>runAi('draft')} disabled={!!aiLoading} className="btn-secondary !px-3 !py-2.5 text-[11px] disabled:opacity-50">{aiLoading==='draft'?'Writing…':'Write covering letter'}</button>
          <button type="button" onClick={()=>runAi('improve')} disabled={!!aiLoading||!letter.trim()} className="btn-secondary !px-3 !py-2.5 text-[11px] disabled:opacity-50">{aiLoading==='improve'?'Improving…':'Improve my letter'}</button>
        </div>
        {aiError&&<div className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] text-red-600">{aiError}</div>}
        {aiResult&&<div className="mt-4 border-t border-[#e5dccb] pt-4 space-y-3">
          {aiResult.summary&&<div><p className="text-[10px] uppercase tracking-[.12em] font-semibold text-[#9c7a42]">Application strength</p><p className="mt-1 text-[12px] leading-5 text-secondary">{aiResult.summary}</p></div>}
          {(aiResult.strengths.length>0||aiResult.gaps.length>0)&&<div className="grid gap-3 md:grid-cols-2">
            {aiResult.strengths.length>0&&<div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3"><p className="text-[10px] uppercase tracking-[.12em] font-semibold text-emerald-700 mb-2">Strong evidence</p><ul className="space-y-1.5 text-[11px] leading-4 text-emerald-900">{aiResult.strengths.map((item,i)=><li key={i}>✓ {item}</li>)}</ul></div>}
            {aiResult.gaps.length>0&&<div className="rounded-xl border border-amber-100 bg-amber-50/60 p-3"><p className="text-[10px] uppercase tracking-[.12em] font-semibold text-amber-700 mb-2">Consider strengthening</p><ul className="space-y-1.5 text-[11px] leading-4 text-amber-900">{aiResult.gaps.map((item,i)=><li key={i}>• {item}</li>)}</ul></div>}
          </div>}
        </div>}
      </div>

      <div className="mt-6 border-t border-border pt-5"><label className="block text-[12px] font-semibold text-ink mb-2">Covering letter <span className="font-normal text-muted">(optional)</span></label><textarea value={letter} onChange={e=>setLetter(e.target.value)} rows={9} maxLength={5000} className="input-field resize-y text-[13px] leading-6" placeholder="Tell the property why this role interests you and what you would bring to the team."/><div className="mt-2 flex justify-between text-[11px] text-muted"><span>You can edit every word before sending. AI suggestions are never submitted automatically.</span><span>{letter.length}/5000</span></div></div>{sendError&&<div className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-[12px] text-red-600">{sendError}</div>}<div className="mt-6 flex justify-end gap-2"><button type="button" onClick={()=>setDraft(null)} disabled={sending||!!aiLoading} className="btn-secondary">Keep as Draft</button><button type="button" onClick={send} disabled={sending||!!aiLoading} className="btn-primary inline-flex items-center gap-2"><Send size={14}/>{sending?'Sending…':'Send Application'}</button></div></div></div>}
    {submitted&&<div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/45 p-4"><div className="w-full max-w-xl rounded-3xl bg-white p-7 shadow-xl"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600"><CheckCircle size={26}/></div><p className="mt-5 text-[10px] uppercase tracking-[.16em] text-[#9c7a42] font-semibold">Application submitted</p><h2 className="mt-1 text-[27px] font-semibold tracking-[-.03em] text-ink">Thank you — your application has been submitted.</h2><p className="mt-3 text-[13px] leading-6 text-muted">Your application for <span className="font-semibold text-ink">{submitted.jobTitle}</span> has been sent to {submitted.property}. You can follow its progress here as the property reviews it.</p><div className="mt-7 rounded-2xl border border-border bg-[#fcfaf5] p-5"><div className="flex items-center gap-1">{ACTIVE_FLOW.map((s,i)=><div key={s} className="flex items-center flex-1 last:flex-none"><div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-semibold ${i===0?'bg-ink text-white':'bg-white border border-border text-muted'}`}>{i+1}</div>{i<ACTIVE_FLOW.length-1&&<div className="mx-1 h-[2px] flex-1 bg-border"/>}</div>)}</div><div className="mt-2 grid grid-cols-5 gap-1 text-center text-[9px] leading-3 text-muted">{ACTIVE_FLOW.map(s=><span key={s}>{config[s].label}</span>)}</div></div><div className="mt-6 flex flex-col gap-2 sm:flex-row"><button type="button" onClick={()=>setSubmitted(null)} className="btn-primary flex-1">View my applications</button><Link href="/roles/match" onClick={()=>setSubmitted(null)} className="btn-secondary flex-1 text-center">Find another role</Link></div></div></div>}
    {reviewing&&<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={()=>setReviewing(null)}><div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={e=>e.stopPropagation()}><div className="flex items-center justify-between mb-4"><h2 className="text-lg font-bold text-ink">Review {reviewing.name}</h2><button type="button" onClick={()=>setReviewing(null)}><X size={20}/></button></div><ReviewForm reviewedId={reviewing.userId} reviewedName={reviewing.name} type="employer"/></div></div>}
  </>
}
