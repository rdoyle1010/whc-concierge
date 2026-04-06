'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save, Upload } from 'lucide-react'
import { PRODUCT_HOUSES, SYSTEMS, COMPANY_TYPES } from '@/lib/constants'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'

const SERVICES = [
  'Massage', 'Facials', 'Body treatments', 'Manicure & Pedicure',
  'Nail care', 'Hair styling', 'Barbering', 'Thermal suite',
  'Hydrotherapy', 'Yoga', 'Pilates', 'Personal training',
  'Nutrition', 'Meditation', 'Ayurveda', 'Acupuncture',
  'Reflexology', 'Aromatherapy', 'Reiki', 'Pregnancy treatments',
  'Men\'s grooming', 'Tanning', 'Make-up', 'Lash & Brow',
]

const STAR_RATINGS = ['3', '4', '5', 'Boutique', 'Independent']

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
      if (data) {
        // Ensure array fields are always arrays
        data.product_houses_used = data.product_houses_used || []
        data.systems_used = data.systems_used || []
        data.services_offered = data.services_offered || []
        data.brand_partners = data.brand_partners || []
        data.sector_tags = data.sector_tags || []
        data.culture_points = data.culture_points || []
        data.highlights = data.highlights || []
      }
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
        // Company basics
        company_name: profile.company_name,
        property_name: profile.property_name,
        contact_name: profile.contact_name,
        contact_phone: profile.contact_phone,
        contact_email: profile.contact_email,
        website: profile.website,
        location: profile.location,
        postcode: profile.postcode,
        company_type: profile.company_type,
        property_type: profile.property_type,
        star_rating: profile.star_rating,
        // About
        about_text: profile.about_text,
        tagline: profile.tagline,
        // Operational — these feed the matching algorithm
        product_houses_used: profile.product_houses_used,
        systems_used: profile.systems_used,
        services_offered: profile.services_offered,
        brand_partners: profile.brand_partners,
        num_treatment_rooms: profile.num_treatment_rooms ? parseInt(profile.num_treatment_rooms) : null,
        team_size: profile.team_size ? parseInt(profile.team_size) : null,
        // Culture
        culture_points: profile.culture_points,
        highlights: profile.highlights,
        // Agency
        agency_available: profile.agency_available,
        agency_note: profile.agency_note,
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
  if (!profile) return <DashboardShell role="employer"><p className="text-gray-500">Profile not found. Please contact support.</p></DashboardShell>

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

        {/* Company Details */}
        <div className="dashboard-card mb-6 space-y-5">
          <h3 className="font-serif text-lg font-semibold">Company Details</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company / Brand Name</label>
              <input type="text" value={profile.company_name || ''} onChange={(e) => update('company_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Name</label>
              <input type="text" value={profile.property_name || ''} onChange={(e) => update('property_name', e.target.value)} className="input-field" placeholder="e.g. The Lanesborough Spa" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Name</label>
              <input type="text" value={profile.contact_name || ''} onChange={(e) => update('contact_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
              <input type="email" value={profile.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input type="tel" value={profile.contact_phone || ''} onChange={(e) => update('contact_phone', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              <input type="url" value={profile.website || ''} onChange={(e) => update('website', e.target.value)} className="input-field" placeholder="https://" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input type="text" value={profile.location || ''} onChange={(e) => update('location', e.target.value)} className="input-field" placeholder="London" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Postcode</label>
              <input type="text" value={profile.postcode || ''} onChange={(e) => update('postcode', e.target.value)} className="input-field" placeholder="SW1A 1AA" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Star Rating</label>
              <select value={profile.star_rating || ''} onChange={(e) => update('star_rating', e.target.value)} className="input-field">
                <option value="">Select</option>
                {STAR_RATINGS.map(r => <option key={r} value={r}>{r}{!isNaN(Number(r)) ? ' Star' : ''}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Type</label>
              <select value={profile.company_type || ''} onChange={(e) => update('company_type', e.target.value)} className="input-field">
                <option value="">Select</option>
                {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Type</label>
              <input type="text" value={profile.property_type || ''} onChange={(e) => update('property_type', e.target.value)} className="input-field" placeholder="e.g. hotel_spa, day_spa, resort" />
            </div>
          </div>
        </div>

        {/* About */}
        <div className="dashboard-card mb-6 space-y-5">
          <h3 className="font-serif text-lg font-semibold">About Your Property</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
            <input type="text" value={profile.tagline || ''} onChange={(e) => update('tagline', e.target.value)} className="input-field" placeholder="A short, memorable line about your property" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">About / Description</label>
            <textarea rows={5} value={profile.about_text || ''} onChange={(e) => update('about_text', e.target.value)} className="input-field" placeholder="Tell candidates about your property, culture, and what makes it special..." />
          </div>
        </div>

        {/* Spa Operations — critical for matching */}
        <div className="dashboard-card mb-6 space-y-5">
          <div>
            <h3 className="font-serif text-lg font-semibold">Spa Operations</h3>
            <p className="text-sm text-gray-500 mt-1">This information helps us match you with the right candidates. The more you complete, the better your matches.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Treatment Rooms</label>
              <input type="number" value={profile.num_treatment_rooms || ''} onChange={(e) => update('num_treatment_rooms', e.target.value)} className="input-field" placeholder="e.g. 12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Size</label>
              <input type="number" value={profile.team_size || ''} onChange={(e) => update('team_size', e.target.value)} className="input-field" placeholder="e.g. 25" />
            </div>
          </div>

          <CollapsibleCheckboxSection
            title="Product Houses Used"
            flatItems={[...PRODUCT_HOUSES]}
            selected={profile.product_houses_used || []}
            onChange={(v) => update('product_houses_used', v)}
          />

          <CollapsibleCheckboxSection
            title="Services Offered"
            flatItems={SERVICES}
            selected={profile.services_offered || []}
            onChange={(v) => update('services_offered', v)}
          />

          <CollapsibleCheckboxSection
            title="Systems Used"
            flatItems={[...SYSTEMS]}
            selected={profile.systems_used || []}
            onChange={(v) => update('systems_used', v)}
          />
        </div>

        {/* Agency */}
        <div className="dashboard-card mb-6 space-y-5">
          <h3 className="font-serif text-lg font-semibold">Agency & Temporary Cover</h3>
          <label className="flex items-center space-x-3 cursor-pointer">
            <input type="checkbox" checked={profile.agency_available || false} onChange={(e) => update('agency_available', e.target.checked)}
              className="w-4 h-4 border-gray-300 text-black focus:ring-black rounded-sm" />
            <span className="text-sm text-gray-700">We accept agency / temporary cover bookings</span>
          </label>
          {profile.agency_available && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Agency Notes</label>
              <textarea rows={3} value={profile.agency_note || ''} onChange={(e) => update('agency_note', e.target.value)} className="input-field" placeholder="Any specific requirements for temporary staff..." />
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex justify-end pb-8">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
            <Save size={16} /><span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </DashboardShell>
  )
}
