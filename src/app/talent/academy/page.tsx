'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { ACADEMY, COURSE_PRICE, BUNDLE_PRICE } from '@/lib/academy'
import { GraduationCap, Award, Clock, Check } from 'lucide-react'

// WHC Academy catalogue - £10 courses, certificate + profile badge on
// completion. Employers see earned badges in the directory and on profiles.

export default function AcademyPage() {
  const [enrollments, setEnrollments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busySlug, setBusySlug] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  async function load() {
    try {
      const [aRes, sRes] = await Promise.all([
        fetch('/api/academy'),
        fetch('/api/agency/settings'),
      ])
      if (aRes.ok) {
        const j = await aRes.json()
        setEnrollments(j.enrollments || [])
      }
      if (sRes.ok) {
        const s = await sRes.json()
        setProfileId(s.settings?.profile_id || null)
      }
    } catch { /* empty catalogue state */ }
    setLoading(false)
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

  const categories = Array.from(new Set(ACADEMY.map(c => c.category)))

  return (
    <DashboardShell role="talent">
      <div className="max-w-4xl">
        <div className="flex items-center gap-2 mb-2">
          <GraduationCap size={22} className="text-accent" />
          <h1 className="text-2xl font-serif font-bold text-ink">WHC Academy</h1>
        </div>
        <p className="text-[13px] text-gray-500 mb-6 max-w-2xl">
          Short, serious courses written for luxury spa professionals. £{(COURSE_PRICE / 100).toFixed(0)} each. Pass the final quiz (80%) and you earn a certificate - and the badge appears on your profile, where properties can see exactly what you&apos;ve trained in before they book you.
        </p>

        {notice && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{notice}</div>}
        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

        {/* Bundle - shown until they own every course */}
        {!loading && enrollments.filter(e => e.paid_at).length < ACADEMY.length && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-ink rounded-xl px-5 py-4 mb-6">
            <div>
              <p className="text-[14px] font-medium text-white">The Complete Academy - all {ACADEMY.length} courses for £{(BUNDLE_PRICE / 100).toFixed(0)}</p>
              <p className="text-[12px] text-white/60 mt-0.5">Save £{((ACADEMY.length * COURSE_PRICE - BUNDLE_PRICE) / 100).toFixed(0)} against buying individually. Eleven certificates, eleven badges - a profile that hires itself.</p>
            </div>
            <button onClick={buyBundle} disabled={busySlug === '__bundle__'}
              className="btn-primary !bg-gold !text-ink text-[12px] shrink-0 disabled:opacity-50">
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {ACADEMY.filter(c => c.category === cat).map(course => {
                  const enr = enrolmentFor(course.slug)
                  const done = Boolean(enr?.completed_at)
                  const lessonsDone = enr ? Object.keys(enr.progress || {}).length : 0
                  return (
                    <div key={course.slug} className={`dashboard-card flex flex-col ${done ? 'border-green-200 ring-1 ring-green-100' : ''}`}>
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <h3 className="font-serif text-[17px] font-semibold text-ink leading-snug">{course.title}</h3>
                        {done && <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide bg-green-600 text-white px-2 py-0.5 rounded-full shrink-0"><Check size={10} /> Certified</span>}
                      </div>
                      <p className="text-[12px] text-gray-500 mb-2">{course.tagline}</p>
                      <p className="text-[11px] text-gray-400 mb-4 inline-flex items-center gap-1"><Clock size={11} /> ~{course.minutes} min · {course.lessons.length} lessons · final quiz</p>
                      <div className="mt-auto">
                        {done ? (
                          <div className="flex items-center gap-3">
                            <Link href={`/talent/academy/${course.slug}`} className="btn-secondary text-[12px] flex-1 text-center">Review course</Link>
                            <Link href={`/talent/academy/certificate/${course.slug}`} className="btn-primary text-[12px] flex-1 text-center">Certificate</Link>
                          </div>
                        ) : enr ? (
                          <Link href={`/talent/academy/${course.slug}`} className="btn-primary text-[12px] block text-center">
                            {lessonsDone > 0 ? `Continue (${lessonsDone}/${course.lessons.length} lessons)` : 'Start course'}
                          </Link>
                        ) : (
                          <button onClick={() => buy(course.slug, course.title)} disabled={busySlug === course.slug}
                            className="btn-primary text-[12px] w-full disabled:opacity-50">
                            {busySlug === course.slug ? 'Taking you to payment...' : `Enrol - £${(COURSE_PRICE / 100).toFixed(0)}`}
                          </button>
                        )}
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
