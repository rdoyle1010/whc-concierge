'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { AD_BILLING_COPY, AD_PLACEMENTS, type AdPlacementKey } from '@/lib/advertising'
import { ArrowRight, Check, ShieldCheck } from 'lucide-react'

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
  job_detail_sponsor: {
    audience: 'Candidates reading individual roles in detail',
    where: 'On job listing pages, beneath the role description',
    bestFor: 'Recruitment services, insurance, uniforms, training and relocation support',
  },
  journal_sponsor: {
    audience: 'Professionals and leaders reading industry editorial',
    where: 'At the top of the WHC Journal',
    bestFor: 'Product houses, education, events and industry announcements',
  },
  journal_article_sponsor: {
    audience: 'Engaged readers inside Journal articles',
    where: 'Within Journal articles as they are read',
    bestFor: 'Product houses, books, courses and considered brand campaigns',
  },
  talent_dashboard_sponsor: {
    audience: 'Signed-in spa and wellness professionals',
    where: 'Inside the talent dashboard',
    bestFor: 'Training, insurance, products for professionals and career services',
  },
  employer_dashboard_sponsor: {
    audience: 'Spa and hotel employers managing recruitment',
    where: 'Inside the employer dashboard',
    bestFor: 'Suppliers, technology, uniforms, agencies and professional services',
  },
  agency_page_sponsor: {
    audience: 'Flexible-work professionals and the properties booking them',
    where: 'On WHC agency and flexible-work pages',
    bestFor: 'Insurance, payroll, training and products for freelance professionals',
  },
  residency_page_sponsor: {
    audience: 'Professionals considering international placements',
    where: 'Alongside residency opportunities',
    bestFor: 'Relocation, travel, insurance and international education',
  },
}

type Confirmation = { brandName: string; placement: string; reviewStatus: string }

function formatPounds(pence: number) {
  const pounds = pence / 100
  return Number.isInteger(pounds) ? String(pounds) : pounds.toFixed(2)
}

export default function AdvertisePage() {
  const [placement, setPlacement] = useState<AdPlacementKey>('homepage_spotlight')
  const [prices, setPrices] = useState<Record<string, number>>({})
  const [form, setForm] = useState({ brandName: '', contactEmail: '', tagline: '', websiteUrl: '', logoUrl: '' })
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmation, setConfirmation] = useState<Confirmation | null>(null)
  const [confirmationError, setConfirmationError] = useState('')
  const [cancelled, setCancelled] = useState(false)

  useEffect(() => {
    // The price Stripe actually charges lives in commercial_settings, so the
    // page shows those live prices rather than the hardcoded defaults.
    fetch('/api/advertising/prices')
      .then(response => response.json())
      .then(json => { if (json?.prices) setPrices(json.prices) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    setCancelled(params.get('cancelled') === 'true')
    const sessionId = params.get('session_id')
    if (params.get('paid') !== 'true' || !sessionId) return

    setConfirming(true)
    fetch('/api/stripe/sponsored-ad-confirm', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId }),
    })
      .then(async response => {
        const json = await response.json()
        if (!response.ok) throw new Error(json.error || 'Could not confirm your advert submission.')
        setConfirmation(json.advert)
      })
      .catch(caught => setConfirmationError(caught.message || 'Could not confirm your advert submission.'))
      .finally(() => setConfirming(false))
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      const response = await fetch('/api/stripe/sponsored-ad-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ placement, ...form, termsAccepted, returnUrl: window.location.origin }),
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
  const priceFor = (key: AdPlacementKey) => prices[key] ?? AD_PLACEMENTS[key].monthlyPence
  const selectedPrice = priceFor(placement)

  return <div className="min-h-screen bg-[#f5f5f5]">
    <Navbar />
    <main className="pt-[76px]">
      <section className="bg-[#0b2f4d] text-white">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#555555] font-semibold mb-4">Advertise with Wellness House Collective</p>
          <h1 className="text-[42px] md:text-[58px] leading-[1.02] tracking-[-0.05em] font-semibold text-white max-w-4xl">A real placement, with a clear audience and clear terms.</h1>
          <p className="text-[15px] leading-7 text-white/70 max-w-2xl mt-5">Choose where your brand appears, pay securely through Stripe, then WHC reviews the creative before publication.</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 pt-8 space-y-3">
        {confirming && <div className="bg-blue-50 border border-blue-200 text-blue-800 rounded-xl p-5">Confirming your Stripe payment and creating the admin approval record…</div>}
        {confirmation && <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-5"><p className="font-medium flex items-center gap-2"><Check size={16} /> Payment confirmed and advert submitted.</p><p className="text-[13px] mt-1"><strong>{confirmation.brandName}</strong> · {confirmation.placement}. Status: awaiting WHC approval. A confirmation email has been sent to the address supplied.</p></div>}
        {confirmationError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-5"><p className="font-medium">Payment return needs attention.</p><p className="text-[13px] mt-1">{confirmationError}</p></div>}
        {cancelled && <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-5">Checkout was cancelled. No advert has been submitted.</div>}
      </div>

      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-12 md:py-16">
        <div className="max-w-3xl mb-8">
          <p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#10283b]">Choose your placement</p>
          <h2 className="text-[32px] md:text-[42px] font-semibold tracking-[-.04em] text-[#10283b] mt-2">Where do you want your brand to live?</h2>
          <p className="text-[13px] leading-6 text-[#65727c] mt-3">All placements are rolling monthly subscriptions. They renew each month until cancelled.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-10">
          {(Object.entries(AD_PLACEMENTS) as [AdPlacementKey, (typeof AD_PLACEMENTS)[AdPlacementKey]][]).map(([key, config]) => {
            const copy = audienceCopy[key]
            const active = placement === key
            return <button key={key} type="button" onClick={() => setPlacement(key)} className={`text-left rounded-[22px] p-6 transition-all ${active ? 'bg-[#10283b] text-white border border-[#10283b] shadow-lg' : 'bg-white border border-[#e0e0e0] text-[#10283b] hover:border-[#555555]'}`}>
              <div className="flex items-start justify-between gap-4"><div><p className={`text-[10px] uppercase tracking-[.15em] font-semibold ${active ? 'text-[#555555]' : 'text-[#10283b]'}`}>{config.label}</p><p className={`text-[31px] font-semibold mt-2 ${active ? 'text-white' : 'text-[#10283b]'}`}>£{formatPounds(priceFor(key))}<span className={`text-[11px] font-normal ${active ? 'text-white/55' : 'text-[#8a8a8a]'}`}> / month</span></p></div>{active && <Check size={18} className="text-[#555555]" />}</div>
              <p className={`text-[12px] leading-6 mt-4 ${active ? 'text-white/66' : 'text-[#65727c]'}`}>{config.description}</p>
              <div className={`mt-5 pt-4 border-t space-y-2 ${active ? 'border-white/12' : 'border-[#e9e9e9]'}`}>
                <p className={`text-[11px] ${active ? 'text-white/78' : 'text-[#4d4d4d]'}`}><strong>Audience:</strong> {copy.audience}</p>
                <p className={`text-[11px] ${active ? 'text-white/78' : 'text-[#4d4d4d]'}`}><strong>Best for:</strong> {copy.bestFor}</p>
              </div>
            </button>
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[.9fr_1.1fr] gap-8 items-start">
          <div className="space-y-5">
            <div className="rounded-[22px] bg-white border border-[#e0e0e0] p-7">
              <p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#10283b]">Your selected placement</p>
              <h2 className="text-[27px] font-semibold tracking-[-.03em] text-[#10283b] mt-2">{selected.label}</h2>
              <div className="space-y-4 mt-6 text-[12px] leading-6 text-[#65727c]">
                <div><p className="font-semibold text-[#10283b]">Where it appears</p><p>{selectedAudience.where}</p></div>
                <div><p className="font-semibold text-[#10283b]">Who sees it</p><p>{selectedAudience.audience}</p></div>
                <div><p className="font-semibold text-[#10283b]">How long it runs</p><p>{AD_BILLING_COPY.short}</p></div>
                <div><p className="font-semibold text-[#10283b]">When it starts</p><p>{AD_BILLING_COPY.start}</p></div>
              </div>
            </div>

            <div className="rounded-[22px] bg-[#f7f7f7] border border-[#e0e0e0] p-7 text-[12px] leading-6 text-[#65727c]">
              <p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#10283b] mb-3">Approval journey</p>
              <p><strong className="text-[#10283b]">1.</strong> Submit your creative and accept the Advertising Terms.</p>
              <p><strong className="text-[#10283b]">2.</strong> Complete Stripe checkout. Promotion codes can reduce the first checkout amount, including to £0 where valid.</p>
              <p><strong className="text-[#10283b]">3.</strong> The booking is written to Admin as <strong>Pending Approval</strong>.</p>
              <p><strong className="text-[#10283b]">4.</strong> WHC reviews it, then approval makes the advert live in the placement you bought.</p>
              <p><strong className="text-[#10283b]">5.</strong> You receive an email when it is submitted and another when it goes live.</p>
            </div>
          </div>

          <form onSubmit={submit} className="bg-white border border-[#e0e0e0] rounded-[22px] p-7 md:p-8 shadow-sm">
            <div className="flex items-start justify-between gap-4 pb-6 mb-6 border-b border-[#e9e9e9]"><div><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#10283b]">Book this placement</p><h2 className="text-[27px] font-semibold tracking-[-.03em] text-[#10283b] mt-2">{selected.label}</h2></div><p className="text-right text-[24px] font-semibold text-[#10283b]">£{formatPounds(selectedPrice)}<span className="block text-[10px] font-normal text-[#8a8a8a]">per month · recurring</span></p></div>
            <div className="space-y-4">
              <label className="block text-[12px] text-[#4d4d4d]">Brand name<input required value={form.brandName} onChange={event => setForm({ ...form, brandName: event.target.value })} className="input-field mt-1" /></label>
              <label className="block text-[12px] text-[#4d4d4d]">Contact email<input required type="email" value={form.contactEmail} onChange={event => setForm({ ...form, contactEmail: event.target.value })} className="input-field mt-1" /></label>
              <label className="block text-[12px] text-[#4d4d4d]">Advert wording<input required maxLength={220} value={form.tagline} onChange={event => setForm({ ...form, tagline: event.target.value })} placeholder="A short line shown beside your logo" className="input-field mt-1" /></label>
              <label className="block text-[12px] text-[#4d4d4d]">Website link<input required type="url" value={form.websiteUrl} onChange={event => setForm({ ...form, websiteUrl: event.target.value })} placeholder="https://yourbrand.com" className="input-field mt-1" /></label>
              <label className="block text-[12px] text-[#4d4d4d]">Logo image link<input required type="url" value={form.logoUrl} onChange={event => setForm({ ...form, logoUrl: event.target.value })} placeholder="https://yourbrand.com/logo.png" className="input-field mt-1" /><span className="block mt-1 text-[10px] text-[#8a8a8a]">Direct public HTTPS link to a PNG, JPG, WebP or SVG logo.</span></label>
            </div>

            <div className="mt-6 rounded-xl border border-[#e3e7eb] bg-[#f7f7f7] p-4">
              <label className="flex gap-3 cursor-pointer text-[12px] leading-5 text-[#4d4d4d]">
                <input required type="checkbox" checked={termsAccepted} onChange={event => setTermsAccepted(event.target.checked)} className="mt-1 h-4 w-4" />
                <span>I have read and agree to the <Link href="/advertising-terms" target="_blank" className="font-semibold text-[#10283b] underline">Advertising Terms & Conditions</Link>. I understand this is a rolling monthly subscription, billing starts at checkout, and publication is subject to WHC approval.</span>
              </label>
            </div>

            {error && <p className="text-[12px] text-red-600 mt-4">{error}</p>}
            <button disabled={busy || !termsAccepted} className="btn-primary w-full mt-6 disabled:opacity-50 inline-flex items-center justify-center gap-2">{busy ? 'Opening secure payment...' : <>Continue to Stripe - £{formatPounds(selectedPrice)}/month <ArrowRight size={13}/></>}</button>
            <div className="flex gap-2 mt-4 text-[10px] leading-5 text-[#7a858c]"><ShieldCheck size={14} className="text-[#10283b] shrink-0 mt-0.5" /><p>Payment does not automatically publish the advert. WHC approval is required before the placement can go live.</p></div>
          </form>
        </div>
      </section>
    </main>
    <Footer />
  </div>
}
