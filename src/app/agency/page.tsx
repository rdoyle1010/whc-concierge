'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Search, MapPin, Star, Clock, Shield, ChevronDown, X } from 'lucide-react'

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

// Great-circle miles between two points (haversine)
function milesBetween(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 3958.761
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1), dLng = toRad(lng2 - lng1)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

// Best-effort outward code for a candidate: prefer their postcode field, then any postcode-like token in their location text
function candidateOutward(c: any): string | null {
  if (c.postcode) {
    const o = normaliseOutward(String(c.postcode))
    if (o) return o
  }
  if (typeof c.location === 'string') {
    const m = c.location.toUpperCase().match(/\b[A-Z]{1,2}\d[A-Z0-9]?(?:\s*\d[A-Z]{2})?\b/)
    if (m) return normaliseOutward(m[0])
  }
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

  useEffect(() => {
    supabase.from('candidate_profiles').select('*')
      .eq('approval_status', 'approved')
      .order('is_featured', { ascending: false })
      .order('review_score', { ascending: false })
      .then(({ data }) => { setCandidates(data || []); setLoading(false) })
  }, [])

  const toggleFilter = (arr: string[], set: (v: string[]) => void, val: string) => {
    set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  }

  const clearFilters = () => { setServices([]); setBrands([]); setRoles([]); setInsuredOnly(false); setAvailNow(false); setPostcode(''); setAppliedSearch(null); setPostcodeError('') }

  const handleSearch = async () => {
    const outward = normaliseOutward(postcode)
    if (!outward) { setPostcodeError('Please enter a valid UK postcode, e.g. BS1 or SW1A 1AA'); return }
    setPostcodeError('')
    // Real coordinates for true mileage; falls back to district matching if the lookup fails
    const coords = await geocodeSearch(postcode)
    setAppliedSearch({ outward, area: areaOf(outward), radius, lat: coords?.lat ?? null, lng: coords?.lng ?? null })
    setVisible(12)
  }

  // Real miles from the search point to a candidate, when both are geocoded
  const candidateMiles = (c: any): number | null => {
    if (!appliedSearch || appliedSearch.lat == null || appliedSearch.lng == null) return null
    if (c.latitude == null || c.longitude == null) return null
    return milesBetween(appliedSearch.lat, appliedSearch.lng, c.latitude, c.longitude)
  }

  // Location matching: TRUE mileage when both sides are geocoded; otherwise
  // tiered postcode matching (district / area letters) as a fallback.
  const matchesLocation = (c: any): boolean => {
    if (!appliedSearch || appliedSearch.radius === 'UK-wide') return true
    const { outward, area, radius: r } = appliedSearch

    const dist = candidateMiles(c)
    if (dist != null) {
      const radiusMiles = parseInt(r, 10) // '25 miles' -> 25
      return !isNaN(radiusMiles) ? dist <= radiusMiles : true
    }

    // Fallback: district/area approximation
    const co = candidateOutward(c)
    if (r === '5 miles' || r === '10 miles') {
      if (!co) return false
      return /\d/.test(outward) ? co === outward : co.startsWith(outward)
    }
    if (r === '25 miles' || r === '50 miles') return !!co && areaOf(co) === area
    // 100 miles: widest tier - include candidates whose location is unknown
    return !co || areaOf(co) === area
  }

  const filtered = candidates.filter(c => {
    // Agency register gating: only candidates with an active listing appear.
    // `undefined` (column not yet migrated on the live DB) passes through so
    // the directory never blanks out mid-deploy; `false` (not subscribed) hides.
    if (c.agency_available === false) return false
    if (insuredOnly && !c.has_insurance) return false
    if (availNow && c.availability_status !== 'immediately') return false
    if (services.length > 0 && !services.some(s => (c.services_offered || []).some((sp: string) => sp.toLowerCase().includes(s.toLowerCase())))) return false
    if (brands.length > 0 && !brands.some(b => (c.product_houses || []).some((ph: string) => ph.toLowerCase().includes(b.toLowerCase())))) return false
    if (roles.length > 0 && !roles.includes(c.role_level)) return false
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

  const pc = (s: string) => s?.split(' ')[0] || s // First part of postcode

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

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8">
        <div className="flex gap-8">
          {/* Sidebar filters */}
          <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[76px] self-start max-h-[calc(100vh-100px)] overflow-y-auto">
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
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1 min-w-0">
            {/* Sort bar */}
            <div className="flex items-center justify-between mb-5">
              <p className="text-[13px] text-muted">{sorted.length} therapist{sorted.length !== 1 ? 's' : ''}</p>
              <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field !w-auto !py-1.5 text-[12px]">
                <option value="match">Best Match</option><option value="rated">Highest Rated</option><option value="rate_low">Day Rate ↑</option><option value="rate_high">Day Rate ↓</option><option value="recent">Most Recent</option>
              </select>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{Array.from({length:6}).map((_,i) => <div key={i} className="skeleton h-72 rounded-xl" />)}</div>
            ) : sorted.length === 0 ? (
              <div className="bg-white border border-border rounded-xl p-12 text-center">
                <p className="text-[15px] text-ink font-medium mb-2">
                  {appliedSearch && appliedSearch.radius !== 'UK-wide' ? `No therapists found near ${appliedSearch.outward}` : 'No therapists found'}
                </p>
                <p className="text-[13px] text-muted mb-4">
                  {appliedSearch && appliedSearch.radius !== 'UK-wide'
                    ? `We could not find anyone within ~${appliedSearch.radius} of ${appliedSearch.outward}. Try widening your radius or searching UK-wide.`
                    : 'Try adjusting your filters.'}
                </p>
                {appliedSearch && appliedSearch.radius !== 'UK-wide' && (
                  <button
                    type="button"
                    onClick={() => { setRadius('UK-wide'); setAppliedSearch({ ...appliedSearch, radius: 'UK-wide' }); setVisible(12) }}
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
                            <h3 className="text-[16px] font-medium text-ink truncate">{c.full_name}</h3>
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
                          {c.postcode && <span className="text-[11px] text-muted flex items-center gap-1"><MapPin size={10} />{pc(c.postcode)}{(() => { const d = candidateMiles(c); return d != null ? ` · ${Math.round(d * 10) / 10} mi away` : '' })()}</span>}
                          {c.has_insurance && <span className="text-[10px] text-success flex items-center gap-0.5"><Shield size={10} />Insured</span>}
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

                        {/* Rate — hourly is the agency standard; day rate shown for older profiles */}
                        {c.hourly_rate ? (
                          <p className="text-[14px] font-semibold text-accent mb-2">
                            £{c.hourly_rate} <span className="text-[11px] font-normal text-muted">/ hour</span>
                          </p>
                        ) : (c.day_rate_min || c.day_rate_max) && (
                          <p className="text-[14px] font-semibold text-accent mb-2">
                            £{c.day_rate_min || c.day_rate_max}{c.day_rate_max && c.day_rate_min ? ` – £${c.day_rate_max}` : ''} <span className="text-[11px] font-normal text-muted">/ day</span>
                          </p>
                        )}

                        {/* Availability */}
                        <div className="mb-4">
                          {c.availability_status === 'immediately' ? <span className="text-[11px] text-success font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-success rounded-full" />Available Now</span>
                          : c.availability_status === '1_week' || c.availability_status === '2_weeks' ? <span className="text-[11px] text-amber-600 font-medium flex items-center gap-1"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full" />Available Soon</span>
                          : <span className="text-[11px] text-muted flex items-center gap-1"><span className="w-1.5 h-1.5 bg-gray-300 rounded-full" />Unavailable</span>}
                        </div>

                        {/* CTA — one clear action: the offer lives on the profile */}
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

      <Footer />
    </div>
  )
}
