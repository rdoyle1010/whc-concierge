'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Briefcase, Users, FileText, MessageSquare, ArrowRight, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function EmployerDashboard() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [stats, setStats] = useState({ jobs: 0, applications: 0, messages: 0, matches: 0 })
  const [recentApps, setRecentApps] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: prof } = await supabase
        .from('employer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()
      setProfile(prof)

      if (prof) {
        const [jobs, msgs, matches] = await Promise.all([
          supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('employer_id', prof.id),
          supabase.from('messages').select('id', { count: 'exact', head: true }).eq('receiver_id', user.id).eq('read', false),
          supabase.from('matches').select('id', { count: 'exact', head: true }).eq('employer_id', prof.id),
        ])

        // Count applications for this employer's jobs
        const { data: jobIds } = await supabase.from('job_listings').select('id').eq('employer_id', prof.id)
        let appCount = 0
        if (jobIds && jobIds.length > 0) {
          const { count } = await supabase.from('applications').select('id', { count: 'exact', head: true })
            .in('job_id', jobIds.map(j => j.id))
          appCount = count || 0
        }

        setStats({
          jobs: jobs.count || 0,
          applications: appCount,
          messages: msgs.count || 0,
          matches: matches.count || 0,
        })

        // Recent applications
        if (jobIds && jobIds.length > 0) {
          const { data: apps } = await supabase
            .from('applications')
            .select('*, job_listings(title), candidate_profiles(full_name, headline)')
            .in('job_id', jobIds.map(j => j.id))
            .order('created_at', { ascending: false })
            .limit(5)
          setRecentApps(apps || [])
        }
      }

      setLoading(false)
    }
    load()
  }, [])

  if (loading) {
    return <DashboardShell role="employer"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div></DashboardShell>
  }

  return (
    <DashboardShell role="employer" userName={profile?.contact_name || profile?.company_name}>
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink">
          {profile?.company_name || 'Employer Dashboard'}
        </h1>
        <p className="text-gray-500 text-sm mt-1">Manage your listings and find exceptional talent.</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Active Jobs', value: stats.jobs, icon: <Briefcase size={20} />, color: 'text-blue-600 bg-blue-50', href: '/employer/jobs' },
          { label: 'Applications', value: stats.applications, icon: <FileText size={20} />, color: 'text-green-600 bg-green-50', href: '/employer/applications' },
          { label: 'Messages', value: stats.messages, icon: <MessageSquare size={20} />, color: 'text-amber-600 bg-amber-50', href: '/employer/messages' },
          { label: 'Matches', value: stats.matches, icon: <TrendingUp size={20} />, color: 'text-purple-600 bg-purple-50', href: '/employer/candidates' },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href} className="dashboard-card hover:border-gold/30 transition-all">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${stat.color} mb-3`}>{stat.icon}</div>
            <p className="text-2xl font-bold text-ink">{stat.value}</p>
            <p className="text-gray-500 text-sm">{stat.label}</p>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Link href="/employer/jobs?new=true" className="dashboard-card bg-gold/5 border-gold/20 hover:bg-gold/10 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-ink">Post a New Role</h3>
            <p className="text-sm text-gray-500">Create a new job listing</p>
          </div>
          <ArrowRight className="text-gold" size={20} />
        </Link>
        <Link href="/employer/candidates" className="dashboard-card hover:border-gold/30 flex items-center justify-between">
          <div>
            <h3 className="font-serif text-lg font-semibold text-ink">Browse Candidates</h3>
            <p className="text-sm text-gray-500">Search the talent pool</p>
          </div>
          <ArrowRight className="text-gray-400" size={20} />
        </Link>
      </div>

      {/* Recent Applications */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-serif text-lg font-semibold">Recent Applications</h3>
          <Link href="/employer/applications" className="text-gold text-sm font-medium flex items-center">
            View All <ArrowRight size={14} className="ml-1" />
          </Link>
        </div>
        <div className="space-y-4">
          {recentApps.map((app) => (
            <div key={app.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
              <div>
                <p className="font-medium text-ink">{app.candidate_profiles?.full_name || 'Candidate'}</p>
                <p className="text-sm text-gray-500">{app.candidate_profiles?.headline}</p>
                <p className="text-xs text-gray-400 mt-1">Applied for: {app.job_listings?.title}</p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                app.status === 'pending' ? 'bg-amber-50 text-amber-700' :
                app.status === 'shortlisted' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
              }`}>{app.status}</span>
            </div>
          ))}
          {recentApps.length === 0 && <p className="text-gray-400 text-center py-8">No applications yet.</p>}
        </div>
      </div>
    </DashboardShell>
  )
}
