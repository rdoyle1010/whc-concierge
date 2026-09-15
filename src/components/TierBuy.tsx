'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { LIBRARY_PLAN } from '@/lib/documents/library-plan'
import { packBySlug } from '@/lib/documents/pricing'
import BuyButton from '@/components/BuyButton'

// Whether one of the big packs can be bought yet.
//
// Same rule as everywhere else: a pack goes on sale when every document in it
// is signed off, and until then it says how far along it is. The complete
// library at two and a half thousand pounds is precisely the order where
// receiving a fraction of it ends the relationship.

export default function TierBuy({ slug, label }: { slug: string; label: string }) {
  const [ready, setReady] = useState<number | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  const pack = packBySlug(slug)
  const total = pack ? LIBRARY_PLAN.filter(entry => pack.includes(entry.reference)).length : 0

  useEffect(() => {
    if (!pack) return
    fetch('/api/standards')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data || data.unavailable) { setUnavailable(true); return }
        const approved = new Set((data.available || []).map((entry: any) => entry.reference))
        setReady(LIBRARY_PLAN.filter(entry => pack.includes(entry.reference) && approved.has(entry.reference)).length)
      })
      .catch(() => setUnavailable(true))
  }, [slug])

  if (!pack) return null

  // The shelf could not be read. Offer the button anyway rather than nothing.
  //
  // This returned null while loading and null for ever if the request failed,
  // so a tier card worth two and a half thousand pounds rendered with no way
  // to buy it and no explanation, and it looked exactly like a page that had
  // finished loading. The checkout is the authority on what can be sold and
  // now says so before asking anybody to make an account, so the worst this
  // can do is show a button that answers honestly when pressed. That is
  // better in every case than a card with nothing under it.
  if (unavailable || ready === null) {
    return (
      <div className="mt-5">
        <BuyButton packSlug={slug} label={label} />
      </div>
    )
  }

  if (ready >= total) {
    return (
      <div className="mt-5">
        <BuyButton packSlug={slug} label={label} />
      </div>
    )
  }

  return (
    <div className="mt-5 flex flex-wrap items-center gap-4">
      <Link href="/contact"
        className="inline-flex items-center border border-[#1c1c1c] px-4 py-2 text-[13px] font-semibold text-[#1c1c1c]">
        Ask us about this
      </Link>
      <p className="text-[13px] text-[#6b6b6b]">
        {ready} of {total} signed off. We do not sell a pack part-finished.
      </p>
    </div>
  )
}
