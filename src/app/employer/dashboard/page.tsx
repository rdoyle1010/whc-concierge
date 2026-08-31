'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, Users, ArrowRight, Plus, Clock, Calendar, MapPin } from 'lucide-react'
import SkeletonTable from '@/components/SkeletonTable'
import Link from 'next/link'
import SponsoredAd from '@/components/SponsoredAd'

// Time-of-day greeting for the property brief, computed on the client clock.
function timeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function EmployerDashboard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [listings, setListings] = useState<any[]>([])
  const [stats, setStats] = useState({ active: 0, applications: 0, matches: 0, messages: 0 })
  const [recentApps, setRecentApps] = useState<any[]>([])
  const [brief, setBrief] = useState<any>(null)
  const [intel, setIntel] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      // The property brief loads alongside the page data; if it fails the
      // dashboard simply renders without it.
      fetch('/api/employer/brief')
        .then(res => (res.ok ? res.json() : null))
        .then(data => { if (data && !data.error) setBrief(data) })
        .catch(() => { /* the brief is optional */ })
      // Role intelligence is computed live on the server; like the brief,
      // a failure simply means the panel does not render.
      fetch('/api/employer/intelligence')
        .then(res => (res.ok ? res.json() : null))
        .then(data => { if (data && !data.error) setIntel(data) })
        .catch(() => { /* intelligence is optional */ })
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      if (!prof) { setLoading(false); return }

      const { data: jobs } = await supabase.from('job_listings').select('*').eq('employer_id', prof.id).order('posted_date', { ascending: false })
      const normalizedJobs = (jobs || []).map((j: any) => ({
        ...j,
        title: j.job_title || j.title,
        status: j.is_live ? 'active' : 'closed',
      }))
      setListings(normalizedJobs)

      const activeJobs = normalizedJobs.filter(j => j.is_live)
      const jobIds = normalizedJobs.map(j => j.id)

      let appCount = 0
      if (jobIds.length > 0) {
        const { count } = await supabase.from('applications').select('id', { count: 'exact', head: true }).in('role_id', jobIds).neq('status', 'draft')
        appCount = count || 0

        const { data: apps } = await supabase
          .from('applications')
          .select('*, candidate_profiles(full_name, headline)')
          .in('role_id', jobIds)
          .neq('status', 'draft')
          .order('created_at', { ascending: false })
          .limit(5)
        setRecentApps((apps || []).map((a: any) => {
          const job = normalizedJobs.find(j => j.id === a.role_id)
          return { ...a, jobTitle: job?.title || 'Role' }
        }))
      }

      let matchCount = 0
      if (jobIds.length > 0) {
        // The live matches table keys jobs by job_listing_id.
        const current = await supabase.from('matches').select('id', { count: 'exact', head: true }).in('job_listing_id', jobIds)
        matchCount = current.count || 0
      }

      const { count: msgCount } = await supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('read', false)

      setStats({ active: activeJobs.length, applications: appCount, matches: matchCount, messages: msgCount || 0 })
      setLoading(false)
    }
    load()
  }, [])

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  if (loading) return (
    <DashboardShell role="employer">
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-48 bg-surface rounded" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white border border-border rounded-md p-4">
              <div className="h-3 w-6 bg-surface rounded mb-2" />
              <div className="h-6 w-10 bg-surface rounded mb-1" />
              <div className="h-2.5 w-14 bg-surface rounded" />
            </div>
          ))}
        </div>
      </div>
      <div className="mt-6"><SkeletonTable rows={4} /></div>
    </DashboardShell>
  )

  return (
    <DashboardShell role="employer" userName={profile?.contact_name || profile?.company_name}>
      <div className="mb-9">
        <p className="dashboard-eyebrow">Property recruitment</p>
        <h1 className="dashboard-title">{profile?.property_name || profile?.company_name || 'Property dashboard'}</h1>
        <p className="dashboard-intro">Permanent recruitment, urgent agency cover, specialist Residencies and private candidate conversations in one verified property workspace.</p>
      </div>

      {(!profile?.approval_status || profile?.approval_status === 'pending') && (
        <div className="border-l-2 border-amber-500 bg-white/65 px-5 py-4 mb-7 flex items-start gap-3">
          <Clock size={17} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-amber-900">Your property is under review</p>
            <p className="text-[12px] text-amber-700 mt-0.5">You can complete your profile and prepare recruitment activity while approval is being checked.</p>
          </div>
        </div>
      )}

      {(() => {
        const newCandidates: number = brief?.newCandidates || 0
        const awaiting = brief?.applicantsAwaitingReview || { count: 0, byJob: [] }
        const quietRoles = brief?.rolesWithNoApplications || { count: 0, titles: [] }
        const unfilledShifts: number = brief?.unfilledAgencyShifts || 0
        const counters: number = brief?.countersAwaiting || 0
        const hasContent = newCandidates > 0 || awaiting.count > 0 || quietRoles.count > 0 || unfilledShifts > 0 || counters > 0
        if (!hasContent) return null
        return (
          <section className="dashboard-card mb-8">
            <p className="dashboard-eyebrow">Your brief</p>
            <h2 className="dashboard-section-title mb-2">{timeOfDayGreeting()}{brief?.propertyName ? `, ${brief.propertyName}` : ''}.</h2>
            <div>
              {newCandidates > 0 && (
                <div className="dashboard-list-row">
                  <p className="text-[13px] text-ink">
                    <span className="font-medium">{newCandidates}</span> new candidate{newCandidates === 1 ? '' : 's'} this fortnight.{' '}
                    <Link href="/employer/candidates" className="text-accent hover:underline">Browse talent</Link>
                  </p>
                </div>
              )}
              {awaiting.count > 0 && (
                <div className="dashboard-list-row">
                  <div>
                    <p className="text-[13px] text-ink">
                      <span className="font-medium">{awaiting.count}</span> applicant{awaiting.count === 1 ? '' : 's'} awaiting review.{' '}
                      <Link href="/employer/applications" className="text-accent hover:underline">Review now</Link>
                    </p>
                    {awaiting.byJob.length > 0 && (
                      <p className="text-[12px] text-muted mt-0.5">
                        {awaiting.byJob.map((row: any) => `${row.jobTitle} (${row.count})`).join(' · ')}
                      </p>
                    )}
                  </div>
                </div>
              )}
              {quietRoles.count > 0 && (
                <div className="dashboard-list-row">
                  <div>
                    <p className="text-[13px] text-ink">
                      <span className="font-medium">{quietRoles.count}</span> role{quietRoles.count === 1 ? '' : 's'} with no applications yet.{' '}
                      <Link href="/employer/jobs" className="text-accent hover:underline">Review listings</Link>
                    </p>
                    {quietRoles.titles.length > 0 && (
                      <p className="text-[12px] text-muted mt-0.5">{quietRoles.titles.join(' · ')}</p>
                    )}
                  </div>
                </div>
              )}
              {unfilledShifts > 0 && (
                <div className="dashboard-list-row">
                  <p className="text-[13px] text-ink">
                    <span className="font-medium">{unfilledShifts}</span> agency shift{unfilledShifts === 1 ? '' : 's'} unfilled.{' '}
                    <Link href="/employer/agency" className="text-accent hover:underline">Arrange cover</Link>
                  </p>
                </div>
              )}
              {counters > 0 && (
                <div className="dashboard-list-row">
                  <p className="text-[13px] text-ink">
                    <span className="font-medium">{counters}</span> counter{counters === 1 ? '' : 's'} awaiting your response.{' '}
                    <Link href="/employer/agency" className="text-accent hover:underline">Respond</Link>
                  </p>
                </div>
              )}
            </div>
          </section>
        )
      })()}

      {intel && Array.isArray(intel.roles) && intel.roles.length > 0 && (() => {
        const thresholds = intel.thresholds || { conversionViews: 20, comparableRoles: 3, hires: 2, viewWindowDays: 30, abandonedAfterHours: 48 }
        const aggregate = intel.aggregate || {}
        return (
          <section className="dashboard-card mb-8">
            <p className="dashboard-eyebrow">Role intelligence</p>
            <p className="text-[13px] text-secondary mb-5">Computed from live platform activity. Figures appear once samples are large enough to be truthful.</p>

            <div className="space-y-4">
              {intel.roles.map((role: any) => (
                <div key={role.id} className="border border-border p-4">
                  <p className="text-[13px] font-medium text-ink mb-1">{role.title}</p>
                  <div>
                    <div className="flex items-baseline justify-between gap-4 border-t border-border py-2">
                      <span className="text-[12px] text-secondary">Views, last {thresholds.viewWindowDays} days</span>
                      <span className="text-[13px] font-semibold text-ink">{role.views}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 border-t border-border py-2">
                      <span className="text-[12px] text-secondary">Applications received</span>
                      <span className="text-[13px] font-semibold text-ink">{role.applications}</span>
                    </div>
                    <div className="flex items-baseline justify-between gap-4 border-t border-border py-2">
                      <span className="text-[12px] text-secondary">View-to-application conversion</span>
                      {role.conversionPct != null
                        ? <span className="text-[13px] font-semibold text-ink">{role.conversionPct}%</span>
                        : <span className="text-[12px] text-muted">Publishes at {thresholds.conversionViews} role views - currently {role.views}</span>}
                    </div>
                    <div className="flex items-baseline justify-between gap-4 border-t border-border py-2">
                      <span className="text-[12px] text-secondary">Applications started, never submitted ({thresholds.abandonedAfterHours}h+)</span>
                      <span className="text-[13px] font-semibold text-ink">{role.abandoned}</span>
                    </div>
                    {role.quality && (
                      <div className="flex items-baseline justify-between gap-4 border-t border-border py-2">
                        <span className="text-[12px] text-secondary">Average applicant match</span>
                        <span className="text-[13px] font-semibold text-ink">{role.quality.avgScore}% <span className="font-normal text-muted">({role.quality.sample} applicant{role.quality.sample === 1 ? '' : 's'})</span></span>
                      </div>
                    )}
                  </div>
                  <div className="mt-3 space-y-1.5">
                    {role.benchmark ? (
                      <p className="text-[13px] text-ink leading-6">
                        {role.benchmark.pctDiff === 0
                          ? <>Your {role.title} role is receiving applications in line with comparable roles.</>
                          : <>Your {role.title} role is receiving <span className="font-semibold">{Math.abs(role.benchmark.pctDiff)}% {role.benchmark.pctDiff < 0 ? 'fewer' : 'more'}</span> applications than comparable roles.</>}
                        {' '}<span className="text-[11.5px] text-muted">Based on {role.benchmark.comparableCount} comparable live roles at this level.</span>
                      </p>
                    ) : (
                      <p className="text-[12px] text-muted">Benchmark publishes at {thresholds.comparableRoles} comparable live roles - currently {role.benchmarkComparables}.</p>
                    )}
                    {role.salary ? (
                      <p className="text-[13px] text-ink leading-6">
                        {role.salary.pctDiff === 0
                          ? <>Salary is in line with the market median.</>
                          : <>Salary is approximately <span className="font-semibold">{Math.abs(role.salary.pctDiff)}% {role.salary.pctDiff < 0 ? 'below' : 'above'}</span> the market median.</>}
                        {' '}<span className="text-[11.5px] text-muted">Market median £{Number(role.salary.marketMedian).toLocaleString('en-GB')} from {role.salary.sample} advertised salary points at this level, last 12 months.</span>
                      </p>
                    ) : !role.hasSalaryBand ? (
                      <p className="text-[12px] text-muted">Add a salary band to this role to see how it compares with the market.</p>
                    ) : (
                      <p className="text-[12px] text-muted">Salary comparison publishes at {thresholds.comparableRoles} comparable salary points - currently {role.salaryComparables}.</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 border-t border-border pt-3">
              {aggregate.timeToHire ? (
                <p className="text-[13px] text-ink">Median time to hire across your filled roles: <span className="font-semibold">{aggregate.timeToHire.medianDays} day{aggregate.timeToHire.medianDays === 1 ? '' : 's'}</span> <span className="text-[11.5px] text-muted">({aggregate.timeToHire.hires} hires)</span></p>
              ) : (
                <p className="text-[12px] text-muted">Time to hire publishes at {thresholds.hires} completed hires - currently {aggregate.hiresRecorded ?? 0}.</p>
              )}
            </div>
          </section>
        )
      })()}

      <div className="mb-8 grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
        {[
          { label: 'Active listings', value: stats.active },
          { label: 'Applications', value: stats.applications },
          { label: 'Candidates matched', value: stats.matches || '-' },
          { label: 'Unread messages', value: stats.messages },
        ].map(s => (
          <div key={s.label} className="border-t border-border pt-3">
            <p className="text-[10px] uppercase tracking-[.14em] text-muted">{s.label}</p>
            <p className="mt-1 text-[18px] font-serif font-semibold text-ink">{s.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 mb-8">
        <Link href="/employer/post-role" className="btn-primary flex items-center justify-center gap-2 py-3"><Plus size={14} />Post a role</Link>
        <Link href="/employer/agency" className="btn-secondary flex items-center justify-center gap-2 py-3"><Calendar size={14} />Agency cover</Link>
        <Link href="/employer/residency" className="btn-secondary flex items-center justify-center gap-2 py-3"><MapPin size={14} />Residency</Link>
        <Link href="/employer/candidates" className="btn-secondary flex items-center justify-center gap-2 py-3"><Users size={14} />Browse talent</Link>
      </div>

      {(!profile?.nearest_transport && !profile?.commute_car_required && !profile?.parking_available) && (
        <div className="mb-8 border-l-2 border-accent bg-white/65 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[13px] font-medium text-ink">Help professionals plan the journey</p>
            <p className="text-[12px] text-muted mt-0.5">Add nearest transport, walking time, parking and taxi support to your Company Profile.</p>
          </div>
          <Link href="/employer/profile" className="text-[12px] font-medium text-accent whitespace-nowrap">Add travel details →</Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="dashboard-card">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <p className="dashboard-eyebrow !mb-1">Recruitment</p>
              <h2 className="dashboard-section-title">Your listings</h2>
            </div>
            <Link href="/employer/jobs" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">Manage <ArrowRight size={12} /></Link>
          </div>
          {listings.length === 0 ? (
            <div className="text-center py-9 border-t border-border">
              <Briefcase size={22} className="mx-auto text-muted mb-2" />
              <p className="text-[13px] text-muted mb-4">No listings yet.</p>
              <Link href="/employer/post-role" className="btn-primary text-[12px]">Post your first role</Link>
            </div>
          ) : (
            <div>
              {listings.slice(0, 5).map(job => (
                <div key={job.id} className="dashboard-list-row">
                  <div>
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-[13px] font-medium text-ink">{job.title}</p>
                      <span className={tierClass(job.tier || 'Standard')}>{job.tier || '-'}</span>
                    </div>
                    <p className="text-[11px] text-muted">{job.location} · {job.contract_type?.replace('_', ' ') || job.job_type}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-[.08em] ${job.is_live ? 'text-emerald-700' : 'text-muted'}`}>{job.is_live ? 'Live' : 'Closed'}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="dashboard-card">
          <div className="flex items-end justify-between gap-3 mb-4">
            <div>
              <p className="dashboard-eyebrow !mb-1">Talent pipeline</p>
              <h2 className="dashboard-section-title">Recent applications</h2>
            </div>
            <Link href="/employer/applications" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">View all <ArrowRight size={12} /></Link>
          </div>
          {recentApps.length === 0 ? (
            <p className="text-[13px] text-muted text-center py-9 border-t border-border">No applications yet.</p>
          ) : (
            <div>
              {recentApps.map(app => (
                <div key={app.id} className="dashboard-list-row">
                  <div>
                    <p className="text-[13px] font-medium text-ink">{app.candidate_profiles?.full_name || 'Candidate'}</p>
                    <p className="text-[11px] text-muted">For: {app.jobTitle} {app.match_score ? `· ${app.match_score}% match` : ''}</p>
                  </div>
                  <span className={`text-[10px] font-semibold uppercase tracking-[.08em] ${app.status === 'pending' ? 'text-amber-700' : app.status === 'shortlisted' ? 'text-emerald-700' : 'text-muted'}`}>{app.status}</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
          <SponsoredAd placement="employer_dashboard_sponsor" />
    </DashboardShell>
  )
}
