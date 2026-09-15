'use client'

import { useMemo, useState } from 'react'
import { Search } from 'lucide-react'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import { JOURNEY_STAGES, stageOf, kindOf, KIND_LABEL, type JourneyStage } from '@/lib/documents/journey'
import { formatPrice, singlePriceFor, cheapestSingle, type Prices } from '@/lib/documents/pricing'
import BuyButton from '@/components/BuyButton'
import type { Tool } from '@/components/StandardsTools'
import type { PackFile } from '@/components/PackContents'

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

type Props = {
  available: { reference: string; department: string }[] | null
  unavailable: boolean
  prices?: Prices
  /**
   * The tools and the files, so a search can find them.
   *
   * They are not documents and they are not in this list, which meant a
   * search for "audit" or "costings" or "staffing" returned nothing at all
   * while every one of those was a product on the same page. A search that
   * confidently says nothing matches is worse than no search: it does not
   * send somebody to look elsewhere, it tells them there is nothing there.
   */
  tools?: Tool[]
  files?: PackFile[]
}

export default function StandardsList({ available, unavailable, prices = {}, tools = [], files = [] }: Props) {
  // The cheapest kind, for the line that says what this list starts at.
  // Every row prices itself: a procedure and a pool emergency plan are not
  // the same purchase and a list that says they are is a list nobody trusts
  // once they have opened one of each.
  const from = cheapestSingle(prices)
  const [query, setQuery] = useState('')
  const [department, setDepartment] = useState('all')
  // Where in a visit it is used, and what kind of thing it is. A buyer
  // arrives asking "what covers our arrivals", not "what was a day one
  // document".
  const [stage, setStage] = useState<JourneyStage | 'all'>('all')
  const [kind, setKind] = useState('all')
  const [readyOnly, setReadyOnly] = useState(false)

  const ready = useMemo(
    () => new Set((available || []).map(entry => entry.reference)),
    [available],
  )

  const departments = useMemo(
    () => Array.from(new Set(sellableCatalogue().map(item => item.department))).sort(),
    [],
  )

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return sellableCatalogue().filter(item => {
      if (department !== 'all' && item.department !== department) return false
      if (stage !== 'all' && stageOf(item) !== stage) return false
      if (kind !== 'all' && kindOf(item.reference) !== kind) return false
      if (readyOnly && !ready.has(item.reference)) return false
      if (!needle) return true
      return item.title.toLowerCase().includes(needle)
        || item.reference.toLowerCase().includes(needle)
        || item.department.toLowerCase().includes(needle)
    })
  }, [query, department, stage, kind, readyOnly, ready])

  const readyShown = rows.filter(item => ready.has(item.reference)).length

  // Tools and files that match the same search. Only while somebody is
  // actually searching: listing them under every empty query would make this
  // section look like it sells four spreadsheets.
  const elsewhere = useMemo(() => {
    const needle = query.trim().toLowerCase()
    if (needle.length < 2) return []
    const fromTools = tools
      .filter(tool => `${tool.name} ${tool.blurb} ${tool.detail}`.toLowerCase().includes(needle))
      .map(tool => ({ key: tool.slug, name: tool.name, note: tool.blurb, price: tool.price }))
    const fromFiles = files
      .filter(file => file.slug && (file.price || 0) > 0)
      .filter(file => `${file.name} ${file.description || ''}`.toLowerCase().includes(needle))
      .map(file => ({ key: file.slug!, name: file.name, note: file.description || '', price: file.price! }))
    return [...fromTools, ...fromFiles]
  }, [query, tools, files])

  return (
    <section className="border-b border-[#dcd4c8]" id="every-document">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[28px] font-semibold text-[#222321] md:text-[32px]">Every document</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#57544c]">
              The full library, by name. Anything marked ready can be sent today on its own, from
              {' '}{formatPrice(from)}, or inside its pack. Each kind is priced for what it is: a procedure
              is not a pool emergency plan.
            </p>
          </div>
        </div>

        {/* The guest journey, first. Six buttons answer the question a spa
            manager actually arrives with, and the department filter below
            answers the one an operations director arrives with. */}
        <div className="mt-7 flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setStage('all')}
            className={stage === 'all'
              ? 'border border-[#28322b] bg-[#28322b] px-3 py-1.5 text-[12px] font-medium text-white'
              : 'border border-[#dcd4c8] px-3 py-1.5 text-[12px] text-[#57544c]'}>
            The whole library
          </button>
          {JOURNEY_STAGES.map(option => (
            <button key={option.slug} type="button" onClick={() => setStage(option.slug)} title={option.blurb}
              className={stage === option.slug
                ? 'border border-[#28322b] bg-[#28322b] px-3 py-1.5 text-[12px] font-medium text-white'
                : 'border border-[#dcd4c8] px-3 py-1.5 text-[12px] text-[#57544c]'}>
              {option.label}
              <span className="ml-1.5 opacity-60">
                {sellableCatalogue().filter(item => stageOf(item) === option.slug).length}
              </span>
            </button>
          ))}
        </div>

        {stage !== 'all' && (
          <p className="mt-3 max-w-2xl text-[13px] leading-relaxed text-[#57544c]">
            {JOURNEY_STAGES.find(option => option.slug === stage)?.blurb}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <select
            value={kind}
            onChange={event => setKind(event.target.value)}
            aria-label="Filter by kind of document"
            className="border border-[#dcd4c8] px-3 py-2.5 text-[14px] text-[#57544c]"
          >
            <option value="all">Every kind</option>
            {Array.from(new Set(sellableCatalogue().map(item => kindOf(item.reference)))).sort().map(code => (
              <option key={code} value={code}>{KIND_LABEL[code] || code}</option>
            ))}
          </select>
          <div className="relative min-w-[220px] flex-1">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7e7a70]" />
            <input
              type="search"
              value={query}
              onChange={event => setQuery(event.target.value)}
              placeholder="Search by title, reference or department"
              aria-label="Search the document library"
              className="w-full border border-[#dcd4c8] py-2.5 pl-9 pr-3 text-[14px] text-[#222321] placeholder:text-[#7e7a70]"
            />
          </div>
          <select
            value={department}
            onChange={event => setDepartment(event.target.value)}
            aria-label="Filter by department"
            className="border border-[#dcd4c8] px-3 py-2.5 text-[14px] text-[#57544c]"
          >
            <option value="all">Every department</option>
            {departments.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <label className="flex items-center gap-2 text-[13px] text-[#57544c]">
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
        <p className="mt-4 text-[13px] text-[#6e6a60]">
          {rows.length === sellableCatalogue().length
            ? `${sellableCatalogue().length} documents`
            : `${rows.length} of ${sellableCatalogue().length} documents`}
          {available !== null && !unavailable && ` · ${readyShown} ready to send today`}
        </p>

        {/* Said before the document list, because when the document list is
            empty this is the whole answer. */}
        {elsewhere.length > 0 && (
          <div className="mt-6 border border-[#28322b] p-5">
            <p className="text-[11px] uppercase tracking-[.12em] text-[#6e6a60]">
              Not a document, but we have {elsewhere.length === 1 ? 'this' : 'these'}
            </p>
            <ul className="mt-3 space-y-3">
              {elsewhere.map(match => (
                <li key={match.key} className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                  <span className="min-w-0 flex-1">
                    <span className="text-[15px] font-semibold text-[#222321]">{match.name}</span>
                    {match.note && (
                      <span className="block text-[13px] leading-relaxed text-[#57544c]">{match.note}</span>
                    )}
                  </span>
                  <span className="shrink-0 font-serif text-[18px] text-[#222321]">{formatPrice(match.price)}</span>
                </li>
              ))}
            </ul>
            <a href="#tools" className="mt-3 inline-block text-[13px] font-medium text-[#28322b] underline underline-offset-2">
              See it in Tools
            </a>
          </div>
        )}

        {rows.length === 0 ? (
          <p className="mt-8 text-[14px] text-[#57544c]">
            {elsewhere.length > 0
              ? 'No document matches that, but the tools above do.'
              : 'Nothing matches that. Try a shorter search, or ask us: if it is not in the library we will write it.'}
          </p>
        ) : (
          <div className="mt-5 max-h-[620px] overflow-y-auto border-t border-[#dcd4c8]">
            {rows.map(item => {
              const isReady = ready.has(item.reference)
              return (
                <div
                  key={item.reference}
                  className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1 border-b border-[#e7e1d6] py-3"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-[#222321]">{item.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-[#7e7a70]">
                      {item.reference} · {item.department}
                    </p>
                  </div>
                  {available === null || unavailable ? null : isReady ? (
                    // Bought on its own, from the list, without a basket or an
                    // account. A spa manager needing one procedure this
                    // afternoon is the most common buyer there is.
                    <BuyButton reference={item.reference} label={`Buy ${formatPrice(singlePriceFor(item.reference, prices))}`} primary={false} />
                  ) : (
                    <span className="shrink-0 text-[11px] text-[#7e7a70]">In preparation</span>
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
