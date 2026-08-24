'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { X, ChevronDown, Shield, Check, BriefcaseBusiness, CalendarDays, MapPin, Sparkles } from 'lucide-react'
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
  { q: 'Is it free for Talent to join?', a: 'Yes. A professional can create a profile, browse roles, receive matches and apply for permanent opportunities without paying a membership fee.' },
  { q: 'Do you charge commission on permanent hires?', a: 'No. Employers pay for the job-listing package they choose. Spa Platform does not charge a percentage of the successful candidate’s salary.' },
  { q: 'How does Agency pricing work?', a: 'Professionals join the Agency register from £10 per month. When a property confirms a shift, the property pays the agreed professional cost plus a 10% Spa Platform fee. The agreed professional rate remains the amount recorded as due to the professional.' },
  { q: 'How does Residency pricing work?', a: 'Residency specialists join for £10 per month. Properties can browse and start protected conversations. When a Residency booking is confirmed, the property pays the agreed specialist amount plus a 10% Spa Platform fee.' },
  { q: 'What payment methods do you accept?', a: 'Online payments are processed securely through Stripe. Available payment methods can vary by device, country and checkout.' },
  { q: 'Can I upgrade a job listing?', a: 'Yes. Contact us if you want to increase visibility or support during the live listing period.' },
]

const talentPlans = [
  { eyebrow: 'Core career profile', title: 'Talent', price: '£0', cadence: 'forever', text: 'Build a professional profile, browse permanent roles, receive matches and apply.', bullets: ['Professional profile', 'Role matching', 'Applications and interviews', 'Messaging and reviews'], href: '/register/talent', cta: 'Create free profile', featured: false },
  { eyebrow: 'More visibility', title: 'Featured Talent', price: '£10', cadence: '/month', text: 'For professionals who want to appear more prominently to relevant employers.', bullets: ['Priority search visibility', 'Featured profile badge', 'Homepage feature opportunities', 'Employer newsletter visibility'], href: '/talent/upgrade', cta: 'Go Featured', featured: true },
  { eyebrow: 'Flexible work', title: 'Agency Register', price: '£10', cadence: '/month', text: 'Set your rate, travel radius and exact availability for flexible shift offers.', bullets: ['Searchable availability', 'Shift offers and counters', 'Booking records', 'Property reviews'], href: '/register?role=talent&redirect=/talent/agency/settings', cta: 'Join Agency', featured: false },
  { eyebrow: 'Specialist placements', title: 'Residency', price: '£10', cadence: '/month', text: 'For specialist professionals offering short-term programmes, residencies and expertise.', bullets: ['Protected public listing', 'Private property conversations', 'Structured offers', 'Booking and review history'], href: '/residency', cta: 'Explore Residency', featured: false },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  return (
    <div className="public-page">
      <Navbar />
      <main className="pt-[68px]">
        <section className="bg-[#0b2f4d] px-6 py-18 md:py-24 text-white">
          <div className="max-w-5xl mx-auto text-center">
            <p className="text-[10px] uppercase tracking-[.2em] font-semibold text-[#d4b477] mb-4">Pricing</p>
            <h1 className="text-[44px] md:text-[62px] leading-[1.01] tracking-[-.05em] font-semibold text-white mb-5">Choose what you need. Know what you pay.</h1>
            <p className="text-[15px] md:text-[17px] leading-7 text-white/68 max-w-3xl mx-auto">A free career profile at the centre, optional visibility and flexible-work memberships for professionals, and clear commercial pricing for properties.</p>
          </div>
        </section>

        <section className="py-16 px-6 bg-[#f4f1ea]">
          <div className="max-w-7xl mx-auto">
            <div className="mb-9 max-w-3xl"><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42]">For professionals</p><h2 className="text-[32px] md:text-[42px] tracking-[-.04em] font-semibold text-[#10283b] mt-2">Start free. Add only what helps your career.</h2><p className="text-[13px] leading-6 text-[#65727c] mt-3">Permanent recruitment remains free for Talent. Paid options are for extra visibility or participation in specialist marketplaces.</p></div>
            <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
              {talentPlans.map(plan => <article key={plan.title} className={`rounded-[22px] bg-white p-6 flex flex-col ${plan.featured ? 'border border-[#c9a96e] ring-1 ring-[#c9a96e]/20 shadow-lg' : 'border border-[#ddd9d1]'}`}>
                <div className="flex items-start justify-between gap-3"><div><p className="text-[9px] uppercase tracking-[.16em] font-semibold text-[#9c7a42]">{plan.eyebrow}</p><h3 className="text-[20px] font-semibold text-[#10283b] mt-2">{plan.title}</h3></div>{plan.featured && <Sparkles size={18} className="text-[#9c7a42]"/>}</div>
                <div className="mt-5"><span className="text-[34px] font-semibold text-[#10283b]">{plan.price}</span><span className="text-[12px] text-[#7a858c]">{plan.cadence}</span></div>
                <p className="text-[12px] leading-6 text-[#65727c] mt-4">{plan.text}</p>
                <div className="space-y-2 mt-5 mb-7">{plan.bullets.map(b => <div key={b} className="flex gap-2 text-[11px] text-[#53636f]"><Check size={13} className="text-[#9c7a42] shrink-0 mt-0.5"/>{b}</div>)}</div>
                <Link href={plan.href} className={`${plan.featured ? 'btn-accent' : 'btn-secondary'} mt-auto text-center`}>{plan.cta}</Link>
              </article>)}
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white border-y border-[#ddd9d1]">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[.8fr_1.2fr] gap-8 items-start">
              <div className="lg:sticky lg:top-24"><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42]">Flexible staffing & specialist bookings</p><h2 className="text-[32px] md:text-[42px] tracking-[-.04em] font-semibold text-[#10283b] mt-2">The property pays the platform fee.</h2><p className="text-[13px] leading-6 text-[#65727c] mt-4">For Agency and Residency bookings, the commercial split is shown before confirmation so both sides know what has been agreed.</p></div>
              <div className="grid md:grid-cols-2 gap-5">
                <div className="rounded-[22px] bg-[#f7f4ed] border border-[#ddd9d1] p-7"><CalendarDays size={20} className="text-[#9c7a42]"/><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#9c7a42] mt-5">Agency booking</p><h3 className="text-[24px] font-semibold text-[#10283b] mt-2">Agreed shift cost + 10%</h3><p className="text-[12px] leading-6 text-[#65727c] mt-3">Example: professional agrees £200 for the shift. Property checkout is £220. Spa Platform fee is £20 and £200 is recorded as due to the professional.</p><Link href="/agency/about" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#9c7a42] mt-5">How Agency works →</Link></div>
                <div className="rounded-[22px] bg-[#0b2f4d] p-7 text-white"><MapPin size={20} className="text-[#d4b477]"/><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#d4b477] mt-5">Residency booking</p><h3 className="text-[24px] font-semibold text-white mt-2">Agreed specialist fee + 10%</h3><p className="text-[12px] leading-6 text-white/65 mt-3">The property and specialist agree the Residency value first. The property then pays that agreed amount plus the Spa Platform booking fee.</p><Link href="/residency" className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#d4b477] mt-5">Explore Residency →</Link></div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16 px-6 bg-[#f4f1ea] border-b border-[#ddd9d1]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10"><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42] mb-3">For Employers</p><h2 className="text-[32px] md:text-[42px] font-semibold tracking-[-0.04em] text-[#10283b]">Permanent recruitment, without salary commission.</h2><p className="text-[13px] leading-6 text-[#65727c] max-w-2xl mx-auto mt-3">Choose the reach and support level for each role. Once you hire, there is no additional percentage fee on salary.</p></div>
            <div className="bg-white border border-[#ddd9d1] rounded-[22px] overflow-x-auto p-4 md:p-6">
              <table className="w-full min-w-[680px]">
                <thead><tr><th className="text-left py-4 pr-4 w-[180px]" />{TIERS.map(t => { const popular = 'popular' in t && t.popular; return <th key={t.name} className={`py-4 px-3 text-center relative rounded-t-xl ${popular ? 'bg-[#FDF6EC] border-x border-t border-accent/40' : ''}`}>{popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-semibold px-3 py-0.5 rounded-full text-white bg-accent">Most Popular</span>}<p className="text-[15px] font-semibold text-ink">{t.name}</p></th> })}</tr></thead>
                <tbody>
                  {ROWS.map(row => <tr key={row.key} className="border-b border-border"><td className="py-3.5 pr-4 text-[13px] font-medium text-secondary">{row.label}</td>{TIERS.map(t => { const val = (t as any)[row.key]; const popular = 'popular' in t && t.popular; const displayVal = row.key === 'days' ? `${val} days` : val; return <td key={t.name} className={`py-3.5 px-3 text-center text-[13px] ${popular ? 'bg-[#FDF6EC] border-x border-accent/40' : ''}`}>{row.boolean ? (val ? <span className="text-ink">{val}</span> : <X size={14} className="inline text-muted" />) : <span className={row.key === 'display' ? 'text-[18px] font-semibold text-ink' : 'text-secondary'}>{displayVal}</span>}</td> })}</tr>)}
                  <tr><td className="py-5" />{TIERS.map(t => { const popular = 'popular' in t && t.popular; return <td key={t.name} className={`py-5 px-3 text-center ${popular ? 'bg-[#FDF6EC] border-x border-b border-accent/40 rounded-b-xl' : ''}`}><Link href="/employer/post-role" className={popular ? 'btn-accent inline-block' : 'btn-secondary inline-block'}>Post a Role</Link></td> })}</tr>
                </tbody>
              </table>
            </div>

            <div className="mt-6 rounded-[22px] bg-[#10283b] text-white p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6"><div><p className="text-[10px] uppercase tracking-[.17em] text-[#d4b477] font-semibold">Preferred Employer</p><h3 className="text-[25px] font-semibold mt-2">£150/year</h3><p className="text-[12px] leading-6 text-white/65 mt-2 max-w-2xl">Annual registration for properties using Agency cover, with Preferred Employer status inside the flexible staffing workspace.</p></div><Link href="/employer/agency" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4b477] px-5 py-3 text-[12px] font-semibold text-[#0b2f4d] shrink-0">Agency for properties →</Link></div>
          </div>
        </section>

        <section className="py-16 px-6 bg-white"><div className="max-w-3xl mx-auto"><div className="text-center mb-10"><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42] mb-3">Questions</p><h2 className="text-[30px] font-semibold text-[#10283b]">Pricing without the small-print mystery.</h2></div><div className="space-y-3">{FAQS.map((faq, i) => <div key={i} className="rounded-2xl border border-[#ddd9d1] bg-white overflow-hidden"><button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#f7f4ed]"><span className="text-[14px] font-semibold text-[#10283b]">{faq.q}</span><ChevronDown size={16} className={`transition-transform shrink-0 ml-4 text-secondary ${openFaq === i ? 'rotate-180' : ''}`} /></button>{openFaq === i && <div className="px-5 pb-4"><p className="text-[13px] leading-7 text-secondary">{faq.a}</p></div>}</div>)}</div></div></section>

        <section className="py-8 px-6 bg-[#f4f1ea] border-t border-[#ddd9d1]"><div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-center gap-3 text-center"><Shield size={16} className="text-secondary" /><p className="text-[12px] text-secondary">Secure online payments through Stripe. Paid services are also subject to the platform Terms and relevant cancellation/refund rules.</p></div></section>
      </main>
      <Footer />
    </div>
  )
}
