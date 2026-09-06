'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { Search, Star, MapPin, Briefcase, ArrowRight } from 'lucide-react'
import { CONSULTANCY_SPECIALISMS, ENGAGEMENT_TYPES, WORKS_WITH } from '@/lib/consultancy'

// The public directory. Unlike Residency, which is anonymous by design, this
// is a showcase: the practice name, the projects and the outcomes are the
// product, and hiding them would leave nothing to look at.

const worksWithLabel = (value: string) => WORKS_WITH.find(option => option.value === value)?.label || 'UK'
const engagementLabel = (value: string) => ENGAGEMENT_TYPES.find(type => type.value === value)?.label || value

/** Initials, for a practice that has not uploaded a mark. Better than a gap. */
function monogram(name: string) {
  return String(name || '')
    .split(/\s+/).filter(Boolean).slice(0, 2)
    .map(word => word[0]?.toUpperCase() || '').join('') || 'C'
}

// One practice in a three-column grid sat stranded on the left with two empty
// columns beside it, which reads as a page that has broken rather than a
// directory that is selective. A consultant looking at that does not think
// "exclusive", they think "nobody is here and nothing works", and they close
// the tab instead of listing.
//
// So the layout answers to how many there actually are: a single practice gets
// the whole width and room to make its case, two share the row, and only at
// three does the third column appear.
function ConsultantCard({ profile, wide }: { profile: any; wide?: boolean }) {
  const specialisms: string[] = profile.specialisms || []
  const projects: any[] = profile.projects || []
  const engagements: string[] = profile.engagement_types || []

  const mark = profile.logo_url
    ? <img src={profile.logo_url} alt="" loading="lazy" className="h-full w-full object-contain" />
    : <span className="font-serif text-[20px] text-ink">{monogram(profile.practice_name)}</span>

  const meta = (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[11px] text-muted">
      {profile.based_in && <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> {profile.based_in}</span>}
      <span className="inline-flex items-center gap-1.5"><Briefcase size={12} /> {worksWithLabel(profile.works_with)}</span>
      {projects.length > 0 && <span>{projects.length} project{projects.length === 1 ? '' : 's'} on record</span>}
      {engagements.length > 0 && <span>{engagementLabel(engagements[0])}</span>}
    </div>
  )

  const chips = specialisms.length > 0 && (
    <div className="flex flex-wrap gap-1.5">
      {specialisms.slice(0, wide ? 5 : 3).map(item => (
        <span key={item} className="border border-border bg-white px-2.5 py-1 text-[11px] text-secondary">{item}</span>
      ))}
      {specialisms.length > (wide ? 5 : 3) && (
        <span className="px-2 py-1 text-[11px] text-muted">+{specialisms.length - (wide ? 5 : 3)} more</span>
      )}
    </div>
  )

  const featuredFlag = profile.featured && (
    <p className="inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink">
      <Star size={11} fill="currentColor" /> Featured
    </p>
  )

  const surface = profile.featured ? 'border-ink bg-[#f1f1f1]' : 'border-border bg-white'

  if (wide) {
    return (
      <Link href={`/consultancy/${profile.id}`}
        className={`group grid gap-8 border p-8 transition-colors hover:border-ink md:grid-cols-[128px_minmax(0,1fr)] md:p-10 ${surface}`}>
        <div className="flex h-32 w-32 items-center justify-center overflow-hidden border border-border bg-white">{mark}</div>
        <div className="min-w-0">
          {featuredFlag}
          <p className={`text-[26px] font-semibold leading-tight tracking-tight text-ink ${profile.featured ? 'mt-2' : ''}`}>{profile.practice_name}</p>
          {profile.headline && <p className="mt-2 max-w-2xl text-[14px] leading-7 text-secondary">{profile.headline}</p>}
          {profile.summary && <p className="mt-3 max-w-2xl text-[13px] leading-6 text-muted line-clamp-3">{profile.summary}</p>}
          <div className="mt-6">{chips}</div>
          <div className="mt-6">{meta}</div>
          <span className="mt-7 inline-flex items-center gap-2 text-[12px] font-semibold text-ink">
            View the practice <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    )
  }

  return (
    <Link href={`/consultancy/${profile.id}`}
      className={`group flex flex-col border p-6 transition-colors hover:border-ink ${surface}`}>
      {featuredFlag}
      <div className={`flex h-14 w-14 items-center justify-center overflow-hidden border border-border bg-white ${profile.featured ? 'mt-3' : ''}`}>{mark}</div>
      <p className="mt-4 text-[18px] font-semibold leading-snug text-ink">{profile.practice_name}</p>
      {profile.headline && <p className="mt-1.5 text-[13px] leading-6 text-secondary">{profile.headline}</p>}
      <div className="mt-4">{chips}</div>
      <div className="mt-auto pt-6">{meta}</div>
    </Link>
  )
}

export default function ConsultancyDirectory() {
  const [profiles, setProfiles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specialism, setSpecialism] = useState('')
  const [engagement, setEngagement] = useState('')

  useEffect(() => {
    fetch('/api/consultancy/public')
      .then(res => res.ok ? res.json() : { profiles: [] })
      .then(data => setProfiles(data.profiles || []))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(() => profiles.filter(profile => {
    if (specialism && !(profile.specialisms || []).includes(specialism)) return false
    if (engagement && !(profile.engagement_types || []).includes(engagement)) return false
    if (search) {
      const needle = search.toLowerCase()
      const haystack = [profile.practice_name, profile.headline, profile.summary, profile.based_in,
        ...(profile.specialisms || []), ...(profile.projects || []).map((p: any) => p.title)]
        .filter(Boolean).join(' ').toLowerCase()
      if (!haystack.includes(needle)) return false
    }
    return true
  }), [profiles, search, specialism, engagement])

  return (
    <>
      <Navbar />
      <main className="bg-white">
        <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pt-28 pb-8">
          <p className="eyebrow mb-2">Consultancy</p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-ink tracking-tight max-w-3xl">
            The people properties call when the answer is not another pair of hands
          </h1>
          <p className="mt-4 max-w-2xl text-[14px] leading-7 text-secondary">
            Spa design, pre-opening, commercial turnaround, retail, brand alignment and the rest of the work that shapes
            what a property becomes. Every listing is built around projects delivered and what they changed, not a
            biography. Contact anyone here directly.
          </p>

          {/* A directory with no visible way in fills up slowly or not at all,
              and a consultant reading this page is exactly who should be in it. */}
          <div className="mt-7 flex flex-wrap items-center gap-4">
            <Link href="/consultancy/join" className="btn-primary inline-flex items-center gap-2 text-[13px]">
              List your practice <ArrowRight size={14} />
            </Link>
            <p className="text-[12px] leading-6 text-muted">Free to list. About ten minutes, and no commission on work you win.</p>
          </div>

          <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                value={search} onChange={event => setSearch(event.target.value)}
                placeholder="Search by name, specialism or project"
                aria-label="Search consultants by name, specialism or project"
                className="input-field pl-10"
              />
            </div>
            <select value={specialism} onChange={event => setSpecialism(event.target.value)} aria-label="Filter by specialism" className="input-field sm:w-64">
              <option value="">Every specialism</option>
              {CONSULTANCY_SPECIALISMS.map(item => <option key={item} value={item}>{item}</option>)}
            </select>
            <select value={engagement} onChange={event => setEngagement(event.target.value)} aria-label="Filter by how the work is bought" className="input-field sm:w-52">
              <option value="">Any engagement</option>
              {ENGAGEMENT_TYPES.map(type => <option key={type.value} value={type.value}>{type.label}</option>)}
            </select>
          </div>
          <p className="mt-3 text-[12px] text-muted">{filtered.length} consultant{filtered.length === 1 ? '' : 's'}</p>
        </section>

        <section className="max-w-[1440px] mx-auto px-6 lg:px-10 pb-20">
          {loading ? (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="skeleton h-64" />)}</div>
          ) : filtered.length === 0 ? (
            <div className="border border-border p-12 text-center">
              {profiles.length === 0 ? (
                <>
                  <p className="text-[15px] text-ink">The directory is just opening.</p>
                  <p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-secondary">
                    The first practices are being listed now. If you advise properties on spa design, operations, retail
                    or brand, this is the room to be in early.
                  </p>
                  <Link href="/consultancy/join" className="btn-primary mt-6 inline-flex items-center gap-2 text-[13px]">
                    List your practice <ArrowRight size={14} />
                  </Link>
                </>
              ) : (
                <>
                  <p className="text-[15px] text-ink">No consultants match that.</p>
                  <p className="mt-2 text-[13px] text-secondary">Try a broader specialism, or clear the filters.</p>
                  <button type="button" onClick={() => { setSearch(''); setSpecialism(''); setEngagement('') }}
                    className="btn-secondary mt-5 text-[13px]">Clear filters</button>
                </>
              )}
            </div>
          ) : (
            <div className={`grid gap-5 ${
              filtered.length === 1 ? '' : filtered.length === 2 ? 'md:grid-cols-2' : 'md:grid-cols-2 xl:grid-cols-3'
            }`}>
              {filtered.map(profile => (
                <ConsultantCard key={profile.id} profile={profile} wide={filtered.length === 1} />
              ))}
            </div>
          )}
        </section>

        {profiles.length > 0 && (
          <section className="border-t border-border bg-[#f1f1f1]">
            <div className="max-w-[1440px] mx-auto px-6 lg:px-10 py-14 flex flex-wrap items-center justify-between gap-6">
              <div className="max-w-xl">
                <p className="eyebrow mb-2">For consultants</p>
                <h2 className="text-2xl font-semibold tracking-tight text-ink">Your work is already in these buildings</h2>
                <p className="mt-3 text-[13px] leading-7 text-secondary">
                  Listing is free. Put up the projects that changed something and the properties looking for exactly
                  that will find you. Featured placement is there if you want the top of the page - it is not needed to
                  be here.
                </p>
              </div>
              <Link href="/consultancy/join" className="btn-primary inline-flex items-center gap-2 text-[13px]">
                List your practice <ArrowRight size={14} />
              </Link>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
