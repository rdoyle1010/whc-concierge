'use client'

import { useState } from 'react'
import Link from 'next/link'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import { highlights, stageSpread, kindSpread } from '@/lib/documents/highlights'
import { DOCUMENT_FORMAT, formatSummary, type Format } from '@/lib/documents/formats'
import { readableSize } from '@/lib/documents/attachments'
import { useDialog } from '@/components/useDialog'
import { X } from 'lucide-react'

// What is in the pack, opened over the page rather than inside the card.
//
// Two goes at this were wrong in different ways. The first printed every
// title in catalogue order, so a reception pack opened with "Aftercare Email
// Dispatch and Record" and ran to a hundred and five lines: accurate, and it
// reads as admin rather than as relief.
//
// The second stopped listing and started selling, and still looked broken,
// because it expanded inside a three column grid. A grid row is as tall as
// its tallest cell, so opening one card left the two beside it with a wall of
// white space and their buy buttons drifting to the bottom of it. Nothing
// about the content fixes that: an accordion inside a card grid pushes the
// layout around by design.
//
// So it opens over the page. The cards stay the same height whatever anybody
// presses, and the contents get the width to be read in two columns instead
// of wrapping every title onto three lines in a narrow column.

export type PackFile = {
  name: string
  description: string | null
  format: Format
  sizeBytes: number
  packSlugs: string[]
}

const FORMAT_TONE: Record<string, string> = {
  Excel: 'border-[#1a6b3c]/40 text-[#1a6b3c]',
  Word: 'border-[#1c3f6b]/40 text-[#1c3f6b]',
  PowerPoint: 'border-[#8a3a14]/40 text-[#8a3a14]',
}

type Props = {
  name: string
  price: string
  detail?: string
  references: string[]
  files: PackFile[]
  readySet: Set<string>
  showReady: boolean
}

function Sheet({ pack, onClose }: { pack: Props; onClose: () => void }) {
  // enabled is passed explicitly even though this only renders while open.
  // The default is true, so a useDialog written without it counts as open
  // from the moment its page loads: nothing on screen, and the page silently
  // will not scroll. The convention is cheaper than the bug.
  const dialog = useDialog(onClose, 'pack-contents-heading', { enabled: true })

  const inPack = new Set(pack.references)
  const entries = sellableCatalogue().filter(entry => inPack.has(entry.reference))

  const counts: Partial<Record<Format, number>> = entries.length ? { [DOCUMENT_FORMAT]: entries.length } : {}
  for (const file of pack.files) counts[file.format] = (counts[file.format] || 0) + 1

  const shown = highlights(entries, 12)
  const rest = entries.length - shown.length
  const stages = stageSpread(entries)
  const kinds = kindSpread(entries)
  const notReady = pack.showReady ? entries.filter(entry => !pack.readySet.has(entry.reference)).length : 0

  return (
    <div onClick={onClose}
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/40 p-0 sm:items-center sm:p-6">
      <div {...dialog.panelProps}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto bg-white p-6 shadow-xl sm:p-8">
        <div className="flex items-start justify-between gap-6">
          <div className="min-w-0">
            <h2 id="pack-contents-heading" className="text-[24px] font-semibold leading-tight text-[#1c1c1c]">
              {pack.name}
            </h2>
            <p className="mt-1 font-serif text-[26px] leading-none text-[#1c1c1c]">{pack.price}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Close"
            className="shrink-0 border border-[#dddddd] p-1.5 text-[#555555] hover:text-[#1c1c1c]">
            <X size={15} />
          </button>
        </div>

        {pack.detail && (
          <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#555555]">{pack.detail}</p>
        )}

        <p className="mt-5 border-y border-[#dddddd] py-3 text-[13px] text-[#1c1c1c]">
          {formatSummary(counts)}
          {notReady > 0 && (
            <span className="text-[#6b6b6b]">
              {' · '}{notReady} still being written
            </span>
          )}
        </p>

        {pack.files.length > 0 && (
          <ul className="mt-4 space-y-2">
            {pack.files.map(file => (
              <li key={file.name} className="flex items-start gap-2">
                <span className={`mt-px shrink-0 border px-1.5 py-px text-[10px] uppercase tracking-[.08em] ${
                  FORMAT_TONE[file.format] || 'border-[#dddddd] text-[#6b6b6b]'}`}>
                  {file.format}
                </span>
                <span className="min-w-0 text-[13.5px] text-[#1c1c1c]">
                  {file.name}
                  <span className="text-[#6b6b6b]"> · {readableSize(file.sizeBytes)}</span>
                  {file.description && (
                    <span className="block text-[12.5px] leading-relaxed text-[#6b6b6b]">{file.description}</span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        )}

        {/* The shape of it. A pack that covers the whole visit should look
            like it does, and somebody worried about one part can see their
            part is in there. */}
        {(stages.length > 1 || kinds.length > 0) && (
          <div className="mt-5 grid gap-x-8 gap-y-2 sm:grid-cols-2">
            {stages.length > 1 && (
              <div>
                <p className="text-[11px] uppercase tracking-[.1em] text-[#6b6b6b]">Across the visit</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[#1c1c1c]">
                  {stages.map(stage => `${stage.label} ${stage.count}`).join(' · ')}
                </p>
              </div>
            )}
            {kinds.length > 0 && (
              <div>
                <p className="text-[11px] uppercase tracking-[.1em] text-[#6b6b6b]">What they are</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-[#1c1c1c]">
                  {kinds.map(kind =>
                    `${kind.count} ${kind.label.toLowerCase()}${kind.count === 1 ? '' : 's'}`).join(' · ')}
                </p>
              </div>
            )}
          </div>
        )}

        {shown.length > 0 && (
          <>
            <p className="mt-6 text-[11px] uppercase tracking-[.1em] text-[#6b6b6b]">Including</p>
            {/* Two columns, because twelve titles down one side of a wide
                panel is a list with a hole beside it. */}
            <ul className="mt-2 grid gap-x-8 gap-y-1.5 sm:grid-cols-2">
              {shown.map(entry => (
                <li key={entry.reference} className="text-[14px] leading-snug text-[#1c1c1c]">
                  {entry.title}
                </li>
              ))}
            </ul>
            {rest > 0 && (
              <p className="mt-3 text-[13.5px] leading-relaxed text-[#555555]">
                and {rest} more.{' '}
                <Link href="#every-document" onClick={onClose} className="underline underline-offset-2">
                  Search every title
                </Link>
              </p>
            )}
          </>
        )}

        <p className="mt-6 border-t border-[#dddddd] pt-4 text-[13px] leading-relaxed text-[#6b6b6b]">
          Every document is a PDF with fillable fields, so your muster point, your plant room and your supplier
          go into it in the free Adobe Reader rather than being retyped into a new file. {pack.name} arrives as
          one download.
        </p>
      </div>
    </div>
  )
}

export default function PackContents(props: Props) {
  const [open, setOpen] = useState(false)

  const inPack = new Set(props.references)
  const entries = sellableCatalogue().filter(entry => inPack.has(entry.reference))
  if (!entries.length && !props.files.length) return null

  const counts: Partial<Record<Format, number>> = entries.length ? { [DOCUMENT_FORMAT]: entries.length } : {}
  for (const file of props.files) counts[file.format] = (counts[file.format] || 0) + 1

  return (
    <>
      {/* Said on the card without opening anything. The formats are what a
          buyer repeats to whoever holds the budget, and behind a click is
          where that goes to be unread. */}
      <p className="mt-1 text-[12px] text-[#6b6b6b]">{formatSummary(counts)}</p>
      <button type="button" onClick={() => setOpen(true)}
        className="mt-1.5 self-start text-[12px] font-medium text-[#1c1c1c] underline underline-offset-2">
        See what is in it
      </button>
      {open && <Sheet pack={props} onClose={() => setOpen(false)} />}
    </>
  )
}
