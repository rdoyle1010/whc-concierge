'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Briefcase } from 'lucide-react'

// Every job listing on the platform, with the kill switch admin never had:
// pause anything inappropriate instantly, relist when resolved.

export default function AdminJobsPage() {
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')

  async function load() {
    try {
      const res = await fetch('/api/admin/listings?kind=jobs')
      const j = res.ok ? await res.json() : { rows: [] }
      setRows(j.rows || [])
    } catch { /* empty */ }
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  async function toggleLive(id: string) {
    setError('')
    setBusyId(id)
    try {
      const res = await fetch('/api/admin/listings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'job_toggle_live', id }),
      })
      const j = await res.json()
      if (!res.ok) { setError(j.error || 'Could not update.'); return }
      setRows(rs => rs.map(r => r.id === id ? { ...r, is_live: j.is_live, status: j.is_live ? 'active' : 'paused' } : r))
    } catch { setError('Something went wrong - please try again.') } finally { setBusyId(null) }
  }

  const filtered = rows.filter(r => {
    if (filter === 'live') return r.is_live
    if (filter === 'paused') return !r.is_live && r.status !== 'pending_payment'
    if (filter === 'pending_payment') return r.status === 'pending_payment'
    return true
  })

  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Job Listings</h1>
      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}

      <div className="flex space-x-2 mb-6">
        {['all', 'live', 'paused', 'pending_payment'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-2 text-sm font-medium rounded-xl transition-colors capitalize ${filter === f ? 'bg-ink text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
            {f.replace('_', ' ')} {f !== 'all' && `(${rows.filter(r => f === 'live' ? r.is_live : f === 'paused' ? (!r.is_live && r.status !== 'pending_payment') : r.status === 'pending_payment').length})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <Briefcase size={48} className="mx-auto mb-4 opacity-30" />
          <p>No job listings{filter !== 'all' ? ' in this state' : ' yet'}.</p>
        </div>
      ) : (
        <div className="dashboard-card overflow-x-auto">
          <table className="w-full text-left text-[13px]">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-gray-400 border-b border-border">
                <th className="py-2 pr-4">Role</th>
                <th className="py-2 pr-4">Property</th>
                <th className="py-2 pr-4">Tier</th>
                <th className="py-2 pr-4">Posted</th>
                <th className="py-2 pr-4">Expires</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(j => (
                <tr key={j.id} className="border-b border-border/60">
                  <td className="py-2.5 pr-4 font-medium text-ink">{j.job_title || j.title || 'Untitled role'}</td>
                  <td className="py-2.5 pr-4">{j.employer_name}</td>
                  <td className="py-2.5 pr-4">{j.tier || '-'}</td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">{j.posted_date ? new Date(j.posted_date).toLocaleDateString('en-GB') : '-'}</td>
                  <td className="py-2.5 pr-4 whitespace-nowrap">{j.expires_at ? new Date(j.expires_at).toLocaleDateString('en-GB') : '-'}</td>
                  <td className="py-2.5 pr-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${j.is_live ? 'bg-green-50 text-green-700' : j.status === 'pending_payment' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {j.is_live ? 'live' : (j.status || 'paused')}
                    </span>
                  </td>
                  <td className="py-2.5 text-right">
                    {j.status !== 'pending_payment' && (
                      <button onClick={() => toggleLive(j.id)} disabled={busyId === j.id}
                        className={`text-[11px] font-medium px-3 py-1.5 rounded-lg disabled:opacity-50 ${j.is_live ? 'bg-red-50 text-red-600 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'}`}>
                        {busyId === j.id ? '...' : j.is_live ? 'Take down' : 'Relist'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  )
}
