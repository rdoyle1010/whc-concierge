'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'
import { ROLE_LEVELS, TRAVEL_OPTIONS, AVAILABILITY_STATUSES } from '@/lib/constants'
import { SERVICES_CATEGORIES, PRODUCT_HOUSES_FULL as PRODUCT_HOUSES, QUALS_CATEGORIES, SYSTEMS_FULL } from '@/lib/taxonomy'
import { Save, Upload, FileText, X } from 'lucide-react'

// Merge systems into quals for talent display (keeps existing UI behaviour)
const QUALS_WITH_SYSTEMS = [
  ...QUALS_CATEGORIES,
  { name: 'Systems', items: SYSTEMS_FULL },
]

export default function TalentProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('candidate_profiles').select('*').eq('user_id', user.id).single()
      setProfile(data || {})
      setLoading(false)
    }
    load()
  }, [])

  const u = (field: string, value: any) => setProfile((p: any) => ({ ...p, [field]: value }))

  // ─── Completion score ───
  const completionItems = [
    { done: !!profile?.full_name, label: 'Full name' },
    { done: !!profile?.role_level, label: 'Role level' },
    { done: !!profile?.headline, label: 'Headline' },
    { done: !!profile?.bio, label: 'Bio' },
    { done: (profile?.services_offered?.length || 0) > 0, label: 'Services offered' },
    { done: (profile?.product_houses?.length || 0) > 0, label: 'Product houses' },
    { done: (profile?.qualifications?.length || 0) > 0, label: 'Qualifications' },
    { done: !!profile?.cv_url, label: 'CV uploaded' },
    { done: !!profile?.experience_years, label: 'Experience' },
    { done: !!profile?.postcode, label: 'Postcode' },
  ]
  const completionPct = profile ? Math.round(completionItems.filter(i => i.done).length / completionItems.length * 100) : 0

  // ─── Save ───
  const handleSave = async () => {
    if (!profile?.id) return
    setSaving(true); setMessage('')

    const systemsList = QUALS_WITH_SYSTEMS[2].items
    const allQuals = profile.qualifications || []
    const systems_experience = allQuals.filter((q: string) => systemsList.includes(q))
    const qualifications_only = allQuals.filter((q: string) => !systemsList.includes(q))

    const data: Record<string, any> = {
      full_name: profile.full_name,
      phone: profile.phone || null,
      postcode: profile.postcode || null,
      location: profile.postcode || null,
      has_car: profile.has_car || false,
      role_level: profile.role_level || null,
      headline: profile.headline || null,
      bio: profile.bio || null,
      experience_years: profile.experience_years ? parseInt(profile.experience_years) : null,
      day_rate_min: profile.day_rate_min ? parseInt(profile.day_rate_min) : null,
      day_rate_max: profile.day_rate_max ? parseInt(profile.day_rate_max) : null,
      availability_status: profile.availability_status || null,
      services_offered: (profile.services_offered?.length || 0) > 0 ? profile.services_offered : null,
      product_houses: (profile.product_houses?.length || 0) > 0 ? profile.product_houses : null,
      qualifications: qualifications_only.length > 0 ? qualifications_only : null,
      systems_experience: systems_experience.length > 0 ? systems_experience : null,
      travel_availability: profile.travel_availability || 'uk_only',
      travel_radius_miles: profile.travel_radius_miles ? parseInt(profile.travel_radius_miles) : null,
      has_insurance: profile.has_insurance || false,
      profile_completion_score: completionPct,
    }

    // Save via server API to bypass RLS
    const res = await fetch('/api/profile/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: profile.id, data }),
    })
    const result = await res.json()
    setSaving(false)
    setMessage(res.ok ? 'Profile saved successfully!' : (result.error || 'Save failed'))
    setTimeout(() => setMessage(''), 4000)
  }

  // ─── File uploads via server-side API (bypasses storage RLS) ───
  const userId = profile?.user_id || profile?.id

  const uploadViaApi = async (file: File, bucket: string, path: string, column?: string): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', bucket)
    formData.append('path', path)
    if (profile?.id && column) {
      formData.append('profileId', profile.id)
      formData.append('column', column)
    }
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { setMessage(`Upload failed: ${data.error}`); return null }
    return data.url
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !userId) return
    const ext = file.name.split('.').pop() || 'jpg'
    // Use site-images (public) so photos are accessible
    const url = await uploadViaApi(file, 'site-images', `profiles/${userId}/photo.${ext}`, 'profile_image_url')
    if (url) { u('profile_image_url', url); setMessage('Photo updated!'); setTimeout(() => setMessage(''), 3000) }
  }

  const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !userId) return
    const ext = file.name.split('.').pop() || 'pdf'
    const url = await uploadViaApi(file, 'talent-documents', `${userId}/cv.${ext}`, 'cv_url')
    if (url) { u('cv_url', url); setMessage('CV uploaded!'); setTimeout(() => setMessage(''), 3000) }
  }

  const handleInsuranceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file || !userId) return
    const ext = file.name.split('.').pop() || 'pdf'
    const url = await uploadViaApi(file, 'talent-documents', `${userId}/insurance.${ext}`, 'insurance_document_url')
    if (url) { u('insurance_document_url', url); setMessage('Insurance uploaded!'); setTimeout(() => setMessage(''), 3000) }
  }

  const handleCertsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files; if (!files || !userId) return
    const urls: string[] = [...(profile.certificates_urls || [])]
    for (const file of Array.from(files)) {
      const url = await uploadViaApi(file, 'talent-documents', `${userId}/cert_${Date.now()}_${file.name}`)
      if (url) urls.push(url)
    }
    // Update via server API to bypass RLS
    await fetch('/api/profile/update', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: profile.id, data: { certificates_urls: urls } }) })
    u('certificates_urls', urls); setMessage('Certificates uploaded!')
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-6 h-6 border-2 border-ink border-t-transparent rounded-full" /></div></DashboardShell>
  if (!profile?.id) return <DashboardShell role="talent"><p className="text-muted">Profile not found. Please complete registration first.</p></DashboardShell>

  return (
    <DashboardShell role="talent" userName={profile.full_name}>
      <div className="max-w-2xl">
        {/* Header + save */}
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-[24px] font-medium text-ink">Edit Profile</h1>
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary flex items-center gap-2 disabled:opacity-50">
            <Save size={14} />{saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        {/* Completion bar */}
        <div className="flex items-center gap-3 mb-8">
          <div className="flex-1 h-1.5 bg-surface rounded-full overflow-hidden"><div className="h-full bg-ink rounded-full transition-all" style={{ width: `${completionPct}%` }} /></div>
          <span className="text-[13px] font-medium text-ink">{completionPct}%</span>
        </div>

        {message && <div className={`text-[13px] px-4 py-3 rounded-lg mb-6 ${message.includes('success') || message.includes('updated') || message.includes('uploaded') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{message}</div>}

        <div className="space-y-6">

          {/* ── S1: Personal Details ── */}
          <div className="dashboard-card space-y-4">
            <p className="eyebrow">Personal Details</p>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-surface border border-border rounded-full flex items-center justify-center overflow-hidden shrink-0">
                {profile.profile_image_url ? <img src={profile.profile_image_url} alt="" className="w-full h-full object-cover" /> : <span className="text-[20px] font-semibold text-muted">{profile.full_name?.[0]}</span>}
              </div>
              <label className="btn-secondary cursor-pointer flex items-center gap-2 text-[12px]"><Upload size={13} />Upload Photo<input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" /></label>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="eyebrow block mb-1.5">Full Name</label><input type="text" value={profile.full_name||''} onChange={e=>u('full_name',e.target.value)} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Phone</label><input type="tel" value={profile.phone||''} onChange={e=>u('phone',e.target.value)} className="input-field" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="eyebrow block mb-1.5">Postcode</label><input type="text" value={profile.postcode||''} onChange={e=>u('postcode',e.target.value)} className="input-field" /></div>
              <div className="flex items-end pb-1"><label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={profile.has_car||false} onChange={e=>u('has_car',e.target.checked)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[13px] text-secondary">I have access to a car</span></label></div>
            </div>
          </div>

          {/* ── S2: Professional Details ── */}
          <div className="dashboard-card space-y-4">
            <p className="eyebrow">Professional Details</p>
            <div>
              <label className="eyebrow block mb-1.5">Role Level</label>
              <select value={profile.role_level||''} onChange={e=>u('role_level',e.target.value)} className="input-field"><option value="">Select</option>{ROLE_LEVELS.map(r=><option key={r} value={r}>{r}</option>)}</select>
            </div>
            <div><label className="eyebrow block mb-1.5">Headline</label><input type="text" value={profile.headline||''} onChange={e=>u('headline',e.target.value)} className="input-field" placeholder="e.g. Senior Spa Therapist | CIDESCO Qualified | 8 Years Experience" /></div>
            <div><label className="eyebrow block mb-1.5">Bio</label><textarea rows={4} value={profile.bio||''} onChange={e=>u('bio',e.target.value)} className="input-field" /></div>
            <div className="grid grid-cols-3 gap-4">
              <div><label className="eyebrow block mb-1.5">Experience (years)</label><input type="number" value={profile.experience_years||''} onChange={e=>u('experience_years',e.target.value)} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Day Rate Min (£)</label><input type="number" value={profile.day_rate_min||''} onChange={e=>u('day_rate_min',e.target.value)} className="input-field" /></div>
              <div><label className="eyebrow block mb-1.5">Day Rate Max (£)</label><input type="number" value={profile.day_rate_max||''} onChange={e=>u('day_rate_max',e.target.value)} className="input-field" /></div>
            </div>
            <div><label className="eyebrow block mb-1.5">Availability</label><select value={profile.availability_status||''} onChange={e=>u('availability_status',e.target.value)} className="input-field">{AVAILABILITY_STATUSES.map(a=><option key={a.value} value={a.value}>{a.label}</option>)}</select></div>
          </div>

          {/* ── S3: Services Offered ── */}
          <CollapsibleCheckboxSection title="Services Offered" categories={SERVICES_CATEGORIES} selected={profile.services_offered||[]} onChange={v=>u('services_offered',v)} />

          {/* ── S4: Product Houses ── */}
          <CollapsibleCheckboxSection title="Product Houses" flatItems={PRODUCT_HOUSES} selected={profile.product_houses||[]} onChange={v=>u('product_houses',v)} />

          {/* ── S5: Qualifications & Certifications ── */}
          <CollapsibleCheckboxSection title="Qualifications & Certifications" categories={QUALS_WITH_SYSTEMS} selected={[...(profile.qualifications||[]),...(profile.systems_experience||[])]} onChange={v=>u('qualifications',v)} />

          {/* ── S6: Documents ── */}
          <div className="dashboard-card space-y-4">
            <p className="eyebrow">Documents</p>

            <div>
              <label className="eyebrow block mb-1.5">CV (PDF or Word)</label>
              {profile.cv_url ? (
                <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-border">
                  <FileText size={14} className="text-muted" />
                  <a href={profile.cv_url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink hover:underline flex-1 truncate">Current CV</a>
                  <label className="text-[11px] text-muted hover:text-ink cursor-pointer">Replace<input type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" /></label>
                </div>
              ) : (
                <label className="flex items-center justify-center border border-dashed border-border py-5 cursor-pointer hover:border-ink/30 transition-colors rounded-lg">
                  <div className="text-center"><Upload size={16} className="mx-auto text-muted mb-1" /><p className="text-[12px] text-muted">Click to upload CV</p></div>
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleCvUpload} className="hidden" />
                </label>
              )}
            </div>

            <div>
              <label className="eyebrow block mb-1.5">Certificates (PDFs)</label>
              {(profile.certificates_urls?.length || 0) > 0 && (
                <div className="space-y-1.5 mb-2">
                  {profile.certificates_urls.map((url: string, i: number) => (
                    <div key={i} className="flex items-center gap-2 p-2 bg-surface rounded border border-border">
                      <FileText size={12} className="text-muted" />
                      <a href={url} target="_blank" rel="noopener noreferrer" className="text-[12px] text-ink hover:underline flex-1 truncate">Certificate {i+1}</a>
                    </div>
                  ))}
                </div>
              )}
              <label className="flex items-center justify-center border border-dashed border-border py-4 cursor-pointer hover:border-ink/30 transition-colors rounded-lg">
                <p className="text-[12px] text-muted">Add certificates</p>
                <input type="file" accept=".pdf" multiple onChange={handleCertsUpload} className="hidden" />
              </label>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer mb-2"><input type="checkbox" checked={profile.has_insurance||false} onChange={e=>u('has_insurance',e.target.checked)} className="w-3.5 h-3.5 border-border rounded text-ink" /><span className="text-[13px] text-secondary">I have professional insurance</span></label>
              {profile.has_insurance && (
                profile.insurance_document_url ? (
                  <div className="flex items-center gap-2 p-3 bg-surface rounded-lg border border-border">
                    <FileText size={14} className="text-muted" />
                    <a href={profile.insurance_document_url} target="_blank" rel="noopener noreferrer" className="text-[13px] text-ink hover:underline flex-1 truncate">Insurance certificate</a>
                    <label className="text-[11px] text-muted hover:text-ink cursor-pointer">Replace<input type="file" accept=".pdf" onChange={handleInsuranceUpload} className="hidden" /></label>
                  </div>
                ) : (
                  <label className="flex items-center justify-center border border-dashed border-border py-4 cursor-pointer hover:border-ink/30 transition-colors rounded-lg">
                    <p className="text-[12px] text-muted">Upload insurance certificate</p>
                    <input type="file" accept=".pdf" onChange={handleInsuranceUpload} className="hidden" />
                  </label>
                )
              )}
            </div>
          </div>

          {/* ── S7: Travel Preferences ── */}
          <div className="dashboard-card space-y-4">
            <p className="eyebrow">Travel Preferences</p>
            <div>
              <label className="eyebrow block mb-2">Travel Availability</label>
              <div className="flex flex-wrap gap-2">
                {TRAVEL_OPTIONS.map(t => (
                  <button type="button" key={t.value} onClick={()=>u('travel_availability',t.value)}
                    className={`px-4 py-2 rounded-lg text-[12px] font-medium transition-colors ${profile.travel_availability===t.value?'bg-ink text-white':'bg-surface text-muted border border-border'}`}>{t.label}</button>
                ))}
              </div>
            </div>
            {profile.travel_availability === 'radius' && (
              <div className="grid grid-cols-2 gap-4">
                <div><label className="eyebrow block mb-1.5">Miles</label><input type="number" value={profile.travel_radius_miles||''} onChange={e=>u('travel_radius_miles',e.target.value)} className="input-field" placeholder="25" /></div>
                <div><label className="eyebrow block mb-1.5">From Postcode</label><input type="text" value={profile.postcode||''} onChange={e=>u('postcode',e.target.value)} className="input-field" /></div>
              </div>
            )}
          </div>

          {/* Bottom save */}
          <button type="button" onClick={handleSave} disabled={saving} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50">
            <Save size={14} />{saving ? 'Saving...' : 'Save All Changes'}
          </button>
        </div>
      </div>
    </DashboardShell>
  )
}
