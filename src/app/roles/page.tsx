'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { calculateMatchScore } from '@/lib/matching'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { MapPin, Briefcase, Search, Clock } from 'lucide-react'
import SkeletonCard from '@/components/SkeletonCard'

const ROLE_TYPES = ['All', 'Permanent', 'Fixed Term', 'Freelance', 'Agency', 'Seasonal']

export default function BrowseRolesPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [profile, setProfile] = useState<any>(null)
  const [search, setSearch] = useState('')
  const [roleType, setRoleType] = useState('All')
  const [locationFilter, setLocationFilter] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: cp } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
        setProfile(cp)
      }

      const { data: rawJobs } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, property_name)')
        .eq('is_live', true)
        .order('posted_date', { ascending: false })

      const normalized = (rawJobs || []).map((j: any) => {
        const title = j.job_title || j.title
        const description = j.job_description || j.description
        const companyName = j.employer_profiles?.property_name || j.employer_profiles?.company_name
        return { ...j, title, description, companyName }
      })

      // Score if user has profile
      const scored = normalized.map((job: any) => {
        if (profile && profile.role_level) {
          const result = calculateMatchScore(profile, job)
          if (result.hardStop) return { ...job, matchScore: 0 }
          return { ...job, matchScore: result.score, matchLabel: result.label, matchColour: result.colour, matchBg: result.bgColour }
        }
        return { ...job, matchScore: 0 }
      })

      setJobs(scored)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = jobs.filter(j => {
    if (search && !j.title?.toLowerCase().includes(search.toLowerCase()) && !j.companyName?.toLowerCase().includes(search.toLowerCase())) return false
    if (roleType !== 'All' && j.job_type?.toLowerCase() !== roleType.toLowerCase() && j.contract_type?.toLowerCase() !== roleType.toLowerCase().replace(' ', '_')) return false
    if (locationFilter && !j.location?.toLowerCase().includes(locationFilter.toLowerCase())) return false
    return true
  })

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="pt-16 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <h1 className="text-[36px] md:text-[44px] font-medium text-ink tracking-tight leading-[1.1] mb-3">Browse Roles</h1>
          <p className="text-[15px] text-secondary max-w-xl">Discover exceptional opportunities at the world&apos;s finest wellness properties.</p>
        </div>
      </section>

      {/* Filters */}
      <section className="bg-white border-b border-border sticky top-[60px] z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Search roles or properties..." value={search} onChange={e => setSearch(e.target.value)} className="input-field pl-9 !py-2 text-[13px]" />
            </div>
            <select value={roleType} onChange={e => setRoleType(e.target.value)} className="input-field !py-2 text-[13px]">
              {ROLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Location..." value={locationFilter} onChange={e => setLocationFilter(e.target.value)} className="input-field !py-2 text-[13px]" />
          </div>
          <p className="text-[11px] text-muted mt-2">{filtered.length} role{filtered.length !== 1 ? 's' : ''} available</p>
        </div>
      </section>

      {/* Results */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8 py-10">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[1,2,3,4,5,6].map(i => <SkeletonCard key={i} variant="role" />)}</div>
        ) : filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-16 text-center">
            <Briefcase size={32} className="mx-auto text-muted mb-3" />
            <p className="text-[15px] font-medium text-ink mb-2">No roles listed yet</p>
            <p className="text-[13px] text-muted">Check back soon — new roles are added regularly.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(job => (
              <Link key={job.id} href="/roles/match" className="bg-white border border-border rounded-xl p-5 hover:shadow-md hover:-translate-y-0.5 transition-all">
                <div className="flex items-center justify-between mb-3">
                  {job.tier && <span className={tierClass(job.tier)}>{job.tier}</span>}
                  {job.matchScore > 0 && (
                    <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full" style={{ backgroundColor: job.matchBg || '#F3F4F6', color: job.matchColour || '#6B7280' }}>{job.matchScore}%</span>
                  )}
                </div>
                <p className="eyebrow mb-0.5">{job.companyName}</p>
                <h3 className="text-[16px] font-medium text-ink mb-2">{job.title}</h3>
                <div className="flex flex-wrap gap-2 text-[12px] text-muted mb-3">
                  {job.location && <span className="flex items-center gap-1"><MapPin size={11} />{job.location}</span>}
                  {(job.contract_type || job.job_type) && <span className="flex items-center gap-1"><Briefcase size={11} />{(job.contract_type || job.job_type || '').replace('_', ' ')}</span>}
                </div>
                {job.salary_min && job.salary_max && (
                  <p className="text-[14px] font-medium text-accent">£{(job.salary_min/1000).toFixed(0)}k – £{(job.salary_max/1000).toFixed(0)}k</p>
                )}
                {(job.required_brands || []).length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-3">{(job.required_brands || []).slice(0, 3).map((b: string) => <span key={b} className="text-[10px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-2 py-0.5 rounded-full">{b}</span>)}</div>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>

      <Footer />
    </div>
  )
}
