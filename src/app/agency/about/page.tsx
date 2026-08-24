import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, Banknote, CalendarCheck, Clock3, MapPin, ShieldCheck, Sparkles, Users } from 'lucide-react'

export const revalidate = 3600

const benefits = [
  { icon: ShieldCheck, title: 'Verified professionals', text: 'Properties see approved professionals with the skills, experience and availability needed for the shift.' },
  { icon: CalendarCheck, title: 'Real availability', text: 'Professionals set the exact days and hours they can work, so properties can search for genuine cover.' },
  { icon: MapPin, title: 'Local first', text: 'Travel radius and location matching help properties find people who can realistically get to the shift.' },
  { icon: Banknote, title: 'Clear rates', text: 'Rates are agreed before confirmation, with property payment and payout records kept inside Spa Platform.' },
]

export default function PublicAgencyPage() {
  return (
    <div className="min-h-screen bg-[#f5f2eb]">
      <Navbar />

      <section className="pt-[68px] bg-[#0b2f4d] text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-28 grid lg:grid-cols-[1.1fr_.9fr] gap-12 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#d4b477] mb-5">Flexible hospitality staffing</p>
            <h1 className="text-[45px] md:text-[64px] font-semibold tracking-[-0.045em] leading-[.98] max-w-3xl">Need cover today? Or want to turn your availability into paid shifts?</h1>
            <p className="text-[16px] md:text-[18px] leading-8 text-white/68 max-w-2xl mt-7">Spa Platform connects verified wellness professionals with properties that need trusted flexible cover — from planned rota gaps to urgent same-day shifts.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-9">
              <Link href="/login?role=employer&redirect=/agency" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4b477] px-6 py-3.5 text-[13px] font-semibold text-[#0b2f4d] hover:bg-[#e0c48e] transition-colors">I need cover <ArrowRight size={14} /></Link>
              <Link href="/register?role=talent&redirect=/talent/agency/settings" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors">I want flexible shifts <ArrowRight size={14} /></Link>
            </div>
            <p className="text-[11px] text-white/45 mt-4">For spa and wellness at launch. Wider hospitality roles are coming next.</p>
          </div>

          <div className="bg-white text-[#10283b] rounded-[28px] p-7 md:p-9 shadow-2xl shadow-black/20">
            <div className="flex items-center justify-between gap-4 pb-6 border-b border-black/10">
              <div><p className="text-[10px] uppercase tracking-[.16em] text-[#9c7a42] font-semibold">Live shift logic</p><h2 className="text-[27px] font-semibold tracking-[-.03em] mt-1">Cover without the ringing round.</h2></div>
              <div className="h-12 w-12 rounded-2xl bg-[#f5efe2] flex items-center justify-center"><Sparkles size={21} className="text-[#9c7a42]" /></div>
            </div>
            <div className="space-y-5 mt-6">
              <div className="flex gap-4"><div className="h-9 w-9 rounded-full bg-[#0b2f4d] text-white flex items-center justify-center text-[12px] font-semibold shrink-0">1</div><div><p className="text-[14px] font-semibold">Tell us the shift</p><p className="text-[12px] text-black/55 leading-5 mt-1">Date, hours, location, rate and the skills you need.</p></div></div>
              <div className="flex gap-4"><div className="h-9 w-9 rounded-full bg-[#0b2f4d] text-white flex items-center justify-center text-[12px] font-semibold shrink-0">2</div><div><p className="text-[14px] font-semibold">Find genuine availability</p><p className="text-[12px] text-black/55 leading-5 mt-1">Search approved professionals whose confirmed hours and travel radius fit.</p></div></div>
              <div className="flex gap-4"><div className="h-9 w-9 rounded-full bg-[#0b2f4d] text-white flex items-center justify-center text-[12px] font-semibold shrink-0">3</div><div><p className="text-[14px] font-semibold">Offer, agree and confirm</p><p className="text-[12px] text-black/55 leading-5 mt-1">The professional can accept or counter. Once agreed, the property confirms the booking.</p></div></div>
            </div>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42]">Built for real operations</p>
          <h2 className="text-[34px] md:text-[45px] font-semibold tracking-[-.04em] leading-[1.05] text-[#10283b] mt-3">Flexible staffing should feel controlled, not chaotic.</h2>
        </div>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map(({ icon: Icon, title, text }) => <div key={title} className="bg-white border border-black/10 rounded-2xl p-6"><div className="h-10 w-10 rounded-xl bg-[#f5efe2] flex items-center justify-center mb-5"><Icon size={18} className="text-[#9c7a42]" /></div><h3 className="text-[15px] font-semibold text-[#10283b]">{title}</h3><p className="text-[12px] text-black/55 leading-6 mt-2">{text}</p></div>)}
        </div>
      </section>

      <section className="bg-white border-y border-black/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 grid lg:grid-cols-2 gap-6">
          <div className="rounded-[24px] bg-[#f7f3ea] border border-black/10 p-8 md:p-10">
            <Users size={22} className="text-[#9c7a42]" />
            <p className="text-[10px] uppercase tracking-[.16em] text-[#9c7a42] font-semibold mt-6">For professionals</p>
            <h2 className="text-[31px] font-semibold tracking-[-.035em] text-[#10283b] mt-2">Your free day can become a paid shift.</h2>
            <p className="text-[14px] text-black/58 leading-7 mt-4">Set your rate, travel radius and exact availability. Properties can find you when your hours genuinely fit what they need.</p>
            <div className="flex items-center gap-2 text-[12px] text-[#10283b] mt-6"><Clock3 size={14} className="text-[#9c7a42]" /> You stay in control of when you are available.</div>
            <Link href="/register?role=talent&redirect=/talent/agency/settings" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#0b2f4d] px-5 py-3 text-[12px] font-semibold text-white">Join the Agency register <ArrowRight size={13} /></Link>
          </div>
          <div className="rounded-[24px] bg-[#0b2f4d] p-8 md:p-10 text-white">
            <ShieldCheck size={22} className="text-[#d4b477]" />
            <p className="text-[10px] uppercase tracking-[.16em] text-[#d4b477] font-semibold mt-6">For properties</p>
            <h2 className="text-[31px] font-semibold tracking-[-.035em] mt-2">Find trusted cover when the rota changes.</h2>
            <p className="text-[14px] text-white/65 leading-7 mt-4">Search by date, time, location, skills, brands and rate. For urgent cover, Spa Platform can work through the nearest available matches automatically.</p>
            <div className="flex items-center gap-2 text-[12px] text-white/80 mt-6"><CalendarCheck size={14} className="text-[#d4b477]" /> Book from confirmed availability, not guesswork.</div>
            <Link href="/login?role=employer&redirect=/agency" className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#d4b477] px-5 py-3 text-[12px] font-semibold text-[#0b2f4d]">Find agency cover <ArrowRight size={13} /></Link>
          </div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-6 py-16 md:py-20 text-center">
        <p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42]">The next chapter</p>
        <h2 className="text-[34px] md:text-[45px] font-semibold tracking-[-.04em] text-[#10283b] mt-3">Built in spa. Expanding across hospitality.</h2>
        <p className="text-[14px] md:text-[15px] text-black/55 leading-7 max-w-3xl mx-auto mt-5">Front of House, Housekeeping and F&amp;B flexible staffing are part of the roadmap. Spa and wellness remains the launch vertical while the hospitality network grows.</p>
      </section>

      <Footer />
    </div>
  )
}
