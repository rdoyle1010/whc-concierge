'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { courseTitle } from '@/lib/academy'
import { ArrowLeft, Award, Briefcase, CheckCircle2, Eye, MapPin, Shield } from 'lucide-react'

type Badge = { course_slug: string; completed_at: string; certificate_code?: string }

export default function TalentProfilePreviewPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [badges, setBadges] = useState<Badge[]>([])
  const [certificates, setCertificates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
      setProfile(data)
      if (data?.id) {
        const { data: completed } = await supabase.from('course_enrollments')
          .select('course_slug, completed_at, certificate_code')
          .eq('candidate_id', data.id)
          .not('completed_at', 'is', null)
          .order('completed_at', { ascending: false })
        setBadges(completed || [])
      }
      try {
        const res = await fetch('/api/talent/certificates')
        const json = await res.json()
        if (res.ok) setCertificates((json.certificates || []).filter((c: any) => ['verified', 'submitted'].includes(c.status)))
      } catch { /* section simply hides */ }
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <DashboardShell role="talent"><div className="flex h-64 items-center justify-center"><div className="h-7 w-7 animate-spin rounded-full border-2 border-ink border-t-transparent" /></div></DashboardShell>
  if (!profile) return <DashboardShell role="talent"><p className="text-muted">Profile not found.</p></DashboardShell>

  const postcodeArea = profile.postcode?.split(' ')[0] || profile.location || ''
  const hidden = profile.stealth_mode || profile.profile_visibility === 'hidden' || profile.is_visible === false

  return (
    <DashboardShell role="talent" userName={profile.full_name}>
      <div className="mx-auto max-w-4xl">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/talent/profile" className="mb-2 inline-flex items-center gap-1 text-[12px] text-muted hover:text-ink"><ArrowLeft size={13} />Back to edit profile</Link>
            <h1 className="font-serif text-[26px] font-semibold text-ink">Preview my profile</h1>
            <p className="text-[12px] text-muted">This is the professional information approved employers see. Booking and review controls are hidden in your preview.</p>
          </div>
          <Link href="/talent/profile" className="btn-primary">Edit profile</Link>
        </div>

        <div className={`mb-5 flex items-start gap-3 rounded-xl border px-4 py-3 ${hidden ? 'border-amber-200 bg-amber-50' : 'border-emerald-200 bg-emerald-50'}`}>
          <Eye size={16} className={hidden ? 'mt-0.5 text-amber-700' : 'mt-0.5 text-emerald-700'} />
          <div><p className={`text-[13px] font-medium ${hidden ? 'text-amber-800' : 'text-emerald-800'}`}>{hidden ? 'Your profile is currently restricted by your privacy settings.' : 'Your profile is visible to approved employers.'}</p><p className="text-[11px] text-secondary">You can always view this owner preview. Stealth Mode continues to protect you from blocked employers.</p></div>
        </div>

        <div className="mb-5 rounded-xl border border-border bg-white p-7">
          <div className="flex flex-col gap-5 sm:flex-row">
            <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink">
              {profile.profile_image_url ? <img src={profile.profile_image_url} alt="" className="h-full w-full object-cover" /> : <span className="text-[32px] font-semibold text-accent">{profile.full_name?.[0]}</span>}
            </div>
            <div className="flex-1">
              <div className="mb-2 flex flex-wrap items-center gap-2"><h2 className="font-serif text-[28px] font-medium capitalize text-ink">{profile.full_name}</h2>{profile.role_level && <span className="rounded-full bg-surface px-3 py-1 text-[11px] font-medium text-secondary">{profile.role_level}</span>}</div>
              {profile.headline && <p className="mb-3 text-[14px] text-secondary">{profile.headline}</p>}
              <div className="flex flex-wrap gap-4 text-[12px] text-muted">
                {postcodeArea && <span className="inline-flex items-center gap-1"><MapPin size={13} />{postcodeArea}</span>}
                {profile.experience_years && <span className="inline-flex items-center gap-1"><Briefcase size={13} />{profile.experience_years} years experience</span>}
                {profile.whc_verified && <span className="inline-flex items-center gap-1 font-medium text-emerald-700"><Shield size={13} />WHC Verified</span>}
                {profile.has_insurance && <span className="inline-flex items-center gap-1"><CheckCircle2 size={13} />Insured</span>}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="space-y-5 lg:col-span-2">
            {profile.bio && <section className="rounded-xl border border-border bg-white p-6"><h3 className="mb-3 text-[15px] font-medium text-ink">About</h3><p className="whitespace-pre-wrap text-[13px] leading-7 text-secondary">{profile.bio}</p></section>}
            {[['Services', profile.services_offered], ['Product houses', profile.product_houses], ['Qualifications', [...(profile.qualifications || []), ...(profile.systems_experience || [])]]].map(([label, values]: any) => values?.length ? <section key={label} className="rounded-xl border border-border bg-white p-6"><h3 className="mb-3 text-[15px] font-medium text-ink">{label}</h3><div className="flex flex-wrap gap-2">{values.map((value: string) => <span key={value} className="rounded-full border border-border bg-surface px-3 py-1.5 text-[11px] text-secondary">{value}</span>)}</div></section> : null)}
            {certificates.length > 0 && <section className="rounded-xl border border-border bg-white p-6"><h3 className="mb-3 text-[15px] font-medium text-ink">Certificates</h3><div className="space-y-2">{certificates.map((certificate: any) => <div key={certificate.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2"><div><p className="text-[12.5px] font-medium text-ink">{certificate.title}</p><p className="text-[11px] text-muted">{[certificate.awarding_body, certificate.country ? `trained in ${certificate.country}` : null, certificate.year_awarded].filter(Boolean).join(' · ')}</p></div>{certificate.status === 'verified' ? <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10.5px] font-semibold text-green-700">WHC verified</span> : <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10.5px] font-semibold text-amber-700">Under review</span>}</div>)}</div></section>}
          </div>
          <div className="space-y-5">
            <section className="rounded-xl border border-border bg-white p-5">
              <div className="mb-3 flex items-center gap-2"><Award size={16} className="text-accent" /><h3 className="text-[14px] font-medium text-ink">WHC Academy</h3></div>
              {badges.length ? <div className="space-y-2">{badges.map(badge => <div key={badge.course_slug} className="rounded-lg border border-accent/20 bg-[#FDF6EC] p-3"><p className="text-[12px] font-medium text-ink">{courseTitle(badge.course_slug)}</p><p className="mt-1 text-[10px] text-muted">Verified completion on {new Date(badge.completed_at).toLocaleDateString('en-GB')}</p><Link href={`/talent/academy/certificate/${badge.course_slug}`} className="mt-1 inline-block text-[10px] font-medium text-accent hover:underline">View certificate</Link></div>)}</div> : <p className="text-[11px] text-muted">Completed Academy courses will always appear here.</p>}
            </section>
            {profile.agency_available && (profile.day_rate_min || profile.day_rate_max) ? <section className="rounded-xl border border-border bg-white p-5"><p className="eyebrow mb-2">Agency day rate</p><p className="text-[18px] font-semibold text-accent">&#163;{Number(profile.day_rate_min||profile.day_rate_max).toLocaleString()}{profile.day_rate_max && profile.day_rate_min ? ` - \u00A3${Number(profile.day_rate_max).toLocaleString()}` : ''}<span className="text-[11px] font-normal text-muted"> /day</span></p></section> : null}
            {profile.salary_expectation_min && profile.salary_expectation_private === false ? <section className="rounded-xl border border-border bg-white p-5"><p className="eyebrow mb-2">Salary expectation</p><p className="text-[18px] font-semibold text-accent">&#163;{Number(profile.salary_expectation_min).toLocaleString()}{profile.salary_expectation_max ? ` - \u00A3${Number(profile.salary_expectation_max).toLocaleString()}` : ''}<span className="text-[11px] font-normal text-muted"> /year</span></p></section> : null}
            {profile.salary_expectation_min && profile.salary_expectation_private !== false ? <section className="rounded-xl border border-dashed border-border bg-white p-5"><p className="eyebrow mb-2">Salary expectation</p><p className="text-[12px] text-muted">Kept private - used only to score how well roles pay against what you want. Employers never see the figure.</p></section> : null}
            {(profile.team_size_managed || profile.revenue_responsibility || profile.commercial_experience) ? <section className="rounded-xl border border-border bg-white p-5"><p className="eyebrow mb-2">Leadership & commercial</p><div className="space-y-1.5 text-[13px] text-secondary">{profile.team_size_managed ? <p>Largest team managed: <b className="text-ink">{profile.team_size_managed}</b></p> : null}{profile.revenue_responsibility ? <p>Revenue responsibility: <b className="text-ink">{profile.revenue_responsibility}</b></p> : null}{profile.commercial_experience ? <p className="leading-5">{profile.commercial_experience}</p> : null}{profile.portfolio_url ? <a href={profile.portfolio_url} target="_blank" rel="noopener noreferrer" className="text-[#0b2f4d] underline text-[12px]">Portfolio / LinkedIn</a> : null}</div></section> : null}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}