'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SponsoredAd from '@/components/SponsoredAd'
import { createClient } from '@/lib/supabase/client'
import { ACADEMY, coursePrice, publicCoursePrice, type AcademyCourse } from '@/lib/academy'
import { courseMeta } from '@/lib/academy-meta'
import { courseImage } from '@/lib/academy-extras'
import { GraduationCap, ShieldCheck, X, ArrowRight, BriefcaseBusiness, ChartNoAxesCombined, CheckCircle2, Award, Sparkles, TrendingUp, BadgeCheck, BrainCircuit } from 'lucide-react'

const MANAGEMENT_PROGRAMMES = new Set(['spa-manager-programme', 'spa-director-programme'])
const ACADEMY_ACCENT = '#5a6a76'
const MODERN_COURSE_IMAGES: Record<string, string> = {
  'five-star-service': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85&auto=format&fit=crop',
}

export default function PublicAcademyPage() {
  const supabase = createClient()
  const [isCandidate, setIsCandidate] = useState(false)
  const [courses, setCourses] = useState<(AcademyCourse & { image_url?: string })[]>(ACADEMY)
  const [buying, setBuying] = useState<{ slug: string; title: string; price: number } | null>(null)
  const [email, setEmail] = useState('')
  const [teamForm, setTeamForm] = useState({ name: '', email: '', property: '', teamSize: '', message: '' })
  const [teamBusy, setTeamBusy] = useState(false)
  const [teamSent, setTeamSent] = useState(false)
  const [teamError, setTeamError] = useState('')
  // Live demand per course slug: how many live WHC roles ask for the skills
  // the course teaches. Computed server-side and cached; absent counts simply
  // mean the line does not render.
  const [demand, setDemand] = useState<Record<string, number>>({})

  async function submitTeamEnquiry() {
    setTeamError('')
    if (!teamForm.name.trim() || !teamForm.email.trim() || !teamForm.property.trim()) {
      setTeamError('Please give your name, email and property.'); return
    }
    setTeamBusy(true)
    try {
      const message = `Property: ${teamForm.property}\nTeam size: ${teamForm.teamSize || 'not given'}\n\n${teamForm.message || 'Interested in Academy for Teams.'}`
      const { error: insertError } = await supabase.from('contact_queries').insert({
        name: teamForm.name, email: teamForm.email,
        subject: `Academy for Teams - ${teamForm.property}`,
        type: 'academy_teams', message, status: 'open',
      })
      if (insertError) { setTeamError('Could not send the enquiry - please try again.'); return }
      fetch('/api/contact-notify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: teamForm.name, email: teamForm.email, subject: `Academy for Teams - ${teamForm.property}`, message }) }).catch(() => {})
      setTeamSent(true)
    } finally { setTeamBusy(false) }
  }
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [purchased, setPurchased] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('purchased') === 'true') setPurchased(true)
    fetch('/api/academy/catalog').then(response => response.ok ? response.json() : null).then(json => {
      if (json?.courses?.length) setCourses(json.courses)
    }).catch(() => {})
    fetch('/api/academy/demand').then(response => response.ok ? response.json() : null).then(json => {
      if (json && typeof json === 'object' && !Array.isArray(json)) setDemand(json)
    }).catch(() => {})
    supabase.auth.getUser().then(async ({ data: { user } }) => {
      if (!user) return
      const { data } = await supabase.from('candidate_profiles').select('id').eq('user_id', user.id).maybeSingle()
      if (data) setIsCandidate(true)
    })
  }, [])

  async function buyAsGuest() {
    if (!buying) return
    setError('')
    setBusy(true)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'course_public', courseSlug: buying.slug, email, returnUrl: window.location.origin }),
      })
      const j = await res.json()
      if (!res.ok || !j.url) { setError(j.error || 'Could not start the payment - please try again.'); setBusy(false); return }
      window.location.href = j.url
    } catch {
      setError('Something went wrong - please try again.')
      setBusy(false)
    }
  }

  const managementCourses = courses.filter(course => MANAGEMENT_PROGRAMMES.has(course.slug))
  const standardCourses = courses.filter(course => !MANAGEMENT_PROGRAMMES.has(course.slug))
  const categories = Array.from(new Set(standardCourses.map(c => c.category)))
  // An image uploaded in Admin -> Academy always wins; MODERN_COURSE_IMAGES is
  // only a nicer default for courses no admin has set an image for.
  const displayCourseImage = (course: AcademyCourse & { image_url?: string; image_admin_set?: boolean }) =>
    (course.image_admin_set && course.image_url) || MODERN_COURSE_IMAGES[course.slug] || course.image_url || courseImage(course.slug)

  const purchaseButton = (course: AcademyCourse) => isCandidate ? (
    <Link href="/talent/academy" className="btn-primary text-[12px] inline-flex items-center justify-center gap-1.5">Member enrolment <ArrowRight size={12} /></Link>
  ) : (
    <button type="button" onClick={() => { setBuying({ slug: course.slug, title: course.title, price: publicCoursePrice(course) }); setError('') }} className="btn-primary text-[12px] inline-flex items-center justify-center gap-1.5">Start this course <ArrowRight size={12} /></button>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-[76px] bg-[#0b2f4d] text-white overflow-hidden">
        <div className="mx-auto max-w-[1440px] px-6 py-18 lg:px-10 lg:py-24 grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">WHC Academy</p>
            <h1 className="max-w-4xl text-[44px] font-semibold leading-[1.01] tracking-[-0.05em] text-white md:text-[64px]">Learn what luxury spas actually expect from you.</h1>
            <p className="mt-6 max-w-3xl text-[16px] leading-8 text-white/70 md:text-[18px]">Professional courses with assessments, verified certificates and CPD hours - built for spa careers, from the treatment room to director level.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <a href="#main-content" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[13px] font-semibold text-[#0b2f4d] hover:bg-white/90 transition-colors">Explore courses <ArrowRight size={14} /></a>
              <Link href={isCandidate ? '/talent/academy' : '/register/talent'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors">Build my career profile <ArrowRight size={14} /></Link>
            </div>
            <p className="mt-4 text-[11px] text-white/45">No membership required. WHC members receive member pricing.</p>
          </div>

          <div className="rounded-[28px] bg-white p-7 md:p-9 text-[#10283b] shadow-xl shadow-black/15">
            <p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#5a6a76]">What you leave with</p>
            <h2 className="text-[29px] font-semibold tracking-[-.035em] mt-2">More than a certificate.</h2>
            <div className="space-y-5 mt-7">
              {[
                [BadgeCheck, 'Proof employers can verify', 'Completed courses can appear as WHC profile badges with a certificate code.'],
                [BrainCircuit, 'Confidence you can use', 'Work through practical scenarios and understand why the standard matters, not just what to memorise.'],
                [TrendingUp, 'Skills that move careers forward', 'From treatment-room knowledge to management, commercial thinking and leadership.'],
                [Award, 'A stronger professional story', 'Use your learning to strengthen your CV, profile and interview examples.'],
              ].map(([Icon, title, text]: any) => <div key={title} className="flex gap-4"><div className="h-10 w-10 rounded-xl bg-[#e8eef4] flex items-center justify-center shrink-0"><Icon size={18} className="text-[#5a6a76]" /></div><div><p className="text-[14px] font-semibold">{title}</p><p className="text-[12px] leading-5 text-black/55 mt-1">{text}</p></div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-[#e3e7eb]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            ['Learn', 'Short, focused modules'],
            ['Apply', 'Real spa scenarios'],
            ['Prove', 'Formal assessment'],
            ['Show', 'Certificate + profile badge'],
          ].map(([title, text], index) => <div key={title} className="flex items-start gap-3"><div className="h-8 w-8 rounded-full bg-[#0b2f4d] text-white flex items-center justify-center text-[11px] font-semibold shrink-0">{index + 1}</div><div><p className="text-[12px] font-semibold text-[#10283b]">{title}</p><p className="text-[11px] text-[#8a949b] mt-0.5">{text}</p></div></div>)}
        </div>
      </section>

      <SponsoredAd placement="academy_sponsor" />

      <main id="main-content" className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10 lg:py-16 bg-white">
        {purchased && (
          <div className="mb-8 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
            <p className="font-medium">Payment received - check your email.</p>
            <p className="mt-0.5 text-[13px]">Your course access link is on its way. Check spam if it has not landed within a few minutes.</p>
          </div>
        )}

        <section className="mb-14 grid lg:grid-cols-[.85fr_1.15fr] gap-6 items-stretch">
          <div className="rounded-[24px] bg-[#10283b] text-white p-8 md:p-10">
            <p className="text-[10px] uppercase tracking-[.18em] text-white/55 font-semibold">Choose your next move</p>
            <h2 className="text-[34px] font-semibold tracking-[-.04em] leading-[1.05] mt-3">What do you want to be better at next?</h2>
            <p className="text-[14px] leading-7 text-white/65 mt-5">Pick learning that strengthens the job you do now or prepares you for the role you want next.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              [Sparkles, 'Deliver better', 'Treatment-room, product and service knowledge for stronger guest experiences.'],
              [BriefcaseBusiness, 'Step into management', 'People, rotas, standards, KPIs, commercial thinking and everyday leadership.'],
              [ChartNoAxesCombined, 'Lead at director level', 'P&L, forecasting, strategy, performance and the decisions senior spa leaders make.'],
            ].map(([Icon, title, text]: any) => <div key={title} className="rounded-[20px] border border-[#e3e7eb] bg-white p-6"><Icon size={20} className="text-[#5a6a76]"/><h3 className="text-[16px] font-semibold text-[#10283b] mt-5">{title}</h3><p className="text-[12px] leading-6 text-[#5a6a76] mt-2">{text}</p></div>)}
          </div>
        </section>

        {managementCourses.length > 0 && (
          <section className="mb-16">
            <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a6a76]">Flagship leadership programmes</p>
                <h2 className="text-[31px] font-semibold tracking-[-0.035em] text-[#10283b] md:text-[42px]">Move from experienced practitioner to confident leader.</h2>
                <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[#5a6a76]">Applied programmes built around the work luxury spa managers and directors actually do: people, payroll, KPIs, profitability, forecasting, marketing and strategy.</p>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {managementCourses.map((course, index) => (
                <article key={course.slug} className="overflow-hidden border border-[#e3e7eb] bg-white">
                  <div className="relative h-64">
                    <img src={displayCourseImage(course)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b2f4d]/95 via-[#0b2f4d]/35 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">{index === 0 ? <BriefcaseBusiness size={13} /> : <ChartNoAxesCombined size={13} />} WHC Leadership Programme</div>
                      <h3 className="text-[27px] font-semibold tracking-[-0.03em]">{course.title}</h3>
                    </div>
                  </div>
                  <div className="p-7">
                    <p className="mb-5 text-[13px] leading-6 text-[#5a6a76]">{course.tagline}</p>
                    {(demand[course.slug] || 0) > 0 && (
                      <p className="mb-5 border-t border-[#e3e7eb] pt-3 text-[13px] font-serif font-semibold text-[#0b2f4d]">Asked for in {demand[course.slug]} live WHC role{demand[course.slug] === 1 ? '' : 's'} right now</p>
                    )}
                    <div className="mb-6 grid gap-2 sm:grid-cols-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#5a6a76]"><CheckCircle2 size={13} className="text-[#5a6a76]" /> {course.lessons.length} applied modules</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#5a6a76]"><CheckCircle2 size={13} className="text-[#5a6a76]" /> Real spa case studies</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#5a6a76]"><CheckCircle2 size={13} className="text-[#5a6a76]" /> Formal assessment</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-[#e3e7eb] pt-5">
                      <div><p className="text-[10px] uppercase tracking-[0.12em] text-[#8a949b]">Guest price</p><p className="text-[22px] font-semibold text-[#10283b]">£{(publicCoursePrice(course) / 100).toFixed(0)}</p></div>
                      {purchaseButton(course)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-8 max-w-3xl">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5a6a76]">Professional course library</p>
            <h2 className="text-[30px] font-semibold tracking-[-0.035em] text-[#10283b] md:text-[40px]">Build the skills luxury spas actually use.</h2>
            <p className="text-[13px] leading-6 text-[#5a6a76] mt-3">Choose focused learning you can complete around work, then add the achievement to your WHC professional profile.</p>
          </div>

          {categories.map(cat => (
            <div key={cat} className="mb-12">
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a949b]">{cat}</h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {standardCourses.filter(c => c.category === cat).map(course => (
                  <article key={course.slug} className="flex flex-col overflow-hidden border border-[#e3e7eb] bg-white">
                    <div className="relative h-44 shrink-0">
                      <img src={displayCourseImage(course)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="mb-1 text-[19px] font-semibold leading-snug tracking-tight text-[#10283b]">{course.title}</h3>
                      <p className="mb-3 text-[12px] text-[#5a6a76]">{course.tagline}</p>
                      <p className="text-[11px] text-[#8a949b]">{course.lessons.length} module{course.lessons.length === 1 ? '' : 's'} · ~{course.minutes} min · {courseMeta(course.slug).cpdHours} CPD hour{courseMeta(course.slug).cpdHours === 1 ? '' : 's'} · £{(publicCoursePrice(course) / 100).toFixed(0)}</p>
                      {(demand[course.slug] || 0) > 0 && (
                        <p className="mt-2 border-t border-[#e3e7eb] pt-2 text-[12px] font-serif font-semibold text-[#0b2f4d]">Asked for in {demand[course.slug]} live WHC role{demand[course.slug] === 1 ? '' : 's'} right now</p>
                      )}
                      <div className="mt-auto border-t border-[#e3e7eb] pt-4">
                        {isCandidate ? <Link href="/talent/academy" className="btn-primary text-[12px]">Member enrolment · £{(coursePrice(course) / 100).toFixed(0)}</Link> : <button type="button" onClick={() => { setBuying({ slug: course.slug, title: course.title, price: publicCoursePrice(course) }); setError('') }} className="btn-primary text-[12px]">Start course</button>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-14 rounded-[26px] bg-white border border-[#e3e7eb] p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[.17em] text-[#5a6a76] font-semibold">Make your learning visible</p>
            <h2 className="text-[29px] md:text-[36px] font-semibold tracking-[-.035em] text-[#10283b] mt-2">Don't just say you're developing. Show it.</h2>
            <p className="text-[13px] leading-6 text-[#5a6a76] max-w-3xl mt-3">Every WHC certificate carries a unique verification code. For Talent members, completed Academy courses can also appear as profile badges employers can see.</p>
          </div>
          <Link href="/verify" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#8a949b] px-5 py-3 text-[12px] font-semibold text-[#5a6a76] hover:bg-[#f5f6f8]">See certificate verification <ArrowRight size={13}/></Link>
        </section>

        <section className="mt-14 border border-border bg-[#f5f6f8] p-7 md:p-9">
            <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-accent">WHC Academy for Teams</p>
            <h2 className="mt-2 text-[24px] font-semibold text-ink">Train the whole team, track every completion</h2>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-secondary">Put your property&apos;s therapists, reception and management through the same professional curriculum - service standards, revenue, retail, leadership - with team pricing from £15 per seat per year (minimum 10 seats) and a property onboarding pathway built from the course library. Completion and CPD records for every team member, ready for your quality audits.</p>
            {teamSent ? (
              <p role="status" className="mt-5 text-[13px] font-medium text-green-700">Thank you - your enquiry is with the WHC team and we will come back to you within one working day.</p>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <input type="text" aria-label="Your name" value={teamForm.name} onChange={e => setTeamForm({ ...teamForm, name: e.target.value })} placeholder="Your name" className="input-field" />
                <input type="email" aria-label="Work email" value={teamForm.email} onChange={e => setTeamForm({ ...teamForm, email: e.target.value })} placeholder="Work email" className="input-field" />
                <input type="text" aria-label="Property or group" value={teamForm.property} onChange={e => setTeamForm({ ...teamForm, property: e.target.value })} placeholder="Property or group" className="input-field" />
                <input type="text" aria-label="Team size" value={teamForm.teamSize} onChange={e => setTeamForm({ ...teamForm, teamSize: e.target.value })} placeholder="Team size (approx.)" className="input-field" />
                <textarea rows={2} aria-label="Anything specific to cover" value={teamForm.message} onChange={e => setTeamForm({ ...teamForm, message: e.target.value })} placeholder="Anything specific - onboarding, standards, leadership development..." className="input-field md:col-span-2" />
                {teamError && <p role="alert" className="text-[12px] text-red-600 md:col-span-2">{teamError}</p>}
                <button type="button" onClick={submitTeamEnquiry} disabled={teamBusy} className="btn-primary w-fit text-[13px] disabled:opacity-50 md:col-span-2">{teamBusy ? 'Sending...' : 'Enquire about team training'}</button>
              </div>
            )}
        </section>

        <div className="mt-6 flex max-w-4xl items-start gap-3 border border-[#e3e7eb] bg-white p-5">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#5a6a76]" />
          <p className="text-[11px] leading-5 text-[#5a6a76]">WHC Academy certificates evidence course completion and assessment. They are professional-development records and are not a substitute for regulated qualifications, licences or insurance where those are required.</p>
        </div>
      </main>

      {buying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setBuying(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[#10283b]"><GraduationCap size={17} className="text-[#5a6a76]" /> {buying.title}</h2>
              <button type="button" onClick={() => setBuying(null)} aria-label="Close" className="p-2 -m-2 text-gray-300 hover:text-[#10283b]"><X size={20} /></button>
            </div>
            <p className="mb-4 text-[12px] leading-5 text-[#5a6a76]">£{(buying.price / 100).toFixed(0)} one-off. After payment your access link arrives by email. Your certificate is issued when you complete the learning and pass the assessment.</p>
            <label htmlFor="academy-buy-email" className="mb-1.5 block text-sm font-medium text-gray-700">Your email</label>
            <input id="academy-buy-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field mb-3" />
            {error && <p role="alert" className="mb-3 text-[12px] text-red-600">{error}</p>}
            <button type="button" onClick={buyAsGuest} disabled={busy || !email.trim()} className="btn-primary w-full disabled:opacity-50">{busy ? 'Taking you to payment...' : `Pay £${(buying.price / 100).toFixed(0)} & start`}</button>
            <p className="mt-3 text-center text-[11px] text-muted">Already a WHC member? <Link href="/login" className="underline">Sign in</Link> and pay the member price instead.</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
