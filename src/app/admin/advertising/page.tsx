'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { AD_PLACEMENTS, type AdPlacementKey } from '@/lib/advertising'
import { BarChart3, Check, ExternalLink, Megaphone, Pause, Play, X } from 'lucide-react'

function formatPounds(pence: number) {
  const pounds = pence / 100
  return Number.isInteger(pounds) ? String(pounds) : pounds.toFixed(2)
}

export default function AdminAdvertisingPage() {
  const [adverts, setAdverts] = useState<any[]>([])
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    try {
      const response = await fetch('/api/admin/advertising')
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not load adverts.')
      setAdverts(json.adverts || [])
    } catch (caught: any) { setError(caught.message) } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  useEffect(() => {
    // Live self-serve prices come from commercial_settings, the figures
    // Stripe actually charges - not the hardcoded defaults.
    fetch('/api/advertising/prices')
      .then(response => response.json())
      .then(json => { if (json?.prices) setPrices(json.prices) })
      .catch(() => {})
  }, [])

  async function act(id: string, action: string, done: string) {
    setBusy(`${id}-${action}`); setError(''); setNotice('')
    try {
      const response = await fetch('/api/admin/advertising', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action }) })
      const json = await response.json()
      if (!response.ok) throw new Error(json.error || 'Could not update the advert.')
      setNotice(done); await load()
    } catch (caught: any) { setError(caught.message) } finally { setBusy('') }
  }

  // Direct deals (payment_status 'direct') count alongside Stripe-paid adverts.
  const booked = adverts.filter(advert => ['paid', 'direct'].includes(advert.payment_status))
  const live = booked.filter(advert => advert.status === 'active' && advert.review_status === 'approved')
  const monthly = live.reduce((sum, advert) => sum + Number(advert.monthly_rate || 0), 0)

  return <DashboardShell role="admin" userName="Admin">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between mb-6"><div><div className="flex items-center gap-2 mb-1"><Megaphone size={22} className="text-accent" /><h1 className="text-2xl font-serif font-bold text-ink">Sponsored Ads</h1></div><p className="text-[13px] text-gray-500">Stripe-paid brand adverts. Nothing appears publicly until you approve it.</p></div><Link href="/advertise" target="_blank" className="btn-secondary text-[12px] inline-flex items-center gap-2"><ExternalLink size={13} /> View booking page</Link></div>
    {notice && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{notice}</div>}
    {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8"><div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400">Live adverts</p><p className="text-[22px] font-semibold text-ink">{live.length}</p></div><div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400">Monthly booked value</p><p className="text-[22px] font-semibold text-ink">£{monthly.toFixed(2)}</p></div><div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400">Awaiting approval</p><p className="text-[22px] font-semibold text-amber-700">{adverts.filter(advert => advert.review_status === 'pending').length}</p></div></div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">{(Object.entries(AD_PLACEMENTS) as [AdPlacementKey, (typeof AD_PLACEMENTS)[AdPlacementKey]][]).map(([key, config]) => <div key={key} className="dashboard-card !py-4"><p className="text-[12px] font-medium text-ink">{config.label}</p><p className="text-[18px] font-semibold text-accent my-1">£{formatPounds(prices[key] ?? config.monthlyPence)}/month</p><p className="text-[10px] uppercase tracking-wide text-gray-400 mb-1">Self-serve price</p><p className="text-[11px] text-gray-500">{config.description}</p></div>)}</div>
    <h2 className="text-[16px] font-medium text-ink mb-3">All adverts</h2>
    {loading ? <div className="flex justify-center h-40"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div> : adverts.length === 0 ? <div className="dashboard-card text-center py-12 text-gray-400">No advert bookings yet.</div> : <div className="space-y-3">{adverts.map(advert => {
      const placement = AD_PLACEMENTS[advert.placement as AdPlacementKey]
      const isLegacy = !placement
      return <article key={advert.id} className="dashboard-card">
        <div className="flex flex-col lg:flex-row gap-4 lg:items-center">
          <div className="w-32 h-16 bg-white border border-border rounded-lg flex items-center justify-center shrink-0">{advert.logo_url ? <img src={advert.logo_url} alt="" className="max-w-full max-h-full object-contain p-2" /> : <Megaphone size={20} className="text-gray-300" />}</div>
          <div className="flex-1 min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="text-[15px] font-medium text-ink">{advert.brand_name}</h3><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${advert.payment_status === 'paid' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{advert.payment_status || 'unpaid'}</span><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${advert.review_status === 'approved' ? 'bg-green-50 text-green-700' : advert.review_status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>{advert.review_status || 'legacy'}</span></div><p className="text-[12px] text-gray-600 mt-1">{advert.tagline || 'No advert wording supplied'}</p><p className="text-[11px] text-gray-400 mt-1">{placement?.label || `Legacy location: ${advert.placement}`} · £{Number(advert.monthly_rate || 0).toFixed(2)}/month · {advert.contact_email || 'no contact email'}</p><p className="text-[11px] text-gray-400 mt-1 inline-flex items-center gap-1"><BarChart3 size={11} /> {advert.impression_count || 0} impressions · {advert.click_count || 0} clicks</p>{isLegacy && <p className="text-[11px] text-amber-700 mt-1">Imported legacy record - it will not display or be treated as paid.</p>}</div>
          <div className="flex flex-wrap items-center gap-2 shrink-0">{advert.review_status === 'pending' && <><button onClick={() => act(advert.id, 'approve', 'Advert approved and live.')} disabled={busy !== ''} className="btn-primary text-[11px] inline-flex items-center gap-1"><Check size={12} /> Approve</button><button onClick={() => act(advert.id, 'reject', 'Advert rejected and kept offline.')} disabled={busy !== ''} className="text-[11px] font-medium text-red-500 inline-flex items-center gap-1"><X size={12} /> Reject</button></>}{advert.review_status === 'approved' && advert.status === 'active' && <button onClick={() => act(advert.id, 'pause', 'Advert paused.')} className="btn-secondary text-[11px] inline-flex items-center gap-1"><Pause size={12} /> Pause</button>}{advert.review_status === 'approved' && advert.status === 'paused' && <button onClick={() => act(advert.id, 'resume', 'Advert resumed.')} className="btn-primary text-[11px] inline-flex items-center gap-1"><Play size={12} /> Resume</button>}<button onClick={() => act(advert.id, 'archive', 'Advert archived.')} className="text-[11px] font-medium text-gray-500">Archive</button></div>
        </div>
      </article>
    })}</div>}
  </DashboardShell>
}
