'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { Check, Sparkles, Star } from 'lucide-react'
import { TALENT_MEMBERSHIPS, FEATURED_TALENT } from '@/lib/constants'

export default function TalentMembershipPage() {
  const searchParams = useSearchParams()
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const sessionId = searchParams.get('session_id')
    if (searchParams.get('checkout') === 'success' && sessionId) {
      fetch('/api/commercial/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
        .then(async r => ({ ok:r.ok, body: await r.json().catch(()=>({})) }))
        .then(x => x.ok ? setNotice('Payment confirmed. Your new benefits are active.') : setError(x.body.error || 'Payment could not be confirmed.'))
    } else if (searchParams.get('checkout') === 'cancelled') setNotice('Checkout cancelled. You have not been charged.')
  }, [searchParams])

  async function buy(product:string) {
    setBusy(product); setError('')
    const res = await fetch('/api/commercial/checkout', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ product, returnUrl: window.location.origin }) })
    const j = await res.json().catch(()=>({}))
    if (!res.ok || !j.url) { setError(j.error || 'Could not start checkout.'); setBusy(''); return }
    window.location.href = j.url
  }

  const plans = [
    { key:'free', title:'Talent Free', price:'£0', cta:'Current free access', features:['Professional profile and CV','Browse jobs, Agency and Residency','Basic match percentage','Apply, save and withdraw','1 Interview Ready trial','Academy at standard price'] },
    { key:'standard', title:'Talent Standard', price:'£9.99/month', cta:'Choose Standard', features:['Everything in Free','1 Interview Ready credit monthly','Detailed match insights','Enhanced CV and profile tools','10% off Academy','Up to 3 Interview Ready credits rollover'] },
    { key:'pro', title:'Talent Pro', price:'£19.99/month', cta:'Choose Pro', features:['Everything in Standard','10 Interview Ready credits monthly','Advanced role and employer preparation','Priority employer visibility','20% off Academy','Up to 20 credits rollover','1 free 7-day feature credit monthly'] },
  ]

  return <DashboardShell role="talent"><div className="mb-8"><p className="dashboard-eyebrow">Membership</p><h1 className="dashboard-title">Build your career with Talent House</h1><p className="dashboard-intro">Free stays genuinely useful. Upgrade when you want deeper preparation, more Interview Ready access and stronger visibility.</p></div>
    {notice && <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 mb-5 text-sm">{notice}</div>}{error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 mb-5 text-sm">{error}</div>}
    <div className="grid md:grid-cols-3 gap-5">{plans.map(p => <div key={p.key} className={`dashboard-card ${p.key==='pro'?'border-accent ring-1 ring-accent/20':''}`}><div className="flex items-center justify-between"><h2 className="font-serif text-2xl text-ink">{p.title}</h2>{p.key==='pro'&&<Sparkles size={18} className="text-accent"/>}</div><p className="text-2xl font-semibold text-ink mt-3">{p.price}</p><div className="space-y-2 mt-5">{p.features.map(f=><p key={f} className="text-sm text-gray-600 flex gap-2"><Check size={14} className="text-accent mt-1 shrink-0"/>{f}</p>)}</div>{p.key==='free'?<div className="btn-secondary w-full text-center mt-6 opacity-60">{p.cta}</div>:<button disabled={!!busy} onClick={()=>buy(p.key==='standard'?'talent_standard':'talent_pro')} className="btn-primary w-full mt-6 disabled:opacity-50">{busy ? 'Opening checkout…' : p.cta}</button>}</div>)}</div>
    <div className="mt-10"><div className="flex items-center gap-2"><Star size={18} className="text-accent"/><h2 className="font-serif text-2xl text-ink">Featured Talent</h2></div><p className="text-sm text-secondary mt-1">Buy extra visibility when you actively want a new opportunity. This is separate from membership.</p><div className="grid md:grid-cols-2 gap-5 mt-4"><div className="dashboard-card"><h3 className="font-semibold">7 days</h3><p className="text-2xl font-semibold mt-2">£{(FEATURED_TALENT.seven_days.price/100).toFixed(2)}</p><button onClick={()=>buy('featured_talent_7')} disabled={!!busy} className="btn-primary w-full mt-5">Feature me for 7 days</button></div><div className="dashboard-card"><h3 className="font-semibold">30 days</h3><p className="text-2xl font-semibold mt-2">£{(FEATURED_TALENT.thirty_days.price/100).toFixed(2)}</p><button onClick={()=>buy('featured_talent_30')} disabled={!!busy} className="btn-primary w-full mt-5">Feature me for 30 days</button></div></div></div>
  </DashboardShell>
}
