'use client'

import { Fragment, useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { ACADEMY, COURSE_PRICE, BUNDLE_PRICE } from '@/lib/academy'
import { lessonExtras } from '@/lib/academy-extras'
import { GraduationCap, ChevronDown, Award, UserPlus } from 'lucide-react'

// The Academy back office: every course, every learner, revenue, and full
// control - preview the training itself, grant courses free, award
// certificates manually, revoke if ever needed.

export default function AdminAcademyPage() {
  const [rows, setRows] = useState<any[]>([])
  const [courses, setCourses] = useState<any[]>([])
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [previewSlug, setPreviewSlug] = useState<string | null>(null)
  const [grantCand, setGrantCand] = useState('')
  const [grantCourse, setGrantCourse] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/admin/academy')
      if (res.ok) {
        const j = await res.json()
        setRows(j.enrollments || [])
        setCourses(j.courses || [])
        setCandidates(j.candidates || [])
      }
    } catch { /* empty state */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function act(payload: Record<string, any>, busyKey: string, doneMsg: string) {
    setError(''); setNotice('')
    setBusyId(busyKey)
    try {
      const res = await fetch('/api/admin/academy', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not update.'); return }
      setNotice(doneMsg)
      await load()
    } catch { setError('Something went wrong - please try again.') } finally { setBusyId(null) }
  }

  const totalRevenue = rows.filter(r => r.paid_at).reduce((s, r) => s + (r.amount_paid || 0), 0)
  const totalEnrolments = rows.filter(r => r.paid_at).length
  const totalCerts = rows.filter(r => r.completed_at).length

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="flex items-center gap-2 mb-2">
        <GraduationCap size={22} className="text-accent" />
        <h1 className="text-2xl font-serif font-bold text-ink">Academy</h1>
      </div>
      <p className="text-[13px] text-gray-500 mb-6">Your training business, end to end: courses, learners, revenue and certificates. £{(COURSE_PRICE / 100).toFixed(0)} per course, bundle at £{(BUNDLE_PRICE / 100).toFixed(0)}.</p>

      {notice && <div className="bg-green-50 text-green-700 text-sm px-4 py-3 rounded-lg mb-4">{notice}</div>}
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-4">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
            <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Course revenue</p><p className="text-[22px] font-semibold text-ink">£{(totalRevenue / 100).toFixed(2)}</p></div>
            <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Paid enrolments</p><p className="text-[22px] font-semibold text-ink">{totalEnrolments}</p></div>
            <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Certificates issued</p><p className="text-[22px] font-semibold text-green-700">{totalCerts}</p></div>
          </div>

          {/* Enrol a therapist (comp) */}
          <div className="dashboard-card mb-8">
            <h2 className="text-[16px] font-medium text-ink mb-1 flex items-center gap-2"><UserPlus size={16} className="text-accent" /> Enrol a therapist</h2>
            <p className="text-[12px] text-gray-500 mb-3">Grant any course free of charge - launch offers, goodwill, or training you have arranged directly. They are notified immediately.</p>
            <div className="flex flex-col sm:flex-row gap-2">
              <select value={grantCand} onChange={e => setGrantCand(e.target.value)} className="input-field text-[13px] flex-1">
                <option value="">Choose a therapist...</option>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.full_name}</option>)}
              </select>
              <select value={grantCourse} onChange={e => setGrantCourse(e.target.value)} className="input-field text-[13px] flex-1">
                <option value="">Choose a course...</option>
                {ACADEMY.map(c => <option key={c.slug} value={c.slug}>{c.title}</option>)}
              </select>
              <button disabled={!grantCand || !grantCourse || busyId === 'grant'}
                onClick={() => act({ action: 'grant', candidateId: grantCand, courseSlug: grantCourse }, 'grant', 'Enrolled - the therapist has been notified.')}
                className="btn-primary text-[13px] shrink-0 disabled:opacity-50">{busyId === 'grant' ? 'Enrolling...' : 'Enrol free'}</button>
            </div>
          </div>

          {/* Course catalogue performance + content preview */}
          <h2 className="text-[16px] font-medium text-ink mb-3">Courses</h2>
          <div className="dashboard-card overflow-x-auto mb-8">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-border">
                  <th className="py-2 pr-4">Course</th>
                  <th className="py-2 pr-4">Category</th>
                  <th className="py-2 pr-4 text-right">Enrolments</th>
                  <th className="py-2 pr-4 text-right">Certificates</th>
                  <th className="py-2 pr-4 text-right">Revenue</th>
                  <th className="py-2"></th>
                </tr>
              </thead>
              <tbody>
                {courses.map(c => {
                  const full = ACADEMY.find(a => a.slug === c.slug)
                  const open = previewSlug === c.slug
                  return (
                    <Fragment key={c.slug}>
                      <tr className="border-b border-border/60">
                        <td className="py-2.5 pr-4 font-medium text-ink">{c.title}</td>
                        <td className="py-2.5 pr-4 text-gray-500">{c.category}</td>
                        <td className="py-2.5 pr-4 text-right">{c.enrolments}</td>
                        <td className="py-2.5 pr-4 text-right">{c.completions}</td>
                        <td className="py-2.5 pr-4 text-right">£{(c.revenue / 100).toFixed(2)}</td>
                        <td className="py-2.5 text-right">
                          <button onClick={() => setPreviewSlug(open ? null : c.slug)}
                            className={`text-[11px] font-medium hover:underline ${open ? 'text-ink' : 'text-accent'}`}>{open ? 'Close' : 'View content'}</button>
                        </td>
                      </tr>
                      {open && full && (
                        <tr className="border-b border-border/60 bg-surface/60">
                          <td colSpan={6} className="py-4 px-2">
                            <p className="text-[12px] text-gray-500 mb-3">{full.tagline} · ~{full.minutes} min · {full.lessons.length} lessons · {full.quiz.length}-question quiz (80% to pass)</p>
                            <div className="space-y-2">
                              {full.lessons.map((l, i) => (
                                <details key={i} className="border border-border rounded-lg bg-white">
                                  <summary className="px-4 py-2.5 text-[13px] font-medium text-ink cursor-pointer flex items-center justify-between">Lesson {i + 1}: {l.title}<ChevronDown size={14} className="text-gray-400" /></summary>
                                  <div className="px-4 pb-4 text-[13px] text-gray-600 leading-[1.8] whitespace-pre-line border-t border-border/60 pt-3">{l.content}</div>
                                  {(() => {
                                    const ex = lessonExtras(full.slug, i)
                                    if (!ex) return null
                                    return (
                                      <div className="px-4 pb-4 space-y-2">
                                        <p className="text-[12px] italic text-gray-500 bg-[#FDF6EC] border border-accent/20 rounded-lg p-3">Guest&apos;s view: {ex.guestView}</p>
                                        <p className="text-[12px] text-gray-500">Career benefit: {ex.helpsYou}</p>
                                        <p className="text-[12px] text-gray-500">Quick tips: {ex.tips.join(' · ')}</p>
                                      </div>
                                    )
                                  })()}
                                </details>
                              ))}
                              <details className="border border-border rounded-lg bg-white">
                                <summary className="px-4 py-2.5 text-[13px] font-medium text-ink cursor-pointer flex items-center justify-between">Final quiz ({full.quiz.length} questions)<ChevronDown size={14} className="text-gray-400" /></summary>
                                <div className="px-4 pb-4 pt-3 border-t border-border/60 space-y-3">
                                  {full.quiz.map((q, i) => (
                                    <div key={i}>
                                      <p className="text-[13px] font-medium text-ink">{i + 1}. {q.q}</p>
                                      <p className="text-[12px] text-gray-500">{q.options.join(' · ')}</p>
                                    </div>
                                  ))}
                                  <p className="text-[11px] text-gray-400">Answer keys are held server-side only and are never shown here or in the browser.</p>
                                </div>
                              </details>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Learners */}
          <h2 className="text-[16px] font-medium text-ink mb-3">Learners ({rows.filter(r => r.paid_at).length})</h2>
          {rows.filter(r => r.paid_at).length === 0 ? (
            <div className="dashboard-card text-center py-12 text-gray-400">
              <GraduationCap size={40} className="mx-auto mb-3 opacity-30" />
              <p>No enrolments yet - the catalogue is live and waiting.</p>
            </div>
          ) : (
            <div className="dashboard-card overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-border">
                    <th className="py-2 pr-4">Therapist</th>
                    <th className="py-2 pr-4">Course</th>
                    <th className="py-2 pr-4">Paid</th>
                    <th className="py-2 pr-4">Progress</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.filter(r => r.paid_at).map(r => (
                    <tr key={r.id} className="border-b border-border/60">
                      <td className="py-2.5 pr-4 font-medium text-ink capitalize">{r.candidate_name}</td>
                      <td className="py-2.5 pr-4">{ACADEMY.find(c => c.slug === r.course_slug)?.title || r.course_slug}</td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">£{((r.amount_paid || 0) / 100).toFixed(2)}{r.amount_paid === 0 ? ' (comp)' : ''} · {new Date(r.paid_at).toLocaleDateString('en-GB')}</td>
                      <td className="py-2.5 pr-4">{r.lessons_done}/{r.lessons_total} lessons{r.quiz_score != null ? ` · quiz ${r.quiz_score}%` : ''}</td>
                      <td className="py-2.5 pr-4">
                        {r.completed_at
                          ? <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-green-50 text-green-700"><Award size={11} /> Certified · {r.certificate_code}</span>
                          : <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700">In progress</span>}
                      </td>
                      <td className="py-2.5 text-right whitespace-nowrap">
                        {r.completed_at ? (
                          <button onClick={() => { const reason = window.prompt('Reason shown to the therapist (optional):') ?? ''; act({ action: 'revoke', id: r.id, reason }, r.id, 'Certificate withdrawn.') }} disabled={busyId === r.id}
                            className="text-[11px] font-medium text-red-500 hover:underline disabled:opacity-50">Revoke</button>
                        ) : (
                          <button onClick={() => act({ action: 'award', id: r.id }, r.id, 'Certificate awarded - the therapist has been notified.')} disabled={busyId === r.id}
                            className="text-[11px] font-medium text-green-700 hover:underline disabled:opacity-50">Award certificate</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}
