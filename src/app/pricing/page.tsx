'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { X, ChevronDown, Shield } from 'lucide-react'
import { JOB_TIERS } from '@/lib/constants'

const TIER_KEYS = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const
const TIERS = TIER_KEYS.map(k => ({ name: k, ...JOB_TIERS[k] }))
const ROWS: { label: string; key: string; boolean?: boolean }[] = [
  { label: 'Price', key: 'display' }, { label: 'Duration', key: 'days' }, { label: 'Listing visibility', key: 'visibility' },
  { label: 'Match notifications', key: 'matchNotifs' }, { label: 'Featured badge', key: 'badge', boolean: true },
  { label: 'Candidate shortlisting', key: 'shortlisting', boolean: true }, { label: 'Analytics access', key: 'analytics', boolean: true },
  { label: 'Support level', key: 'support' },
]
const FAQS = [
  { q: 'Can I upgrade my listing?', a: 'Yes - contact us to upgrade during the listing period. We\'ll apply the price difference to the higher tier.' },
  { q: 'What payment methods do you accept?', a: 'All major credit and debit cards via Stripe. We also accept Apple Pay and Google Pay.' },
  { q: 'Do you charge commission on permanent hires?', a: 'No, never. You pay for the listing, not the hire. Once you\'ve found your candidate, there are no additional fees.' },
  { q: 'Can I get a refund?', a: 'Contact support before publication if there is a payment problem. Under the Terms, fees are not automatically refundable once a listing or paid service has been published or started.' },
  { q: 'Do you offer bulk discounts?', a: 'Yes - contact us for volume pricing on multiple listings. We offer packages for hotel groups and multi-property employers.' },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  return (
    <div className="public-page">
      <Navbar />
      <main className="pt-[60px]">
        <section className="public-hero py-16 md:py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="public-eyebrow mb-4">Pricing</p>
            <h1 className="public-title mb-4">Simple, transparent pricing.</h1>
            <p className="public-intro max-w-2xl mx-auto">No commission on permanent hires. No hidden fees. Choose the level of visibility and support you need.</p>
          </div>
        </section>

        <section className="py-14 px-6 bg-surface">
          <div className="max-w-5xl mx-auto">
            <div className="public-panel p-8 md:p-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                <div>
                  <p className="public-eyebrow mb-2">For Therapists & Professionals</p>
                  <h2 className="text-[28px] font-semibold text-ink mb-2">Free to join</h2>
                  <p className="text-[14px] text-secondary mb-4">Create your profile, get matched and apply for roles - always free.</p>
                  <div className="rounded-xl p-4 bg-[#FDF6EC] border border-accent/25"><p className="text-[13px] font-semibold text-ink mb-1">Go Featured - £10/month</p><p className="text-[12px] text-secondary">Priority visibility, featured badge and placement at the top of relevant searches.</p></div>
                </div>
                <div className="text-center shrink-0"><p className="text-[48px] font-semibold text-ink">£0</p><p className="text-[13px] text-secondary mb-4">forever</p><div className="flex flex-col gap-2"><Link href="/register/talent" className="btn-primary text-center">Create Free Profile</Link><Link href="/talent/upgrade" className="btn-accent text-center">Go Featured</Link></div></div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-parchment border-y border-border">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10"><p className="public-eyebrow mb-3">For Employers</p><h2 className="text-[32px] md:text-[40px] font-semibold tracking-[-0.035em] text-ink">Job posting packages</h2></div>
            <div className="public-panel overflow-x-auto p-4 md:p-6">
              <table className="w-full min-w-[640px]">
                <thead><tr><th className="text-left py-4 pr-4 w-[180px]" />{TIERS.map(t => { const popular = 'popular' in t && t.popular; return <th key={t.name} className={`py-4 px-3 text-center relative rounded-t-xl ${popular ? 'bg-[#FDF6EC] border-x border-t border-accent/40' : ''}`}>{popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-semibold px-3 py-0.5 rounded-full text-white bg-accent">Most Popular</span>}<p className="text-[15px] font-semibold text-ink">{t.name}</p></th> })}</tr></thead>
                <tbody>
                  {ROWS.map(row => <tr key={row.key} className="border-b border-border"> <td className="py-3.5 pr-4 text-[13px] font-medium text-secondary">{row.label}</td>{TIERS.map(t => { const val = (t as any)[row.key]; const popular = 'popular' in t && t.popular; const displayVal = row.key === 'days' ? `${val} days` : val; return <td key={t.name} className={`py-3.5 px-3 text-center text-[13px] ${popular ? 'bg-[#FDF6EC] border-x border-accent/40' : ''}`}>{row.boolean ? (val ? <span className="text-ink">{val}</span> : <X size={14} className="inline text-muted" />) : <span className={row.key === 'display' ? 'text-[18px] font-semibold text-ink' : 'text-secondary'}>{displayVal}</span>}</td> })}</tr>)}
                  <tr><td className="py-5" />{TIERS.map(t => { const popular = 'popular' in t && t.popular; return <td key={t.name} className={`py-5 px-3 text-center ${popular ? 'bg-[#FDF6EC] border-x border-b border-accent/40 rounded-b-xl' : ''}`}><Link href="/employer/post-role" className={popular ? 'btn-accent inline-block' : 'btn-secondary inline-block'}>Post a Role</Link></td> })}</tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="py-14 px-6 bg-surface"><div className="max-w-5xl mx-auto"><div className="public-panel p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8"><div><p className="public-eyebrow mb-2">Agency & Temporary Staffing</p><h2 className="text-[24px] font-semibold text-ink mb-2">10% commission on confirmed bookings</h2><p className="text-[14px] text-secondary">No upfront cost. List your availability and only pay when a booking is confirmed through the platform.</p></div><Link href="/agency" className="btn-primary shrink-0">List Agency Shifts</Link></div></div></section>

        <section className="py-16 px-6 bg-parchment border-y border-border"><div className="max-w-3xl mx-auto"><div className="text-center mb-10"><p className="public-eyebrow mb-3">Questions</p><h2 className="text-[28px] font-semibold text-ink">Frequently Asked Questions</h2></div><div className="space-y-3">{FAQS.map((faq, i) => <div key={i} className="public-panel overflow-hidden"><button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface/70"><span className="text-[14px] font-semibold text-ink">{faq.q}</span><ChevronDown size={16} className={`transition-transform shrink-0 ml-4 text-secondary ${openFaq === i ? 'rotate-180' : ''}`} /></button>{openFaq === i && <div className="px-5 pb-4"><p className="text-[13px] leading-7 text-secondary">{faq.a}</p></div>}</div>)}</div></div></section>

        <section className="py-8 px-6 bg-surface"><div className="max-w-5xl mx-auto flex items-center justify-center gap-3"><Shield size={16} className="text-secondary" /><p className="text-[13px] text-secondary">Secure payments via Stripe. All data encrypted and GDPR compliant.</p></div></section>
      </main>
      <Footer />
    </div>
  )
}
