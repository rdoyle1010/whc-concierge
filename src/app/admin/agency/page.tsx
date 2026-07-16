'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Banknote, CheckCircle2 } from 'lucide-react'

// WHC's agency money view: what each property has paid in, what each
// therapist is owed, and a one-click "mark paid out" once the bank
// transfer to the therapist has been made.

export default function AdminAgencyPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')

  async function load() {
    try {
      const res = await fetch('/api/admin/agency')
      if (res.ok) {
        const j = await res.json()
        setBookings(j.bookings || [])
      }
    } catch { /* empty state */ }
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  async function markPaidOut(bookingId: string) {
    setError('')
    setBusyId(bookingId)
    try {
      const res = await fetch('/api/admin/agency', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_paid_out', bookingId }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not update.'); return }
      await load()
    } catch {
      setError('Something went wrong - please try again.')
    } finally {
      setBusyId(null)
    }
  }

  const paidIn = bookings.filter(b => b.paid_at)
  const owed = paidIn.filter(b => b.payout_status !== 'paid')
  const totalCollected = paidIn.reduce((s, b) => s + (b.amount_paid || 0), 0)
  const totalOwed = owed.reduce((s, b) => s + (b.payout_amount || 0), 0)
  const margin = paidIn.reduce((s, b) => s + ((b.amount_paid || 0) - (b.payout_amount || 0)), 0)

  return (
    <DashboardShell role="admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Agency Money</h1>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <>
          {/* Totals */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="dashboard-card"><p className="eyebrow mb-1">Collected from properties</p><p className="text-[22px] font-semibold text-ink">£{totalCollected}</p></div>
            <div className="dashboard-card"><p className="eyebrow mb-1">Owed to therapists</p><p className="text-[22px] font-semibold text-amber-600">£{totalOwed}</p></div>
            <div className="dashboard-card"><p className="eyebrow mb-1">WHC margin (paid bookings)</p><p className="text-[22px] font-semibold text-green-700">£{margin}</p></div>
          </div>

          {bookings.length === 0 ? (
            <div className="dashboard-card text-center py-16 text-gray-400">
              <Banknote size={48} className="mx-auto mb-4 opacity-50" />
              <p>No agency bookings yet.</p>
            </div>
          ) : (
            <div className="dashboard-card overflow-x-auto">
              <table className="w-full text-left text-[13px]">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-border">
                    <th className="py-2 pr-4">Date</th>
                    <th className="py-2 pr-4">Property</th>
                    <th className="py-2 pr-4">Therapist</th>
                    <th className="py-2 pr-4">Rate</th>
                    <th className="py-2 pr-4">Status</th>
                    <th className="py-2 pr-4">Paid in</th>
                    <th className="py-2 pr-4">Payout due</th>
                    <th className="py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map(b => (
                    <tr key={b.id} className="border-b border-border/60">
                      <td className="py-2.5 pr-4 whitespace-nowrap">{b.shift_date ? new Date(b.shift_date).toLocaleDateString('en-GB') : '-'}</td>
                      <td className="py-2.5 pr-4">{b.employer_name}</td>
                      <td className="py-2.5 pr-4">{b.candidate_name}{b.candidate_phone ? <span className="block text-[11px] text-gray-400">{b.candidate_phone}</span> : null}</td>
                      <td className="py-2.5 pr-4 whitespace-nowrap">£{b.rate}/hr{b.hours ? ` × ${b.hours}h` : ''}</td>
                      <td className="py-2.5 pr-4 capitalize">{b.status}</td>
                      <td className="py-2.5 pr-4">{b.paid_at ? `£${b.amount_paid || '-'} on ${new Date(b.paid_at).toLocaleDateString('en-GB')}` : <span className="text-gray-400">not paid</span>}</td>
                      <td className="py-2.5 pr-4">{b.payout_amount ? `£${b.payout_amount}` : '-'}</td>
                      <td className="py-2.5 text-right">
                        {b.paid_at && b.payout_status !== 'paid' && (
                          <button onClick={() => markPaidOut(b.id)} disabled={busyId === b.id}
                            className="btn-secondary text-[11px] disabled:opacity-50 whitespace-nowrap">
                            {busyId === b.id ? 'Saving...' : 'Mark paid out'}
                          </button>
                        )}
                        {b.payout_status === 'paid' && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-green-700"><CheckCircle2 size={12} /> Paid out{b.payout_at ? ` ${new Date(b.payout_at).toLocaleDateString('en-GB')}` : ''}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </DashboardShell>
  )
}
