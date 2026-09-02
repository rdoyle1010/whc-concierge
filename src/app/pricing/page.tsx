'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ChevronDown, Shield, Check, CalendarDays, MapPin, Sparkles, Building2, BriefcaseBusiness } from 'lucide-react'
import { JOB_TIERS, TALENT_MEMBERSHIPS, FEATURED_TALENT, EMPLOYER_MEMBERSHIPS, RESIDENCY_PRICING, AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'
import { DEFAULT_PUBLIC_PAGES_CONTENT, type PublicPageContent } from '@/lib/public-page-content'

const pounds = (pence: number) => `£${(pence / 100).toFixed(pence % 100 === 0 ? 0 : 2)}`

const talentPlans = [
  {
    eyebrow: 'Start here', title: 'Talent Free', price: '£0', cadence: 'forever', featured: false,
    text: 'A genuinely useful free account for spa and wellness professionals at every career level.',
    bullets: ['Professional profile and CV', 'Browse and apply for roles', 'Basic job-match percentage', 'Save and withdraw applications', '1 Interview Ready trial when joining', 'Academy at standard price'],
    href: '/register/talent', cta: 'Create free profile',
  },
  {
    eyebrow: 'Career development', title: 'Talent Standard', price: pounds(TALENT_MEMBERSHIPS.standard.price), cadence: '/month', featured: false,
    text: 'For professionals who want stronger job insights, better visibility and ongoing career support.',
    bullets: ['1 Interview Ready credit every month', 'Unused credits roll over up to 3', 'Detailed match insights', 'Enhanced CV and profile tools', 'Increased employer-search visibility', '10% off Academy courses'],
    href: '/talent/billing', cta: 'Choose Standard',
  },
  {
    eyebrow: 'Full career toolkit', title: 'Talent Pro', price: pounds(TALENT_MEMBERSHIPS.pro.price), cadence: '/month', featured: true,
    text: 'The strongest package for active jobseekers, senior candidates and professionals preparing for several opportunities.',
    bullets: ['10 Interview Ready credits every month', 'Unused credits roll over up to 20', 'Priority employer visibility', 'Advanced job-match intelligence', 'Role, company and brand research', '20% off Academy courses'],
    href: '/talent/billing', cta: 'Choose Pro',
  },
]

const FAQS = [
  { q: 'Is it free for Talent to join?', a: 'Yes. Talent Free is £0 and includes a professional profile, CV, role browsing, applications, basic matching and a first Interview Ready trial.' },
  { q: 'How much does Featured Talent cost?', a: `Featured Talent is ${pounds(FEATURED_TALENT.seven_days.price)} for 7 days or ${pounds(FEATURED_TALENT.thirty_days.price)} for 30 days. It is separate from membership so a professional can buy extra visibility only when they need it.` },
  { q: 'How does Agency pricing work?', a: `The professional keeps 100% of the agreed shift rate. The property pays the agreed shift value plus a ${Math.round(AGENCY_PLATFORM_FEE_PCT * 100)}% WHC platform fee.` },
  { q: 'Do you offer a recruitment service as well as job advertising?', a: 'Yes. Employers can advertise directly, or ask WHC to run the search. WHC Recruitment Service is typically 12.5% of first-year salary. Executive Search for senior leadership roles is typically 15–20%.' },
  { q: 'How does Residency pricing work?', a: `Specialists list themselves for £10/month. Properties browse and book for free - a 10% platform fee is added only when a booking is agreed and confirmed. Featured placement in the directory is arranged directly with WHC${RESIDENCY_PRICING.featured.price ? ` (guide ${pounds(RESIDENCY_PRICING.featured.price)})` : ''}.` },
  { q: 'How are payments handled?', a: 'Online payments are processed securely through Stripe. Paid services are subject to the relevant platform terms, cancellation and refund rules.' },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  const [cms, setCms] = useState<PublicPageContent>(DEFAULT_PUBLIC_PAGES_CONTENT.pages.pricing)

  useEffect(() => {
    const draft = new URLSearchParams(window.location.search).get('pagePreview') === 'draft' ? '&draft=1' : ''
    fetch(`/api/public/page-content?slug=pricing${draft}`).then(r => r.ok ? r.json() : null).then(data => { if (data?.page) setCms(data.page) }).catch(() => {})
  }, [])

  return <div className="public-page">
    <Navbar />
    <main id="main-content" className="pt-[76px]">
      <section className="bg-[#f1f1f1] text-ink">
        <div className="max-w-7xl mx-auto px-6 py-14 md:py-20 grid lg:grid-cols-[1fr_.85fr] gap-10 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[.2em] font-semibold text-body mb-4">{cms.hero.eyebrow || 'Simple, transparent pricing'}</p>
            <h1 className="text-[44px] md:text-[62px] leading-[1.01] tracking-[-.05em] font-semibold text-ink mb-5">{cms.hero.heading || 'Choose what you need. Pay for what creates value.'}</h1>
            <p className="text-[15px] md:text-[17px] leading-7 text-secondary max-w-3xl">{cms.hero.text || 'Free entry for Talent and Employers, clear paid upgrades, transparent Agency fees and specialist recruitment when you want WHC to do more.'}</p>
          </div>
          <div className="aspect-[4/3] overflow-hidden rounded-[26px]"><img decoding="async" src={cms.hero.image.url} alt={cms.hero.image.alt} className="w-full h-full object-cover" style={{objectPosition:`${cms.hero.image.focalX}% ${cms.hero.image.focalY}%`}}/></div>
        </div>
      </section>

      <section className="py-16 px-6 bg-[#f1f1f1]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-9"><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#1c1c1c]">Talent memberships</p><h2 className="text-[32px] md:text-[42px] tracking-[-.04em] font-semibold text-[#1c1c1c] mt-2">Build your career at your pace.</h2><p className="text-[13px] leading-6 text-[#555555] mt-3">Start free. Upgrade when you want deeper matching, more Interview Ready support and stronger employer visibility.</p></div>
          <div className="grid md:grid-cols-3 gap-5">{talentPlans.map(plan => <article key={plan.title} className={`rounded-[22px] bg-white p-6 flex flex-col ${plan.featured?'border-2 border-accent':'border border-[#dddddd]'}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[9px] uppercase tracking-[.16em] font-semibold text-[#1c1c1c]">{plan.eyebrow}</p><h3 className="text-[20px] font-semibold text-[#1c1c1c] mt-2">{plan.title}</h3></div>{plan.featured&&<Sparkles size={18} className="text-[#1c1c1c]"/>}</div><div className="mt-5"><span className="text-[34px] font-semibold text-[#1c1c1c]">{plan.price}</span><span className="text-[12px] text-[#6b6b6b]">{plan.cadence}</span></div><p className="text-[12px] leading-6 text-[#555555] mt-4">{plan.text}</p><div className="space-y-2 mt-5 mb-7">{plan.bullets.map(b=><div key={b} className="flex gap-2 text-[11px] text-[#555555]"><Check size={13} className="text-[#1c1c1c] shrink-0 mt-0.5"/>{b}</div>)}</div><Link href={plan.href} className={`${plan.featured?'btn-accent':'btn-secondary'} mt-auto text-center`}>{plan.cta}</Link></article>)}</div>

          <div className="mt-6 rounded-[22px] bg-[#1c1c1c] text-white p-6 md:p-8 grid md:grid-cols-[1fr_auto] gap-6 items-center">
            <div><p className="text-[9px] uppercase tracking-[.16em] font-semibold text-white/70">Extra visibility when you need it</p><h3 className="text-[25px] font-semibold text-white mt-2">Featured Talent</h3><p className="text-[12px] leading-6 text-white/65 mt-2">Priority visibility in employer searches, recommendation areas and selected employer communications, clearly labelled. Featuring never changes matching.</p></div>
            <div className="flex flex-col sm:flex-row gap-3"><div className="rounded-xl bg-white/10 px-5 py-4 text-center"><p className="text-[24px] font-semibold">{pounds(FEATURED_TALENT.seven_days.price)}</p><p className="text-[11px] text-white/60">7 days</p></div><div className="rounded-xl bg-white/10 px-5 py-4 text-center"><p className="text-[24px] font-semibold">{pounds(FEATURED_TALENT.thirty_days.price)}</p><p className="text-[11px] text-white/60">30 days</p></div></div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white border-y border-[#dddddd]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-9"><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#1c1c1c]">Flexible work & specialist placements</p><h2 className="text-[32px] md:text-[42px] tracking-[-.04em] font-semibold text-[#1c1c1c] mt-2">The professional keeps the agreed rate.</h2><p className="text-[13px] leading-6 text-[#555555] mt-3">WHC adds its platform fee to the property side, so the rate a professional agrees is the rate they earn.</p></div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-[22px] bg-[#f1f1f1] border border-[#dddddd] p-7"><CalendarDays size={20} className="text-[#1c1c1c]"/><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#1c1c1c] mt-5">Agency booking</p><h3 className="text-[26px] font-semibold text-[#1c1c1c] mt-2">Agreed shift value + {Math.round(AGENCY_PLATFORM_FEE_PCT * 100)}%</h3><p className="text-[12px] leading-6 text-[#555555] mt-3">Example: £20/hour × 10 hours = £200 to the professional. WHC fee £30. Property total £230.</p><p className="text-[11px] font-semibold text-[#1c1c1c] mt-4">The rate you see is the rate you earn.</p></div>
            <div className="rounded-[22px] bg-[#1c1c1c] p-7 text-white"><MapPin size={20} className="text-white/70"/><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-white/70 mt-5">Residency listings</p><h3 className="text-[26px] font-semibold text-white mt-2">Free to book · 10% on confirmation</h3><p className="text-[12px] leading-6 text-white/65 mt-3">Browse verified residency specialists free. Pay only when a booking is agreed and confirmed - a 10% platform fee protects both sides. Specialists list for £10/month.</p></div>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-[#f1f1f1] border-b border-[#dddddd]">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl mb-9"><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#1c1c1c]">Employer pricing</p><h2 className="text-[32px] md:text-[42px] tracking-[-.04em] font-semibold text-[#1c1c1c] mt-2">Advertise once or build an ongoing hiring partnership.</h2><p className="text-[13px] leading-6 text-[#555555] mt-3">Employers can start free, buy individual job listings or choose an annual membership for regular recruitment.</p></div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            <article className="rounded-[22px] bg-white border border-[#dddddd] p-6"><BriefcaseBusiness size={19} className="text-[#1c1c1c]"/><p className="text-[9px] uppercase tracking-[.16em] font-semibold text-[#1c1c1c] mt-5">Job advertising</p><h3 className="text-[20px] font-semibold text-[#1c1c1c] mt-2">Standard Job</h3><p className="text-[31px] font-semibold text-[#1c1c1c] mt-4">{JOB_TIERS.Bronze.display}</p><p className="text-[11px] text-[#555555] mt-2">30 days · matching · applications · shortlist · filled-role notifications</p></article>
            <article className="rounded-[22px] bg-white border-2 border-accent p-6"><Sparkles size={19} className="text-[#1c1c1c]"/><p className="text-[9px] uppercase tracking-[.16em] font-semibold text-[#1c1c1c] mt-5">More visibility</p><h3 className="text-[20px] font-semibold text-[#1c1c1c] mt-2">Featured Job</h3><p className="text-[31px] font-semibold text-[#1c1c1c] mt-4">{JOB_TIERS.Platinum.display}</p><p className="text-[11px] text-[#555555] mt-2">30 days · priority placement · featured badge · talent email · enhanced branding</p></article>
            <article className="rounded-[22px] bg-white border border-[#dddddd] p-6"><Building2 size={19} className="text-[#1c1c1c]"/><p className="text-[9px] uppercase tracking-[.16em] font-semibold text-[#1c1c1c] mt-5">Annual membership</p><h3 className="text-[20px] font-semibold text-[#1c1c1c] mt-2">Employer Pro</h3><p className="text-[31px] font-semibold text-[#1c1c1c] mt-4">{pounds(EMPLOYER_MEMBERSHIPS.pro.price)}<span className="text-[12px] text-[#6b6b6b] font-normal">/year</span></p><p className="text-[11px] text-[#555555] mt-2">Full talent search, analytics, shortlisting, Property Fact Files and {pounds(EMPLOYER_MEMBERSHIPS.pro.discountedStandardJobPrice)} Standard Jobs.</p></article>
            <article className="rounded-[22px] bg-[#1c1c1c] text-white p-6"><Building2 size={19} className="text-white/70"/><p className="text-[9px] uppercase tracking-[.16em] font-semibold text-white/70 mt-5">Groups & regular recruiters</p><h3 className="text-[20px] font-semibold text-white mt-2">Employer Group</h3><p className="text-[31px] font-semibold mt-4">{pounds(EMPLOYER_MEMBERSHIPS.group.price)}<span className="text-[12px] text-white/55 font-normal">/year</span></p><p className="text-[11px] text-white/60 mt-2">Up to 20 job listings per year, multiple properties, multiple hiring managers and advanced talent access.</p></article>
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white border-b border-[#dddddd]">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-5">
          <div className="rounded-[22px] border border-[#dddddd] p-7"><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#1c1c1c]">WHC Recruitment Service</p><h3 className="text-[28px] font-semibold text-[#1c1c1c] mt-2">12.5% of first-year salary</h3><p className="text-[12px] leading-6 text-[#555555] mt-3">WHC takes the vacancy brief, searches the platform and wider network, pre-screens candidates and delivers a shortlist, with a replacement guarantee on every placement.</p></div>
          <div className="rounded-[22px] bg-[#f1f1f1] border border-[#dddddd] p-7"><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#1c1c1c]">Executive Search</p><h3 className="text-[28px] font-semibold text-[#1c1c1c] mt-2">15–20% of first-year salary</h3><p className="text-[12px] leading-6 text-[#555555] mt-3">For Director of Spa, Wellness Director, Regional leadership, Group Spa Director and other senior confidential searches.</p></div>
        </div>
      </section>

      <section className="py-16 px-6 bg-[#f1f1f1] border-b border-[#dddddd]">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-5">
          <div className="rounded-[22px] bg-white border border-[#dddddd] p-6"><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#1c1c1c]">Academy</p><h3 className="text-[22px] font-semibold text-[#1c1c1c] mt-2">£29–£199+</h3><p className="text-[12px] text-[#555555] mt-3">Free members pay standard price. Standard members receive 10% off. Pro members receive 20% off.</p></div>
          <div className="rounded-[22px] bg-white border border-[#dddddd] p-6"><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#1c1c1c]">Brand exposure</p><h3 className="text-[22px] font-semibold text-[#1c1c1c] mt-2">From £295</h3><p className="text-[12px] text-[#555555] mt-3">Brand Spotlight £295, Industry Feature £495 and Partner Campaigns from £995.</p></div>
          <div className="rounded-[22px] bg-white border border-[#dddddd] p-6"><p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#1c1c1c]">Employer profile</p><h3 className="text-[22px] font-semibold text-[#1c1c1c] mt-2">Free to start</h3><p className="text-[12px] text-[#555555] mt-3">Create your property profile, add photographs and information, receive applications and build employer reputation.</p></div>
        </div>
      </section>

      <section className="py-16 px-6 bg-white"><div className="max-w-3xl mx-auto"><div className="text-center mb-10"><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#1c1c1c] mb-3">Questions</p><h2 className="text-[30px] font-semibold text-[#1c1c1c]">Pricing without the small-print mystery.</h2></div><div className="space-y-3">{FAQS.map((faq,i)=><div key={i} className="rounded-2xl border border-[#dddddd] bg-white overflow-hidden"><button type="button" onClick={()=>setOpenFaq(openFaq===i?null:i)} className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-[#f1f1f1]"><span className="text-[14px] font-semibold text-[#1c1c1c]">{faq.q}</span><ChevronDown size={16} className={`transition-transform ${openFaq===i?'rotate-180':''}`}/></button>{openFaq===i&&<div className="px-5 pb-4"><p className="text-[13px] leading-7 text-secondary">{faq.a}</p></div>}</div>)}</div></div></section>
      <section className="py-8 px-6 bg-[#f1f1f1] border-t border-[#dddddd]"><div className="max-w-5xl mx-auto flex items-center justify-center gap-3 text-center"><Shield size={16} className="text-secondary"/><p className="text-[12px] text-secondary">Secure online payments through Stripe. Paid services are subject to the platform Terms and relevant cancellation/refund rules.</p></div></section>
    </main>
    <Footer />
  </div>
}
