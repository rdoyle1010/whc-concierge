'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { MessageSquare, Mail, Eye, Trash2, Check, Send } from 'lucide-react'
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
  const perPage = 25

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/content?kind=contact_queries')
      const j = res.ok ? await res.json() : { rows: [] }
      setQueries(j.rows || [])
      setLoading(false)
    }
    load()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query_status', id, status }) })
    setQueries(queries.map(q => q.id === id ? { ...q, status } : q))
  }

  const deleteQuery = async (id: string) => {
    if (!confirm('Delete this message?')) return
    await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query_delete', id }) })
    setQueries(queries.filter(q => q.id !== id))
    if (selected?.id === id) setSelected(null)
  }

  const filtered = queries.filter(q => {
    if (filter === 'all') return q.type !== 'complaint'
    return q.status === filter && q.type !== 'complaint'
  })

  const statusColors: Record<string, string> = {
    open: 'bg-amber-50 text-amber-700', replied: 'bg-green-50 text-green-700', closed: 'bg-gray-100 text-gray-500',
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Messages & Enquiries</h1>

      <div className="flex space-x-2 mb-6">
        {['all', 'open', 'replied', 'closed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors capitalize ${
              filter === f ? 'bg-ink text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>{f}</button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* List */}
        <div className="lg:col-span-1 space-y-2 max-h-[70vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400"><Mail size={32} className="mx-auto mb-2 opacity-50" /><p className="text-sm">No messages</p></div>
          ) : filtered.slice((page - 1) * perPage, page * perPage).map((q) => (
            <button key={q.id} onClick={() => setSelected(q)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selected?.id === q.id ? 'border-gold/30 bg-gold/5' : 'border-gray-100 bg-white hover:bg-gray-50'
              }`}>
              <div className="flex items-center justify-between mb-1">
                <p className="font-medium text-ink text-sm truncate">{q.name}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full ${statusColors[q.status] || 'bg-gray-100 text-gray-500'}`}>{q.status}</span>
              </div>
              <p className="text-xs text-gray-500 truncate">{q.subject || q.message}</p>
              <p className="text-xs text-gray-300 mt-1">{new Date(q.created_at).toLocaleDateString()}</p>
            </button>
          ))}
          <Pagination page={page} perPage={perPage} total={filtered.length} showPerPage={false} onPageChange={setPage} />
        </div>

        {/* Detail */}
        <div className="lg:col-span-2">
          {!selected ? (
            <div className="dashboard-card flex items-center justify-center h-64 text-gray-300">
              <div className="text-center"><MessageSquare size={32} className="mx-auto mb-2" /><p className="text-sm">Select a message to view</p></div>
            </div>
          ) : (
            <div className="dashboard-card">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="font-serif text-xl font-semibold text-ink">{selected.subject}</h3>
                  <p className="text-sm text-gray-500">{selected.name} &middot; {selected.email}</p>
                  <p className="text-xs text-gray-300 mt-1">{new Date(selected.created_at).toLocaleString()}</p>
                  {selected.type && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full mt-2 inline-block">{selected.type}</span>}
                </div>
                <div className="flex space-x-2">
                  <button onClick={() => updateStatus(selected.id, 'replied')} className="p-2 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600" title="Mark replied"><Check size={18} /></button>
                  <button onClick={() => deleteQuery(selected.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete"><Trash2 size={18} /></button>
                </div>
              </div>
              <div className="p-6 bg-gray-50 rounded-xl">
                <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
              </div>

              {/* Real reply - emails the enquirer directly */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Reply by email to {selected.email}</label>
                <textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} className="input-field mb-2"
                  placeholder={`Hi ${selected.name?.split(' ')[0] || 'there'},`} />
                {replyMsg && <p className={`text-xs mb-2 ${replyMsg.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>{replyMsg}</p>}
                <button
                  onClick={async () => {
                    setSendingReply(true); setReplyMsg('')
                    try {
                      const res = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query_reply', id: selected.id, message: reply }) })
                      const j = await res.json()
                      if (!res.ok) { setReplyMsg(j.error || 'Could not send.') }
                      else { setReplyMsg('Reply sent.'); setReply(''); setQueries(qs => qs.map(q => q.id === selected.id ? { ...q, status: 'replied' } : q)); setSelected({ ...selected, status: 'replied' }) }
                    } catch { setReplyMsg('Could not send - please try again.') }
                    setSendingReply(false)
                  }}
                  disabled={sendingReply || !reply.trim()}
                  className="btn-primary text-sm flex items-center gap-2 disabled:opacity-50">
                  <Send size={14} /> {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
              <div className="flex space-x-2 mt-4">
                {['open', 'replied', 'closed'].map((s) => (
                  <button key={s} onClick={() => updateStatus(selected.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      selected.status === s ? 'bg-gold/10 text-gold' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>{s}</button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
