'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Printer, ArrowLeft } from 'lucide-react'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'

// Printable receipt for a paid agency booking - what accountants ask for.
// Print to PDF via the browser; everything on this page is print-safe.

export default function AgencyReceiptPage() {
  const params = useParams()
  const id = params?.id as string
  const [booking, setBooking] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch('/api/agency/booking')
        if (res.ok) {
          const j = await res.json()
          setBooking((j.bookings || []).find((b: any) => b.id === id && b.viewer_role === 'employer') || null)
        }
      } catch { /* shown as not found */ }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>
  if (!booking || !booking.paid_at) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-secondary">Receipt not available - this booking has not been paid yet.</p>
        <Link href="/employer/agency" className="btn-secondary text-[13px]">Back to Agency Bookings</Link>
      </div>
    )
  }

  const hours = booking.hours && booking.hours > 0 ? booking.hours : 8
  const subtotal = booking.rate * hours
  const fee = booking.platform_fee || Math.ceil(subtotal * AGENCY_PLATFORM_FEE_PCT)
  // Derive the percentage from the stored amounts so urgent bookings (which
  // carry a higher fee) show their real rate, not the standard default.
  const feePct = subtotal > 0 && fee > 0 ? Math.round((fee / subtotal) * 100) : Math.round(AGENCY_PLATFORM_FEE_PCT * 100)
  const total = booking.amount_paid || subtotal + fee
  const ref = `WHC-${String(booking.id).slice(0, 8).toUpperCase()}`

  return (
    <div className="min-h-screen bg-white">
      {/* Toolbar - hidden when printing */}
      <div className="print:hidden border-b border-[#e0dad2] px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href="/employer/agency" className="text-[13px] text-secondary hover:text-black inline-flex items-center gap-1.5"><ArrowLeft size={14} /> Agency Bookings</Link>
        <button onClick={() => window.print()} className="btn-primary text-[13px] inline-flex items-center gap-2"><Printer size={14} /> Print / Save as PDF</button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between mb-10">
          <div>
            <p className="text-[22px] font-serif font-bold text-black">Wellness House Collective</p>
            <p className="text-[12px] text-secondary">talent.wellnesshousecollective.co.uk</p>
          </div>
          <div className="text-right">
            <p className="text-[13px] font-semibold text-black">RECEIPT</p>
            <p className="text-[12px] text-secondary">Ref: {ref}</p>
            <p className="text-[12px] text-secondary">Paid: {booking.paid_at ? new Date(booking.paid_at).toLocaleDateString('en-GB') : ''}</p>
          </div>
        </div>

        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Billed to</p>
          <p className="text-[14px] font-medium text-black">{booking.employer_name}</p>
        </div>

        <table className="w-full text-left text-[13px] mb-8">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted border-b border-[#e0dad2]">
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-[#e0dad2]">
              <td className="py-3 pr-4">
                Agency therapist cover - {booking.candidate_name}
                <span className="block text-[12px] text-secondary">
                  Shift on {booking.shift_date ? new Date(booking.shift_date).toLocaleDateString('en-GB') : 'agreed date'}{booking.shift_type ? ` · ${booking.shift_type}` : ''} · {hours}h × £{booking.rate}/hr
                </span>
              </td>
              <td className="py-3 pr-4 text-right">£{subtotal.toFixed(2)}</td>
            </tr>
            <tr className="border-b border-[#e0dad2]">
              <td className="py-3 pr-4">WHC platform fee ({feePct}%)</td>
              <td className="py-3 pr-4 text-right">£{fee.toFixed(2)}</td>
            </tr>
            <tr>
              <td className="py-3 pr-4 font-semibold text-black">Total paid</td>
              <td className="py-3 pr-4 text-right font-semibold text-black">£{total.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>

        {booking.refund_amount ? (
          <p className="text-[12px] text-secondary mb-6">A refund of £{booking.refund_amount} was subsequently agreed on this booking{booking.refunded_at ? ` (${new Date(booking.refunded_at).toLocaleDateString('en-GB')})` : ''}.</p>
        ) : null}

        <div className="text-[11px] text-muted space-y-1 border-t border-[#e0dad2] pt-6">
          <p>Payment received in full by Wellness House Collective, who manages the professional payout after the completed shift. No VAT has been charged on this receipt.</p>
          <p>Questions about this receipt? Reply to any WHC email or contact us through your dashboard.</p>
        </div>
      </div>
    </div>
  )
}
