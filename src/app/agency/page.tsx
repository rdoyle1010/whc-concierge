'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/DashboardShell'
import Link from 'next/link'
import { Search, MapPin, Star, Shield, ShieldCheck, ChevronDown, X, SlidersHorizontal, GraduationCap, CheckCircle2 } from 'lucide-react'
import { ACADEMY, courseTitle } from '@/lib/academy'
import { shiftHours } from '@/lib/agency-time'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'

const SERVICE_FILTERS = ['Swedish Massage','Deep Tissue','Hot Stone','Aromatherapy','ESPA Facial','Elemis Facial','Dermalogica Facial','Body Wraps','Reflexology','Reiki','Prenatal Massage','Sports Massage','Laser','Injectables','Lashes','Nails','Waxing']
const BRAND_FILTERS = ['ESPA','Elemis','Dermalogica','Comfort Zone','Aromatherapy Associates','Bamford','Sodashi','Thalgo','Germaine de Capuccini','Decleor','La Mer']
const ROLE_FILTERS = ['Apprentice','Therapist','Senior Therapist','Lead Therapist','Spa Manager','Receptionist']

function normaliseOutward(raw: string): string | null {
  const compact = (raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!compact) return null
  const outward = compact.length > 4 && /\d[A-Z]{2}$/.test(compact) ? compact.slice(0, -3) : compact.slice(0, 4)
  if (/^[A-Z]{1,2}$/.test(outward) || /^[A-Z]{1,2}\d[A-Z0-9]?$/.test(outward)) return outward
  return null
}

const areaOf = (outward: string) => outward.match(/^[A-Z]{1,2}/)?.[0] || outward

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
  } catch {}
  return null
}

function FilterSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return <div className="border-b border-border pb-4 mb-4">
    <button type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left mb-2">
      <span className="text-[13px] font-medium text-ink">{title}</span>
      <ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
    </button>
    {open && <div className="space-y-1.5">{children}</div>}
  </div>
}

export default function AgencyPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [postcode, setPostcode] = useState('')
  const [radius, setRadius] = useState('UK-wide')
  const [shiftDate, setShiftDate] = useState(() => new Date().toLocaleDateString('en-CA'))
  const [shiftStartTime, setShiftStartTime] = useState('09:00')
  const [shiftEndTime, setShiftEndTime] = useState('17:00')
  const [services, setServices] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [insuredOnly, setInsuredOnly] = useState(false)
  const [confirmedOnly, setConfirmedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('match')
  const [visible, setVisible] = useState(12)
  const [appliedSearch, setAppliedSearch] = useState<{ outward: string; radius: string } | null>(null)
  const [postcodeError, setPostcodeError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [academySel, setAcademySel] = useState<string[]>([])
  const [academyMap, setAcademyMap] = useState<Map<string, string[]>>(new Map())
  const [requiresSignIn, setRequiresSignIn] = useState(false)
  const [directoryError, setDirectoryError] = useState('')
  const [originGeocoded, setOriginGeocoded] = useState(true)

  const selectedHours = shiftHours(shiftStartTime, shiftEndTime) || 0
  const shiftParams = () => new URLSearchParams({ shiftDate, shiftStartTime, shiftEndTime })

  async function loadDirectory(params = shiftParams()) {
    setLoading(true)
    try {
      const res = await fetch(`/api/agency/directory?${params.toString()}`)
      const body = await res.json().catch(() => ({}))
      setRequiresSignIn(res.status === 401)
      setOriginGeocoded(body.origin?.geocoded !== false)
      setCandidates(res.ok ? (body.candidates || []) : [])
      setDirectoryError(res.ok || res.status === 401 ? '' : (body.error || 'Directory unavailable'))
    } catch {
      setCandidates([])
      setDirectoryError('Directory unavailable')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadDirectory()
    supabase.from('course_enrollments').select('candidate_id, course_slug').not('completed_at', 'is', null).then(({ data }) => {
      if (!data) return
      const m = new Map<string, string[]>()
      for (const r of data) m.set(r.candidate_id, [...(m.get(r.candidate_id) || []), r.course_slug])
      setAcademyMap(m)
    })
    // Initial directory load is intentionally evaluated against the visible default shift.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const toggleFilter = (arr: string[], set: (v: string[]) => void, val: string) => set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])

  async function clearFilters() {
    setServices([]); setBrands([]); setRoles([]); setInsuredOnly(false); setConfirmedOnly(false); setAcademySel([])
    setPostcode(''); setAppliedSearch(null); setPostcodeError(''); setDirectoryError(''); setRadius('UK-wide')
    await loadDirectory()
  }

  async function handleSearch() {
    const params = shiftParams()
    if (radius === 'UK-wide') {
      setAppliedSearch(null); setPostcodeError(''); setVisible(12)
      await loadDirectory(params)
      return
    }
    const outward = normaliseOutward(postcode)
    if (!outward) { setPostcodeError('Please enter a valid UK postcode, e.g. BS1 or SW1A 1AA'); return }
    const coords = await geocodeSearch(postcode)
    if (!coords) { setPostcodeError('We could not locate that postcode. Please enter a full UK postcode for an accurate mileage search.'); return }
    params.set('lat', String(coords.lat)); params.set('lng', String(coords.lng)); params.set('radius', String(parseInt(radius, 10)))
    setAppliedSearch({ outward: areaOf(outward) === outward ? outward : outward, radius })
    setPostcodeError(''); setVisible(12)
    await loadDirectory(params)
  }

  async function searchUkWide() {
    setRadius('UK-wide'); setAppliedSearch(null); setPostcodeError(''); setVisible(12)
    await loadDirectory(shiftParams())
  }

  const filtered = useMemo(() => candidates.filter(c => {
    if (c.agency_available === false) return false
    if (insuredOnly && !c.has_insurance) return false
    if (confirmedOnly && c.availability_match !== 'confirmed') return false
    if (services.length && !services.some(s => (c.services_offered || []).some((sp: string) => sp.toLowerCase().includes(s.toLowerCase())))) return false
    if (brands.length && !brands.some(b => (c.product_houses || []).some((ph: string) => ph.toLowerCase().includes(b.toLowerCase())))) return false
    if (roles.length && !roles.includes(c.role_level)) return false
    if (academySel.length && !academySel.every(s => (academyMap.get(c.id) || []).includes(s))) return false
    return c.within_radius !== false
  }), [candidates, insuredOnly, confirmedOnly, services, brands, roles, academySel, academyMap])

  const sorted = useMemo(() => [...filtered].sort((a, b) => {
    const aFeat = a.agency_tier === 'featured' || a.is_featured ? 1 : 0
    const bFeat = b.agency_tier === 'featured' || b.is_featured ? 1 : 0
    if (aFeat !== bFeat) return bFeat - aFeat
    if (sortBy === 'rated') return (b.review_score || 0) - (a.review_score || 0)
    if (sortBy === 'rate_high') return (b.hourly_rate || 0) - (a.hourly_rate || 0)
    if (sortBy === 'rate_low') return (a.hourly_rate || 9999) - (b.hourly_rate || 9999)
    if (sortBy === 'recent') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (a.availability_match === 'confirmed' && b.availability_match !== 'confirmed') return -1
    if (b.availability_match === 'confirmed' && a.availability_match !== 'confirmed') return 1
    return (b.review_score || 0) - (a.review_score || 0)
  }), [filtered, sortBy])

  const filterPanel = <div className="bg-white border border-border rounded-2xl p-5 shadow-sm">
    <div className="flex items-center justify-between mb-4"><p className="text-[14px] font-medium text-ink">Filters</p><button type="button" onClick={clearFilters} className="text-[11px] text-muted hover:text-ink">Clear all</button></div>
    <FilterSection title="Availability" defaultOpen><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={confirmedOnly} onChange={() => setConfirmedOnly(!confirmedOnly)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">Confirmed for selected shift</span></label></FilterSection>
    <FilterSection title="Services Offered" defaultOpen>{SERVICE_FILTERS.map(s => <label key={s} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={services.includes(s)} onChange={() => toggleFilter(services, setServices, s)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">{s}</span></label>)}</FilterSection>
    <FilterSection title="Product Houses">{BRAND_FILTERS.map(b => <label key={b} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={brands.includes(b)} onChange={() => toggleFilter(brands, setBrands, b)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">{b}</span></label>)}</FilterSection>
    <FilterSection title="Role Level">{ROLE_FILTERS.map(r => <label key={r} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={roles.includes(r)} onChange={() => toggleFilter(roles, setRoles, r)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">{r}</span></label>)}</FilterSection>
    <FilterSection title="Insurance"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={insuredOnly} onChange={() => setInsuredOnly(!insuredOnly)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">Insured only</span></label></FilterSection>
    <FilterSection title="WHC Academy">{ACADEMY.map(course => <label key={course.slug} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={academySel.includes(course.slug)} onChange={() => toggleFilter(academySel, setAcademySel, course.slug)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">{course.title}</span></label>)}</FilterSection>
  </div>

  return <DashboardShell role="employer">
    <section className="mb-8"><div className="max-w-[1460px] mx-auto">
      <p className="dashboard-eyebrow">Agency staffing</p>
      <h1 className="dashboard-title">Find available spa professionals</h1>
      <p className="dashboard-intro">Search verified, insured professionals who have confirmed availability for the exact date and hours you need.</p>
      <form onSubmit={e => { e.preventDefault(); handleSearch() }} className="max-w-5xl space-y-4 mt-7 bg-white border border-border rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <label className="text-[11px] font-medium text-secondary">Shift date<input required type="date" min={new Date().toLocaleDateString('en-CA')} value={shiftDate} onChange={e => setShiftDate(e.target.value)} className="input-field mt-1 w-full" /></label>
          <label className="text-[11px] font-medium text-secondary">Starts<input required type="time" value={shiftStartTime} onChange={e => setShiftStartTime(e.target.value)} className="input-field mt-1 w-full" /></label>
          <label className="text-[11px] font-medium text-secondary">Finishes<input required type="time" value={shiftEndTime} onChange={e => setShiftEndTime(e.target.value)} className="input-field mt-1 w-full" /></label>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input type="text" placeholder="Enter postcode" value={postcode} onChange={e => { setPostcode(e.target.value); setPostcodeError('') }} className="input-field flex-1" />
          <select value={radius} onChange={e => setRadius(e.target.value)} className="input-field sm:w-40"><option>UK-wide</option><option>5 miles</option><option>10 miles</option><option>25 miles</option><option>50 miles</option><option>100 miles</option></select>
          <button type="submit" className="btn-primary flex items-center justify-center gap-2"><Search size={14} />Find available talent</button>
        </div>
        <p className="text-[11px] text-muted">Availability is checked for the whole selected shift and overlapping bookings are excluded.</p>
      </form>
      {postcodeError && <p className="text-[12px] text-red-600 mt-2">{postcodeError}</p>}
      {appliedSearch && <div className="mt-3"><span className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-[#FDF6EC] text-accent border border-accent/20 px-3 py-1 rounded-full"><MapPin size={11} />Near {appliedSearch.outward} (within ~{appliedSearch.radius})<button type="button" onClick={searchUkWide} aria-label="Clear location filter"><X size={12} /></button></span></div>}
    </div></section>

    <div className="max-w-[1460px] mx-auto pb-10"><div className="flex gap-8">
      <aside className="hidden lg:block w-[260px] shrink-0 sticky top-[76px] self-start max-h-[calc(100vh-100px)] overflow-y-auto">{filterPanel}</aside>
      {filtersOpen && <div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/50" onClick={() => setFiltersOpen(false)} /><div className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] bg-surface overflow-y-auto p-4"><div className="flex items-center justify-between mb-3"><p className="text-[14px] font-semibold text-ink">Refine search</p><button type="button" onClick={() => setFiltersOpen(false)}><X size={18} /></button></div>{filterPanel}<button type="button" onClick={() => setFiltersOpen(false)} className="btn-primary w-full mt-4">Show {sorted.length} professionals</button></div></div>}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-5 gap-3"><div className="flex items-center gap-3"><button type="button" onClick={() => setFiltersOpen(true)} className="lg:hidden inline-flex items-center gap-1.5 text-[12px] font-medium border border-border bg-white rounded-lg px-3 py-1.5"><SlidersHorizontal size={13} />Filters</button><p className="text-[13px] text-muted">{sorted.length} professional{sorted.length !== 1 ? 's' : ''}</p></div><select value={sortBy} onChange={e => setSortBy(e.target.value)} className="input-field !w-auto !py-1.5 text-[12px]"><option value="match">Best Match</option><option value="rated">Highest Rated</option><option value="rate_low">Hourly Rate ↑</option><option value="rate_high">Hourly Rate ↓</option><option value="recent">Most Recent</option></select></div>

        {loading ? <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-72 rounded-2xl" />)}</div>
        : requiresSignIn ? <div className="bg-white border border-border p-10 text-center"><h2 className="text-2xl font-semibold text-ink mb-2">Agency profiles are private</h2><p className="text-[13px] text-muted max-w-lg mx-auto mb-5">Sign in with an approved hotel or spa account to search professionals.</p><Link href="/login?account=employer" className="btn-primary inline-block">Hotel &amp; Spa Sign In</Link></div>
        : directoryError ? <div className="bg-white border border-border p-10 text-center text-sm text-red-600">{directoryError}</div>
        : sorted.length === 0 ? <div className="bg-white border border-border rounded-xl p-12 text-center"><h2 className="text-xl font-serif text-ink mb-2">No available professionals match this search.</h2><p className="text-[13px] text-muted mb-5">Try widening the radius, changing the shift hours or clearing filters.</p><div className="flex gap-3 justify-center flex-wrap"><button type="button" onClick={searchUkWide} className="btn-primary">Search UK-wide</button><button type="button" onClick={clearFilters} className="btn-secondary">Clear filters</button>{!originGeocoded && <Link href="/employer/profile" className="btn-secondary">Add property postcode</Link>}</div></div>
        : <><div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{sorted.slice(0, visible).map(c => {
          const therapistCost = c.hourly_rate && selectedHours ? c.hourly_rate * selectedHours : null
          const fee = therapistCost ? Math.ceil(therapistCost * AGENCY_PLATFORM_FEE_PCT) : null
          const profileParams = new URLSearchParams({ shiftDate, shiftStartTime, shiftEndTime })
          return <div key={c.id} className={`bg-white border rounded-2xl overflow-hidden hover:shadow-lg transition-all ${c.is_featured ? 'border-accent ring-1 ring-accent/20' : 'border-border'}`}><div className="p-6">
            <div className="flex items-start gap-3 mb-3 relative"><div className="w-16 h-16 rounded-full bg-[#F1EBDD] border border-[#E2D8C5] overflow-hidden flex items-center justify-center shrink-0">{c.profile_image_url ? <img src={c.profile_image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[20px] font-semibold text-[#12354D]">{c.full_name?.[0]}</span>}</div><div className="min-w-0 flex-1"><h3 className="text-[18px] font-semibold text-ink truncate">{c.full_name}</h3>{c.role_level && <span className="inline-block text-[10px] bg-surface text-secondary px-2 py-0.5 rounded-full mt-0.5">{c.role_level}</span>}{c.headline && <p className="text-[12px] text-muted truncate mt-1">{c.headline}</p>}</div>{c.is_featured && <span className="absolute -top-1 -right-1 text-[9px] font-semibold bg-accent text-white px-2 py-0.5 rounded-full">⭐ Featured</span>}</div>
            <div className="flex flex-wrap items-center gap-3 mb-3">{c.review_score > 0 ? <span className="flex items-center gap-1 text-[12px]"><Star size={11} className="text-amber-400" fill="currentColor" />{c.review_score} ({c.review_count})</span> : <span className="text-[11px] text-muted">New</span>}{(c.location || c.distance_miles != null) && <span className="text-[11px] text-muted flex items-center gap-1"><MapPin size={10} />{c.location || 'Location available'}{c.distance_miles != null ? ` · ${c.distance_miles} mi away` : ''}</span>}{c.whc_verified && <span className="text-[10px] font-semibold text-green-700 flex items-center gap-1"><ShieldCheck size={10} />WHC Verified</span>}{c.has_insurance && <span className="text-[10px] text-green-700 flex items-center gap-1"><Shield size={10} />Insured</span>}</div>
            {(academyMap.get(c.id)?.length || 0) > 0 && <p className="text-[10px] text-accent mb-2 flex items-center gap-1"><GraduationCap size={11} />{academyMap.get(c.id)!.length} WHC Academy completion{academyMap.get(c.id)!.length === 1 ? '' : 's'}: {(academyMap.get(c.id) || []).slice(0,2).map(courseTitle).join(', ')}</p>}
            {c.qualifications?.length > 0 && <p className="text-[10px] text-muted mb-2"><strong className="text-secondary">Qualifications:</strong> {c.qualifications.slice(0,2).join(', ')}{c.qualifications.length > 2 ? ` +${c.qualifications.length - 2}` : ''}</p>}
            {c.services_offered?.length > 0 && <div className="flex flex-wrap gap-1 mb-3">{c.services_offered.slice(0,4).map((s: string) => <span key={s} className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full">{s}</span>)}{c.services_offered.length > 4 && <span className="text-[10px] text-muted">+{c.services_offered.length - 4}</span>}</div>}
            {c.hourly_rate && <div className="mb-3"><p className="text-[14px] font-semibold text-accent">£{c.hourly_rate} <span className="text-[11px] font-normal text-muted">/ hour</span></p>{therapistCost != null && <p className="text-[11px] text-muted">£{therapistCost} therapist cost for {selectedHours}h{fee != null ? ` · £${fee} WHC fee added at booking` : ''}</p>}</div>}
            <div className="mb-4">{c.availability_match === 'confirmed' ? <span className="text-[11px] text-success font-semibold flex items-center gap-1"><CheckCircle2 size={12} />Available for your selected shift · {shiftStartTime}–{shiftEndTime}</span> : c.availability_match === 'already_booked' ? <span className="text-[11px] text-red-600">Already booked for this shift</span> : <span className="text-[11px] text-amber-600">Availability not confirmed for this shift</span>}{typeof c.completed_shift_count === 'number' && <p className="mt-1 text-[10px] text-muted">{c.completed_shift_count} completed WHC agency shift{c.completed_shift_count === 1 ? '' : 's'}</p>}</div>
            <Link href={`/agency/${c.id}?${profileParams.toString()}`} className="btn-primary block w-full text-center text-[12px]">View Profile &amp; Make an Offer</Link>
          </div></div>
        })}</div>{visible < sorted.length && <div className="text-center mt-8"><button type="button" onClick={() => setVisible(v => v + 12)} className="btn-secondary">Load more professionals</button></div>}</>}
      </div>
    </div></div>
  </DashboardShell>
}
