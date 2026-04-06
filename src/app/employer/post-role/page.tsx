'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { ROLE_LEVELS, CONTRACT_TYPES, JOB_TIERS } from '@/lib/constants'
import { SERVICES_CATEGORIES, PRODUCT_HOUSES_FULL, QUALS_CATEGORIES, SYSTEMS_FULL } from '@/lib/taxonomy'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'
import { Check } from 'lucide-react'
import { jobListingSchema } from '@/lib/validations'

const TIER_KEYS = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const
const tierCards = TIER_KEYS.map(k => ({
  key: k,
  price: JOB_TIERS[k].display,
  days: JOB_TIERS[k].days,
  features: JOB_TIERS[k].features as readonly string[],
}))

const SHIFT_OPTIONS = ['Early morning', 'Daytime', 'Evening', 'Overnight', 'Split shifts', 'Weekends only', 'Flexible']

const BUSINESS_SKILLS = [
  'Reception & Front of House', 'Revenue Management', 'Stock Control',
  'Team Leadership', 'Staff Training', 'Rota Management', 'KPI Reporting',
  'Health & Safety', 'COSHH Management', 'Budget Management',
  'Client Consultation', 'Upselling & Retail', 'Social Media',
  'Event Coordination', 'Membership Management',
]

export default function PostRolePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [phase, setPhase] = useState<'form' | 'preview' | 'tier'>('form')
  const [selectedTier, setSelectedTier] = useState('Silver')
  const [saving, setSaving] = useState(false)
  const [checkoutLoading, setCheckoutLoading] = useState(false)
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [cloneJobId, setCloneJobId] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '', description: '', location: '', location_postcode: '',
    radius_miles: '', job_type: 'Full-time', contract_type: 'permanent',
    required_role_level: '', salary_min: '', salary_max: '', specialism: '',
    // ── Algorithm fields ──
    required_skills: [] as string[],
    required_product_houses: [] as string[],
    required_qualifications: [] as string[],
    required_systems: [] as string[],
    preferred_business_skills: [] as string[],
    min_years_experience: '',
    shift_pattern: '',
    offers_accommodation: false,
    // ── Other ──
    requirements: '', benefits: '',
    insurance_required: false, is_agency_role: false, is_residency_role: false,
  })

  const update = (field: string, value: any) => setForm({ ...form, [field]: value })

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(data)

      const cloneId = searchParams?.get('clone')
      const repostId = searchParams?.get('repost')
      const jobIdToLoad = cloneId || repostId

      if (jobIdToLoad) {
        const { data: jobData } = await supabase.from('job_listings').select('*').eq('id', jobIdToLoad).single()
        if (jobData) {
          setCloneJobId(jobIdToLoad)
          setForm({
            title: jobData.job_title || '',
            description: jobData.job_description || '',
            location: jobData.location || '',
            location_postcode: jobData.location_postcode || '',
            radius_miles: jobData.radius_miles?.toString() || '',
            job_type: jobData.job_type || 'Full-time',
            contract_type: jobData.contract_type || 'permanent',
            required_role_level: jobData.required_role_level || '',
            salary_min: jobData.salary_min?.toString() || '',
            salary_max: jobData.salary_max?.toString() || '',
            specialism: jobData.specialism || '',
            required_skills: jobData.required_skills || [],
            required_product_houses: jobData.required_brands || jobData.required_product_houses || [],
            required_qualifications: jobData.required_qualifications || [],
            required_systems: jobData.required_systems || [],
            preferred_business_skills: jobData.preferred_business_skills || [],
            min_years_experience: jobData.min_years_experience?.toString() || '',
            shift_pattern: jobData.shift_pattern || '',
            offers_accommodation: jobData.offers_accommodation || false,
            requirements: (jobData.requirements && Array.isArray(jobData.requirements)) ? jobData.requirements.join('\n') : '',
            benefits: (jobData.benefits && Array.isArray(jobData.benefits)) ? jobData.benefits.join('\n') : '',
            insurance_required: jobData.insurance_required || false,
            is_agency_role: jobData.is_agency_role || false,
            is_residency_role: jobData.is_residency_role || false,
          })
          if (jobData.tier) setSelectedTier(jobData.tier)
        }
      }
    }
    load()
  }, [])

  const buildJobPayload = () => ({
    employer_id: profile.id,
    job_title: form.title,
    job_description: form.description,
    location: form.location,
    location_postcode: form.location_postcode || null,
    radius_miles: form.radius_miles ? parseInt(form.radius_miles) : null,
    job_type: form.job_type,
    contract_type: form.contract_type,
    required_role_level: form.required_role_level || null,
    salary_min: form.salary_min ? parseInt(form.salary_min) : null,
    salary_max: form.salary_max ? parseInt(form.salary_max) : null,
    // ── Algorithm fields ──
    required_skills: form.required_skills.length > 0 ? form.required_skills : null,
    required_brands: form.required_product_houses.length > 0 ? form.required_product_houses : null,
    required_qualifications: form.required_qualifications.length > 0 ? form.required_qualifications : null,
    required_systems: form.required_systems.length > 0 ? form.required_systems : null,
    preferred_business_skills: form.preferred_business_skills.length > 0 ? form.preferred_business_skills : null,
    min_years_experience: form.min_years_experience ? parseInt(form.min_years_experience) : 0,
    shift_pattern: form.shift_pattern || null,
    offers_accommodation: form.offers_accommodation,
    // ── Other ──
    requirements: form.requirements ? form.requirements.split('\n').filter(Boolean) : null,
    benefits: form.benefits ? form.benefits.split('\n').filter(Boolean) : null,
    insurance_required: form.insurance_required,
    is_agency_role: form.is_agency_role,
    is_residency_role: form.is_residency_role,
    tier: selectedTier,
  })

  const handleSaveAsDraft = async () => {
    if (!profile || !form.title || !form.location) return
    setSaving(true)
    setError('')

    try {
      const { error: insertError } = await supabase.from('job_listings').insert({
        ...buildJobPayload(),
        is_live: false,
        status: 'draft',
      })

      if (insertError) {
        setError(insertError.message || 'Failed to save draft')
        setSaving(false)
        return
      }

      router.push('/employer/jobs')
    } catch (err: any) {
      setError(err.message || 'Failed to save draft')
      setSaving(false)
    }
  }

  const handleSaveAndPay = async () => {
    if (!profile) return
    setSaving(true)
    setError('')
    setFieldErrors({})

    const validation = jobListingSchema.safeParse({
      job_title: form.title,
      job_description: form.description,
      location: form.location,
      salary_min: form.salary_min ? parseInt(form.salary_min) : undefined,
      salary_max: form.salary_max ? parseInt(form.salary_max) : undefined,
      contract_type: form.contract_type,
      required_role_level: form.required_role_level || undefined,
    })
    if (!validation.success) {
      const errs: Record<string, string> = {}
      validation.error.issues.forEach(i => { errs[i.path[0] as string] = i.message })
      setFieldErrors(errs)
      setSaving(false)
      return
    }

    const tierConfig = JOB_TIERS[selectedTier as keyof typeof JOB_TIERS]
    const expiresAt = new Date(Date.now() + (tierConfig?.days || 30) * 24 * 60 * 60 * 1000).toISOString()

    const { data: insertedJob, error: insertError } = await supabase.from('job_listings').insert({
      ...buildJobPayload(),
      is_live: false,
      status: 'pending_payment',
    }).select('id').single()

    if (insertError || !insertedJob) { setError(insertError?.message || 'Failed to create listing'); setSaving(false); return }

    setCheckoutLoading(true)
    const res = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'job_posting', tier: selectedTier, employerId: profile.id, jobId: insertedJob.id, returnUrl: window.location.origin }),
    })
    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
    } else {
      setError('Could not start checkout. Please try again.')
      setSaving(false)
      setCheckoutLoading(false)
    }
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <h1 className="text-2xl font-bold text-black mb-2">Post a Role</h1>
      <p className="text-neutral-400 text-sm mb-8">Create your job listing with full matching criteria, then select a package.</p>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6">{error}</div>}

      {phase === 'form' ? (
        <div className="max-w-2xl space-y-8">

          {/* ── SECTION: Job Details ── */}
          <div className="space-y-6">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Job Details</p>

            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Job Title *</label>
              <input type="text" value={form.title} onChange={(e) => update('title', e.target.value)} className={`input-field ${fieldErrors.job_title ? 'border-red-300' : ''}`} placeholder="e.g. Senior Spa Therapist" />
              {fieldErrors.job_title && <p className="text-red-500 text-xs mt-1">{fieldErrors.job_title}</p>}</div>

            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Description *</label>
              <textarea rows={5} value={form.description} onChange={(e) => update('description', e.target.value)} className={`input-field ${fieldErrors.job_description ? 'border-red-300' : ''}`} placeholder="Describe the role, responsibilities, and ideal candidate..." />
              {fieldErrors.job_description && <p className="text-red-500 text-xs mt-1">{fieldErrors.job_description}</p>}</div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Role Level</label>
                <select value={form.required_role_level} onChange={(e) => update('required_role_level', e.target.value)} className="input-field">
                  <option value="">Any level</option>
                  {ROLE_LEVELS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Contract Type</label>
                <select value={form.contract_type} onChange={(e) => update('contract_type', e.target.value)} className="input-field">
                  {CONTRACT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
                </select></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Location *</label>
                <input type="text" value={form.location} onChange={(e) => update('location', e.target.value)} className={`input-field ${fieldErrors.location ? 'border-red-300' : ''}`} placeholder="London" />
                {fieldErrors.location && <p className="text-red-500 text-xs mt-1">{fieldErrors.location}</p>}</div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Postcode</label>
                <input type="text" value={form.location_postcode} onChange={(e) => update('location_postcode', e.target.value)} className="input-field" placeholder="SW1A 1AA" /></div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Min Salary (£)</label>
                <input type="number" value={form.salary_min} onChange={(e) => update('salary_min', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Max Salary (£)</label>
                <input type="number" value={form.salary_max} onChange={(e) => update('salary_max', e.target.value)} className="input-field" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Job Type</label>
                <select value={form.job_type} onChange={(e) => update('job_type', e.target.value)} className="input-field">
                  <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Temporary</option><option>Freelance</option>
                </select></div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Min. Years Experience</label>
                <input type="number" min="0" max="30" value={form.min_years_experience} onChange={(e) => update('min_years_experience', e.target.value)} className="input-field" placeholder="0" /></div>
              <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Shift Pattern</label>
                <select value={form.shift_pattern} onChange={(e) => update('shift_pattern', e.target.value)} className="input-field">
                  <option value="">Any / Flexible</option>
                  {SHIFT_OPTIONS.map(s => <option key={s} value={s}>{s}</option>)}
                </select></div>
            </div>
          </div>

          {/* ── SECTION: Matching Criteria ── */}
          <div className="space-y-6">
            <div className="border-b border-neutral-100 pb-2">
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest">Matching Criteria</p>
              <p className="text-xs text-neutral-400 mt-1">These fields power the matching algorithm — the more you fill in, the better your candidate matches.</p>
            </div>

            <CollapsibleCheckboxSection
              title="Required Services & Treatment Skills"
              categories={SERVICES_CATEGORIES}
              selected={form.required_skills}
              onChange={(v) => update('required_skills', v)}
            />

            <CollapsibleCheckboxSection
              title="Required Product Houses"
              flatItems={[...PRODUCT_HOUSES_FULL]}
              selected={form.required_product_houses}
              onChange={(v) => update('required_product_houses', v)}
            />

            <CollapsibleCheckboxSection
              title="Required Qualifications"
              categories={QUALS_CATEGORIES}
              selected={form.required_qualifications}
              onChange={(v) => update('required_qualifications', v)}
            />

            <CollapsibleCheckboxSection
              title="Required Systems"
              flatItems={[...SYSTEMS_FULL]}
              selected={form.required_systems}
              onChange={(v) => update('required_systems', v)}
            />

            <CollapsibleCheckboxSection
              title="Preferred Business Skills"
              flatItems={[...BUSINESS_SKILLS]}
              selected={form.preferred_business_skills}
              onChange={(v) => update('preferred_business_skills', v)}
            />
          </div>

          {/* ── SECTION: Additional Info ── */}
          <div className="space-y-6">
            <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest border-b border-neutral-100 pb-2">Additional Information</p>

            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Requirements (one per line)</label>
              <textarea rows={3} value={form.requirements} onChange={(e) => update('requirements', e.target.value)} className="input-field" placeholder="CIDESCO qualified&#10;3+ years luxury spa experience" /></div>

            <div><label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Benefits (one per line)</label>
              <textarea rows={3} value={form.benefits} onChange={(e) => update('benefits', e.target.value)} className="input-field" placeholder="Staff accommodation&#10;Treatment allowance" /></div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={form.insurance_required} onChange={(e) => update('insurance_required', e.target.checked)} className="w-4 h-4 border-neutral-300 text-black focus:ring-black rounded-sm" /><span className="text-sm text-neutral-600">Insurance required</span></label>
              <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={form.offers_accommodation} onChange={(e) => update('offers_accommodation', e.target.checked)} className="w-4 h-4 border-neutral-300 text-black focus:ring-black rounded-sm" /><span className="text-sm text-neutral-600">Accommodation provided</span></label>
              <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={form.is_agency_role} onChange={(e) => update('is_agency_role', e.target.checked)} className="w-4 h-4 border-neutral-300 text-black focus:ring-black rounded-sm" /><span className="text-sm text-neutral-600">Agency role</span></label>
              <label className="flex items-center space-x-2 cursor-pointer"><input type="checkbox" checked={form.is_residency_role} onChange={(e) => update('is_residency_role', e.target.checked)} className="w-4 h-4 border-neutral-300 text-black focus:ring-black rounded-sm" /><span className="text-sm text-neutral-600">Residency role</span></label>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <button onClick={handleSaveAsDraft} disabled={!form.title || !form.location || saving} className="btn-secondary flex-1 disabled:opacity-40">
              {saving ? 'Saving...' : 'Save as Draft'}
            </button>
            <button onClick={() => setPhase('preview')} disabled={!form.title || !form.location} className="btn-primary flex-1 disabled:opacity-40">Continue to Preview</button>
          </div>
        </div>
      ) : phase === 'preview' ? (
        <div className="max-w-3xl space-y-6">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-6">Preview</p>

          <div className="border border-neutral-200 rounded-lg p-8 bg-white">
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-black mb-2">{form.title}</h2>
              <p className="text-sm text-neutral-500 mb-4">{form.location}</p>

              <div className="flex flex-wrap gap-3 mb-6">
                {form.salary_min && form.salary_max && (
                  <span className="inline-block px-3 py-1 bg-neutral-100 text-sm text-neutral-700 rounded">
                    £{parseInt(form.salary_min).toLocaleString()} - £{parseInt(form.salary_max).toLocaleString()}
                  </span>
                )}
                <span className="inline-block px-3 py-1 bg-neutral-100 text-sm text-neutral-700 rounded">{form.job_type}</span>
                <span className="inline-block px-3 py-1 bg-neutral-100 text-sm text-neutral-700 rounded">{form.contract_type.replace('_', ' ')}</span>
                {form.required_role_level && (
                  <span className="inline-block px-3 py-1 bg-neutral-100 text-sm text-neutral-700 rounded">{form.required_role_level}</span>
                )}
                {form.min_years_experience && (
                  <span className="inline-block px-3 py-1 bg-neutral-100 text-sm text-neutral-700 rounded">{form.min_years_experience}+ years</span>
                )}
                {form.shift_pattern && (
                  <span className="inline-block px-3 py-1 bg-neutral-100 text-sm text-neutral-700 rounded">{form.shift_pattern}</span>
                )}
                {form.offers_accommodation && (
                  <span className="inline-block px-3 py-1 bg-green-50 text-sm text-green-700 rounded">Accommodation provided</span>
                )}
              </div>
            </div>

            <div className="mb-6">
              <h3 className="font-bold text-black mb-3">Description</h3>
              <p className="text-sm text-neutral-700 whitespace-pre-line">{form.description}</p>
            </div>

            {form.requirements && (
              <div className="mb-6">
                <h3 className="font-bold text-black mb-3">Requirements</h3>
                <ul className="space-y-2">
                  {form.requirements.split('\n').filter(Boolean).map((req, i) => (
                    <li key={i} className="text-sm text-neutral-700 flex items-start">
                      <span className="mr-2">•</span>{req}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {form.benefits && (
              <div className="mb-6">
                <h3 className="font-bold text-black mb-3">Benefits</h3>
                <ul className="space-y-2">
                  {form.benefits.split('\n').filter(Boolean).map((benefit, i) => (
                    <li key={i} className="text-sm text-neutral-700 flex items-start">
                      <span className="mr-2">•</span>{benefit}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {form.required_skills.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-black mb-3">Required Services & Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {form.required_skills.map((skill) => (
                    <span key={skill} className="inline-block px-3 py-1 bg-black text-white text-xs rounded">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {form.required_product_houses.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-black mb-3">Product Houses</h3>
                <div className="flex flex-wrap gap-2">
                  {form.required_product_houses.map((house) => (
                    <span key={house} className="inline-block px-3 py-1 bg-black text-white text-xs rounded">{house}</span>
                  ))}
                </div>
              </div>
            )}

            {form.required_qualifications.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-black mb-3">Qualifications</h3>
                <div className="flex flex-wrap gap-2">
                  {form.required_qualifications.map((qual) => (
                    <span key={qual} className="inline-block px-3 py-1 bg-black text-white text-xs rounded">{qual}</span>
                  ))}
                </div>
              </div>
            )}

            {form.required_systems.length > 0 && (
              <div className="mb-6">
                <h3 className="font-bold text-black mb-3">Systems</h3>
                <div className="flex flex-wrap gap-2">
                  {form.required_systems.map((sys) => (
                    <span key={sys} className="inline-block px-3 py-1 bg-black text-white text-xs rounded">{sys}</span>
                  ))}
                </div>
              </div>
            )}

            {form.preferred_business_skills.length > 0 && (
              <div>
                <h3 className="font-bold text-black mb-3">Preferred Business Skills</h3>
                <div className="flex flex-wrap gap-2">
                  {form.preferred_business_skills.map((skill) => (
                    <span key={skill} className="inline-block px-3 py-1 bg-neutral-100 text-neutral-700 text-xs rounded">{skill}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button onClick={() => setPhase('form')} className="btn-secondary">Edit</button>
            <button onClick={() => setPhase('tier')} className="btn-primary flex-1">Post & Pay</button>
          </div>
        </div>
      ) : (
        <div className="max-w-3xl">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-6">Select Package</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {tierCards.map((tier) => (
              <div key={tier.key} onClick={() => setSelectedTier(tier.key)}
                className={`border p-6 cursor-pointer transition-all ${selectedTier === tier.key ? 'border-black bg-neutral-50' : 'border-neutral-200 hover:border-neutral-400'}`}>
                <h3 className="font-bold text-black mb-1">{tier.key}</h3>
                <p className="text-2xl font-bold text-black">{tier.price}</p>
                <p className="text-xs text-neutral-400 mb-4">{tier.days} days</p>
                <ul className="space-y-2">{tier.features.map((f) => (
                  <li key={f} className="flex items-center space-x-2 text-xs text-neutral-500"><Check size={12} className="text-black flex-shrink-0" /><span>{f}</span></li>
                ))}</ul>
              </div>
            ))}
          </div>
          <div className="flex gap-3">
            <button onClick={() => setPhase('form')} className="btn-secondary">Back to Edit</button>
            <button onClick={handleSaveAndPay} disabled={saving || checkoutLoading} className="btn-primary disabled:opacity-50">
              {checkoutLoading ? 'Redirecting to payment...' : saving ? 'Saving...' : `Post Role — ${tierCards.find(t => t.key === selectedTier)?.price}`}
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
