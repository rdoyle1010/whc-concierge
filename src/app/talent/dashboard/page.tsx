'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import {
  Briefcase, FileText, MessageSquare, GraduationCap, User, Star, ArrowRight, Search, EyeOff, Calendar, MapPin,
} from 'lucide-react'
import SponsoredAd from '@/components/SponsoredAd'

// Talent home - the landing page after login. Greeting, a few live counts
// (best-effort - failures are silent) and quick links into the main areas.

export default function TalentDashboard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ applications: 0, messages: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
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

  const quickLinks = [
    { label: 'Browse Jobs', desc: 'Find your next permanent or fixed-term role.', href: '/talent/jobs', icon: <Briefcase size={17} /> },
    { label: 'Agency Shifts', desc: 'Manage planned cover and urgent shift offers.', href: '/talent/agency', icon: <Calendar size={17} /> },
    { label: 'Residency', desc: 'Build your specialist profile for short-term residencies.', href: '/talent/residency', icon: <MapPin size={17} /> },
    { label: 'Applications', desc: 'Track every role you have applied for.', href: '/talent/applications', icon: <FileText size={17} /> },
    { label: 'Messages', desc: 'Private conversations with properties and matches.', href: '/talent/messages', icon: <MessageSquare size={17} /> },
    { label: 'Academy', desc: 'Courses, certificates and profile badges.', href: '/talent/academy', icon: <GraduationCap size={17} /> },
    { label: 'My Profile', desc: 'Keep your professional profile polished and current.', href: '/talent/profile', icon: <User size={17} /> },
    { label: 'Get Verified', desc: 'Add trust signals for properties reviewing your profile.', href: '/talent/verification', icon: <Star size={17} /> },
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

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
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

      <div className="dashboard-metrics mb-8">
        {[
          { label: 'Applications', value: stats.applications, icon: <FileText size={16} /> },
          { label: 'Unread messages', value: stats.messages, icon: <MessageSquare size={16} /> },
          { label: 'Profile status', value: profile?.approval_status === 'approved' ? 'Approved' : 'In review', icon: <User size={16} /> },
          { label: 'Featured', value: profile?.is_featured ? 'Active' : 'Off', icon: <Star size={16} /> },
        ].map(s => (
          <div key={s.label} className="dashboard-metric">
            <div className="text-accent mb-3">{s.icon}</div>
            <p className="dashboard-metric-value">{s.value}</p>
            <p className="dashboard-metric-label">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2.5 mb-9">
        <Link href="/talent/jobs" className="btn-primary flex items-center justify-center gap-2 py-3"><Search size={14} />Browse roles</Link>
        <Link href="/talent/agency" className="btn-secondary flex items-center justify-center gap-2 py-3"><Calendar size={14} />Agency shifts</Link>
        <Link href="/talent/residency" className="btn-secondary flex items-center justify-center gap-2 py-3"><MapPin size={14} />Residency</Link>
        <Link href="/talent/profile" className="btn-secondary flex items-center justify-center gap-2 py-3">Update profile</Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_.85fr] gap-6">
        <section className="dashboard-panel">
          <p className="dashboard-eyebrow">Continue your journey</p>
          <h2 className="dashboard-section-title mb-4">Career workspace</h2>
          <div>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href} className="dashboard-list-row group">
                <div className="flex items-start gap-3">
                  <span className="text-accent mt-0.5">{link.icon}</span>
                  <span><span className="block text-[13px] font-medium text-ink">{link.label}</span><span className="block text-[12px] text-muted mt-0.5">{link.desc}</span></span>
                </div>
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
