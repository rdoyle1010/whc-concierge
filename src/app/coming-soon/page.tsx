import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { ArrowRight, BrainCircuit, BriefcaseBusiness, Building2, CheckCircle2, ClipboardCheck, MessageSquareText, ShieldCheck, Sparkles, UsersRound } from 'lucide-react'

export const revalidate = 3600

const styles = [
  { name: 'Driver', text: 'Decisive, ambitious and commercially focused.' },
  { name: 'Connector', text: 'People-focused, expressive and relationship-led.' },
  { name: 'Planner', text: 'Structured, considered and dependable.' },
  { name: 'Explorer', text: 'Curious, adaptive and creative.' },
]

export default function ComingSoonPage() {
  return (
    <div className="min-h-screen bg-[#f4f1ea]">
      <Navbar />
      <main className="pt-[72px]">
        <section className="bg-[#0b2f4d] text-white">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 md:py-28 grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#d4b477] font-semibold mb-4">Coming next</p>
              <h1 className="text-[44px] md:text-[64px] leading-[1.01] tracking-[-0.05em] font-semibold text-white max-w-4xl">Spa Platform is only the beginning.</h1>
              <p className="text-[16px] md:text-[18px] leading-8 text-white/68 max-w-2xl mt-6">We are building the talent, flexible staffing and career-confidence platform for hospitality — starting with spa and wellness, then expanding into the departments every great property depends on.</p>
              <div className="flex flex-col sm:flex-row gap-3 mt-8">
                <Link href="/register/talent" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#d4b477] px-6 py-3.5 text-[13px] font-semibold text-[#0b2f4d]">Join as Talent <ArrowRight size={14} /></Link>
                <Link href="/contact" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-[13px] font-semibold text-white">Talk to WHC <ArrowRight size={14} /></Link>
              </div>
            </div>

            <div className="rounded-[28px] bg-white text-[#10283b] p-7 md:p-9 shadow-2xl shadow-black/20">
              <p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#9c7a42]">The roadmap</p>
              <h2 className="text-[29px] font-semibold tracking-[-.035em] mt-2">One hospitality career ecosystem.</h2>
              <div className="space-y-5 mt-7">
                {[
                  [BriefcaseBusiness, 'Hospitality Jobs', 'Permanent roles across Front of House, Housekeeping, F&B and more.'],
                  [UsersRound, 'Hospitality Agency', 'Verified flexible professionals available when properties need cover.'],
                  [BrainCircuit, 'AI Interview & Confidence Coach', 'Prepare for the role, practise the interview and walk in knowing what you want to say.'],
                  [ClipboardCheck, 'Property Arrival Packs', 'Everything Agency and Residency professionals need before they step through the staff entrance.'],
                ].map(([Icon, title, text]: any) => <div key={title} className="flex gap-4"><div className="h-10 w-10 rounded-xl bg-[#f5efe2] flex items-center justify-center shrink-0"><Icon size={18} className="text-[#9c7a42]" /></div><div><p className="text-[14px] font-semibold">{title}</p><p className="text-[12px] leading-5 text-black/55 mt-1">{text}</p></div></div>)}
              </div>
            </div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">
          <div className="grid lg:grid-cols-[.78fr_1.22fr] gap-8 items-start">
            <div className="lg:sticky lg:top-28">
              <p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42]">AI Interview & Confidence Coach</p>
              <h2 className="text-[36px] md:text-[48px] font-semibold tracking-[-.045em] leading-[1.03] text-[#10283b] mt-3">Not an answer machine. A confidence builder.</h2>
              <p className="text-[14px] leading-7 text-[#65727c] mt-5">The aim is not to write robotic answers for people. It is to help them understand themselves, pull stronger evidence from their own experience and practise until they can answer with confidence.</p>
            </div>

            <div className="space-y-5">
              <div className="rounded-[24px] bg-white border border-[#ddd9d1] p-7 md:p-8">
                <div className="flex items-start justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[.16em] text-[#9c7a42] font-semibold">Working title</p><h3 className="text-[28px] font-semibold text-[#10283b] mt-2">Interview Ready</h3></div><Sparkles size={20} className="text-[#9c7a42]" /></div>
                <p className="text-[13px] leading-6 text-[#65727c] mt-4">Built from the professional's CV, profile, experience, skills, target role, job description and working-style assessment.</p>
              </div>

              <div className="rounded-[24px] bg-[#10283b] text-white p-7 md:p-8">
                <p className="text-[10px] uppercase tracking-[.16em] text-[#d4b477] font-semibold">Get to know yourself</p>
                <h3 className="text-[28px] font-semibold text-white mt-2">A language for how you naturally work.</h3>
                <p className="text-[12px] leading-6 text-white/62 mt-3">We will develop our own proprietary behavioural framework rather than copying an existing colour model.</p>
                <div className="grid sm:grid-cols-2 gap-3 mt-6">
                  {styles.map(style => <div key={style.name} className="border border-white/12 bg-white/5 rounded-xl p-4"><p className="text-[14px] font-semibold text-white">{style.name}</p><p className="text-[11px] leading-5 text-white/60 mt-1">{style.text}</p></div>)}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-5">
                <div className="rounded-[22px] bg-white border border-[#ddd9d1] p-6">
                  <MessageSquareText size={19} className="text-[#9c7a42]" />
                  <h3 className="text-[20px] font-semibold text-[#10283b] mt-5">Get interview ready</h3>
                  <div className="space-y-2 mt-4">
                    {['Likely questions for this exact role','STAR examples pulled from their own CV','Questions to ask the employer','Weakness, salary and confidence preparation','Leadership, commercial and guest-experience questions'].map(item => <div key={item} className="flex gap-2 text-[11px] leading-5 text-[#65727c]"><CheckCircle2 size={13} className="text-[#9c7a42] shrink-0 mt-1" />{item}</div>)}
                  </div>
                </div>
                <div className="rounded-[22px] bg-white border border-[#ddd9d1] p-6">
                  <BrainCircuit size={19} className="text-[#9c7a42]" />
                  <h3 className="text-[20px] font-semibold text-[#10283b] mt-5">Practice interview</h3>
                  <p className="text-[11px] leading-5 text-[#65727c] mt-4">AI asks one question at a time, reviews the answer and coaches the professional to make it stronger.</p>
                  <div className="mt-5 rounded-xl bg-[#f7f4ed] border border-[#e6e0d5] p-4 space-y-3 text-[11px] leading-5">
                    <p><strong className="text-[#10283b]">Strong:</strong> clear commercial example.</p>
                    <p><strong className="text-[#10283b]">Improve:</strong> you explained what you did, but not the measurable result.</p>
                    <p><strong className="text-[#10283b]">Try again:</strong> add the revenue, team or guest outcome.</p>
                  </div>
                </div>
              </div>

              <div className="rounded-[24px] bg-[#f0e6d3] border border-[#d8c39c] p-7 md:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div><p className="text-[10px] uppercase tracking-[.16em] text-[#8b6c38] font-semibold">Eventually</p><h3 className="text-[28px] font-semibold text-[#10283b] mt-2">Interview Readiness Score: 82%</h3><p className="text-[12px] leading-6 text-[#5d6570] mt-2">You're ready. Focus your final preparation on commercial examples and handling conflict questions.</p></div>
                <ShieldCheck size={34} className="text-[#9c7a42] shrink-0" />
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white border-y border-[#ddd9d1]">
          <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">
            <p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42]">Hospitality expansion</p>
            <h2 className="text-[36px] md:text-[48px] font-semibold tracking-[-.045em] text-[#10283b] mt-3 max-w-4xl">From spa into the departments that make hospitality work.</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-9">
              {['Front of House','Housekeeping','Food & Beverage','Guest Experience'].map((item, index) => <div key={item} className="rounded-[20px] border border-[#ddd9d1] p-6 bg-[#faf8f3]"><p className="text-[10px] uppercase tracking-[.14em] text-[#9c7a42] font-semibold">0{index + 1}</p><h3 className="text-[19px] font-semibold text-[#10283b] mt-4">{item}</h3><p className="text-[11px] leading-5 text-[#65727c] mt-2">Permanent jobs and flexible Agency staffing. Coming after the spa and wellness launch.</p></div>)}
            </div>
            <div className="mt-6 rounded-[20px] bg-[#10283b] text-white p-6 md:p-7 flex gap-4 items-start"><Building2 size={21} className="text-[#d4b477] shrink-0 mt-1" /><div><p className="text-[14px] font-semibold">Residency stays specialist.</p><p className="text-[12px] leading-6 text-white/62 mt-1">Residency will remain focused on visiting specialists, practitioners, educators, consultants, trainers and programme creators rather than becoming general hotel staffing.</p></div></div>
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-20">
          <div className="grid lg:grid-cols-[.9fr_1.1fr] gap-8 items-center">
            <div><p className="text-[10px] uppercase tracking-[.18em] font-semibold text-[#9c7a42]">Property arrival packs</p><h2 className="text-[36px] md:text-[46px] font-semibold tracking-[-.045em] text-[#10283b] mt-3">Know the property before your first shift starts.</h2><p className="text-[13px] leading-7 text-[#65727c] mt-4">Confirmed Agency and Residency professionals should not arrive wondering where to park, who to ask for or what uniform to wear. The booking should become a proper operational handover.</p></div>
            <div className="rounded-[24px] bg-white border border-[#ddd9d1] p-7 md:p-8 grid sm:grid-cols-2 gap-x-7 gap-y-3">
              {['Staff entrance and arrival contact','Parking / nearest station','Uniform and what to bring','Food, breaks and changing facilities','Fire procedure and assembly point','Products and treatment protocols','Booking system used','Retail or treatment commission','Guest-service expectations','Property-specific rules'].map(item => <div key={item} className="flex gap-2 text-[11px] leading-5 text-[#65727c]"><CheckCircle2 size={13} className="text-[#9c7a42] shrink-0 mt-1" />{item}</div>)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
