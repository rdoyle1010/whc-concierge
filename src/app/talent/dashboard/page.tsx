'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, FileText, MessageSquare, Star, Eye, ArrowRight, AlertCircle, CheckCircle, Clock } from 'lucide-react'
import Link from 'next/link'

export default function TalentDashboard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ applications: 0, messages: 0, views: 0, matches: 0 })
  const [recentJobs, setRecentJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      if (prof) {
        const [apps, msgs, matches] = await Promise.all([
          supabase.from('applications').select('id', { count: 'exact', head: true }).eq('candidate_id', prof.id),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
          supabase.from('matches').select('id', { count: 'exact', head: true }).eq('candidate_id', prof.id),
        ])
        setStats({ applications: apps.count||0, messages: msgs.count||0, views: 0, matches: matches.count||0 })
      }
      const { data: rawJobs } = await supabase.from('job_listings').select('*, employer_profiles(company_name, property_name)').or('is_live.eq.true,status.eq.active').order('created_at', { ascending: false }).limit(5)
      const jobs = (rawJobs || []).map((j: any) => ({ ...j, title: j.job_title || j.title, description: j.job_description || j.description, employer_profiles: { ...j.employer_profiles, company_name: j.employer_profiles?.property_name || j.employer_profiles?.company_name } }))
      setRecentJobs(jobs || [])
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-ink border-t-transparent rounded-full" /></div></DashboardShell>

  // Completion score
  const completionItems = [
    { done: !!profile?.full_name, label: 'Full name' },
    { done: !!profile?.role_level, label: 'Role level' },
    { done: !!profile?.headline, label: 'Headline' },
    { done: !!profile?.bio, label: 'Bio' },
    { done: (profile?.specialisms?.length || profile?.product_houses?.length) > 0, label: 'Skills / product houses' },
    { done: !!profile?.qualifications?.length, label: 'Qualifications' },
    { done: !!profile?.cv_url, label: 'CV uploaded' },
    { done: !!profile?.experience_years, label: 'Experience' },
  ]
  const completionPct = Math.round(completionItems.filter(i => i.done).length / completionItems.length * 100)

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      {/* Approval banner */}
      {(!profile?.approval_status || profile?.approval_status === 'pending') && (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
          <Clock size={18} className="text-amber-600 shrink-0" />
          <div><p className="text-[13px] font-medium text-amber-800">Your profile is under review</p><p className="text-[12px] text-amber-600">We&apos;ll notify you within 24 hours once approved.</p></div>
        </div>
      )}
      {profile?.approval_status === 'approved' && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
          <CheckCircle size={18} className="text-emerald-600 shrink-0" />
          <p className="text-[13px] font-medium text-emerald-800">Your profile is live — employers can find you</p>
        </div>
      )}
      {profile?.approval_status === 'rejected' && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <AlertCircle size={18} className="text-red-600 shrink-0" />
          <div><p className="text-[13px] font-medium text-red-800">Profile needs attention</p><p className="text-[12px] text-red-600">{profile.approval_notes || 'Please update and resubmit.'}</p></div>
        </div>
      )}

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-ink">Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}.</h1>
        <p className="text-[13px] text-muted mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Matches', value: stats.matches, icon: <Briefcase size={16}/> },
          { label: 'Applications', value: stats.applications, icon: <FileText size={16}/> },
          { label: 'Messages', value: stats.messages, icon: <MessageSquare size={16}/> },
          { label: 'Review score', value: profile?.review_score ? `${profile.review_score}` : '—', icon: <Star size={16}/> },
        ].map(s => (
          <div key={s.label} className="dashboard-card">
            <div className="text-muted mb-2">{s.icon}</div>
            <p className="text-[22px] font-semibold text-ink">{s.value}</p>
            <p className="text-[11px] text-muted">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Quick links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
        {[
          { href: '/talent/profile', label: 'Edit Profile' },
          { href: '/jobs', label: 'Browse Jobs' },
          { href: '/roles/match', label: 'Go to Match' },
          { href: '/talent/agency', label: 'Agency Shifts' },
        ].map(l => (
          <Link key={l.href} href={l.href} className="border border-border rounded-lg p-3 text-center hover:border-ink/20 transition-colors">
            <p className="text-[13px] font-medium text-ink">{l.label}</p>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile completion */}
        <div className="dashboard-card">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Profile completion</p>
            <p className="text-[22px] font-semibold text-ink">{completionPct}%</p>
          </div>
          <div className="h-2 bg-surface rounded-full overflow-hidden mb-4"><div className="h-full bg-ink rounded-full transition-all" style={{ width: `${completionPct}%` }}/></div>
          <div className="space-y-2">
            {completionItems.filter(i => !i.done).slice(0, 3).map(i => (
              <p key={i.label} className="text-[12px] text-muted flex items-center gap-2">
                <span className="w-1 h-1 bg-muted rounded-full"/>Add {i.label.toLowerCase()}
              </p>
            ))}
          </div>
          <Link href="/talent/profile" className="text-[12px] text-ink font-medium flex items-center gap-1 mt-4 hover:underline">Complete profile <ArrowRight size={12}/></Link>
        </div>

        {/* Top matches */}
        <div className="dashboard-card lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[14px] font-medium text-ink">Latest opportunities</p>
            <Link href="/roles/match" className="text-[12px] text-muted hover:text-ink flex items-center gap-1">View all <ArrowRight size={12}/></Link>
          </div>
          <div className="space-y-2">
            {recentJobs.map((job, i) => {
              const score = Math.max(50, 95 - i * 8)
              return (
                <div key={job.id} className="flex items-center justify-between p-3 border border-border rounded-lg hover:border-ink/20 transition-colors">
                  <div><p className="text-[13px] font-medium text-ink">{job.title}</p><p className="text-[11px] text-muted">{job.employer_profiles?.company_name} &middot; {job.location}</p></div>
                  <span className={score>=90?'match-perfect':score>=75?'match-strong':'match-good'}>{score}%</span>
                </div>
              )
            })}
            {recentJobs.length === 0 && <p className="text-[13px] text-muted text-center py-6">No active roles at the moment.</p>}
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
