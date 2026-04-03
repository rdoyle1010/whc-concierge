'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save, Upload } from 'lucide-react'

const allSpecialisms = [
  'Massage Therapy', 'Beauty Therapy', 'Spa Management', 'Wellness Coaching',
  'Physiotherapy', 'Yoga & Pilates', 'Nutritional Therapy', 'Aesthetic Treatments',
  'Nail Technology', 'Hair Styling', 'Holistic Therapy', 'Fitness Training',
  'Ayurveda', 'Acupuncture', 'Reflexology', 'Aromatherapy'
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
      setProfile(data)
      setLoading(false)
    }
    load()
  }, [])

  const update = (field: string, value: any) => setProfile({ ...profile, [field]: value })

  const toggleSpecialism = (s: string) => {
    const current = profile.specialisms || []
    update('specialisms', current.includes(s) ? current.filter((x: string) => x !== s) : [...current, s])
  }

  const handleSave = async () => {
    setSaving(true)
    setMessage('')
    // Build update payload with only fields that have values
    const updateData: Record<string, any> = {
      full_name: profile.full_name,
      phone: profile.phone,
      location: profile.location,
      headline: profile.headline,
      bio: profile.bio,
    }

    // Add extended fields — these may or may not exist in the table
    if (profile.specialisms) updateData.specialisms = profile.specialisms
    if (profile.experience_years) updateData.experience_years = parseInt(profile.experience_years)

    const { error } = await supabase
      .from('candidate_profiles')
      .update(updateData)
      .eq('id', profile.id)

    setSaving(false)
    setMessage(error ? error.message : 'Profile saved successfully!')
    setTimeout(() => setMessage(''), 3000)
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const ext = file.name.split('.').pop()
    const path = `profile-images/${profile.id}.${ext}`

    const { error: uploadError } = await supabase.storage
      .from('uploads')
      .upload(path, file, { upsert: true })

    if (uploadError) { setMessage(uploadError.message); return }

    const { data: { publicUrl } } = supabase.storage.from('uploads').getPublicUrl(path)

    await supabase.from('candidate_profiles').update({ profile_image_url: publicUrl }).eq('id', profile.id)
    update('profile_image_url', publicUrl)
    setMessage('Photo updated!')
    setTimeout(() => setMessage(''), 3000)
  }

  if (loading) {
    return <DashboardShell role="talent"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div></DashboardShell>
  }

  if (!profile) {
    return <DashboardShell role="talent"><p className="text-gray-500">Profile not found.</p></DashboardShell>
  }

  return (
    <DashboardShell role="talent" userName={profile.full_name}>
      <div className="max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-serif font-bold text-ink">My Profile</h1>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
            <Save size={16} />
            <span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {message && (
          <div className={`px-4 py-3 rounded-lg mb-6 text-sm ${message.includes('success') || message.includes('updated') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {message}
          </div>
        )}

        {/* Profile Photo */}
        <div className="dashboard-card mb-6">
          <h3 className="font-serif text-lg font-semibold mb-4">Profile Photo</h3>
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden">
              {profile.profile_image_url ? (
                <img src={profile.profile_image_url} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-3xl font-serif font-bold text-gray-300">{profile.full_name?.[0]}</span>
              )}
            </div>
            <label className="btn-secondary cursor-pointer flex items-center space-x-2 text-sm">
              <Upload size={16} />
              <span>Upload Photo</span>
              <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
            </label>
          </div>
        </div>

        {/* Basic Info */}
        <div className="dashboard-card mb-6 space-y-5">
          <h3 className="font-serif text-lg font-semibold">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
              <input type="text" value={profile.full_name || ''} onChange={(e) => update('full_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input type="email" value={profile.email || ''} disabled className="input-field bg-gray-50" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={profile.phone || ''} onChange={(e) => update('phone', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input type="text" value={profile.location || ''} onChange={(e) => update('location', e.target.value)} className="input-field" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Headline</label>
            <input type="text" value={profile.headline || ''} onChange={(e) => update('headline', e.target.value)} className="input-field" placeholder="e.g. Senior Spa Therapist | CIDESCO Qualified" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea rows={4} value={profile.bio || ''} onChange={(e) => update('bio', e.target.value)} className="input-field" />
          </div>
        </div>

        {/* Specialisms */}
        <div className="dashboard-card mb-6">
          <h3 className="font-serif text-lg font-semibold mb-4">Specialisms</h3>
          <div className="flex flex-wrap gap-2">
            {allSpecialisms.map((s) => (
              <button key={s} type="button" onClick={() => toggleSpecialism(s)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  (profile.specialisms || []).includes(s) ? 'bg-gold text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}>{s}</button>
            ))}
          </div>
        </div>

        {/* Experience */}
        <div className="dashboard-card mb-6 space-y-5">
          <h3 className="font-serif text-lg font-semibold">Experience</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Years of Experience</label>
            <input type="number" value={profile.experience_years || ''} onChange={(e) => update('experience_years', e.target.value)} className="input-field max-w-xs" />
          </div>
        </div>
      </div>
    </DashboardShell>
  )
}
