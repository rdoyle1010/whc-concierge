'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, Eye, X } from 'lucide-react'

export default function AdminComplaintsPage() {
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState('all')
  const [reply, setReply] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [replyMsg, setReplyMsg] = useState('')

  useEffect(() => {
    async function load() {
      // Complaints come from contact_queries with type='complaint' -
      // fetched through the service-role admin API (table is RLS-locked)
      const res = await fetch('/api/admin/content?kind=contact_queries')
      const j = res.ok ? await res.json() : { rows: [] }
      setComplaints((j.rows || []).filter((q: any) => q.type === 'complaint'))
      setLoading(false)
    }
    load()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query_status', id, status }) })
    setComplaints(complaints.map(c => c.id === id ? { ...c, status } : c))
    if (selected?.id === id) setSelected({ ...selected, status })
  }

  const filtered = complaints.filter(c => filter === 'all' || c.status === filter)

  const statusColors: Record<string, string> = {
    open: 'bg-red-50 text-red-700', investigating: 'bg-amber-50 text-amber-700',
    resolved: 'bg-green-50 text-green-700', dismissed: 'bg-gray-100 text-gray-500',
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Complaint Handling</h1>

      <div className="flex space-x-2 mb-6 overflow-x-auto">
        {['all', 'open', 'investigating', 'resolved', 'dismissed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors capitalize whitespace-nowrap ${
              filter === f ? 'bg-ink text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>{f} {f !== 'all' && `(${complaints.filter(c => c.status === f).length})`}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <AlertTriangle size={48} className="mx-auto mb-4 opacity-30" />
          <p>No complaints found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div key={c.id} className="dashboard-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-serif text-lg font-semibold text-ink">{c.subject || c.message}</h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[c.status] || 'bg-gray-100 text-gray-500'}`}>{c.status}</span>
                  </div>
                  <p className="text-sm text-gray-500">From: {c.name} ({c.email})</p>
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">{c.message}</p>
                  <p className="text-xs text-gray-300 mt-2">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <button onClick={() => setSelected(c)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 ml-4"><Eye size={18} /></button>
              </div>
              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                {['open', 'investigating', 'resolved', 'dismissed'].map((s) => (
                  <button key={s} onClick={() => updateStatus(c.id, s)}
                    className={`text-xs px-3 py-1.5 rounded-lg capitalize transition-colors ${
                      c.status === s ? 'bg-gold/10 text-gold' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}>{s}</button>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-3xl max-w-lg w-full p-8 animate-fade-in-up" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-4">
              <h2 className="font-serif text-xl font-bold text-ink">{selected.subject || selected.message}</h2>
              <button onClick={() => setSelected(null)} className="text-gray-300 hover:text-gray-500"><X size={20} /></button>
            </div>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[selected.status] || ''}`}>{selected.status}</span>
            <div className="mt-4 p-4 bg-gray-50 rounded-xl">
              <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{selected.message}</p>
            </div>
            <div className="mt-4 text-sm text-gray-400">
              <p>From: {selected.name} ({selected.email})</p>
              <p>Filed: {new Date(selected.created_at).toLocaleString()}</p>
            </div>

            {/* Real reply - emails the complainant directly */}
            <div className="mt-5 pt-5 border-t border-gray-100">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Reply by email to {selected.email}</label>
              <textarea rows={4} value={reply} onChange={(e) => setReply(e.target.value)} className="input-field mb-2"
                placeholder={`Hi ${selected.name?.split(' ')[0] || 'there'}, thank you for raising this...`} />
              {replyMsg && <p className={`text-xs mb-2 ${replyMsg.includes('sent') ? 'text-green-600' : 'text-red-600'}`}>{replyMsg}</p>}
              <button
                onClick={async () => {
                  setSendingReply(true); setReplyMsg('')
                  try {
                    const res = await fetch('/api/admin/content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'query_reply', id: selected.id, message: reply, markStatus: 'investigating' }) })
                    const j = await res.json()
                    if (!res.ok) { setReplyMsg(j.error || 'Could not send.') }
                    else {
                      setReplyMsg('Reply sent.')
                      setReply('')
                      setComplaints(cs => cs.map(c => c.id === selected.id ? { ...c, status: 'investigating' } : c))
                      setSelected({ ...selected, status: 'investigating' })
                    }
                  } catch { setReplyMsg('Could not send - please try again.') }
                  setSendingReply(false)
                }}
                disabled={sendingReply || !reply.trim()}
                className="btn-primary text-sm disabled:opacity-50">
                {sendingReply ? 'Sending...' : 'Send Reply'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
