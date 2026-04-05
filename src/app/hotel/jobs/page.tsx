'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import DashboardShell from '@/components/DashboardShell'
import { ROLE_LEVELS, CONTRACT_TYPES, JOB_TIERS } from '@/lib/constants'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'
import { PRODUCT_HOUSES, QUALIFICATIONS } from '@/lib/constants'
import Link from 'next/link'
import { Plus, Edit2, Trash2, Eye, EyeOff, Check } from 'lucide-react'

export default function HotelJobsPage() {
  const supabase = createClient()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)
  const [selectedTier, setSelectedTier] = useState('Silver')

  const emptyJob = {
    job_title: '', job_description: '', location: '', location_postcode: '',
    job_type: 'Full-time', contract_type: 'permanent', required_role_level: '',
    salary_min: '', salary_max: '', required_brands: [] as string[],
    required_qualifications: [] as string[], insurance_required: false,
  }
  const [form, setForm] = useState(emptyJob)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/login?role=employer'); return }
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      if (!prof) { router.push('/login?role=employer'); return }
      setProfile(prof)
      const { data } = await supabase.from('job_listings').select('*').eq('employer_id', prof.id).order('posted_date', { ascending: false })
      setJobs((data || []).map((j: any) => ({ ...j, title: j.job_title || j.title })))
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!profile || !form.job_title) return
    setSaving(true)
    await supabase.from('job_listings').insert({
      employer_id: profile.id,
      job_title: form.job_title,
      job_description: form.job_description,
      location: form.location,
      location_postcode: form.location_postcode || null,
      job_type: form.job_type,
      contract_type: form.contract_type,
      required_role_level: form.required_role_level || null,
      salary_min: form.salary_min ? parseInt(form.salary_min as string) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max as string) : null,
      required_brands: form.required_brands.length > 0 ? form.required_brands : null,
      required_qualifications: form.required_qualifications.length > 0 ? form.required_qualifications : null,
      insurance_required: form.insurance_required,
      is_live: true,
      tier: selectedTier,
    })
    const { data } = await supabase.from('job_listings').select('*').eq('employer_id', profile.id).order('posted_date', { ascending: false })
    setJobs((data || []).map((j: any) => ({ ...j, title: j.job_title || j.title })))
    setShowForm(false)
    setForm(emptyJob)
    setSaving(false)
  }

  const toggleLive = async (job: any) => {
    await supabase.from('job_listings').update({ is_live: !job.is_live }).eq('id', job.id)
    setJobs(jobs.map(j => j.id === job.id ? { ...j, is_live: !j.is_live } : j))
  }

  const deleteJob = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    await supabase.from('job_listings').delete().eq('id', id)
    setJobs(jobs.filter(j => j.id !== id))
  }

  const tierClass = (t: string) => t === 'Platinum' ? 'badge-platinum' : t === 'Gold' ? 'badge-gold' : t === 'Silver' ? 'badge-silver' : 'badge-bronze'

  if (loading) return <DashboardShell role="employer"><div className="skeleton h-64" /></DashboardShell>

  return (
    <DashboardShell role="employer" userName={profile?.property_name || profile?.company_name}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-[24px] font-medium text-ink">Job Listings</h1>
        <button type="button" onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2"><Plus size={14} />Post New Job</button>
      </div>

      {/* Job form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white border border-border rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 animate-fade-in-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-[18px] font-medium text-ink mb-6">Post a New Role</h2>
            <div className="space-y-4">
              <div><label className="eyebrow block mb-1.5">Job Title *</label><input type="text" value={form.job_title} onChange={e => setForm({ ...form, job_title: e.target.value })} className="input-field" placeholder="e.g. Senior Spa Therapist" /></div>
              <div><label className="eyebrow block mb-1.5">Description</label><textarea rows={4} value={form.job_description} onChange={e => setForm({ ...form, job_description: e.target.value })} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="eyebrow block mb-1.5">Location *</label><input type="text" value={form.location} onChange={e => setForm({ ...form, location: e.target.value })} className="input-field" /></div>
                <div><label className="eyebrow block mb-1.5">Postcode</label><input type="text" value={form.location_postcode} onChange={e => setForm({ ...form, location_postcode: e.target.value })} className="input-field" /></div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div><label className="eyebrow block mb-1.5">Role Level</label><select value={form.required_role_level} onChange={e => setForm({ ...form, required_role_level: e.target.value })} className="input-field"><option value="">Any</option>{ROLE_LEVELS.map(r => <option key={r} value={r}>{r}</option>)}</select></div>
                <div><label className="eyebrow block mb-1.5">Contract</label><select value={form.contract_type} onChange={e => setForm({ ...form, contract_type: e.target.value })} className="input-field">{CONTRACT_TYPES.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}</select></div>
                <div><label className="eyebrow block mb-1.5">Tier</label><select value={selectedTier} onChange={e => setSelectedTier(e.target.value)} className="input-field"><option>Bronze</option><option>Silver</option><option>Gold</option><option>Platinum</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="eyebrow block mb-1.5">Min Salary (£)</label><input type="number" value={form.salary_min} onChange={e => setForm({ ...form, salary_min: e.target.value })} className="input-field" /></div>
                <div><label className="eyebrow block mb-1.5">Max Salary (£)</label><input type="number" value={form.salary_max} onChange={e => setForm({ ...form, salary_max: e.target.value })} className="input-field" /></div>
              </div>
              <CollapsibleCheckboxSection title="Required Brands" flatItems={[...PRODUCT_HOUSES]} selected={form.required_brands} onChange={v => setForm({ ...form, required_brands: v })} />
              <CollapsibleCheckboxSection title="Required Qualifications" flatItems={[...QUALIFICATIONS]} selected={form.required_qualifications} onChange={v => setForm({ ...form, required_qualifications: v })} />
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="button" onClick={handleSave} disabled={saving || !form.job_title || !form.location} className="btn-primary flex-1 disabled:opacity-40">{saving ? 'Saving...' : 'Publish Role'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listings */}
      {jobs.length === 0 ? (
        <div className="dashboard-card text-center py-12">
          <p className="text-[14px] text-muted mb-3">No job listings yet.</p>
          <button type="button" onClick={() => setShowForm(true)} className="btn-primary">Post your first role</button>
        </div>
      ) : (
        <div className="space-y-2">
          {jobs.map(job => (
            <div key={job.id} className="dashboard-card flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2 mb-0.5">
                  <p className="text-[14px] font-medium text-ink">{job.title}</p>
                  {job.tier && <span className={tierClass(job.tier)}>{job.tier}</span>}
                </div>
                <p className="text-[12px] text-muted">{job.location} &middot; {(job.contract_type || job.job_type || '').replace('_', ' ')} {job.salary_min && job.salary_max ? `· £${(job.salary_min/1000).toFixed(0)}k–£${(job.salary_max/1000).toFixed(0)}k` : ''}</p>
              </div>
              <div className="flex items-center gap-2">
                <button type="button" onClick={() => toggleLive(job)} className="p-2 rounded-lg hover:bg-surface text-muted" title={job.is_live ? 'Pause' : 'Go live'}>{job.is_live ? <EyeOff size={16} /> : <Eye size={16} />}</button>
                <button type="button" onClick={() => deleteJob(job.id)} className="p-2 rounded-lg hover:bg-red-50 text-muted hover:text-red-500"><Trash2 size={16} /></button>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${job.is_live ? 'bg-emerald-50 text-emerald-700' : 'bg-neutral-100 text-muted'}`}>{job.is_live ? 'Live' : 'Paused'}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
