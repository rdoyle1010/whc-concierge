'use client'

import { FormEvent, useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AD_PLACEMENTS, type AdPlacementKey } from '@/lib/advertising'
import { Check, Megaphone, ShieldCheck } from 'lucide-react'

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

  return <div className="min-h-screen bg-surface">
    <Navbar />
    <main className="pt-16">
      <section className="bg-ink text-white">
        <div className="max-w-6xl mx-auto px-6 py-16 lg:px-8">
          <p className="text-[11px] uppercase tracking-[0.18em] text-gold font-semibold mb-3">Advertise with WHC</p>
          <h1 className="font-serif text-[38px] md:text-[52px] leading-tight mb-4">Put your brand in front of the luxury wellness industry.</h1>
          <p className="text-[15px] text-white/70 max-w-2xl">Choose the audience and location that fit your campaign. Every placement is clearly labelled Sponsored and reviewed by Wellness House Collective before it goes live.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 py-12 lg:px-8">
        {paid && <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-5 mb-8"><p className="font-medium flex items-center gap-2"><Check size={16} /> Payment confirmed.</p><p className="text-[13px] mt-1">Your advert is in the approval queue. WHC will check the logo, wording and destination before making it live.</p></div>}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
          {(Object.entries(AD_PLACEMENTS) as [AdPlacementKey, (typeof AD_PLACEMENTS)[AdPlacementKey]][]).map(([key, config]) => <button key={key} onClick={() => setPlacement(key)} className={`text-left bg-white border rounded-xl p-5 transition-all ${placement === key ? 'border-gold ring-2 ring-gold/30' : 'border-border hover:border-gold/50'}`}>
            <p className="text-[11px] uppercase tracking-wide text-accent mb-1">{config.label}</p>
            <p className="font-serif text-[26px] font-semibold text-ink mb-2">£{config.monthlyPence / 100}<span className="font-sans text-[12px] text-gray-400 font-normal"> / month</span></p>
            <p className="text-[12px] text-gray-500 leading-relaxed">{config.description}</p>
          </button>)}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr] gap-8 items-start">
          <div className="bg-white border border-border rounded-xl p-6">
            <Megaphone size={22} className="text-accent mb-3" />
            <h2 className="font-serif text-[22px] font-semibold text-ink mb-3">How it works</h2>
            <ol className="space-y-4 text-[13px] text-gray-600"><li><strong className="text-ink">1. Choose and pay.</strong> Stripe handles the monthly subscription securely.</li><li><strong className="text-ink">2. WHC reviews.</strong> We check the wording, image and link protect the quality of the Collective.</li><li><strong className="text-ink">3. Go live.</strong> Once approved, the advert rotates in your chosen position and impressions and clicks are tracked.</li></ol>
            <div className="flex gap-2 mt-6 text-[11px] text-gray-500"><ShieldCheck size={15} className="text-green-600 shrink-0" /><p>Your advert cannot appear before both Stripe payment and WHC approval are confirmed.</p></div>
          </div>

          <form onSubmit={submit} className="bg-white border border-border rounded-xl p-6 md:p-8">
            <h2 className="font-serif text-[22px] font-semibold text-ink mb-1">Book {AD_PLACEMENTS[placement].label}</h2>
            <p className="text-[12px] text-gray-500 mb-6">£{AD_PLACEMENTS[placement].monthlyPence / 100} monthly. Cancel through the secure Stripe billing portal.</p>
            <div className="space-y-4">
              <label className="block text-[12px] text-gray-600">Brand name<input required value={form.brandName} onChange={event => setForm({ ...form, brandName: event.target.value })} className="input-field mt-1" /></label>
              <label className="block text-[12px] text-gray-600">Contact email<input required type="email" value={form.contactEmail} onChange={event => setForm({ ...form, contactEmail: event.target.value })} className="input-field mt-1" /></label>
              <label className="block text-[12px] text-gray-600">Advert wording<input required maxLength={220} value={form.tagline} onChange={event => setForm({ ...form, tagline: event.target.value })} placeholder="A short line shown beside your logo" className="input-field mt-1" /></label>
              <label className="block text-[12px] text-gray-600">Website link<input required type="url" value={form.websiteUrl} onChange={event => setForm({ ...form, websiteUrl: event.target.value })} placeholder="https://yourbrand.com" className="input-field mt-1" /></label>
              <label className="block text-[12px] text-gray-600">Logo image link<input required type="url" value={form.logoUrl} onChange={event => setForm({ ...form, logoUrl: event.target.value })} placeholder="https://yourbrand.com/logo.png" className="input-field mt-1" /><span className="block mt-1 text-[10px] text-gray-400">Use a direct, public https:// link to a PNG, JPG, WebP or SVG logo.</span></label>
            </div>
            {error && <p className="text-[12px] text-red-600 mt-4">{error}</p>}
            <button disabled={busy} className="btn-primary w-full mt-6 disabled:opacity-50">{busy ? 'Opening secure payment...' : `Continue to Stripe — £${AD_PLACEMENTS[placement].monthlyPence / 100}/month`}</button>
          </form>
        </div>
      </section>
    </main>
    <Footer />
  </div>
}
