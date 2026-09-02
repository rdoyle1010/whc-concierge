'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/DashboardShell'
import SwipeDeck from '@/components/SwipeDeck'
import Link from 'next/link'
import { Search, MapPin, ChevronDown, X, SlidersHorizontal, CheckCircle2, Rows3, Layers3, Heart, ShieldCheck } from 'lucide-react'
import { ACADEMY } from '@/lib/academy'
import { shiftHours } from '@/lib/agency-time'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'
import SponsoredAd from '@/components/SponsoredAd'
import { useDialog } from '@/components/useDialog'

const SERVICE_FILTERS = ['Swedish Massage','Deep Tissue','Hot Stone','Aromatherapy','ESPA Facial','Elemis Facial','Dermalogica Facial','Body Wraps','Reflexology','Reiki','Prenatal Massage','Sports Massage','Laser','Injectables','Lashes','Nails','Waxing']
const BRAND_FILTERS = ['ESPA','Elemis','Dermalogica','Comfort Zone','Aromatherapy Associates','Bamford','Sodashi','Thalgo','Germaine de Capuccini','Decleor','La Mer']
const ROLE_FILTERS = ['Apprentice','Therapist','Senior Therapist','Lead Therapist','Spa Manager','Receptionist']

// The one sentence WHC uses everywhere for the commercial model.
const FEE_SENTENCE = 'Flexible cover by the hour or day. The professional keeps 100% of the agreed rate; the property pays the rate plus the WHC fee.'

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
      if (res.ok) { const j = await res.json(); if (j?.result?.latitude != null) return { lat: j.result.latitude, lng: j.result.longitude } }
    }
    const outward = normaliseOutward(raw)
    if (outward && /\d/.test(outward)) {
      const res = await fetch(`https://api.postcodes.io/outcodes/${outward}`)
      if (res.ok) { const j = await res.json(); if (j?.result?.latitude != null) return { lat: j.result.latitude, lng: j.result.longitude } }
    }
  } catch {}
  return null
}

function FilterSection({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen)
  return <div className="border-b border-border pb-4 mb-4"><button type="button" onClick={() => setOpen(!open)} className="flex items-center justify-between w-full text-left mb-2"><span className="text-[13px] font-medium text-ink">{title}</span><ChevronDown size={14} className={`text-muted transition-transform ${open ? 'rotate-180' : ''}`} /></button>{open && <div className="space-y-1.5">{children}</div>}</div>
}

// The verification standard, stated as quiet ruled facts. Shared copy for
// the public page - the employer tool proves the same points on each card.
const VERIFICATION_ROWS = [
  { label: 'Identity', value: 'Identity is checked by WHC before the WHC Verified mark appears on a profile.' },
  { label: 'Insurance', value: 'Self-employed professionals hold their own professional insurance. Documents are uploaded to WHC and shown as an Insured mark.' },
  { label: 'Right to work', value: 'Right-to-work checks form part of the WHC Verified standard.' },
  { label: 'Confirmed availability', value: 'A shift search only returns professionals who have confirmed availability for the exact date and hours, with overlapping bookings excluded.' },
  { label: 'Reliability', value: 'Reliability is tracked from completed WHC shifts on the platform, not self-reported.' },
]

type PublicStats = { professionals: number; whc_verified: number; insured: number }

export default function AgencyPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [directoryChecked, setDirectoryChecked] = useState(false)
  const [postcode, setPostcode] = useState('')
  const [radius, setRadius] = useState('UK-wide')
  // No default date: the first view of the register is everyone on it.
  // A date narrows to confirmed availability; without one, you browse.
  const [shiftDate, setShiftDate] = useState('')
  const [shiftStartTime, setShiftStartTime] = useState('09:00')
  const [shiftEndTime, setShiftEndTime] = useState('17:00')
  const [services, setServices] = useState<string[]>([])
  const [brands, setBrands] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [insuredOnly, setInsuredOnly] = useState(false)
  const [confirmedOnly, setConfirmedOnly] = useState(false)
  const [sortBy, setSortBy] = useState('match')
  const [visible, setVisible] = useState(12)
  const [viewMode, setViewMode] = useState<'swipe'|'list'>('list')
  const [appliedSearch, setAppliedSearch] = useState<{ outward: string; radius: string } | null>(null)
  const [postcodeError, setPostcodeError] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [academySel, setAcademySel] = useState<string[]>([])
  const [academyMap, setAcademyMap] = useState<Map<string, string[]>>(new Map())
  const [requiresSignIn, setRequiresSignIn] = useState(false)
  // A 403 from the directory means a signed-in visitor who is not an
  // approved employer - they get the public page, not an error.
  const [notEmployer, setNotEmployer] = useState(false)
  const [publicStats, setPublicStats] = useState<PublicStats | null>(null)
  // Favourites reuse the Saved Talent shortlist, so a heart here also
  // appears on the employer's Saved Talent page.
  const [favourites, setFavourites] = useState<Map<string, string>>(new Map())
  const [favBusy, setFavBusy] = useState<string | null>(null)
  const [favouritesOnly, setFavouritesOnly] = useState(false)
  const [directoryError, setDirectoryError] = useState('')
  const [originGeocoded, setOriginGeocoded] = useState(true)
  const filtersDialog = useDialog(() => setFiltersOpen(false), undefined, { label: 'Refine search', enabled: filtersOpen })

  const publicView = requiresSignIn || notEmployer
  const selectedHours = shiftHours(shiftStartTime, shiftEndTime) || 0
  // Shift params only travel when a date is chosen - otherwise it is a
  // browse of the whole register, which the API returns unfiltered.
  const shiftParams = () => shiftDate
    ? new URLSearchParams({ shiftDate, shiftStartTime, shiftEndTime })
    : new URLSearchParams()
  // Explicit UK-wide marker so the API never falls back to a stored radius
  // (or 400s when no radius has ever been stored).
  const ukWideParams = () => { const params = shiftParams(); params.set('radius', 'uk'); return params }

  async function loadDirectory(params = shiftParams()) {
    setLoading(true)
    try {
      const res = await fetch(`/api/agency/directory?${params.toString()}`)
      const body = await res.json().catch(() => ({}))
      setRequiresSignIn(res.status === 401)
      setNotEmployer(res.status === 403)
      setOriginGeocoded(body.origin?.geocoded !== false)
      setCandidates(res.ok ? (body.candidates || []) : [])
      setDirectoryError(res.ok || res.status === 401 || res.status === 403 ? '' : (body.error || 'Directory unavailable'))
    } catch { setCandidates([]); setDirectoryError('Directory unavailable') }
    finally { setLoading(false); setDirectoryChecked(true) }
  }

  async function loadFavourites() {
    try {
      const res = await fetch('/api/shortlist')
      if (!res.ok) return
      const j = await res.json()
      const map = new Map<string, string>()
      for (const entry of j.shortlisted || []) if (entry.candidate_id) map.set(entry.candidate_id, entry.id)
      setFavourites(map)
    } catch { /* signed out or talent viewer - hearts simply stay empty */ }
  }

  async function toggleFavourite(candidateId: string) {
    setFavBusy(candidateId)
    try {
      const existingId = favourites.get(candidateId)
      if (existingId) {
        const res = await fetch('/api/shortlist', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: existingId }) })
        if (res.ok) { const next = new Map(favourites); next.delete(candidateId); setFavourites(next) }
      } else {
        const res = await fetch('/api/shortlist', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ candidateId }) })
        if (res.ok) await loadFavourites()
      }
    } catch { /* leave the heart as it was */ } finally { setFavBusy(null) }
  }

  useEffect(() => {
    loadDirectory(ukWideParams())
    loadFavourites()
    supabase.from('course_enrollments').select('candidate_id, course_slug').not('completed_at', 'is', null).then(({ data }) => {
      if (!data) return
      const m = new Map<string, string[]>()
      for (const r of data) m.set(r.candidate_id, [...(m.get(r.candidate_id) || []), r.course_slug])
      setAcademyMap(m)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Counts for the public page: fetched only once the directory has said
  // this visitor cannot use the tool.
  useEffect(() => {
    if (!publicView || publicStats) return
    let active = true
    fetch('/api/agency/public-stats')
      .then(res => res.ok ? res.json() : null)
      .then(j => { if (active && j && typeof j.professionals === 'number') setPublicStats(j) })
      .catch(() => {})
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [publicView])

  const toggleFilter = (arr: string[], set: (v: string[]) => void, val: string) => set(arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val])
  async function clearFilters() { setServices([]); setBrands([]); setRoles([]); setInsuredOnly(false); setConfirmedOnly(false); setAcademySel([]); setPostcode(''); setAppliedSearch(null); setPostcodeError(''); setDirectoryError(''); setRadius('UK-wide'); await loadDirectory(ukWideParams()) }
  async function handleSearch() {
    const params = shiftParams()
    if (radius === 'UK-wide') { setAppliedSearch(null); setPostcodeError(''); setVisible(12); params.set('radius', 'uk'); await loadDirectory(params); return }
    const outward = normaliseOutward(postcode)
    if (!outward) { setPostcodeError('Please enter a valid UK postcode, e.g. BS1 or SW1A 1AA'); return }
    const coords = await geocodeSearch(postcode)
    if (!coords) { setPostcodeError('We could not locate that postcode. Please enter a full UK postcode for an accurate mileage search.'); return }
    params.set('lat', String(coords.lat)); params.set('lng', String(coords.lng)); params.set('radius', String(parseInt(radius, 10)))
    setAppliedSearch({ outward: areaOf(outward) === outward ? outward : outward, radius }); setPostcodeError(''); setVisible(12); await loadDirectory(params)
  }
  async function searchUkWide() { setRadius('UK-wide'); setAppliedSearch(null); setPostcodeError(''); setVisible(12); await loadDirectory(ukWideParams()) }

  const filtered = useMemo(() => candidates.filter(c => {
    if (c.agency_available === false) return false
    if (insuredOnly && !c.has_insurance) return false
    if (favouritesOnly && !favourites.has(c.id)) return false
    if (confirmedOnly && shiftDate && c.availability_match !== 'confirmed') return false
    if (services.length && !services.some(s => (c.services_offered || []).some((sp: string) => sp.toLowerCase().includes(s.toLowerCase())))) return false
    if (brands.length && !brands.some(b => (c.product_houses || []).some((ph: string) => ph.toLowerCase().includes(b.toLowerCase())))) return false
    if (roles.length && !roles.includes(c.role_level)) return false
    if (academySel.length && !academySel.every(s => (academyMap.get(c.id) || []).includes(s))) return false
    return c.within_radius !== false
  }), [candidates, insuredOnly, confirmedOnly, shiftDate, services, brands, roles, academySel, academyMap, favouritesOnly, favourites])

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

  // Three sections, every original filter intact: Availability (shift +
  // favourites), Treatments and skills (services + product houses), and
  // Standards (role level + insurance + Academy).
  const subHeading = (label: string, first = false) => <p className={`${first ? 'pt-1' : 'pt-3'} text-[10px] uppercase tracking-[.12em] text-muted`}>{label}</p>
  const filterPanel = <div className="bg-white border border-border p-5">
    <div className="flex items-center justify-between mb-4"><p className="text-[14px] font-medium text-ink">Filters</p><button type="button" onClick={clearFilters} className="text-[11px] text-muted hover:text-ink">Clear all</button></div>
    <FilterSection title="Availability" defaultOpen>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={confirmedOnly} onChange={() => setConfirmedOnly(!confirmedOnly)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">Confirmed for selected shift</span></label>
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={favouritesOnly} onChange={() => setFavouritesOnly(!favouritesOnly)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">My favourites only{favourites.size ? ` (${favourites.size})` : ''}</span></label>
    </FilterSection>
    <FilterSection title="Treatments and skills" defaultOpen>
      {subHeading('Treatments', true)}
      {SERVICE_FILTERS.map(s => <label key={s} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={services.includes(s)} onChange={() => toggleFilter(services, setServices, s)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">{s}</span></label>)}
      {subHeading('Product houses')}
      {BRAND_FILTERS.map(b => <label key={b} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={brands.includes(b)} onChange={() => toggleFilter(brands, setBrands, b)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">{b}</span></label>)}
    </FilterSection>
    <FilterSection title="Standards">
      {subHeading('Role level', true)}
      {ROLE_FILTERS.map(r => <label key={r} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={roles.includes(r)} onChange={() => toggleFilter(roles, setRoles, r)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">{r}</span></label>)}
      {subHeading('Insurance')}
      <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={insuredOnly} onChange={() => setInsuredOnly(!insuredOnly)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">Insured only</span></label>
      {subHeading('WHC Academy')}
      {ACADEMY.map(course => <label key={course.slug} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={academySel.includes(course.slug)} onChange={() => toggleFilter(academySel, setAcademySel, course.slug)} className="w-3.5 h-3.5" /><span className="text-[12px] text-secondary">{course.title}</span></label>)}
    </FilterSection>
  </div>

  function profileParams(c:any){ const p=new URLSearchParams({shiftDate,shiftStartTime,shiftEndTime}); return `/agency/${c.id}?${p.toString()}` }

  // Fact-row ledger card: name and role in the display face, then quiet
  // ruled rows. fixedHeight keeps the swipe deck's stacked geometry.
  function candidateCard(c:any, fixedHeight = false){
    const therapistCost = c.hourly_rate && selectedHours ? c.hourly_rate * selectedHours : null
    const fee = therapistCost ? Math.ceil(therapistCost * AGENCY_PLATFORM_FEE_PCT) : null
    const treatments: string[] = c.services_offered || []
    const shownTreatments = treatments.slice(0, 5)
    const moreTreatments = treatments.length - shownTreatments.length
    const verifiedLine = [c.whc_verified ? 'WHC Verified' : null, c.has_insurance ? 'Insured' : null].filter(Boolean).join(' · ')
    const rows: Array<{ label: string; value: React.ReactNode }> = []
    if (c.hourly_rate) rows.push({ label: 'Rate', value: <>£{c.hourly_rate}<span className="text-muted">/hr</span>{therapistCost != null && <span className="block text-[11px] leading-4 text-muted">£{therapistCost} for {selectedHours}h{fee != null ? ` + £${fee} WHC fee at booking` : ''}</span>}</> })
    if (c.reliability_pct != null) rows.push({ label: 'Reliability', value: `${c.reliability_pct}%` })
    if (c.completed_shift_count > 0) rows.push({ label: 'WHC shifts', value: `${c.completed_shift_count} completed` })
    if (verifiedLine) rows.push({ label: 'Verified', value: verifiedLine })
    if (c.availability_match != null) rows.push({ label: 'Availability', value: c.availability_match === 'confirmed' ? <span className="inline-flex items-center gap-1 font-medium text-success"><CheckCircle2 size={13} />Available {shiftStartTime} to {shiftEndTime}</span> : <span className="text-amber-600">Not confirmed for this shift</span> })
    if (c.distance_miles != null) rows.push({ label: 'Distance', value: `${c.distance_miles} miles away` })
    else if (c.location) rows.push({ label: 'Location', value: c.location })
    if (shownTreatments.length) rows.push({ label: 'Treatments', value: `${shownTreatments.join(', ')}${moreTreatments > 0 ? ` and ${moreTreatments} more` : ''}` })

    return <div className={`${fixedHeight ? 'h-[500px] ' : ''}flex flex-col overflow-hidden border bg-white p-6 ${c.is_featured ? 'border-accent' : 'border-border'}`}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 bg-surface border border-border overflow-hidden flex items-center justify-center shrink-0">{c.profile_image_url ? <img decoding="async" src={c.profile_image_url} alt={c.full_name ? `Profile photo of ${c.full_name}` : 'Profile photo'} className="w-full h-full object-cover" draggable={false} /> : <span className="font-serif text-[20px] font-semibold text-accent">{c.full_name?.[0]}</span>}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-serif text-[21px] font-semibold text-ink leading-tight truncate">{c.full_name}</h3>
            {c.is_featured && <span className="shrink-0 text-[9px] font-semibold uppercase tracking-[.12em] bg-accent text-white px-2 py-1">Featured</span>}
            <button type="button" title={favourites.has(c.id) ? 'Remove from favourites' : 'Save to favourites'} aria-label={favourites.has(c.id) ? 'Remove from favourites' : 'Save to favourites'} aria-pressed={favourites.has(c.id)} onPointerDown={e => e.stopPropagation()} onClick={e => { e.preventDefault(); e.stopPropagation(); toggleFavourite(c.id) }} disabled={favBusy === c.id} className="ml-auto shrink-0 p-2 -m-2 text-accent disabled:opacity-50"><Heart size={18} className={favourites.has(c.id) ? 'fill-current' : ''} /></button>
          </div>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5">
            {c.role_level && <p className="font-serif text-[13px] text-secondary">{c.role_level}</p>}
            {c.agency_ready && <span className="text-[9px] font-semibold uppercase tracking-[.08em] bg-[#1c1c1c] text-white px-2 py-1 inline-flex items-center gap-1"><ShieldCheck size={10} />Agency Ready</span>}
          </div>
        </div>
      </div>
      <div className="mt-5 min-h-0 overflow-hidden">
        {rows.map(row => <div key={row.label} className="flex items-baseline justify-between gap-6 border-t border-border py-2.5">
          <span className="shrink-0 text-[10px] uppercase tracking-[.12em] text-muted">{row.label}</span>
          <span className="min-w-0 text-right text-[12.5px] leading-5 text-ink">{row.value}</span>
        </div>)}
      </div>
      <div className="mt-auto pt-5"><Link href={profileParams(c)} onPointerDown={e => e.stopPropagation()} className="btn-primary block w-full text-center text-[12px]">View profile and make an offer</Link></div>
    </div>
  }

  // First paint: nothing renders until the directory has said who this
  // visitor is, so employers never glimpse the marketing page and the
  // public never glimpse the tool.
  if (!directoryChecked) {
    return <DashboardShell role="employer">
      <div className="max-w-[1460px] mx-auto"><div className="skeleton h-24 max-w-2xl mb-8" /><div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="skeleton h-64" />)}</div></div>
    </DashboardShell>
  }

  if (publicView) {
    const stats = publicStats && publicStats.professionals > 0 ? [
      { label: 'On the register', value: publicStats.professionals },
      { label: 'WHC Verified', value: publicStats.whc_verified },
      { label: 'Insured', value: publicStats.insured },
    ] : []
    return <DashboardShell role="employer">
      <div className="max-w-5xl mx-auto">
        <section className="pt-4 pb-14 md:pb-16">
          <p className="public-eyebrow">Agency Cover</p>
          <h1 className="mt-4 font-serif text-[34px] md:text-[46px] font-semibold leading-[1.08] tracking-[-.02em] text-ink max-w-3xl">Verified spa professionals, on cover when your rota is short.</h1>
          <p className="mt-6 text-[15px] leading-7 text-secondary max-w-2xl">Agency Cover is the WHC register of self-employed spa professionals available for individual shifts at hotels and spas across the UK. Search by date, hours and distance, review a verified profile and send an offer - nothing is booked until both sides agree.</p>
          <p className="mt-5 border-l-2 border-accent pl-5 font-serif text-[17px] md:text-[19px] font-medium leading-7 text-accent max-w-2xl">{FEE_SENTENCE}</p>
        </section>

        <section className="border-t border-border py-14 md:py-16">
          <p className="public-eyebrow">The verification standard</p>
          <dl className="mt-8 max-w-3xl">
            {VERIFICATION_ROWS.map(row => <div key={row.label} className="flex flex-col sm:flex-row gap-x-8 gap-y-1 border-t border-border py-4">
              <dt className="w-44 shrink-0 text-[11px] uppercase tracking-[.12em] text-muted pt-1">{row.label}</dt>
              <dd className="text-[14px] leading-6 text-ink">{row.value}</dd>
            </div>)}
          </dl>
        </section>

        {stats.length > 0 && <section className="border-t border-border py-14 md:py-16">
          <p className="public-eyebrow">The register today</p>
          <div className="mt-8 grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-6 max-w-3xl">
            {stats.map(stat => <div key={stat.label} className="border-t border-border pt-3">
              <p className="text-[10px] uppercase tracking-[.14em] text-muted">{stat.label}</p>
              <p className="mt-1 text-[28px] font-serif font-semibold text-ink">{stat.value.toLocaleString('en-GB')}</p>
            </div>)}
          </div>
          <p className="mt-6 text-[11px] text-muted">Counts refresh every few minutes and include only approved professionals currently listed for agency work.</p>
        </section>}

        <section className="border-t border-border py-14 md:py-16">
          <h2 className="font-serif text-[24px] md:text-[28px] font-semibold text-ink leading-[1.15] max-w-2xl">See who is available for your dates.</h2>
          <p className="mt-4 text-[14px] leading-7 text-secondary max-w-2xl">Approved hotel and spa accounts can search the register by shift, distance and treatment. Professionals join free and keep 100% of the agreed rate.</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/login?account=employer" className="btn-primary">Hotel &amp; Spa sign in</Link>
            <Link href="/register/talent" className="btn-secondary">Join the register</Link>
          </div>
        </section>

        <section className="border-t border-border py-14 md:py-16">
          <p className="public-eyebrow">How WHC verifies agency professionals</p>
          <div className="mt-8 grid gap-x-12 gap-y-8 md:grid-cols-3">
            <div className="border-t border-border pt-4"><p className="font-serif text-[15px] font-semibold text-ink mb-2">Insurance</p><p className="text-[13px] leading-6 text-secondary">Self-employed therapists must hold their own professional insurance. Documents are uploaded to WHC and shown as an Insured mark - employers can filter to insured-only.</p></div>
            <div className="border-t border-border pt-4"><p className="font-serif text-[15px] font-semibold text-ink mb-2">Qualifications</p><p className="text-[13px] leading-6 text-secondary">Certificates are uploaded and reviewed, including overseas training - profiles distinguish reviewed qualifications from self-declared ones, so HR is not left decoding unfamiliar certificate names.</p></div>
            <div className="border-t border-border pt-4"><p className="font-serif text-[15px] font-semibold text-ink mb-2">WHC Verified</p><p className="text-[13px] leading-6 text-secondary">The WHC Verified mark covers identity and right-to-work checks, and completed WHC Academy training appears on the profile with certificate codes.</p></div>
          </div>
        </section>
      </div>
    </DashboardShell>
  }

  return <DashboardShell role="employer">
    <section className="mb-8"><div className="max-w-[1460px] mx-auto"><p className="dashboard-eyebrow">Agency staffing</p><h1 className="dashboard-title">Find available spa professionals</h1><p className="dashboard-intro">Search verified, insured professionals who have confirmed availability for the exact date and hours you need.</p><form onSubmit={e=>{e.preventDefault();handleSearch()}} className="max-w-5xl space-y-4 mt-7 bg-white border border-border p-5 md:p-6"><div className="grid grid-cols-1 sm:grid-cols-3 gap-3"><label className="text-[11px] font-medium text-secondary">Shift date (optional)<input type="date" min={new Date().toLocaleDateString('en-CA')} value={shiftDate} onChange={e=>setShiftDate(e.target.value)} className="input-field mt-1 w-full"/></label><label className="text-[11px] font-medium text-secondary">Starts<input required type="time" value={shiftStartTime} onChange={e=>setShiftStartTime(e.target.value)} className="input-field mt-1 w-full"/></label><label className="text-[11px] font-medium text-secondary">Finishes<input required type="time" value={shiftEndTime} onChange={e=>setShiftEndTime(e.target.value)} className="input-field mt-1 w-full"/></label></div><div className="flex flex-col sm:flex-row gap-3"><input type="text" placeholder="Enter postcode" aria-label="Postcode" value={postcode} onChange={e=>{setPostcode(e.target.value);setPostcodeError('')}} className="input-field flex-1"/><select value={radius} onChange={e=>setRadius(e.target.value)} aria-label="Search radius" className="input-field sm:w-40"><option>UK-wide</option><option>5 miles</option><option>10 miles</option><option>25 miles</option><option>50 miles</option><option>100 miles</option></select><button type="submit" className="btn-primary flex items-center justify-center gap-2"><Search size={14}/>Find available talent</button></div><p className="text-[11px] text-muted">Leave the date blank to browse everyone on the register. With a date and hours set, availability is checked for the whole shift and overlapping bookings are excluded.</p></form>{postcodeError&&<p role="alert" className="text-[12px] text-red-600 mt-2">{postcodeError}</p>}{appliedSearch&&<div className="mt-3"><span className="inline-flex items-center gap-1.5 text-[12px] font-medium bg-surface text-accent border border-accent/20 px-3 py-1"><MapPin size={11}/>Near {appliedSearch.outward} (within ~{appliedSearch.radius})<button type="button" onClick={searchUkWide} aria-label="Clear location filter" className="p-2 -m-1"><X size={12}/></button></span></div>}<div className="max-w-5xl mt-5 border border-border bg-surface p-5"><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-ink">How WHC verifies agency professionals</p><div className="mt-3 grid gap-4 sm:grid-cols-3 text-[12px] leading-5 text-secondary"><div><p className="font-semibold text-ink mb-1">Insurance</p>Self-employed therapists must hold their own professional insurance. Documents are uploaded to WHC and shown as an Insured mark - employers can filter to insured-only.</div><div><p className="font-semibold text-ink mb-1">Qualifications</p>Certificates are uploaded and reviewed, including overseas training - profiles distinguish reviewed qualifications from self-declared ones, so HR is not left decoding unfamiliar certificate names.</div><div><p className="font-semibold text-ink mb-1">WHC Verified</p>The WHC Verified mark covers identity and right-to-work checks, and completed WHC Academy training appears on the profile with certificate codes.</div></div></div></div></section>

    <div className="max-w-[1460px] mx-auto pb-10"><div className="flex gap-8"><aside className="hidden lg:block w-[260px] shrink-0 sticky top-[76px] self-start max-h-[calc(100vh-100px)] overflow-y-auto">{filterPanel}</aside>{filtersOpen&&<div className="fixed inset-0 z-50 lg:hidden"><div className="absolute inset-0 bg-black/50" onClick={()=>setFiltersOpen(false)}/><div {...filtersDialog.panelProps} className="absolute inset-y-0 left-0 w-[300px] max-w-[85vw] bg-surface overflow-y-auto p-4"><div className="flex items-center justify-between mb-3"><p className="text-[14px] font-semibold text-ink">Refine search</p><button type="button" onClick={()=>setFiltersOpen(false)} aria-label="Close filters" className="p-2 -m-2"><X size={18}/></button></div>{filterPanel}<button type="button" onClick={()=>setFiltersOpen(false)} className="btn-primary w-full mt-4">Show {sorted.length} professionals</button></div></div>}<div className="flex-1 min-w-0"><div className="flex flex-col gap-3 mb-5 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><button type="button" onClick={()=>setFiltersOpen(true)} className="lg:hidden inline-flex items-center gap-1.5 text-[12px] font-medium border border-border bg-white px-3 py-1.5"><SlidersHorizontal size={13}/>Filters</button><p className="text-[13px] text-muted">{sorted.length} professional{sorted.length!==1?'s':''}</p></div><div className="flex flex-wrap items-center gap-2"><div className="inline-flex border border-border bg-white p-1"><button type="button" onClick={()=>setViewMode('list')} className={`inline-flex items-center gap-2 px-3 py-2 text-[11px] font-semibold ${viewMode==='list'?'bg-[#1c1c1c] text-white':'text-secondary'}`}><Rows3 size={13}/>List</button><button type="button" onClick={()=>setViewMode('swipe')} className={`inline-flex items-center gap-2 px-3 py-2 text-[11px] font-semibold ${viewMode==='swipe'?'bg-[#1c1c1c] text-white':'text-secondary'}`}><Layers3 size={13}/>Swipe</button></div><select value={sortBy} onChange={e=>setSortBy(e.target.value)} aria-label="Sort professionals" className="input-field !w-auto !py-1.5 text-[12px]"><option value="match">Best Match</option><option value="rated">Highest Rated</option><option value="rate_low">Hourly Rate: low to high</option><option value="rate_high">Hourly Rate: high to low</option><option value="recent">Most Recent</option></select></div></div>
      {loading?<div className="grid grid-cols-1 xl:grid-cols-2 gap-5">{Array.from({length:4}).map((_,i)=><div key={i} className="skeleton h-72"/>)}</div>:directoryError?<div className="bg-white border border-border p-10 text-center text-sm text-red-600">{directoryError}</div>:sorted.length===0?<div className="bg-white border border-border p-12 text-center"><h2 className="text-xl font-serif text-ink mb-2">No available professionals match this search.</h2><p className="text-[13px] text-secondary mb-5">Try widening the radius, changing the shift hours or clearing filters.</p><div className="flex gap-3 justify-center flex-wrap"><button type="button" onClick={searchUkWide} className="btn-primary">Search UK-wide</button><button type="button" onClick={clearFilters} className="btn-secondary">Clear filters</button>{!originGeocoded&&<Link href="/employer/profile" className="btn-secondary">Add property postcode</Link>}</div></div>:viewMode==='swipe'?<div><div className="mb-5 border border-border bg-surface px-5 py-4"><p className="text-[12px] font-semibold text-ink">Swipe through available professionals</p><p className="mt-1 text-[11px] text-muted">Swipe right to continue with that professional and make an offer. Swipe left to pass. Nothing is booked until you review the profile and send the offer.</p></div><SwipeDeck items={sorted} renderItem={(c)=>candidateCard(c,true)} onLeft={async()=>{}} onRight={async(c)=>{window.location.href=profileParams(c)}}/></div>:<><div className="fade-in grid grid-cols-1 xl:grid-cols-2 gap-5">{sorted.slice(0,visible).map(c=><div key={c.id}>{candidateCard(c)}</div>)}</div>{visible<sorted.length&&<div className="text-center mt-8"><button type="button" onClick={()=>setVisible(v=>v+12)} className="btn-secondary">Load more professionals</button></div>}</>}
      </div></div></div>
      <SponsoredAd placement="agency_page_sponsor" />
  </DashboardShell>
}
