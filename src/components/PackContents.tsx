'use client'

import { useState } from 'react'
import Link from 'next/link'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import { highlights, stageSpread, kindSpread } from '@/lib/documents/highlights'
import { DOCUMENT_FORMAT, formatSummary, type Format } from '@/lib/documents/formats'
import { readableSize } from '@/lib/documents/attachments'
import { ChevronDown } from 'lucide-react'

// What is in the pack, put in a way that sells it.
//
// The first version printed every title. A reception pack opened with
// "Aftercare Email Dispatch and Record", then "Apply Buffers and Setup
// Times", and ran to a hundred and five lines of that. Accurate, complete,
// and it reads as tedium: the buyer sees admin, not relief, and nobody
// spends eight hundred pounds to be reminded how much filing there is.
//
// The depth is still the argument. But depth is made by saying a hundred and
// five, not by printing a hundred and five. So: the shape of the pack, the
// handful of titles a spa director recognises as the thing that went wrong
// last month, and a link to the full searchable list already on this page
// for the one buyer in twenty who wants to audit it.

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

export default function PackContents({
  name, references, files, readySet, showReady,
}: {
  name: string
  references: string[]
  files: PackFile[]
  readySet: Set<string>
  showReady: boolean
}) {
  const [open, setOpen] = useState(false)

  const inPack = new Set(references)
  const entries = sellableCatalogue().filter(entry => inPack.has(entry.reference))
  if (!entries.length && !files.length) return null

  const counts: Partial<Record<Format, number>> = entries.length ? { [DOCUMENT_FORMAT]: entries.length } : {}
  for (const file of files) counts[file.format] = (counts[file.format] || 0) + 1

  const shown = highlights(entries)
  const rest = entries.length - shown.length
  const stages = stageSpread(entries)
  const kinds = kindSpread(entries)
  const notReady = showReady ? entries.filter(entry => !readySet.has(entry.reference)).length : 0

  return (
    <div className="mt-3">
      {/* Said whether it is open or not, and said as what a buyer gets rather
          than as a file count. "105 PDFs" sounds like homework. */}
      <p className="text-[12px] text-[#6b6b6b]">{formatSummary(counts)}</p>
      <button type="button" onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="mt-1.5 inline-flex items-center gap-1 text-[12px] font-medium text-[#1c1c1c] underline underline-offset-2">
        {open ? 'Hide what is in it' : 'See what is in it'}
        <ChevronDown size={13} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {open && (
        <div className="mt-3 border-t border-[#dddddd] pt-3">
          {/* The shape of it, in two lines. A pack that covers the whole
              visit should look like it does, and a buyer worried about one
              part can see their part is in there. */}
          {stages.length > 1 && (
            <p className="text-[12px] leading-relaxed text-[#6b6b6b]">
              {stages.map(stage => `${stage.label} ${stage.count}`).join(' · ')}
            </p>
          )}
          {kinds.length > 1 && (
            <p className="mt-1 text-[12px] leading-relaxed text-[#6b6b6b]">
              {kinds.map(kind => `${kind.count} ${kind.label.toLowerCase()}${kind.count === 1 ? '' : 's'}`).join(' · ')}
            </p>
          )}

          {files.length > 0 && (
            <ul className="mt-3 space-y-1.5">
              {files.map(file => (
                <li key={file.name} className="flex items-start gap-2">
                  <span className={`mt-px shrink-0 border px-1.5 py-px text-[10px] uppercase tracking-[.08em] ${
                    FORMAT_TONE[file.format] || 'border-[#dddddd] text-[#6b6b6b]'}`}>
                    {file.format}
                  </span>
                  <span className="min-w-0 text-[13px] text-[#1c1c1c]">
                    {file.name}
                    <span className="text-[#6b6b6b]"> · {readableSize(file.sizeBytes)}</span>
                    {file.description && (
                      <span className="block text-[12px] leading-relaxed text-[#6b6b6b]">{file.description}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          )}

          {shown.length > 0 && (
            <>
              <p className="mt-3.5 text-[11px] uppercase tracking-[.1em] text-[#6b6b6b]">Including</p>
              <ul className="mt-1.5 space-y-1">
                {shown.map(entry => (
                  <li key={entry.reference} className="text-[13.5px] leading-relaxed text-[#1c1c1c]">
                    {entry.title}
                  </li>
                ))}
              </ul>
              {rest > 0 && (
                <p className="mt-2 text-[13px] leading-relaxed text-[#555555]">
                  and {rest} more.{' '}
                  {/* The full searchable list is already further down this
                      page. Reprinting it inside every card was the wall. */}
                  <Link href="#every-document" className="underline underline-offset-2">
                    Search every title
                  </Link>
                </p>
              )}
            </>
          )}

          {notReady > 0 && (
            <p className="mt-2 text-[12px] text-[#6b6b6b]">
              {notReady} of these {notReady === 1 ? 'is' : 'are'} still being written and signed off.
            </p>
          )}

          <p className="mt-3 text-[12px] leading-relaxed text-[#6b6b6b]">
            Every document is a PDF with fillable fields, so your muster point, your plant room and your
            supplier go into it in the free Adobe Reader. {name} arrives as one download.
          </p>
        </div>
      )}
    </div>
  )
}
