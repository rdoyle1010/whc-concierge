'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save, Upload } from 'lucide-react'
import { COMPANY_TYPES } from '@/lib/constants'
import { SERVICES_CATEGORIES, PRODUCT_HOUSES_FULL, QUALS_CATEGORIES, SYSTEMS_FULL } from '@/lib/taxonomy'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'

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
        // Operational - these feed the matching algorithm
        product_houses_used: profile.product_houses_used,
        systems_used: profile.systems_used,
        services_offered: profile.services_offered,
        brand_partners: profile.brand_partners,
        num_treatment_rooms: profile.num_treatment_rooms ? parseInt(profile.num_treatment_rooms) : null,
        team_size: profile.team_size ? parseInt(profile.team_size) : null,
        // Travel information shown to professionals. It is supplied by the
        // property and labelled as such; we do not invent journey times.
        commute_car_required: profile.commute_car_required,
        nearest_transport: profile.nearest_transport,
        transport_walk_minutes: profile.transport_walk_minutes ? parseInt(profile.transport_walk_minutes) : null,
        parking_available: profile.parking_available,
        taxi_support: profile.taxi_support,
        taxi_notes: profile.taxi_notes,
        travel_notes: profile.travel_notes,
        // Culture
        culture_points: profile.culture_points,
        highlights: profile.highlights,
        // Agency
        agency_available: profile.agency_available,
        agency_note: profile.agency_note,
      })
      .eq('id', profile.id)

    // If a column doesn't exist in the DB, strip just that field and retry
    let finalError = error
    const stripped: string[] = []
    if (error) {
      const payload: Record<string, any> = {
        company_name: profile.company_name, property_name: profile.property_name, contact_name: profile.contact_name,
        contact_phone: profile.contact_phone, contact_email: profile.contact_email, website: profile.website,
        location: profile.location, postcode: profile.postcode, company_type: profile.company_type,
        property_type: profile.property_type, star_rating: profile.star_rating, about_text: profile.about_text,
        tagline: profile.tagline, product_houses_used: profile.product_houses_used, systems_used: profile.systems_used,
        services_offered: profile.services_offered, brand_partners: profile.brand_partners,
        num_treatment_rooms: profile.num_treatment_rooms ? parseInt(profile.num_treatment_rooms) : null,
        team_size: profile.team_size ? parseInt(profile.team_size) : null,
        commute_car_required: profile.commute_car_required, nearest_transport: profile.nearest_transport,
        transport_walk_minutes: profile.transport_walk_minutes ? parseInt(profile.transport_walk_minutes) : null,
        parking_available: profile.parking_available, taxi_support: profile.taxi_support,
        taxi_notes: profile.taxi_notes, travel_notes: profile.travel_notes,
        culture_points: profile.culture_points, highlights: profile.highlights,
        agency_available: profile.agency_available, agency_note: profile.agency_note,
      }
      for (let i = 0; i < 10 && finalError; i++) {
        const m = finalError.message.match(/Could not find the '([^']+)' column/) || finalError.message.match(/column "([^"]+)" of relation/)
        if (!m || !(m[1] in payload)) break
        stripped.push(m[1])
        delete payload[m[1]]
        const { error: retryErr } = await supabase.from('employer_profiles').update(payload).eq('id', profile.id)
        finalError = retryErr || null
      }
    }

    setSaving(false)
    if (finalError) {
      setMessage(finalError.message)
    } else {
      // Best-effort: geocode the postcode so distance features work
      fetch('/api/employer/geocode', { method: 'POST' }).catch(() => {})
      if (stripped.length > 0) {
        setMessage(`Profile saved, but these fields could not be stored yet: ${stripped.join(', ')}. Please contact support.`)
      } else {
        setMessage('Profile saved successfully!')
      }
    }
    setTimeout(() => setMessage(''), stripped.length > 0 ? 8000 : 3000)
  }

  const handleGalleryUpload = async (file: File) => {
    const current: string[] = profile.property_photos || []
    if (current.length >= 6) { setMessage('Maximum 6 photos - remove one first.'); return }
    const ext = file.name.split('.').pop()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'property-photos')
    formData.append('path', `${profile.id}-${Date.now()}.${ext}`)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { setMessage(`Upload failed: ${data.error}`); return }
    const next = [...current, data.url]
    const { error } = await supabase.from('employer_profiles').update({ property_photos: next }).eq('id', profile.id)
    if (error) { setMessage(error.message); return }
    update('property_photos', next)
    setMessage('Photo added!')
  }

  const removeGalleryPhoto = async (url: string) => {
    const next = (profile.property_photos || []).filter((u: string) => u !== url)
    const { error } = await supabase.from('employer_profiles').update({ property_photos: next }).eq('id', profile.id)
    if (error) { setMessage(`Could not remove photo: ${error.message}`); return }
    update('property_photos', next)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'site-images')
    formData.append('path', `logos/${profile.id}.${ext}`)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { setMessage(`Upload failed: ${data.error}`); return }
    await supabase.from('employer_profiles').update({ logo_url: data.url }).eq('id', profile.id)

    update('logo_url', data.url)
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company / Brand Name</label>
              <input type="text" value={profile.company_name || ''} onChange={(e) => update('company_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Name</label>
              <input type="text" value={profile.property_name || ''} onChange={(e) => update('property_name', e.target.value)} className="input-field" placeholder="e.g. The Lanesborough Spa" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Name</label>
              <input type="text" value={profile.contact_name || ''} onChange={(e) => update('contact_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
              <input type="email" value={profile.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

        {/* Travel and access */}
        <div className="dashboard-card mb-6 space-y-5">
          <div>
            <h3 className="font-serif text-lg font-semibold">Travel &amp; Access for Staff</h3>
            <p className="text-sm text-gray-500 mt-1">Give professionals practical, property-supplied information. Mileage is calculated separately; these details explain the real journey.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nearest station, Tube or bus stop</label>
              <input type="text" value={profile.nearest_transport || ''} onChange={(e) => update('nearest_transport', e.target.value)} className="input-field" placeholder="e.g. Green Park Underground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Approximate walk (minutes)</label>
              <input type="number" min="0" max="240" value={profile.transport_walk_minutes || ''} onChange={(e) => update('transport_walk_minutes', e.target.value)} className="input-field" placeholder="e.g. 8" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className="flex items-start gap-3 border border-border p-4 cursor-pointer">
              <input type="checkbox" checked={profile.commute_car_required || false} onChange={(e) => update('commute_car_required', e.target.checked)} className="mt-0.5 w-4 h-4" />
              <span><span className="block text-sm font-medium text-ink">Car required</span><span className="text-xs text-muted">Public transport is not practical</span></span>
            </label>
            <label className="flex items-start gap-3 border border-border p-4 cursor-pointer">
              <input type="checkbox" checked={profile.parking_available || false} onChange={(e) => update('parking_available', e.target.checked)} className="mt-0.5 w-4 h-4" />
              <span><span className="block text-sm font-medium text-ink">Staff parking</span><span className="text-xs text-muted">Parking is available on site</span></span>
            </label>
            <label className="flex items-start gap-3 border border-border p-4 cursor-pointer">
              <input type="checkbox" checked={profile.taxi_support || false} onChange={(e) => update('taxi_support', e.target.checked)} className="mt-0.5 w-4 h-4" />
              <span><span className="block text-sm font-medium text-ink">Taxi or shuttle help</span><span className="text-xs text-muted">The property can arrange or contribute</span></span>
            </label>
          </div>
          {profile.taxi_support && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Taxi / shuttle details</label>
              <input type="text" value={profile.taxi_notes || ''} onChange={(e) => update('taxi_notes', e.target.value)} className="input-field" placeholder="e.g. Taxi from Skipton station reimbursed with receipt" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Other access notes</label>
            <textarea rows={3} value={profile.travel_notes || ''} onChange={(e) => update('travel_notes', e.target.value)} className="input-field" placeholder="e.g. Staff entrance on Park Lane; late-shift transport available by arrangement" />
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

        {/* Spa Operations - critical for matching */}
        <div className="dashboard-card mb-6 space-y-5">
          <div>
            <h3 className="font-serif text-lg font-semibold">Spa Operations</h3>
            <p className="text-sm text-gray-500 mt-1">This builds your property profile for candidates. Role-specific matching uses the requirements you set on each job listing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
            title="Services Offered"
            categories={SERVICES_CATEGORIES}
            selected={profile.services_offered || []}
            onChange={(v) => update('services_offered', v)}
          />

          <CollapsibleCheckboxSection
            title="Product Houses Used"
            flatItems={PRODUCT_HOUSES_FULL}
            selected={profile.product_houses_used || []}
            onChange={(v) => update('product_houses_used', v)}
          />

          <CollapsibleCheckboxSection
            title="Qualifications We Look For"
            categories={QUALS_CATEGORIES}
            selected={profile.brand_partners || []}
            onChange={(v) => update('brand_partners', v)}
          />

          <CollapsibleCheckboxSection
            title="Systems Used"
            flatItems={SYSTEMS_FULL}
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
                {/* Property Gallery */}
        <div className="dashboard-card mb-6">
          <h2 className="text-[15px] font-medium text-ink mb-1">Property Photos</h2>
          <p className="text-[12px] text-muted mb-4">Show candidates where they could be working - spa, treatment rooms, grounds. Up to 6 photos, shown on your role listings.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(profile.property_photos || []).map((url: string) => (
              <div key={url} className="relative aspect-[4/3] rounded-lg overflow-hidden bg-surface group">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeGalleryPhoto(url)} className="absolute top-2 right-2 bg-white/90 rounded-full w-6 h-6 text-[11px] font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ))}
            {(profile.property_photos || []).length < 6 && (
              <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-ink/30 transition-colors text-muted">
                <span className="text-[22px] leading-none mb-1" style={{ color: '#C9A96E' }}>+</span>
                <span className="text-[11px]">Add photo</span>
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleGalleryUpload(f); e.target.value = '' }} />
              </label>
            )}
          </div>
        </div>

<div className="flex justify-end pb-8">
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
            <Save size={16} /><span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>
      </div>
    </DashboardShell>
  )
}
