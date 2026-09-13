'use client'

import { useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import SopSheet from '@/components/documents/SopSheet'
import { EXAMPLE_SOP } from '@/lib/documents/examples'
import { missingFromSop } from '@/lib/documents/types'
import { Printer } from 'lucide-react'

// The proof, before anything is generated or sold.
//
// One document, rendered exactly as a client would receive it, so the format
// can be argued about on a screen rather than described. Everything after
// this - generating from a property's fact file, the library, the paid tier -
// is filling this shape in.

export default function AdminDocumentsPage() {
  const [document] = useState(EXAMPLE_SOP)
  const missing = missingFromSop(document)

  return (
    <DashboardShell role="admin">
      <div className="print:hidden">
        <p className="eyebrow">Documents</p>
        <h1 className="text-[32px] mt-1">Operational documents</h1>
        <p className="text-[13px] text-secondary mt-2 max-w-2xl">
          One worked example, rendered as a property would receive it. Print it to see the page breaks.
          Everything else is this shape filled in from a property fact file.
        </p>

        {missing.length > 0 ? (
          <p className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">
            Not ready to issue. Still needs: {missing.join(', ')}.
          </p>
        ) : (
          <p className="mt-4 border border-[#166534]/30 bg-[#f3fbf5] px-4 py-3 text-[13px] text-[#166534]">
            Complete. Every section an assessor looks for is present.
          </p>
        )}

        <button type="button" onClick={() => window.print()}
          className="mt-5 inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-2 text-[12px] font-semibold text-white">
          <Printer size={13} /> Print or save as PDF
        </button>
      </div>

      <div className="mt-8 border border-border bg-white shadow-sm print:mt-0 print:border-0 print:shadow-none">
        <SopSheet document={document} />
      </div>
    </DashboardShell>
  )
}
