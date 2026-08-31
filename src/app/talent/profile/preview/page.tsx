'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import CandidatePortfolio from '@/components/CandidatePortfolio'
import { createClient } from '@/lib/supabase/client'
import { careerValue } from '@/lib/career-value'
import { courseTitle } from '@/lib/academy'
import { ArrowLeft, ArrowRight, Eye } from 'lucide-react'

type Enrolment = { course_slug: string; completed_at: string }
type Review = { id: string; rating: number; text?: string | null; created_at?: string | null; type?: string | null }

// The high-value portfolio sections and how to fill each one. Every gap
// becomes a plain link back to the profile editor - the reason to keep the
// portfolio maintained even when not job hunting.
function portfolioGaps(profile: any, completions: number): string[] {
  const empty = (value: any) => !(Array.isArray(value) ? value.filter(Boolean).length : String(value || '').trim())
  const gaps: string[] = []
  if (empty(profile.profile_image_url)) gaps.push('Add a professional photograph')
  if (empty(profile.headline)) gaps.push('Write a headline that says who you are in one line')
  if (empty(profile.bio)) gaps.push('Write your professional summary')
  if (empty(profile.hotel_brands_worked) && empty(profile.product_houses)) gaps.push('Add the luxury brands you have worked with')
  if (empty(profile.career_evidence)) gaps.push('Add your career evidence - the results behind your CV')
  if (empty(profile.treatment_skills) && empty(profile.services_offered)) gaps.push('List your treatments and services')
  if (empty(profile.business_skills)) gaps.push('Add your business skills')
  if (empty(profile.qualifications)) gaps.push('Add your qualifications')
  if (empty(profile.revenue_responsibility) && empty(profile.commercial_experience) && !Number(profile.team_size_managed)) gaps.push('Record your commercial and leadership experience')
  if (empty(profile.languages)) gaps.push('Add your languages')
  if (empty(profile.desired_roles) && empty(profile.employment_types_wanted)) gaps.push('Tell employers the roles you want next')
  if (empty(profile.awards)) gaps.push('Add any awards you have won')
  if (completions === 0) gaps.push('Complete a WHC Academy course for a verified credential')
  return gaps
}

export default function TalentProfilePreviewPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [enrolments, setEnrolments] = useState<Enrolment[]>([])
  const [reviews, setReviews] = useState<Review[]>([])
  const [manualVerifications, setManualVerifications] = useState<string[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
      setProfile(data)

      if (data?.id) {
        const { data: completed } = await supabase.from('course_enrollments')
          .select('course_slug, completed_at')
          .eq('candidate_id', data.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
        setEnrolments((completed || []) as Enrolment[])
      }

      // Reviews of this professional. Old rows predate the type column, so a
      // null type still counts as a talent review; if the typed query fails
      // (environments without the column), fall back to a plain select.
      const buildReviewQuery = (withType: boolean) => {
        let query = supabase.from('reviews')
          .select(withType ? 'id,rating,text,created_at,type' : 'id,rating,text,created_at')
          .eq('reviewee_id', user.id)
        if (withType) query = query.or('type.eq.talent,type.is.null')
        return query.order('created_at', { ascending: false }).limit(20)
      }
      let { data: reviewRows, error } = await buildReviewQuery(true)
      if (error) ({ data: reviewRows } = await buildReviewQuery(false))
      setReviews((reviewRows || []) as unknown as Review[])

      // Manual verification marks granted by WHC admins. Served through the
      // talent API (the table is service-role only); an absent table or a
      // failed request simply means no manual badges.
      try {
        const res = await fetch('/api/talent/verifications')
        const j = await res.json().catch(() => ({}))
        if (res.ok && Array.isArray(j.types)) setManualVerifications(j.types)
      } catch { /* no manual badges */ }

      setLoading(false)
    }
    load()
  }, [])

  const academy = useMemo(() => enrolments.map(entry => ({
    course_slug: entry.course_slug,
    title: courseTitle(entry.course_slug),
    completed_at: entry.completed_at,
  })), [enrolments])

  const value = useMemo(() => careerValue(profile, academy.length), [profile, academy.length])
  const gaps = useMemo(() => profile ? portfolioGaps(profile, academy.length) : [], [profile, academy.length])

  if (loading) return <DashboardShell role="talent"><div className="flex h-64 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-ink border-t-transparent" /></div></DashboardShell>
  if (!profile) return <DashboardShell role="talent"><p className="text-muted">Profile not found.</p></DashboardShell>

  const hidden = profile.stealth_mode || profile.profile_visible === false

  return (
    <DashboardShell role="talent" userName={profile.full_name}>
      <div className="mx-auto max-w-4xl">
        {/* Top bar */}
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <Link href="/talent/profile" className="mb-2 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"><ArrowLeft size={13} />Back to edit profile</Link>
            <p className="dashboard-eyebrow">Career profile</p>
            <h1 className="dashboard-title">Your professional portfolio</h1>
            <p className="dashboard-intro">This is your professional portfolio - what employers see when they view your profile.</p>
          </div>
          <Link href="/talent/profile" className="btn-primary whitespace-nowrap">Edit profile</Link>
        </div>

        {hidden && (
          <div className="mb-6 flex items-start gap-3 border border-amber-200 bg-amber-50 px-4 py-3">
            <Eye size={16} className="mt-0.5 text-amber-700" />
            <div>
              <p className="text-[13px] font-medium text-amber-800">Your portfolio is currently restricted by your privacy settings.</p>
              <p className="text-[11px] text-secondary">You can always view this owner preview. Stealth Mode continues to protect you from blocked employers.</p>
            </div>
          </div>
        )}

        <CandidatePortfolio candidate={profile} academy={academy} reviews={reviews} careerValue={value} manualVerifications={manualVerifications} />

        {/* Maintenance motivation: the empty high-value sections, as links. */}
        {gaps.length > 0 && (
          <section className="mt-6 border border-border bg-surface px-6 md:px-8 py-7">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-accent">Strengthen your portfolio</p>
            <p className="mt-3 text-[13px] leading-6 text-secondary max-w-2xl">A complete portfolio earns stronger career value ratings and better matches. These sections are still empty:</p>
            <div className="mt-4 max-w-2xl">
              {gaps.map(gap => (
                <Link key={gap} href="/talent/profile" className="group flex items-center justify-between gap-4 border-t border-border py-3 text-[13px] text-ink hover:text-accent">
                  <span>{gap}</span>
                  <ArrowRight size={14} className="shrink-0 text-muted group-hover:text-accent" />
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </DashboardShell>
  )
}
