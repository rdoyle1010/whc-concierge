'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Briefcase, MapPin, Search, Sparkles } from 'lucide-react'
import Pagination from '@/components/Pagination'

const ROLE_TYPES = ['All', 'Permanent', 'Fixed Term', 'Freelance', 'Agency', 'Seasonal']

export default function PublicRolesBrowser({ jobs }: { jobs: any[] }) {
  const [search, setSearch] = useState('')
  const [roleType, setRoleType] = useState('All')
  const [locationFilter, setLocationFilter] = useState('')
  const [page, setPage] = useState(1)
  const perPage = 12

  const filtered = useMemo(() => jobs.filter(job => {
    const q = search.trim().toLowerCase()
    if (q && !job.title?.toLowerCase().includes(q) && !job.description?.toLowerCase().includes(q) && !job.location?.toLowerCase().includes(q)) return false
    if (roleType !== 'All' && job.job_type?.toLowerCase() !== roleType.toLowerCase() && job.contract_type?.toLowerCase() !== roleType.toLowerCase().replace(' ', '_')) return false
    if (locationFilter && !job.location?.toLowerCase().includes(locationFilter.toLowerCase())) return false
    return true
  }), [jobs, search, roleType, locationFilter])

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  return (
    <>
      <section className="bg-white border-b border-border sticky top-[76px] z-40">
        <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2 relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input type="text" placeholder="Search roles, skills or locations..." aria-label="Search roles, skills or locations" value={search} onChange={e => { setSearch(e.target.value); setPage(1) }} className="input-field pl-9 !py-2 text-[13px]" />
            </div>
            <select value={roleType} aria-label="Filter by role type" onChange={e => { setRoleType(e.target.value); setPage(1) }} className="input-field !py-2 text-[13px]">
              {ROLE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            <input type="text" placeholder="Location..." aria-label="Filter by location" value={locationFilter} onChange={e => { setLocationFilter(e.target.value); setPage(1) }} className="input-field !py-2 text-[13px]" />
          </div>
          <p className="text-[11px] text-muted mt-2">{filtered.length} opportunity{filtered.length !== 1 ? 'ies' : 'y'} available</p>
        </div>
      </section>

      <section className="max-w-[1440px] mx-auto px-6 lg:px-10 py-12">
        {filtered.length === 0 ? (
          <div className="bg-white border border-border rounded-xl p-16 text-center">
            <Briefcase size={32} className="mx-auto text-muted mb-3" />
            <p className="text-[15px] font-medium text-ink mb-2">No roles match those filters</p>
            <p className="text-[13px] text-muted">Try a broader location or role type.</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filtered.slice((page - 1) * perPage, page * perPage).map(job => (
                <article key={job.id} className="bg-white border border-border rounded-2xl p-6 hover:shadow-lg hover:-translate-y-0.5 transition-all">
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2">
                      {job.tier && <span className={tierClass(job.tier)}>{job.tier}</span>}
                      <span className="text-[10px] uppercase tracking-[0.13em] text-muted">Verified luxury property</span>
                    </div>
                    {(job.contract_type || job.job_type) && <span className="text-[11px] capitalize text-muted">{(job.contract_type || job.job_type || '').replaceAll('_', ' ')}</span>}
                  </div>

                  <h2 className="text-[20px] md:text-[22px] font-semibold tracking-[-0.02em] text-ink mb-3">{job.title}</h2>
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-[12px] text-muted mb-4">
                    {job.location && <span className="flex items-center gap-1"><MapPin size={12} />{job.location}</span>}
                    {(job.contract_type || job.job_type) && <span className="flex items-center gap-1"><Briefcase size={12} />{(job.contract_type || job.job_type || '').replaceAll('_', ' ')}</span>}
                    {job.salary && <span className="font-medium text-accent">{job.salary}</span>}
                  </div>

                  {job.description && <p className="text-[13px] leading-6 text-secondary line-clamp-3">{job.description}</p>}

                  {(job.required_brands || []).length > 0 && <div className="flex flex-wrap gap-1.5 mt-4">{(job.required_brands || []).slice(0, 4).map((brand: string) => <span key={brand} className="text-[10px] font-medium bg-[#f3f0eb] text-accent border border-accent/20 px-2 py-1 rounded-full">{brand}</span>)}</div>}

                  <div className="mt-6 pt-5 border-t border-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
                    <div>
                      <p className="text-[12px] font-medium text-ink">Like the sound of this?</p>
                      <p className="text-[11px] text-muted mt-0.5">Create a free profile to reveal the property, full brief and your personal match.</p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Link href={`/login?redirect=${encodeURIComponent(`/jobs/${job.id}`)}`} className="btn-secondary inline-flex items-center gap-1.5 text-[12px]">Unlock full role <ArrowRight size={12} /></Link>
                      <Link href="/login?redirect=/roles/match" className="btn-primary inline-flex items-center gap-1.5 text-[12px]"><Sparkles size={12} /> See my match</Link>
                    </div>
                  </div>
                </article>
              ))}
            </div>
            <Pagination page={page} perPage={perPage} total={filtered.length} showPerPage={false} onPageChange={setPage} />
          </>
        )}
      </section>
    </>
  )
}
