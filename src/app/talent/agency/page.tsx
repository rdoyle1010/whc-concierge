'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Calendar, Clock, Banknote } from 'lucide-react'

export default function TalentAgencyPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [counteringId, setCounteringId] = useState<string | null>(null)
  const [counterRate, setCounterRate] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/agency/booking')
      if (res.ok) {
        const j = await res.json()
        setBookings((j.bookings || []).filter((b: any) => b.viewer_role === 'candidate'))
      } else {
        setBookings([])
      }
    } catch {
      setBookings([])
    }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function act(bookingId: string, action: 'accept' | 'decline' | 'counter', rate?: string) {
    setActionError('')
    if (action === 'counter') {
      const parsed = parseInt(String(rate), 10)
      if (!parsed || parsed <= 0) { setActionError('Please enter a valid day rate to counter with.'); return }
    }
    setBusyId(bookingId)
    try {
      const res = await fetch('/api/agency/booking', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, bookingId, ...(action === 'counter' ? { rate } : {}) }),
      })
      const j = await res.json()
      if (!res.ok) { setActionError(j.error || 'Something went wrong - please try again.'); return }
      setCounteringId(null)
      setCounterRate('')
      await load()
    } catch {
      setActionError('Something went wrong - please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const statusColors: Record<string, string> = {
    pending: 'bg-amber-50 text-amber-700',
    countered: 'bg-[#FDF6EC] text-accent',
    accepted: 'bg-green-50 text-green-700',
    confirmed: 'bg-green-50 text-green-700',
    completed: 'bg-blue-50 text-blue-700',
    declined: 'bg-red-50 text-red-700',
    cancelled: 'bg-red-50 text-red-700',
  }

  const offers = bookings.filter((b) => b.status === 'pending' || b.status === 'countered')
  const shifts = bookings.filter((b) => b.status !== 'pending' && b.status !== 'countered')

  return (
    <DashboardShell role="talent">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Agency Shifts</h1>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {/* Offers awaiting a response */}
          {offers.length > 0 && (
            <div className="mb-8">
              <h2 className="text-[16px] font-medium text-ink mb-3">Offers</h2>
              <p className="text-[13px] text-gray-500 mb-4">Properties have offered you these shifts. Accept, decline or counter with a different day rate.</p>
              {actionError && <p className="text-[13px] text-red-600 mb-3">{actionError}</p>}
              <div className="space-y-4">
                {offers.map((b) => (
                  <div key={b.id} className="bg-white border border-border rounded-xl p-5">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-ink">{b.employer_name || 'Property'}</h3>
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || ''}`}>
                            {b.status === 'countered' ? 'counter sent' : b.status}
                          </span>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center space-x-1"><Calendar size={14} /><span>{b.shift_date ? new Date(b.shift_date).toLocaleDateString() : 'Date TBC'}</span></span>
                          {b.shift_type && <span className="flex items-center space-x-1"><Clock size={14} /><span>{b.shift_type}</span></span>}
                          {b.hours && <span>{b.hours}h</span>}
                          <span className="flex items-center space-x-1 font-medium text-ink"><Banknote size={14} className="text-accent" /><span>£{b.rate}/day</span></span>
                        </div>
                      </div>

                      {b.status === 'pending' ? (
                        counteringId === b.id ? (
                          <div className="flex items-center gap-2">
                            <input
                              type="number" min={1} value={counterRate}
                              onChange={(e) => setCounterRate(e.target.value)}
                              placeholder="Your rate (£/day)"
                              className="input-field text-[13px] w-36"
                            />
                            <button onClick={() => act(b.id, 'counter', counterRate)} disabled={busyId === b.id} className="btn-primary text-[12px] disabled:opacity-50">Send</button>
                            <button onClick={() => { setCounteringId(null); setCounterRate(''); setActionError('') }} className="btn-secondary text-[12px]">Cancel</button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <button onClick={() => act(b.id, 'accept')} disabled={busyId === b.id} className="btn-primary text-[12px] disabled:opacity-50">Accept</button>
                            <button onClick={() => { setCounteringId(b.id); setCounterRate(String(b.rate || '')); setActionError('') }} disabled={busyId === b.id} className="btn-secondary text-[12px] disabled:opacity-50">Counter</button>
                            <button onClick={() => act(b.id, 'decline')} disabled={busyId === b.id} className="text-[12px] font-medium text-red-600 hover:text-red-700 px-3 py-2.5 disabled:opacity-50">Decline</button>
                          </div>
                        )
                      ) : (
                        <p className="text-[13px] text-gray-500">Counter sent - awaiting the property's response.</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Booked / past shifts */}
          {offers.length > 0 && <h2 className="text-[16px] font-medium text-ink mb-3">Shifts</h2>}
          {shifts.length === 0 && offers.length === 0 ? (
            <div className="dashboard-card text-center py-16 text-gray-400">
              <Calendar size={48} className="mx-auto mb-4 opacity-50" />
              <p>No agency shifts booked yet.</p>
            </div>
          ) : shifts.length === 0 ? (
            <div className="dashboard-card text-center py-8 text-gray-400">
              <p className="text-sm">No confirmed shifts yet.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {shifts.map((b) => (
                <div key={b.id} className="dashboard-card flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-ink">{b.employer_name || 'Property'}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                      <span className="flex items-center space-x-1"><Calendar size={14} /><span>{b.shift_date ? new Date(b.shift_date).toLocaleDateString() : 'Date TBC'}</span></span>
                      {b.shift_type && <span className="flex items-center space-x-1"><Clock size={14} /><span>{b.shift_type}</span></span>}
                      {b.hours && <span>{b.hours}h</span>}
                    </div>
                  </div>
                  <div className="text-right">
                    {b.rate && <p className="font-medium text-ink">£{b.rate}/day</p>}
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[b.status] || ''}`}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}
