'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Users, Briefcase, Clock, FileText, MessageSquare, CheckCircle, XCircle } from 'lucide-react'
import Link from 'next/link'

export default function AdminDashboard() {
  const supabase = createClient()
  const [stats, setStats] = useState<Record<string, number>>({})
  const [recent, setRecent] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [talent, employers, pendingT, pendingE, jobs, apps, msgs] = await Promise.all([
        supabase.from('candidate_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }),
        supabase.from('candidate_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('employer_profiles').select('id', { count: 'exact', head: true }).eq('approval_status', 'pending'),
        supabase.from('job_listings').select('id', { count: 'exact', head: true }).eq('is_live', true),
        supabase.from('applications').select('id', { count: 'exact', head: true }),
        supabase.from('messages').select('id', { count: 'exact', head: true }),
      ])

      setStats({
        talent: talent.count || 0,
        employers: employers.count || 0,
        pending: (pendingT.count || 0) + (pendingE.count || 0),
        jobs: jobs.count || 0,
        applications: apps.count || 0,
        messages: msgs.count || 0,
      })

      // Recent registrations
      const { data: recentTalent } = await supabase.from('candidate_profiles').select('id, full_name, role_level, approval_status, created_at').order('created_at', { ascending: false }).limit(5)
      const { data: recentEmployers } = await supabase.from('employer_profiles').select('id, company_name, property_name, approval_status, created_at').order('created_at', { ascending: false }).limit(5)

      const combined = [
        ...(recentTalent || []).map(t => ({ ...t, type: 'talent', name: t.full_name, detail: t.role_level })),
        ...(recentEmployers || []).map(e => ({ ...e, type: 'employer', name: e.property_name || e.company_name, detail: 'Property' })),
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 10)

      setRecent(combined)
      setLoading(false)
    }
    load()
  }, [])

  const handleApprove = async (type: string, id: string) => {
    const table = type === 'talent' ? 'candidate_profiles' : 'employer_profiles'
    await supabase.from(table).update({ approval_status: 'approved' }).eq('id', id)
    setRecent(recent.map(r => r.id === id ? { ...r, approval_status: 'approved' } : r))
    setStats({ ...stats, pending: Math.max(0, (stats.pending || 0) - 1) })
  }

  const handleReject = async (type: string, id: string) => {
    const table = type === 'talent' ? 'candidate_profiles' : 'employer_profiles'
    await supabase.from(table).update({ approval_status: 'rejected' }).eq('id', id)
    setRecent(recent.map(r => r.id === id ? { ...r, approval_status: 'rejected' } : r))
    setStats({ ...stats, pending: Math.max(0, (stats.pending || 0) - 1) })
  }

  if (loading) return <DashboardShell role="admin" userName="Admin"><div className="grid grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i=><div key={i} className="skeleton h-24" />)}</div></DashboardShell>

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-ink">Admin Dashboard</h1>
        <p className="text-[13px] text-muted mt-1">Platform overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Total talent', value: stats.talent, icon: <Users size={16} />, href: '/admin/users' },
          { label: 'Total employers', value: stats.employers, icon: <Briefcase size={16} />, href: '/admin/users' },
          { label: 'Pending approvals', value: stats.pending, icon: <Clock size={16} />, href: '/admin/users', highlight: (stats.pending || 0) > 0 },
          { label: 'Active jobs', value: stats.jobs, icon: <FileText size={16} /> },
          { label: 'Applications', value: stats.applications, icon: <FileText size={16} /> },
          { label: 'Messages', value: stats.messages, icon: <MessageSquare size={16} /> },
        ].map(s => (
          <Link key={s.label} href={s.href || '#'} className={`dashboard-card hover:border-ink/20 transition-all ${s.highlight ? 'border-amber-300 bg-amber-50/30' : ''}`}>
            <div className="text-muted mb-2">{s.icon}</div>
            <p className="text-[24px] font-semibold text-ink">{s.value}</p>
            <p className="text-[11px] text-muted">{s.label}</p>
          </Link>
        ))}
      </div>

      {/* Recent registrations */}
      <div className="dashboard-card">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[14px] font-medium text-ink">Recent registrations</p>
          <Link href="/admin/users" className="text-[12px] text-muted hover:text-ink">View all →</Link>
        </div>
        <div className="space-y-2">
          {recent.map(r => (
            <div key={r.id} className="flex items-center justify-between p-3 border border-border rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-semibold ${r.type === 'talent' ? 'bg-blue-50 text-blue-600' : 'bg-purple-50 text-purple-600'}`}>
                  {r.type === 'talent' ? 'T' : 'E'}
                </div>
                <div>
                  <p className="text-[13px] font-medium text-ink">{r.name}</p>
                  <p className="text-[11px] text-muted">{r.detail} &middot; {new Date(r.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {r.approval_status === 'pending' ? (
                  <>
                    <button onClick={() => handleApprove(r.type, r.id)} className="p-1.5 rounded-lg hover:bg-emerald-50 text-muted hover:text-emerald-600 transition-colors"><CheckCircle size={16} /></button>
                    <button onClick={() => handleReject(r.type, r.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-muted hover:text-red-500 transition-colors"><XCircle size={16} /></button>
                  </>
                ) : (
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${r.approval_status === 'approved' ? 'bg-emerald-50 text-emerald-700' : r.approval_status === 'rejected' ? 'bg-red-50 text-red-700' : 'bg-amber-50 text-amber-700'}`}>{r.approval_status}</span>
                )}
              </div>
            </div>
          ))}
          {recent.length === 0 && <p className="text-[13px] text-muted text-center py-6">No recent registrations.</p>}
        </div>
      </div>
    </DashboardShell>
  )
}
