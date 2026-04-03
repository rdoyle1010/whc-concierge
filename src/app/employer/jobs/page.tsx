'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react'

export default function EmployerJobsPage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const emptyJob = {
    title: '', description: '', location: '', job_type: 'Full-time',
    specialism: '', salary_min: '', salary_max: '', tier: 'Silver',
    benefits: '', requirements: '', status: 'active',
  }
  const [form, setForm] = useState(emptyJob)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)
      if (prof) {
        const { data } = await supabase.from('job_listings').select('*').eq('employer_id', prof.id).order('created_at', { ascending: false })
        setJobs(data || [])
      }
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)

    const payload = {
      employer_id: profile.id,
      title: form.title,
      description: form.description,
      location: form.location,
      job_type: form.job_type,
      specialism: form.specialism || null,
      salary_min: form.salary_min ? parseInt(form.salary_min as string) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max as string) : null,
      tier: form.tier,
      benefits: form.benefits ? (form.benefits as string).split('\n').filter(Boolean) : null,
      requirements: form.requirements ? (form.requirements as string).split('\n').filter(Boolean) : null,
      status: form.status,
    }

    if (editing) {
      await supabase.from('job_listings').update(payload).eq('id', editing.id)
    } else {
      await supabase.from('job_listings').insert(payload)
    }

    // Reload
    const { data } = await supabase.from('job_listings').select('*').eq('employer_id', profile.id).order('created_at', { ascending: false })
    setJobs(data || [])
    setShowForm(false)
    setEditing(null)
    setForm(emptyJob)
    setSaving(false)
  }

  const handleEdit = (job: any) => {
    setForm({
      title: job.title, description: job.description, location: job.location,
      job_type: job.job_type, specialism: job.specialism || '', tier: job.tier || 'Silver',
      salary_min: job.salary_min?.toString() || '', salary_max: job.salary_max?.toString() || '',
      benefits: job.benefits?.join('\n') || '', requirements: job.requirements?.join('\n') || '',
      status: job.status,
    })
    setEditing(job)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    await supabase.from('job_listings').delete().eq('id', id)
    setJobs(jobs.filter(j => j.id !== id))
  }

  const toggleStatus = async (job: any) => {
    const newStatus = job.status === 'active' ? 'closed' : 'active'
    await supabase.from('job_listings').update({ status: newStatus }).eq('id', job.id)
    setJobs(jobs.map(j => j.id === job.id ? { ...j, status: newStatus } : j))
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Job Listings</h1>
        <button onClick={() => { setForm(emptyJob); setEditing(null); setShowForm(true) }}
          className="btn-primary flex items-center space-x-2">
          <Plus size={16} /><span>Post New Role</span>
        </button>
      </div>

      {/* Job Form Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl font-bold mb-6">{editing ? 'Edit Role' : 'Post New Role'}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Title *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. Senior Spa Therapist" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Location *</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Job Type</label>
                  <select value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })} className="input-field">
                    <option>Full-time</option><option>Part-time</option><option>Contract</option><option>Temporary</option><option>Freelance</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Min Salary (£)</label>
                  <input type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Max Salary (£)</label>
                  <input type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} className="input-field" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tier</label>
                  <select value={form.tier} onChange={(e) => setForm({ ...form, tier: e.target.value })} className="input-field">
                    <option>Silver</option><option>Gold</option><option>Platinum</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Specialism</label>
                <input type="text" value={form.specialism} onChange={(e) => setForm({ ...form, specialism: e.target.value })} className="input-field" placeholder="e.g. Massage Therapy" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Description *</label>
                <textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Requirements (one per line)</label>
                <textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className="input-field" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Benefits (one per line)</label>
                <textarea rows={3} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className="input-field" />
              </div>
              <div className="flex gap-4 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">
                  {saving ? 'Saving...' : editing ? 'Update Role' : 'Publish Role'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : jobs.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <p>No job listings yet. Post your first role to start attracting talent.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="dashboard-card flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="font-serif text-lg font-semibold text-ink">{job.title}</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    job.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'
                  }`}>{job.status}</span>
                  {job.tier && <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    job.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                    job.tier === 'Gold' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>{job.tier}</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{job.location} &middot; {job.job_type}</p>
              </div>
              <div className="flex items-center space-x-2">
                <button onClick={() => toggleStatus(job)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400" title={job.status === 'active' ? 'Close' : 'Activate'}>
                  {job.status === 'active' ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
                <button onClick={() => handleEdit(job)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(job.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
