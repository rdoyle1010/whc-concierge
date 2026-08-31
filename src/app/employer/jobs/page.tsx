'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Plus, Edit2, Trash2, Eye, EyeOff, Copy, RotateCcw, CheckCircle2, Upload, Image as ImageIcon, X } from 'lucide-react'
import ResidencySuggestions from '@/components/ResidencySuggestions'

export default function EmployerJobsPage() {
  const router = useRouter()
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [jobs, setJobs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [uploadingImage, setUploadingImage] = useState(false)

  const emptyJob = {
    title: '', description: '', job_image_url: '', location: '', job_type: 'Full-time',
    specialism: '', salary_min: '', salary_max: '', tier: 'Bronze',
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
        const { data } = await supabase.from('job_listings').select('*').eq('employer_id', prof.id).order('posted_date', { ascending: false })
        setJobs((data || []).map((j: any) => ({ ...j, title: j.job_title || j.title, description: j.job_description || j.description })))
      }
      setLoading(false)
    }
    load()
  }, [])

  async function uploadJobImage(file: File) {
    if (!profile?.id) return
    setUploadingImage(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'site-images')
      const safe = (form.title || 'job').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      fd.append('path', `jobs/${profile.id}/${safe}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '-')}`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(body.error || 'Image upload failed')
      setForm(current => ({ ...current, job_image_url: body.url }))
    } catch (error: any) {
      alert(error?.message || 'Could not upload image.')
    } finally {
      setUploadingImage(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return
    setSaving(true)

    const wasLive = !!editing?.is_live
    const wantsActive = form.status === 'active'
    const payload = {
      employer_id: profile.id,
      job_title: form.title,
      job_description: form.description,
      job_image_url: form.job_image_url || null,
      location: form.location,
      job_type: form.job_type,
      salary_min: form.salary_min ? parseInt(form.salary_min as string) : null,
      salary_max: form.salary_max ? parseInt(form.salary_max as string) : null,
      benefits: form.benefits ? (form.benefits as string).split('\n').filter(Boolean) : null,
      requirements: form.requirements ? (form.requirements as string).split('\n').filter(Boolean) : null,
      status: wantsActive && !wasLive ? 'draft' : form.status,
      is_live: wantsActive && wasLive,
    }
    if (wantsActive && !wasLive) {
      alert('Saved as a draft. To take a role live, use Post a Role and complete payment - your details carry over.')
    }

    if (editing) {
      const { error: saveError } = await supabase.from('job_listings').update(payload).eq('id', editing.id)
      if (saveError) { alert('Could not save role: ' + saveError.message); setSaving(false); return }
    } else {
      const { error: saveError } = await supabase.from('job_listings').insert(payload)
      if (saveError) { alert('Could not save role: ' + saveError.message); setSaving(false); return }
    }

    const { data } = await supabase.from('job_listings').select('*').eq('employer_id', profile.id).order('posted_date', { ascending: false })
    setJobs((data || []).map((j: any) => ({ ...j, title: j.job_title || j.title, description: j.job_description || j.description })))
    setShowForm(false)
    setEditing(null)
    setForm(emptyJob)
    setSaving(false)
  }

  const handleEdit = (job: any) => {
    setForm({
      title: job.title, description: job.description, job_image_url: job.job_image_url || '', location: job.location,
      job_type: job.job_type, specialism: job.specialism || '', tier: job.tier || 'Bronze',
      salary_min: job.salary_min?.toString() || '', salary_max: job.salary_max?.toString() || '',
      benefits: job.benefits?.join('\n') || '', requirements: job.requirements?.join('\n') || '',
      status: job.status,
    })
    setEditing(job)
    setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this listing?')) return
    const { data, error } = await supabase.from('job_listings').delete().eq('id', id).select('id')
    if (error || !data?.length) {
      alert('Could not delete listing' + (error ? ': ' + error.message : '. Please try again.'))
      return
    }
    setJobs(jobs.filter(j => j.id !== id))
  }

  const toggleStatus = async (job: any) => {
    const isCurrentlyActive = job.status === 'active'
    const newIsLive = !isCurrentlyActive
    if (newIsLive) {
      if (profile?.approval_status !== 'approved') {
        alert('Your employer account is awaiting WHC approval. Roles go live the moment your account is approved.')
        return
      }
      const paidUntil = job.expires_at ? new Date(job.expires_at).getTime() : 0
      if (!paidUntil || paidUntil <= Date.now()) {
        alert('This listing’s paid term has ended. Use Repost to relist it - your details carry over and payment is taken at checkout.')
        router.push(`/employer/post-role?repost=${job.id}`)
        return
      }
    }
    const newStatus = newIsLive ? 'active' : 'closed'
    if (!newIsLive) {
      // Taking a role down must go through the API so open applications are
      // closed and every applicant is told - a silent client-side write left
      // candidates holding live-looking applications against a dead role.
      if (!confirm(`Take ${job.title} down? Applicants with open applications will be notified that the role has closed.`)) return
      const res = await fetch('/api/employer/jobs/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: job.id, action: 'closed' }) })
      const result = await res.json().catch(() => ({}))
      if (!res.ok) { alert(result.error || 'Could not update listing status. Please try again.'); return }
      setJobs(jobs.map(j => j.id === job.id ? { ...j, status: 'closed', is_live: false } : j))
      return
    }
    const { data: updated, error } = await supabase.from('job_listings').update({ is_live: newIsLive, status: newStatus }).eq('id', job.id).select('id')
    if (error || !updated?.length) {
      alert('Could not update listing status' + (error ? ': ' + error.message : '') + '. Please try again.')
      return
    }
    setJobs(jobs.map(j => j.id === job.id ? { ...j, status: newStatus, is_live: newIsLive } : j))
  }

  const markFilled = async (job: any) => {
    if (!confirm(`Mark ${job.title} as filled? The role will be taken down and every applicant will be emailed.`)) return
    const res = await fetch('/api/employer/jobs/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jobId: job.id, action: 'filled' }) })
    const result = await res.json().catch(() => ({}))
    if (!res.ok) { alert(result.error || 'Could not mark this role as filled.'); return }
    setJobs(jobs.map(j => j.id === job.id ? { ...j, status: 'filled', is_live: false } : j))
    alert(`Role marked as filled. ${result.notified || 0} applicant${result.notified === 1 ? '' : 's'} notified.`)
  }

  const activeCount = jobs.filter(job => job.status === 'active').length
  const draftCount = jobs.filter(job => job.status === 'draft').length
  const filledCount = jobs.filter(job => job.status === 'filled').length

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <div className="mb-8 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
        <div><p className="dashboard-eyebrow">Recruitment inventory</p><h1 className="dashboard-title">Job listings</h1><p className="dashboard-intro">Create, edit and close permanent roles. Each role can now have its own image.</p></div>
        <button onClick={() => router.push('/employer/post-role')} className="btn-primary inline-flex items-center justify-center gap-2 self-start md:self-auto"><Plus size={15} /><span>Post a new role</span></button>
      </div>

      {!loading && jobs.length > 0 && <div className="dashboard-metrics mb-8"><div className="dashboard-metric"><p className="dashboard-metric-value">{activeCount}</p><p className="dashboard-metric-label">Live roles</p></div><div className="dashboard-metric"><p className="dashboard-metric-value">{draftCount}</p><p className="dashboard-metric-label">Drafts</p></div><div className="dashboard-metric"><p className="dashboard-metric-value">{filledCount}</p><p className="dashboard-metric-label">Filled</p></div><div className="dashboard-metric"><p className="dashboard-metric-value">{jobs.length}</p><p className="dashboard-metric-label">Total listings</p></div></div>}

      {showForm && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071c2d]/55 p-4" onClick={() => setShowForm(false)}><div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-border bg-[#ffffff] p-6 md:p-8" onClick={(e) => e.stopPropagation()}>
        <p className="dashboard-eyebrow">Listing editor</p><h2 className="dashboard-section-title mb-2">{editing ? 'Edit role' : 'Create role draft'}</h2><p className="mb-6 text-[12px] leading-5 text-muted">You can change the role image here at any time. It updates the live Browse Roles card once saved.</p>
        <div className="space-y-4">
          <div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Job title *</label><input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" placeholder="e.g. Senior Spa Therapist" /></div>
          <div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Job image</label><div className="grid sm:grid-cols-[180px_1fr] gap-4 items-center rounded-xl border border-border bg-white p-4">{form.job_image_url ? <div className="aspect-[16/10] overflow-hidden rounded-lg"><img src={form.job_image_url} alt="Job preview" className="h-full w-full object-cover" /></div> : <div className="aspect-[16/10] rounded-lg border border-dashed border-border flex items-center justify-center text-muted"><ImageIcon size={26}/></div>}<div className="flex flex-wrap gap-2"><label className="btn-secondary inline-flex items-center gap-2 cursor-pointer"><Upload size={13}/>{uploadingImage?'Uploading...':form.job_image_url?'Replace image':'Upload image'}<input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={uploadingImage} onChange={e=>{const file=e.target.files?.[0];if(file)uploadJobImage(file);e.target.value=''}}/></label>{form.job_image_url && <button type="button" onClick={()=>setForm(current=>({...current,job_image_url:''}))} className="btn-secondary inline-flex items-center gap-2"><X size={13}/>Remove</button>}</div></div></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2"><div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Location *</label><input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input-field" /></div><div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Job type</label><select value={form.job_type} onChange={(e) => setForm({ ...form, job_type: e.target.value })} className="input-field"><option>Full-time</option><option>Part-time</option><option>Contract</option><option>Temporary</option><option>Freelance</option></select></div></div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3"><div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Min salary (£)</label><input type="number" value={form.salary_min} onChange={(e) => setForm({ ...form, salary_min: e.target.value })} className="input-field" /></div><div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Max salary (£)</label><input type="number" value={form.salary_max} onChange={(e) => setForm({ ...form, salary_max: e.target.value })} className="input-field" /></div><div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Tier</label><div className="input-field bg-gray-50 text-gray-500">{form.tier || 'Bronze'}</div><p className="mt-1 text-[10px] text-muted">Set when the listing is purchased.</p></div></div>
          <div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Specialism</label><input type="text" value={form.specialism} onChange={(e) => setForm({ ...form, specialism: e.target.value })} className="input-field" placeholder="e.g. Massage Therapy" /></div>
          <div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Description *</label><textarea rows={5} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" /></div>
          <div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Requirements <span className="font-normal text-muted">- one per line</span></label><textarea rows={3} value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} className="input-field" /></div>
          <div><label className="mb-1.5 block text-[12px] font-semibold text-secondary">Benefits <span className="font-normal text-muted">- one per line</span></label><textarea rows={3} value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} className="input-field" /></div>
          <div className="flex flex-col-reverse gap-3 border-t border-border pt-5 sm:flex-row sm:justify-end"><button onClick={() => setShowForm(false)} className="btn-secondary sm:min-w-28">Cancel</button><button onClick={handleSave} disabled={saving||uploadingImage} className="btn-primary disabled:opacity-50 sm:min-w-36">{saving ? 'Saving...' : editing ? 'Save changes' : 'Save draft'}</button></div>
        </div>
      </div></div>}

      {loading ? <div className="flex h-64 items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-gold border-t-transparent" /></div> : jobs.length === 0 ? <div className="dashboard-panel py-16 text-center"><p className="dashboard-eyebrow">No listings yet</p><h2 className="dashboard-section-title">Start with your first permanent role</h2><p className="mx-auto mt-2 max-w-lg text-[13px] leading-6 text-muted">Your full job description, property details and requirements will appear to suitable talent once the listing is live.</p><button onClick={() => router.push('/employer/post-role')} className="btn-primary mt-5 inline-flex items-center gap-2"><Plus size={14} />Post a role</button></div> : <div className="border-y border-[#cccccc] bg-white/45">{jobs.map((job, index) => <div key={job.id} className={`grid gap-5 px-4 py-5 md:px-5 xl:grid-cols-[96px_minmax(0,1fr)_auto] xl:items-center ${index > 0 ? 'border-t border-[#e0e0e0]' : ''}`}>
        <div className="hidden xl:block h-20 w-24 overflow-hidden rounded-lg border border-border bg-white">{job.job_image_url ? <img src={job.job_image_url} alt="" className="h-full w-full object-cover"/> : <div className="h-full w-full flex items-center justify-center text-muted"><ImageIcon size={20}/></div>}</div>
        <div className="min-w-0"><div className="mb-2 flex flex-wrap items-center gap-2.5"><h3 className="text-[22px] text-ink">{job.title}</h3><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[.1em] ${job.status === 'active' ? 'bg-green-50 text-green-700' : job.status === 'draft' ? 'bg-amber-50 text-amber-700' : job.status === 'filled' ? 'bg-[#edf4ef] text-[#42634b]' : 'bg-gray-100 text-gray-500'}`}>{job.status}</span>{job.tier && <span className={job.tier === 'Platinum' ? 'badge-platinum' : job.tier === 'Gold' ? 'badge-gold' : 'badge-silver'}>{job.tier}</span>}</div><p className="text-[12px] font-medium text-secondary">{job.location} · {job.job_type}</p>{job.description && <p className="mt-2 max-w-3xl text-[13px] leading-6 text-secondary line-clamp-2">{job.description}</p>}{job.expires_at && <p className="mt-2 text-[11px] text-muted">Paid listing term: {new Date(job.expires_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}{job.is_residency_role && job.status === 'active' && <ResidencySuggestions jobId={job.id} />}</div>
        <div className="flex flex-wrap items-center gap-2 xl:justify-end">{job.status === 'active' && <button onClick={() => markFilled(job)} className="btn-secondary !px-3 !py-2 inline-flex items-center gap-1.5 text-emerald-700"><CheckCircle2 size={15} />Mark filled</button>}{job.status !== 'draft' && job.status !== 'filled' && <button onClick={() => toggleStatus(job)} className="btn-secondary !px-3 !py-2 inline-flex items-center gap-1.5">{job.status === 'active' ? <><EyeOff size={15} />Take down</> : <><Eye size={15} />Activate</>}</button>}<button onClick={() => handleEdit(job)} className="btn-secondary !px-3 !py-2 inline-flex items-center gap-1.5"><Edit2 size={15} />Edit</button><button onClick={() => router.push(`/employer/post-role?clone=${job.id}`)} className="inline-flex h-9 w-9 items-center justify-center border border-border text-muted hover:bg-[#f7f7f7] hover:text-ink" title="Clone"><Copy size={15} /></button>{(job.status === 'closed' || job.status === 'expired') && <button onClick={() => router.push(`/employer/post-role?repost=${job.id}`)} className="inline-flex h-9 w-9 items-center justify-center border border-border text-muted hover:bg-[#f7f7f7] hover:text-ink" title="Repost"><RotateCcw size={15} /></button>}<button onClick={() => handleDelete(job.id)} className="inline-flex h-9 w-9 items-center justify-center border border-border text-muted hover:border-red-200 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={15} /></button></div>
      </div>)}</div>}
    </DashboardShell>
  )
}
