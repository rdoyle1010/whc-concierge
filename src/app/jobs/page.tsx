'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SponsoredAd from '@/components/SponsoredAd'
import Link from 'next/link'
import { Search, MapPin, Briefcase, ArrowRight, Bookmark, Star, Building2, Sparkles } from 'lucide-react'
import Pagination from '@/components/Pagination'

export default function PublicJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 12
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    let active = true
    const controller = new AbortController()
    const timer = window.setTimeout(async () => {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page), per_page: String(perPage) })
      if (search.trim()) params.set('search', search.trim())
      if (location.trim()) params.set('location', location.trim())

      try {
        const res = await fetch(`/api/jobs/public?${params.toString()}`, { signal: controller.signal })
        const body = res.ok ? await res.json() : { rows: [], pagination: { total: 0 } }
        if (!active) return
        setJobs(body.rows || [])
        setTotal(body.pagination?.total || 0)
      } catch (error: any) {
        if (error?.name !== 'AbortError' && active) {
          setJobs([])
          setTotal(0)
        }
      } finally {
        if (active) setLoading(false)
      }
    }, 250)

    return () => {
      active = false
      controller.abort()
      window.clearTimeout(timer)
    }
  }, [page, search, location])

  useEffect(() => {
    let active = true
    async function loadSaved() {
      const { data: sessionData } = await supabase.auth.getSession()
      const user = sessionData.session?.user
      if (!active || !user) return
      setIsLoggedIn(true)
      const res = await fetch('/api/saved-jobs')
      if (res.ok) {
        const d = await res.json()
        if (active) setSaved(new Set((d.saved || []).map((s: any) => s.job_id)))
      }
    }
    loadSaved()
    return () => { active = false }
  }, [])

  const toggleSave = async (jobId: string) => {
    if (!isLoggedIn) return
    const isSaved = saved.has(jobId)
    const next = new Set(saved)
    if (isSaved) {
      next.delete(jobId)
      await fetch('/api/saved-jobs', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) })
    } else {
      next.add(jobId)
      await fetch('/api/saved-jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId }) })
    }
    setSaved(next)
  }

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'
  const tierRank = (t?: string) => t === 'Platinum' ? 4 : t === 'Gold' ? 3 : t === 'Silver' ? 2 : t === 'Bronze' ? 1 : 0
  const tierBenefits = (t?: string) => t === 'Platinum'
    ? 'Top opportunity · premium placement'
    : t === 'Gold'
      ? 'Featured opportunity'
      : t === 'Silver'
        ? 'Priority listing'
        : ''

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />
      <section className="pt-16 bg-white border-b border-border">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 text-center">
          <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>Open Positions</p>
          <h1 className="text-[36px] md:text-[48px] font-medium text-ink tracking-tight leading-[1.08] mb-4">Browse Roles</h1>
          <p className="text-[15px] text-secondary max-w-xl mx-auto mb-8">Discover your next position at the world&apos;s finest wellness destinations.</p>
          <div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input type="text" placeholder="Job title or property..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input-field pl-9" /></div>
            <div className="relative flex-1"><MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input type="text" placeholder="Location..." value={location} onChange={(e) => { setLocation(e.target.value); setPage(1) }} className="input-field pl-9" /></div>
          </div>
        </div>
      </section>

      <SponsoredAd placement="jobs_talent_sponsor" />

      <section className="py-12">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10">
          {loading ? (
            <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-t-transparent rounded-full" style={{ borderColor: '#C9A96E', borderTopColor: 'transparent' }} /></div>
          ) : jobs.length === 0 ? (
            <div className="bg-white border border-border rounded-xl p-16 text-center"><Briefcase size={32} className="mx-auto text-muted mb-3" /><p className="text-[15px] font-medium text-ink mb-2">No roles found</p><p className="text-[13px] text-muted">Try adjusting your search.</p></div>
          ) : (
            <>
              <div className="mb-6 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Priority order</p>
                  <p className="mt-1 text-[13px] text-secondary">Platinum opportunities appear first, followed by Gold, Silver and Bronze. Match scores remain independent of paid placement.</p>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
                {jobs.map((job) => {
                  const employer = job.employer_profiles || {}
                  const title = job.job_title || 'Wellness role'
                  const description = job.job_description || ''
                  const rank = tierRank(job.tier)
                  const platinum = rank === 4
                  const gold = rank === 3
                  const silver = rank === 2
                  const cardSpan = platinum ? 'lg:col-span-2' : ''
                  const imageHeight = platinum ? 'h-56 md:h-64' : gold ? 'h-48' : silver ? 'h-44' : 'h-40'
                  const bodyPadding = platinum ? 'p-7 md:p-9' : gold ? 'p-7' : 'p-6'
                  const titleSize = platinum ? 'text-[26px] md:text-[30px]' : gold ? 'text-[23px]' : 'text-[20px]'
                  const descriptionClamp = platinum ? 'line-clamp-5' : gold ? 'line-clamp-4' : 'line-clamp-3'
                  return (
                    <article key={job.id} className={`${cardSpan} bg-white border ${platinum ? 'border-[#C9A96E]/60 shadow-xl' : gold ? 'border-[#C9A96E]/35 shadow-md' : 'border-border'} rounded-2xl overflow-hidden hover:shadow-xl hover:-translate-y-0.5 transition-all group relative`}>
                      <Link href={`/jobs/${job.id}`} aria-label={`View role: ${title}`} className="absolute inset-0 rounded-2xl z-0" />
                      <div className={`relative ${imageHeight} bg-[#e9e6df] overflow-hidden`}>
                        {employer.property_photos?.[0] ? <img src={employer.property_photos[0]} alt={employer.company_name || 'Property'} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]" /> : <div className="h-full w-full flex items-center justify-center"><Building2 size={platinum ? 44 : 34} className="text-muted/50" /></div>}
                        {rank >= 3 && <div className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-ink shadow-sm"><Sparkles size={12} style={{ color: '#C9A96E' }} />{platinum ? 'Top opportunity' : 'Featured role'}</div>}
                      </div>
                      <div className={bodyPadding}>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <div className="flex items-center gap-2">{job.tier && <span className={tierClass(job.tier)}>{job.tier}</span>}{tierBenefits(job.tier) && <span className="text-[11px] text-muted">{tierBenefits(job.tier)}</span>}</div>
                          <span className="text-[12px] text-muted">{job.job_type}</span>
                        </div>
                        <h3 className={`${titleSize} font-semibold tracking-tight text-ink mb-1`}>{title}</h3>
                        <div className="flex flex-wrap items-center gap-3"><p className="text-[13px] font-semibold text-accent">{employer.company_name || 'Luxury wellness property'}</p>{employer.review_score ? <span className="inline-flex items-center gap-1 text-[12px] text-secondary"><Star size={13} className="fill-amber-400 text-amber-400" /> {employer.review_score} {employer.review_count ? `(${employer.review_count})` : ''}</span> : employer.star_rating ? <span className="inline-flex items-center gap-1 text-[12px] text-secondary"><Star size={13} className="fill-amber-400 text-amber-400" /> {employer.star_rating}-star property</span> : null}</div>
                        <div className="flex items-center gap-3 text-[12px] text-muted mt-2"><span className="flex items-center gap-1"><MapPin size={11} /><span>{job.location}</span></span></div>
                        <p className={`${platinum ? 'text-[16px]' : 'text-[14px]'} font-medium text-ink mt-3`}>{job.salary_display_text || (job.salary_min && job.salary_max ? `£${job.salary_min.toLocaleString()} - £${job.salary_max.toLocaleString()}` : 'Competitive salary')}</p>
                        {description && <p className={`mt-3 ${platinum ? 'text-[14px]' : 'text-[13px]'} leading-6 text-secondary ${descriptionClamp}`}>{description}</p>}
                        <div className="flex items-center justify-between mt-5 pt-4 border-t border-border relative z-10">
                          <Link href={`/jobs/${job.id}`} className="flex items-center text-[13px] font-medium" style={{ color: '#C9A96E' }}>{isLoggedIn ? 'Apply now' : 'Sign in to apply'} <ArrowRight size={14} className="ml-1" /></Link>
                          <div className="flex items-center gap-3"><Link href={`/jobs/${job.id}`} className="text-[12px] text-muted hover:text-ink transition-colors">View role →</Link>{isLoggedIn && <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleSave(job.id) }} className={`p-1.5 rounded-lg transition-colors ${saved.has(job.id) ? 'text-accent' : 'text-muted hover:text-accent'}`} title={saved.has(job.id) ? 'Unsave' : 'Save'}><Bookmark size={16} fill={saved.has(job.id) ? 'currentColor' : 'none'} /></button>}</div>
                        </div>
                      </div>
                    </article>
                  )
                })}
              </div>
              <Pagination page={page} perPage={perPage} total={total} showPerPage={false} onPageChange={setPage} />
            </>
          )}
        </div>
      </section>
      <Footer />
    </div>
  )
}
