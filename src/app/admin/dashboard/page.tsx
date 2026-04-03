'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Users, Briefcase, Heart, FileText, AlertTriangle, Image, Megaphone, TrendingUp } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const counts = await Promise.all([
        supabase.from('candidate_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('job_listings').select('id', { count: 'exact', head: true }),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('matches').select('id', { count: 'exact', head: true }),
        supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
        supabase.from('campaigns').select('id', { count: 'exact', head: true }),
        supabase.from('complaints').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ])

      setStats({
        candidates: counts[0].count || 0,
        employers: counts[1].count || 0,
        jobs: counts[2].count || 0,
        applications: counts[3].count || 0,
        matches: counts[4].count || 0,
        posts: counts[5].count || 0,
        campaigns: counts[6].count || 0,
        complaints: counts[7].count || 0,
      })
      setLoading(false)
    }
    load()
  }, [])

  const cards = [
    { label: 'Candidates', value: stats.candidates, icon: <Users size={24} />, color: 'text-blue-600 bg-blue-50', href: '/admin/users' },
    { label: 'Employers', value: stats.employers, icon: <Briefcase size={24} />, color: 'text-green-600 bg-green-50', href: '/admin/users' },
    { label: 'Job Listings', value: stats.jobs, icon: <FileText size={24} />, color: 'text-amber-600 bg-amber-50', href: '/admin/users' },
    { label: 'Applications', value: stats.applications, icon: <TrendingUp size={24} />, color: 'text-indigo-600 bg-indigo-50', href: '/admin/matches' },
    { label: 'Matches', value: stats.matches, icon: <Heart size={24} />, color: 'text-pink-600 bg-pink-50', href: '/admin/matches' },
    { label: 'Blog Posts', value: stats.posts, icon: <FileText size={24} />, color: 'text-purple-600 bg-purple-50', href: '/admin/blog' },
    { label: 'Campaigns', value: stats.campaigns, icon: <Megaphone size={24} />, color: 'text-teal-600 bg-teal-50', href: '/admin/campaigns' },
    { label: 'Open Complaints', value: stats.complaints, icon: <AlertTriangle size={24} />, color: 'text-red-600 bg-red-50', href: '/admin/complaints' },
  ]

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-8">
        <h1 className="text-2xl font-serif font-bold text-ink">Admin Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">Platform overview and management.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {cards.map((card) => (
            <Link key={card.label} href={card.href} className="dashboard-card hover:border-gold/30 transition-all">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${card.color} mb-4`}>{card.icon}</div>
              <p className="text-3xl font-bold text-ink">{card.value}</p>
              <p className="text-gray-500 text-sm mt-1">{card.label}</p>
            </Link>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
