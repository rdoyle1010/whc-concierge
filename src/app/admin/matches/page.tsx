'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Heart, Search } from 'lucide-react'
import Pagination from '@/components/Pagination'

export default function AdminMatchesPage() {
  const supabase = createClient()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [perPage, setPerPage] = useState(25)

  useEffect(() => {
    async function load() {
      // Service-role API: RLS hides other users' matches from the browser client
      const res = await fetch('/api/admin/matches').catch(() => null)
      const data = res ? await res.json().catch(() => null) : null
      if (!res || !res.ok) setError(data?.error || 'Could not load matches.')
      setMatches(data?.matches || [])
      setLoading(false)
    }
    load()
  }, [])

  const filtered = matches.filter(m => {
    if (!search) return true
    const s = search.toLowerCase()
    return m.candidate_profiles?.full_name?.toLowerCase().includes(s) ||
           m.employer_profiles?.company_name?.toLowerCase().includes(s) ||
           m.job_listings?.title?.toLowerCase().includes(s)
  })

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-7">
        <p className="dashboard-eyebrow">Platform</p>
        <h1 className="dashboard-title">Match Viewer</h1>
        <p className="dashboard-intro">Every mutual match between talent and properties across the platform.</p>
      </div>

      {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6 border border-red-100">{error}</div>}

      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input type="text" placeholder="Search matches..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="input-field pl-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-muted">
          <Heart size={48} className="mx-auto mb-4 opacity-50" />
          <p>No matches found.</p>
        </div>
      ) : (
        <>
        <div className="bg-white rounded-xl border border-[#e3e7eb] overflow-hidden">
          <table className="w-full">
            <thead className="bg-[#f5f6f8] border-b border-[#e3e7eb]">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase">Candidate</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase">Employer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase">Job</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase">Score</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-secondary uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.slice((page - 1) * perPage, page * perPage).map((m) => (
                <tr key={m.id} className="hover:bg-[#f5f6f8]">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-ink">{m.candidate_profiles?.full_name || '-'}</p>
                    <p className="text-xs text-muted">{m.candidate_profiles?.headline}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.employer_profiles?.company_name || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.job_listings?.title || '-'}</td>
                  <td className="px-6 py-4">
                    {(m.match_score ?? m.score) != null ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2">
                          <div className="bg-accent h-2 rounded-full" style={{ width: `${(m.match_score ?? m.score)}%` }} />
                        </div>
                        <span className="text-xs text-secondary">{(m.match_score ?? m.score)}%</span>
                      </div>
                    ) : '-'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      m.status === 'active' ? 'bg-green-50 text-green-700' :
                      m.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-secondary'
                    }`}>{m.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-muted">{new Date(m.matched_at || m.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination page={page} perPage={perPage} total={filtered.length} onPageChange={setPage} onPerPageChange={setPerPage} />
        </>
      )}
    </DashboardShell>
  )
}
