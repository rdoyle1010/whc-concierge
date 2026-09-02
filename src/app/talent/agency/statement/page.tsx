'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Printer, ArrowLeft } from 'lucide-react'

// Monthly payout statement for therapists - every paid shift and the full
// agreed earnings that land (or will land) in their pocket. Print-safe.

export default function PayoutStatementPage() {
  const [bookings, setBookings] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [month, setMonth] = useState('') // YYYY-MM

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/agency/booking')
        if (res.ok) {
          const j = await res.json()
          const mine = (j.bookings || []).filter((b: any) => b.viewer_role === 'candidate' && b.paid_at)
          setBookings(mine)
          if (mine.length > 0) setMonth(String(mine[0].shift_date || '').slice(0, 7))
        }
      } catch { /* shown as empty */ }
      setLoading(false)
    }
    load()
  }, [])

  const months = useMemo(() => {
    const s = new Set<string>()
    for (const b of bookings) if (b.shift_date) s.add(String(b.shift_date).slice(0, 7))
    return Array.from(s).sort().reverse()
  }, [bookings])

  const rows = bookings.filter(b => String(b.shift_date || '').slice(0, 7) === month)
  const effHours = (b: any) => (b.hours && b.hours > 0 ? b.hours : 8)
  const gross = (b: any) => b.rate * effHours(b)
  const payoutOf = (b: any) => b.payout_amount ?? gross(b)
  const statusOf = (b: any) => b.dispute_status === 'open' ? 'On hold' : b.payout_status === 'paid' ? 'Paid' : 'Pending'

  const totals = rows.reduce((t, b) => ({
    earned: t.earned + gross(b), payout: t.payout + payoutOf(b),
    paid: t.paid + (statusOf(b) === 'Paid' ? payoutOf(b) : 0),
    pending: t.pending + (statusOf(b) === 'Pending' ? payoutOf(b) : 0),
  }), { earned: 0, payout: 0, paid: 0, pending: 0 })

  const monthLabel = month ? new Date(`${month}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : ''

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden border-b border-[#e0dad2] px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/talent/agency" className="text-[13px] text-secondary hover:text-black inline-flex items-center gap-1.5"><ArrowLeft size={14} /> Agency Shifts</Link>
        <div className="flex items-center gap-3">
          {months.length > 0 && (
            <select aria-label="Statement month" value={month} onChange={e => setMonth(e.target.value)} className="input-field !w-auto !py-1.5 text-[12px]">
              {months.map(m => <option key={m} value={m}>{new Date(`${m}-01T12:00:00Z`).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</option>)}
            </select>
          )}
          <button onClick={() => window.print()} className="btn-primary text-[13px] inline-flex items-center gap-2"><Printer size={14} /> Print / Save as PDF</button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-[22px] font-serif font-bold text-black">Wellness House Collective</p>
            <p className="text-[12px] text-secondary">talent.wellnesshousecollective.co.uk</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-semibold text-black">PAYOUT STATEMENT</p>
            <p className="text-[12px] text-secondary">{monthLabel}</p>
          </div>
        </div>

        {rows.length === 0 ? (
          <p className="text-muted text-center py-16">No paid shifts {monthLabel ? `in ${monthLabel}` : 'yet'}.</p>
        ) : (
          <>
            <table className="w-full text-left text-[13px] mb-8">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-muted border-b border-[#e0dad2]">
                  <th className="py-2 pr-3">Date</th>
                  <th className="py-2 pr-3">Property</th>
                  <th className="py-2 pr-3 text-right">Hours</th>
                  <th className="py-2 pr-3 text-right">Agreed earnings</th>
                  <th className="py-2 pr-3 text-right">Your payout</th>
                  <th className="py-2 text-right">Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.map(b => (
                  <tr key={b.id} className="border-b border-[#e0dad2]">
                    <td className="py-2.5 pr-3 whitespace-nowrap">{b.shift_date ? new Date(b.shift_date).toLocaleDateString('en-GB') : '-'}</td>
                    <td className="py-2.5 pr-3">{b.employer_name}</td>
                    <td className="py-2.5 pr-3 text-right">{effHours(b)}</td>
                    <td className="py-2.5 pr-3 text-right">£{gross(b).toFixed(2)}</td>
                    <td className="py-2.5 pr-3 text-right font-medium text-black">£{payoutOf(b).toFixed(2)}</td>
                    <td className="py-2.5 text-right">
                      <span className={`text-[11px] font-medium ${statusOf(b) === 'Paid' ? 'text-green-700' : statusOf(b) === 'On hold' ? 'text-amber-600' : 'text-secondary'}`}>{statusOf(b)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="font-semibold text-black">
                  <td className="py-3 pr-3" colSpan={3}>Totals</td>
                  <td className="py-3 pr-3 text-right">£{totals.earned.toFixed(2)}</td>
                  <td className="py-3 pr-3 text-right">£{totals.payout.toFixed(2)}</td>
                  <td className="py-3"></td>
                </tr>
              </tfoot>
            </table>

            <div className="grid grid-cols-2 gap-3 mb-8 print:hidden">
              <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-muted mb-1">Paid to you this month</p><p className="text-[20px] font-semibold text-green-700">£{totals.paid.toFixed(2)}</p></div>
              <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-muted mb-1">Still to come</p><p className="text-[20px] font-semibold text-amber-600">£{totals.pending.toFixed(2)}</p></div>
            </div>

            <div className="text-[11px] text-muted space-y-1 border-t border-[#e0dad2] pt-6">
              <p>Your agreed earnings are your hourly rate × hours. Properties pay Wellness House Collective, and WHC pays you 100% of that agreed shift amount after each completed shift. You are responsible for your own tax and National Insurance as a self-employed professional.</p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
