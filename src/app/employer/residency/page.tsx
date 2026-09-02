'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { CalendarDays, CheckCircle2, CreditCard, Hotel, ShieldCheck } from 'lucide-react'

export default function EmployerResidencyPage() {
  const supabase = createClient()
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [notice, setNotice] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { window.location.href = '/login?role=employer'; return }
    const { data: employer } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).maybeSingle()
    if (!employer) { setLoading(false); return }
    const { data } = await supabase.from('residency_bookings').select('*').eq('employer_id', employer.id).order('created_at', { ascending: false })
    setBookings(data || [])
    setLoading(false)
  }, [supabase])

  useEffect(() => { load() }, [load])

  useEffect(() => {
    const sessionId = new URLSearchParams(window.location.search).get('session_id')
    if (!sessionId) return
    ;(async () => {
      setNotice('Confirming your residency payment...')
      const res = await fetch('/api/residency/confirm-payment', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ sessionId }) })
      const data = await res.json().catch(() => ({}))
      setNotice(res.ok ? 'Payment received. Your residency is confirmed.' : (data.error || 'We could not verify the payment.'))
      if (res.ok) {
        window.history.replaceState({}, '', '/employer/residency?paid=true')
        load()
      }
    })()
  }, [load])

  async function respond(bookingId: string, action: 'accept' | 'decline' | 'counter') {
    let counterDayRate: number | undefined
    if (action === 'counter') {
      const value = window.prompt('Your counter day rate (£/day)')
      if (!value) return
      counterDayRate = Number(value.replace(/[^0-9.]/g, ''))
      if (!counterDayRate || counterDayRate <= 0) { alert('Enter a valid day rate.'); return }
    }
    setBusy(bookingId)
    const res = await fetch('/api/residency/employer-respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId, action, counterDayRate }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) alert(data.error || 'Could not update offer.')
    await load(); setBusy(null)
  }

  async function pay(bookingId: string) {
    setBusy(bookingId)
    const res = await fetch('/api/residency/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ bookingId, returnUrl: window.location.origin }) })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) { alert(data.error || 'Could not start payment.'); setBusy(null); return }
    window.location.href = data.url
  }

  return (
    <DashboardShell role="employer">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-5 mb-8">
          <div>
            <p className="eyebrow mb-2">Residency Marketplace</p>
            <h1 className="text-3xl md:text-4xl font-semibold text-ink tracking-tight">Your residency bookings</h1>
            <p className="text-sm text-secondary mt-2 max-w-2xl">Manage offers, counter-offers and confirmed specialist residencies in one place.</p>
          </div>
          <Link href="/residency" className="btn-primary">Find a Specialist</Link>
        </div>

        {notice && <div className="mb-6 rounded-2xl border border-accent/20 bg-white px-5 py-4 text-sm text-ink">{notice}</div>}

        <div className="rounded-2xl border border-border bg-white p-5 mb-7 flex items-start gap-3">
          <ShieldCheck size={20} className="text-accent mt-0.5" />
          <div><p className="font-medium text-ink text-sm">Protected platform booking</p><p className="text-xs text-muted mt-1 leading-5">Payment is only requested after both sides agree the rate and dates. Talent House Collective records the terms and charges the property a 10% booking fee.</p></div>
        </div>

        {loading ? <div className="skeleton h-44 rounded-2xl" /> : bookings.length === 0 ? (
          <div className="bg-white border border-border rounded-2xl p-12 text-center"><Hotel size={28} className="mx-auto text-muted mb-3" /><p className="font-medium text-ink">No residency offers yet</p><p className="text-sm text-secondary mt-2 mb-5">Browse specialists and send a structured invitation when you find the right fit.</p><Link href="/residency" className="btn-primary inline-block">Browse Residency Talent</Link></div>
        ) : <div className="space-y-4">{bookings.map(b => {
          const gross = Number(b.agreed_total || b.proposed_total || 0)
          const fee = Number(b.platform_fee || gross * .1)
          return <div key={b.id} className="dashboard-card">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-3"><span className="text-xs font-semibold uppercase tracking-[.12em] text-accent">{b.status}</span>{b.status === 'confirmed' && <span className="inline-flex items-center gap-1 text-xs text-emerald-700"><CheckCircle2 size={13}/> Paid & confirmed</span>}</div>
                <h2 className="text-xl font-semibold text-ink">{b.property_name}</h2>
                <div className="flex flex-wrap gap-4 mt-3 text-sm text-muted"><span className="flex items-center gap-1.5"><CalendarDays size={14}/>{b.start_date} - {b.end_date}</span><span>{b.days_required} working days</span><span>£{Number(b.agreed_day_rate || b.proposed_day_rate).toLocaleString('en-GB')}/day</span></div>
                <div className="flex flex-wrap gap-2 mt-4">{b.accommodation_included && <span className="badge-gold">Accommodation included</span>}{b.travel_included && <span className="badge-gold">Travel included</span>}</div>
                {b.services_required && <p className="text-sm text-secondary mt-4 leading-6"><span className="font-medium text-ink">Services:</span> {b.services_required}</p>}
              </div>
              <div className="lg:w-72 rounded-xl bg-surface p-4 shrink-0">
                <div className="flex justify-between text-xs py-1"><span className="text-muted">Residency value</span><span className="text-ink">£{gross.toLocaleString('en-GB')}</span></div>
                <div className="flex justify-between text-xs py-1"><span className="text-muted">Platform fee</span><span className="text-ink">£{fee.toLocaleString('en-GB')}</span></div>
                <div className="flex justify-between border-t border-border mt-2 pt-3 font-semibold text-sm"><span>Total</span><span>£{(gross + fee).toLocaleString('en-GB')}</span></div>
                {b.status === 'countered' && b.countered_by !== 'employer' && <div className="grid grid-cols-3 gap-2 mt-4"><button disabled={busy===b.id} onClick={() => respond(b.id,'decline')} className="btn-secondary !py-2 text-xs">Decline</button><button disabled={busy===b.id} onClick={() => respond(b.id,'counter')} className="btn-secondary !py-2 text-xs">Counter</button><button disabled={busy===b.id} onClick={() => respond(b.id,'accept')} className="btn-primary !py-2 text-xs">Accept Counter</button></div>}
                {b.status === 'countered' && b.countered_by === 'employer' && <p className="mt-4 text-xs text-amber-700">Your counter is with the specialist - you will be notified when they respond.</p>}
                {b.status === 'accepted' && <button disabled={busy===b.id} onClick={() => pay(b.id)} className="btn-primary w-full !py-2.5 mt-4 text-xs flex items-center justify-center gap-2"><CreditCard size={14}/> Confirm & Pay</button>}
              </div>
            </div>
          </div>
        })}</div>}
      </div>
    </DashboardShell>
  )
}
