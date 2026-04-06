'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { FileText, Clock, CheckCircle, XCircle, Star, Eye, MessageSquare, Briefcase, ArrowRight } from 'lucide-react'
import Pagination from '@/components/Pagination'
import Link from 'next/link'

const STATUS_FLOW = ['pending', 'reviewed', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected']

const statusConfig: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  pending: { icon: <Clock size={14} />, color: 'text-amber-600', bg: 'bg-amber-50', label: 'Submitted' },
  reviewed: { icon: <Eye size={14} />, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Under Review' },
  shortlisted: { icon: <Star size={14} />, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Shortlisted' },
  interview: { icon: <MessageSquare size={14} />, color: 'text-violet-600', bg: 'bg-violet-50', label: 'Interview' },
  offered: { icon: <Briefcase size={14} />, color: 'text-accent', bg: 'bg-[#FDF6EC]', label: 'Offered' },
  accepted: { icon: <CheckCircle size={14} />, color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'Accepted' },
  rejected: { icon: <XCircle size={14} />, color: 'text-red-500', bg: 'bg-red-50', label: 'Rejected' },
}

export default function TalentApplicationsPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const [statusFilter, setStatusFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data: profile } = await supabase.from('candidate_profiles').select('id').eq('user_id', user.id).single()
      if (!profile) { setLoading(false); return }

      const { data } = await supabase
        .from('applications')
        .select('*, job_listings(job_title, title, location, salary_min, salary_max, employer_profiles(company_name, property_name))')
        .eq('candidate_id', profile.id)
        .order('updated_at', { ascending: false })

      setApplications(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = statusFilter === 'all' ? applications : applications.filter(a => a.status === statusFilter)
  const paginatedApps = filtered.slice((page - 1) * perPage, page * perPage)

  // Status counts for filter tabs
  const counts: Record<string, number> = { all: applications.length }
  for (const app of applications) { counts[app.status] = (counts[app.status] || 0) + 1 }

  const getStatusIndex = (status: string) => STATUS_FLOW.indexOf(status)

  return (
    <DashboardShell role="talent">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">My Applications</h1>
        <Link href="/talent/jobs" className="btn-secondary text-[12px] flex items-center gap-1">Browse Roles <ArrowRight size={12} /></Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {['all', 'pending', 'reviewed', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected'].map(s => {
          const count = counts[s] || 0
          if (s !== 'all' && count === 0) return null
          const cfg = s === 'all' ? null : statusConfig[s]
          return (
            <button key={s} type="button" onClick={() => { setStatusFilter(s); setPage(1) }}
              className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${statusFilter === s ? 'bg-ink text-white' : 'bg-surface text-muted hover:text-ink'}`}>
              {s === 'all' ? 'All' : cfg?.label || s} {count > 0 && <span className="ml-1 opacity-60">({count})</span>}
            </button>
          )
        })}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-ink border-t-transparent rounded-full" /></div>
      ) : applications.length === 0 ? (
        <div className="dashboard-card text-center py-16">
          <FileText size={40} className="mx-auto mb-3 text-muted/40" />
          <p className="text-[15px] font-medium text-ink mb-1">No applications yet</p>
          <p className="text-[13px] text-muted mb-6">Apply to roles to track your progress here.</p>
          <Link href="/talent/jobs" className="btn-primary inline-flex items-center gap-1.5">Browse Roles <ArrowRight size={13} /></Link>
        </div>
      ) : filtered.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <p className="text-[13px] text-muted">No applications with this status.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedApps.map((app) => {
            const status = statusConfig[app.status] || statusConfig.pending
            const property = app.job_listings?.employer_profiles?.property_name || app.job_listings?.employer_profiles?.company_name || ''
            const currentIndex = getStatusIndex(app.status)
            const isTerminal = app.status === 'accepted' || app.status === 'rejected'

            return (
              <div key={app.id} className="bg-white border border-border rounded-xl p-5 hover:shadow-sm transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-[16px] font-medium text-ink">{app.job_listings?.job_title || app.job_listings?.title}</h3>
                    <p className="text-[13px] text-muted">{property} {app.job_listings?.location ? `· ${app.job_listings.location}` : ''}</p>
                  </div>
                  <span className={`flex items-center gap-1.5 text-[12px] font-medium px-2.5 py-1 rounded-full ${status.bg} ${status.color}`}>
                    {status.icon}
                    <span>{status.label}</span>
                  </span>
                </div>

                {/* Progress tracker */}
                {!isTerminal && (
                  <div className="flex items-center gap-1 mb-3">
                    {STATUS_FLOW.slice(0, -2).map((step, i) => {
                      const stepCfg = statusConfig[step]
                      const isActive = i <= currentIndex
                      return (
                        <div key={step} className="flex items-center flex-1">
                          <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-semibold ${isActive ? 'bg-ink text-white' : 'bg-surface text-muted'}`}>
                            {i + 1}
                          </div>
                          {i < STATUS_FLOW.length - 3 && <div className={`flex-1 h-[2px] mx-0.5 ${i < currentIndex ? 'bg-ink' : 'bg-border'}`} />}
                        </div>
                      )
                    })}
                  </div>
                )}

                <div className="flex items-center gap-3 text-[11px] text-muted">
                  <span>Applied {new Date(app.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  {app.updated_at && app.updated_at !== app.created_at && (
                    <span>· Updated {new Date(app.updated_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                  )}
                  {app.match_score && <span>· {app.match_score}% match</span>}
                </div>
              </div>
            )
          })}
          <Pagination page={page} perPage={perPage} total={filtered.length} onPageChange={setPage} onPerPageChange={setPerPage} />
        </div>
      )}
    </DashboardShell>
  )
}
