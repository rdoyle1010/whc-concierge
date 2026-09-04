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
  const [actionError, setActionError] = useState('')
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
    setActionError('')
    try {
      const res = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query_status', id, status }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setActionError(j.error || 'Could not update the message status.'); return }
      if (selected?.id === id) setSelected({ ...selected, status })
      await load(page, filter)
    } catch { setActionError('Could not update the message status - please try again.') }
  }

  const deleteQuery = async (id: string) => {
    if (!confirm('Delete this message?')) return
    setActionError('')
    try {
      const res = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query_delete', id }) })
      const j = await res.json().catch(() => ({}))
      if (!res.ok) { setActionError(j.error || 'Could not delete the message.'); return }
      if (selected?.id === id) setSelected(null)
      await load(page, filter)
    } catch { setActionError('Could not delete the message - please try again.') }
  }

  const statusColors: Record<string, string> = {
    open: 'border-amber-200 bg-amber-50 text-amber-700',
    replied: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    closed: 'border-[#dddddd] bg-[#f1f1f1] text-[#6b6b6b]',
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
          <button key={f} type="button" onClick={() => changeFilter(f)} className={`capitalize text-[11px] ${filter === f ? 'btn-primary !py-2' : 'btn-secondary !py-2'}`}>{f}</button>
        ))}
      </div>

      {actionError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-5 border border-red-100">{actionError}</div>}

      <div className="overflow-hidden border border-[#dddddd] bg-white">
        <div className="grid min-h-[640px] grid-cols-1 lg:grid-cols-[360px_minmax(0,1fr)]">
          <aside className="border-b border-[#dddddd] bg-[#f1f1f1] lg:border-b-0 lg:border-r">
            <div className="border-b border-[#dddddd] px-5 py-5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1c1c1c]">Inbox</p>
              <p className="mt-1 text-[12px] text-[#6b6b6b]">{total} message{total === 1 ? '' : 's'}</p>
            </div>
            <div className="max-h-[570px] overflow-y-auto">
              {loading ? (
                <div className="space-y-3 p-4">{[1,2,3,4].map(i => <div key={i} className="h-[86px] animate-pulse rounded-2xl bg-[#f1f1f1]" />)}</div>
              ) : queries.length === 0 ? (
                <div className="flex min-h-[300px] flex-col items-center justify-center px-8 text-center">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-[#dddddd] bg-white text-[#1c1c1c]"><Mail size={20} /></div>
                  <p className="text-[15px] font-medium text-[#1c1c1c]">No messages here</p>
                  <p className="mt-2 text-[12px] leading-5 text-[#6b6b6b]">New enquiries will appear here when they arrive.</p>
                </div>
              ) : queries.map((q) => {
                const active = selected?.id === q.id
                const initials = String(q.name || 'Q').split(' ').map((part: string) => part[0]).join('').slice(0,2).toUpperCase()
                return (
                  <button key={q.id} type="button" onClick={() => setSelected(q)} className={`w-full border-b border-[#dddddd] px-4 py-4 text-left transition ${active ? 'bg-white' : 'hover:bg-white/70'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full border text-[11px] font-semibold ${active ? 'border-[#555555] bg-[#f1f1f1] text-[#1c1c1c]' : 'border-[#dddddd] bg-white text-[#555555]'}`}>{initials}</div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#1c1c1c]">{q.name}</p>
                          <span className={`rounded-full border px-2 py-0.5 text-[9px] font-semibold capitalize ${statusColors[q.status] || 'border-[#dddddd] bg-[#f1f1f1] text-[#6b6b6b]'}`}>{q.status}</span>
                        </div>
                        <p className="mt-1 truncate text-[11px] font-medium text-[#555555]">{q.subject || 'General enquiry'}</p>
                        <p className="mt-1 truncate text-[10px] text-[#6b6b6b]">{q.message}</p>
                        <p className="mt-2 text-[9px] uppercase tracking-[0.08em] text-[#6b6b6b]">{new Date(q.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
            <div className="border-t border-[#dddddd] bg-white px-4 py-3"><Pagination page={page} perPage={perPage} total={total} showPerPage={false} onPageChange={setPage} /></div>
          </aside>

          <section className="min-w-0 bg-[#f1f1f1]">
            {!selected ? (
              <div className="flex min-h-[640px] flex-col items-center justify-center px-8 text-center">
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-[#dddddd] bg-white text-[#1c1c1c]"><MessageSquare size={22} /></div>
                <p className="text-[20px] font-medium tracking-[-0.02em] text-[#1c1c1c]">Select an enquiry</p>
                <p className="mt-2 max-w-sm text-[12px] leading-5 text-[#6b6b6b]">Open a message from the inbox to review the enquiry and reply.</p>
              </div>
            ) : (
              <div className="flex min-h-[640px] flex-col">
                <header className="flex flex-col gap-4 border-b border-[#dddddd] bg-white px-5 py-5 sm:flex-row sm:items-start sm:justify-between md:px-7">
                  <div className="min-w-0">
                    <div className="mb-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full border px-2.5 py-1 text-[9px] font-semibold capitalize ${statusColors[selected.status] || 'border-[#dddddd] bg-[#f1f1f1] text-[#6b6b6b]'}`}>{selected.status}</span>
                      {selected.type && <span className="rounded-full border border-[#dddddd] bg-[#f1f1f1] px-2.5 py-1 text-[9px] font-semibold text-[#555555]">{selected.type}</span>}
                    </div>
                    <h2 className="text-[24px] font-medium tracking-[-0.03em] text-[#1c1c1c]">{selected.subject || 'General enquiry'}</h2>
                    <p className="mt-2 text-[12px] text-[#555555]">{selected.name} · {selected.email}</p>
                    <p className="mt-1 text-[10px] text-[#6b6b6b]">{new Date(selected.created_at).toLocaleString('en-GB')}</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => updateStatus(selected.id, 'replied')} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dddddd] bg-white text-[#555555] transition hover:border-emerald-300 hover:bg-emerald-50 hover:text-emerald-700" title="Mark replied"><Check size={17} /></button>
                    <button type="button" onClick={() => deleteQuery(selected.id)} className="flex h-10 w-10 items-center justify-center rounded-full border border-[#dddddd] bg-white text-[#6b6b6b] transition hover:border-red-200 hover:bg-red-50 hover:text-red-600" title="Delete"><Trash2 size={17} /></button>
                  </div>
                </header>

                <div className="flex-1 px-5 py-6 md:px-7">
                  <div className="rounded-[20px] border border-[#dddddd] bg-white p-5 shadow-sm md:p-6">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1c1c1c]">Enquiry</p>
                    <p className="mt-4 whitespace-pre-wrap text-[13px] leading-6 text-[#3a3a3a]">{selected.message}</p>
                  </div>

                  <div className="mt-6 rounded-[20px] border border-[#dddddd] bg-white p-5 md:p-6">
                    <div className="mb-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[#1c1c1c]">Reply</p>
                      <p className="mt-1 text-[12px] text-[#6b6b6b]">Reply by email to {selected.email}</p>
                    </div>
                    <textarea rows={6} value={reply} onChange={(e) => setReply(e.target.value)} className="w-full resize-y rounded-2xl border border-[#dddddd] bg-[#f1f1f1] px-4 py-3 text-[13px] leading-6 text-[#1c1c1c] outline-none transition placeholder:text-[#6b6b6b] focus:border-[#555555] focus:bg-white" placeholder={`Hi ${selected.name?.split(' ')[0] || 'there'},`} />
                    {replyMsg && <p className={`mt-2 text-[11px] ${replyMsg.includes('sent') ? 'text-emerald-600' : 'text-red-600'}`}>{replyMsg}</p>}
                    <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2">
                        {['open', 'replied', 'closed'].map((s) => (
                          <button key={s} type="button" onClick={() => updateStatus(selected.id, s)} className={`capitalize text-[10px] ${selected.status === s ? 'btn-primary !py-1.5 !px-3' : 'btn-secondary !py-1.5 !px-3'}`}>{s}</button>
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
                      }} disabled={sendingReply || !reply.trim()} className="btn-primary inline-flex items-center justify-center gap-2 text-[12px] disabled:opacity-50"><Send size={14} />{sendingReply ? 'Sending...' : 'Send Reply'}</button>
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
