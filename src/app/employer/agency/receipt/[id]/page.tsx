'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import PaymentDocument from '@/components/PaymentDocument'
import { AGENCY_PLATFORM_FEE_PCT } from '@/lib/constants'
import type { BillingIdentity } from '@/lib/billing-identity'
import { createClient } from '@/lib/supabase/client'

// Printable receipt for a paid agency booking - what accountants ask for.
// Print to PDF via the browser; everything on this page is print-safe.

export default function AgencyReceiptPage() {
  const params = useParams()
  const id = params?.id as string
  const [booking, setBooking] = useState<any>(null)
  const [identity, setIdentity] = useState<BillingIdentity | null>(null)
  // Read from the property's own profile rather than the booking payload: that
  // payload is shared with the professional on the other side of the shift,
  // and a property's purchase order is not theirs to see.
  const [poRef, setPoRef] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const [res, identityRes] = await Promise.all([
          fetch('/api/agency/booking'),
          fetch('/api/billing-identity', { cache: 'no-store' }).catch(() => null),
        ])
        if (res.ok) {
          const j = await res.json()
          setBooking((j.bookings || []).find((b: any) => b.id === id && b.viewer_role === 'employer') || null)
        }
        if (identityRes?.ok) {
          const json = await identityRes.json().catch(() => null)
          if (json?.identity) setIdentity(json.identity)
        }
        const supabase = createClient()
        const { data: auth } = await supabase.auth.getUser()
        if (auth.user) {
          const { data: profile } = await supabase.from('employer_profiles').select('purchase_order_ref').eq('user_id', auth.user.id).maybeSingle()
          setPoRef(profile?.purchase_order_ref || '')
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
  const ref = `Talent House-${String(booking.id).slice(0, 8).toUpperCase()}`

  return (
    <PaymentDocument
      identity={identity}
      reference={ref}
      issuedAt={booking.paid_at}
      buyerName={booking.employer_name}
      poNumber={poRef}
      lines={[
        {
          description: `Agency therapist cover - ${booking.candidate_name}`,
          detail: `Shift on ${booking.shift_date ? new Date(booking.shift_date).toLocaleDateString('en-GB') : 'agreed date'}${booking.shift_type ? ` \u00b7 ${booking.shift_type}` : ''} \u00b7 ${hours}h \u00d7 \u00a3${booking.rate}/hr`,
          amount: subtotal,
        },
        { description: `Talent House platform fee (${feePct}%)`, amount: fee },
      ]}
      total={total}
      backHref="/employer/agency"
      backLabel="Agency Bookings"
      notes={[
        'Payment received in full by Talent House Collective, who manages the professional payout after the completed shift.',
        ...(booking.refund_amount
          ? [`A refund of \u00a3${booking.refund_amount} was subsequently agreed on this booking${booking.refunded_at ? ` (${new Date(booking.refunded_at).toLocaleDateString('en-GB')})` : ''}.`]
          : []),
      ]}
    />
  )
}
