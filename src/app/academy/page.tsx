'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SponsoredAd from '@/components/SponsoredAd'
import { createClient } from '@/lib/supabase/client'
import { ACADEMY, coursePrice, publicCoursePrice, type AcademyCourse } from '@/lib/academy'
import { courseImage } from '@/lib/academy-extras'
import { GraduationCap, Clock, ShieldCheck, X, ArrowRight, BriefcaseBusiness, ChartNoAxesCombined, CheckCircle2, Award, Sparkles, TrendingUp, BadgeCheck, BrainCircuit } from 'lucide-react'

const MANAGEMENT_PROGRAMMES = new Set(['spa-manager-programme', 'spa-director-programme'])
const ACADEMY_ACCENT = '#555555'
const MODERN_COURSE_IMAGES: Record<string, string> = {
  'five-star-service': 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=1200&q=85&auto=format&fit=crop',
}

export default function PublicAcademyPage() {
  const supabase = createClient()
  const [isCandidate, setIsCandidate] = useState(false)
  const [courses, setCourses] = useState<(AcademyCourse & { image_url?: string })[]>(ACADEMY)
  const [buying, setBuying] = useState<{ slug: string; title: string; price: number } | null>(null)
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [purchased, setPurchased] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('purchased') === 'true') setPurchased(true)
    fetch('/api/academy/catalog').then(response => response.ok ? response.json() : null).then(json => {
      if (json?.courses?.length) setCourses(json.courses)
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
  const displayCourseImage = (course: AcademyCourse & { image_url?: string }) => MODERN_COURSE_IMAGES[course.slug] || course.image_url || courseImage(course.slug)

  const purchaseButton = (course: AcademyCourse) => isCandidate ? (
    <Link href="/talent/academy" className="btn-primary text-[12px] inline-flex items-center justify-center gap-1.5">Member enrolment <ArrowRight size={12} /></Link>
  ) : (
    <button type="button" onClick={() => { setBuying({ slug: course.slug, title: course.title, price: publicCoursePrice(course) }); setError('') }} className="btn-primary text-[12px] inline-flex items-center justify-center gap-1.5">Start this course <ArrowRight size={12} /></button>
  )

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-[68px] bg-[#111111] text-white overflow-hidden">
        <div className="mx-auto max-w-[1440px] px-6 py-18 lg:px-10 lg:py-24 grid lg:grid-cols-[1.05fr_.95fr] gap-12 items-center">
          <div>
            <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/55">WHC Academy</p>
            <h1 className="max-w-4xl text-[44px] font-semibold leading-[1.01] tracking-[-0.05em] text-white md:text-[64px]">Learn what luxury spas actually expect from you.</h1>
            <p className="mt-6 max-w-3xl text-[16px] leading-8 text-white/70 md:text-[18px]">Build stronger treatment-room knowledge, commercial confidence and leadership capability - then prove it with verifiable WHC certificates and profile badges.</p>
            <div className="flex flex-col sm:flex-row gap-3 mt-8">
              <a href="#courses" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[13px] font-semibold text-[#111111] hover:bg-white/90 transition-colors">Explore courses <ArrowRight size={14} /></a>
              <Link href={isCandidate ? '/talent/academy' : '/register/talent'} className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/25 px-6 py-3.5 text-[13px] font-semibold text-white hover:bg-white/10 transition-colors">Build my career profile <ArrowRight size={14} /></Link>
            </div>
            <p className="mt-4 text-[11px] text-white/45">No membership required. WHC members receive member pricing.</p>
          </div>

          <div className="rounded-[28px] bg-white p-7 md:p-9 text-[#1a1a1a] shadow-xl shadow-black/15">
            <p className="text-[10px] uppercase tracking-[.16em] font-semibold text-[#555555]">What you leave with</p>
            <h2 className="text-[29px] font-semibold tracking-[-.035em] mt-2">More than a certificate.</h2>
            <div className="space-y-5 mt-7">
              {[
                [BadgeCheck, 'Proof employers can verify', 'Completed courses can appear as WHC profile badges with a certificate code.'],
                [BrainCircuit, 'Confidence you can use', 'Work through practical scenarios and understand why the standard matters, not just what to memorise.'],
                [TrendingUp, 'Skills that move careers forward', 'From treatment-room knowledge to management, commercial thinking and leadership.'],
                [Award, 'A stronger professional story', 'Use your learning to strengthen your CV, profile and interview examples.'],
              ].map(([Icon, title, text]: any) => <div key={title} className="flex gap-4"><div className="h-10 w-10 rounded-xl bg-[#eef2f4] flex items-center justify-center shrink-0"><Icon size={18} className="text-[#555555]" /></div><div><p className="text-[14px] font-semibold">{title}</p><p className="text-[12px] leading-5 text-black/55 mt-1">{text}</p></div></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white border-b border-[#e3e7e9]">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-8 grid grid-cols-2 md:grid-cols-4 gap-5">
          {[
            ['Learn', 'Short, focused modules'],
            ['Apply', 'Real spa scenarios'],
            ['Prove', 'Formal assessment'],
            ['Show', 'Certificate + profile badge'],
          ].map(([title, text], index) => <div key={title} className="flex items-start gap-3"><div className="h-8 w-8 rounded-full bg-[#111111] text-white flex items-center justify-center text-[11px] font-semibold shrink-0">{index + 1}</div><div><p className="text-[12px] font-semibold text-[#1a1a1a]">{title}</p><p className="text-[11px] text-[#7a858c] mt-0.5">{text}</p></div></div>)}
        </div>
      </section>

      <SponsoredAd placement="academy_sponsor" />

      <main id="courses" className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10 lg:py-16 bg-white">
        {purchased && (
          <div className="mb-8 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
            <p className="font-medium">Payment received - check your email.</p>
            <p className="mt-0.5 text-[13px]">Your course access link is on its way. Check spam if it has not landed within a few minutes.</p>
          </div>
        )}

        <section className="mb-14 grid lg:grid-cols-[.85fr_1.15fr] gap-6 items-stretch">
          <div className="rounded-[24px] bg-[#1a1a1a] text-white p-8 md:p-10">
            <p className="text-[10px] uppercase tracking-[.18em] text-white/55 font-semibold">Choose your next move</p>
            <h2 className="text-[34px] font-semibold tracking-[-.04em] leading-[1.05] mt-3">What do you want to be better at next?</h2>
            <p className="text-[14px] leading-7 text-white/65 mt-5">Pick learning that strengthens the job you do now or prepares you for the role you want next.</p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              [Sparkles, 'Deliver better', 'Treatment-room, product and service knowledge for stronger guest experiences.'],
              [BriefcaseBusiness, 'Step into management', 'People, rotas, standards, KPIs, commercial thinking and everyday leadership.'],
              [ChartNoAxesCombined, 'Lead at director level', 'P&L, forecasting, strategy, performance and the decisions senior spa leaders make.'],
            ].map(([Icon, title, text]: any) => <div key={title} className="rounded-[20px] border border-[#e2e6e8] bg-white p-6"><Icon size={20} className="text-[#555555]"/><h3 className="text-[16px] font-semibold text-[#1a1a1a] mt-5">{title}</h3><p className="text-[12px] leading-6 text-[#687681] mt-2">{text}</p></div>)}
          </div>
        </section>

        {managementCourses.length > 0 && (
          <section className="mb-16">
            <div className="mb-7 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#555555]">Flagship leadership programmes</p>
                <h2 className="text-[31px] font-semibold tracking-[-0.035em] text-[#1a1a1a] md:text-[42px]">Move from experienced practitioner to confident leader.</h2>
                <p className="mt-3 max-w-3xl text-[13px] leading-6 text-[#687681]">Applied programmes built around the work luxury spa managers and directors actually do: people, payroll, KPIs, profitability, forecasting, marketing and strategy.</p>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {managementCourses.map((course, index) => (
                <article key={course.slug} className="overflow-hidden rounded-[24px] border border-[#e1e5e7] bg-white shadow-sm hover:shadow-lg transition-shadow">
                  <div className="relative h-64">
                    <img src={displayCourseImage(course)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#111111]/95 via-[#111111]/35 to-transparent" />
                    <div className="absolute bottom-6 left-6 right-6 text-white">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-white/70">{index === 0 ? <BriefcaseBusiness size={13} /> : <ChartNoAxesCombined size={13} />} WHC Leadership Programme</div>
                      <h3 className="text-[27px] font-semibold tracking-[-0.03em]">{course.title}</h3>
                    </div>
                  </div>
                  <div className="p-7">
                    <p className="mb-5 text-[13px] leading-6 text-[#687681]">{course.tagline}</p>
                    <div className="mb-6 grid gap-2 sm:grid-cols-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#65727c]"><CheckCircle2 size={13} className="text-[#555555]" /> {course.lessons.length} applied modules</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#65727c]"><CheckCircle2 size={13} className="text-[#555555]" /> Real spa case studies</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#65727c]"><CheckCircle2 size={13} className="text-[#555555]" /> Formal assessment</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-[#e8ecee] pt-5">
                      <div><p className="text-[10px] uppercase tracking-[0.12em] text-[#8a8a8a]">Guest price</p><p className="text-[22px] font-semibold text-[#1a1a1a]">£{(publicCoursePrice(course) / 100).toFixed(0)}</p></div>
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
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#555555]">Professional course library</p>
            <h2 className="text-[30px] font-semibold tracking-[-0.035em] text-[#1a1a1a] md:text-[40px]">Build the skills luxury spas actually use.</h2>
            <p className="text-[13px] leading-6 text-[#687681] mt-3">Choose focused learning you can complete around work, then add the achievement to your WHC professional profile.</p>
          </div>

          {categories.map(cat => (
            <div key={cat} className="mb-12">
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a8a8a]">{cat}</h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
                {standardCourses.filter(c => c.category === cat).map(course => (
                  <article key={course.slug} className="flex flex-col overflow-hidden rounded-[22px] border border-[#e2e6e8] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="relative h-44 shrink-0">
                      <img src={displayCourseImage(course)} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="mb-1 text-[19px] font-semibold leading-snug tracking-tight text-[#1a1a1a]">{course.title}</h3>
                      <p className="mb-2 text-[12px] text-[#697681]">{course.tagline}</p>
                      <p className="mb-5 inline-flex items-center gap-1 text-[11px] text-[#8a8a8a]"><Clock size={11} /> {course.lessons.length} modules · assessment · ~{course.minutes} min</p>
                      <div className="mt-auto flex items-center justify-between gap-3 border-t border-[#e8ecee] pt-4">
                        <div><p className="text-[10px] uppercase tracking-[.12em] text-[#8a8a8a]">Guest price</p><p className="text-[18px] font-semibold text-[#1a1a1a]">£{(publicCoursePrice(course) / 100).toFixed(0)}</p></div>
                        {isCandidate ? <Link href="/talent/academy" className="btn-primary text-[12px]">£{(coursePrice(course) / 100).toFixed(0)} member</Link> : <button type="button" onClick={() => { setBuying({ slug: course.slug, title: course.title, price: publicCoursePrice(course) }); setError('') }} className="btn-primary text-[12px]">Start course</button>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>

        <section className="mt-14 rounded-[26px] bg-white border border-[#e2e6e8] p-8 md:p-10 grid md:grid-cols-[1fr_auto] gap-8 items-center">
          <div>
            <p className="text-[10px] uppercase tracking-[.17em] text-[#555555] font-semibold">Make your learning visible</p>
            <h2 className="text-[29px] md:text-[36px] font-semibold tracking-[-.035em] text-[#1a1a1a] mt-2">Don't just say you're developing. Show it.</h2>
            <p className="text-[13px] leading-6 text-[#687681] max-w-3xl mt-3">Every WHC certificate carries a unique verification code. For Talent members, completed Academy courses can also appear as profile badges employers can see.</p>
          </div>
          <Link href="/verify" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#aab5bb] px-5 py-3 text-[12px] font-semibold text-[#4d4d4d] hover:bg-[#f5f5f5]">See certificate verification <ArrowRight size={13}/></Link>
        </section>

        <div className="mt-6 flex max-w-4xl items-start gap-3 rounded-2xl border border-[#e2e6e8] bg-white p-5">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#555555]" />
          <p className="text-[11px] leading-5 text-[#687681]">WHC Academy certificates evidence course completion and assessment. They are professional-development records and are not a substitute for regulated qualifications, licences or insurance where those are required.</p>
        </div>
      </main>

      {buying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setBuying(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[#1a1a1a]"><GraduationCap size={17} className="text-[#555555]" /> {buying.title}</h2>
              <button type="button" onClick={() => setBuying(null)} className="text-gray-300 hover:text-[#1a1a1a]"><X size={20} /></button>
            </div>
            <p className="mb-4 text-[12px] leading-5 text-[#697681]">£{(buying.price / 100).toFixed(0)} one-off. After payment your access link arrives by email. Your certificate is issued when you complete the learning and pass the assessment.</p>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Your email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="input-field mb-3" />
            {error && <p className="mb-3 text-[12px] text-red-600">{error}</p>}
            <button type="button" onClick={buyAsGuest} disabled={busy || !email.trim()} className="btn-primary w-full disabled:opacity-50">{busy ? 'Taking you to payment...' : `Pay £${(buying.price / 100).toFixed(0)} & start`}</button>
            <p className="mt-3 text-center text-[11px] text-muted">Already a WHC member? <Link href="/login" className="underline">Sign in</Link> and pay the member price instead.</p>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}
