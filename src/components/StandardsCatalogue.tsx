'use client'

import { useEffect, useState } from 'react'
import { departmentPacks, formatPrice } from '@/lib/documents/pricing'
import { LIBRARY_PLAN } from '@/lib/documents/library-plan'
import StandardsList from '@/components/StandardsList'

// The shelf, and how much of it is actually stocked.
//
// A shop listing four hundred and sixty documents that can deliver one is a
// shop found out on its first order, so this counts what is signed off and
// says so per department. Being honest about it is not a weakness here: a
// buyer who is told "eleven of twenty-four ready, the rest this month" trusts
// the eleven. A buyer who orders twenty-four and receives eleven does not
// come back, and tells people.

type Available = { reference: string; title: string; department: string; tier: string | null }

export default function StandardsCatalogue() {
  const [available, setAvailable] = useState<Available[] | null>(null)
  const [unavailable, setUnavailable] = useState(false)

  useEffect(() => {
    fetch('/api/standards')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) { setUnavailable(true); return }
        setUnavailable(Boolean(data.unavailable))
        setAvailable(data.available || [])
      })
      .catch(() => setUnavailable(true))
  }, [])

  const packs = departmentPacks()
  const readyIn = (department: string) =>
    (available || []).filter(entry => entry.department === department).length
  const readyTotal = available?.length ?? 0

  return (
    <section className="border-b border-[#dddddd]" id="departments">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h2 className="text-[28px] font-semibold text-[#1c1c1c] md:text-[32px]">By department</h2>
          {available !== null && !unavailable && (
            <p className="text-[13px] text-[#6b6b6b]">
              {readyTotal} of {LIBRARY_PLAN.length} ready to send today
            </p>
          )}
        </div>

        {unavailable && (
          <p className="mt-6 border border-[#dddddd] bg-[#f1f1f1] px-4 py-3 text-[13px] text-[#555555]">
            We cannot reach the library just now. The prices below are right; ask us and we will confirm what is
            ready before you pay anything.
          </p>
        )}

        <div className="mt-8 border-t border-[#dddddd]">
          {packs.map(pack => {
            const ready = readyIn(pack.department || '')
            return (
              <div key={pack.slug}
                className="flex flex-wrap items-baseline justify-between gap-x-8 gap-y-2 border-b border-[#dddddd] py-5">
                <div className="min-w-0 flex-1">
                  <h3 className="text-[17px] font-semibold text-[#1c1c1c]">{pack.name}</h3>
                  <p className="mt-1 text-[13px] text-[#6b6b6b]">
                    {pack.count} documents
                    {available !== null && !unavailable && (
                      ready >= pack.count
                        ? ' · all ready'
                        : ready > 0
                          ? ` · ${ready} ready now, the rest in preparation`
                          : ' · in preparation'
                    )}
                  </p>
                </div>
                <p className="font-serif text-[22px] text-[#1c1c1c]">{formatPrice(pack.price)}</p>
              </div>
            )
          })}
        </div>

        {available !== null && !unavailable && readyTotal < LIBRARY_PLAN.length && (
          <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-[#555555]">
            {/* Said plainly rather than hidden. A buyer told what is ready
                trusts what is ready; a buyer who orders a department and
                receives half of it does not come back, and tells people. */}
            The library is being written and signed off department by department, and nothing is sold before it
            has been read by a person. If what you need is still in preparation, tell us and we will prioritise
            it and hold the price.
          </p>
        )}
      </div>

      {/* The packs above price a department. This lists what is in it, by
          name, which is the question a buyer actually arrives with. She
          signed a document off and could not find it on her own shop,
          because nothing here ever listed a document. */}
      <StandardsList available={available} unavailable={unavailable} />
    </section>
  )
}
