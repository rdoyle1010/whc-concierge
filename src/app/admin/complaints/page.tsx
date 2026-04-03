'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { AlertTriangle, CheckCircle, Search as SearchIcon, Eye } from 'lucide-react'

export default function AdminComplaintsPage() {
  const supabase = createClient()
  const [complaints, setComplaints] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<any>(null)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from('complaints').select('*').order('created_at', { ascending: false })
      setComplaints(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const updateStatus = async (id: string, status: string) => {
    await supabase.from('complaints').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    setComplaints(complaints.map(c => c.id === id ? { ...c, status } : c))
    if (selected?.id === id) setSelected({ ...selected, status })
  }

  const filtered = complaints.filter(c => filter === 'all' || c.status === filter)

  const statusColors: Record<string, string> = {
    open: 'bg-red-50 text-red-700',
    investigating: 'bg-amber-50 text-amber-700',
    resolved: 'bg-green-50 text-green-700',
    dismissed: 'bg-gray-100 text-gray-500',
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Complaint Handling</h1>

      {/* Filter */}
      <div className="flex space-x-2 mb-6">
        {['all', 'open', 'investigating', 'resolved', 'dismissed'].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors capitalize ${
              filter === f ? 'bg-ink text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}>{f} {f !== 'all' && `(${complaints.filter(c => c.status === f).length})`}</button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <AlertTriangle size={48} className="mx-auto mb-4 opacity-50" />
          <p>No complaints found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((c) => (
            <div key={c.id} className="dashboard-card">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="font-serif text-lg font-semibold text-ink">{c.subject}</h3>
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[c.status] || ''}`}>{c.status}</span>
                  </div>
                  <p className="text-sm text-gray-600 line-clamp-2">{c.description}</p>
                  <p className="text-xs text-gray-400 mt-2">
                    Filed: {new Date(c.created_at).toLocaleDateString()}
                    {c.updated_at && ` | Updated: ${new Date(c.updated_at).toLocaleDateString()}`}
                  </p>
                </div>
                <div className="flex items-center space-x-2 ml-4">
                  <button onClick={() => setSelected(c)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><Eye size={18} /></button>
                </div>
              </div>
              {/* Status actions */}
              <div className="flex space-x-2 mt-4 pt-4 border-t border-gray-100">
                {c.status !== 'investigating' && (
                  <button onClick={() => updateStatus(c.id, 'investigating')} className="text-xs px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 hover:bg-amber-100">Mark Investigating</button>
                )}
                {c.status !== 'resolved' && (
                  <button onClick={() => updateStatus(c.id, 'resolved')} className="text-xs px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100">Resolve</button>
                )}
                {c.status !== 'dismissed' && (
                  <button onClick={() => updateStatus(c.id, 'dismissed')} className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 text-gray-500 hover:bg-gray-200">Dismiss</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail modal */}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-lg w-full p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl font-bold mb-2">{selected.subject}</h2>
            <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[selected.status] || ''}`}>{selected.status}</span>
            <p className="text-gray-600 mt-4 whitespace-pre-wrap">{selected.description}</p>
            <p className="text-xs text-gray-400 mt-4">Reporter ID: {selected.reporter_id}</p>
            {selected.reported_id && <p className="text-xs text-gray-400">Reported ID: {selected.reported_id}</p>}
            <p className="text-xs text-gray-400">Filed: {new Date(selected.created_at).toLocaleString()}</p>
            <button onClick={() => setSelected(null)} className="btn-secondary w-full mt-6">Close</button>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
