'use client'

import { formatPrice } from '@/lib/documents/pricing'
import { readableSize } from '@/lib/documents/attachments'
import type { PackFile } from '@/components/PackContents'
import BuyButton from '@/components/BuyButton'

// The things that are not documents.
//
// An editable audit toolkit is a product, not an inclusion. It tells a spa
// director where they are losing money, it is the natural first purchase for
// somebody who is not ready to commit to a document library, and folding it
// into one department pack is the least valuable thing that can be done with
// it.
//
// Listed above the packs rather than below them for the same reason: it is
// the cheapest way into this shop, and a visitor who is not going to spend
// eight hundred pounds today will spend two hundred and come back.

const TONE: Record<string, string> = {
  Excel: 'border-[#1a6b3c]/40 text-[#1a6b3c]',
  Word: 'border-[#1c3f6b]/40 text-[#1c3f6b]',
  PowerPoint: 'border-[#8a3a14]/40 text-[#8a3a14]',
}

export type Tool = {
  slug: string
  name: string
  blurb: string
  detail: string
  price: number
  sheets: number
}

export type Toolkit = {
  slug: string
  name: string
  blurb: string
  detail: string
  price: number
  singly: number
  count: number
}

export default function StandardsTools(
  { files, tools, toolkit }: { files: PackFile[]; tools: Tool[]; toolkit: Toolkit | null },
) {
  const sold = files.filter(file => file.slug && (file.price || 0) > 0)
  if (!sold.length && !tools.length) return null

  return (
    <section className="border-b border-[#dddddd]" id="tools">
      <div className="mx-auto max-w-5xl px-6 py-16 lg:px-8">
        <h2 className="text-[28px] font-semibold text-[#1c1c1c] md:text-[32px]">Tools</h2>
        <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#555555]">
          Not everything worth having is a procedure. These are working files you complete with your own
          numbers, sold on their own and included with the packs they belong to.
        </p>

        {/* The bundle first. Four tools singly is more than the library
            costs to a buyer who is adding up, and the saving is worked out
            from the prices rather than typed beside them. */}
        {toolkit && tools.length > 1 && (
          <div className="mt-8 border border-[#1c1c1c] p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <h3 className="text-[21px] font-semibold text-[#1c1c1c]">{toolkit.name}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-[#1c1c1c]">{toolkit.blurb}</p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-serif text-[30px] leading-none text-[#1c1c1c]">{formatPrice(toolkit.price)}</p>
                <p className="mt-1.5 text-[12px] text-[#6b6b6b]">
                  {formatPrice(toolkit.singly)} bought separately
                </p>
              </div>
            </div>
            <p className="mt-3 max-w-2xl text-[13.5px] leading-relaxed text-[#555555]">{toolkit.detail}</p>
            <div className="mt-4">
              <BuyButton packSlug={toolkit.slug} label={`Buy all ${toolkit.count} tools`} />
            </div>
          </div>
        )}

        <div className="mt-8 grid gap-px border border-[#dddddd] bg-[#dddddd] sm:grid-cols-2">
          {tools.map(tool => (
            <div key={tool.slug} className="flex flex-col bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[19px] font-semibold leading-tight text-[#1c1c1c]">{tool.name}</h3>
                <span className="mt-1 shrink-0 border border-[#1a6b3c]/40 px-1.5 py-px text-[10px] uppercase tracking-[.08em] text-[#1a6b3c]">
                  Excel
                </span>
              </div>
              <p className="mt-2 font-serif text-[26px] leading-none text-[#1c1c1c]">{formatPrice(tool.price)}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-[#1c1c1c]">{tool.blurb}</p>
              <p className="mt-2 flex-1 text-[13.5px] leading-relaxed text-[#555555]">{tool.detail}</p>
              <p className="mt-4 text-[12px] text-[#6b6b6b]">
                {tool.sheets} sheets · every figure a formula, nothing pre-filled
              </p>
              <div className="mt-4">
                <BuyButton packSlug={tool.slug} label={`Buy ${tool.name.toLowerCase()}`} />
              </div>
            </div>
          ))}
          {sold.map(file => (
            <div key={file.slug} className="flex flex-col bg-white p-6">
              <div className="flex items-start justify-between gap-4">
                <h3 className="text-[19px] font-semibold leading-tight text-[#1c1c1c]">{file.name}</h3>
                <span className={`mt-1 shrink-0 border px-1.5 py-px text-[10px] uppercase tracking-[.08em] ${
                  TONE[file.format] || 'border-[#dddddd] text-[#6b6b6b]'}`}>
                  {file.format}
                </span>
              </div>
              <p className="mt-2 font-serif text-[26px] leading-none text-[#1c1c1c]">
                {formatPrice(file.price as number)}
              </p>
              {file.description && (
                <p className="mt-3 flex-1 text-[13.5px] leading-relaxed text-[#555555]">{file.description}</p>
              )}
              <p className="mt-4 text-[12px] text-[#6b6b6b]">
                {file.format === 'Excel' ? 'Editable workbook' : file.format} · {readableSize(file.sizeBytes)}
                {file.packSlugs.length > 0 && ' · also included with the packs it belongs to'}
              </p>
              <div className="mt-4">
                <BuyButton packSlug={file.slug as string} label={`Buy ${file.name.toLowerCase()}`} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
