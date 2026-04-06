'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Bookmark, MapPin, Trash2, ArrowRight, Briefcase } from 'lucide-react'
import Link from 'next/link'

export default function SavedJobsPage() {
  const supabase = createClient()
  const [savedJobs, setSavedJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/saved-jobs')
      if (res.ok) {
        const data = await res.json()
        setSavedJobs(data.saved || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const removeSaved = async (jobId: string) => {
    await fetch('/api/saved-jobs', {
      method: 'DELETE', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId }),
    })
    setSavedJobs(savedJobs.filter(s => s.job_id !== jobId))
  }

  return (
    <DashboardShell role="talent">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Saved Roles</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-ink border-t-transparent rounded-full" /></div>
      ) : savedJobs.length === 0 ? (
        <div className="dashboard-card text-center py-16">
          <Bookmark size={40} className="mx-auto mb-3 text-muted/40" />
          <p className="text-[15px] font-medium text-ink mb-1">No saved roles</p>
          <p className="text-[13px] text-muted mb-6">Bookmark roles you&apos;re interested in to review later.</p>
          <Link href="/talent/jobs" className="btn-primary inline-flex items-center gap-1.5">Browse Roles <ArrowRight size={13} /></Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {savedJobs.map((saved) => {
            const job = saved.job_listings
            if (!job) return null
            const property = job.employer_profiles?.property_name || job.employer_profiles?.company_name || ''
            return (
              <div key={saved.id} className="bg-white border border-border rounded-xl p-5 hover:shadow-sm transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full ${job.tier === 'Platinum' ? 'bg-ink text-white' : job.tier === 'Gold' ? 'bg-[#FDF6EC] text-[#C9A96E]' : 'bg-surface text-muted'}`}>{job.tier || 'Standard'}</span>
                  <button type="button" onClick={() => removeSaved(saved.job_id)}
                    className="p-1 text-muted hover:text-red-500 transition-colors" title="Remove">
                    <Trash2 size={14} />
                  </button>
                </div>
                <p className="eyebrow mb-0.5">{property}</p>
                <h3 className="text-[16px] font-medium text-ink mb-2">{job.job_title}</h3>
                <div className="flex flex-wrap gap-2 text-[12px] text-muted mb-4">
                  {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
                  {job.contract_type && <span>{job.contract_type.replace('_', ' ')}</span>}
                  {job.salary_min && job.salary_max && <span>£{(job.salary_min/1000).toFixed(0)}k–£{(job.salary_max/1000).toFixed(0)}k</span>}
                </div>
                <div className="flex gap-2">
                  <Link href="/roles/match" className="btn-primary flex-1 text-center text-[12px]">View & Apply</Link>
                </div>
                {!job.is_live && <p className="text-[11px] text-red-400 mt-2">This role is no longer active</p>}
              </div>
            )
          })}
        </div>
      )}
    </DashboardShell>
  )
}
