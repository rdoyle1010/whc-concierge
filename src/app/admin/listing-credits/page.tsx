'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Check, Gift, Loader2, Search } from 'lucide-react'

// Giving a property free listings, by name, in one click.
//
// This is the thing a discount code was being used to do, badly. A property
// with credits on its account sees "this role publishes without payment" when
// it posts, and never meets a payment page at all - no code to type, no code
// to lose, nothing for Stripe to reject.

type Property = {
  id: string
  property_name: string | null
  company_name: string | null
  launch_listing_credits: number
  approval_status: string | null
  contact_email: string | null
}

export default function ListingCreditsPage() {
  const [properties, setProperties] = useState<Property[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)
  const [error, setError] = useState('')

  const load = useCallback(async (q: string) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/listing-credits?q=${encodeURIComponent(q)}`, { cache: 'no-store' })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Could not load the properties')
      setProperties(data.properties || [])
      setError('')
    } catch (e: any) {
      setError(e?.message || 'Could not load the properties')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => load(search), search ? 300 : 0)
    return () => clearTimeout(timer)
  }, [search, load])

  async function change(property: Property, body: Record<string, number>) {
    setBusy(property.id)
    setError('')
    try {
      const res = await fetch('/api/admin/listing-credits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employerId: property.id, ...body }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'That did not work')
      setProperties(list => list.map(p => (p.id === property.id ? { ...p, launch_listing_credits: data.credits } : p)))
      setDone(property.id)
      setTimeout(() => setDone(null), 2500)
    } catch (e: any) {
      setError(e?.message || 'That did not work')
    } finally {
      setBusy(null)
    }
  }

  const name = (p: Property) => p.company_name || p.property_name || 'Unnamed property'

  return (
    <DashboardShell role="admin">
      <div className="max-w-4xl">
        <p className="dashboard-eyebrow">Controls</p>
        <h1 className="dashboard-title">Free Listings</h1>
        <p className="dashboard-intro">
          Put free Standard listings on a property&apos;s account. They see &quot;this role publishes
          without payment&quot; when they post, and never reach a payment page - no code to type and
          nothing for Stripe to reject.
        </p>

        <div className="mt-7 relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by property or company name"
            className="w-full border border-border bg-white py-2.5 pl-10 pr-3.5 text-[13px] text-ink placeholder:text-muted focus:border-accent focus:outline-none"
          />
        </div>

        {error && (
          <p className="mt-4 border border-[#d99089] bg-[#fbe9e7] px-4 py-3 text-[12.5px] text-[#8a1c14]">{error}</p>
        )}

        <div className="mt-5 border border-border bg-white">
          {loading ? (
            <p className="px-5 py-8 text-[13px] text-secondary inline-flex items-center gap-2">
              <Loader2 size={14} className="animate-spin" /> Loading properties...
            </p>
          ) : properties.length === 0 ? (
            <p className="px-5 py-8 text-[13px] text-secondary">
              {search ? `No property matches "${search}".` : 'No properties have registered yet.'}
            </p>
          ) : (
            <ul>
              {properties.map(property => (
                <li
                  key={property.id}
                  className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4 last:border-b-0"
                >
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink">{name(property)}</p>
                    <p className="mt-0.5 text-[11.5px] text-muted">
                      {property.launch_listing_credits > 0 ? (
                        <span className="font-semibold text-positive">
                          {property.launch_listing_credits} free{' '}
                          {property.launch_listing_credits === 1 ? 'listing' : 'listings'} on the account
                        </span>
                      ) : (
                        'No free listings'
                      )}
                      {property.approval_status && property.approval_status !== 'approved' && (
                        <span className="ml-2 text-[#7a4a00]">· {property.approval_status}</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    {done === property.id && (
                      <span className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-positive">
                        <Check size={13} /> Saved
                      </span>
                    )}
                    {busy === property.id ? (
                      <Loader2 size={15} className="animate-spin text-muted" />
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => change(property, { quantity: 1 })}
                          className="btn-secondary inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px]"
                        >
                          <Gift size={12} /> +1
                        </button>
                        <button
                          type="button"
                          onClick={() => change(property, { quantity: 3 })}
                          className="btn-secondary px-3 py-1.5 text-[12px]"
                        >
                          +3
                        </button>
                        {property.launch_listing_credits > 0 && (
                          <button
                            type="button"
                            onClick={() => change(property, { set: 0 })}
                            className="btn-secondary px-3 py-1.5 text-[12px] text-[#8a1c14]"
                          >
                            Clear
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="mt-8 border-t border-border pt-6">
          <p className="text-[13px] font-semibold text-ink">Why this rather than a discount code</p>
          <p className="mt-2 text-[12.5px] leading-6 text-secondary">
            A Stripe coupon scoped to specific products can never work here: every checkout on the
            platform builds its product inline, so there is no catalogue product for the coupon to
            attach to. That is the error you were seeing. A code that applies to everything does
            work, but it still sends a buyer to a payment page to pay nothing, and a code is one
            more thing to mistype on a call.
          </p>
          <p className="mt-2.5 text-[12.5px] leading-6 text-secondary">
            Credits skip all of it. They are consumed only by a Standard listing, one per role, and
            they do not expire. The property sees the balance on its own post-a-role page.
          </p>
        </div>
      </div>
    </DashboardShell>
  )
}
