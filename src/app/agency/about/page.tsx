import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, Banknote, CalendarCheck, CheckCircle2, Clock3, MapPin, Search, ShieldCheck, UserRoundCheck } from 'lucide-react'
import { getPublicPageContent } from '@/lib/public-page-content-server'

export const revalidate = 3600

const benefits = [
  { icon: ShieldCheck, title: 'Verified professionals', text: 'See approved professionals with skills, experience and availability relevant to the shift.' },
  { icon: CalendarCheck, title: 'Real availability', text: 'Professionals choose the exact days and hours they can work before they appear as available.' },
  { icon: MapPin, title: 'Location that makes sense', text: 'Search by postcode and travel radius so you find people who can realistically get to the property.' },
  { icon: Banknote, title: 'Clear rates', text: 'Rates and platform fees are shown before confirmation, so there are no surprises.' },
]

const employerSteps = [
  { icon: Clock3, title: '1. Enter the shift', text: 'Choose the date, start time, finish time and location.' },
  { icon: Search, title: '2. See suitable professionals', text: 'Filter by treatments, skills, brands, rate, distance and confirmed availability.' },
  { icon: UserRoundCheck, title: '3. Review the real profile', text: 'See experience, verification, insurance status, ratings and treatment skills.' },
  { icon: CheckCircle2, title: '4. Make an offer', text: 'Send the shift to the professional. Nothing is booked until it is accepted.' },
]

const professionalSteps = [
  { title: '1. Set when you are free', text: 'Add the exact days and hours you want to make available for agency work.' },
  { title: '2. Set your rate and travel area', text: 'Choose your hourly rate, travel radius and the treatments you are happy to perform.' },
  { title: '3. Properties find you for matching shifts', text: 'You only appear for work that fits the availability and location information you have provided.' },
  { title: '4. You decide what to accept', text: 'Review the property, hours, work and pay before choosing whether the shift is right for you.' },
]

function EmployerDemoCard() {
  return <div className="relative rounded-[28px] border border-border bg-white p-6 shadow-[0_20px_60px_rgba(16,40,59,.10)]">
    <span className="absolute -top-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#10283b] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white">Sample - for illustration</span>
    <div className="mb-5 flex items-center justify-between"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#10283b]">Example employer search</p><h3 className="mt-1 text-[22px] font-semibold text-[#10283b]">Need a therapist tomorrow</h3></div><span className="rounded-full bg-[#edf8f0] px-3 py-1 text-[10px] font-semibold text-[#287548]">3 available</span></div>
    <div className="grid grid-cols-3 gap-2 rounded-2xl bg-[#f5f6f8] p-4 text-[11px] text-[#5a6a76]"><div><p className="mb-1 text-[9px] uppercase tracking-wide text-secondary">Date</p><p className="font-semibold text-[#10283b]">Saturday 29 Aug</p></div><div><p className="mb-1 text-[9px] uppercase tracking-wide text-secondary">Hours</p><p className="font-semibold text-[#10283b]">10:00–18:00</p></div><div><p className="mb-1 text-[9px] uppercase tracking-wide text-secondary">Need</p><p className="font-semibold text-[#10283b]">Massage + facial</p></div></div>
    <div className="mt-4 rounded-2xl border border-border p-4"><div className="flex items-start gap-3"><div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#f5f6f8] font-semibold text-[#0b2f4d]">AM</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-semibold text-[#10283b]">Amelia M.</p><span className="rounded-full bg-[#edf8f0] px-2 py-1 text-[9px] font-semibold text-[#287548]">WHC VERIFIED</span></div><p className="mt-1 text-[12px] text-secondary">Senior Spa Therapist · 6 years experience</p></div></div><div className="mt-4 flex flex-wrap gap-1.5">{['Deep Tissue','Elemis Facial','Hot Stone'].map(x=><span key={x} className="rounded-full bg-[#f5f6f8] px-2.5 py-1 text-[10px] text-[#5a6a76]">{x}</span>)}</div><div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-black/5 pt-4"><div><p className="text-[11px] font-semibold text-[#287548]">Available 10:00–18:00</p><p className="mt-1 text-[10px] text-secondary">7 miles away · Insurance status shown</p></div><p className="text-[17px] font-semibold text-[#10283b]">£24/hr</p></div><button type="button" className="mt-4 w-full rounded-xl bg-[#0b2f4d] py-3 text-[12px] font-semibold text-white">View profile & make an offer</button></div>
  </div>
}

function ProfessionalDemoCard() {
  return <div className="rounded-[28px] border border-white/15 bg-white/[.07] p-6  backdrop-blur-sm">
    <p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#5a6a76]">Example professional settings</p><h3 className="mt-2 text-[22px] font-semibold text-white">I want flexible shifts</h3>
    <div className="mt-5 space-y-3">{[
      ['Availability','Saturday 10:00–18:00'],
      ['Hourly rate','£24 per hour'],
      ['Travel radius','Up to 25 miles'],
      ['Treatments','Massage · Facials · Hot Stone'],
    ].map(([k,v])=><div key={k} className="flex items-center justify-between gap-4 rounded-xl border border-white/10 bg-white/[.06] px-4 py-3"><span className="text-[11px] text-white/50">{k}</span><span className="text-right text-[12px] font-semibold text-white">{v}</span></div>)}</div>
    <div className="mt-5 border border-border bg-surface p-4 text-ink"><p className="text-[10px] font-semibold uppercase tracking-[.14em]">You stay in control</p><p className="mt-1 text-[12px] leading-5">Properties can find you when a shift fits what you have made available. You decide whether to accept it.</p></div>
  </div>
}

export default async function PublicAgencyPage({ searchParams }: { searchParams?: Promise<Record<string,string|string[]|undefined>> }) {
  const params = searchParams ? await searchParams : {}
  const cms = await getPublicPageContent('agency', params?.pagePreview === 'draft')
  return <div className="min-h-screen bg-[#f5f6f8]">
    <Navbar />
    <section className="overflow-hidden bg-[#0b2f4d] pt-[76px] text-white"><div className="mx-auto grid max-w-7xl items-center gap-10 px-6 py-16 md:py-24 lg:grid-cols-[1fr_.9fr] lg:px-8"><div><p className="mb-5 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">{cms.hero.eyebrow}</p><h1 className="max-w-3xl text-[45px] font-semibold leading-[.98] tracking-[-0.045em] text-white md:text-[64px]">{cms.hero.heading}</h1><p className="mt-7 max-w-2xl text-[16px] leading-8 text-white/68 md:text-[18px]">{cms.hero.text}</p><div className="mt-9 flex flex-col gap-3 sm:flex-row"><Link href="/login?role=employer&redirect=/agency" className="inline-flex items-center justify-center gap-2 bg-white px-6 py-3.5 text-[13px] font-semibold text-[#0b2f4d]">I need cover <ArrowRight size={14}/></Link><Link href="/register/talent?redirect=%2Ftalent%2Fagency%2Fsettings" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-[13px] font-semibold text-white">I want flexible shifts <ArrowRight size={14}/></Link></div></div><div className="aspect-[4/5] overflow-hidden rounded-[28px] md:aspect-[5/4]"><img src={cms.hero.image.url} alt={cms.hero.image.alt} className="h-full w-full object-cover" style={{objectPosition:`${cms.hero.image.focalX}% ${cms.hero.image.focalY}%`}}/></div></div></section>

    <section className="bg-white border-b border-border"><div className="mx-auto max-w-7xl px-6 py-16 lg:px-8"><div className="mx-auto mb-10 max-w-3xl text-center"><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#10283b]">Choose your side</p><h2 className="mt-3 text-[34px] font-semibold tracking-[-.04em] text-[#10283b] md:text-[46px]">Two simple journeys.</h2><p className="mt-4 text-[14px] leading-7 text-secondary">The same platform works differently depending on what you need. Employers search a real shift. Professionals set the hours they want to work.</p></div><div className="grid gap-5 lg:grid-cols-2"><Link href="/login?role=employer&redirect=/agency" className="group rounded-[24px] border border-border bg-[#f5f6f8] p-7 transition hover:border-accent"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#10283b]">For hotels & spas</p><h3 className="mt-2 text-[27px] font-semibold text-[#10283b]">I need cover.</h3><p className="mt-3 max-w-xl text-[13px] leading-6 text-secondary">Enter the exact shift you need covered. See professionals who fit the hours, location and treatments. Review their real profile and make an offer.</p><span className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold text-[#0b2f4d]">Find available professionals <ArrowRight size={13} className="transition group-hover:translate-x-1"/></span></Link><Link href="/register/talent?redirect=%2Ftalent%2Fagency%2Fsettings" className="group rounded-[24px] bg-[#0b2f4d] p-7 text-white transition hover:border-accent"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#5a6a76]">For professionals</p><h3 className="mt-2 text-[27px] font-semibold text-white">I want flexible work.</h3><p className="mt-3 max-w-xl text-[13px] leading-6 text-white/65">Tell us when you are free, how far you will travel, what treatments you perform and your hourly rate. You choose what you accept.</p><span className="mt-6 inline-flex items-center gap-2 text-[12px] font-semibold text-[#5a6a76]">Set my agency availability <ArrowRight size={13} className="transition group-hover:translate-x-1"/></span></Link></div></div></section>

    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8"><div className="grid gap-12 lg:grid-cols-[.85fr_1.15fr] lg:items-center"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#10283b]">{cms.blocks[0].eyebrow}</p><h2 className="mt-3 text-[34px] font-semibold leading-[1.04] tracking-[-.04em] text-[#10283b] md:text-[45px]">{cms.blocks[0].heading}</h2><p className="mt-4 text-[13px] leading-6 text-secondary">{cms.blocks[0].text}</p><div className="mt-7 space-y-4">{employerSteps.map(({icon:Icon,title,text})=><div key={title} className="flex gap-3"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#f5f6f8]"><Icon size={16} className="text-[#10283b]"/></div><div><p className="text-[13px] font-semibold text-[#10283b]">{title}</p><p className="mt-1 text-[12px] leading-5 text-secondary">{text}</p></div></div>)}</div></div><EmployerDemoCard/></div></section>

    <section className="bg-[#0b2f4d] text-white"><div className="mx-auto grid max-w-7xl gap-12 px-6 py-16 lg:grid-cols-[1.1fr_.9fr] lg:items-center lg:px-8"><ProfessionalDemoCard/><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-white/70">{cms.blocks[1].eyebrow}</p><h2 className="mt-3 text-[34px] font-semibold leading-[1.04] tracking-[-.04em] text-white md:text-[45px]">{cms.blocks[1].heading}</h2><p className="mt-4 text-[13px] leading-6 text-white/60">{cms.blocks[1].text}</p><div className="mt-7 space-y-4">{professionalSteps.map(step=><div key={step.title} className="border-b border-white/10 pb-4"><p className="text-[13px] font-semibold text-white">{step.title}</p><p className="mt-1 text-[12px] leading-5 text-white/50">{step.text}</p></div>)}</div></div></div></section>

    <section className="mx-auto max-w-7xl px-6 py-16 lg:px-8"><div className="grid items-start gap-8 lg:grid-cols-[.75fr_1.25fr]"><div><p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#10283b]">Why it works</p><h2 className="mt-3 text-[34px] font-semibold leading-[1.05] tracking-[-.04em] text-[#10283b] md:text-[45px]">Enough information to make a real decision.</h2><p className="mt-4 text-[13px] leading-6 text-secondary">The platform is designed to remove the things that make temporary spa staffing difficult: uncertain availability, unclear rates, unfamiliar qualifications and too little information about the professional.</p></div><div className="grid gap-4 md:grid-cols-2">{benefits.map(({icon:Icon,title,text})=><div key={title} className="rounded-2xl border border-border bg-white p-6"><div className="mb-5 flex h-10 w-10 items-center justify-center rounded-xl bg-[#f5f6f8]"><Icon size={18} className="text-[#10283b]"/></div><h3 className="text-[15px] font-semibold text-[#10283b]">{title}</h3><p className="mt-2 text-[12px] leading-6 text-secondary">{text}</p></div>)}</div></div></section>

    <section className="border-y border-border bg-white"><div className="mx-auto grid max-w-7xl items-center gap-8 px-6 py-16 lg:grid-cols-2 lg:px-8"><div><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-[#10283b]">{cms.blocks[2].eyebrow}</p><h2 className="mt-3 text-[32px] font-semibold tracking-[-.04em] text-[#10283b] md:text-[42px]">{cms.blocks[2].heading}</h2><p className="mt-4 text-[14px] leading-7 text-black/58">{cms.blocks[2].text}</p></div><div className="aspect-[4/3] overflow-hidden rounded-[24px]"><img src={cms.blocks[2].image.url} alt={cms.blocks[2].image.alt} className="h-full w-full object-cover" style={{objectPosition:`${cms.blocks[2].image.focalX}% ${cms.blocks[2].image.focalY}%`}}/></div></div></section>

    <Footer />
  </div>
}