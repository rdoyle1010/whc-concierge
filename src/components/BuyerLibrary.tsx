'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Download, ArrowLeft, ShoppingBag, FileSpreadsheet } from 'lucide-react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

// The library a buyer reaches from their receipt.
//
// No account, no password. They bought a document, not a membership, and a
// sign-in form between somebody and the thing they have already paid for is
// a support email waiting to happen.

type Entry = { reference: string; title: string; department: string; ready: boolean }
type FileEntry = { id: string; name: string; description: string | null; fileName: string; sizeBytes: number }

const readable = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`

function Library() {
  const params = useSearchParams()
  const token = params.get('t') || ''
  const sessionId = params.get('session_id') || ''

  const [state, setState] = useState<
    { status: 'loading' }
    | { status: 'error'; message: string }
    | { status: 'ready'; token: string; buyer: { name: string | null }; documents: Entry[]; files?: FileEntry[]; workbook?: boolean; ready: number; total: number }
  >({ status: 'loading' })

  useEffect(() => {
    const query = token ? `t=${encodeURIComponent(token)}` : `session_id=${encodeURIComponent(sessionId)}`
    if (!token && !sessionId) {
      setState({ status: 'error', message: 'Use the link in your receipt email to open your library.' })
      return
    }
    fetch(`/api/standards/library?${query}`)
      .then(async res => {
        const body = await res.json().catch(() => null)
        if (!res.ok || !body) {
          setState({ status: 'error', message: body?.error || 'We could not open your library just now.' })
          return
        }
        setState({ status: 'ready', ...body })
      })
      .catch(() => setState({ status: 'error', message: 'We could not open your library just now.' }))
  }, [token, sessionId])

  if (state.status === 'loading') {
    return <p className="text-[14px] text-[#57544c]">Opening your library...</p>
  }

  if (state.status === 'error') {
    return (
      <div>
        <p className="border border-[#dcd4c8] bg-[#ede8df] px-4 py-3 text-[14px] text-[#57544c]">{state.message}</p>
        <p className="mt-5 text-[14px] text-[#57544c]">
          <Link href="/contact" className="underline">Tell us</Link> and we will resend the link. Nothing is lost.
        </p>
      </div>
    )
  }

  const waiting = state.total - state.ready

  return (
    <div>
      <p className="text-[14px] text-[#57544c]">
        {state.ready} of {state.total} ready to download.
        {waiting > 0 && ` The other ${waiting} appear here the day they are signed off, and you already own them.`}
      </p>

      <p className="mt-4 max-w-2xl text-[14px] leading-relaxed text-[#57544c]">
        Each one opens as a PDF you can type into with the free Adobe Reader. Page one lists what your property
        needs to fill in: type each entry once and it fills in wherever it appears in the document.
      </p>

      <div className="mt-8 border-t border-[#dcd4c8]">
        {state.documents.map(entry => (
          <div key={entry.reference}
            className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[#e7e1d6] py-4">
            <div className="min-w-0 flex-1">
              <p className="text-[15px] font-medium text-[#222321]">{entry.title}</p>
              <p className="mt-0.5 font-mono text-[11px] text-[#7e7a70]">{entry.reference} · {entry.department}</p>
            </div>
            {entry.ready ? (
              <a
                href={`/api/standards/download?t=${encodeURIComponent(state.token)}&reference=${encodeURIComponent(entry.reference)}`}
                className="inline-flex shrink-0 items-center gap-1.5 border border-[#222321] px-3 py-2 text-[13px] font-semibold text-[#222321]"
              >
                <Download size={14} /> PDF
              </a>
            ) : (
              <span className="shrink-0 text-[12px] text-[#7e7a70]">Being written</span>
            )}
          </div>
        ))}
      </div>

      {state.workbook && (
        <div className="mt-10 border border-[#222321] p-6">
          <h2 className="flex items-center gap-2 text-[17px] font-semibold text-[#222321]">
            <FileSpreadsheet size={17} className="shrink-0 text-[#7e7a70]" /> Spa Reporting Pack workbook
          </h2>
          <p className="mt-2 max-w-2xl text-[14px] leading-relaxed text-[#57544c]">
            One Excel file, a tab per report, with the arithmetic wired up. Fill in the eight numbers on the
            Setup tab and RevPATH, occupancy, unsold capacity and the director dashboard work themselves out.
            The PDFs are how you present the month; this is where you work it out.
          </p>
          <a href={`/api/standards/workbook?t=${encodeURIComponent(state.token)}`}
            className="mt-4 inline-flex items-center gap-1.5 border border-[#222321] bg-[#222321] px-4 py-2 text-[13px] font-semibold text-white">
            <Download size={14} /> Download the workbook
          </a>
        </div>
      )}

      {/* The files that came with a pack. A register in Excel is not a
          lesser thing than a PDF, so it gets the same weight on the page:
          a buyer who does not see it assumes it was not delivered. */}
      {(state.files?.length ?? 0) > 0 && (
        <div className="mt-10">
          <h2 className="text-[17px] font-semibold text-[#222321]">Also included</h2>
          <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-[#57544c]">
            Working files that came with what you bought. These open in Excel, Word or a reader, and they are
            yours to edit.
          </p>
          <div className="mt-4 border-t border-[#dcd4c8]">
            {(state.files || []).map(file => (
              <div key={file.id}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-[#e7e1d6] py-4">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[15px] font-medium text-[#222321]">
                    <FileSpreadsheet size={15} className="shrink-0 text-[#7e7a70]" /> {file.name}
                  </p>
                  {file.description && (
                    <p className="mt-0.5 max-w-xl text-[13px] leading-relaxed text-[#57544c]">{file.description}</p>
                  )}
                  <p className="mt-0.5 text-[11px] text-[#7e7a70]">{file.fileName} · {readable(file.sizeBytes)}</p>
                </div>
                <a
                  href={`/api/standards/file?t=${encodeURIComponent(state.token)}&id=${encodeURIComponent(file.id)}`}
                  className="inline-flex shrink-0 items-center gap-1.5 border border-[#222321] px-3 py-2 text-[13px] font-semibold text-[#222321]"
                >
                  <Download size={14} /> Download
                </a>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="mt-8 max-w-2xl border-l-2 border-[#dcd4c8] pl-4 text-[13px] leading-relaxed text-[#57544c]">
        Every document is a professional template for your property to review, amend and adopt. Anything concerning
        life safety must be checked against your building by a competent person and signed off before it is issued
        to anyone. It is not a completed assessment and it does not discharge any duty you owe as an employer.
      </p>

      <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">
        <Link href="/standards"
          className="inline-flex items-center gap-1.5 border border-[#222321] px-4 py-2 text-[13px] font-semibold text-[#222321]">
          <ShoppingBag size={14} /> Browse the rest of the library
        </Link>
        {/* An account is optional and stays optional. It is offered here
            because keeping a receipt email safe for three years is a worse
            plan than a page they can sign into, and saying so is more useful
            than a sign-up prompt that explains nothing. */}
        <p className="max-w-md text-[13px] leading-relaxed text-[#6e6a60]">
          Keep this link: it is the only way back without an account. If you
          {' '}<Link href="/register/buyer" className="underline">create one</Link>{' '}
          with this address, everything you have bought appears under My Documents on your dashboard instead.
        </p>
      </div>
    </div>
  )
}

export default function BuyerLibrary() {
  // The header and footer, because this page was a dead end: somebody who
  // followed the link from their receipt had no way back to the shop, to the
  // site, or anywhere else, which reads as having been dropped somewhere
  // rather than delivered something.
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-4xl px-6 pb-20 pt-[108px] lg:px-8">
        <Link href="/standards"
          className="inline-flex items-center gap-1.5 text-[13px] text-[#6e6a60] underline hover:text-[#222321]">
          <ArrowLeft size={14} /> The document library
        </Link>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[.18em] text-[#6e6a60]">Standards</p>
        <h1 className="mt-3 text-[32px] font-semibold text-[#222321] md:text-[40px]">Your documents</h1>
        <div className="mt-8">
          <Suspense fallback={<p className="text-[14px] text-[#57544c]">Opening your library...</p>}>
            <Library />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
