'use client'

import Link from 'next/link'
import { Printer, ArrowLeft } from 'lucide-react'
import { documentSellerName, sellerLines, vatStatement, type BillingIdentity } from '@/lib/billing-identity'

// The one document layout every receipt on the platform prints through.
//
// A hotel's accounts payable team will not file a screenshot of a dashboard.
// It needs a document naming the legal entity that took the money, what was
// bought, what it cost, the VAT position, and - for anything routed through
// procurement - the purchase order it belongs to. Anything missing gets the
// document returned and the payment delayed, which is a support cost as much
// as a cash one.

export type DocumentLine = { description: string; detail?: string; amount: number }

type Props = {
  identity: BillingIdentity | null
  reference: string
  issuedAt: string | null
  buyerName: string
  buyerLines?: string[]
  poNumber?: string
  lines: DocumentLine[]
  total: number
  backHref: string
  backLabel: string
  notes?: string[]
}

const money = (amount: number) => `£${amount.toFixed(2)}`

export default function PaymentDocument({
  identity, reference, issuedAt, buyerName, buyerLines = [], poNumber, lines, total, backHref, backLabel, notes = [],
}: Props) {
  const seller = identity ? documentSellerName(identity) : 'Talent House Collective'
  const sellerDetail = identity ? sellerLines(identity) : []
  const vat = identity ? vatStatement(identity) : ''

  return (
    <div className="min-h-screen bg-white">
      <div className="print:hidden border-b border-[#dddddd] px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Link href={backHref} className="text-[13px] text-secondary hover:text-black inline-flex items-center gap-1.5"><ArrowLeft size={14} /> {backLabel}</Link>
        <button type="button" onClick={() => window.print()} className="btn-primary text-[13px] inline-flex items-center gap-2"><Printer size={14} /> Print / Save as PDF</button>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-start justify-between gap-8 mb-10">
          <div>
            <p className="text-[22px] font-serif font-bold text-black">{seller}</p>
            {sellerDetail.map(line => <p key={line} className="text-[12px] text-secondary">{line}</p>)}
            <p className="text-[12px] text-secondary">talenthousecollective.co.uk</p>
          </div>
          <div className="text-right shrink-0">
            <p className="text-[13px] font-semibold text-black">RECEIPT</p>
            <p className="text-[12px] text-secondary">Ref: {reference}</p>
            {issuedAt && <p className="text-[12px] text-secondary">Paid: {new Date(issuedAt).toLocaleDateString('en-GB')}</p>}
          </div>
        </div>

        <div className="mb-8 flex flex-wrap justify-between gap-6">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Billed to</p>
            <p className="text-[14px] font-medium text-black">{buyerName}</p>
            {buyerLines.filter(Boolean).map(line => <p key={line} className="text-[12px] text-secondary">{line}</p>)}
          </div>
          {poNumber && (
            <div className="text-right">
              <p className="text-[11px] uppercase tracking-wide text-muted mb-1">Your purchase order</p>
              <p className="text-[14px] font-mono text-black">{poNumber}</p>
            </div>
          )}
        </div>

        <table className="w-full text-left text-[13px] mb-8">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted border-b border-[#dddddd]">
              <th className="py-2 pr-4">Description</th>
              <th className="py-2 pr-4 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {lines.map((line, index) => (
              <tr key={`${line.description}-${index}`} className="border-b border-[#dddddd]">
                <td className="py-3 pr-4">
                  {line.description}
                  {line.detail && <span className="block text-[12px] text-secondary">{line.detail}</span>}
                </td>
                <td className="py-3 pr-4 text-right">{money(line.amount)}</td>
              </tr>
            ))}
            <tr>
              <td className="py-3 pr-4 font-semibold text-black">Total paid</td>
              <td className="py-3 pr-4 text-right font-semibold text-black">{money(total)}</td>
            </tr>
          </tbody>
        </table>

        <div className="text-[11px] text-muted space-y-1 border-t border-[#dddddd] pt-6">
          {notes.map(note => <p key={note}>{note}</p>)}
          {vat && <p>{vat}</p>}
          <p>Questions about this receipt? {identity?.billingEmail ? `Email ${identity.billingEmail}` : 'Reply to any Talent House Collective email'} quoting {reference}.</p>
          {!sellerDetail.length && (
            // Visible only to the buyer, and only while the seller block is
            // incomplete - better they see a gap than believe the document is
            // finished when a finance team will reject it.
            <p className="print:hidden text-amber-700">This receipt is missing the issuing company details. Contact us if your finance team needs a completed copy.</p>
          )}
        </div>
      </div>
    </div>
  )
}
