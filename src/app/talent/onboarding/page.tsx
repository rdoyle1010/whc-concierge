'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/DashboardShell'
import { Check, Upload, ArrowRight, ArrowLeft, Search } from 'lucide-react'

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
    <select value={value} onChange={e => onChange(e.target.value)} className="input-field !py-1 !px-2 text-[11px] w-28">
      <option value="basic">Basic</option>
      <option value="competent">Competent</option>
      <option value="advanced">Advanced</option>
      <option value="expert">Expert</option>
    </select>
  )
}

// ── Step labels ──
const STEPS = ['Basic Info', 'Treatment Skills', 'Business Skills', 'Systems', 'Product Houses', 'Qualifications', 'Brand Experience', 'Review']

export default function OnboardingWizard() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Basic info
  const [basic, setBasic] = useState({
    full_name: '', location_city: '', location_country: 'United Kingdom', right_to_work: 'citizen',
    employment_types_wanted: [] as string[], years_experience: '', current_job_title: '',
    headline: '', bio: '', availability_date: '', salary_min: '', salary_max: '',
    willing_to_relocate: false, languages: '',
  })

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

      // Load profile
      const { data: profile } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
      if (profile) {
        setProfileId(profile.id)
        setBasic({
          full_name: profile.full_name || '', location_city: profile.location || '', location_country: 'United Kingdom',
          right_to_work: profile.right_to_work || 'citizen', employment_types_wanted: profile.employment_types_wanted || [],
          years_experience: profile.experience_years?.toString() || profile.years_experience?.toString() || '',
          current_job_title: profile.role_level || '', headline: profile.headline || '', bio: profile.bio || '',
          availability_date: profile.availability_date || '', salary_min: profile.salary_min?.toString() || profile.day_rate_min?.toString() || '',
          salary_max: profile.salary_max?.toString() || profile.day_rate_max?.toString() || '',
          willing_to_relocate: profile.willing_to_relocate || false, languages: (profile.languages || []).join(', '),
        })

        // Load existing selections
        const [sk, sy, ph, ce, br] = await Promise.all([
          supabase.from('candidate_skills').select('*, skills(name)').eq('candidate_id', profile.id),
          supabase.from('candidate_systems').select('*, systems(name)').eq('candidate_id', profile.id),
          supabase.from('candidate_product_houses').select('*, product_houses(name)').eq('candidate_id', profile.id),
          supabase.from('candidate_certifications').select('*, certifications(name)').eq('candidate_id', profile.id),
          supabase.from('candidate_hotel_brands').select('*, hotel_brands(name)').eq('candidate_id', profile.id),
        ])

        const skMap = new Map<string, any>()
        for (const s of sk.data || []) skMap.set(s.skill_id, { name: s.skills?.name, proficiency: s.proficiency || 'competent', years_using: s.years_using })
        setSelectedSkills(skMap)

        const syMap = new Map<string, any>()
        for (const s of sy.data || []) syMap.set(s.system_id, { name: s.systems?.name, proficiency: s.proficiency || 'competent' })
        setSelectedSystems(syMap)

        const phMap = new Map<string, any>()
        for (const p of ph.data || []) phMap.set(p.product_house_id, { name: p.product_houses?.name, years_using: p.years_using })
        setSelectedPH(phMap)

        const ceMap = new Map<string, any>()
        for (const c of ce.data || []) ceMap.set(c.certification_id, { name: c.certifications?.name, issued_date: c.issued_date, expiry_date: c.expiry_date })
        setSelectedCerts(ceMap)

        const brMap = new Map<string, any>()
        for (const b of br.data || []) brMap.set(b.hotel_brand_id, { name: b.hotel_brands?.name, years_worked: b.years_worked, role_held: b.role_held })
        setSelectedBrands(brMap)
      }

      // Load taxonomy
      const [ts, bs, sys, phs, certs, brands] = await Promise.all([
        supabase.from('skills').select('*').eq('is_active', true).eq('category', 'treatment').order('sort_order'),
        supabase.from('skills').select('*').eq('is_active', true).in('category', ['commercial', 'leadership', 'operational']).order('category').order('sort_order'),
        supabase.from('systems').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('product_houses').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('certifications').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('hotel_brands').select('*').eq('is_active', true).order('sort_order'),
      ])

      setTreatmentSkills(ts.data || [])
      setBusinessSkills(bs.data || [])
      setSystemsList(sys.data || [])
      setProductHousesList(phs.data || [])
      setCertsList(certs.data || [])
      setBrandsList(brands.data || [])
      setLoading(false)
    }
    load()
  }, [])

  // ── Toggle helpers ──
  const toggleInMap = (map: Map<string, any>, setMap: (m: Map<string, any>) => void, id: string, name: string, defaults: any = {}) => {
    const next = new Map(map)
    if (next.has(id)) next.delete(id)
    else next.set(id, { name, proficiency: 'competent', ...defaults })
    setMap(next)
  }

  const updateInMap = (map: Map<string, any>, setMap: (m: Map<string, any>) => void, id: string, field: string, value: any) => {
    const next = new Map(map)
    const existing = next.get(id) || {}
    next.set(id, { ...existing, [field]: value })
    setMap(next)
  }

  // ── Save step data ──
  const saveStep = async () => {
    if (!profileId) return
    setSaving(true)

    if (step === 1) {
      await fetch('/api/profile/update', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, data: {
          full_name: basic.full_name, location: basic.location_city,
          headline: basic.headline, bio: basic.bio,
          experience_years: basic.years_experience ? parseInt(basic.years_experience) : null,
          role_level: basic.current_job_title || null,
          day_rate_min: basic.salary_min ? parseInt(basic.salary_min) : null,
          day_rate_max: basic.salary_max ? parseInt(basic.salary_max) : null,
          willing_to_relocate: basic.willing_to_relocate,
          availability_status: basic.availability_date ? 'immediately' : null,
        }}),
      })
    }

    if (step === 2 || step === 3) {
      // Save skills: delete existing, re-insert
      const allSkills = Array.from(selectedSkills.entries()).map(([skill_id, data]) => ({
        candidate_id: profileId, skill_id, proficiency: data.proficiency || 'competent', years_using: data.years_using || null,
      }))
      await supabase.from('candidate_skills').delete().eq('candidate_id', profileId)
      if (allSkills.length > 0) await supabase.from('candidate_skills').insert(allSkills)
    }

    if (step === 4) {
      const rows = Array.from(selectedSystems.entries()).map(([system_id, data]) => ({
        candidate_id: profileId, system_id, proficiency: data.proficiency || 'competent',
      }))
      await supabase.from('candidate_systems').delete().eq('candidate_id', profileId)
      if (rows.length > 0) await supabase.from('candidate_systems').insert(rows)
    }

    if (step === 5) {
      const rows = Array.from(selectedPH.entries()).map(([product_house_id, data]) => ({
        candidate_id: profileId, product_house_id, years_using: data.years_using || null,
      }))
      await supabase.from('candidate_product_houses').delete().eq('candidate_id', profileId)
      if (rows.length > 0) await supabase.from('candidate_product_houses').insert(rows)
    }

    if (step === 6) {
      const rows = Array.from(selectedCerts.entries()).map(([certification_id, data]) => ({
        candidate_id: profileId, certification_id, issued_date: data.issued_date || null, expiry_date: data.expiry_date || null, is_verified: false,
      }))
      await supabase.from('candidate_certifications').delete().eq('candidate_id', profileId)
      if (rows.length > 0) await supabase.from('candidate_certifications').insert(rows)
    }

    if (step === 7) {
      const rows = Array.from(selectedBrands.entries()).map(([hotel_brand_id, data]) => ({
        candidate_id: profileId, hotel_brand_id, years_worked: data.years_worked || null, role_held: data.role_held || null,
      }))
      await supabase.from('candidate_hotel_brands').delete().eq('candidate_id', profileId)
      if (rows.length > 0) await supabase.from('candidate_hotel_brands').insert(rows)
    }

    setSaving(false)
  }

  const goNext = async () => { await saveStep(); setStep(s => s + 1); setSearchTerm(''); window.scrollTo(0, 0) }
  const goBack = () => { setStep(s => s - 1); setSearchTerm(''); window.scrollTo(0, 0) }

  const handleSubmit = async () => {
    await saveStep()
    // Update completion
    const filled = [basic.full_name, basic.location_city, basic.headline, basic.bio, selectedSkills.size > 0, selectedSystems.size > 0, selectedPH.size > 0, selectedCerts.size > 0, basic.years_experience].filter(Boolean).length
    const pct = Math.round((filled / 9) * 100)
    await fetch('/api/profile/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId, data: { profile_completion_pct: pct, profile_completion_score: pct } }) })
    router.push('/talent/dashboard')
  }

  // ── Employment type multi-select ──
  const toggleEmpType = (t: string) => {
    const next = basic.employment_types_wanted.includes(t) ? basic.employment_types_wanted.filter(x => x !== t) : [...basic.employment_types_wanted, t]
    setBasic({ ...basic, employment_types_wanted: next })
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
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="eyebrow block mb-1.5">Full Name *</label><input type="text" value={basic.full_name} onChange={e => setBasic({ ...basic, full_name: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">City / Location *</label><input type="text" value={basic.location_city} onChange={e => setBasic({ ...basic, location_city: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Country</label><input type="text" value={basic.location_country} onChange={e => setBasic({ ...basic, location_country: e.target.value })} className="input-field" /></div>
            </div>
            <div><label className="eyebrow block mb-1.5">Right to Work</label>
              <select value={basic.right_to_work} onChange={e => setBasic({ ...basic, right_to_work: e.target.value })} className="input-field">
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
            <div className="grid grid-cols-2 gap-4">
              <div><label className="eyebrow block mb-1.5">Years of Experience</label><input type="number" value={basic.years_experience} onChange={e => setBasic({ ...basic, years_experience: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Current Job Title</label><input type="text" value={basic.current_job_title} onChange={e => setBasic({ ...basic, current_job_title: e.target.value })} className="input-field" /></div>
            </div>
            <div><label className="eyebrow block mb-1.5">Headline</label><input type="text" value={basic.headline} onChange={e => setBasic({ ...basic, headline: e.target.value })} className="input-field" placeholder="e.g. Senior Spa Therapist | CIDESCO | 6 Years Luxury" /></div>
            <div><label className="eyebrow block mb-1.5">Short Bio</label><textarea rows={3} value={basic.bio} onChange={e => setBasic({ ...basic, bio: e.target.value })} className="input-field" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="eyebrow block mb-1.5">Availability Date</label><input type="date" value={basic.availability_date} onChange={e => setBasic({ ...basic, availability_date: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Salary Min (£)</label><input type="number" value={basic.salary_min} onChange={e => setBasic({ ...basic, salary_min: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Salary Max (£)</label><input type="number" value={basic.salary_max} onChange={e => setBasic({ ...basic, salary_max: e.target.value })} className="input-field" /></div>
            </div>
            <div><label className="eyebrow block mb-1.5">Languages (comma separated)</label><input type="text" value={basic.languages} onChange={e => setBasic({ ...basic, languages: e.target.value })} className="input-field" placeholder="English, French, Spanish" /></div>
            <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={basic.willing_to_relocate} onChange={e => setBasic({ ...basic, willing_to_relocate: e.target.checked })} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[13px] text-secondary">Willing to relocate</span></label>
          </div>
        )}

        {/* ═══ STEP 2: Treatment Skills ═══ */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select the treatment skills you can deliver. Set your proficiency level for each.</p>
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input type="text" placeholder="Search skills..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9 !py-2 text-[13px]" /></div>
            <ChipGrid items={treatmentSkills} selected={selectedSkills} onToggle={(id, name) => toggleInMap(selectedSkills, setSelectedSkills, id, name)} search={searchTerm} />
            {selectedSkills.size > 0 && (
              <div className="space-y-2 mt-4 pt-4 border-t border-border">
                <p className="eyebrow">Selected ({selectedSkills.size})</p>
                {Array.from(selectedSkills.entries()).map(([id, data]) => (
                  <div key={id} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                    <span className="text-[13px] text-ink">{data.name}</span>
                    <ProficiencySelect value={data.proficiency || 'competent'} onChange={v => updateInMap(selectedSkills, setSelectedSkills, id, 'proficiency', v)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3: Business Skills ═══ */}
        {step === 3 && (
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
                    <ProficiencySelect value={data.proficiency || 'competent'} onChange={v => updateInMap(selectedSkills, setSelectedSkills, id, 'proficiency', v)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 4: Systems ═══ */}
        {step === 4 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select the booking, POS and management systems you&apos;ve used.</p>
            <ChipGrid items={systemsList} selected={selectedSystems} onToggle={(id, name) => toggleInMap(selectedSystems, setSelectedSystems, id, name)} />
            {selectedSystems.size > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="eyebrow">Selected ({selectedSystems.size})</p>
                {Array.from(selectedSystems.entries()).map(([id, data]) => (
                  <div key={id} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                    <span className="text-[13px] text-ink">{data.name}</span>
                    <ProficiencySelect value={data.proficiency || 'competent'} onChange={v => updateInMap(selectedSystems, setSelectedSystems, id, 'proficiency', v)} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 5: Product Houses ═══ */}
        {step === 5 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select the product houses and skincare brands you have experience with.</p>
            {['ultra_luxury', 'luxury', 'professional', 'mass'].map(tier => {
              const items = productHousesList.filter(p => p.tier === tier)
              if (items.length === 0) return null
              return (
                <div key={tier}>
                  <p className="eyebrow mb-2 capitalize">{tier.replace('_', ' ')}</p>
                  <ChipGrid items={items} selected={selectedPH} onToggle={(id, name) => toggleInMap(selectedPH, setSelectedPH, id, name)} />
                </div>
              )
            })}
            {selectedPH.size > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="eyebrow">Selected ({selectedPH.size}) — add years of experience</p>
                {Array.from(selectedPH.entries()).map(([id, data]) => (
                  <div key={id} className="flex items-center justify-between p-2 bg-surface rounded-lg">
                    <span className="text-[13px] text-ink">{data.name}</span>
                    <input type="number" placeholder="Years" value={data.years_using || ''} onChange={e => updateInMap(selectedPH, setSelectedPH, id, 'years_using', e.target.value ? parseInt(e.target.value) : null)} className="input-field !py-1 !px-2 text-[11px] w-20" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 6: Certifications ═══ */}
        {step === 6 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select your qualifications and certifications.</p>
            {Object.entries(groupBy(certsList, 'category')).map(([cat, items]) => (
              <div key={cat}>
                <p className="eyebrow mb-2 capitalize">{cat.replace('_', ' ')}</p>
                <ChipGrid items={items} selected={selectedCerts} onToggle={(id, name) => toggleInMap(selectedCerts, setSelectedCerts, id, name)} />
              </div>
            ))}
            {selectedCerts.size > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="eyebrow">Selected ({selectedCerts.size})</p>
                {Array.from(selectedCerts.entries()).map(([id, data]) => (
                  <div key={id} className="flex items-center gap-3 p-2 bg-surface rounded-lg">
                    <span className="text-[13px] text-ink flex-1">{data.name}</span>
                    <input type="date" placeholder="Issued" value={data.issued_date || ''} onChange={e => updateInMap(selectedCerts, setSelectedCerts, id, 'issued_date', e.target.value)} className="input-field !py-1 !px-2 text-[11px] w-32" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 7: Brand Experience ═══ */}
        {step === 7 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select the hotel and spa brands you&apos;ve worked with.</p>
            {['ultra_luxury', 'luxury', 'lifestyle', 'boutique', 'independent'].map(tier => {
              const items = brandsList.filter(b => b.tier === tier)
              if (items.length === 0) return null
              return (
                <div key={tier}>
                  <p className="eyebrow mb-2 capitalize">{tier.replace('_', ' ')}</p>
                  <ChipGrid items={items} selected={selectedBrands} onToggle={(id, name) => toggleInMap(selectedBrands, setSelectedBrands, id, name)} />
                </div>
              )
            })}
            {selectedBrands.size > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="eyebrow">Selected ({selectedBrands.size})</p>
                {Array.from(selectedBrands.entries()).map(([id, data]) => (
                  <div key={id} className="flex items-center gap-3 p-2 bg-surface rounded-lg">
                    <span className="text-[13px] text-ink flex-1">{data.name}</span>
                    <input type="number" placeholder="Years" value={data.years_worked || ''} onChange={e => updateInMap(selectedBrands, setSelectedBrands, id, 'years_worked', e.target.value ? parseInt(e.target.value) : null)} className="input-field !py-1 !px-2 text-[11px] w-20" />
                    <input type="text" placeholder="Role held" value={data.role_held || ''} onChange={e => updateInMap(selectedBrands, setSelectedBrands, id, 'role_held', e.target.value)} className="input-field !py-1 !px-2 text-[11px] w-36" />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 8: Review ═══ */}
        {step === 8 && (
          <div className="space-y-6">
            <p className="text-[14px] text-secondary">Review your profile before submitting.</p>

            {/* Completion ring */}
            <div className="flex items-center gap-4 p-4 bg-surface rounded-xl">
              <div className="relative w-16 h-16">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 36 36">
                  <circle cx="18" cy="18" r="16" fill="none" stroke="#E5E5E3" strokeWidth="3" />
                  <circle cx="18" cy="18" r="16" fill="none" stroke={completionPct >= 80 ? '#16A34A' : completionPct >= 50 ? '#C9A96E' : '#E5E5E3'} strokeWidth="3" strokeDasharray={`${completionPct} ${100 - completionPct}`} strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-[13px] font-semibold text-ink">{completionPct}%</span>
              </div>
              <div><p className="text-[14px] font-medium text-ink">Profile Completion</p><p className="text-[12px] text-muted">Fill more sections to improve your match scores.</p></div>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-3">
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
        <div className="flex gap-3 mt-8 pt-6 border-t border-border">
          {step > 1 && <button type="button" onClick={goBack} className="btn-secondary flex items-center gap-2 flex-1"><ArrowLeft size={14} />Back</button>}
          {step < 8 ? (
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
