'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Search, MapPin, Star, Clock, Shield, ShieldCheck, ChevronDown, X, SlidersHorizontal, GraduationCap } from 'lucide-react'
import { ACADEMY, courseTitle } from '@/lib/academy'

const SERVICE_FILTERS = ['Swedish Massage','Deep Tissue','Hot Stone','Aromatherapy','ESPA Facial','Elemis Facial','Dermalogica Facial','Body Wraps','Reflexology','Reiki','Prenatal Massage','Sports Massage','Laser','Injectables','Lashes','Nails','Waxing']
const BRAND_FILTERS = ['ESPA','Elemis','Dermalogica','Comfort Zone','Aromatherapy Associates','Bamford','Sodashi','Thalgo','Germaine de Capuccini','Decleor','La Mer']
const ROLE_FILTERS = ['Apprentice','Therapist','Senior Therapist','Lead Therapist','Spa Manager','Receptionist']

// Normalise a raw postcode entry to its outward code, e.g. 'SW1A 1AA' -> 'SW1A', 'bs1' -> 'BS1', 'BS' -> 'BS'.
// Returns null when the input does not look like the start of a UK postcode.
function normaliseOutward(raw: string): string | null {
  const compact = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!compact) return null
  // A full postcode always ends with digit + two letters (the inward code) - strip it if present
  const outward = compact.length > 4 && /\d[A-Z]{2}$/.test(compact) ? compact.slice(0, -3) : compact.slice(0, 4)
  // Valid shapes: area letters only ('BS', 'SW') or letters followed by a district ('BS1', 'SW1A')
  if (/^[A-Z]{1,2}$/.test(outward) || /^[A-Z]{1,2}\d[A-Z0-9]?$/.test(outward)) return outward
  return null
}

// Leading letters of an outward code, e.g. 'SW1A' -> 'SW'
const areaOf = (outward: string) => outward.match(/^[A-Z]{1,2}/)?.[0] || outward

// Geocode the searcher's postcode (or district) via postcodes.io - free,
// no key, CORS-friendly. Returns null when the lookup fails; the search then
// falls back to district matching rather than erroring.
async function geocodeSearch(raw: string): Promise<{ lat: number; lng: number } | null> {
  const compact = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!compact) return null
  try {
    if (compact.length > 4 && /\d[A-Z]{2}$/.test(compact)) {
      const res = await fetch(`https://api.postcodes.io/postcodes/${compact}`)
      if (res.ok) {
        const j = await res.json()
        if (j?.result?.latitude != null) return { lat: j.result.latitude, lng: j.result.longitude }
      }
    }
    const outward = normaliseOutward(raw)
    if (outward && /\d/.test(outward)) {
      const res = await fetch(`https://api.postcodes.io/outcodes/${outward}`)
      if (res.ok) {
        const j = await res.json()
        if (j?.result?.latitude != null) return { lat: j.result.latitude, lng: j.result.longitude }
      }
    }
  } catch { /* fall back to district matching */ }
  return null
}

function FilterSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border-b border-border pb-4 mb-4">
      <button type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left mb-2">
        <span className="text-[13px] font-medium text-ink">{title}</span>
        <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <div className="space-y-1.5">{children}</div>}
    </div>
  )
}

export default function AgencyPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [postcode, setPostcode] = useState('')
  const [radius, setRadius] = useState('UK-wide')
  const [services, setServices] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [insuredOnly, setInsuredOnly] = useState(false)
  const [availNow, setAvailNow] = useState(false)
  const [sortBy, setSortBy] = useState('match')
  const [visible, setVisible] = useState(12)
  const [appliedSearch, setAppliedSearch] = useState<{ outward: string; area: string; radius: string; lat?: number | null; lng?: number | null } | null>(null)
  const [postcodeError, setPostcodeError] = useState('')

  const [availToday, setAvailToday] = useState<Set<string>>(new Set())
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [academySel, setAcademySel] = useState<string[]>([])
  const [academyMap, setAcademyMap] = useState<Map<string, string[]>>(new Map())
  const [requiresSignIn, setRequiresSignIn] = useState(false)
  const [directoryError, setDirectoryError] = useState('')
  const [originGeocoded, setOriginGeocoded] = useState(true)

  useEffect(() => {
    fetch('/api/agency/directory')
      .then(async res => ({ ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) }))
      .then(({ ok, status, body }) => {
        setRequiresSignIn(status === 401)
        setDirectoryError(ok || status === 401 ? '' : (body.error || 'Directory unavailable'))
        setOriginGeocoded(body.origin?.geocoded !== false)
        setCandidates(ok ? (body.candidates || []) : [])
        setLoading(false)
      })
      .catch(() => { setCandidates([]); setDirectoryError('Directory unavailable'); setLoading(false) })
    // Who has marked TODAY as available on their calendar? (public read is
    // available=true rows only; fails silently if the table isn't live yet)
    const today = new Date().toLocaleDateString('en-CA')
    supabase.from('agency_availability').select('candidate_id')
      .eq('date', today).eq('available', true)
      .then(({ data }) => { if (data) setAvailToday(new Set(data.map((d: any) => d.candidate_id))) })
    // WHC Academy badges - RLS only exposes COMPLETED enrolments publicly
    supabase.from('course_enrollments').select('candidate_id, course_slug')
      .not('completed_at', 'is', null)
      .then(({ data }) => {
        if (!data) return
        const m = new Map<string, string[]>()
        for (const r of data) m.set(r.candidate_id, [...(m.get(r.candidate_id) || []), r.course_slug])
        setAcademyMap(m)
      })
  }, [])

  const toggleFilter = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const clearFilters = () => {
    setServices([]); setBrands([]); setRoles([]); setInsuredOnly(false); setAvailNow(false); setAcademySel([]); setPostcode(''); setAppliedSearch(null); setPostcodeError(''); setDirectoryError('')
    setLoading(true)
    fetch('/api/agency/directory')
      .then(async res => ({ ok: res.ok, status: res.status, body: await res.json().catch(() => ({})) }))
      .then(({ ok, status, body }) => {
        setRequiresSignIn(status === 401)
        setOriginGeocoded(body.origin?.geocoded !== false)
        setDirectoryError(ok || status === 401 ? '' : (body.error || 'Directory unavailable'))
        setCandidates(ok ? (body.candidates || []) : [])
        setLoading(false)
      })
      .catch(() => { setDirectoryError('Directory unavailable'); setLoading(false) })
  }

  const handleSearch = async () => {
    if (radius === 'UK-wide') {
      setPostcodeError('')
      setAppliedSearch(null)
      setLoading(true)
      const res = await fetch('/api/agency/directory')
      const body = await res.json().catch(() => ({}))
      setRequiresSignIn(res.status === 401)
      setOriginGeocoded(body.origin?.geocoded !== false)
      setCandidates(res.ok ? (body.candidates || []) : [])
      setDirectoryError(res.ok || res.status === 401 ? '' : (body.error || 'Directory unavailable'))
      setLoading(false)
      return
    }
    const outward = normaliseOutward(postcode)
    if (!outward) { setPostcodeError('Please enter a valid UK postcode, e.g. BS1 or SW1A 1AA'); return }
    const coords = await geocodeSearch(postcode)
    if (!coords) { setPostcodeError('We could not locate that postcode. Please enter a full UK postcode for an accurate mileage search.'); return }
    setPostcodeError('')
    setAppliedSearch({ outward, area: areaOf(outward), radius, lat: coords?.lat ?? null, lng: coords?.lng ?? null })
    setLoading(true)
    const radiusMiles = parseInt(radius, 10)
    const params = new URLSearchParams({ lat: String(coords.lat), lng: String(coords.lng), radius: String(radiusMiles) })
    const res = await fetch(`/api/agency/directory?${params}`)
    const body = await res.json().catch(() => ({}))
    setRequiresSignIn(res.status === 401)
    setOriginGeocoded(body.origin?.geocoded !== false)
    setCandidates(res.ok ? (body.candidates || []) : [])
    setDirectoryError(res.ok || res.status === 401 ? '' : (body.error || 'Directory unavailable'))
    setLoading(false)
    setVisible(12)
  }

  const searchUkWide = async () => {
    setRadius('UK-wide')
    setAppliedSearch(null)
    setPostcodeError('')
    setLoading(true)
    const res = await fetch('/api/agency/directory')
    const body = await res.json().catch(() => ({}))
    setRequiresSignIn(res.status === 401)
    setOriginGeocoded(body.origin?.geocoded !== false)
    setCandidates(res.ok ? (body.candidates || []) : [])
    setDirectoryError(res.ok || res.status === 401 ? '' : (body.error || 'Directory unavailable'))
    setLoading(false)
    setVisible(12)
  }

  // Real miles from the search point to a candidate, when both are geocoded
  const candidateMiles = (c: any): number | null => {
    return typeof c.distance_miles === 'number' ? c.distance_miles : null
  }

  // Location matching: TRUE mileage when both sides are geocoded; otherwise
  // tiered postcode matching (district / area letters) as a fallback.
  const matchesLocation = (c: any): boolean => {
    // The API has already enforced the employer's chosen radius and the
    // professional's own travel radius. This client filter is display-only.
    return c.within_radius !== false
  }

  const filtered = candidates.filter(c => {
    // Agency register gating: only candidates with an active listing appear.
    // `undefined` (column not yet migrated on the live DB) passes through so
    // the directory never blanks out mid-deploy; `false` (not subscribed) hides.
    if (c.agency_available === false) return false
    if (insuredOnly && !c.has_insurance) return false
    if (availNow && c.availability_status !== 'immediately' && !availToday.has(c.id)) return false
    if (services.length > 0 && !services.some(s => (c.services_offered || []).some((sp: string) => sp.toLowerCase().includes(s.toLowerCase())))) return false
    if (brands.length > 0 && !brands.some(b => (c.product_houses || []).some((ph: string) => ph.toLowerCase().includes(b.toLowerCase())))) return false
    if (roles.length > 0 && !roles.includes(c.role_level)) return false
    // Academy filter: the candidate must hold EVERY selected certificate -
    // "retail trained AND Elemis trained" is how a hotel actually hires.
    if (academySel.length > 0 && !academySel.every(s => (academyMap.get(c.id) || []).includes(s))) return false
    if (!matchesLocation(c)) return false
    return true
  })

  const sorted = [...filtered].sort((a, b) => {
    // Featured-tier agency subscribers always rise to the top
    const aFeat = a.agency_tier === 'featured' ? 1 : 0
    const bFeat = b.agency_tier === 'featured' ? 1 : 0
    if (aFeat !== bFeat) return bFeat - aFeat
    if (sortBy === 'rated') return (b.review_score || 0) - (a.review_score || 0)
    if (sortBy === 'rate_high') return (b.hourly_rate || (b.day_rate_max || b.day_rate_min || 0) / 8) - (a.hourly_rate || (a.day_rate_max || a.day_rate_min || 0) / 8)
    if (sortBy === 'rate_low') return (a.hourly_rate || (a.day_rate_min || 7992) / 8) - (b.hourly_rate || (b.day_rate_min || 7992) / 8)
    if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    // Default: featured first, then rating
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return (b.review_score || 0) - (a.review_score || 0)
  })

  return (
    <div className="min-h-screen bg-surface">
      <Navbar />

      {/* Hero */}
      <section className="pt-16 bg-white border-b border-border">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-14">
          <h1 className="text-[36px] md:text-[44px] font-medium text-ink tracking-tight leading-[1.1] mb-3">Find Exceptional Spa Talent</h1>
          <p className="text-[15px] text-secondary max-w-xl mb-8">Search our network of verified, insured spa professionals available for agency work, seasonal cover and specialist treatments.</p>
          <form onSubmit={e => { e.preventDefault(); handleSearch() }} className="flex flex-col sm:flex-row gap-3 max-w-2xl">
            <input type="text" placeholder="Enter postcode" value={postcode} onChange={e => { setPostcode(e.target.value); if (postcodeError) setPostcodeError('') }} className="input-field flex-1" />
            <select value={radius} onChange={e => setRadius(e.target.value)} className="input-field sm:w-40">
              <option>UK-wide</option><option>5 miles</option><option>10 miles</option><option>25 miles</option><option>50 miles</option><option>100 miles</option>
            </select>
            <button type="submit" className="btn-primary flex items-center gap-2"><Search size={14} />Search</button>
          </form>
          {postcodeError && <p className="text-[12px] text-red-600 mt-2">{postcodeError}</p>}
          {appliedSearch && (
            <div className="mt-3">
              <span className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-3 py-1 rounded-full">
                <MapPin size={11} />
                Near {appliedSearch.outward}{appliedSearch.radius === 'UK-wide' ? ' (UK-wide)' : ` (within ~${appliedSearch.radius})`}
                <button type="button" onClick={() => setAppliedSearch(null)} aria-label="Clear location filter" className="hover:text-ink transition-colors"><X size={12} /></button>
              </span>
            </div>
          )}
        </div>
      </section>

      {(() => {
        const activeFilterCount = services.length + brands.length + roles.length + (insuredOnly ? 1 : 0) + (availNow ? 1 : 0)
        const filterPanel = (
          <div className="bg-white border border-border rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-[14px] font-medium text-ink">Filters</p>
                <button type="button" onClick={clearFilters} className="text-[11px] text-muted hover:text-ink">Clear all</button>
              </div>

              <FilterSection title="Availability" defaultOpen>
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={availNow} onChange={() => setAvailNow(!availNow)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">Available Now</span></label>
              </FilterSection>

              <FilterSection title="Services Offered" defaultOpen>
                {SERVICE_FILTERS.map(s => (
                  <label key={s} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={services.includes(s)} onChange={() => toggleFilter(services, setServices, s)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">{s}</span></label>
                ))}
              </FilterSection>

              <FilterSection title="Product Houses">
                {BRAND_FILTERS.map(b => (
                  <label key={b} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={brands.includes(b)} onChange={() => toggleFilter(brands, setBrands, b)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">{b}</span></label>
                ))}
              </FilterSection>

              <FilterSection title="Role Level">
                {ROLE_FILTERS.map(r => (
                  <label key={r} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={roles.includes(r)} onChange={() => toggleFilter(roles, setRoles, r)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">{r}</span></label>
                ))}
              </FilterSection>

              <FilterSection title="Insurance">
                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={insuredOnly} onChange={() => setInsuredOnly(!insuredOnly)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">Insured only</span></label>
              </FilterSection>

              <FilterSection title="WHC Academy">
                {ACADEMY.map(course => (
                  <label key={course.slug} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={academySel.includes(course.slug)} onChange={() => toggleFilter(academySel, setAcademySel, course.slug)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[12px] text-secondary">{course.title}</span></label>
                ))}
              </FilterSection>
          </div>
        )
        return (
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[76px] self-start max-h-[calc(100vh-100px)] overflow-y-auto">
            {filterPanel}
          </aside>

          {/* Filter drawer (mobile) - the spa manager on a phone at 7am can
              filter by treatment and brand just like on desktop */}
          {filtersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} />
              <div className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] bg-surface overflow-y-auto p-4">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-[14px] font-semibold text-ink">Refine search</p>
                  <button type="button" onClick={() => setFiltersOpen(false)} className="text-gray-400 hover:text-ink p-1"><X size={18} /></button>
                </div>
                {filterPanel}
                <button type="button" onClick={() => setFiltersOpen(false)} className="btn-primary w-full mt-4 text-[13px]">
                  Show {sorted.length} therapist{sorted.length !== 1 ? 's' : ''}
                </button>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-5 gap-3">
              <div className="flex items-center gap-3">
                <button type="button" onClick={() => setFiltersOpen(true)}
                  className="lg:hidden inline-flex items-center gap-1.5 text-[12px] font-medium border border-border bg-white rounded-lg px-3 py-1.5 text-ink">
                  <SlidersHorizontal size={13} /> Filters{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
                </button>
                <p className="text-[13px] text-muted">{sorted.length} therapist{sorted.length !== 1 ? 's' : ''}</p>
              </div>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field !w-auto !py-1.5 text-[12px]">
                <option value="match">Best Match</option><option value="rated">Highest Rated</option><option value="rate_low">Day Rate ↑</option><option value="rate_high">Day Rate ↓</option><option value="recent">Most Recent</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <div key={i} className="skeleton h-72 rounded-xl" />)}</div>
            ) : requiresSignIn ? (
              <div className="bg-white border border-border p-10 text-center">
                <h2 className="font-serif text-2xl text-ink mb-2">Agency profiles are private</h2>
                <p className="text-[13px] text-muted max-w-lg mx-auto mb-5">Sign in with an approved hotel or spa account to search professionals. Stealth Mode and travel limits are checked before any profile is shown.</p>
                <Link href="/login?account=employer" className="btn-primary inline-block">Hotel &amp; Spa Sign In</Link>
              </div>
            ) : directoryError ? (
              <div className="bg-white border border-border p-10 text-center text-sm text-red-600">{directoryError}</div>
            ) : sorted.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-12 text-center">
                <p className="text-[15px] text-ink font-medium mb-2">
                  {!originGeocoded && !appliedSearch
                    ? 'Add the property postcode to search by distance'
                    : appliedSearch && appliedSearch.radius !== 'UK-wide' ? `No therapists found near ${appliedSearch.outward}` : 'No therapists found'}
                </p>
                <p className="text-[13px] text-muted mb-4">
                  {!originGeocoded && !appliedSearch
                    ? 'Professionals can set their own travel limit, so we need the hotel or spa postcode before showing profiles that have a mileage boundary.'
                    : appliedSearch && appliedSearch.radius !== 'UK-wide'
                    ? `We could not find anyone within ~${appliedSearch.radius} of ${appliedSearch.outward}. Try widening your radius or searching UK-wide.`
                    : 'Try adjusting your filters.'}
                </p>
                {!originGeocoded && !appliedSearch && (
                  <Link href="/employer/profile" className="btn-primary inline-block text-[12px]">Add property postcode and travel details</Link>
                )}
                {appliedSearch && appliedSearch.radius !== 'UK-wide' && (
                  <button
                    type="button"
                    onClick={searchUkWide}
                    className="btn-secondary text-[12px]"
                  >
                    Search UK-wide instead
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {sorted.slice(0, visible).map(c => (
                    <div key={c.id} className={`bg-white border rounded-xl overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all ${c.is_featured ? 'border-accent ring-1 ring-accent/20' : 'border-border'}`}>
                      <div className="p-5">
                        {/* Top: photo + badges */}
                        <div className="flex items-start gap-3 mb-3 relative">
                          <div className="w-16 h-16 rounded-full bg-ink flex items-center justify-center shrink-0 overflow-hidden">
                            {c.profile_image_url ? <img src={c.profile_image_url} alt="" className="w-full h-full object-cover" />
                            : <span className="text-[20px] font-semibold text-accent">{c.full_name?.[0]}</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-[16px] font-medium text-ink truncate capitalize">{c.full_name}</h3>
                            {c.role_level && <span className="inline-block text-[10px] font-medium bg-surface text-secondary px-2 py-0.5 rounded-full mt-0.5">{c.role_level}</span>}
                            {c.headline && <p className="text-[12px] text-muted truncate mt-1">{c.headline}</p>}
                          </div>
                          {c.is_featured && <span className="absolute -top-1 -right-1 text-[9px] font-semibold bg-accent text-white px-2 py-0.5 rounded-full">⭐ Featured</span>}
                        </div>

                        {/* Rating + location */}
                        <div className="flex items-center gap-3 mb-3">
                          {c.review_score > 0 ? (
                            <span className="flex items-center gap-1 text-[12px]"><Star size={11} className="text-amber-400" fill="currentColor" /><span className="text-ink font-medium">{c.review_score}</span><span className="text-muted">({c.review_count})</span></span>
                          ) : <span className="text-[11px] text-muted">New</span>}
                          {(c.location || candidateMiles(c) != null) && <span className="text-[11px] text-muted flex items-center gap-1"><MapPin size={10} />{c.location || 'Location available'}{(() => { const d = candidateMiles(c); return d != null ? ` · ${d} mi away` : '' })()}</span>}
                          {c.whc_verified ? <span className="text-[10px] font-semibold text-green-700 flex items-center gap-0.5"><ShieldCheck size={10} />WHC Verified</span>
                          : c.has_insurance && <span className="text-[10px] text-success flex items-center gap-0.5"><Shield size={10} />Insured</span>}
                          {(academyMap.get(c.id)?.length || 0) > 0 && (
                            <span className="text-[10px] font-medium text-accent flex items-center gap-0.5" title={(academyMap.get(c.id) || []).map(courseTitle).join(', ')}>
                              <GraduationCap size={11} />{academyMap.get(c.id)!.length} Academy
                            </span>
                          )}
                        </div>

                        {/* Services */}
                        {c.services_offered?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2.5">
                            {c.services_offered.slice(0, 4).map((s: string) => <span key={s} className="text-[10px] font-medium bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>)}
                            {c.services_offered.length > 4 && <span className="text-[10px] text-muted">+{c.services_offered.length - 4}</span>}
                          </div>
                        )}

                        {/* Product houses */}
                        {c.product_houses?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {c.product_houses.slice(0, 3).map((b: string) => <span key={b} className="text-[10px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-2 py-0.5 rounded-full">{b}</span>)}
                            {c.product_houses.length > 3 && <span className="text-[10px] text-muted">+{c.product_houses.length - 3}</span>}
                          </div>
                        )}

                        {/* Rate - hourly is the agency standard; day rate shown for older profiles */}
                        {c.hourly_rate ? (
                          <p className="text-[14px] font-semibold text-accent mb-2">
                            £{c.hourly_rate} <span className="text-[11px] font-normal text-muted">/ hour</span>
                          </p>
                        ) : (c.day_rate_min || c.day_rate_max) && (
                          <p className="text-[14px] font-semibold text-accent mb-2">
                            £{c.day_rate_min || c.day_rate_max}{c.day_rate_max && c.day_rate_min ? ` - £${c.day_rate_max}` : ''} <span className="text-[11px] font-normal text-muted">/ day</span>
                          </p>
                        )}

                        {/* Availability */}
                        <div className="mb-4">
                          {availToday.has(c.id) ? <span className="text-[11px] text-success font-semibold flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" />Available Today</span>
                          : c.availability_status === 'immediately' ? <span className="text-[11px] text-success font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success rounded-full" />Available Now</span>
                          : c.availability_status === '1_week' || c.availability_status === '2_weeks' ? <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />Available Soon</span>
                          : <span className="text-[11px] text-muted flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />Unavailable</span>}
                        </div>

                        {/* CTA - one clear action: the offer lives on the profile */}
                        <Link href={`/agency/${c.id}`} className="btn-primary block w-full text-center text-[12px]">View Profile &amp; Make an Offer</Link>
                      </div>
                    </div>
                  ))}
                </div>
                {visible < sorted.length && (
                  <div className="text-center mt-8"><button type="button" onClick={() => setVisible(v => v + 12)} className="btn-secondary">Load more therapists</button></div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
        )
      })()}

      <Footer />
    </div>
  )
}
