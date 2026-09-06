'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Save, Upload } from 'lucide-react'
import { COMPANY_TYPES, PROPERTY_TYPES, FACILITY_OPTIONS, STAFF_BENEFIT_OPTIONS } from '@/lib/constants'
import { SERVICES_CATEGORIES, PRODUCT_HOUSES_FULL, QUALS_CATEGORIES, SYSTEMS_FULL } from '@/lib/taxonomy'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'
import { externalUrl } from '@/lib/external-url'

const STAR_RATINGS = ['3', '4', '5', 'Boutique', 'Independent']

// A property should be told which of their answers was not kept, in the words
// the form used, not the name of a database column they have never seen.
const FIELD_LABELS: Record<string, string> = {
  company_name: 'Company / brand name', property_name: 'Property name',
  contact_name: 'Contact name', contact_phone: 'Phone', contact_email: 'Contact email',
  website: 'Website', location: 'Location', postcode: 'Postcode',
  company_type: 'Company type', property_type: 'Property type', star_rating: 'Star rating',
  about_text: 'About', tagline: 'Tagline',
  product_houses_used: 'Product houses', systems_used: 'Systems', services_offered: 'Services offered',
  brand_partners: 'Brand partners', qualifications_sought: 'Qualifications sought',
  num_treatment_rooms: 'Treatment rooms', team_size: 'Team size',
  commute_car_required: 'Car required', nearest_transport: 'Nearest transport',
  transport_walk_minutes: 'Walk from transport', parking_available: 'Parking',
  taxi_support: 'Taxi support', taxi_notes: 'Taxi notes', travel_notes: 'Travel notes',
  location_guide: 'Location guide', relocation_support: 'Relocation support',
  hotel_group: 'Hotel group', room_count: 'Room count', spa_size: 'Spa size',
  facilities: 'Facilities', opening_year: 'Opening year',
  culture_statement: 'Culture statement', staff_benefits: 'Staff benefits',
  progression_notes: 'Progression notes', culture_points: 'Culture points',
  highlights: 'Highlights', agency_available: 'Agency availability', agency_note: 'Agency note',
}
const fieldLabel = (column: string) => FIELD_LABELS[column] || column

export default function EmployerProfilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // Say whether it worked; never infer it from the wording.
  type Notice = { kind: 'success' | 'error'; text: string } | null
  const [notice, setNotice] = useState<Notice>(null)
  const ok = (text: string) => setNotice({ kind: 'success', text })
  const fail = (text: string) => setNotice({ kind: 'error', text })

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
        data.qualifications_sought = data.qualifications_sought || []
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
    // Single source of truth for the save. The recovery below drops a column
    // the database does not have so one missing field cannot lose the whole
    // form - but it is a net, not a feature: whatever it drops is reported as
    // a failure, by name, and needs a migration.
    const payload: Record<string, any> = {
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
        qualifications_sought: profile.qualifications_sought,
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
        // Destination page narrative
        location_guide: profile.location_guide || null,
        relocation_support: profile.relocation_support || null,
        // Property intelligence
        hotel_group: profile.hotel_group || null,
        room_count: profile.room_count ? parseInt(profile.room_count) : null,
        spa_size: profile.spa_size || null,
        facilities: profile.facilities?.length ? profile.facilities : null,
        opening_year: profile.opening_year ? parseInt(profile.opening_year) : null,
        culture_statement: profile.culture_statement || null,
        staff_benefits: profile.staff_benefits?.length ? profile.staff_benefits : null,
        progression_notes: profile.progression_notes || null,
        // Culture
        culture_points: profile.culture_points,
        highlights: profile.highlights,
        // Agency
        agency_available: profile.agency_available,
        agency_note: profile.agency_note,
    }
    // Store the address in a form a browser can follow. Saved as
    // "www.example.com" it renders as a relative link and lands on a 404 of
    // our own making, which reads to a candidate as a broken property.
    for (const field of ['website', 'tripadvisor_url'] as const) {
      if (field in payload && payload[field]) payload[field] = externalUrl(payload[field]) ?? payload[field]
    }

    const { error } = await supabase
      .from('employer_profiles')
      .update(payload)
      .eq('id', profile.id)

    // Drop a column the database does not have and try once more. Three
    // attempts, not ten: past a third missing column the schema is wrong in a
    // way no amount of retrying fixes, and eleven round trips on a broken save
    // is a slow failure rather than a fast one.
    let finalError = error
    const stripped: string[] = []
    for (let i = 0; i < 3 && finalError; i++) {
      const m = finalError.message.match(/Could not find the '([^']+)' column/) || finalError.message.match(/column "([^"]+)" of relation/)
      if (!m || !(m[1] in payload)) break
      stripped.push(m[1])
      delete payload[m[1]]
      const { error: retryErr } = await supabase.from('employer_profiles').update(payload).eq('id', profile.id)
      finalError = retryErr || null
    }

    setSaving(false)
    if (finalError) {
      fail(finalError.message)
    } else {
      // Best-effort: geocode the postcode so distance features work
      fetch('/api/employer/geocode', { method: 'POST' }).catch(() => {})
      if (stripped.length > 0) {
        fail(`Not saved: ${stripped.map(fieldLabel).join(', ')}. Everything else was kept. Please tell us so we can fix it - retrying will not help.`)
      } else {
        ok('Profile saved.')
      }
    }
    setTimeout(() => setNotice(null), stripped.length > 0 ? 8000 : 3000)
  }

  const handleGalleryUpload = async (file: File) => {
    const current: string[] = profile.property_photos || []
    if (current.length >= 6) { fail('Maximum 6 photos - remove one first.'); return }
    const ext = file.name.split('.').pop()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'property-photos')
    formData.append('path', `${profile.id}-${Date.now()}.${ext}`)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { fail(`Upload failed: ${data.error}`); return }
    const next = [...current, data.url]
    const { error } = await supabase.from('employer_profiles').update({ property_photos: next }).eq('id', profile.id)
    if (error) { fail(error.message); return }
    update('property_photos', next)
    ok('Photo added.')
  }

  const removeGalleryPhoto = async (url: string) => {
    const next = (profile.property_photos || []).filter((u: string) => u !== url)
    const { error } = await supabase.from('employer_profiles').update({ property_photos: next }).eq('id', profile.id)
    if (error) { fail(`Could not remove photo: ${error.message}`); return }
    update('property_photos', next)
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const ext = file.name.split('.').pop()
    const formData = new FormData()
    formData.append('file', file)
    formData.append('bucket', 'site-images')
    formData.append('path', `logos/${profile.id}-${Date.now()}.${ext}`)
    const res = await fetch('/api/upload', { method: 'POST', body: formData })
    const data = await res.json()
    if (!res.ok) { fail(`Upload failed: ${data.error}`); return }
    const { error: logoError } = await supabase.from('employer_profiles').update({ logo_url: data.url }).eq('id', profile.id)
    if (logoError) { fail(`Could not save the logo: ${logoError.message}`); return }

    update('logo_url', data.url)
    ok('Logo updated.')
    setTimeout(() => setNotice(null), 3000)
  }

  if (loading) return <DashboardShell role="employer"><div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div></DashboardShell>
  if (!profile) return <DashboardShell role="employer"><p className="text-secondary">Profile not found. Please contact support.</p></DashboardShell>

  return (
    <DashboardShell role="employer" userName={profile.company_name}>
      <div className="max-w-3xl">
        <div className="flex items-end justify-between mb-8 gap-4">
          <div>
            <p className="dashboard-eyebrow">Account</p>
            <h1 className="dashboard-title">Company Profile</h1>
            <p className="dashboard-intro">Keep your property details, operations and travel information up to date for candidates.</p>
          </div>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex items-center space-x-2 disabled:opacity-50">
            <Save size={16} /><span>{saving ? 'Saving...' : 'Save Changes'}</span>
          </button>
        </div>

        {notice && <div role={notice.kind === 'error' ? 'alert' : 'status'} className={`px-4 py-3 rounded-lg mb-6 text-sm ${notice.kind === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{notice.text}</div>}

        {/* Logo */}
        <div className="dashboard-card mb-6">
          <h3 className="font-serif text-lg font-semibold mb-4">Company Logo</h3>
          <div className="flex items-center space-x-6">
            <div className="w-24 h-24 rounded-xl bg-white border border-border flex items-center justify-center overflow-hidden">
              {profile.logo_url ? (
                <img decoding="async" src={profile.logo_url} alt={`${profile.company_name || 'Company'} logo`} className="w-full h-full object-contain p-1.5" />
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
              <input aria-label="Company / Brand Name" type="text" value={profile.company_name || ''} onChange={(e) => update('company_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Name</label>
              <input aria-label="Property Name" type="text" value={profile.property_name || ''} onChange={(e) => update('property_name', e.target.value)} className="input-field" placeholder="e.g. The Lanesborough Spa" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Name</label>
              <input aria-label="Contact Name" type="text" value={profile.contact_name || ''} onChange={(e) => update('contact_name', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Contact Email</label>
              <input aria-label="Contact Email" type="email" value={profile.contact_email || ''} onChange={(e) => update('contact_email', e.target.value)} className="input-field" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
              <input aria-label="Phone" type="tel" value={profile.contact_phone || ''} onChange={(e) => update('contact_phone', e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
              <input aria-label="Website" type="url" value={profile.website || ''} onChange={(e) => update('website', e.target.value)} className="input-field" placeholder="https://" />
            </div>
          </div>
          {/* Same fix as the talent onboarding form: three across applies at
              every width without a breakpoint, phone included, and a label
              that wraps then pushes its input out of line with its neighbours. */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Location</label>
              <input aria-label="Location" type="text" value={profile.location || ''} onChange={(e) => update('location', e.target.value)} className="input-field" placeholder="London" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Postcode</label>
              <input aria-label="Postcode" type="text" value={profile.postcode || ''} onChange={(e) => update('postcode', e.target.value)} className="input-field" placeholder="SW1A 1AA" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Star Rating</label>
              <select aria-label="Star Rating" value={profile.star_rating || ''} onChange={(e) => update('star_rating', e.target.value)} className="input-field">
                <option value="">Select</option>
                {STAR_RATINGS.map(r => <option key={r} value={r}>{r}{!isNaN(Number(r)) ? ' Star' : ''}</option>)}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Company Type</label>
              <select aria-label="Company Type" value={profile.company_type || ''} onChange={(e) => update('company_type', e.target.value)} className="input-field">
                <option value="">Select</option>
                {COMPANY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              {/* This asked for "hotel_spa, day_spa, resort" - database slugs,
                  typed by a spa director. Whatever they wrote appeared on the
                  public job page, so the field leaked our naming into their
                  shop window. It is a list now. */}
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Property Type</label>
              <select aria-label="Property Type" value={profile.property_type || ''} onChange={(e) => update('property_type', e.target.value)} className="input-field">
                <option value="">Select</option>
                {PROPERTY_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              <p className="mt-1.5 text-[11px] text-secondary">Where a candidate would actually work. Candidates see this on your roles.</p>
            </div>
          </div>
        </div>

        {/* Travel and access */}
        <div className="dashboard-card mb-6 space-y-5">
          <div>
            <h3 className="font-serif text-lg font-semibold">Travel &amp; Access for Staff</h3>
            <p className="text-sm text-secondary mt-1">Give professionals practical, property-supplied information. Mileage is calculated separately; these details explain the real journey.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Nearest station, Tube or bus stop</label>
              <input aria-label="Nearest station, Tube or bus stop" type="text" value={profile.nearest_transport || ''} onChange={(e) => update('nearest_transport', e.target.value)} className="input-field" placeholder="e.g. Green Park Underground" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Approximate walk (minutes)</label>
              <input aria-label="Approximate walk (minutes)" type="number" min="0" max="240" value={profile.transport_walk_minutes || ''} onChange={(e) => update('transport_walk_minutes', e.target.value)} className="input-field" placeholder="e.g. 8" />
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
              <input aria-label="Taxi / shuttle details" type="text" value={profile.taxi_notes || ''} onChange={(e) => update('taxi_notes', e.target.value)} className="input-field" placeholder="e.g. Taxi from Skipton station reimbursed with receipt" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Other access notes</label>
            <textarea aria-label="Other access notes" rows={3} value={profile.travel_notes || ''} onChange={(e) => update('travel_notes', e.target.value)} className="input-field" placeholder="e.g. Staff entrance on Park Lane; late-shift transport available by arrangement" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Location guide</label>
            <textarea aria-label="Location guide" rows={4} value={profile.location_guide || ''} onChange={(e) => update('location_guide', e.target.value)} className="input-field" />
            <p className="text-xs text-muted mt-1.5">What is the area like to live and work in - neighbourhood, lifestyle, cost of living, what the team loves about it.</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Relocation support</label>
            <textarea aria-label="Relocation support" rows={4} value={profile.relocation_support || ''} onChange={(e) => update('relocation_support', e.target.value)} className="input-field" />
            <p className="text-xs text-muted mt-1.5">What you offer people relocating - accommodation help, travel, visa sponsorship, settling-in support.</p>
          </div>
        </div>

        {/* About */}
        <div className="dashboard-card mb-6 space-y-5">
          <h3 className="font-serif text-lg font-semibold">About Your Property</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tagline</label>
            <input aria-label="Tagline" type="text" value={profile.tagline || ''} onChange={(e) => update('tagline', e.target.value)} className="input-field" placeholder="A short, memorable line about your property" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">About / Description</label>
            <textarea aria-label="About / Description" rows={5} value={profile.about_text || ''} onChange={(e) => update('about_text', e.target.value)} className="input-field" placeholder="Tell candidates about your property, culture, and what makes it special..." />
          </div>
        </div>

        {/* Spa Operations - critical for matching */}
        <div className="dashboard-card mb-6 space-y-5">
          <div>
            <h3 className="font-serif text-lg font-semibold">Spa Operations</h3>
            <p className="text-sm text-secondary mt-1">This builds your property profile for candidates. Role-specific matching uses the requirements you set on each job listing.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Treatment Rooms</label>
              <input aria-label="Treatment Rooms" type="number" value={profile.num_treatment_rooms || ''} onChange={(e) => update('num_treatment_rooms', e.target.value)} className="input-field" placeholder="e.g. 12" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Team Size</label>
              <input aria-label="Team Size" type="number" value={profile.team_size || ''} onChange={(e) => update('team_size', e.target.value)} className="input-field" placeholder="e.g. 25" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Hotel Group</label>
              <input aria-label="Hotel Group" value={profile.hotel_group || ''} onChange={(e) => update('hotel_group', e.target.value)} className="input-field" placeholder="e.g. Fairmont Hotels & Resorts" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Room Count</label>
              <input aria-label="Room Count" type="number" value={profile.room_count || ''} onChange={(e) => update('room_count', e.target.value)} className="input-field" placeholder="e.g. 180" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Spa Size</label>
              <input aria-label="Spa Size" value={profile.spa_size || ''} onChange={(e) => update('spa_size', e.target.value)} className="input-field" placeholder="e.g. 2,000 sqm over two floors" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Opening Year</label>
              <input aria-label="Opening Year" type="number" value={profile.opening_year || ''} onChange={(e) => update('opening_year', e.target.value)} className="input-field" placeholder="e.g. 2024" />
            </div>
          </div>
          <CollapsibleCheckboxSection
            title="Facilities"
            flatItems={FACILITY_OPTIONS as unknown as string[]}
            selected={profile.facilities || []}
            onChange={(v) => update('facilities', v)}
          />
          <CollapsibleCheckboxSection
            title="Staff Benefits"
            flatItems={STAFF_BENEFIT_OPTIONS as unknown as string[]}
            selected={profile.staff_benefits || []}
            onChange={(v) => update('staff_benefits', v)}
          />
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Culture</label>
            <textarea aria-label="Culture" rows={3} value={profile.culture_statement || ''} onChange={(e) => update('culture_statement', e.target.value)} className="input-field" placeholder="What it genuinely feels like to work here - candidates read this before applying." />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Progression</label>
            <textarea aria-label="Progression" rows={3} value={profile.progression_notes || ''} onChange={(e) => update('progression_notes', e.target.value)} className="input-field" placeholder="Real progression examples - therapists who became managers, transfers within the group..." />
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
            selected={profile.qualifications_sought || []}
            onChange={(v) => update('qualifications_sought', v)}
          />

          <CollapsibleCheckboxSection
            title="Systems Used"
            flatItems={SYSTEMS_FULL}
            selected={profile.systems_used || []}
            onChange={(v) => update('systems_used', v)}
          />
        </div>

        <div className="dashboard-card mb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="font-serif text-lg font-semibold">Property Fact File</h3>
              <p className="text-sm text-secondary mt-1">Arrival, parking, uniform and on-the-day details shown to agency professionals before a shift. Part of your property profile - kept on its own page so it's quick to update.</p>
            </div>
            <a href="/employer/property-fact-file" className="btn-secondary whitespace-nowrap text-center">Open fact file →</a>
          </div>
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
              <textarea aria-label="Agency Notes" rows={3} value={profile.agency_note || ''} onChange={(e) => update('agency_note', e.target.value)} className="input-field" placeholder="Any specific requirements for temporary staff..." />
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
                <img loading="lazy" decoding="async" src={url} alt="" className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeGalleryPhoto(url)} className="absolute top-2 right-2 bg-white/90 rounded-full w-6 h-6 text-[11px] font-bold text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            ))}
            {(profile.property_photos || []).length < 6 && (
              <label className="aspect-[4/3] rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center cursor-pointer hover:border-ink/30 transition-colors text-muted">
                <span className="text-[22px] leading-none mb-1" style={{ color: '#555555' }}>+</span>
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
