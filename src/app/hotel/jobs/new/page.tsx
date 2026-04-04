'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/DashboardShell'
import { Check, ArrowRight, ArrowLeft, Search } from 'lucide-react'

const STEPS = ['Job Details', 'Treatment Skills', 'Business Skills', 'Systems', 'Product Houses', 'Certifications', 'Review']

function ChipGrid({ items, selected, onToggle, search }: { items: any[]; selected: Map<string, any>; onToggle: (id: string, name: string) => void; search?: string }) {
  const filtered = search ? items.filter(i => i.name.toLowerCase().includes(search.toLowerCase())) : items
  return (
    <div className="flex flex-wrap gap-2">
      {filtered.map(item => {
        const sel = selected.has(item.id)
        return (
          <button key={item.id} type="button" onClick={() => onToggle(item.id, item.name)}
            className={`px-3 py-1.5 rounded-full text-[12px] font-medium transition-all ${sel ? 'bg-ink text-white' : 'bg-surface border border-border text-secondary hover:border-ink/30'}`}>
            {sel && <Check size={10} className="inline mr-1" />}{item.name}
          </button>
        )
      })}
      {filtered.length === 0 && <p className="text-[13px] text-muted">No items found.</p>}
    </div>
  )
}

function RequirementRow({ id, data, onUpdate, onRemove }: { id: string; data: any; onUpdate: (f: string, v: any) => void; onRemove: () => void }) {
  return (
    <div className="flex items-center gap-3 p-2 bg-surface rounded-lg">
      <span className="text-[13px] text-ink flex-1">{data.name}</span>
      <select value={data.level || 'required'} onChange={e => onUpdate('level', e.target.value)} className="input-field !py-1 !px-2 text-[11px] w-24">
        <option value="required">Required</option><option value="preferred">Preferred</option>
      </select>
      <label className="flex items-center gap-1 cursor-pointer"><input type="checkbox" checked={data.is_trainable || false} onChange={e => onUpdate('is_trainable', e.target.checked)} className="w-3 h-3 border-border rounded text-ink" /><span className="text-[10px] text-muted">Trainable</span></label>
      <button type="button" onClick={onRemove} className="text-muted hover:text-red-500 text-[11px]">&times;</button>
    </div>
  )
}

export default function NewJobWizard() {
  const supabase = createClient()
  const router = useRouter()
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  // Job details
  const [job, setJob] = useState({
    job_title: '', job_description: '', location: '', location_postcode: '',
    employment_type: 'full_time', role_level: 'therapist', salary_min: '', salary_max: '',
    start_date: '', right_to_work_required: 'any', relocation_support: false, tier: 'silver',
  })

  // Taxonomy
  const [treatmentSkills, setTreatmentSkills] = useState<any[]>([])
  const [businessSkills, setBusinessSkills] = useState<any[]>([])
  const [systemsList, setSystemsList] = useState<any[]>([])
  const [productHousesList, setProductHousesList] = useState<any[]>([])
  const [certsList, setCertsList] = useState<any[]>([])

  // Selections: Map<id, { name, level, is_trainable }>
  const [selSkills, setSelSkills] = useState<Map<string, any>>(new Map())
  const [selSystems, setSelSystems] = useState<Map<string, any>>(new Map())
  const [selPH, setSelPH] = useState<Map<string, any>>(new Map())
  const [selCerts, setSelCerts] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?role=employer'); return }
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      if (!prof) { router.push('/login?role=employer'); return }
      setProfile(prof)

      const [ts, bs, sys, phs, certs] = await Promise.all([
        supabase.from('skills').select('*').eq('is_active', true).eq('category', 'treatment').order('sort_order'),
        supabase.from('skills').select('*').eq('is_active', true).in('category', ['commercial', 'leadership', 'operational']).order('category').order('sort_order'),
        supabase.from('systems').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('product_houses').select('*').eq('is_active', true).order('sort_order'),
        supabase.from('certifications').select('*').eq('is_active', true).order('sort_order'),
      ])
      setTreatmentSkills(ts.data || [])
      setBusinessSkills(bs.data || [])
      setSystemsList(sys.data || [])
      setProductHousesList(phs.data || [])
      setCertsList(certs.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const toggle = (map: Map<string, any>, setMap: (m: Map<string, any>) => void, id: string, name: string) => {
    const next = new Map(map)
    if (next.has(id)) next.delete(id)
    else next.set(id, { name, level: 'required', is_trainable: false })
    setMap(next)
  }

  const update = (map: Map<string, any>, setMap: (m: Map<string, any>) => void, id: string, field: string, value: any) => {
    const next = new Map(map)
    next.set(id, { ...next.get(id), [field]: value })
    setMap(next)
  }

  const remove = (map: Map<string, any>, setMap: (m: Map<string, any>) => void, id: string) => {
    const next = new Map(map)
    next.delete(id)
    setMap(next)
  }

  const groupBy = (items: any[], key: string) => {
    const g: Record<string, any[]> = {}
    for (const i of items) { const k = i[key] || 'other'; if (!g[k]) g[k] = []; g[k].push(i) }
    return g
  }

  const handleSubmit = async () => {
    if (!profile) return
    setSaving(true)

    // Create job listing
    const { data: newJob, error } = await supabase.from('job_listings').insert({
      employer_id: profile.id,
      job_title: job.job_title, job_description: job.job_description,
      location: job.location, location_postcode: job.location_postcode || null,
      job_type: job.employment_type, contract_type: job.employment_type,
      salary_min: job.salary_min ? parseInt(job.salary_min) : null,
      salary_max: job.salary_max ? parseInt(job.salary_max) : null,
      required_role_level: job.role_level, is_live: true, tier: job.tier,
    }).select('id').single()

    if (error || !newJob) { setSaving(false); alert(error?.message || 'Failed to create job'); return }
    const jobId = newJob.id

    // Save required skills
    const reqSkills = Array.from(selSkills.entries()).filter(([_, d]) => d.level === 'required').map(([skill_id, d]) => ({ job_id: jobId, skill_id, is_trainable: d.is_trainable || false }))
    if (reqSkills.length > 0) await supabase.from('job_required_skills').insert(reqSkills)

    // Save preferred skills
    const prefSkills = Array.from(selSkills.entries()).filter(([_, d]) => d.level === 'preferred').map(([skill_id, d]) => ({ job_id: jobId, skill_id, is_trainable: d.is_trainable ?? true }))
    if (prefSkills.length > 0) await supabase.from('job_preferred_skills').insert(prefSkills)

    // Save systems
    const sysRows = Array.from(selSystems.entries()).map(([system_id, d]) => ({ job_id: jobId, system_id, is_trainable: d.is_trainable || false }))
    if (sysRows.length > 0) await supabase.from('job_required_systems').insert(sysRows)

    // Save product houses
    const phRows = Array.from(selPH.entries()).map(([product_house_id, d]) => ({ job_id: jobId, product_house_id, requirement_level: d.level || 'required', is_trainable: d.is_trainable || false }))
    if (phRows.length > 0) await supabase.from('job_required_product_houses').insert(phRows)

    // Save certifications
    const certRows = Array.from(selCerts.entries()).map(([certification_id, d]) => ({ job_id: jobId, certification_id, requirement_level: d.level || 'required', is_trainable: d.is_trainable || false }))
    if (certRows.length > 0) await supabase.from('job_required_certifications').insert(certRows)

    setSaving(false)
    router.push('/hotel/dashboard')
  }

  const goNext = () => { setStep(s => s + 1); setSearchTerm(''); window.scrollTo(0, 0) }
  const goBack = () => { setStep(s => s - 1); setSearchTerm(''); window.scrollTo(0, 0) }

  if (loading) return <DashboardShell role="employer"><div className="max-w-2xl"><div className="skeleton h-8 w-1/3 mb-4" /><div className="skeleton h-64" /></div></DashboardShell>

  return (
    <DashboardShell role="employer" userName={profile?.property_name || profile?.company_name}>
      <div className="max-w-2xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-[20px] font-medium text-ink">Create Job Listing</h1>
            <span className="text-[13px] text-muted">Step {step} of {STEPS.length}</span>
          </div>
          <div className="flex gap-1">{STEPS.map((_, i) => <div key={i} className={`h-1 flex-1 rounded-full ${i + 1 <= step ? 'bg-ink' : 'bg-border'}`} />)}</div>
          <p className="text-[12px] text-muted mt-2">{STEPS[step - 1]}</p>
        </div>

        {/* ═══ STEP 1: Job Details ═══ */}
        {step === 1 && (
          <div className="space-y-5">
            <div><label className="eyebrow block mb-1.5">Job Title *</label><input type="text" value={job.job_title} onChange={e => setJob({ ...job, job_title: e.target.value })} className="input-field" placeholder="e.g. Senior Spa Therapist" /></div>
            <div><label className="eyebrow block mb-1.5">Description</label><textarea rows={4} value={job.job_description} onChange={e => setJob({ ...job, job_description: e.target.value })} className="input-field" /></div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="eyebrow block mb-1.5">Location *</label><input type="text" value={job.location} onChange={e => setJob({ ...job, location: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Postcode</label><input type="text" value={job.location_postcode} onChange={e => setJob({ ...job, location_postcode: e.target.value })} className="input-field" /></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="eyebrow block mb-1.5">Employment Type</label>
                <select value={job.employment_type} onChange={e => setJob({ ...job, employment_type: e.target.value })} className="input-field">
                  <option value="full_time">Full Time</option><option value="part_time">Part Time</option><option value="contract">Contract</option><option value="agency">Agency</option><option value="seasonal">Seasonal</option>
                </select></div>
              <div><label className="eyebrow block mb-1.5">Role Level</label>
                <select value={job.role_level} onChange={e => setJob({ ...job, role_level: e.target.value })} className="input-field">
                  <option value="junior">Junior</option><option value="therapist">Therapist</option><option value="senior">Senior</option><option value="supervisor">Supervisor</option><option value="manager">Manager</option><option value="director">Director</option><option value="executive">Executive</option>
                </select></div>
              <div><label className="eyebrow block mb-1.5">Listing Tier</label>
                <select value={job.tier} onChange={e => setJob({ ...job, tier: e.target.value })} className="input-field">
                  <option value="bronze">Bronze £150</option><option value="silver">Silver £200</option><option value="gold">Gold £225</option><option value="platinum">Platinum £250</option>
                </select></div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="eyebrow block mb-1.5">Salary Min (£)</label><input type="number" value={job.salary_min} onChange={e => setJob({ ...job, salary_min: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Salary Max (£)</label><input type="number" value={job.salary_max} onChange={e => setJob({ ...job, salary_max: e.target.value })} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Start Date</label><input type="date" value={job.start_date} onChange={e => setJob({ ...job, start_date: e.target.value })} className="input-field" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="eyebrow block mb-1.5">Right to Work Required</label>
                <select value={job.right_to_work_required} onChange={e => setJob({ ...job, right_to_work_required: e.target.value })} className="input-field">
                  <option value="any">Any</option><option value="uk_only">UK Only</option><option value="eu_only">EU Only</option><option value="visa_sponsored">Visa Sponsored</option>
                </select></div>
              <div className="flex items-end pb-2"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={job.relocation_support} onChange={e => setJob({ ...job, relocation_support: e.target.checked })} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[13px] text-secondary">Relocation support offered</span></label></div>
            </div>
          </div>
        )}

        {/* ═══ STEP 2: Treatment Skills ═══ */}
        {step === 2 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select the treatment skills required for this role. Mark each as required or preferred, and flag trainable items.</p>
            <div className="relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" /><input type="text" placeholder="Search skills..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="input-field pl-9 !py-2 text-[13px]" /></div>
            <ChipGrid items={treatmentSkills} selected={selSkills} onToggle={(id, name) => toggle(selSkills, setSelSkills, id, name)} search={searchTerm} />
            {selSkills.size > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="eyebrow">Selected treatment skills ({Array.from(selSkills.entries()).filter(([id]) => treatmentSkills.some(s => s.id === id)).length})</p>
                {Array.from(selSkills.entries()).filter(([id]) => treatmentSkills.some(s => s.id === id)).map(([id, data]) => (
                  <RequirementRow key={id} id={id} data={data} onUpdate={(f, v) => update(selSkills, setSelSkills, id, f, v)} onRemove={() => remove(selSkills, setSelSkills, id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 3: Business Skills ═══ */}
        {step === 3 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select commercial, leadership and operational requirements.</p>
            {Object.entries(groupBy(businessSkills, 'category')).map(([cat, items]) => (
              <div key={cat}><p className="eyebrow mb-2 capitalize">{cat} Skills</p>
                <ChipGrid items={items} selected={selSkills} onToggle={(id, name) => toggle(selSkills, setSelSkills, id, name)} /></div>
            ))}
            {Array.from(selSkills.entries()).filter(([id]) => businessSkills.some(s => s.id === id)).length > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="eyebrow">Selected business skills</p>
                {Array.from(selSkills.entries()).filter(([id]) => businessSkills.some(s => s.id === id)).map(([id, data]) => (
                  <RequirementRow key={id} id={id} data={data} onUpdate={(f, v) => update(selSkills, setSelSkills, id, f, v)} onRemove={() => remove(selSkills, setSelSkills, id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 4: Systems ═══ */}
        {step === 4 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select the systems knowledge required or preferred.</p>
            <ChipGrid items={systemsList} selected={selSystems} onToggle={(id, name) => toggle(selSystems, setSelSystems, id, name)} />
            {selSystems.size > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="eyebrow">Selected ({selSystems.size})</p>
                {Array.from(selSystems.entries()).map(([id, data]) => (
                  <RequirementRow key={id} id={id} data={data} onUpdate={(f, v) => update(selSystems, setSelSystems, id, f, v)} onRemove={() => remove(selSystems, setSelSystems, id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 5: Product Houses ═══ */}
        {step === 5 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select required or preferred product house experience.</p>
            {['ultra_luxury', 'luxury', 'professional'].map(tier => {
              const items = productHousesList.filter(p => p.tier === tier)
              if (items.length === 0) return null
              return <div key={tier}><p className="eyebrow mb-2 capitalize">{tier.replace('_', ' ')}</p><ChipGrid items={items} selected={selPH} onToggle={(id, name) => toggle(selPH, setSelPH, id, name)} /></div>
            })}
            {selPH.size > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="eyebrow">Selected ({selPH.size})</p>
                {Array.from(selPH.entries()).map(([id, data]) => (
                  <RequirementRow key={id} id={id} data={data} onUpdate={(f, v) => update(selPH, setSelPH, id, f, v)} onRemove={() => remove(selPH, setSelPH, id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 6: Certifications ═══ */}
        {step === 6 && (
          <div className="space-y-5">
            <p className="text-[14px] text-secondary">Select required or preferred certifications and qualifications.</p>
            {Object.entries(groupBy(certsList, 'category')).map(([cat, items]) => (
              <div key={cat}><p className="eyebrow mb-2 capitalize">{cat.replace('_', ' ')}</p><ChipGrid items={items} selected={selCerts} onToggle={(id, name) => toggle(selCerts, setSelCerts, id, name)} /></div>
            ))}
            {selCerts.size > 0 && (
              <div className="space-y-2 pt-4 border-t border-border">
                <p className="eyebrow">Selected ({selCerts.size})</p>
                {Array.from(selCerts.entries()).map(([id, data]) => (
                  <RequirementRow key={id} id={id} data={data} onUpdate={(f, v) => update(selCerts, setSelCerts, id, f, v)} onRemove={() => remove(selCerts, setSelCerts, id)} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ STEP 7: Review ═══ */}
        {step === 7 && (
          <div className="space-y-6">
            <p className="text-[14px] text-secondary">Review your job listing before publishing.</p>
            <div className="p-5 border border-border rounded-xl space-y-3">
              <h3 className="text-[18px] font-medium text-ink">{job.job_title || 'Untitled Role'}</h3>
              <div className="flex flex-wrap gap-2 text-[12px] text-muted">
                <span>{job.location}</span><span>&middot;</span><span className="capitalize">{job.employment_type.replace('_', ' ')}</span><span>&middot;</span><span className="capitalize">{job.role_level}</span>
                {job.salary_min && job.salary_max && <><span>&middot;</span><span>£{(parseInt(job.salary_min)/1000).toFixed(0)}k–£{(parseInt(job.salary_max)/1000).toFixed(0)}k</span></>}
              </div>
              {job.job_description && <p className="text-[13px] text-secondary line-clamp-3">{job.job_description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Required Skills', count: Array.from(selSkills.values()).filter(d => d.level === 'required').length },
                { label: 'Preferred Skills', count: Array.from(selSkills.values()).filter(d => d.level === 'preferred').length },
                { label: 'Systems', count: selSystems.size },
                { label: 'Product Houses', count: selPH.size },
                { label: 'Certifications', count: selCerts.size },
                { label: 'Trainable Items', count: [...Array.from(selSkills.values()), ...Array.from(selSystems.values()), ...Array.from(selPH.values()), ...Array.from(selCerts.values())].filter(d => d.is_trainable).length },
              ].map(s => (
                <div key={s.label} className="p-3 bg-surface rounded-lg"><p className="eyebrow mb-1">{s.label}</p><p className="text-[18px] font-semibold text-ink">{s.count}</p></div>
              ))}
            </div>

            <div className="bg-surface p-4 rounded-lg text-[13px] text-muted">
              Your listing will be published as a <span className="capitalize font-medium text-ink">{job.tier}</span> tier listing. The matching engine will score candidates against these requirements.
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 mt-8 pt-6 border-t border-border">
          {step > 1 && <button type="button" onClick={goBack} className="btn-secondary flex items-center gap-2 flex-1"><ArrowLeft size={14} />Back</button>}
          {step < 7 ? (
            <button type="button" onClick={goNext} disabled={step === 1 && (!job.job_title || !job.location)} className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-40">Continue<ArrowRight size={14} /></button>
          ) : (
            <button type="button" onClick={handleSubmit} disabled={saving} className="btn-primary flex items-center justify-center gap-2 flex-1 disabled:opacity-50">{saving ? 'Publishing...' : 'Publish Job Listing'}<Check size={14} /></button>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
