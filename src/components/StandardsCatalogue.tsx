'use client'

import { useEffect, useState } from 'react'
import { departmentPacks, journeyPacks, formatPrice, type Prices } from '@/lib/documents/pricing'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import StandardsList from '@/components/StandardsList'
import PackContents, { type PackFile } from '@/components/PackContents'
import StandardsTools, { type Tool } from '@/components/StandardsTools'
import BuyButton from '@/components/BuyButton'
import Link from 'next/link'

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
  // Live prices and her own bundles, rather than the constants in the code.
  const [prices, setPrices] = useState<Prices>({})
  const [bundles, setBundles] = useState<
    { slug: string; name: string; blurb: string | null; price: number; references: string[] }[]
  >([])
  // The files that travel with a pack. Named on the card, because whether the
  // reporting pack is a real workbook or a picture of one is the question
  // that decides the sale, and it was only answerable after paying.
  const [files, setFiles] = useState<PackFile[]>([])
  const [tools, setTools] = useState<Tool[]>([])

  useEffect(() => {
    fetch('/api/standards')
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (!data) { setUnavailable(true); return }
        setUnavailable(Boolean(data.unavailable))
        setAvailable(data.available || [])
        setPrices(data.prices || {})
        setBundles(data.bundles || [])
        setFiles(data.files || [])
        setTools(data.tools || [])
      })
      .catch(() => setUnavailable(true))
  }, [])

  const packs = departmentPacks(prices)
  const stages = journeyPacks(prices)

  // Counted against the catalogue, not against the table.
  //
  // The shop once read "483 of 477 ready to send today", which is not a
  // number a buyer forgives: the numerator was every signed-off row in the
  // database and the denominator was only what is for sale, so retired
  // references and anything written outside the catalogue inflated it past
  // its own total. A stock figure that exceeds the stock reads as a shop
  // that does not know what it has.
  const catalogueReferences = new Set(sellableCatalogue().map(entry => entry.reference))
  const readyReferences = (available || [])
    .map(entry => entry.reference)
    .filter(reference => catalogueReferences.has(reference))
  const readySet = new Set(readyReferences)
  // By what the pack actually contains rather than by a department label,
  // for the same reason: a pool plan carrying a department name would count
  // towards a department pack that does not include it.
  const readyIn = (pack: { includes: (reference: string) => boolean }) =>
    readyReferences.filter(reference => pack.includes(reference)).length
  const readyTotal = readySet.size

  // Which references a pack covers, and which files come with it.
  const referencesIn = (pack: { includes: (reference: string) => boolean }) =>
    sellableCatalogue().map(entry => entry.reference).filter(reference => pack.includes(reference))
  const filesFor = (slug: string) => files.filter(file => file.packSlugs.includes(slug))

  return (
    <>
    {/* The cheapest way into this shop, above the packs. A visitor who is not
        spending eight hundred pounds today will spend two hundred and come
        back, and a tool listed under a department pack is a tool nobody
        finds. */}
    <StandardsTools files={files} tools={tools} />

    {/* The guest journey first, and departments underneath.
        A department pack asks a buyer to know which team owns a procedure.
        A stage asks where in a visit the problem is, which is the question
        they arrived with: "our arrivals are a mess" is how this gets said
        out loud, and arrivals are reception, housekeeping and membership at
        once. */}
    <section className="border-b border-[#dddddd]" id="stages">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[28px] font-semibold text-[#1c1c1c] md:text-[32px]">By stage of the visit</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#555555]">
              A guest arrives, is welcomed, has their treatment, pays and leaves, and somebody decides whether
              they come back. Each pack below is everything that part of your operation needs in writing,
              across every team it touches.
            </p>
          </div>
          {available !== null && !unavailable && (
            <p className="text-[13px] text-[#6b6b6b]">
              {readyTotal} of {sellableCatalogue().length} ready to send today
            </p>
          )}
        </div>

        <div className="mt-9 grid gap-px border border-[#dddddd] bg-[#dddddd] sm:grid-cols-2 lg:grid-cols-3">
          {stages.filter(stage => stage.group === 'visit').map(stage => {
            const ready = readyIn(stage)
            const all = ready >= stage.count && stage.count > 0
            return (
              <div key={stage.slug} className="flex flex-col bg-white p-6">
                <h3 className="text-[19px] font-semibold text-[#1c1c1c]">{stage.name}</h3>
                <p className="mt-2 font-serif text-[26px] text-[#1c1c1c]">{formatPrice(stage.price)}</p>
                <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-[#555555]">{stage.detail}</p>
                <p className="mt-4 text-[12px] text-[#6b6b6b]">
                  {stage.count} documents
                  {available !== null && !unavailable && (
                    all ? ' · all ready' : ready > 0 ? ` · ${ready} ready now` : ' · in preparation'
                  )}
                </p>
                <PackContents name={stage.name} price={formatPrice(stage.price)} detail={stage.detail}
                  references={referencesIn(stage)}
                  files={filesFor(stage.slug)} readySet={readySet} showReady={!all} />
                <div className="mt-4">
                  {available !== null && !unavailable && (
                    all
                      ? <BuyButton packSlug={stage.slug} label={`Buy ${stage.name.toLowerCase()}`} />
                      : <Link href="/contact"
                          className="inline-block border border-[#dddddd] px-3 py-2 text-[13px] font-medium text-[#555555]">
                          Ask us
                        </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {/* The half of the operation a guest never sees, and the half that
            is most often missing. Separated rather than mixed in, because
            these are bought by different people in different weeks: a
            finance manager and a spa therapist are not shopping for the
            same thing on the same afternoon. */}
        <h3 className="mt-14 text-[22px] font-semibold text-[#1c1c1c]">Behind the scenes</h3>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#555555]">
          The half a guest never sees, and usually the half that is missing. Each of these is a part of the
          operation somebody owns, and the documents they need to own it properly.
        </p>

        <div className="mt-7 grid gap-px border border-[#dddddd] bg-[#dddddd] sm:grid-cols-2 lg:grid-cols-3">
          {stages.filter(stage => stage.group === 'behind').map(stage => {
            const ready = readyIn(stage)
            const all = ready >= stage.count && stage.count > 0
            return (
              <div key={stage.slug} className="flex flex-col bg-white p-6">
                <h4 className="text-[19px] font-semibold text-[#1c1c1c]">{stage.name}</h4>
                <p className="mt-2 font-serif text-[26px] text-[#1c1c1c]">{formatPrice(stage.price)}</p>
                <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-[#555555]">{stage.detail}</p>
                <p className="mt-4 text-[12px] text-[#6b6b6b]">
                  {stage.count} documents
                  {available !== null && !unavailable && (
                    all ? ' · all ready' : ready > 0 ? ` · ${ready} ready now` : ' · in preparation'
                  )}
                </p>
                <PackContents name={stage.name} price={formatPrice(stage.price)} detail={stage.detail}
                  references={referencesIn(stage)}
                  files={filesFor(stage.slug)} readySet={readySet} showReady={!all} />
                <div className="mt-4">
                  {available !== null && !unavailable && (
                    all
                      ? <BuyButton packSlug={stage.slug} label={`Buy ${stage.name.toLowerCase()}`} />
                      : <Link href="/contact"
                          className="inline-block border border-[#dddddd] px-3 py-2 text-[13px] font-medium text-[#555555]">
                          Ask us
                        </Link>
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <p className="mt-6 max-w-2xl text-[13px] leading-relaxed text-[#555555]">
          Each pack is priced at roughly a third of its documents bought one at a time. Buying every pack costs
          more than the complete library, so if you want most of them, buy the library. The risk assessment
          suite and the safety operating procedure are sold on their own and are in the library, not in these.
        </p>
      </div>
    </section>

    <section className="border-b border-[#dddddd]" id="departments">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-[28px] font-semibold text-[#1c1c1c] md:text-[32px]">By department</h2>
            <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#555555]">
              If you are equipping one team rather than one stage. Everything that team owns, whatever part of
              the visit it falls in.
            </p>
          </div>
        </div>

        {unavailable && (
          <p className="mt-6 border border-[#dddddd] bg-[#f1f1f1] px-4 py-3 text-[13px] text-[#555555]">
            We cannot reach the library just now. The prices below are right; ask us and we will confirm what is
            ready before you pay anything.
          </p>
        )}

        <div className="mt-8 border-t border-[#dddddd]">
          {packs.map(pack => {
            const ready = readyIn(pack)
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
                  <PackContents name={pack.name} price={formatPrice(pack.price)}
                    references={referencesIn(pack)}
                    files={filesFor(pack.slug)} readySet={readySet} showReady={ready < pack.count} />
                </div>
                <div className="flex items-center gap-5">
                  <p className="font-serif text-[22px] text-[#1c1c1c]">{formatPrice(pack.price)}</p>
                  {/* Buyable only when every document in it is signed off.
                      A pack sold part-finished is a refund and a story told
                      to every other spa director in the county, and the
                      alternative costs nothing but patience. */}
                  {available !== null && !unavailable && (
                    ready >= pack.count ? (
                      <BuyButton packSlug={pack.slug} label="Buy this pack" />
                    ) : (
                      <Link href="/contact"
                        className="border border-[#dddddd] px-3 py-2 text-[13px] font-medium text-[#555555]">
                        Ask us
                      </Link>
                    )
                  )}
                </div>
              </div>
            )
          })}
        </div>

        {available !== null && !unavailable && readyTotal < sellableCatalogue().length && (
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

      {/* Her own bundles, above the departments, because a bundle she built
          deliberately is a better answer than a department somebody has to
          assemble for themselves. */}
      {bundles.length > 0 && (
        <div className="mx-auto max-w-5xl px-6 pb-14 lg:px-8">
          <h3 className="text-[20px] font-semibold text-[#1c1c1c]">Bundles</h3>
          <div className="mt-5 border-t border-[#dddddd]">
            {bundles.map(bundle => {
              const ready = bundle.references.filter(reference => readySet.has(reference)).length
              const all = ready === bundle.references.length && bundle.references.length > 0
              return (
                <div key={bundle.slug}
                  className="flex flex-wrap items-start justify-between gap-x-8 gap-y-3 border-b border-[#dddddd] py-5">
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[17px] font-semibold text-[#1c1c1c]">{bundle.name}</h4>
                    {bundle.blurb && <p className="mt-1.5 max-w-2xl text-[14px] leading-relaxed text-[#555555]">{bundle.blurb}</p>}
                    <p className="mt-1.5 text-[13px] text-[#6b6b6b]">
                      {bundle.references.length} documents
                      {available !== null && !unavailable && (all ? ' · all ready' : ` · ${ready} ready now, the rest in preparation`)}
                    </p>
                    <PackContents name={bundle.name} price={formatPrice(bundle.price)}
                      detail={bundle.blurb || undefined} references={bundle.references}
                      files={filesFor(bundle.slug)} readySet={readySet} showReady={!all} />
                  </div>
                  <div className="flex shrink-0 items-center gap-5">
                    <p className="font-serif text-[22px] text-[#1c1c1c]">{formatPrice(bundle.price)}</p>
                    {available !== null && !unavailable && (
                      all
                        ? <BuyButton packSlug={bundle.slug} label="Buy this bundle" />
                        : <Link href="/contact" className="border border-[#dddddd] px-3 py-2 text-[13px] font-medium text-[#555555]">Ask us</Link>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* The packs above price a department. This lists what is in it, by
          name, which is the question a buyer actually arrives with. She
          signed a document off and could not find it on her own shop,
          because nothing here ever listed a document. */}
      <StandardsList available={available} unavailable={unavailable} prices={prices} />
    </section>
    </>
  )
}