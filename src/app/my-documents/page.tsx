'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Download, ShoppingBag, FileSpreadsheet } from 'lucide-react'
import { formatPrice } from '@/lib/documents/pricing'

// Where a purchase lives afterwards.
//
// It used to live in one email. That is fine for the spa director who buys
// without an account, and wrong for everybody who has one: a document bought
// in March should be on their dashboard in September, not in a search of
// their inbox for a receipt they may have deleted.
//
// One page for every workspace rather than one per role. What a talent, a
// property and a consultancy see here is identical - the documents they
// bought - and three copies of that would be three things to keep in step.

type Entry = { reference: string; title: string; department: string; ready: boolean }
type Order = { id: string; packSlug: string | null; reference: string | null; amountPence: number; boughtOn: string }
type FileEntry = { id: string; name: string; description: string | null; fileName: string; sizeBytes: number }

const readable = (bytes: number) =>
  bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(bytes / 1024)} KB`

export default function MyDocumentsPage() {
  const supabase = createClient()
  const [role, setRole] = useState<'talent' | 'employer' | 'admin'>('talent')
  const [documents, setDocuments] = useState<Entry[] | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [files, setFiles] = useState<FileEntry[]>([])
  const [workbook, setWorkbook] = useState(false)
  const [tools, setTools] = useState<{ slug: string; name: string; blurb: string }[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
        if (profile?.role === 'employer' || profile?.role === 'admin') setRole(profile.role)
      }

      // Carried through when the browser has just come back from Stripe, so
      // the purchase is delivered before the page tries to list it. Without
      // it, somebody who has just paid sees an empty shelf and waits on a
      // webhook they know nothing about.
      const sessionId = new URLSearchParams(window.location.search).get('session_id')
      const res = await fetch(`/api/standards/mine${sessionId ? `?session_id=${encodeURIComponent(sessionId)}` : ''}`, { cache: 'no-store' })
      const body = await res.json().catch(() => null)
      if (!res.ok || !body) {
        setError(body?.error || 'We could not reach your documents just now.')
        setDocuments([])
        return
      }
      setDocuments(body.documents || [])
      setOrders(body.orders || [])
      setFiles(body.files || [])
      setWorkbook(Boolean(body.workbook))
      setTools(body.tools || [])
    }
    load().catch(() => { setError('We could not reach your documents just now.'); setDocuments([]) })
  }, [])

  const ready = (documents || []).filter(entry => entry.ready).length

  return (
    <DashboardShell role={role}>
      <div className="max-w-4xl">
        <p className="eyebrow">Standards</p>
        <h1 className="mt-1 text-[32px]">Your documents</h1>

        {error && (
          <p className="mt-4 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{error}</p>
        )}

        {documents === null ? (
          <p className="mt-6 text-[13px] text-secondary">Loading...</p>
        ) : documents.length === 0 && files.length === 0 && !workbook && tools.length === 0 ? (
          <div className="mt-6">
            <p className="max-w-2xl text-[14px] leading-relaxed text-secondary">
              You have not bought any documents yet. The library holds standard operating procedures, risk
              assessments, checklists and job descriptions for every department in a luxury spa, each one ready
              for your name and your sign-off.
            </p>
            {/* A bought-before-you-had-an-account purchase is claimed onto the
                account the first time this page loads, so an empty shelf here
                really is empty rather than merely unmatched. */}
            <p className="mt-3 max-w-2xl text-[13px] text-muted">
              Bought something before you had an account? It appears here automatically once you are signed in
              with the address you paid with. If it has not, the link in your receipt email still works.
            </p>
            <Link href="/standards"
              className="mt-5 inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-2 text-[13px] font-semibold text-white">
              <ShoppingBag size={14} /> Browse the library
            </Link>
          </div>
        ) : (
          <>
            <p className="mt-2 text-[13px] text-secondary">
              {ready} of {documents.length} ready to download.
              {documents.length > ready && ` The other ${documents.length - ready} appear here the day they are signed off, and you already own them.`}
            </p>
            <p className="mt-4 max-w-2xl text-[13px] leading-relaxed text-secondary">
              Each one opens as a PDF you can type into with the free Adobe Reader. Page one lists what your
              property needs to fill in: type each entry once and it fills in wherever it appears.
            </p>

            <div className="mt-7 border-t border-border">
              {documents.map(entry => (
                <div key={entry.reference}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border py-3.5">
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-ink">{entry.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-muted">{entry.reference} · {entry.department}</p>
                  </div>
                  {entry.ready ? (
                    <a href={`/api/standards/download?reference=${encodeURIComponent(entry.reference)}`}
                      className="inline-flex shrink-0 items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink">
                      <Download size={13} /> PDF
                    </a>
                  ) : (
                    <span className="shrink-0 text-[11px] text-muted">Being written</span>
                  )}
                </div>
              ))}
            </div>

            {/* The workbook. Given its own block above the files, because it
                is not an attachment that came with a pack: it is where the
                pack is actually worked out, and the PDFs are how a month is
                presented once it has been. */}
            {/* Tools they bought, above the reporting workbook because a
                tool is opened weekly and a reporting pack monthly. */}
            {tools.map(tool => (
              <div key={tool.slug} className="mt-10 border border-[#1c1c1c] p-5">
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                  <FileSpreadsheet size={16} className="shrink-0 text-muted" /> {tool.name}
                </h2>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-secondary">{tool.blurb}</p>
                <a href={`/api/standards/tool?slug=${encodeURIComponent(tool.slug)}`}
                  className="mt-4 inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-2 text-[13px] font-semibold text-white">
                  <Download size={13} /> Download it
                </a>
              </div>
            ))}

            {workbook && (
              <div className="mt-10 border border-[#1c1c1c] p-5">
                <h2 className="flex items-center gap-2 text-[15px] font-semibold text-ink">
                  <FileSpreadsheet size={16} className="shrink-0 text-muted" /> Spa Reporting Pack workbook
                </h2>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-secondary">
                  One Excel file, a tab per report, with the arithmetic wired up. Fill in the eight numbers on
                  the Setup tab and RevPATH, occupancy, unsold capacity and the director dashboard work
                  themselves out. The PDFs are how you present the month; this is where you work it out.
                </p>
                <a href="/api/standards/workbook"
                  className="mt-4 inline-flex items-center gap-1.5 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-2 text-[13px] font-semibold text-white">
                  <Download size={13} /> Download the workbook
                </a>
              </div>
            )}

            {/* Working files that came with a pack. Given the same weight as
                the documents, because a buyer who cannot see the register
                they paid for assumes it was never sent. */}
            {files.length > 0 && (
              <div className="mt-10">
                <h2 className="text-[13px] font-semibold uppercase tracking-[.14em] text-muted">Also included</h2>
                <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-secondary">
                  Working files that came with what you bought. They open in Excel, Word or a reader, and they
                  are yours to edit.
                </p>
                <div className="mt-3 border-t border-border">
                  {files.map(file => (
                    <div key={file.id}
                      className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 border-b border-border py-3.5">
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 text-[14px] font-medium text-ink">
                          <FileSpreadsheet size={14} className="shrink-0 text-muted" /> {file.name}
                        </p>
                        {file.description && (
                          <p className="mt-0.5 max-w-xl text-[13px] leading-relaxed text-secondary">{file.description}</p>
                        )}
                        <p className="mt-0.5 text-[11px] text-muted">{file.fileName} · {readable(file.sizeBytes)}</p>
                      </div>
                      <a href={`/api/standards/file?id=${encodeURIComponent(file.id)}`}
                        className="inline-flex shrink-0 items-center gap-1.5 border border-[#1c1c1c] px-3 py-1.5 text-[12px] font-semibold text-ink">
                        <Download size={13} /> Download
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {orders.length > 0 && (
              <div className="mt-10">
                <h2 className="text-[13px] font-semibold uppercase tracking-[.14em] text-muted">What you bought</h2>
                <div className="mt-3 border-t border-border">
                  {orders.map(order => (
                    <div key={order.id} className="flex items-baseline justify-between gap-6 border-b border-border py-2.5">
                      <p className="text-[13px] text-ink">
                        {order.packSlug ? order.packSlug.replace(/^department-/, '').replace(/-/g, ' ') : order.reference}
                      </p>
                      <p className="text-[12px] text-secondary">
                        {new Date(order.boughtOn).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                        {' · '}{formatPrice(order.amountPence)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <Link href="/standards" className="mt-8 inline-flex items-center gap-1.5 text-[13px] text-secondary underline">
              <ShoppingBag size={13} /> Browse the rest of the library
            </Link>
          </>
        )}
      </div>
    </DashboardShell>
  )
}
