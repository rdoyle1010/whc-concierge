'use client'

import { useState } from 'react'
import { sellableCatalogue } from '@/lib/documents/catalogue'
import { kindOf, KIND_LABEL } from '@/lib/documents/journey'
import { DOCUMENT_FORMAT, formatSummary, type Format } from '@/lib/documents/formats'
import { readableSize } from '@/lib/documents/attachments'
import { ChevronDown } from 'lucide-react'

// What is actually in the pack, before the buy button rather than after the
// payment.
//
// "36 documents" is not a description of anything. A spa director deciding
// whether to spend eight hundred pounds wants to read the titles, and wants
// to know whether what arrives is a folder of PDFs or an actual workbook they
// can type into. Both questions were only answerable after paying, and the
// answer to the second one is a selling point being kept quiet.
//
// Grouped by kind rather than listed flat, because forty-eight titles in one
// column is a wall nobody reads, and "12 risk assessments, 30 procedures, 6
// checklists" is the shape of the thing.

export type PackFile = {
  name: string
  description: string | null
  format: Format
  sizeBytes: number
  packSlugs: string[]
}

const FORMAT_TONE: Record<string, string> = {
  PDF: 'border-[#dddddd] text-[#6b6b6b]',
  Excel: 'border-[#1a6b3c]/40 text-[#1a6b3c]',
  Word: 'border-[#1c3f6b]/40 text-[#1c3f6b]',
  PowerPoint: 'border-[#8a3a14]/40 text-[#8a3a14]',
}

function Tag({ format }: { format: Format }) {
  return (
    <span className={`shrink-0 border px-1.5 py-px text-[10px] uppercase tracking-[.08em] ${
      FORMAT_TONE[format] || 'border-[#dddddd] text-[#6b6b6b]'}`}>
      {format}
    </span>
  )
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

  // Grouped by kind, biggest group first. Forty-eight titles in one column is
  // a wall; "30 procedures, 12 risk assessments, 6 checklists" is a pack.
  const groups = new Map<string, typeof entries>()
  for (const entry of entries) {
    const kind = kindOf(entry.reference)
    groups.set(kind, [...(groups.get(kind) || []), entry])
  }
  const ordered = [...groups.entries()].sort((a, b) => b[1].length - a[1].length)

  const counts: Partial<Record<Format, number>> = { [DOCUMENT_FORMAT]: entries.length }
  for (const file of files) counts[file.format] = (counts[file.format] || 0) + 1

  if (!entries.length && !files.length) return null

  return (
    <div className="mt-3">
      <button type="button" onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-[12px] font-medium text-[#1c1c1c] underline underline-offset-2">
        {open ? 'Hide what is in it' : 'See what is in it'}
        <ChevronDown size={13} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} />
      </button>

      {/* Said whether it is open or not. The formats are the part a buyer
          repeats to whoever holds the budget, and burying them behind a
          click means they never hear it. */}
      <p className="mt-1.5 text-[12px] text-[#6b6b6b]">{formatSummary(counts)}</p>

      {open && (
        <div className="mt-3 border-t border-[#dddddd] pt-3">
          {files.length > 0 && (
            <div className="mb-4">
              <p className="text-[11px] uppercase tracking-[.1em] text-[#6b6b6b]">Files</p>
              <ul className="mt-1.5 space-y-1.5">
                {files.map(file => (
                  <li key={file.name} className="flex items-start gap-2">
                    <Tag format={file.format} />
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
            </div>
          )}

          {ordered.map(([kind, items]) => (
            <div key={kind} className="mb-4 last:mb-0">
              <p className="text-[11px] uppercase tracking-[.1em] text-[#6b6b6b]">
                {items.length} {(KIND_LABEL[kind] || 'Document').toLowerCase()}
                {items.length === 1 ? '' : 's'}
              </p>
              <ul className="mt-1.5 space-y-1">
                {items.map(entry => (
                  <li key={entry.reference} className="flex items-baseline gap-2 text-[13px] leading-relaxed">
                    <span className="min-w-0 text-[#1c1c1c]">{entry.title}</span>
                    {/* Only worth showing while some of the pack is still
                        being written. Once it is all ready, a column of
                        green ticks is noise. */}
                    {showReady && !readySet.has(entry.reference) && (
                      <span className="shrink-0 text-[11px] text-[#6b6b6b]">in preparation</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <p className="mt-3 text-[12px] leading-relaxed text-[#6b6b6b]">
            Every document is a PDF with fillable fields, so the facts about your building are typed into it in
            the free Adobe Reader rather than retyped into a new file. {name} is delivered as one download.
          </p>
        </div>
      )}
    </div>
  )
}
