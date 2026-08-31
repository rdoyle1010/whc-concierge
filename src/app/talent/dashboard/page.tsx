'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { Star, ArrowRight, EyeOff } from 'lucide-react'
import SponsoredAd from '@/components/SponsoredAd'

// Talent home - the landing page after login. Greeting, a few live counts
// (best-effort - failures are silent) and quick links into the main areas.

// Time-of-day greeting for the personal brief. Computed on the client so it
// reflects the professional's own clock.
function timeOfDayGreeting(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

export default function TalentDashboard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ applications: 0, messages: 0 })
  const [brief, setBrief] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [approaches, setApproaches] = useState<any[]>([])
  const [approachBusy, setApproachBusy] = useState('')
  const [approachNote, setApproachNote] = useState('')

  // Confidential approaches: a property has asked for an introduction to this
  // private profile. Accepting reveals the full profile and opens messaging.
  async function respondToApproach(employerId: string, action: 'accept' | 'decline') {
    if (approachBusy) return
    setApproachBusy(`${action}:${employerId}`)
    setApproachNote('')
    try {
      const res = await fetch('/api/private-approach', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, employerId }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setApproachNote(body.error || 'Could not record your response - please try again.'); return }
      setApproaches(prev => prev.filter(a => a.employer_id !== employerId))
      setApproachNote(action === 'accept'
        ? 'Introduction accepted. The property can now see your full profile and message you.'
        : 'Approach declined. The property learns nothing about who you are.')
    } catch {
      setApproachNote('Could not record your response - please try again.')
    } finally {
      setApproachBusy('')
    }
  }

  useEffect(() => {
    async function load() {
      // The personal brief loads alongside the page data; if it fails the
      // dashboard simply renders without it.
      fetch('/api/talent/brief')
        .then(res => (res.ok ? res.json() : null))
        .then(data => { if (data && !data.error) setBrief(data) })
        .catch(() => { /* the brief is optional */ })
      fetch('/api/private-approach')
        .then(res => (res.ok ? res.json() : null))
        .then(data => { if (data && Array.isArray(data.approaches)) setApproaches(data.approaches) })
        .catch(() => { /* the card simply does not render */ })
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { setLoading(false); return }

        const { data: prof } = await supabase
          .from('candidate_profiles')
          .select('id, full_name, headline, approval_status, is_featured, stealth_mode, profile_visible, travel_radius_miles')
          .eq('user_id', user.id)
          .maybeSingle()
        setProfile(prof)

        try {
          const [appsRes, msgsRes] = await Promise.all([
            prof?.id
              ? supabase.from('applications').select('id', { count: 'exact', head: true }).eq('candidate_id', prof.id).neq('status', 'draft').is('archived_at', null)
              : Promise.resolve({ count: 0 } as any),
            supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('read', false),
          ])
          setStats({
            applications: appsRes?.count || 0,
            messages: msgsRes?.count || 0,
          })
        } catch { /* counts stay at zero */ }
      } catch { /* show the page regardless */ }
      setLoading(false)
    }
    load()
  }, [])

  // The sidebar already navigates everywhere - this list keeps only the
  // destinations a professional actually opens daily.
  const quickLinks = [
    { label: 'Browse Jobs', desc: 'Find your next permanent or fixed-term role.', href: '/talent/jobs' },
    { label: 'Agency Shifts', desc: 'Manage planned cover and urgent shift offers.', href: '/talent/agency' },
    { label: 'Applications', desc: 'Track every role you have applied for.', href: '/talent/applications' },
    { label: 'Messages', desc: 'Private conversations with properties and matches.', href: '/talent/messages' },
    { label: 'Academy', desc: 'Courses, certificates and profile badges.', href: '/talent/academy' },
    { label: 'My Profile', desc: 'Keep your professional profile polished and current.', href: '/talent/profile' },
  ]

  if (loading) return (
    <DashboardShell role="talent">
      <div className="animate-pulse space-y-6">
        <div className="h-6 w-48 bg-surface rounded" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white border border-border p-5 rounded-md">
              <div className="h-4 w-24 bg-surface rounded mb-3" />
              <div className="h-3 w-40 bg-surface rounded" />
            </div>
          ))}
        </div>
      </div>
    </DashboardShell>
  )

  const briefRoles: any[] = brief?.newMatchingRoles || []
  const briefCourses: any[] = brief?.strengthenCourses || []
  const briefInterview = brief?.upcomingInterview || null
  const briefOffers: number = brief?.offersAwaiting || 0
  const briefViews: number | null = typeof brief?.profileViews === 'number' ? brief.profileViews : null
  const briefFirstName = brief?.firstName || (profile?.full_name ? profile.full_name.split(' ')[0] : null)

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      <section className="dashboard-card mb-8">
          <p className="dashboard-eyebrow">Your brief</p>
          <h2 className="dashboard-section-title mb-2">{timeOfDayGreeting()}{briefFirstName ? `, ${briefFirstName}` : ''}.</h2>
          <div className="mt-4 mb-2 grid max-w-md grid-cols-2 gap-x-8">
            <div className="border-t border-border pt-3">
              <p className="text-[10px] uppercase tracking-[.14em] text-muted">Applications</p>
              <p className="mt-1 text-[18px] font-serif font-semibold text-ink">{stats.applications}</p>
            </div>
            <div className="border-t border-border pt-3">
              <p className="text-[10px] uppercase tracking-[.14em] text-muted">Unread messages</p>
              <p className="mt-1 text-[18px] font-serif font-semibold text-ink">{stats.messages}</p>
            </div>
          </div>
          <div>
            {briefRoles.length > 0 && (
              <div className="dashboard-list-row">
                <div>
                  <p className="text-[13px] font-medium text-ink">{briefRoles.length} new role{briefRoles.length === 1 ? '' : 's'} match your profile</p>
                  <p className="text-[12px] text-muted mt-0.5">
                    {briefRoles.map((role: any, index: number) => (
                      <span key={role.jobId}>
                        {index > 0 && <span> · </span>}
                        <Link href={`/jobs/${role.jobId}`} className="text-accent hover:underline">{role.property} - {role.score}%</Link>
                      </span>
                    ))}
                  </p>
                </div>
              </div>
            )}
            {briefCourses.map((course: any) => (
              <div key={course.slug} className="dashboard-list-row">
                <p className="text-[13px] text-ink">
                  Complete <Link href={`/talent/academy/${course.slug}`} className="font-medium text-accent hover:underline">{course.title}</Link> to strengthen {course.strengthens} application{course.strengthens === 1 ? '' : 's'}
                </p>
              </div>
            ))}
            {briefInterview && (
              <div className="dashboard-list-row">
                <p className="text-[13px] text-ink">
                  Interview ahead: <span className="font-medium">{briefInterview.jobTitle}</span>
                  {briefInterview.property ? ` at ${briefInterview.property}` : ''}
                  {briefInterview.selectedSlot ? ` on ${new Date(briefInterview.selectedSlot).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })}` : ''}
                  {briefInterview.method ? ` (${briefInterview.method})` : ''}.{' '}
                  <Link href="/talent/applications" className="text-accent hover:underline">View details</Link>
                </p>
              </div>
            )}
            {briefViews !== null && briefViews > 0 && (
              <div className="dashboard-list-row">
                <p className="text-[13px] text-ink">{briefViews} employer view{briefViews === 1 ? '' : 's'} of your profile in the last fortnight</p>
              </div>
            )}
            {briefOffers > 0 && (
              <div className="dashboard-list-row">
                <p className="text-[13px] text-ink">
                  {briefOffers} agency shift offer{briefOffers === 1 ? '' : 's'} awaiting your response.{' '}
                  <Link href="/talent/agency" className="text-accent hover:underline">Respond</Link>
                </p>
              </div>
            )}
          </div>
      </section>

      {(approaches.length > 0 || approachNote) && (
        <section className="dashboard-card mb-8">
          <p className="dashboard-eyebrow">Private Career Mode</p>
          <h2 className="dashboard-section-title mb-1">Confidential approaches</h2>
          <p className="text-[12px] text-muted mb-2">A property would like an introduction. Accepting reveals your full profile to that property and opens messaging - declining tells them nothing about who you are.</p>
          {approachNote && <p className="text-[12px] text-ink border border-border bg-surface px-3 py-2 mb-2">{approachNote}</p>}
          <div>
            {approaches.map(approach => (
              <div key={approach.employer_id} className="dashboard-list-row flex-wrap gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-ink truncate">{approach.property_name}</p>
                  <p className="text-[12px] text-muted mt-0.5">
                    {approach.location ? `${approach.location} · ` : ''}
                    <Link href={`/properties/${approach.employer_id}`} className="text-accent hover:underline">View property</Link>
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button type="button" disabled={!!approachBusy} onClick={() => respondToApproach(approach.employer_id, 'accept')}
                    className="px-3 py-2 bg-[#0b2f4d] text-white text-[12px] font-medium disabled:opacity-50">
                    {approachBusy === `accept:${approach.employer_id}` ? 'Accepting...' : 'Accept introduction'}
                  </button>
                  <button type="button" disabled={!!approachBusy} onClick={() => respondToApproach(approach.employer_id, 'decline')}
                    className="px-3 py-2 border border-border bg-white text-secondary text-[12px] font-medium hover:text-ink disabled:opacity-50">
                    {approachBusy === `decline:${approach.employer_id}` ? 'Declining...' : 'Decline'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <div className="mb-9">
        <p className="dashboard-eyebrow">Your career</p>
        <h1 className="dashboard-title">
          {profile?.full_name ? `Welcome back, ${profile.full_name.split(' ')[0]}` : 'Welcome back'}
        </h1>
        <p className="dashboard-intro">Permanent roles, flexible work, private conversations and your professional profile in one workspace.</p>
      </div>

      {profile && profile.approval_status && profile.approval_status !== 'approved' && (
        <div className="border-l-2 border-amber-500 bg-white/65 px-5 py-4 mb-7 flex items-start gap-3">
          <Star size={17} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-[13px] font-medium text-amber-900">Your profile is under review</p>
            <p className="text-[12px] text-amber-700 mt-0.5">You can browse roles and complete your profile while approval is being checked.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_.85fr] gap-6">
        <section className="dashboard-panel">
          <p className="dashboard-eyebrow">Continue your journey</p>
          <h2 className="dashboard-section-title mb-4">Career workspace</h2>
          <div>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} className="dashboard-list-row group">
                <span><span className="block text-[13px] font-medium text-ink">{link.label}</span><span className="block text-[12px] text-muted mt-0.5">{link.desc}</span></span>
                <ArrowRight size={14} className="text-muted group-hover:text-accent shrink-0" />
              </Link>
            ))}
          </div>
        </section>

        <aside className="dashboard-panel bg-[#0b2f4d] !border-[#0b2f4d] text-white">
          <EyeOff size={19} className="text-white/80 mb-5" />
          <p className="text-[9px] uppercase tracking-[.2em] text-white/48 mb-2">Profile privacy</p>
          <h2 className="text-[28px] !text-white mb-3">{profile?.stealth_mode ? 'Stealth Mode is on' : 'Control who sees you'}</h2>
          <p className="text-[12px] leading-6 text-white/65 mb-5">
            {profile?.stealth_mode
              ? 'Employers you block are removed before your profile reaches their searches, matches or agency directory.'
              : 'Hide from a current employer without disappearing from suitable opportunities elsewhere.'}
          </p>
          {profile?.travel_radius_miles && <p className="text-[11px] text-white/52 mb-5">Agency travel limit: {profile.travel_radius_miles} miles</p>}
          <Link href="/talent/settings" className="inline-flex items-center gap-2 text-[12px] font-medium text-white/80 hover:text-white">Review privacy settings <ArrowRight size={13} /></Link>
        </aside>
      </div>
          <SponsoredAd placement="talent_dashboard_sponsor" />
    </DashboardShell>
  )
}
