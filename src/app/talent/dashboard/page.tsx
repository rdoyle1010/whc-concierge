'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { calculateMatchScore } from '@/lib/matching'
import { Briefcase, FileText, MessageSquare, Star, ArrowRight, AlertCircle, CheckCircle, Clock, Check } from 'lucide-react'
import Link from 'next/link'

export default function TalentDashboard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ matches: 0, applications: 0, messages: 0, reviewScore: '—' })
  const [matchedJobs, setMatchedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }

      const { data: prof } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)

      // Real stats
      const [apps, msgs] = await Promise.all([
        supabase.from('applications').select('id', { count: 'exact', head: true }).eq('candidate_id', user.id),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
      ])

      // Load jobs and calculate real match scores
      const { data: rawJobs } = await supabase.from('job_listings').select('*, employer_profiles(company_name, property_name)').eq('is_live', true).order('created_at', { ascending: false }).limit(20)

      const jobs = (rawJobs || []).map((j: any) => ({
        ...j,
        title: j.job_title || j.title,
        employer_profiles: { ...j.employer_profiles, company_name: j.employer_profiles?.property_name || j.employer_profiles?.company_name },
      }))

      let scored: any[] = []
      if (prof && jobs.length > 0) {
        scored = jobs.map((job: any) => {
          const result = calculateMatchScore(prof, job)
          if (result.hardStop) return null
          return { ...job, matchScore: result.score, matchLabel: result.label, matchColour: result.colour, matchBg: result.bgColour }
        }).filter(Boolean).sort((a: any, b: any) => b.matchScore - a.matchScore)
      } else {
        scored = jobs.map((job: any) => ({ ...job, matchScore: 75, matchLabel: 'Strong Match', matchColour: '#1D4ED8', matchBg: '#DBEAFE' }))
      }

      setMatchedJobs(scored.slice(0, 3))
      setStats({
        matches: scored.filter((j: any) => j.matchScore >= 45).length,
        applications: apps.count || 0,
        messages: msgs.count || 0,
        reviewScore: prof?.review_score ? `${prof.review_score}` : '—',
      })
      setLoading(false)
    }
    load()
  }, [])

  // Completion
  const completionItems = [
    { done: !!profile?.full_name, label: 'Full name' },
    { done: !!profile?.role_level, label: 'Role level' },
    { done: !!profile?.headline, label: 'Headline' },
    { done: !!profile?.bio, label: 'Bio' },
    { done: (profile?.services_offered?.length || 0) > 0, label: 'Services' },
    { done: (profile?.product_houses?.length || 0) > 0, label: 'Product houses' },
    { done: (profile?.qualifications?.length || 0) > 0, label: 'Qualifications' },
    { done: !!profile?.cv_url, label: 'CV' },
    { done: !!profile?.experience_years, label: 'Experience' },
    { done: !!profile?.postcode, label: 'Location' },
  ]
  const pct = profile ? Math.round(completionItems.filter(i => i.done).length / completionItems.length * 100) : 0

  if (loading) return <DashboardShell role="talent"><div className="space-y-4"><div className="skeleton h-16 w-full" /><div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i=><div key={i} className="skeleton h-24" />)}</div><div className="skeleton h-64 w-full" /></div></DashboardShell>

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      {/* Approval banner */}
      {(!profile?.approval_status || profile?.approval_status === 'pending') && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <Clock size={18} className="text-amber-600 shrink-0" />
          <div><p className="text-[13px] font-medium text-amber-800">Your profile is under review</p><p className="text-[12px] text-amber-600">We&apos;ll notify you within 24 hours.</p></div>
        </div>
      )}
      {profile?.approval_status === 'approved' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <p className="text-[13px] font-medium text-emerald-800">Your profile is live — employers can find you</p>
        </div>
      )}
      {profile?.approval_status === 'rejected' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <div><p className="text-[13px] font-medium text-red-800">Profile needs attention</p><p className="text-[12px] text-red-600">{profile.approval_notes || 'Please update and resubmit.'}</p></div>
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-ink">Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.</h1>
        <p className="text-[13px] text-muted mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Matches', value: stats.matches, icon: <Briefcase size={16}/> },
          { label: 'Applications', value: stats.applications, icon: <FileText size={16}/> },
          { label: 'Messages', value: stats.messages, icon: <MessageSquare size={16}/> },
          { label: 'Reviews', value: stats.reviewScore, icon: <Star size={16}/> },
        ].map(s => (
          <div key={s.label} className="dashboard-card">
            <div className="text-muted mb-2">{s.icon}</div>
            <p className="text-[24px] font-semibold text-ink">{s.value}</p>
            <p className="text-[11px] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { href: '/talent/profile', label: 'Edit Profile' },
          { href: '/jobs', label: 'Browse Roles' },
          { href: '/roles/match', label: 'Go to Match' },
          { href: '/talent/agency', label: 'Agency Shifts' },
        ].map(l => (
          <Link key={l.href} href={l.href} className="border border-border rounded-xl p-3 text-center hover:border-ink/20 hover:shadow-sm transition-all">
            <p className="text-[13px] font-medium text-ink">{l.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile completion */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Profile</p>
            {/* Completion ring */}
            <div className="relative w-12 h-12">
              <svg className="w-12 h-12 -rotate-90" viewBox="0 0 36 36">
                <circle cx="18" cy="18" r="16" fill="none" stroke="#F5F4F2" strokeWidth="3" />
                <circle cx="18" cy="18" r="16" fill="none" stroke={pct >= 80 ? '#22C55E' : pct >= 50 ? '#C9A96E' : '#e5e5e5'} strokeWidth="3" strokeDasharray={`${pct} ${100 - pct}`} strokeLinecap="round" />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-ink">{pct}%</span>
            </div>
          </div>
          <div className="space-y-1.5">
            {completionItems.map(i => (
              <div key={i.label} className="flex items-center gap-2">
                {i.done ? <Check size={12} className="text-success" /> : <div className="w-3 h-3 border border-border rounded-sm" />}
                <span className={`text-[12px] ${i.done ? 'text-muted line-through' : 'text-ink'}`}>{i.label}</span>
              </div>
            ))}
          </div>
          <Link href="/talent/onboarding" className="text-[12px] text-accent font-medium flex items-center gap-1 mt-4 hover:underline">Complete profile <ArrowRight size={12}/></Link>
        </div>

        {/* Top matches */}
        <div className="dashboard-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Your top matches</p>
            <Link href="/roles/match" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">View all <ArrowRight size={12}/></Link>
          </div>
          <div className="space-y-2">
            {matchedJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between p-3 border border-border rounded-xl hover:border-ink/20 hover:shadow-sm transition-all">
                <div>
                  <p className="text-[13px] font-medium text-ink">{job.title}</p>
                  <p className="text-[11px] text-muted">{job.employer_profiles?.company_name} &middot; {job.location} &middot; {job.salary_min && job.salary_max ? `£${(job.salary_min/1000).toFixed(0)}k–£${(job.salary_max/1000).toFixed(0)}k` : ''}</p>
                </div>
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: job.matchBg || '#DBEAFE', color: job.matchColour || '#1D4ED8' }}>{job.matchScore}%</span>
              </div>
            ))}
            {matchedJobs.length === 0 && <p className="text-[13px] text-muted text-center py-8">No active roles right now — check back soon.</p>}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
