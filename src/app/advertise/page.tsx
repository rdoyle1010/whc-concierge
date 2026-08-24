'use client'

import { FormEvent, useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AD_PLACEMENTS, type AdPlacementKey } from '@/lib/advertising'
import { ArrowRight, Check, Eye, Megaphone, MousePointerClick, ShieldCheck, Sparkles, Users } from 'lucide-react'

const audienceCopy: Record<AdPlacementKey, { audience: string; where: string; bestFor: string }> = {
  homepage_spotlight: {
    audience: 'Talent, employers and industry visitors',
    where: 'Immediately below the homepage hero',
    bestFor: 'Brand launches, product houses, equipment, education and major industry campaigns',
  },
  academy_sponsor: {
    audience: 'Professionals actively developing their careers',
    where: 'Inside the WHC Academy journey',
    bestFor: 'Training, product houses, education, equipment and professional services',
  },
  jobs_talent_sponsor: {
    audience: 'Job-seeking Talent and employers browsing the market',
    where: 'Alongside role discovery and talent activity',
    bestFor: 'Recruitment brands, uniforms, technology, professional services and industry suppliers',
  },
}

export default function AdvertisePage() {
  const [placement, setPlacement] = useState<AdPlacementKey>('homepage_spotlight')
  const [form, setForm] = useState({ brandName: '', contactEmail: '', tagline: '', websiteUrl: '', logoUrl: '' })
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [paid, setPaid] = useState(false)

  useEffect(() => { setPaid(new URLSearchParams(window.location.search).get('paid') === 'true') }, [])

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setError('')
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'sponsored_ad', placement, ...form, returnUrl: window.location.origin }),
      })
      const json = await response.json()
      if (!response.ok || !json.url) throw new Error(json.error || 'Could not start payment.')
      window.location.href = json.url
    } catch (caught: any) {
      setError(caught.message || 'Could not start payment. Please try again.')
      setBusy(false)
    }
  }

  const selected = AD_PLACEMENTS[placement]
  const selectedAudience = audienceCopy[placement]

  return <div className="min-h-screen bg-[#f4f1ea]">
    <Navbar />
    <main className="pt-[68px]">
      <section className="bg-[#0b2f4d] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-24 grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4b477] font-semibold mb-4">Advertise with Wellness House Collective</p>
            <h1 className="text-[44px] md:text-[62px] leading-[1.01] tracking-[-0.05em] font-semibold text-white max-w-4xl">Be seen by the people shaping luxury wellness.</h1>
            <p className="text-[16px] leading-8 text-white/68 max-w-2xl mt-6">Put your brand in front of spa professionals, hospitality employers and decision-makers through carefully placed, clearly labelled sponsored positions across Spa Platform.</p>
            <div className="flex flex-wrap gap-5 mt-7 text-[11px] text-white/70">
              <span className="inline-flex items-center gap-2"><ShieldCheck size={14} className="text-[#d4b477]" /> WHC reviewed before launch</span>
              <span className="inline-flex items-center gap-2"><Eye size={14} className="text-[#d4b477]" /> Impressions tracked</span>
              <span className="inline-flex items-center gap-2"><MousePointerClick size={14} className="text-[#d4b477]" /> Clicks tracked</span>
            </div>
          </div>

          <div className="rounded-[28px] bg-white text-[#10283b] p-7 md:p-9 shadow-2xl shadow-black/20">
            <p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#9c7a42]">What brands are buying</p>
            <h2 className="text-[28px] font-semibold tracking-[-.035em] mt-2">A real placement. A defined audience. A measurable result.</h2>
            <div className="space-y-4 mt-6">
              {[
                [Users, 'Relevant audience', 'Choose the part of Spa Platform where the people you want to reach are already active.'],
                [Megaphone, 'Visible sponsored placement', 'Your brand appears as a clearly labelled sponsored feature, not buried in a generic directory.'],
                [Sparkles, 'Quality controlled', 'WHC reviews the wording, destination and creative before anything goes live.'],
              ].map(([Icon, title, text]: any) => <div key={title} className="flex gap-4"><div className="h-10 w-10 rounded-xl bg-[#f5efe2] flex items-center justify-center shrink-0"><Icon size={18} className="text-[#9c7a42]" /></div><div><p className="text-[14px] font-semibold">{title}</p><p className="text-[12px] text-black/55 leading-5 mt-1">{text}</p></div></div>)}
            </div>
          </div>
        </div>
      </section>

      {paid && <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8"><div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-5"><p className="font-medium flex items-center gap-2"><Check size={16} /> Payment confirmed.</p><p className="text-[13px] mt-1">Your advert is now in the WHC approval queue. It cannot appear publicly until it has been reviewed.</p></div></div>}

      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-14 md:py-16">
        <div className="max-w-3xl mb-8">
          <p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42]">Choose your placement</p>
          <h2 className="text-[32px] md:text-[42px] font-semibold tracking-[-.04em] text-[#10283b] mt-2">Where do you want your brand to live?</h2>
          <p className="text-[13px] leading-6 text-[#65727c] mt-3">Each position has a different context and audience. Select one to see exactly what it is designed to do.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
          {(Object.entries(AD_PLACEMENTS) as [AdPlacementKey, (typeof AD_PLACEMENTS)[AdPlacementKey]][]).map(([key, config]) => {
            const copy = audienceCopy[key]
            const active = placement === key
            return <button key={key} type="button" onClick={() => setPlacement(key)} className={`text-left rounded-[22px] p-6 transition-all ${active ? 'bg-[#10283b] text-white border border-[#10283b] shadow-lg' : 'bg-white border border-[#ddd9d1] text-[#10283b] hover:border-[#c9a96e]'}`}>
              <div className="flex items-start justify-between gap-4"><div><p className={`text-[10px] uppercase tracking-[.15em] font-semibold ${active ? 'text-[#d4b477]' : 'text-[#9c7a42]'}`}>{config.label}</p><p className={`text-[31px] font-semibold mt-2 ${active ? 'text-white' : 'text-[#10283b]'}`}>£{config.monthlyPence / 100}<span className={`text-[11px] font-normal ${active ? 'text-white/55' : 'text-[#8a949b]'}`}> / month</span></p></div>{active && <Check size={18} className="text-[#d4b477]" />}</div>
              <p className={`text-[12px] leading-6 mt-4 ${active ? 'text-white/66' : 'text-[#65727c]'}`}>{config.description}</p>
              <div className={`mt-5 pt-4 border-t space-y-2 ${active ? 'border-white/12' : 'border-[#ece8e1]'}`}>
                <p className={`text-[11px] ${active ? 'text-white/78' : 'text-[#53636f]'}`}><strong>Audience:</strong> {copy.audience}</p>
                <p className={`text-[11px] ${active ? 'text-white/78' : 'text-[#53636f]'}`}><strong>Best for:</strong> {copy.bestFor}</p>
              </div>
            </button>
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[.9fr_1.1fr] gap-8 items-start">
          <div className="space-y-5">
            <div className="rounded-[22px] bg-white border border-[#ddd9d1] p-7">
              <p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#9c7a42]">Your selected placement</p>
              <h2 className="text-[27px] font-semibold tracking-[-.03em] text-[#10283b] mt-2">{selected.label}</h2>
              <div className="space-y-4 mt-6 text-[12px] leading-6 text-[#65727c]">
                <div><p className="font-semibold text-[#10283b]">Where it appears</p><p>{selectedAudience.where}</p></div>
                <div><p className="font-semibold text-[#10283b]">Who sees it</p><p>{selectedAudience.audience}</p></div>
                <div><p className="font-semibold text-[#10283b]">Best suited to</p><p>{selectedAudience.bestFor}</p></div>
              </div>
            </div>

            <div className="rounded-[22px] bg-[#f8f5ee] border border-[#ddd9d1] p-7">
              <p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#9c7a42]">How it works</p>
              <ol className="space-y-5 mt-5">
                <li className="flex gap-3"><span className="h-7 w-7 rounded-full bg-[#10283b] text-white flex items-center justify-center text-[10px] shrink-0">1</span><div><p className="text-[13px] font-semibold text-[#10283b]">Choose the placement and submit your creative</p><p className="text-[11px] text-[#65727c] leading-5 mt-1">Brand, wording, destination link and logo.</p></div></li>
                <li className="flex gap-3"><span className="h-7 w-7 rounded-full bg-[#10283b] text-white flex items-center justify-center text-[10px] shrink-0">2</span><div><p className="text-[13px] font-semibold text-[#10283b]">Complete secure payment</p><p className="text-[11px] text-[#65727c] leading-5 mt-1">Stripe creates the monthly paid placement.</p></div></li>
                <li className="flex gap-3"><span className="h-7 w-7 rounded-full bg-[#10283b] text-white flex items-center justify-center text-[10px] shrink-0">3</span><div><p className="text-[13px] font-semibold text-[#10283b]">WHC approves before anything appears</p><p className="text-[11px] text-[#65727c] leading-5 mt-1">Quality, wording and destination are reviewed.</p></div></li>
                <li className="flex gap-3"><span className="h-7 w-7 rounded-full bg-[#10283b] text-white flex items-center justify-center text-[10px] shrink-0">4</span><div><p className="text-[13px] font-semibold text-[#10283b]">Go live and measure engagement</p><p className="text-[11px] text-[#65727c] leading-5 mt-1">Impressions and clicks are tracked inside the platform.</p></div></li>
              </ol>
            </div>
          </div>

          <form onSubmit={submit} className="bg-white border border-[#ddd9d1] rounded-[22px] p-7 md:p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4 pb-6 mb-6 border-b border-[#ece8e1]"><div><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#9c7a42]">Book this placement</p><h2 className="text-[27px] font-semibold tracking-[-.03em] text-[#10283b] mt-2">{selected.label}</h2></div><p className="text-right text-[24px] font-semibold text-[#10283b]">£{selected.monthlyPence / 100}<span className="block text-[10px] font-normal text-[#8a949b]">per month</span></p></div>
            <div className="space-y-4">
              <label className="block text-[12px] text-[#53636f]">Brand name<input required value={form.brandName} onChange={event => setForm({ ...form, brandName: event.target.value })} className="input-field mt-1" /></label>
              <label className="block text-[12px] text-[#53636f]">Contact email<input required type="email" value={form.contactEmail} onChange={event => setForm({ ...form, contactEmail: event.target.value })} className="input-field mt-1" /></label>
              <label className="block text-[12px] text-[#53636f]">Advert wording<input required maxLength={220} value={form.tagline} onChange={event => setForm({ ...form, tagline: event.target.value })} placeholder="A short line shown beside your logo" className="input-field mt-1" /></label>
              <label className="block text-[12px] text-[#53636f]">Website link<input required type="url" value={form.websiteUrl} onChange={event => setForm({ ...form, websiteUrl: event.target.value })} placeholder="https://yourbrand.com" className="input-field mt-1" /></label>
              <label className="block text-[12px] text-[#53636f]">Logo image link<input required type="url" value={form.logoUrl} onChange={event => setForm({ ...form, logoUrl: event.target.value })} placeholder="https://yourbrand.com/logo.png" className="input-field mt-1" /><span className="block mt-1 text-[10px] text-[#8a949b]">Direct public HTTPS link to a PNG, JPG, WebP or SVG logo.</span></label>
            </div>
            {error && <p className="text-[12px] text-red-600 mt-4">{error}</p>}
            <button disabled={busy} className="btn-primary w-full mt-6 disabled:opacity-50 inline-flex items-center justify-center gap-2">{busy ? 'Opening secure payment...' : <>Continue to Stripe — £{selected.monthlyPence / 100}/month <ArrowRight size={13}/></>}</button>
            <div className="flex gap-2 mt-4 text-[10px] leading-5 text-[#7a858c]"><ShieldCheck size={14} className="text-[#9c7a42] shrink-0 mt-0.5" /><p>Payment does not automatically publish the advert. WHC approval is required before the placement can go live.</p></div>
          </form>
        </div>
      </section>
    </main>
    <Footer />
  </div>
}
