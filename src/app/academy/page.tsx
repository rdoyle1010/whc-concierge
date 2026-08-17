'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SponsoredAd from '@/components/SponsoredAd'
import { createClient } from '@/lib/supabase/client'
import { ACADEMY, coursePrice, publicCoursePrice, type AcademyCourse } from '@/lib/academy'
import { courseImage } from '@/lib/academy-extras'
import { GraduationCap, Clock, ShieldCheck, X, ArrowRight, BriefcaseBusiness, ChartNoAxesCombined, CheckCircle2 } from 'lucide-react'

const MANAGEMENT_PROGRAMMES = new Set(['spa-manager-programme', 'spa-director-programme'])

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

  const purchaseButton = (course: AcademyCourse) => isCandidate ? (
    <Link href="/talent/academy" className="btn-primary text-[12px] inline-flex items-center justify-center gap-1.5">Member enrolment <ArrowRight size={12} /></Link>
  ) : (
    <button type="button" onClick={() => { setBuying({ slug: course.slug, title: course.title, price: publicCoursePrice(course) }); setError('') }} className="btn-primary text-[12px] inline-flex items-center justify-center gap-1.5">Get this course <ArrowRight size={12} /></button>
  )

  return (
    <div className="min-h-screen bg-[#f3f1ec]">
      <Navbar />

      <section className="border-b border-[#ddd9d1] bg-white pt-16">
        <div className="mx-auto max-w-[1440px] px-6 py-16 lg:px-10 lg:py-20">
          <div className="max-w-4xl">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#9c7a42]">WHC Academy</p>
            <h1 className="mb-5 max-w-3xl text-[40px] font-semibold leading-[1.02] tracking-[-0.045em] text-[#10283b] md:text-[58px]">Training you can use in the treatment room, on the spa floor and in the boardroom.</h1>
            <p className="mb-6 max-w-3xl text-[15px] leading-7 text-[#61707c] md:text-[16px]">
              Professional development for luxury spa and wellness careers. Learn the theory, understand why it matters, see how it works in practice, work through real spa scenarios and prove your knowledge in a formal assessment.
            </p>
            <div className="grid max-w-3xl gap-3 sm:grid-cols-3">
              {[
                ['Practical', 'Real situations, management decisions and treatment-room application.'],
                ['Structured', 'Objectives, key terms, case studies, visual frameworks and assessment.'],
                ['Career-led', 'Verifiable certificates and profile badges visible to WHC properties.'],
              ].map(([title, text]) => <div key={title} className="rounded-2xl border border-[#e4e0d8] bg-[#faf9f6] p-4"><p className="mb-1 text-[12px] font-semibold text-[#10283b]">{title}</p><p className="text-[11px] leading-5 text-[#6b7780]">{text}</p></div>)}
            </div>
            <p className="mt-6 text-[12px] text-[#7c878f]">
              No membership required. WHC members receive member pricing in their <Link href={isCandidate ? '/talent/academy' : '/register/talent'} className="font-medium text-[#9c7a42] underline underline-offset-2">dashboard</Link>.
            </p>
          </div>
        </div>
      </section>

      <SponsoredAd placement="academy_sponsor" />

      <main className="mx-auto max-w-[1440px] px-6 py-12 lg:px-10 lg:py-16">
        {purchased && (
          <div className="mb-8 rounded-xl border border-green-200 bg-green-50 px-5 py-4 text-sm text-green-800">
            <p className="font-medium">Payment received - check your email.</p>
            <p className="mt-0.5 text-[13px]">Your course access link is on its way. Check spam if it has not landed within a few minutes.</p>
          </div>
        )}

        {managementCourses.length > 0 && (
          <section className="mb-14">
            <div className="mb-6 flex flex-col justify-between gap-3 md:flex-row md:items-end">
              <div>
                <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9c7a42]">Leadership programmes</p>
                <h2 className="text-[30px] font-semibold tracking-[-0.03em] text-[#10283b] md:text-[38px]">Move from excellent practitioner to confident spa leader.</h2>
                <p className="mt-2 max-w-3xl text-[13px] leading-6 text-[#687681]">Longer, applied programmes built around real management work: people, rotas, payroll, KPIs, profitability, P&amp;L, forecasting, marketing and strategy.</p>
              </div>
            </div>
            <div className="grid gap-6 lg:grid-cols-2">
              {managementCourses.map((course, index) => (
                <article key={course.slug} className="overflow-hidden rounded-2xl border border-[#d8d3c9] bg-white shadow-sm">
                  <div className="relative h-56">
                    <img src={course.image_url || courseImage(course.slug)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0b2f4d]/90 via-[#0b2f4d]/30 to-transparent" />
                    <div className="absolute bottom-5 left-5 right-5 text-white">
                      <div className="mb-2 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-[#e6c98e]">{index === 0 ? <BriefcaseBusiness size={13} /> : <ChartNoAxesCombined size={13} />} WHC Leadership Programme</div>
                      <h3 className="text-[25px] font-semibold tracking-[-0.025em]">{course.title}</h3>
                    </div>
                  </div>
                  <div className="p-6">
                    <p className="mb-4 text-[13px] leading-6 text-[#687681]">{course.tagline}</p>
                    <div className="mb-5 grid gap-2 sm:grid-cols-3">
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#65727c]"><CheckCircle2 size={13} className="text-[#9c7a42]" /> {course.lessons.length} applied modules</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#65727c]"><CheckCircle2 size={13} className="text-[#9c7a42]" /> Real spa case studies</span>
                      <span className="inline-flex items-center gap-1.5 text-[11px] text-[#65727c]"><CheckCircle2 size={13} className="text-[#9c7a42]" /> Formal assessment</span>
                    </div>
                    <div className="flex items-center justify-between gap-4 border-t border-[#ece8e1] pt-5">
                      <div><p className="text-[10px] uppercase tracking-[0.12em] text-[#8a949b]">Guest price</p><p className="text-[20px] font-semibold text-[#10283b]">£{(publicCoursePrice(course) / 100).toFixed(0)}</p></div>
                      {purchaseButton(course)}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="mb-7">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9c7a42]">Professional course library</p>
            <h2 className="text-[28px] font-semibold tracking-[-0.03em] text-[#10283b]">Build the skills luxury spas actually use.</h2>
          </div>

          {categories.map(cat => (
            <div key={cat} className="mb-10">
              <h3 className="mb-4 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8a949b]">{cat}</h3>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                {standardCourses.filter(c => c.category === cat).map(course => (
                  <article key={course.slug} className="flex flex-col overflow-hidden rounded-2xl border border-[#ddd9d1] bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg">
                    <div className="relative h-44 shrink-0">
                      <img src={course.image_url || courseImage(course.slug)} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 to-transparent" />
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <h3 className="mb-1 text-[19px] font-semibold leading-snug tracking-tight text-[#10283b]">{course.title}</h3>
                      <p className="mb-2 text-[12px] text-[#697681]">{course.tagline}</p>
                      <p className="mb-4 inline-flex items-center gap-1 text-[11px] text-[#8a949b]"><Clock size={11} /> {course.lessons.length} modules · practical case studies · assessment · ~{course.minutes} min</p>
                      <div className="mt-auto flex items-center justify-between gap-3">
                        <p className="text-[16px] font-semibold text-[#10283b]">£{(publicCoursePrice(course) / 100).toFixed(0)}</p>
                        {isCandidate ? <Link href="/talent/academy" className="btn-primary text-[12px]">£{(coursePrice(course) / 100).toFixed(0)} member price</Link> : <button type="button" onClick={() => { setBuying({ slug: course.slug, title: course.title, price: publicCoursePrice(course) }); setError('') }} className="btn-primary text-[12px]">Get this course</button>}
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          ))}
        </section>

        <div className="flex max-w-3xl items-start gap-3 rounded-2xl border border-[#ddd9d1] bg-white p-6">
          <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#9c7a42]" />
          <p className="text-[12px] leading-5 text-[#687681]">Every certificate carries a unique code that can be checked at <Link href="/verify" className="text-[#9c7a42] underline">talent.wellnesshousecollective.co.uk/verify</Link>. Certificates evidence course completion and assessment; they are not a substitute for accredited qualifications or insurance requirements.</p>
        </div>
      </main>

      {buying && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setBuying(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6" onClick={e => e.stopPropagation()}>
            <div className="mb-2 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-[#10283b]"><GraduationCap size={17} className="text-[#9c7a42]" /> {buying.title}</h2>
              <button type="button" onClick={() => setBuying(null)} className="text-gray-300 hover:text-[#10283b]"><X size={20} /></button>
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
