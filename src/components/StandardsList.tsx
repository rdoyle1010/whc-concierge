'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { LIBRARY_PLAN } from '@/lib/documents/library-plan'
import { SINGLE_DOCUMENT_PRICE, formatPrice } from '@/lib/documents/pricing'
import BuyButton from '@/components/BuyButton'

// Every document, by name, whether it is ready or not.
//
// The packs above answer "what does a department cost". They do not answer
// the question a spa director actually arrives with, which is "do you have
// the one about legionella". Four hundred and sixty titles counted but never
// listed is a shop with the stock in the back room: she signed one off and
// could not find it on her own site, and neither could a buyer.
//
// So the whole plan is listed, searchable, with each title marked ready or in
// preparation. Listing what is not written yet is deliberate and it is the
// commercially stronger move: the depth is the product, and a buyer who can
// see the document they need exists, even unwritten, asks for it. A buyer who
// sees eleven titles assumes there are eleven.

type Props = { available: { reference: string; department: string }[] | null; unavailable: boolean }

export default function StandardsList({ available, unavailable }: Props) {
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  const [readyOnly, setReadyOnly] = useState(false)

  const ready = useMemo(
    () => new Set((available || []).map(entry => entry.reference)),
    [available],
  )

  const departments = useMemo(
    () => Array.from(new Set(LIBRARY_PLAN.map(item => item.department))).sort(),
    [],
  )

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return LIBRARY_PLAN.filter(item => {
      if (department !== 'all' && item.department !== department) return false
      if (readyOnly && !ready.has(item.reference)) return false
      if (!needle) return true
      return item.title.toLowerCase().includes(needle)
        || item.reference.toLowerCase().includes(needle)
        || item.department.toLowerCase().includes(needle)
    })
  }, [query, department, readyOnly, ready])

  const readyShown = rows.filter(item => ready.has(item.reference)).length

  return (
    <section className="border-b border-[#dddddd]" id="every-document">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[28px] font-semibold text-[#1c1c1c] md:text-[32px]">Every document</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#555555]">
              The full library, by name. Anything marked ready can be sent today at {formatPrice(SINGLE_DOCUMENT_PRICE)}
              {' '}on its own, or inside its department pack. Tell us which you need and we will confirm before you pay.
            </p>
          </div>
        </div>

        <div className="mt-7 flex flex-wrap items-center gap-3">
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8a8a8a]" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by title, reference or department"
              aria-label="Search the document library"
              className="w-full border border-[#dddddd] py-2.5 pl-9 pr-3 text-[14px] text-[#1c1c1c] placeholder:text-[#8a8a8a]"
            />
          </div>
          <select
            value={department}
            onChange={event => setDepartment(event.target.value)}
            aria-label="Filter by department"
            className="border border-[#dddddd] px-3 py-2.5 text-[14px] text-[#555555]"
          >
            <option value="all">Every department</option>
            {departments.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-[13px] text-[#555555]">
            <input
              type="checkbox"
              checked={readyOnly}
              onChange={event => setReadyOnly(event.target.checked)}
              className="h-3.5 w-3.5"
            />
            Ready today only
          </label>
        </div>

        {/* The count of what is on screen, and how much of it can actually be
            sent. A list that does not say this reads as availability. */}
        <p className="mt-4 text-[13px] text-[#6b6b6b]">
          {rows.length === LIBRARY_PLAN.length
            ? `${LIBRARY_PLAN.length} documents`
            : `${rows.length} of ${LIBRARY_PLAN.length} documents`}
          {available !== null && !unavailable && ` · ${readyShown} ready to send today`}
        </p>

        {rows.length === 0 ? (
          <p className="mt-8 text-[14px] text-[#555555]">
            Nothing matches that. Try a shorter search, or ask us: if it is not in the library we will write it.
          </p>
        ) : (
          <div className="mt-5 max-h-[620px] overflow-y-auto border-t border-[#dddddd]">
            {rows.map(item => {
              const isReady = ready.has(item.reference)
              return (
                <div
                  key={item.reference}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[#eeeeee] py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[#1c1c1c]">{item.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#8a8a8a]">
                      {item.reference} · {item.department}
                    </p>
                  </div>
                  {available === null || unavailable ? null : isReady ? (
                    // Bought on its own, from the list, without a basket or an
                    // account. A spa manager needing one procedure this
                    // afternoon is the most common buyer there is.
                    <BuyButton reference={item.reference} label={`Buy ${formatPrice(SINGLE_DOCUMENT_PRICE)}`} primary={false} />
                  ) : (
                    <span className="shrink-0 text-[11px] text-[#8a8a8a]">In preparation</span>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </section>
  )
}
