'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import SponsoredAd from '@/components/SponsoredAd'
import SwipeDeck from '@/components/SwipeDeck'
import Link from 'next/link'
import { Search, MapPin, Briefcase, Bookmark, Star, Building2, Rows3, Layers3 } from 'lucide-react'
import Pagination from '@/components/Pagination'

// A raw postcode is not a place a candidate recognises - the property page
// applies the same guard.
const UK_POSTCODE = /^[A-Za-z]{1,2}\d[A-Za-z\d]?\s*\d[A-Za-z]{2}$/

function jobSalary(job: any): string | null {
  if (job.salary_display_text) return String(job.salary_display_text)
  if (job.salary_min && job.salary_max) return `£${Number(job.salary_min).toLocaleString()} - £${Number(job.salary_max).toLocaleString()}`
  if (job.salary_min) return `From £${Number(job.salary_min).toLocaleString()}`
  return null
}

function postedLabel(value: any): string | null {
  if (!value) return null
  const date = new Date(value)
  if (isNaN(date.getTime())) return null
  return `posted ${date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`
}

export default function PublicJobsPage() {
  const supabase = createClient()
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [location, setLocation] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [viewMode, setViewMode] = useState<'list'|'swipe'>('list')
  const perPage = 12
  const [saved, setSaved] = useState<Set<string>>(new Set())
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [scores, setScores] = useState<Record<string, number>>({})

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
        if (error?.name !== 'AbortError' && active) { setJobs([]); setTotal(0) }
      } finally { if (active) setLoading(false) }
    }, 250)
    return () => { active = false; controller.abort(); window.clearTimeout(timer) }
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

  // The intelligence no generic board has: a signed-in professional sees
  // their personal match with every visible role. Signed-out visitors see
  // nothing here, and any failure stays silent.
  useEffect(() => {
    if (!isLoggedIn || jobs.length === 0) return
    let active = true
    async function loadScores() {
      try {
        const res = await fetch('/api/talent/job-scores', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ jobIds: jobs.map(j => j.id).slice(0, 40) }),
        })
        if (!res.ok) return
        const d = await res.json()
        if (active && d?.scores) setScores(current => ({ ...current, ...d.scores }))
      } catch { /* silent - the list stands on its own */ }
    }
    loadScores()
    return () => { active = false }
  }, [isLoggedIn, jobs])

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

  const saveFromSwipe = async (job: any) => {
    if (!isLoggedIn) { window.location.href = '/login?account=talent'; return }
    if (saved.has(job.id)) return
    await fetch('/api/saved-jobs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: job.id }) })
    setSaved(current => new Set(current).add(job.id))
  }

  const isFeatured = (job: any) => job.tier === 'Platinum' || job.tier === 'Gold'
  const imageFor = (job: any, employer: any) => job.job_image_url || employer.property_photos?.[0] || null

  function metaLine(job: any, employer: any): string {
    const rawLocation = String(job.location || '').trim()
    const place = rawLocation && !UK_POSTCODE.test(rawLocation) ? rawLocation : null
    const star = employer.star_rating
      ? (isNaN(Number(employer.star_rating)) ? String(employer.star_rating) : `${employer.star_rating}-star`)
      : null
    const score = Number(employer.review_score || 0)
    const count = Number(employer.review_count || 0)
    const whc = score > 0
      ? `${score.toFixed(1)} WHC${count ? ` (${count} verified review${count === 1 ? '' : 's'})` : ''}`
      : null
    return [
      employer.company_name || 'Luxury wellness property',
      place,
      jobSalary(job),
      job.job_type,
      job.is_residency_role ? 'Residency' : null,
      star,
      whc,
      postedLabel(job.posted_date),
    ].filter(Boolean).join(' · ')
  }

  function listRow(job: any) {
    const employer = job.employer_profiles || {}
    const title = job.job_title || 'Wellness role'
    const score = scores[job.id]
    return (
      <div key={job.id} className="group relative flex items-baseline justify-between gap-6 border-t border-border py-6">
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-3">
            {isFeatured(job) && <span className="bg-accent px-2 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-white">Featured</span>}
            <h3 className="text-[20px] md:text-[23px] font-serif font-semibold tracking-tight text-ink transition-colors group-hover:text-accent">
              <Link href={`/jobs/${job.id}`} aria-label={`View role: ${title}`} className="focus:outline-none">
                {title}
                <span className="absolute inset-0" aria-hidden />
              </Link>
            </h3>
          </div>
          <p className="mt-1.5 text-[13px] leading-6 text-secondary">{metaLine(job, employer)}</p>
        </div>
        <div className="flex shrink-0 items-baseline gap-5">
          {typeof score === 'number' && (
            <span
              title="Your match with this role - open it for the full breakdown"
              className={`relative z-10 font-serif text-[20px] md:text-[23px] font-semibold ${score >= 70 ? 'text-accent' : 'text-secondary'}`}
            >
              {score}%
            </span>
          )}
          <span className="hidden sm:inline whitespace-nowrap text-[13px] font-semibold text-accent">View role →</span>
          {isLoggedIn && (
            <button
              type="button"
              onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSave(job.id) }}
              aria-label={saved.has(job.id) ? `Remove ${title} from saved roles` : `Save ${title}`}
              aria-pressed={saved.has(job.id)}
              className={`relative z-10 self-center p-1 ${saved.has(job.id) ? 'text-accent' : 'text-muted hover:text-accent'}`}
            >
              <Bookmark size={15} fill={saved.has(job.id) ? 'currentColor' : 'none'} />
            </button>
          )}
        </div>
      </div>
    )
  }

  function swipeCard(job: any) {
    const employer = job.employer_profiles || {}
    const image = imageFor(job, employer)
    const title = job.job_title || 'Wellness role'
    const description = job.job_description || ''
    return <article className="h-[500px] overflow-hidden border border-border bg-white shadow-sm">
      <div className="relative h-52 overflow-hidden bg-[#f5f6f8]">
        {image ? <img src={image} alt={`${title} at ${employer.company_name || 'wellness property'}`} className="h-full w-full object-cover" draggable={false}/> : <div className="flex h-full w-full items-center justify-center"><Building2 size={44} className="text-muted/50"/></div>}
        {isFeatured(job) && <span className="absolute left-5 top-5 bg-accent px-2 py-1 text-[9px] font-semibold uppercase tracking-[.12em] text-white">Featured</span>}
      </div>
      <div className="p-7">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {job.is_residency_role ? <span className="bg-[#e8eef4] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] text-accent">Residency</span> : <span/>}
          <span className="text-[11px] uppercase tracking-[.1em] text-muted">{job.job_type}</span>
        </div>
        <h2 className="mt-4 font-serif text-[28px] font-semibold tracking-tight text-ink">{title}</h2>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <p className="text-[13px] font-semibold text-accent">{employer.company_name || 'Luxury wellness property'}</p>
          {employer.review_score ? <span className="inline-flex items-center gap-1 text-[12px] text-secondary"><Star size={13} className="text-accent" fill="currentColor"/>{employer.review_score}{employer.review_count ? ` (${employer.review_count})` : ''}</span> : null}
        </div>
        <p className="mt-3 flex items-center gap-1 text-[12px] text-muted"><MapPin size={12}/>{job.location}</p>
        <p className="mt-3 font-serif text-[15px] font-medium text-ink">{jobSalary(job) || 'Competitive salary'}</p>
        {description && <p className="mt-3 line-clamp-3 text-[13px] leading-6 text-secondary">{description}</p>}
        <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
          <Link href={`/jobs/${job.id}`} onPointerDown={e => e.stopPropagation()} className="text-[13px] font-semibold text-ink">View full role →</Link>
          {saved.has(job.id) && <span className="text-[11px] font-semibold text-accent">Saved</span>}
        </div>
      </div>
    </article>
  }

  return <div className="min-h-screen bg-surface"><Navbar/><main id="main-content"><section className="pt-[76px] bg-white border-b border-border"><div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-16 text-center"><p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{color:'#5a6a76'}}>Open Positions</p><h1 className="text-[36px] md:text-[48px] font-medium text-ink tracking-tight leading-[1.08] mb-4">Browse Roles</h1><p className="text-[15px] text-secondary max-w-xl mx-auto mb-8">Live roles at exceptional properties, matched on real skills, qualifications and brands - not CV keywords.</p><div className="max-w-2xl mx-auto flex flex-col sm:flex-row gap-3"><div className="relative flex-1"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><input type="text" placeholder="Job title or property..." aria-label="Search by job title or property" value={search} onChange={e=>{setSearch(e.target.value);setPage(1)}} className="input-field pl-9"/></div><div className="relative flex-1"><MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted"/><input type="text" placeholder="Location..." aria-label="Search by location" value={location} onChange={e=>{setLocation(e.target.value);setPage(1)}} className="input-field pl-9"/></div></div></div></section><SponsoredAd placement="jobs_talent_sponsor"/><section className="py-12"><div className="max-w-[1440px] mx-auto px-6 lg:px-10">
    {loading ? <div className="flex h-64 items-center justify-center" role="status"><p className="text-[13px] text-muted">Loading roles...</p></div> : jobs.length===0 ? <div className="border border-border bg-white p-16 text-center"><Briefcase size={32} className="mx-auto mb-3 text-muted"/><p className="mb-2 text-[15px] font-medium text-ink">No roles found</p><p className="text-[13px] text-muted">Try adjusting your search.</p></div> : <>
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Live roles</p>
        <p className="mt-1 text-[13px] text-secondary">Featured opportunities appear first. Match scores are always independent of paid placement.</p>
      </div>
      <div className="inline-flex self-start border border-border bg-white p-1" role="group" aria-label="Choose how to browse roles">
        <button type="button" onClick={()=>setViewMode('list')} aria-pressed={viewMode==='list'} className={`inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold ${viewMode==='list'?'bg-accent text-white':'text-secondary'}`}><Rows3 size={13}/>List</button>
        <button type="button" onClick={()=>setViewMode('swipe')} aria-pressed={viewMode==='swipe'} className={`inline-flex items-center gap-2 px-4 py-2 text-[11px] font-semibold ${viewMode==='swipe'?'bg-accent text-white':'text-secondary'}`}><Layers3 size={13}/>Swipe</button>
      </div>
    </div>
    {viewMode==='swipe'
      ? <SwipeDeck items={jobs} renderItem={(job)=>swipeCard(job)} onLeft={async()=>{}} onRight={saveFromSwipe}/>
      : <><div className="border-x border-b border-border bg-white px-6 md:px-8">{jobs.map(job=>listRow(job))}</div><Pagination page={page} perPage={perPage} total={total} showPerPage={false} onPageChange={setPage}/></>}
    </>}</div></section></main><Footer/></div>
}
