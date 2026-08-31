'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { Check, Building2 } from 'lucide-react'

export default function EmployerMembershipPage() {
  const searchParams = useSearchParams()
  const [busy,setBusy]=useState('')
  const [notice,setNotice]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{
    const sessionId=searchParams.get('session_id')
    if(searchParams.get('checkout')==='success'&&sessionId){
      fetch('/api/commercial/confirm',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({sessionId})})
        .then(async r=>({ok:r.ok,body:await r.json().catch(()=>({}))}))
        .then(x=>x.ok?setNotice('Payment confirmed. Your employer membership is active.'):setError(x.body.error||'Payment could not be confirmed.'))
    } else if(searchParams.get('checkout')==='cancelled') setNotice('Checkout cancelled. You have not been charged.')
  },[searchParams])

  async function buy(product:string){
    setBusy(product);setError('')
    const res=await fetch('/api/commercial/checkout',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({product,returnUrl:window.location.origin})})
    const j=await res.json().catch(()=>({}))
    if(!res.ok||!j.url){setError(j.error||'Could not start checkout.');setBusy('');return}
    window.location.href=j.url
  }

  const plans=[
    {key:'free',title:'Employer Free',price:'£0',features:['Company and spa profile','Property Fact File','Limited talent browsing','Receive applications','Save candidate profiles','Employer reviews and reputation']},
    {key:'pro',title:'Employer Pro',price:'£499/year',features:['Everything in Free','Full talent search','Enhanced candidate matching','Analytics and candidate notes','Priority support','Standard Jobs reduced to £99']},
    {key:'group',title:'Employer Group',price:'£999/year',features:['Everything in Employer Pro','Up to 20 job listings per year','Multiple properties and hiring managers','Advanced talent pools and analytics','Featured job credits and priority support']},
  ]

  return <DashboardShell role="employer"><div className="mb-8"><p className="dashboard-eyebrow">Employer membership</p><h1 className="dashboard-title">Recruit the way your business works</h1><p className="dashboard-intro">Start free, pay per role, or choose an annual plan if you recruit regularly.</p></div>
    {notice&&<div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 mb-5 text-sm">{notice}</div>}{error&&<div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-5 text-sm">{error}</div>}
    <div className="grid md:grid-cols-3 gap-5">{plans.map(p=><div key={p.key} className={`dashboard-card ${p.key==='group'?'border-accent ring-1 ring-accent/20':''}`}><div className="flex items-center justify-between"><h2 className="font-serif text-2xl text-ink">{p.title}</h2>{p.key!=='free'&&<Building2 size={18} className="text-accent"/>}</div><p className="text-2xl font-semibold text-ink mt-3">{p.price}</p><div className="space-y-2 mt-5">{p.features.map(f=><p key={f} className="text-sm text-gray-600 flex gap-2"><Check size={14} className="text-accent mt-1 shrink-0"/>{f}</p>)}</div>{p.key==='free'?<div className="btn-secondary w-full text-center mt-6 opacity-60">Free account</div>:<button disabled={!!busy} onClick={()=>buy(p.key==='pro'?'employer_pro':'employer_group')} className="btn-primary w-full mt-6 disabled:opacity-50">{busy?'Opening checkout…':p.key==='pro'?'Choose Employer Pro':'Choose Employer Group'}</button>}</div>)}</div>
    <div className="dashboard-card mt-8"><h2 className="font-serif text-2xl text-ink">Pay-per-role options</h2><div className="grid md:grid-cols-2 gap-5 mt-4"><div><p className="font-semibold">Standard Job - £149</p><p className="text-sm text-gray-500 mt-1">30 days, matching, applications, shortlist and automatic filled-role notifications.</p></div><div><p className="font-semibold">Featured Job - £249</p><p className="text-sm text-gray-500 mt-1">Priority placement, relevant talent email, featured badge and enhanced employer branding.</p></div></div></div>
  </DashboardShell>
}
