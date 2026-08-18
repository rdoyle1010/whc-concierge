'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, CheckCircle2, Crown, ShieldCheck } from 'lucide-react'

export default function TalentResidencyPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<any[]>([])
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login?role=talent'; return }
    const { data: candidate } = await supabase.from('candidate_profiles').select('id,full_name,residency_member,residency_subscription_status').eq('user_id', user.id).maybeSingle()
    setProfile(candidate)
    if (candidate) {
      const { data } = await supabase.from('residency_bookings').select('*').eq('candidate_id', candidate.id).order('created_at', { ascending: false })
      setBookings(data || [])
    }
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  async function respond(bookingId: string, action: 'accept' | 'decline' | 'counter') {
    let counterDayRate: number | undefined
    if (action === 'counter') {
      const value = window.prompt('Enter your counter day rate (£)')
      if (!value) return
      counterDayRate = Number(value)
      if (!counterDayRate || counterDayRate <= 0) { alert('Enter a valid day rate.'); return }
    }
    setBusy(bookingId)
    const res = await fetch('/api/residency/respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId, action, counterDayRate }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) alert(data.error || 'Could not update the offer.')
    await load(); setBusy(null)
  }

  return (
    <div className="min-h-screen bg-[#F7F5F1] px-5 py-10 lg:px-10">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div><p className="eyebrow mb-2">Residency Marketplace</p><h1 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight">Residency offers</h1><p className="text-sm text-muted mt-2">Review hotel invitations and keep your agreed terms protected on Spa Platform.</p></div>
          <Link href="/residency/create" className="btn-primary">Manage Residency Listing</Link>
        </div>

        {!loading && <div className={`rounded-2xl border p-5 mb-7 flex items-start gap-3 ${profile?.residency_member ? 'border-emerald-200 bg-emerald-50' : 'border-accent/20 bg-white'}`}>
          {profile?.residency_member ? <CheckCircle2 size={20} className="text-emerald-700 mt-0.5"/> : <Crown size={20} className="text-accent mt-0.5"/>}
          <div><p className="font-medium text-ink text-sm">{profile?.residency_member ? 'Residency membership active' : 'Residency membership'}</p><p className="text-xs text-muted mt-1 leading-5">{profile?.residency_member ? 'Your profile can receive structured hotel offers.' : 'Residency listings are £10/month. Activate membership to be promoted to properties and receive offers.'}</p></div>
        </div>}

        <div className="rounded-2xl border border-border bg-white p-5 mb-7 flex items-start gap-3"><ShieldCheck size={20} className="text-accent mt-0.5"/><div><p className="font-medium text-ink text-sm">Why keep the booking here?</p><p className="text-xs text-muted mt-1 leading-5">Accepted rates, dates, accommodation and travel terms are recorded before payment. Completed platform residencies can qualify for verified reviews.</p></div></div>

        {loading ? <div className="skeleton h-44 rounded-2xl"/> : bookings.length === 0 ? <div className="bg-white border border-border rounded-2xl p-12 text-center"><p className="font-medium text-ink">No residency offers yet</p><p className="text-sm text-muted mt-2 mb-5">Keep your availability and specialist profile up to date so the right properties can find you.</p><Link href="/residency/create" className="btn-primary inline-block">Update Residency Profile</Link></div> : <div className="space-y-4">{bookings.map(b => <div key={b.id} className="bg-white border border-border rounded-2xl p-6 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
            <div className="min-w-0"><span className="text-xs font-semibold uppercase tracking-[.12em] text-accent">{b.status}</span><h2 className="text-xl font-semibold text-ink mt-2">{b.property_name}</h2><div className="flex flex-wrap gap-4 mt-3 text-sm text-muted"><span className="flex items-center gap-1.5"><CalendarDays size={14}/>{b.start_date} - {b.end_date}</span><span>{b.days_required} working days</span></div><div className="flex flex-wrap gap-2 mt-4">{b.accommodation_included && <span className="badge-gold">Accommodation included</span>}{b.travel_included && <span className="badge-gold">Travel included</span>}</div>{b.services_required && <p className="text-sm text-secondary mt-4 leading-6"><span className="font-medium text-ink">Requested services:</span> {b.services_required}</p>}{b.notes && <p className="text-sm text-secondary mt-2 leading-6"><span className="font-medium text-ink">Property notes:</span> {b.notes}</p>}</div>
            <div className="lg:w-72 rounded-xl bg-surface p-4 shrink-0"><p className="text-xs text-muted">Offer</p><p className="text-2xl font-semibold text-ink mt-1">£{Number(b.proposed_day_rate).toLocaleString('en-GB')}<span className="text-xs font-normal text-muted">/day</span></p><p className="text-xs text-muted mt-1">£{Number(b.proposed_total).toLocaleString('en-GB')} residency value</p>{['offered','countered'].includes(b.status) && <div className="grid grid-cols-3 gap-2 mt-4"><button disabled={busy===b.id} onClick={() => respond(b.id,'decline')} className="btn-secondary !px-2 !py-2 text-[11px]">Decline</button><button disabled={busy===b.id} onClick={() => respond(b.id,'counter')} className="btn-secondary !px-2 !py-2 text-[11px]">Counter</button><button disabled={busy===b.id} onClick={() => respond(b.id,'accept')} className="btn-primary !px-2 !py-2 text-[11px]">Accept</button></div>}{b.status === 'accepted' && <p className="mt-4 text-xs text-amber-700">Accepted - awaiting property payment.</p>}{b.status === 'confirmed' && <p className="mt-4 text-xs text-emerald-700 font-medium">Confirmed - payment received.</p>}</div>
          </div>
        </div>)}</div>}
      </div>
    </div>
  )
}
