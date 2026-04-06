'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Search, MapPin, Star, Heart, X, MessageSquare } from 'lucide-react'
import { notify } from '@/lib/notify'

export default function EmployerCandidatesPage() {
  const supabase = createClient()
  const [candidates, setCandidates] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [specFilter, setSpecFilter] = useState('')
  const [profile, setProfile] = useState<any>(null)

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const { data: prof } = await supabase.from('employer_profiles').select('*').eq('user_id', user.id).single()
      setProfile(prof)

      // Fetch candidates and blocked list in parallel
      const [candidateRes, blocksRes] = await Promise.all([
        supabase.from('candidate_profiles').select('*').order('created_at', { ascending: false }),
        prof ? supabase.from('profile_blocks').select('candidate_id').eq('blocked_employer_id', prof.id) : Promise.resolve({ data: [] }),
      ])

      const blockedIds = new Set((blocksRes.data || []).map((b: any) => b.candidate_id))
      const visible = (candidateRes.data || []).filter((c: any) => !blockedIds.has(c.id))

      setCandidates(visible)
      setLoading(false)
    }
    load()
  }, [])

  const filtered = candidates.filter((c) => {
    if (search && !c.full_name?.toLowerCase().includes(search.toLowerCase()) &&
        !c.headline?.toLowerCase().includes(search.toLowerCase())) return false
    if (specFilter && !(c.services_offered || []).some((s: string) => s.toLowerCase().includes(specFilter.toLowerCase()))) return false
    return true
  })

  const handleSwipe = async (candidateId: string, direction: 'left' | 'right') => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    await supabase.from('swipes').insert({
      user_id: user.id, target_id: candidateId, direction, target_type: 'candidate',
    })
    if (direction === 'right') {
      // Notify candidate they were shortlisted
      const candidate = candidates.find(c => c.id === candidateId)
      if (candidate?.user_id) {
        notify(candidate.user_id, 'new_match', 'You\'ve been shortlisted', `An employer has shortlisted your profile. Check your matches for details.`, '/talent/dashboard')
      }
    }
  }

  return (
    <DashboardShell role="employer" userName={profile?.company_name}>
      <h1 className="text-2xl font-serif font-bold text-ink mb-6">Browse Candidates</h1>

      <div className="dashboard-card mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by name or headline..." value={search}
              onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
          </div>
          <input type="text" placeholder="Filter by specialism..." value={specFilter}
            onChange={(e) => setSpecFilter(e.target.value)} className="input-field" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <div key={c.id} className="dashboard-card">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {c.profile_image_url ? (
                    <img src={c.profile_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-serif font-bold text-gray-300 text-lg">{c.full_name?.[0]}</span>
                  )}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-ink truncate">{c.full_name}</h3>
                  <p className="text-sm text-gray-500 truncate">{c.headline}</p>
                </div>
              </div>

              {c.location && (
                <p className="text-sm text-gray-500 flex items-center space-x-1 mb-2">
                  <MapPin size={14} /><span>{c.location}</span>
                </p>
              )}

              {c.services_offered?.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {c.services_offered.slice(0, 3).map((s: string) => (
                    <span key={s} className="text-xs bg-gold/10 text-gold px-2 py-0.5 rounded-full">{s}</span>
                  ))}
                  {c.services_offered.length > 3 && <span className="text-xs text-gray-400">+{c.services_offered.length - 3}</span>}
                </div>
              )}

              {c.experience_years && <p className="text-xs text-gray-400 mb-3">{c.experience_years} years experience</p>}

              <div className="flex items-center space-x-2 pt-3 border-t border-gray-100">
                <button onClick={() => handleSwipe(c.id, 'left')}
                  className="flex-1 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-400 flex items-center justify-center space-x-1 text-sm">
                  <X size={14} /><span>Pass</span>
                </button>
                <button onClick={() => handleSwipe(c.id, 'right')}
                  className="flex-1 py-2 rounded-lg bg-gold/10 hover:bg-gold/20 text-gold flex items-center justify-center space-x-1 text-sm">
                  <Heart size={14} /><span>Shortlist</span>
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-16 text-gray-400">No candidates found.</div>
          )}
        </div>
      )}
    </DashboardShell>
  )
}
