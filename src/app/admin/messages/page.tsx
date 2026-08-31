'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { MessageSquare, Mail, Trash2, Check, Send } from 'lucide-react'
import Pagination from '@/components/Pagination'

export default function AdminMessagesPage() {
  const [queries, setQueries] = useState<any[]>([])
  const [reply, setReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [replyMsg, setReplyMsg] = useState('')
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const perPage = 25

  async function load(targetPage = page, targetFilter = filter) {
    setLoading(true)
    try {
      const params = new URLSearchParams({ kind: 'contact_queries', page: String(targetPage), per_page: String(perPage), status: targetFilter })
      const res = await fetch(`/api/admin/content?${params.toString()}`)
      const j = res.ok ? await res.json() : { rows: [], pagination: { total: 0 } }
      setQueries(j.rows || [])
      setTotal(j.pagination?.total || 0)
      if (targetPage > 1 && (j.rows || []).length === 0 && (j.pagination?.total || 0) > 0) {
        const previousPage = targetPage - 1
        setPage(previousPage)
        return load(previousPage, targetFilter)
      }
    } catch {
      setQueries([])
      setTotal(0)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load(page, filter) }, [page, filter])

  const changeFilter = (nextFilter: string) => {
    setSelected(null)
    setPage(1)
    setFilter(nextFilter)
  }

  const updateStatus = async (id: string, status: string) => {
    const res = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query_status', id, status }) })
    if (!res.ok) return
    if (selected?.id === id) setSelected({ ...selected, status })
    await load(page, filter)
  }

  const deleteQuery = async (id: string) => {
    if (!confirm('Delete this message?')) return
    const res = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query_delete', id }) })
    if (!res.ok) return
    if (selected?.id === id) setSelected(null)
    await load(page, filter)
  }

  const statusColors: Record<string, string> = {
    open: 'border-amber-200 bg-amber-50 text-amber-700',
    replied: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    closed: 'border-[#ddd8cf] bg-[#f3f1ed] text-[#7d7971]',
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-7">
        <p className="dashboard-eyebrow">Inbox & support</p>
        <h1 className="dashboard-title">Messages & Enquiries</h1>
        <p className="dashboard-intro">Review incoming enquiries, reply by email and keep every conversation clearly tracked.</p>
      </div>

      <div className="mb-5 flex flex-wrap gap-2">
        {['all', 'open', 'replied', 'closed'].map((f) => (
          <button key={f} type="button" onClick={() => changeFilter(f)} className={`rounded-full border px-4 py-2 text-[11px] font-semibold capitalize transition ${filter === f ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#ddd7cd] bg-white text-[#736f68] hover:border-[#555555]'}`}>{f}</button>
        ))}
      </div>

      <div className="overflow-hidden rounded-[22px] border border-[#ded8cc] bg-white shadow-[0_18px_55px_rgba(22,40,55,0.08)]">
        <div className="grid min-h-[640px] grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="border-b border-[#e8e2d8] bg-[#fafafa] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#e8e2d8] px-5 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1a1a1a]">Inbox</p>
              <p className="mt-1 text-[12px] text-[#7d7972]">{total} message{total === 1 ? '' : 's'}</p>
            </div>
            <div className="max-h-[570px] overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">{[1,2,3,4].map(i => <div key={i} className="h-[86px] animate-pulse rounded-2xl bg-[#f0ede7]" />)}</div>
              ) : queries.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-8 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#e1dbcf] bg-white text-[#1a1a1a]"><Mail size={20} /></div>
                  <p className="text-[15px] font-medium text-[#17344d]">No messages here</p>
                  <p className="mt-2 text-[12px] leading-5 text-[#8b877f]">New enquiries will appear here when they arrive.</p>
                </div>
              ) : queries.map((q) => {
                const active = selected?.id === q.id
                const initials = String(q.name || 'Q').split(' ').map((part: string) => part[0]).join('').slice(0,2).toUpperCase()
                return (
                  <button key={q.id} type="button" onClick={() => setSelected(q)} className={`w-full border-b border-[#eee9e0] px-4 py-4 text-left transition ${active ? 'bg-white' : 'hover:bg-white/70'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${active ? 'border-[#555555] bg-[#f5f5f5] text-[#1a1a1a]' : 'border-[#ddd6c9] bg-white text-[#59636c]'}`}>{initials}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#17344d]">{q.name}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold capitalize ${statusColors[q.status] || 'border-[#ddd8cf] bg-[#f3f1ed] text-[#7d7971]'}`}>{q.status}</span>
                        </div>
                        <p className="mt-1 truncate text-[11px] font-medium text-[#625f5a]">{q.subject || 'General enquiry'}</p>
                        <p className="mt-1 truncate text-[10px] text-[#99938a]">{q.message}</p>
                        <p className="mt-2 text-[9px] uppercase tracking-[0.08em] text-[#aaa49a]">{new Date(q.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="border-t border-[#e8e2d8] bg-white px-4 py-3"><Pagination page={page} perPage={perPage} total={total} showPerPage={false} onPageChange={setPage} /></div>
          </aside>

          <section className="min-w-0 bg-[#fdfcf9]">
            {!selected ? (
              <div className="flex min-h-[640px] flex-col items-center justify-center px-8 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#e3dccf] bg-white text-[#1a1a1a]"><MessageSquare size={22} /></div>
                <p className="text-[20px] font-medium tracking-[-0.02em] text-[#17344d]">Select an enquiry</p>
                <p className="mt-2 max-w-sm text-[12px] leading-5 text-[#8b877f]">Open a message from the inbox to review the enquiry and reply.</p>
              </div>
            ) : (
              <div className="flex min-h-[640px] flex-col">
                <header className="flex flex-col gap-4 border-b border-[#e5e5e5] bg-white px-5 py-5 sm:flex-row sm:items-start sm:justify-between md:px-7">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold capitalize ${statusColors[selected.status] || 'border-[#ddd8cf] bg-[#f3f1ed] text-[#7d7971]'}`}>{selected.status}</span>
                      {selected.type && <span className="rounded-full border border-[#e5ded1] bg-[#f7f7f7] px-2.5 py-1 text-[9px] font-semibold text-[#7c7468]">{selected.type}</span>}
                    </div>
                    <h2 className="text-[24px] font-medium tracking-[-0.03em] text-[#17344d]">{selected.subject || 'General enquiry'}</h2>
                    <p className="mt-2 text-[12px] text-[#6f6b65]">{selected.name} · {selected.email}</p>
                    <p className="mt-1 text-[10px] text-[#a09a91]">{new Date(selected.created_at).toLocaleString('en-GB')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => updateStatus(selected.id, 'replied')} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd7cd] bg-white text-[#66717a] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700" title="Mark replied"><Check size={17} /></button>
                    <button type="button" onClick={() => deleteQuery(selected.id)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#ddd7cd] bg-white text-[#8f8a82] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={17} /></button>
                  </div>
                </header>

                <div className="flex-1 px-5 py-6 md:px-7">
                  <div className="rounded-[20px] border border-[#e5dfd5] bg-white p-5 shadow-sm md:p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a]">Enquiry</p>
                    <p className="mt-4 whitespace-pre-wrap text-[13px] leading-6 text-[#344a5b]">{selected.message}</p>
                  </div>

                  <div className="mt-6 rounded-[20px] border border-[#e5dfd5] bg-white p-5 md:p-6">
                    <div className="mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1a1a1a]">Reply</p>
                      <p className="mt-1 text-[12px] text-[#7c7770]">Reply by email to {selected.email}</p>
                    </div>
                    <textarea rows={6} value={reply} onChange={(e) => setReply(e.target.value)} className="w-full resize-y rounded-2xl border border-[#ddd6cb] bg-[#fafafa] px-4 py-3 text-[13px] leading-6 text-[#17344d] outline-none transition placeholder:text-[#aaa49a] focus:border-[#555555] focus:bg-white" placeholder={`Hi ${selected.name?.split(' ')[0] || 'there'},`} />
                    {replyMsg && <p className={`mt-2 text-[11px] ${replyMsg.includes('sent') ? 'text-emerald-600' : 'text-red-600'}`}>{replyMsg}</p>}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        {['open', 'replied', 'closed'].map((s) => (
                          <button key={s} type="button" onClick={() => updateStatus(selected.id, s)} className={`rounded-full border px-3 py-1.5 text-[10px] font-semibold capitalize transition ${selected.status === s ? 'border-[#111111] bg-[#111111] text-white' : 'border-[#ddd7cd] bg-[#fafafa] text-[#77736c] hover:border-[#555555]'}`}>{s}</button>
                        ))}
                      </div>
                      <button type="button" onClick={async () => {
                        setSendingReply(true); setReplyMsg('')
                        try {
                          const res = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query_reply', id: selected.id, message: reply }) })
                          const j = await res.json()
                          if (!res.ok) setReplyMsg(j.error || 'Could not send.')
                          else {
                            setReplyMsg('Reply sent.')
                            setReply('')
                            setSelected({ ...selected, status: 'replied' })
                            await load(page, filter)
                          }
                        } catch { setReplyMsg('Could not send - please try again.') }
                        setSendingReply(false)
                      }} disabled={sendingReply || !reply.trim()} className="inline-flex items-center justify-center gap-2 rounded-full bg-[#111111] px-5 py-2.5 text-[12px] font-semibold text-white transition hover:bg-[#123d5d] disabled:opacity-50"><Send size={14} />{sendingReply ? 'Sending…' : 'Send Reply'}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </DashboardShell>
  )
}
