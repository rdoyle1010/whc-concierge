'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SponsoredAd from '@/components/SponsoredAd'
import Link from 'next/link'
import { Search, MapPin, Briefcase, ArrowRight, Bookmark, Star, Building2 } from 'lucide-react'
import Pagination from '@/components/Pagination'

export default function PublicJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 12
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    async function load() {
      let { data: rawData, error: jobsError } = await supabase
        .from('job_listings')
        .select('*, employer_profiles(company_name, property_name, logo_url, property_photos, tagline, review_score, review_count, star_rating)')
        .eq('is_live', true)
        .order('posted_date', { ascending: false })

      // Some existing databases do not yet have every optional property field.
      // Fall back to the established relationship so one missing column cannot hide all jobs.
      if (jobsError) {
        const fallback = await supabase
          .from('job_listings')
          .select('*, employer_profiles(company_name, property_name)')
          .eq('is_live', true)
          .order('posted_date', { ascending: false })
        rawData = fallback.data
        jobsError = fallback.error
      }
      if (jobsError) console.error('Unable to load public jobs:', jobsError.message)
      setJobs((rawData || []).map((j: any) => ({ ...j, title: j.job_title || j.title, description: j.job_description || j.description, employer_profiles: { ...j.employer_profiles, company_name: j.employer_profiles?.property_name || j.employer_profiles?.company_name } })))
      setLoading(false)
      // Check if logged in and load saved
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setIsLoggedIn(true)
        const res = await fetch('/api/saved-jobs')
        if (res.ok) { const d = await res.json(); setSaved(new Set((d.saved || []).map((s: any) => s.job_id))) }
      }
    }
    load()
  }, [])

  const toggleSave = async (jobId: string) => {
    if (!isLoggedIn) return
    const isSaved = saved.has(jobId)
    const next = new Set(saved)
    if (isSaved) { next.delete(jobId); await fetch('/api/saved-jobs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) }) }
    else { next.add(jobId); await fetch('/api/saved-jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) }) }
    setSaved(next)
  }

  const filtered = jobs.filter((job) => {
    if (search && !job.title.toLowerCase().includes(search.toLowerCase()) && !job.employer_profiles?.company_name?.toLowerCase().includes(search.toLowerCase())) return false
    if (location && !job.location?.toLowerCase().includes(location.toLowerCase())) return false
    return true
  })
  const paginatedJobs = filtered.slice((page - 1) * perPage, page * perPage)

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="pt-16 bg-white border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 text-center">
          <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>Open Positions</p>
          <h1 className="text-[36px] md:text-[48px] font-medium text-ink tracking-tight leading-[1.08] mb-4">Browse Roles</h1>
          <p className="text-[15px] text-secondary max-w-xl mx-auto mb-8">Discover your next position at the world&apos;s finest wellness destinations.</p>
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Job title or property..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input-field pl-9" />
            </div>
            <div className="relative flex-1">
              <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Location..." value={location} onChange={(e) => { setLocation(e.target.value); setPage(1) }} className="input-field pl-9" />
            </div>
          </div>
        </div>
      </section>

      <SponsoredAd placement="jobs_talent_sponsor" />

      <section className="py-12">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }} /></div>
          ) : filtered.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-16 text-center">
              <Briefcase size={32} className="mx-auto text-muted mb-3" />
              <p className="text-[15px] font-medium text-ink mb-2">No roles found</p>
              <p className="text-[13px] text-muted">Try adjusting your search.</p>
            </div>
          ) : (
            <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {paginatedJobs.map((job) => (
                <div key={job.id} className="bg-white border border-border rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group relative">
                  <Link
                    href={`/jobs/${job.id}`}
                    aria-label={`View role: ${job.title}`}
                    className="absolute inset-0 rounded-2xl z-0"
                  />
                  <div className="relative h-40 bg-[#e9e6df] overflow-hidden">
                    {job.employer_profiles?.property_photos?.[0] ? <img src={job.employer_profiles.property_photos[0]} alt={job.employer_profiles?.company_name || 'Property'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" /> : <div className="h-full w-full flex items-center justify-center"><Building2 size={34} className="text-muted/50" /></div>}
                    {job.employer_profiles?.logo_url && <div className="absolute bottom-4 left-5 h-14 w-14 overflow-hidden rounded-xl border-2 border-white bg-white shadow-sm"><img src={job.employer_profiles.logo_url} alt="" className="h-full w-full object-cover" /></div>}
                  </div>
                  <div className="p-6">
                  <div className="flex items-center justify-between mb-3">
                    {job.tier && <span className={tierClass(job.tier)}>{job.tier}</span>}
                    <span className="text-[12px] text-muted">{job.job_type}</span>
                  </div>
                  <h3 className="text-[20px] font-semibold tracking-tight text-ink mb-1">{job.title}</h3>
                  <div className="flex flex-wrap items-center gap-3"><p className="text-[13px] font-semibold text-accent">{job.employer_profiles?.company_name || 'Luxury wellness property'}</p>
                  {job.employer_profiles?.review_score ? <span className="inline-flex items-center gap-1 text-[12px] text-secondary"><Star size={13} className="fill-amber-400 text-amber-400" /> {job.employer_profiles.review_score} {job.employer_profiles.review_count ? `(${job.employer_profiles.review_count})` : ''}</span> : job.employer_profiles?.star_rating ? <span className="inline-flex items-center gap-1 text-[12px] text-secondary"><Star size={13} className="fill-amber-400 text-amber-400" /> {job.employer_profiles.star_rating}-star property</span> : null}</div>
                  <div className="flex items-center gap-3 text-[12px] text-muted mt-2">
                    <span className="flex items-center gap-1"><MapPin size={11} /><span>{job.location}</span></span>
                  </div>
                  <p className="text-[14px] font-medium text-ink mt-3">
                    {job.salary_min && job.salary_max ? `£${job.salary_min.toLocaleString()} - £${job.salary_max.toLocaleString()}` : 'Competitive salary'}
                  </p>
                  {job.description && <p className="mt-3 text-[13px] leading-6 text-secondary line-clamp-3">{job.description}</p>}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-border relative z-10">
                    <Link href={`/jobs/${job.id}`} className="flex items-center text-[13px] font-medium" style={{ color: '#C9A96E' }}>
                      {isLoggedIn ? 'Apply now' : 'Sign in to apply'} <ArrowRight size={14} className="ml-1" />
                    </Link>
                    <div className="flex items-center gap-3">
                      <Link href={`/jobs/${job.id}`} className="text-[12px] text-muted hover:text-ink transition-colors">
                        View role →
                      </Link>
                      {isLoggedIn && (
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(job.id) }} className={`p-1.5 rounded-lg transition-colors ${saved.has(job.id) ? 'text-accent' : 'text-muted hover:text-accent'}`} title={saved.has(job.id) ? 'Unsave' : 'Save'}>
                          <Bookmark size={16} fill={saved.has(job.id) ? 'currentColor' : 'none'} />
                        </button>
                      )}
                    </div>
                  </div>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} perPage={perPage} total={filtered.length} showPerPage={false} onPageChange={setPage} />
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}