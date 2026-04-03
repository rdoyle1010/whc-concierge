'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Search, Users, Building2, Trash2, CheckCircle, XCircle } from 'lucide-react'

export default function AdminUsersPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'candidates' | 'employers'>('candidates')
  const [candidates, setCandidates] = useState<any[]>([])
  const [employers, setEmployers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    async function load() {
      const [c, e] = await Promise.all([
        supabase.from('candidate_profiles').select('*').order('created_at', { ascending: false }),
        supabase.from('employer_profiles').select('*').order('created_at', { ascending: false }),
      ])
      setCandidates(c.data || [])
      setEmployers(e.data || [])
      setLoading(false)
    }
    load()
  }, [])

  const toggleVerified = async (table: string, id: string, current: boolean) => {
    await supabase.from(table).update({ verified: !current }).eq('id', id)
    if (table === 'candidate_profiles') {
      setCandidates(candidates.map(c => c.id === id ? { ...c, verified: !current } : c))
    } else {
      setEmployers(employers.map(e => e.id === id ? { ...e, verified: !current } : e))
    }
  }

  const deleteUser = async (table: string, id: string) => {
    if (!confirm('Delete this user? This cannot be undone.')) return
    await supabase.from(table).delete().eq('id', id)
    if (table === 'candidate_profiles') {
      setCandidates(candidates.filter(c => c.id !== id))
    } else {
      setEmployers(employers.filter(e => e.id !== id))
    }
  }

  const filteredCandidates = candidates.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase()) || c.email?.toLowerCase().includes(search.toLowerCase())
  )
  const filteredEmployers = employers.filter(e =>
    !search || e.company_name?.toLowerCase().includes(search.toLowerCase()) || e.email?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">User Management</h1>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit mb-6">
        <button onClick={() => setTab('candidates')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${tab === 'candidates' ? 'bg-white text-ink shadow-sm' : 'text-gray-500'}`}>
          <Users size={16} /><span>Candidates ({candidates.length})</span>
        </button>
        <button onClick={() => setTab('employers')} className={`px-4 py-2 text-sm font-medium rounded-md transition-colors flex items-center space-x-2 ${tab === 'employers' ? 'bg-white text-ink shadow-sm' : 'text-gray-500'}`}>
          <Building2 size={16} /><span>Employers ({employers.length})</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input type="text" placeholder="Search by name or email..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : tab === 'candidates' ? (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Location</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Verified</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Joined</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredCandidates.map((c) => (
                <tr key={c.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-ink">{c.full_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{c.location || '—'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleVerified('candidate_profiles', c.id, c.verified)}
                      className={`p-1 rounded ${c.verified ? 'text-green-600' : 'text-gray-300 hover:text-green-400'}`}>
                      <CheckCircle size={18} />
                    </button>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400">{new Date(c.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => deleteUser('candidate_profiles', c.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredCandidates.length === 0 && <p className="text-center text-gray-400 py-8">No candidates found.</p>}
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Company</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Contact</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-gray-500 uppercase">Verified</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filteredEmployers.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-ink">{e.company_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{e.contact_name}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{e.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{e.property_type || '—'}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => toggleVerified('employer_profiles', e.id, e.verified)}
                      className={`p-1 rounded ${e.verified ? 'text-green-600' : 'text-gray-300 hover:text-green-400'}`}>
                      <CheckCircle size={18} />
                    </button>
                  </td>
                  <td className="px-6 py-4">
                    <button onClick={() => deleteUser('employer_profiles', e.id)} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredEmployers.length === 0 && <p className="text-center text-gray-400 py-8">No employers found.</p>}
        </div>
      )}
    </DashboardShell>
  )
}
