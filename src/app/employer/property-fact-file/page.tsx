'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Building2, CheckCircle2, MapPin, ShieldCheck, Sparkles } from 'lucide-react'

const fields = {
  arrival: [
    ['property_address','Property address'], ['directions','Directions / how to find us'], ['map_url','Map link'], ['nearest_transport','Nearest train / tube'],
    ['parking_details','Where exactly to park'], ['staff_entrance','Staff entrance'], ['arrival_contact_name','Who to ask for on arrival'], ['arrival_contact_role','Contact role'],
    ['arrival_phone','Emergency / on-the-day number'], ['recommended_arrival_buffer_minutes','Recommended arrival buffer (minutes)'], ['uniform_required','Uniform required'], ['worker_should_bring','What the Spa Platform worker should bring'],
    ['changing_facilities','Changing facilities'], ['locker_information','Locker information'],
  ],
  welfare: [
    ['food_provided','Food provided?'], ['staff_restaurant','Staff restaurant'], ['refreshments','Tea / coffee / water'], ['break_policy','Break policy'],
  ],
  safety: [
    ['fire_emergency_basics','Fire / emergency basics'], ['assembly_point','Assembly point'], ['health_safety_acknowledgement','Health & safety acknowledgement'],
  ],
  spa: [
    ['products_brands','Products / brands used'], ['treatment_protocols','Treatment protocols to know'], ['booking_system','Booking system used'],
    ['retail_commission','Retail commission'], ['treatment_commission','Treatment commission'], ['gratuities_service_charge','Gratuities / service charge'],
    ['retail_targets','Expected retail targets'], ['guest_service_standards','Guest / service standards'], ['property_rules','Property-specific rules'],
  ],
  residency: [
    ['residency_accommodation','Accommodation details'], ['residency_accommodation_address','Accommodation address'], ['residency_check_in','Check-in arrangements'], ['residency_check_out','Check-out arrangements'],
    ['residency_travel_arrangements','Travel arrangements'], ['residency_staff_contacts','Key staff contacts'], ['residency_programme_brief','Programme brief'], ['residency_facilities_access','Facilities access'],
    ['residency_commercial_targets','Commercial targets'], ['residency_working_pattern','Working pattern'], ['residency_laundry_housekeeping','Laundry / housekeeping'],
    ['residency_expenses_process','Expenses process'], ['residency_local_information','Useful local information'], ['residency_other_notes','Other residency notes'],
  ],
} as const

export default function PropertyFactFilePage() {
  const supabase = createClient()
  const [profile, setProfile] = useState<any>(null)
  const [form, setForm] = useState<any>({ parking_available: false, recommended_arrival_buffer_minutes: 15 })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const { data: employer } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).maybeSingle()
      setProfile(employer)
      if (employer) {
        const { data: fact } = await supabase.from('property_fact_files').select('*').eq('employer_id', employer.id).maybeSingle()
        if (fact) setForm(fact)
        else setForm((f: any) => ({ ...f, property_address: [employer.address, employer.city, employer.postcode, employer.country].filter(Boolean).join(', '), nearest_transport: employer.nearest_transport || '', parking_available: employer.parking_available ?? false, arrival_contact_name: employer.contact_name || employer.spa_director_name || '', arrival_phone: employer.contact_phone || '', products_brands: (employer.product_houses_used || employer.product_houses || []).join(', '), booking_system: (employer.systems_used || []).join(', ') }))
      }
      setLoading(false)
    }
    load()
  }, [])

  const set = (key: string, value: any) => setForm((f: any) => ({ ...f, [key]: value }))

  async function save() {
    if (!profile) return
    setSaving(true); setNotice(''); setError('')
    const payload = { ...form, employer_id: profile.id, recommended_arrival_buffer_minutes: Number(form.recommended_arrival_buffer_minutes || 15) }
    delete payload.id; delete payload.created_at; delete payload.updated_at
    const { error } = await supabase.from('property_fact_files').upsert(payload, { onConflict: 'employer_id' })
    if (error) setError(error.message)
    else setNotice('Property Fact File saved. Future confirmed Agency and Residency bookings will use this information automatically.')
    setSaving(false)
  }

  const Section = ({ title, intro, items }: { title: string; intro: string; items: readonly (readonly [string,string])[] }) => (
    <section className="dashboard-panel mb-6">
      <h2 className="dashboard-section-title">{title}</h2>
      <p className="text-[12px] text-muted mt-1 mb-5 max-w-3xl">{intro}</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map(([key,label]) => <div key={key} className={['directions','worker_should_bring','break_policy','fire_emergency_basics','health_safety_acknowledgement','treatment_protocols','guest_service_standards','property_rules','residency_programme_brief','residency_other_notes'].includes(key) ? 'md:col-span-2' : ''}>
          <label className="block text-[11px] font-medium text-ink mb-1.5">{label}</label>
          {['directions','worker_should_bring','break_policy','fire_emergency_basics','health_safety_acknowledgement','treatment_protocols','guest_service_standards','property_rules','residency_programme_brief','residency_other_notes'].includes(key)
            ? <textarea rows={3} className="input-field text-[13px] resize-y" value={form[key] || ''} onChange={e => set(key, e.target.value)} />
            : <input className="input-field text-[13px]" value={form[key] ?? ''} onChange={e => set(key, e.target.value)} />}
        </div>)}
      </div>
    </section>
  )

  if (loading) return <DashboardShell role="employer"><div className="skeleton h-72 rounded-md" /></DashboardShell>

  return <DashboardShell role="employer" userName={profile?.property_name || profile?.company_name}>
    <div className="max-w-5xl">
      <p className="dashboard-eyebrow">Flexible staffing</p>
      <h1 className="dashboard-title">Property Fact File</h1>
      <p className="dashboard-intro max-w-3xl">Create the operational information every Agency worker and Residency specialist needs before arriving at your property.</p>

      <div className="my-7 border-l-2 border-[#c9a96e] bg-white/70 px-5 py-4">
        <div className="flex gap-3"><Sparkles size={17} className="text-accent shrink-0 mt-0.5" /><div><p className="text-[13px] font-medium text-ink">One master file. Automatic Before You Arrive packs.</p><p className="text-[12px] text-muted mt-1 leading-5">When a booking is confirmed, Spa Platform takes a snapshot of this file and adds the booking-specific date, times and details. Agency receives the concise operational version; Residency receives the extended stay information too.</p></div></div>
      </div>

      {notice && <div className="mb-5 bg-green-50 text-green-700 px-4 py-3 text-sm flex items-center gap-2"><CheckCircle2 size={16}/>{notice}</div>}
      {error && <div className="mb-5 bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>}

      <section className="dashboard-panel mb-6">
        <div className="flex items-center gap-3"><Building2 size={18} className="text-accent"/><div><h2 className="dashboard-section-title">Property basics</h2><p className="text-[12px] text-muted mt-1">{profile?.property_name || profile?.company_name || 'Your property'}</p></div></div>
        <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className="block text-[11px] font-medium text-ink mb-1.5">Parking available?</label><select className="input-field text-[13px]" value={form.parking_available ? 'yes' : 'no'} onChange={e => set('parking_available', e.target.value === 'yes')}><option value="yes">Yes</option><option value="no">No</option></select></div>
          <div><label className="block text-[11px] font-medium text-ink mb-1.5">Recommended arrival buffer</label><input type="number" min="0" max="120" className="input-field text-[13px]" value={form.recommended_arrival_buffer_minutes ?? 15} onChange={e => set('recommended_arrival_buffer_minutes', e.target.value)} /></div>
        </div>
      </section>

      <Section title="Getting here & arrival" intro="Remove the uncertainty before someone travels to you." items={fields.arrival} />
      <Section title="Welfare & breaks" intro="Tell workers what is available during the shift." items={fields.welfare} />
      <Section title="Safety essentials" intro="Concise operational information only. Full statutory induction remains the property's responsibility." items={fields.safety} />
      <Section title="Spa operations & commercial standards" intro="Help a temporary worker arrive already understanding how your spa operates." items={fields.spa} />
      <Section title="Residency extended stay" intro="Only shown in the richer Residency Before You Arrive pack." items={fields.residency} />

      <div className="sticky bottom-4 z-10 flex justify-end"><button type="button" onClick={save} disabled={saving} className="btn-primary px-7 py-3 shadow-lg disabled:opacity-50">{saving ? 'Saving...' : 'Save Property Fact File'}</button></div>
    </div>
  </DashboardShell>
}
