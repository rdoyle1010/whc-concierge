'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import PaymentDocument from '@/components/PaymentDocument'
import type { BillingIdentity } from '@/lib/billing-identity'

// Every non-agency purchase prints through here: memberships, job adverts,
// featured placements, residency listings, Academy. The amount comes from the
// purchase ledger, so it is what actually left the account after any discount
// or promotion code - not a list price looked up afterwards.

export default function PurchaseReceipt({ id, backHref, backLabel, buyerName }: {
  id: string; backHref: string; backLabel: string; buyerName: string
}) {
  const [purchase, setPurchase] = useState<any>(null)
  const [identity, setIdentity] = useState<BillingIdentity | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const [purchasesRes, identityRes] = await Promise.all([
        fetch('/api/purchases', { cache: 'no-store' }).catch(() => null),
        fetch('/api/billing-identity', { cache: 'no-store' }).catch(() => null),
      ])
      if (purchasesRes?.ok) {
        const json = await purchasesRes.json().catch(() => null)
        setPurchase((json?.purchases || []).find((row: any) => row.id === id) || null)
      }
      if (identityRes?.ok) {
        const json = await identityRes.json().catch(() => null)
        if (json?.identity) setIdentity(json.identity)
      }
      setLoading(false)
    }
    load()
  }, [id])

  if (loading) return <div className="min-h-screen bg-white flex items-center justify-center"><div className="animate-spin w-8 h-8 border-2 border-ink border-t-transparent rounded-full" /></div>
  if (!purchase || purchase.status !== 'paid') {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-secondary">Receipt not available - this payment has not completed, or it belongs to another account.</p>
        <Link href={backHref} className="btn-secondary text-[13px]">{backLabel}</Link>
      </div>
    )
  }

  return (
    <PaymentDocument
      identity={identity}
      reference={purchase.reference}
      issuedAt={purchase.paidAt}
      buyerName={buyerName}
      poNumber={purchase.poNumber}
      lines={[{ description: purchase.label, detail: `Purchased ${new Date(purchase.paidAt).toLocaleDateString('en-GB')}`, amount: purchase.amount }]}
      total={purchase.amount}
      backHref={backHref}
      backLabel={backLabel}
      notes={['Paid in full by card at the time of purchase.']}
    />
  )
}
