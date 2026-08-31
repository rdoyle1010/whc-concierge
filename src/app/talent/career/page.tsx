'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { TrendingUp, Lock, Check, X, GraduationCap, Target, BarChart3, Eye, ArrowUpRight } from 'lucide-react'

// Career Intelligence: the Pro tool that answers three questions with live
// platform data - where do I sit, what is the market asking for, and which
// course moves me forward. Salary signals appear only when the sample size
// clears the WHC credibility thresholds.

export default function CareerIntelligencePage() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch('/api/talent/career')
      .then(async res => {
        const json = await res.json()
        if (!res.ok) { setError(json.error || 'Could not load career intelligence.'); return }
        setData(json)
      })
      .catch(() => setError('Could not load career intelligence.'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <DashboardShell role="talent">
      <div className="max-w-4xl">
        <p className="dashboard-eyebrow">Your career</p>
        <h1 className="dashboard-title">Career Intelligence</h1>
        <p className="dashboard-intro max-w-2xl mb-7">Where you sit, what the live market is asking for, and exactly which skills and courses move you to the next level - built from real roles on the platform, not generic careers advice.</p>

        {error && <div className="mb-5 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div>}
        {loading ? <div className="skeleton h-44" /> : data && (
          <div className="space-y-5">
            <div className="dashboard-card">
              <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-accent mb-2 inline-flex items-center gap-1.5"><Target size={13} /> Where you sit</p>
              <p className="text-[15px] text-ink font-medium">{data.position?.currentLabel || 'Professional'}</p>
              <p className="mt-1 text-[13px] text-secondary">Your next step on the WHC career ladder: <span className="font-semibold text-ink">{data.position?.nextLabel}</span>.</p>
            </div>

            {!data.pro ? (
              <div className="dashboard-card">
                <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-accent mb-2 inline-flex items-center gap-1.5"><Lock size={13} /> Unlock the full picture with Pro</p>
                <p className="text-[13px] text-secondary leading-6">There {data.teaser?.liveRoles === 1 ? 'is' : 'are'} <span className="font-semibold text-ink">{data.teaser?.liveRoles ?? 0} live role{data.teaser?.liveRoles === 1 ? '' : 's'}</span> on the platform right now. The most requested skills this week: <span className="font-semibold text-ink">{(data.teaser?.topSkills || []).join(', ') || 'updating'}</span>.{typeof data.teaser?.gapCount === 'number' && data.teaser.gapCount > 0 && <> Your profile is missing <span className="font-semibold text-ink">{data.teaser.gapCount}</span> of the market&apos;s most-demanded skills.</>}</p>
                <p className="mt-3 text-[13px] text-secondary">Pro shows you every in-demand skill against your profile, the course that closes each gap, demand at your level and the level above, and salary signals as the data builds.</p>
                <Link href="/talent/membership" className="btn-primary mt-4 inline-block text-[13px]">Upgrade to Pro - £19.99/month</Link>
              </div>
            ) : (
              <>
                {data.profileViews && (
                  <div className="dashboard-card">
                    <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-accent mb-2 inline-flex items-center gap-1.5"><Eye size={13} /> Who is looking at you</p>
                    {data.profileViews.week.employers > 0 ? (
                      <>
                        <p className="text-[13px] text-ink">Your profile was viewed by <span className="font-semibold">{data.profileViews.week.employers} employer{data.profileViews.week.employers === 1 ? '' : 's'}</span> this week.</p>
                        <p className="mt-1 text-[11.5px] text-muted">{data.profileViews.week.views} view{data.profileViews.week.views === 1 ? '' : 's'} in the last 7 days · {data.profileViews.month.views} in the last 30 days from {data.profileViews.month.employers} employer{data.profileViews.month.employers === 1 ? '' : 's'}. Counted from verified employer accounts only.</p>
                      </>
                    ) : data.profileViews.month.employers > 0 ? (
                      <>
                        <p className="text-[13px] text-ink">Your profile was viewed by <span className="font-semibold">{data.profileViews.month.employers} employer{data.profileViews.month.employers === 1 ? '' : 's'}</span> in the last 30 days.</p>
                        <p className="mt-1 text-[11.5px] text-muted">{data.profileViews.month.views} view{data.profileViews.month.views === 1 ? '' : 's'} in total. Counted from verified employer accounts only.</p>
                      </>
                    ) : (
                      <p className="text-[13px] text-secondary">No employer views yet this week - a complete portfolio changes this.</p>
                    )}
                  </div>
                )}

                <div className="dashboard-card">
                  <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-accent mb-3 inline-flex items-center gap-1.5"><TrendingUp size={13} /> Live market demand</p>
                  <div className="mb-4 grid grid-cols-3 gap-3 text-center">
                    <div className="border border-border p-3"><p className="text-[22px] font-semibold text-ink">{data.market.liveRoles}</p><p className="text-[10px] uppercase tracking-wide text-muted mt-1">Live roles</p></div>
                    <div className="border border-border p-3"><p className="text-[22px] font-semibold text-ink">{data.market.rolesAtLevel}</p><p className="text-[10px] uppercase tracking-wide text-muted mt-1">At your level</p></div>
                    <div className="border border-border p-3"><p className="text-[22px] font-semibold text-ink">{data.market.rolesNextLevel}</p><p className="text-[10px] uppercase tracking-wide text-muted mt-1">At the next level</p></div>
                  </div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted mb-2">Most requested skills across live roles</p>
                  <div className="space-y-1.5">
                    {(data.market.topDemand || []).map((entry: any) => (
                      <div key={entry.skill} className="flex items-center justify-between gap-3 border-b border-border/60 pb-1.5">
                        <span className="text-[13px] text-ink">{entry.skill} <span className="text-muted">· {entry.count} role{entry.count === 1 ? '' : 's'}</span></span>
                        {entry.covered
                          ? <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-green-700"><Check size={12} /> On your profile</span>
                          : <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-600"><X size={12} /> Missing</span>}
                      </div>
                    ))}
                    {!(data.market.topDemand || []).length && <p className="text-[13px] text-muted">No live roles to analyse yet - check back as listings grow.</p>}
                  </div>
                </div>

                <div className="dashboard-card">
                  <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-accent mb-3 inline-flex items-center gap-1.5"><GraduationCap size={13} /> Close the gaps</p>
                  {(data.recommendations || []).length ? (
                    <div className="grid gap-3 md:grid-cols-2">
                      {data.recommendations.map((course: any) => (
                        <div key={course.slug} className="flex flex-col border border-border p-4">
                          <p className="text-[13px] font-semibold text-ink">{course.title}</p>
                          <p className="mt-0.5 text-[11px] text-muted">{course.level} · ~{course.minutes} min</p>
                          {course.closes.length > 0 && <p className="mt-1.5 text-[11.5px] text-secondary">Closes: {course.closes.join(', ')}</p>}
                          <Link href={`/talent/academy/${course.slug}`} className="btn-secondary mt-3 w-fit text-[12px]">View course</Link>
                        </div>
                      ))}
                    </div>
                  ) : <p className="text-[13px] text-secondary">No gaps against current market demand - your profile covers the most requested skills. Keep an eye here as new roles arrive.</p>}
                </div>

                {(data.matchUplift?.skills || []).length > 0 && (
                  <div className="dashboard-card">
                    <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-accent mb-3 inline-flex items-center gap-1.5"><ArrowUpRight size={13} /> What one skill changes</p>
                    <div>
                      {data.matchUplift.skills.map((entry: any) => (
                        <div key={entry.skill} className="border-t border-border/60 py-2 first:border-t-0">
                          <p className="text-[13px] text-ink">Adding <span className="font-semibold">{entry.skill}</span> would raise your {data.matchUplift.threshold}%+ matches from <span className="font-semibold">{entry.from}</span> to <span className="font-semibold">{entry.to}</span>.</p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-2 text-[11.5px] text-muted">Recomputed with the real matching engine against {data.matchUplift.sampledJobs === data.matchUplift.totalLiveJobs ? `all ${data.matchUplift.totalLiveJobs} live roles` : `the ${data.matchUplift.sampledJobs} most recent of ${data.matchUplift.totalLiveJobs} live roles`} - not an estimate.</p>
                  </div>
                )}

                <div className="dashboard-card">
                  <p className="text-[10px] uppercase tracking-[0.16em] font-semibold text-accent mb-2 inline-flex items-center gap-1.5"><BarChart3 size={13} /> Salary signal</p>
                  {data.salary?.suppressed ? (
                    <p className="text-[13px] text-secondary leading-6">Not enough advertised-salary data at your level yet to show an honest figure ({data.salary.sample} record{data.salary.sample === 1 ? '' : 's'} so far; we publish nothing below 30). This fills in automatically as roles are posted - an empty state here is deliberate, because we never show a number we cannot defend.</p>
                  ) : (
                    <div className="text-[13px] text-secondary leading-6">
                      {data.salary.p25 != null && data.salary.p75 != null && data.salary.p25 !== data.salary.p75 && (
                        <p className="mb-2 text-ink">Candidates at your level are typically earning <span className="text-[17px] font-semibold">£{Number(data.salary.p25).toLocaleString('en-GB')}-£{Number(data.salary.p75).toLocaleString('en-GB')}</span> <span className="text-[11.5px] text-muted font-normal">(the middle half of {data.salary.sample} advertised roles on WHC, last 12 months)</span></p>
                      )}
                      <p>Median advertised salary at your level over the last 12 months: <span className="text-[17px] font-semibold text-ink">£{Number(data.salary.median).toLocaleString('en-GB')}</span></p>
                      <p className="mt-1 text-[11.5px] text-muted">Based on {data.salary.sample} advertised roles{data.salary.confidence === 'early_signal' ? ' - early signal, treat as directional' : ''}.</p>
                      {data.salary.yourExpectation && <p className="mt-2">Your stated expectation: £{Number(data.salary.yourExpectation).toLocaleString('en-GB')} (private to you).</p>}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
