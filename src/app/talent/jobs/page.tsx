'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { calculateMatchScore } from '@/lib/matching'
import { Search, MapPin, Briefcase, Heart, ArrowUpDown, Check } from 'lucide-react'
import { notify } from '@/lib/notify'
import Pagination from '@/components/Pagination'
import { ROLE_LEVELS, CONTRACT_TYPES } from '@/lib/constants'

export default function TalentJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Filters
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [contractFilter, setContractFilter] = useState('')
  const [minMatch, setMinMatch] = useState(0)
  const [sortBy, setSortBy] = useState('match')
  const [applied, setApplied] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const perPage = 12

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) setUserId(user.id)

      let cp: any = null
      if (user) {
        const { data } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
        cp = data
        setProfile(data)
        // Load existing applications
        const { data: apps } = await supabase.from('applications').select('job_listing_id, job_id').eq('candidate_id', user.id)
        if (apps) setApplied(new Set(apps.map(a => a.job_listing_id || a.job_id)))
      }

      const { data: rawData } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, property_name)')
        .eq('is_live', true)
        .order('created_at', { ascending: false })

      const normalized = (rawData || []).map((j: any) => {
        const title = j.job_title || j.title
        const description = j.job_description || j.description
        const companyName = j.employer_profiles?.property_name || j.employer_profiles?.company_name
        let matchScore = 75, matchLabel = 'Strong Match', matchColour = '#1D4ED8', matchBg = '#DBEAFE'
        if (cp && cp.role_level) {
          const r = calculateMatchScore(cp, j)
          if (r.hardStop) return null
          matchScore = r.score; matchLabel = r.label; matchColour = r.colour; matchBg = r.bgColour
        }
        return { ...j, title, description, employer_profiles: { ...j.employer_profiles, company_name: companyName }, matchScore, matchLabel, matchColour, matchBg }
      }).filter(Boolean)

      setJobs(normalized)
      setLoading(false)
    }
    load()
  }, [])

  // Filter and sort
  const filtered = jobs.filter(j => {
    if (search && !j.title?.toLowerCase().includes(search.toLowerCase()) && !j.employer_profiles?.company_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (roleFilter && j.required_role_level !== roleFilter) return false
    if (contractFilter && j.contract_type !== contractFilter) return false
    if (minMatch && j.matchScore < minMatch) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'match') return b.matchScore - a.matchScore
    if (sortBy === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (sortBy === 'salary_high') return (b.salary_max || 0) - (a.salary_max || 0)
    if (sortBy === 'salary_low') return (a.salary_min || 999999) - (b.salary_min || 999999)
    return 0
  })
  const paginatedSorted = sorted.slice((page - 1) * perPage, page * perPage)

  const handleApply = async (jobId: string, matchScore: number) => {
    if (!userId) return
    await supabase.from('applications').insert({ candidate_id: userId, job_listing_id: jobId, job_id: jobId, status: 'pending', match_score: matchScore })
    setApplied(new Set(Array.from(applied).concat(jobId)))
    // Notify employer
    const job = jobs.find((j: any) => j.id === jobId)
    const employerUserId = job?.employer_id || job?.employer_user_id
    if (employerUserId) {
      notify(employerUserId, 'job_application', 'New application received', `A candidate has applied for ${job?.title || 'your role'}`, '/employer/applications')
    }
    // Send application confirmation emails (fire-and-forget)
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email && job) {
      fetch('/api/application-email', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicantEmail: user.email,
          applicantName: profile?.full_name || '',
          employerEmail: job.employer_email || '',
          employerName: job.employer_profiles?.company_name || '',
          jobTitle: job.title || job.job_title || '',
          propertyName: job.employer_profiles?.company_name || '',
          roleLevel: profile?.role_level || '',
        }),
      }).catch(() => {})
    }
  }

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  if (loading) return <DashboardShell role="talent"><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <div key={i} className="skeleton h-64 rounded-xl" />)}</div></DashboardShell>

  return (
    <DashboardShell role="talent" userName={profile?.full_name}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-medium text-ink">Browse Roles</h1>
        <p className="text-[13px] text-muted">{sorted.length} role{sorted.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <div className="md:col-span-2 relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input type="text" placeholder="Search roles or properties..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 !py-2 text-[13px]" />
        </div>
        <select value={roleFilter} onChange={e => setRoleFilter(e.target.value)} className="input-field !py-2 text-[13px]">
          <option value="">All levels</option>
          {ROLE_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select value={contractFilter} onChange={e => setContractFilter(e.target.value)} className="input-field !py-2 text-[13px]">
          <option value="">All contracts</option>
          {CONTRACT_TYPES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field !py-2 text-[13px]">
          <option value="match">Best match</option>
          <option value="newest">Newest</option>
          <option value="salary_high">Salary: high–low</option>
          <option value="salary_low">Salary: low–high</option>
        </select>
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-20"><Briefcase size={32} className="mx-auto text-muted mb-3" /><p className="text-[14px] text-muted">No roles match your filters.</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {paginatedSorted.map(job => (
            <div key={job.id} className="card p-0 overflow-hidden">
              <div className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className={tierClass(job.tier || 'Standard')}>{job.tier || 'Standard'}</span>
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: job.matchBg, color: job.matchColour }}>{job.matchScore}%</span>
                </div>
                <p className="eyebrow mb-0.5">{job.employer_profiles?.company_name}</p>
                <h3 className="text-[16px] font-medium text-ink mb-2">{job.title}</h3>
                <div className="flex flex-wrap gap-2 text-[12px] text-muted mb-3">
                  <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>
                  <span>{job.contract_type?.replace('_', ' ') || job.job_type}</span>
                  {job.salary_min && job.salary_max && <span>£{(job.salary_min/1000).toFixed(0)}k–£{(job.salary_max/1000).toFixed(0)}k</span>}
                </div>
                {(job.required_brands || job.required_product_houses || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-4">
                    {(job.required_brands || job.required_product_houses).slice(0, 3).map((b: string) => (
                      <span key={b} className="text-[10px] border border-border text-muted px-2 py-0.5 rounded-full">{b}</span>
                    ))}
                  </div>
                )}
                <div className="flex gap-2">
                  {applied.has(job.id) ? (
                    <div className="btn-secondary flex-1 text-center flex items-center justify-center gap-1 opacity-60 cursor-default"><Check size={12} />Applied</div>
                  ) : (
                    <button onClick={() => handleApply(job.id, job.matchScore)} className="btn-primary flex-1">Apply</button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
        <Pagination page={page} perPage={perPage} total={sorted.length} showPerPage={false} onPageChange={setPage} />
      )}
    </DashboardShell>
  )
}
