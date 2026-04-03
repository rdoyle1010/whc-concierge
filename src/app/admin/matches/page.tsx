'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Heart, Search } from 'lucide-react'

export default function AdminMatchesPage() {
  const supabase = createClient()
  const [matches, setMatches] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('matches')
        .select('*, candidate_profiles(full_name, email, headline), employer_profiles(company_name, email), job_listings(title)')
        .order('created_at', { ascending: false })

      setMatches(data || [])
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
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Match Viewer</h1>

      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search matches..." value={search}
          onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">
          <Heart size={48} className="mx-auto mb-4 opacity-50" />
          <p>No matches found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Candidate</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Employer</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Job</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Score</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="text-sm font-medium text-ink">{m.candidate_profiles?.full_name || '—'}</p>
                    <p className="text-xs text-gray-400">{m.candidate_profiles?.headline}</p>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.employer_profiles?.company_name || '—'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{m.job_listings?.title || '—'}</td>
                  <td className="px-6 py-4">
                    {m.score != null ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-100 rounded-full h-2">
                          <div className="gold-gradient h-2 rounded-full" style={{ width: `${m.score}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{m.score}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      m.status === 'active' ? 'bg-green-50 text-green-700' :
                      m.status === 'pending' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-500'
                    }`}>{m.status}</span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{new Date(m.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </DashboardShell>
  )
}
