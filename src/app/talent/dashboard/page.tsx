'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, FileText, MessageSquare, Star, Eye, TrendingUp, ArrowRight } from 'lucide-react'
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

      const { data: prof } = await supabase
        .from('candidate_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setProfile(prof)

      if (prof) {
        const [apps, msgs, matches] = await Promise.all([
          supabase.from('applications').select('id', { count: 'exact', head: true }).eq('candidate_id', prof.id),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
          supabase.from('matches').select('id', { count: 'exact', head: true }).eq('candidate_id', prof.id),
        ])
        setStats({
          applications: apps.count || 0,
          messages: msgs.count || 0,
          views: 0,
          matches: matches.count || 0,
        })
      }

      const { data: jobs } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, logo_url)')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(5)
      setRecentJobs(jobs || [])

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return (
      <DashboardShell role="talent">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" />
        </div>
      </DashboardShell>
    )
  }

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      {/* Welcome */}
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink">
          Welcome back{profile?.full_name ? `, ${profile.full_name.split(' ')[0]}` : ''}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Here&apos;s what&apos;s happening with your career profile.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Applications', value: stats.applications, icon: <FileText size={20} />, color: 'text-blue-600 bg-blue-50' },
          { label: 'Unread Messages', value: stats.messages, icon: <MessageSquare size={20} />, color: 'text-green-600 bg-green-50' },
          { label: 'Matches', value: stats.matches, icon: <Star size={20} />, color: 'text-amber-600 bg-amber-50' },
          { label: 'Profile Views', value: stats.views, icon: <Eye size={20} />, color: 'text-purple-600 bg-purple-50' },
        ].map((stat) => (
          <div key={stat.label} className="dashboard-card">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>
              {stat.icon}
            </div>
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Profile completeness */}
      {profile && (
        <div className="dashboard-card mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-serif text-lg font-semibold">Profile Completeness</h3>
            <Link href="/talent/profile" className="text-gold text-sm font-medium flex items-center">
              Edit Profile <ArrowRight size={14} className="ml-1" />
            </Link>
          </div>
          <div className="w-full bg-gray-100 rounded-full h-3">
            <div
              className="gold-gradient h-3 rounded-full transition-all"
              style={{ width: `${Math.min(100, [profile.full_name, profile.email, profile.headline, profile.bio, profile.specialisms?.length, profile.experience_years, profile.location].filter(Boolean).length / 7 * 100)}%` }}
            />
          </div>
          <p className="text-gray-400 text-xs mt-2">Complete your profile to increase visibility to employers</p>
        </div>
      )}

      {/* Recent Jobs */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg font-semibold">Latest Opportunities</h3>
          <Link href="/talent/jobs" className="text-gold text-sm font-medium flex items-center">
            Browse All <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
        <div className="space-y-4">
          {recentJobs.map((job) => (
            <div key={job.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50 hover:bg-gold/5 transition-colors">
              <div>
                <p className="font-medium text-ink">{job.title}</p>
                <p className="text-sm text-gray-500">{job.employer_profiles?.company_name} &middot; {job.location}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gold">
                  {job.salary_min && job.salary_max ? `£${(job.salary_min / 1000).toFixed(0)}k – £${(job.salary_max / 1000).toFixed(0)}k` : 'Competitive'}
                </p>
                <p className="text-xs text-gray-400">{job.job_type}</p>
              </div>
            </div>
          ))}
          {recentJobs.length === 0 && (
            <p className="text-gray-400 text-center py-8">No active roles at the moment. Check back soon!</p>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
