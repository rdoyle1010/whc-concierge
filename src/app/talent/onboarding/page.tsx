'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/DashboardShell'
import Link from 'next/link'
import { Check, Upload, ArrowRight, ArrowLeft, Search, Zap } from 'lucide-react'
import { SERVICES_CATEGORIES, BUSINESS_SKILLS_FULL, SYSTEMS_FULL, PRODUCT_HOUSES_FULL, QUALS_CATEGORIES, HOTEL_BRANDS_FULL } from '@/lib/taxonomy'

// ── Chip selector component ──
function ChipGrid({ items, selected, onToggle, search }: { items: any[]; selected: Map<string, any>; onToggle: (id: string, name: string) => void; search?: string }) {
  const filtered = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items
  return (
    <div className="flex flex-wrap gap-2">
      {filtered.map(item => {
        const isSelected = selected.has(item.id)
        return (
          <button key={item.id} type="button" onClick={() => onToggle(item.id, item.name)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${isSelected ? 'bg-ink text-white' : 'bg-surface border border-border text-secondary hover:border-ink/30'}`}>
            {isSelected && <Check size={10} className="inline mr-1" />}{item.name}
          </button>
        )
      })}
      {filtered.length === 0 && <p className="text-[13px] text-muted">No items match your search.</p>}
    </div>
  )
}

// ── Proficiency selector ──
function ProficiencySelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <select value={value} aria-label="Proficiency level" onChange={e => onChange(e.target.value)}
      className="input-field !py-1 !px-2 text-[11px] w-32 focus:border-accent focus:ring-accent/20">
      <option value="beginner">Beginner</option>
      <option value="intermediate">Intermediate</option>
      <option value="advanced">Advanced</option>
      <option value="master">Master</option>
    </select>
  )
}

// ── Step labels ──
const STEPS = ['Basic Info', 'Logistics & Preferences', 'Treatment Skills', 'Business Skills', 'Systems', 'Product Houses', 'Qualifications', 'Brand Experience', 'Agency Work', 'Review']

const TRANSPORT_OPTIONS = ['Own car', 'Public transport', 'Bicycle', 'Walking', 'Relocating for role']
const COMMUTE_OPTIONS = ['15 min', '30 min', '45 min', '1 hour', '1.5 hours', 'Willing to relocate']
const SHIFT_OPTIONS = ['Early morning', 'Daytime', 'Evening', 'Overnight', 'Split shifts', 'Weekends only', 'Flexible']
const LOCATION_PREF_OPTIONS = ['London', 'South East', 'South West', 'Midlands', 'North West', 'North East', 'Scotland', 'Wales', 'Northern Ireland', 'Europe', 'Middle East', 'Asia', 'Worldwide']

export default function OnboardingWizard() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(() => {
    if (typeof window !== 'undefined') {
      const s = parseInt(new URLSearchParams(window.location.search).get('step') || '1')
      if (s >= 1 && s <= STEPS.length) return s
    }
    return 1
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveWarning, setSaveWarning] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Basic info
  const [basic, setBasic] = useState({
    full_name: '', location_city: '', location_country: 'United Kingdom', right_to_work: 'citizen',
    employment_types_wanted: [] as string[], years_experience: '', current_job_title: '',
    headline: '', bio: '', availability_date: '', salary_min: '', salary_max: '',
    willing_to_relocate: false, languages: '',
    transport_method: '', max_commute: '', shift_preferences: [] as string[],
    location_preferences: [] as string[], needs_accommodation: false,
  })

  // Agency register - opt-in captured here; listing only activates once the
  // monthly subscription is paid (the Stripe webhook flips agency_available).
  const [agency, setAgency] = useState({
    optIn: false, hourly_rate: '', phone: '', postcode: '', travel_radius_miles: '', tier: 'basic' as 'basic' | 'featured',
  })
  const [agencyLive, setAgencyLive] = useState<{ available: boolean; tier: string | null; until: string | null }>({ available: false, tier: null, until: null })
  const [payBusy, setPayBusy] = useState(false)
  const [payError, setPayError] = useState('')

  // Taxonomy data loaded from DB
  const [treatmentSkills, setTreatmentSkills] = useState<any[]>([])
  const [businessSkills, setBusinessSkills] = useState<any[]>([])
  const [systemsList, setSystemsList] = useState<any[]>([])
  const [productHousesList, setProductHousesList] = useState<any[]>([])
  const [certsList, setCertsList] = useState<any[]>([])
  const [brandsList, setBrandsList] = useState<any[]>([])

  // Selections: Map<id, { name, proficiency?, years_using?, ... }>
  const [selectedSkills, setSelectedSkills] = useState<Map<string, any>>(new Map())
  const [selectedSystems, setSelectedSystems] = useState<Map<string, any>>(new Map())
  const [selectedPH, setSelectedPH] = useState<Map<string, any>>(new Map())
  const [selectedCerts, setSelectedCerts] = useState<Map<string, any>>(new Map())
  const [selectedBrands, setSelectedBrands] = useState<Map<string, any>>(new Map())

  // Load taxonomy + existing profile
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login'); return }
      setUserId(user.id)

      // Load profile - and if the row is missing (failed registration insert),
      // create it server-side so the wizard never silently discards answers
      let { data: profile } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).maybeSingle()
      if (!profile) {
        try {
          const res = await fetch('/api/profile/ensure', { method: 'POST' })
          const j = await res.json().catch(() => ({}))
          if (res.ok && j.profileId) {
            const { data: fresh } = await supabase.from('candidate_profiles').select('*').eq('id', j.profileId).maybeSingle()
            profile = fresh
          }
        } catch { /* handled below */ }
      }
      if (profile) {
        setProfileId(profile.id)
        setBasic({
          full_name: profile.full_name || '', location_city: profile.location || '', location_country: profile.location_country || 'United Kingdom',
          right_to_work: profile.right_to_work || 'citizen', employment_types_wanted: profile.employment_types_wanted || [],
          years_experience: profile.experience_years?.toString() || profile.years_experience?.toString() || '',
          current_job_title: profile.role_level || '', headline: profile.headline || '', bio: profile.bio || '',
          availability_date: profile.availability_date || '', salary_min: profile.salary_min?.toString() || profile.day_rate_min?.toString() || '',
          salary_max: profile.salary_max?.toString() || profile.day_rate_max?.toString() || '',
          willing_to_relocate: profile.willing_to_relocate || false, languages: (profile.languages || []).join(', '),
          transport_method: profile.transport_method || '', max_commute: profile.max_commute || '',
          shift_preferences: profile.shift_preferences || [], location_preferences: profile.location_preferences || [],
          needs_accommodation: profile.needs_accommodation || false,
        })

        setAgency({
          optIn: Boolean(profile.agency_available),
          hourly_rate: profile.hourly_rate?.toString() || '',
          phone: profile.phone || '',
          postcode: profile.postcode || '',
          travel_radius_miles: profile.travel_radius_miles?.toString() || '',
          tier: profile.agency_tier === 'featured' ? 'featured' : 'basic',
        })
        setAgencyLive({
          available: Boolean(profile.agency_available),
          tier: profile.agency_tier || null,
          until: profile.agency_listed_until || null,
        })

        // Existing selections come from the profile itself - the same arrays
        // the matching engine and the profile editor use. Items are keyed by
        // name (names ARE the ids in the shared code taxonomy).
        const proficiencies: Record<string, string> = profile.skill_proficiencies || {}
        const skMap = new Map<string, any>()
        for (const name of profile.services_offered || []) skMap.set(name, { name, proficiency: proficiencies[name] || 'intermediate' })
        for (const name of profile.business_skills || []) skMap.set(name, { name, proficiency: proficiencies[name] || 'intermediate' })
        setSelectedSkills(skMap)

        const syMap = new Map<string, any>()
        for (const name of profile.systems_experience || []) syMap.set(name, { name, proficiency: 'intermediate' })
        setSelectedSystems(syMap)

        const phMap = new Map<string, any>()
        for (const name of profile.product_houses || []) phMap.set(name, { name })
        setSelectedPH(phMap)

        const ceMap = new Map<string, any>()
        for (const name of profile.qualifications || []) ceMap.set(name, { name })
        setSelectedCerts(ceMap)

        const brMap = new Map<string, any>()
        for (const name of profile.hotel_brands_worked || []) brMap.set(name, { name })
        setSelectedBrands(brMap)
      }

      // The shared code taxonomy is the single source of truth - the same
      // lists the profile editor, employers and the matching engine use.
      setTreatmentSkills(SERVICES_CATEGORIES.flatMap(group => group.items.map(name => ({ id: name, name, category: group.name }))))
      setBusinessSkills(BUSINESS_SKILLS_FULL.map(name => ({ id: name, name, category: 'Business & Leadership' })))
      setSystemsList(SYSTEMS_FULL.map(name => ({ id: name, name })))
      setProductHousesList(PRODUCT_HOUSES_FULL.map(name => ({ id: name, name })))
      setCertsList(QUALS_CATEGORIES.flatMap(group => group.items.map(name => ({ id: name, name, category: group.name }))))
      setBrandsList(HOTEL_BRANDS_FULL.map(name => ({ id: name, name })))
      setLoading(false)
    }
    load()
  }, [])

  // ── Toggle helpers ──
  const toggleInMap = (map: Map<string, any>, setMap: (m: Map<string, any>) => void, id: string, name: string, defaults: any = {}) => {
    const next = new Map(map)
    if (next.has(id)) next.delete(id)
    else next.set(id, { name, proficiency: 'intermediate', ...defaults })
    setMap(next)
  }

  const updateInMap = (map: Map<string, any>, setMap: (m: Map<string, any>) => void, id: string, field: string, value: any) => {
    const next = new Map(map)
    const existing = next.get(id) || {}
    next.set(id, { ...existing, [field]: value })
    setMap(next)
  }

  const STEP_SAVE_ERROR = 'This step could not be saved - please try again before continuing.'

  // ── Save step data ──
  const saveStep = async () => {
    if (!profileId) {
      setSaveError('Your profile could not be loaded - please refresh the page and try again. Your answers have not been saved.')
      return false
    }
    setSaving(true)

    setSaveError('')
    setSaveWarning('')
    setPayError('')
    if (step === 1) {
      const res1 = await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, data: {
          full_name: basic.full_name, location: basic.location_city,
          location_country: basic.location_country || null,
          headline: basic.headline, bio: basic.bio,
          experience_years: basic.years_experience ? parseInt(basic.years_experience) : null,
          role_level: basic.current_job_title || null,
          day_rate_min: basic.salary_min ? parseInt(basic.salary_min) : null,
          day_rate_max: basic.salary_max ? parseInt(basic.salary_max) : null,
          willing_to_relocate: basic.willing_to_relocate,
          right_to_work: basic.right_to_work || null,
          employment_types_wanted: basic.employment_types_wanted.length > 0 ? basic.employment_types_wanted : null,
          languages: basic.languages ? basic.languages.split(',').map(l => l.trim()).filter(Boolean) : null,
          availability_date: basic.availability_date || null,
        }}),
      })
      if (!res1.ok) {
        const j = await res1.json().catch(() => ({}))
        setSaveError(j.error || 'This step could not be saved - please try again before continuing.')
        setSaving(false)
        return false
      }
    }

    if (step === 2) {
      const res2 = await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, data: {
          transport_method: basic.transport_method || null,
          max_commute: basic.max_commute || null,
          shift_preferences: basic.shift_preferences.length > 0 ? basic.shift_preferences : null,
          location_preferences: basic.location_preferences.length > 0 ? basic.location_preferences : null,
          needs_accommodation: basic.needs_accommodation,
        }}),
      })
      if (!res2.ok) {
        const j = await res2.json().catch(() => ({}))
        setSaveError(j.error || 'This step could not be saved - please try again before continuing.')
        setSaving(false)
        return false
      }
    }

    // Selections save onto the profile itself - the same arrays the
    // matching engine, employers and the profile editor read.
    const saveProfileData = async (data: Record<string, unknown>) => {
      const res = await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, data }),
      })
      return res.ok
    }

    if (step === 3 || step === 4) {
      const treatmentNames = new Set(treatmentSkills.map(item => item.name))
      const businessNames = new Set(businessSkills.map(item => item.name))
      const selectedNames = Array.from(selectedSkills.values()).map(data => data.name).filter(Boolean)
      const proficiencies: Record<string, string> = {}
      for (const data of selectedSkills.values()) if (data.name && data.proficiency) proficiencies[data.name] = data.proficiency
      const ok = await saveProfileData({
        services_offered: selectedNames.filter(name => treatmentNames.has(name)),
        business_skills: selectedNames.filter(name => businessNames.has(name)),
        skill_proficiencies: proficiencies,
      })
      if (!ok) { setSaveError(STEP_SAVE_ERROR); setSaving(false); return false }
    }

    if (step === 5) {
      const ok = await saveProfileData({ systems_experience: Array.from(selectedSystems.values()).map(data => data.name).filter(Boolean) })
      if (!ok) { setSaveError(STEP_SAVE_ERROR); setSaving(false); return false }
    }

    if (step === 6) {
      const ok = await saveProfileData({ product_houses: Array.from(selectedPH.values()).map(data => data.name).filter(Boolean) })
      if (!ok) { setSaveError(STEP_SAVE_ERROR); setSaving(false); return false }
    }

    if (step === 7) {
      const ok = await saveProfileData({ qualifications: Array.from(selectedCerts.values()).map(data => data.name).filter(Boolean) })
      if (!ok) { setSaveError(STEP_SAVE_ERROR); setSaving(false); return false }
    }

    if (step === 8) {
      const ok = await saveProfileData({ hotel_brands_worked: Array.from(selectedBrands.values()).map(data => data.name).filter(Boolean) })
      if (!ok) { setSaveError(STEP_SAVE_ERROR); setSaving(false); return false }
    }

    if (step === 9) {
      const ok = await saveAgencyFields()
      if (!ok) {
        // The payError banner only renders inside the opt-in section - fall
        // back to the general banner so the failure is always visible
        if (!agency.optIn && !agencyLive.available) setSaveError(STEP_SAVE_ERROR)
        setSaving(false)
        return false
      }
    }

    setSaving(false)
    return true
  }

  // Persist the agency-work details (rate, mobile, postcode, radius) via the
  // agency settings API, which also geocodes the postcode to real coordinates.
  // agency_available itself is NOT saved here - only the Stripe webhook may
  // set it, after the £10/mo listing subscription is paid.
  const saveAgencyFields = async (): Promise<boolean> => {
    if (!profileId) return true
    try {
      const res = await fetch('/api/agency/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          hourly_rate: agency.hourly_rate || null,
          phone: agency.phone || null,
          postcode: agency.postcode || null,
          travel_radius_miles: agency.travel_radius_miles || null,
          joining: false,
        }),
      })
      if (!res.ok) {
        const j = await res.json().catch(() => ({}))
        setPayError(j.error || 'Your agency details could not be saved - please try again.')
        return false
      }
      // A warning means everything else saved but the postcode could not be
      // mapped - tell the person without blocking the wizard.
      const j = await res.json().catch(() => ({}))
      if (j.warning) setSaveWarning(String(j.warning))
      return true
    } catch {
      setPayError('Your agency details could not be saved - please check your connection and try again.')
      return false
    }
  }

  const goNext = async () => { const ok = await saveStep(); if (ok === false) return; setStep(s => s + 1); setSearchTerm(''); window.scrollTo(0, 0) }
  const goBack = () => { setStep(s => s - 1); setSearchTerm(''); window.scrollTo(0, 0) }

  const handleSubmit = async () => {
    const ok = await saveStep()
    if (ok === false) return
    // Update completion
    const filled = [basic.full_name, basic.location_city, basic.headline, basic.bio, selectedSkills.size > 0, selectedSystems.size > 0, selectedPH.size > 0, selectedCerts.size > 0, basic.years_experience].filter(Boolean).length
    const pct = Math.round((filled / 9) * 100)
    await fetch('/api/profile/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId, data: { profile_completion_pct: pct, profile_completion_score: pct } }) })
    router.push('/talent/dashboard')
  }

  // ── Multi-select toggles ──
  const toggleEmpType = (t: string) => {
    const next = basic.employment_types_wanted.includes(t) ? basic.employment_types_wanted.filter(x => x !== t) : [...basic.employment_types_wanted, t]
    setBasic({ ...basic, employment_types_wanted: next })
  }
  const toggleShiftPref = (t: string) => {
    const next = basic.shift_preferences.includes(t) ? basic.shift_preferences.filter(x => x !== t) : [...basic.shift_preferences, t]
    setBasic({ ...basic, shift_preferences: next })
  }
  const toggleLocationPref = (t: string) => {
    const next = basic.location_preferences.includes(t) ? basic.location_preferences.filter(x => x !== t) : [...basic.location_preferences, t]
    setBasic({ ...basic, location_preferences: next })
  }

  // ── Group helper ──
  const groupBy = (items: any[], key: string) => {
    const groups: Record<string, any[]> = {}
    for (const item of items) { const k = item[key] || 'other'; if (!groups[k]) groups[k] = []; groups[k].push(item) }
    return groups
  }

  // ── Completion percentage ──
  const completionPct = Math.round(([basic.full_name, basic.location_city, basic.headline, selectedSkills.size > 0, selectedSystems.size > 0, selectedPH.size > 0, selectedCerts.size > 0].filter(Boolean).length / 7) * 100)

  if (loading) return <DashboardShell role="talent"><div className="max-w-2xl"><div className="skeleton h-8 w-1/3 mb-4" /><div className="skeleton h-4 w-2/3 mb-8" /><div className="skeleton h-64" /></div></DashboardShell>

  return (
    <DashboardShell role="talent" userName={basic.full_name}>
      <div className="max-w-2xl">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-[20px] font-medium text-ink">Build Your Profile</h1>
            <span className="text-[13px] text-muted">Step {step} of {STEPS.length}</span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full ${i + 1 <= step ? 'bg-ink' : 'bg-border'}`} />
            ))}
          </div>
          <p className="text-[12px] text-muted mt-2">{STEPS[step - 1]}</p>
        </div>

        {/* ═══ STEP 1: Basic Info ═══ */}
        {step === 1 && (
          <div className="space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="col-span-2"><label className="eyebrow block mb-1.5">Full Name *</label><input aria-label="Full Name" type="text" value={basic.full_name} onChange={e => setBasic({ ...basic, full_name: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">City / Location *</label><input aria-label="City / Location" type="text" value={basic.location_city} onChange={e => setBasic({ ...basic, location_city: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Country</label><input aria-label="Country" type="text" value={basic.location_country} onChange={e => setBasic({ ...basic, location_country: e.target.value })} className="input-field" /></div>
            </div>
            <div><label className="eyebrow block mb-1.5">Right to Work</label>
              <select aria-label="Right to Work" value={basic.right_to_work} onChange={e => setBasic({ ...basic, right_to_work: e.target.value })} className="input-field">
                <option value="citizen">UK Citizen</option><option value="visa_holder">Visa Holder</option><option value="visa_required">Visa Required</option><option value="open_to_work">Open to Work (Any)</option>
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Employment Type Wanted</label>
              <div className="flex flex-wrap gap-2">
                {['full_time', 'part_time', 'contract', 'agency', 'seasonal'].map(t => (
                  <button key={t} type="button" onClick={() => toggleEmpType(t)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium ${basic.employment_types_wanted.includes(t) ? 'bg-ink text-white' : 'bg-surface border border-border text-secondary'}`}>
                    {t.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div><label className="eyebrow block mb-1.5">Years of Experience</label><input aria-label="Years of Experience" type="number" value={basic.years_experience} onChange={e => setBasic({ ...basic, years_experience: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Current Job Title</label><input aria-label="Current Job Title" type="text" value={basic.current_job_title} onChange={e => setBasic({ ...basic, current_job_title: e.target.value })} className="input-field" /></div>
            </div>
            <div><label className="eyebrow block mb-1.5">Headline</label><input aria-label="Headline" type="text" value={basic.headline} onChange={e => setBasic({ ...basic, headline: e.target.value })} className="input-field" placeholder="e.g. Senior Spa Therapist | CIDESCO | 6 Years Luxury" /></div>
            <div><label className="eyebrow block mb-1.5">Short Bio</label><textarea aria-label="Short Bio" rows={3} value={basic.bio} onChange={e => setBasic({ ...basic, bio: e.target.value })} className="input-field" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="eyebrow block mb-1.5">Availability Date</label><input aria-label="Availability Date" type="date" value={basic.availability_date} onChange={e => setBasic({ ...basic, availability_date: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Agency day rate min (£ per day)</label><input aria-label="Agency day rate min (£ per day)" type="number" value={basic.salary_min} onChange={e => setBasic({ ...basic, salary_min: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Agency day rate max (£ per day)</label><input aria-label="Agency day rate max (£ per day)" type="number" value={basic.salary_max} onChange={e => setBasic({ ...basic, salary_max: e.target.value })} className="input-field" /></div>
            </div>
            <p className="text-[11px] text-muted -mt-3">Your day rate for agency work - properties see it on your listing as &quot;£X /day&quot;. It is not a salary expectation.</p>
            <div><label className="eyebrow block mb-1.5">Languages (comma separated)</label><input aria-label="Languages (comma separated)" type="text" value={basic.languages} onChange={e => setBasic({ ...basic, languages: e.target.value })} className="input-field" placeholder="English, French, Spanish" /></div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={basic.willing_to_relocate} onChange={e => setBasic({ ...basic, willing_to_relocate: e.target.checked })} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[13px] text-secondary">Willing to relocate</span></label>
          </div>
        )}

        {/* ═══ STEP 2: Logistics & Preferences ═══ */}
        {step === 2 && (
          <div className="space-y-5">
            <div>
              <label className="eyebrow block mb-1.5">Transport Method</label>
              <select aria-label="Transport Method" value={basic.transport_method} onChange={e => setBasic({ ...basic, transport_method: e.target.value })} className="input-field">
                <option value="">Select...</option>
                {TRANSPORT_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Maximum Commute</label>
              <select aria-label="Maximum Commute" value={basic.max_commute} onChange={e => setBasic({ ...basic, max_commute: e.target.value })} className="input-field">
                <option value="">Select...</option>
                {COMMUTE_OPTIONS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="eyebrow block mb-2">Shift Preference</label>
              <div className="flex flex-wrap gap-2">
                {SHIFT_OPTIONS.map(t => (
                  <button key={t} type="button" onClick={() => toggleShiftPref(t)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${basic.shift_preferences.includes(t) ? 'bg-ink text-white' : 'bg-surface border border-border text-secondary hover:border-ink/30'}`}>
                    {basic.shift_preferences.includes(t) && <Check size={10} className="inline mr-1" />}{t}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="eyebrow block mb-2">Location Preference</label>
              <div className="flex flex-wrap gap-2">
                {LOCATION_PREF_OPTIONS.map(t => (
                  <button key={t} type="button" onClick={() => toggleLocationPref(t)}
                    className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${basic.location_preferences.includes(t) ? 'bg-ink text-white' : 'bg-surface border border-border text-secondary hover:border-ink/30'}`}>
                    {basic.location_preferences.includes(t) && <Check size={10} className="inline mr-1" />}{t}
                  </button>
                ))}
              </div>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={basic.needs_accommodation} onChange={e => setBasic({ ...basic, needs_accommodation: e.target.checked })} className="w-3.5 h-3.5 border-border rounded text-ink" />
              <span className="text-[13px] text-secondary">Accommodation needed (for live-in roles)</span>
            </label>
          </div>
        )}

        {/* ═══ STEP 3: Treatment Skills ═══ */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select the treatment skills you can deliver. Set your proficiency level for each.</p>
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input type="text" placeholder="Search skills..." aria-label="Search skills" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9 !py-2 text-[13px]" /></div>
            <ChipGrid items={treatmentSkills} selected={selectedSkills} onToggle={(id, name) => toggleInMap(selectedSkills, setSelectedSkills, id, name)} search={searchTerm} />
            {selectedSkills.size > 0 && (
              <div className="space-y-2 mt-4 pt-4 border-t border-border">
                <p className="eyebrow">Selected ({selectedSkills.size})</p>
                {Array.from(selectedSkills.entries()).map(([id, data]) => (
                  <div key={id} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                    <span className="text-[13px] text-ink">{data.name}</span>
                    <ProficiencySelect value={data.proficiency || 'intermediate'} onChange={v => updateInMap(selectedSkills, setSelectedSkills, id, 'proficiency', v)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 4: Business Skills ═══ */}
        {step === 4 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select your commercial, leadership and operational capabilities.</p>
            {Object.entries(groupBy(businessSkills, 'category')).map(([cat, items]) => (
              <div key={cat}>
                <p className="eyebrow mb-2 capitalize">{cat} Skills</p>
                <ChipGrid items={items} selected={selectedSkills} onToggle={(id, name) => toggleInMap(selectedSkills, setSelectedSkills, id, name)} />
              </div>
            ))}
            {Array.from(selectedSkills.entries()).filter(([id]) => businessSkills.some(s => s.id === id)).length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="eyebrow">Selected business skills</p>
                {Array.from(selectedSkills.entries()).filter(([id]) => businessSkills.some(s => s.id === id)).map(([id, data]) => (
                  <div key={id} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                    <span className="text-[13px] text-ink">{data.name}</span>
                    <ProficiencySelect value={data.proficiency || 'intermediate'} onChange={v => updateInMap(selectedSkills, setSelectedSkills, id, 'proficiency', v)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 5: Systems ═══ */}
        {step === 5 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select the booking, POS and management systems you&apos;ve used.</p>
            <ChipGrid items={systemsList} selected={selectedSystems} onToggle={(id, name) => toggleInMap(selectedSystems, setSelectedSystems, id, name)} />
            {selectedSystems.size > 0 && <p className="eyebrow pt-4 border-t border-border">Selected ({selectedSystems.size})</p>}
          </div>
        )}

        {/* ═══ STEP 6: Product Houses ═══ */}
        {step === 6 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select the product houses and skincare brands you have experience with.</p>
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input type="text" placeholder="Search product houses..." aria-label="Search product houses" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9 !py-2 text-[13px]" /></div>
            <ChipGrid items={productHousesList} selected={selectedPH} onToggle={(id, name) => toggleInMap(selectedPH, setSelectedPH, id, name)} search={searchTerm} />
            {selectedPH.size > 0 && <p className="eyebrow pt-4 border-t border-border">Selected ({selectedPH.size})</p>}
          </div>
        )}

        {/* ═══ STEP 7: Certifications ═══ */}
        {step === 7 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select your qualifications and certifications.</p>
            {Object.entries(groupBy(certsList, 'category')).map(([cat, items]) => (
              <div key={cat}>
                <p className="eyebrow mb-2 capitalize">{cat.replace('_', ' ')}</p>
                <ChipGrid items={items} selected={selectedCerts} onToggle={(id, name) => toggleInMap(selectedCerts, setSelectedCerts, id, name)} />
              </div>
            ))}
            {selectedCerts.size > 0 && <p className="eyebrow pt-4 border-t border-border">Selected ({selectedCerts.size})</p>}
          </div>
        )}

        {/* ═══ STEP 8: Brand Experience ═══ */}
        {step === 8 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select the hotel and spa brands you&apos;ve worked with.</p>
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input type="text" placeholder="Search brands..." aria-label="Search brands" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9 !py-2 text-[13px]" /></div>
            <ChipGrid items={brandsList} selected={selectedBrands} onToggle={(id, name) => toggleInMap(selectedBrands, setSelectedBrands, id, name)} search={searchTerm} />
            {selectedBrands.size > 0 && <p className="eyebrow pt-4 border-t border-border">Selected ({selectedBrands.size})</p>}
          </div>
        )}

        {/* ═══ STEP 9: Agency Work ═══ */}
        {step === 9 && (
          <div className="space-y-5">
            <div className="flex items-start gap-3 p-4 bg-[#f1f1f1] rounded-xl">
              <Zap size={18} className="text-accent mt-0.5 shrink-0" />
              <div>
                <p className="text-[14px] font-medium text-ink">Join the agency register</p>
                <p className="text-[13px] text-secondary mt-1">Properties book agency cover when someone calls in sick or they need extra hands. Set your hourly rate, tell us where you can work, and you&apos;ll receive shift offers - urgent same-day offers arrive by text so you never miss one. Hotels pay Talent House Collective and WHC pays you after the shift, so you never have to chase a property for money.</p>
              </div>
            </div>

            {agencyLive.available ? (
              <div className="p-4 border border-green-200 bg-green-50 rounded-xl">
                <p className="text-[14px] font-medium text-green-800">You&apos;re on the agency register</p>
                <p className="text-[13px] text-green-700 mt-1">
                  Keep your rate and contact details up to date in <Link href="/talent/agency/settings" className="underline">Agency Settings</Link>.
                </p>
              </div>
            ) : (
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={agency.optIn} onChange={e => { setAgency({ ...agency, optIn: e.target.checked }); setPayError('') }} className="w-3.5 h-3.5 border-border rounded text-ink" />
                <span className="text-[13px] text-secondary">Yes - I&apos;m interested in agency shifts</span>
              </label>
            )}

            {(agency.optIn || agencyLive.available) && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="eyebrow block mb-1.5">Hourly Rate (£) *</label>
                    <input aria-label="Hourly Rate (£)" type="number" min={1} value={agency.hourly_rate} onChange={e => setAgency({ ...agency, hourly_rate: e.target.value })} className="input-field" placeholder="e.g. 25" />
                    <p className="text-[11px] text-muted mt-1">What properties see when they make you an offer. You receive this in full.</p>
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Mobile Number *</label>
                    <input aria-label="Mobile Number" type="tel" value={agency.phone} onChange={e => setAgency({ ...agency, phone: e.target.value })} className="input-field" placeholder="07700 900123" />
                    <p className="text-[11px] text-muted mt-1">Urgent same-day offers are sent by text.</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="eyebrow block mb-1.5">Postcode</label>
                    <input aria-label="Postcode" type="text" value={agency.postcode} onChange={e => setAgency({ ...agency, postcode: e.target.value })} className="input-field" placeholder="SW1A 1AA" />
                  </div>
                  <div>
                    <label className="eyebrow block mb-1.5">Travel Radius (miles)</label>
                    <input aria-label="Travel Radius (miles)" type="number" min={1} value={agency.travel_radius_miles} onChange={e => setAgency({ ...agency, travel_radius_miles: e.target.value })} className="input-field" placeholder="e.g. 15" />
                    <p className="text-[11px] text-muted mt-1">How far you&apos;ll travel for a shift.</p>
                  </div>
                </div>

                {payError && <p className="text-[13px] text-red-600">{payError}</p>}
                {!agencyLive.available && (
                  <div className="p-4 bg-surface rounded-xl">
                    <p className="text-[13px] text-secondary">Your details save when you continue. To go live on the register (from £10/month), finish up in <Link href="/talent/agency/settings" className="font-medium text-ink underline">Agency Settings</Link> - you can do it any time.</p>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ STEP 10: Review ═══ */}
        {step === 10 && (
          <div className="space-y-6">
            <p className="text-[14px] text-secondary">Review your profile before submitting.</p>

            {/* Completion ring */}
            <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#e5e5e5" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke={completionPct >= 80 ? '#16A34A' : completionPct >= 50 ? '#1c1c1c' : '#e5e5e5'} strokeWidth="3" strokeDasharray={`${completionPct} ${100 - completionPct}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-ink">{completionPct}%</span>
              </div>
              <div><p className="text-[14px] font-medium text-ink">Profile Completion</p><p className="text-[12px] text-muted">Fill more sections to improve your match scores.</p></div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 bg-surface rounded-lg"><p className="eyebrow mb-1">Treatment Skills</p><p className="text-[18px] font-semibold text-ink">{Array.from(selectedSkills.keys()).filter(id => treatmentSkills.some(s => s.id === id)).length}</p></div>
              <div className="p-3 bg-surface rounded-lg"><p className="eyebrow mb-1">Business Skills</p><p className="text-[18px] font-semibold text-ink">{Array.from(selectedSkills.keys()).filter(id => businessSkills.some(s => s.id === id)).length}</p></div>
              <div className="p-3 bg-surface rounded-lg"><p className="eyebrow mb-1">Systems</p><p className="text-[18px] font-semibold text-ink">{selectedSystems.size}</p></div>
              <div className="p-3 bg-surface rounded-lg"><p className="eyebrow mb-1">Product Houses</p><p className="text-[18px] font-semibold text-ink">{selectedPH.size}</p></div>
              <div className="p-3 bg-surface rounded-lg"><p className="eyebrow mb-1">Certifications</p><p className="text-[18px] font-semibold text-ink">{selectedCerts.size}</p></div>
              <div className="p-3 bg-surface rounded-lg"><p className="eyebrow mb-1">Brand Experience</p><p className="text-[18px] font-semibold text-ink">{selectedBrands.size}</p></div>
            </div>

            {basic.full_name && <div className="p-4 border border-border rounded-xl"><p className="text-[15px] font-medium text-ink">{basic.full_name}</p><p className="text-[13px] text-muted">{basic.headline || basic.current_job_title}</p><p className="text-[12px] text-muted mt-1">{basic.location_city} &middot; {basic.years_experience} years experience</p></div>}
          </div>
        )}

        {/* ═══ Navigation ═══ */}
        {saveError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mt-6">{saveError}</div>}
        {saveWarning && <div className="bg-amber-50 text-amber-700 text-sm px-4 py-3 rounded-lg mt-6">{saveWarning}</div>}
        <div className="flex gap-3 mt-8 pt-6 border-t border-border">
          {step > 1 && <button type="button" onClick={goBack} className="btn-secondary flex items-center gap-2 flex-1"><ArrowLeft size={14} />Back</button>}
          {step < STEPS.length ? (
            <button type="button" onClick={goNext} disabled={saving} className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-50">
              {saving ? 'Saving...' : 'Continue'}<ArrowRight size={14} />
            </button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-50">
              {saving ? 'Saving...' : 'Complete Profile'}<Check size={14} />
            </button>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
