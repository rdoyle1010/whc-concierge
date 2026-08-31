'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { ACADEMY, COURSE_PRICE, BUNDLE_PRICE, CORE_SLUGS, coursePrice, type AcademyCourse } from '@/lib/academy'
import { courseImage } from '@/lib/academy-extras'
import { GraduationCap, Award, Clock, Check, Download } from 'lucide-react'

const MANAGEMENT_PROGRAMMES = new Set(['spa-manager-programme', 'spa-director-programme'])

export default function AcademyPage() {
  const [courses, setCourses] = useState<(AcademyCourse & { image_url?: string; is_core?: boolean })[]>(ACADEMY)
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [career, setCareer] = useState<any>(null)

  async function load() {
    try {
      const [aRes, sRes, cRes] = await Promise.all([
        fetch('/api/academy'),
        fetch('/api/agency/settings'),
        fetch('/api/academy/catalog'),
      ])
      if (aRes.ok) {
        const j = await aRes.json()
        setEnrollments(j.enrollments || [])
      }
      if (sRes.ok) {
        const s = await sRes.json()
        setProfileId(s.settings?.profile_id || null)
      }
      if (cRes.ok) {
        const c = await cRes.json()
        if (c.courses?.length) setCourses(c.courses)
      }
    } catch { /* empty catalogue state */ }
    setLoading(false)
    // Career intelligence loads after the catalogue so the page renders fast.
    fetch('/api/academy/career').then(r => r.ok ? r.json() : null).then(setCareer).catch(() => null)
  }

  useEffect(() => {
    load()
    const params = new URLSearchParams(window.location.search)
    if (params.get('enrolled')) setNotice('Payment received - you are enrolled. Your course is ready below.')
  }, [])

  async function buyBundle() {
    if (!profileId) { setError('Complete your profile first, then enrol.'); return }
    setError('')
    setBusySlug('__bundle__')
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'course_bundle', candidateId: profileId, returnUrl: window.location.origin }),
      })
      const j = await res.json()
      if (!res.ok || !j.url) { setError(j.error || 'Could not start the payment - please try again.'); setBusySlug(null); return }
      window.location.href = j.url
    } catch {
      setError('Something went wrong - please try again.')
      setBusySlug(null)
    }
  }

  async function buy(slug: string, title: string) {
    if (!profileId) { setError('Complete your profile first, then enrol.'); return }
    setError('')
    setBusySlug(slug)
    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'course', candidateId: profileId, courseSlug: slug, courseTitle: title, returnUrl: window.location.origin }),
      })
      const j = await res.json()
      if (!res.ok || !j.url) { setError(j.error || 'Could not start the payment - please try again.'); setBusySlug(null); return }
      window.location.href = j.url
    } catch {
      setError('Something went wrong - please try again.')
      setBusySlug(null)
    }
  }

  const enrolmentFor = (slug: string) => enrollments.find(e => e.course_slug === slug && e.paid_at)
  const completedCount = enrollments.filter(e => e.completed_at).length
  const categories = Array.from(new Set(courses.map(c => c.category)))
  const coreCourses = courses.filter(course => course.is_core ?? CORE_SLUGS.includes(course.slug))
  const activeCoreSlugs = coreCourses.map(course => course.slug)

  return (
    <DashboardShell role="talent">
      <div className="max-w-6xl">
        <p className="dashboard-eyebrow">Learning &amp; development</p>
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={22} className="text-accent" />
          <h1 className="dashboard-title">WHC Academy</h1>
        </div>
        <p className="dashboard-intro mb-6 max-w-2xl">
          The Academy exists to move your career forward: learn, pass the assessment, and the verified badge joins your profile - where it strengthens your matches and shows employers exactly what you can do. Core curriculum £{(COURSE_PRICE / 100).toFixed(0)} per course, brand masterclasses £5, leadership programmes with practical toolkits.
        </p>

        {notice && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{notice}</div>}
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {career && (
          <div className="mb-8 rounded-2xl border border-[#e5e5e5] bg-[#fafafa] p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#10283b]">Your career position</p>
                <h2 className="mt-1 font-sans text-[22px] font-semibold tracking-tight text-ink">{career.position?.current || 'Building your profile'} → {career.position?.next}</h2>
                <p className="mt-1 text-[12px] leading-5 text-gray-500 max-w-xl">
                  {career.position?.average_match ? <>Across {career.position.live_roles_assessed} live roles you average a {career.position.average_match}% match{career.position?.top_match ? <> - strongest: {career.position.top_match.score}% for {career.position.top_match.title}</> : null}. The learning below is chosen to move those numbers, not to sell you courses.</> : 'Complete your profile and the Academy will read the live market against your skills to recommend exactly what to learn next.'}
                </p>
              </div>
              <div className="flex shrink-0 gap-6 text-center">
                <div><p className="text-[22px] font-semibold text-ink">{career.progress?.completed || 0}</p><p className="text-[10px] uppercase tracking-wide text-gray-400">Completed</p></div>
                <div><p className="text-[22px] font-semibold text-ink">{career.progress?.certificates || 0}</p><p className="text-[10px] uppercase tracking-wide text-gray-400">Certificates</p></div>
                <div><p className="text-[22px] font-semibold text-ink">{career.progress?.cpd_hours || 0}</p><p className="text-[10px] uppercase tracking-wide text-gray-400">CPD hours</p></div>
              </div>
            </div>

            {career.progress?.in_progress?.length > 0 && (
              <div className="mt-5 border-t border-[#e9e9e9] pt-4">
                <p className="mb-2 text-[11px] font-semibold text-[#10283b]">Continue learning</p>
                <div className="flex flex-wrap gap-2">
                  {career.progress.in_progress.map((item: any) => (
                    <Link key={item.slug} href={`/talent/academy/${item.slug}`} className="inline-flex items-center gap-2 rounded-xl border border-[#e0e0e0] bg-white px-3.5 py-2 text-[12px] font-medium text-ink hover:border-[#10283b]">
                      {item.title}
                      <span className="text-[10px] text-gray-400">{item.lessons_done}/{item.lessons_total} lessons</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {career.gaps?.length > 0 && (
              <div className="mt-5 border-t border-[#e9e9e9] pt-4">
                <p className="mb-1 text-[11px] font-semibold text-[#10283b]">Skills employers are asking for right now - that your profile doesn&apos;t show yet</p>
                <p className="mb-3 text-[11px] text-gray-500">From the requirements of live roles you could match. Closing a gap strengthens real applications - directional, honest, no invented percentages.</p>
                <div className="grid gap-2 sm:grid-cols-2">
                  {career.gaps.map((gap: any) => (
                    <div key={gap.skill} className="rounded-xl border border-[#e5e5e5] bg-white p-3.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-[13px] font-semibold text-ink truncate">{gap.skill}</p>
                        <span className="shrink-0 text-[10px] text-gray-400">{gap.demanded_in} live role{gap.demanded_in === 1 ? '' : 's'}</span>
                      </div>
                      {gap.courses?.length ? gap.courses.map((c: any) => (
                        <Link key={c.slug} href={`/talent/academy/${c.slug}`} className="mt-1.5 flex items-center justify-between gap-2 text-[12px] text-[#0b2f4d] hover:underline">
                          <span className="truncate">→ {c.title}</span><span className="shrink-0 text-[10px] text-gray-400">~{c.minutes} min</span>
                        </Link>
                      )) : <p className="mt-1.5 text-[11px] text-gray-400">Evidence this on your profile - no course needed.</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {career.pathway?.length > 0 && (
              <div className="mt-5 border-t border-[#e9e9e9] pt-4">
                <p className="mb-2 text-[11px] font-semibold text-[#10283b]">Recommended for your step up to {career.position?.next}</p>
                <div className="flex flex-wrap gap-2">
                  {career.pathway.map((item: any) => (
                    <Link key={item.slug} href={`/talent/academy/${item.slug}`} className="inline-flex items-center gap-2 rounded-xl border border-[#e0e0e0] bg-white px-3.5 py-2 text-[12px] font-medium text-ink hover:border-[#10283b]">
                      {item.title}
                      <span className="rounded-full bg-[#f5f5f5] px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#10283b]">{item.level}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {!loading && enrollments.filter(e => e.paid_at && activeCoreSlugs.includes(e.course_slug)).length < activeCoreSlugs.length && activeCoreSlugs.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-ink rounded-xl px-5 py-4 mb-6">
            <div>
              <p className="text-[14px] font-medium text-white">The Core Curriculum - all {activeCoreSlugs.length} core courses for £{(BUNDLE_PRICE / 100).toFixed(0)}</p>
              <p className="text-[12px] text-white/60 mt-0.5">Save £{Math.max(0, (coreCourses.reduce((sum, course) => sum + coursePrice(course), 0) - BUNDLE_PRICE) / 100).toFixed(0)} against buying individually. Certificates and profile badges are included. Brand masterclasses and specialist care are priced separately.</p>
            </div>
            <button type="button" onClick={buyBundle} disabled={busySlug === '__bundle__'} className="btn-primary !bg-white !text-ink text-[12px] shrink-0 disabled:opacity-50">
              {busySlug === '__bundle__' ? 'Taking you to payment...' : `Get the bundle - £${(BUNDLE_PRICE / 100).toFixed(0)}`}
            </button>
          </div>
        )}

        {completedCount > 0 && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-5 py-4 mb-6">
            <Award size={18} className="text-green-700 shrink-0" />
            <p className="text-[13px] text-green-800"><span className="font-medium">{completedCount} certificate{completedCount > 1 ? 's' : ''} earned.</span> Your badges are live on your profile and in the agency directory.</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
        ) : (
          categories.map(cat => (
            <div key={cat} className="mb-8">
              <h2 className="text-[11px] uppercase tracking-[0.14em] text-gray-400 mb-3">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {courses.filter(c => c.category === cat).map(course => {
                  const enr = enrolmentFor(course.slug)
                  const done = Boolean(enr?.completed_at)
                  const lessonsDone = enr ? Object.keys(enr.progress || {}).length : 0
                  const isManagement = MANAGEMENT_PROGRAMMES.has(course.slug)
                  return (
                    <div key={course.slug} className={`dashboard-card !p-0 overflow-hidden flex flex-col ${done ? 'border-green-300 ring-2 ring-green-200' : enr ? 'border-gold ring-2 ring-gold shadow-lg shadow-gold/20' : ''}`}>
                      <div className="relative h-28 shrink-0">
                        <img src={course.image_url || courseImage(course.slug)} alt="" className="absolute inset-0 w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                        {isManagement && <span className="absolute left-3 top-3 rounded-full bg-ink/90 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-white/80">Leadership programme</span>}
                      </div>
                      <div className="p-5 flex flex-col flex-1">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-sans text-[17px] font-semibold tracking-tight text-ink leading-snug">{course.title}</h3>
                          {done ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-green-600 text-white px-2 py-0.5 rounded-full shrink-0"><Check size={10} /> Certified</span> : enr ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-gold text-white px-2 py-0.5 rounded-full shrink-0">Yours - in progress</span> : null}
                        </div>
                        <p className="text-[12px] text-gray-500 mb-2">{course.tagline}</p>
                        <p className="text-[11px] text-gray-400 mb-4 inline-flex items-center gap-1"><Clock size={11} /> {course.lessons.length} modules · objectives, case studies &amp; assessment · ~{course.minutes} min</p>
                        {isManagement && <div className="mb-4 rounded-xl border border-gold/20 bg-[#f5f5f5] p-3"><p className="text-[11px] font-semibold text-ink">Includes practical management labs + downloadable toolkit</p><p className="mt-1 text-[10px] leading-4 text-muted">Work with rota, payroll, profitability, P&amp;L, forecasting and planning templates rather than just reading theory.</p></div>}
                        <div className="mt-auto">
                          {done ? (
                            <div className="grid grid-cols-1 gap-2">
                              <div className="flex items-center gap-3">
                                <Link href={`/talent/academy/${course.slug}`} className="btn-secondary text-[12px] flex-1 text-center">Review course</Link>
                                <Link href={`/talent/academy/certificate/${course.slug}`} className="btn-primary text-[12px] flex-1 text-center">Certificate</Link>
                              </div>
                              {isManagement && <Link href={`/talent/academy/${course.slug}/toolkit`} className="btn-secondary text-[12px] inline-flex items-center justify-center gap-2"><Download size={13} /> Open toolkit</Link>}
                            </div>
                          ) : enr ? (
                            <div className="grid gap-2">
                              <Link href={`/talent/academy/${course.slug}`} className="btn-primary text-[12px] block text-center">{lessonsDone > 0 ? `Continue (${lessonsDone}/${course.lessons.length} lessons)` : 'Start course'}</Link>
                              {isManagement && <Link href={`/talent/academy/${course.slug}/toolkit`} className="btn-secondary text-[12px] inline-flex items-center justify-center gap-2"><Download size={13} /> Open toolkit</Link>}
                            </div>
                          ) : (
                            <button type="button" onClick={() => buy(course.slug, course.title)} disabled={busySlug === course.slug} className="btn-primary text-[12px] w-full disabled:opacity-50">
                              {busySlug === course.slug ? 'Taking you to payment...' : `Enrol - £${(coursePrice(course) / 100).toFixed(0)}`}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))
        )}

        <p className="text-[11px] text-muted">Certificates are issued by Wellness House Collective and carry a unique verification code. They evidence course completion and knowledge assessment; they are not a substitute for accredited qualifications or insurance requirements.</p>
      </div>
    </DashboardShell>
  )
}
