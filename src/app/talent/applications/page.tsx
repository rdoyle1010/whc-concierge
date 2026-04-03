'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { FileText, Clock, CheckCircle, XCircle, Star } from 'lucide-react'

const statusConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
  pending: { icon: <Clock size={16} />, color: 'text-amber-600 bg-amber-50', label: 'Pending' },
  reviewed: { icon: <FileText size={16} />, color: 'text-blue-600 bg-blue-50', label: 'Reviewed' },
  shortlisted: { icon: <Star size={16} />, color: 'text-green-600 bg-green-50', label: 'Shortlisted' },
  rejected: { icon: <XCircle size={16} />, color: 'text-red-600 bg-red-50', label: 'Rejected' },
  accepted: { icon: <CheckCircle size={16} />, color: 'text-emerald-600 bg-emerald-50', label: 'Accepted' },
}

export default function TalentApplicationsPage() {
  const supabase = createClient()
  const [applications, setApplications] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

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
        .order('created_at', { ascending: false })

      setApplications(data || [])
      setLoading(false)
    }
    load()
  }, [])

  return (
    <DashboardShell role="talent">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">My Applications</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : applications.length === 0 ? (
        <div className="dashboard-card text-center py-16">
          <FileText size={48} className="mx-auto mb-4 text-gray-300" />
          <p className="text-gray-500">You haven&apos;t applied to any roles yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {applications.map((app) => {
            const status = statusConfig[app.status] || statusConfig.pending
            return (
              <div key={app.id} className="dashboard-card flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg font-semibold text-ink">{app.job_listings?.job_title || app.job_listings?.title}</h3>
                  <p className="text-sm text-gray-500">
                    {app.job_listings?.employer_profiles?.company_name} &middot; {app.job_listings?.location}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Applied {new Date(app.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`flex items-center space-x-1.5 text-sm font-medium px-3 py-1.5 rounded-full ${status.color}`}>
                  {status.icon}
                  <span>{status.label}</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
