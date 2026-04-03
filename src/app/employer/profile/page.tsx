'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save, Upload } from 'lucide-react'

export default function EmployerProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const update = (field: string, value: any) => setProfile({ ...profile, [field]: value })

  const handleSave = async () => {
    setSaving(true)
    const { error } = await supabase
      .from('employer_profiles')
      .update({
        company_name: profile.company_name,
        contact_name: profile.contact_name,
        phone: profile.phone,
        website: profile.website,
        location: profile.location,
        property_type: profile.property_type,
        description: profile.description,
      })
      .eq('id', profile.id)

    setSaving(false)
    setMessage(error ? error.message : 'Profile saved successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const path = `logos/${profile.id}.${ext}`
    const { error: uploadError } = await supabase.storage.from('uploads').upload(path, file, { upsert: true })
    if (uploadError) { setMessage(uploadError.message); return }
    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path)
    await supabase.from('employer_profiles').update({ logo_url: publicUrl }).eq('id', profile.id)
    update('logo_url', publicUrl)
    setMessage('Logo updated!')
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) return <DashboardShell role="employer"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div></DashboardShell>
  if (!profile) return <DashboardShell role="employer"><p>Profile not found.</p></DashboardShell>

  return (
    <DashboardShell role="employer" userName={profile.company_name}>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-serif font-bold text-ink">Company Profile</h1>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
            <Save size={16} /><span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {message && <div className={`px-4 py-3 rounded-lg mb-6 text-sm ${message.includes('success') || message.includes('updated') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{message}</div>}

        {/* Logo */}
        <div className="dashboard-card mb-6">
          <h3 className="font-serif text-lg font-semibold mb-4">Company Logo</h3>
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-xl bg-gray-100 flex items-center justify-center overflow-hidden">
              {profile.logo_url ? (
                <img src={profile.logo_url} alt="Logo" className="w-full h-full object-cover" />
              ) : (
                <span className="text-2xl font-serif font-bold text-gray-300">{profile.company_name?.[0]}</span>
              )}
            </div>
            <label className="btn-secondary cursor-pointer flex items-center space-x-2 text-sm">
              <Upload size={16} /><span>Upload Logo</span>
              <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
            </label>
          </div>
        </div>

        <div className="dashboard-card mb-6 space-y-5">
          <h3 className="font-serif text-lg font-semibold">Company Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
              <input type="text" value={profile.company_name || ''} onChange={(e) => update('company_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Name</label>
              <input type="text" value={profile.contact_name || ''} onChange={(e) => update('contact_name', e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={profile.phone || ''} onChange={(e) => update('phone', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              <input type="url" value={profile.website || ''} onChange={(e) => update('website', e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input type="text" value={profile.location || ''} onChange={(e) => update('location', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Type</label>
              <input type="text" value={profile.property_type || ''} onChange={(e) => update('property_type', e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">About Your Property</label>
            <textarea rows={5} value={profile.description || ''} onChange={(e) => update('description', e.target.value)} className="input-field" />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
