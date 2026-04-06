'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Search, Users, Building2, CheckCircle, XCircle, Clock, Eye, X, FileText, ExternalLink } from 'lucide-react'
import { notify } from '@/lib/notify'

export default function AdminUsersPage() {
  const supabase = createClient()
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [candidates, setCandidates] = useState<any[]>([])
  const [employers, setEmployers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<any>(null)
  const [selectedType, setSelectedType] = useState<'candidate' | 'employer'>('candidate')
  const [rejectReason, setRejectReason] = useState('')
  const [showReject, setShowReject] = useState(false)

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

  const filterByStatus = (items: any[]) => {
    let filtered = items.filter(i => (i.approval_status || 'pending') === tab)
    if (search) filtered = filtered.filter(i => (i.full_name || i.company_name || '').toLowerCase().includes(search.toLowerCase()) || (i.email || '').toLowerCase().includes(search.toLowerCase()))
    return filtered
  }

  const approve = async (type: 'candidate' | 'employer', id: string) => {
    const table = type === 'candidate' ? 'candidate_profiles' : 'employer_profiles'
    await supabase.from(table).update({ approval_status: 'approved' }).eq('id', id)
    if (type === 'candidate') setCandidates(candidates.map(c => c.id === id ? { ...c, approval_status: 'approved' } : c))
    else setEmployers(employers.map(e => e.id === id ? { ...e, approval_status: 'approved' } : e))
    // Notify the user their profile was approved
    const profile = type === 'candidate' ? candidates.find(c => c.id === id) : employers.find(e => e.id === id)
    if (profile?.user_id) {
      const dashboard = type === 'candidate' ? '/talent/dashboard' : '/employer/dashboard'
      notify(profile.user_id, 'profile_approved', 'Profile approved', 'Your profile has been approved and is now live. Employers can find you in search results.', dashboard)
    }
    setSelected(null)
  }

  const reject = async (type: 'candidate' | 'employer', id: string) => {
    const table = type === 'candidate' ? 'candidate_profiles' : 'employer_profiles'
    await supabase.from(table).update({ approval_status: 'rejected', approval_notes: rejectReason }).eq('id', id)
    if (type === 'candidate') setCandidates(candidates.map(c => c.id === id ? { ...c, approval_status: 'rejected', approval_notes: rejectReason } : c))
    else setEmployers(employers.map(e => e.id === id ? { ...e, approval_status: 'rejected', approval_notes: rejectReason } : e))
    setShowReject(false); setRejectReason(''); setSelected(null)
  }

  const statusBadge = (status: string) => {
    if (status === 'approved') return 'bg-emerald-50 text-emerald-700'
    if (status === 'rejected') return 'bg-red-50 text-red-700'
    return 'bg-amber-50 text-amber-700'
  }

  const pendingCount = candidates.filter(c => (c.approval_status || 'pending') === 'pending').length + employers.filter(e => (e.approval_status || 'pending') === 'pending').length

  return (
    <DashboardShell role="admin" userName="Admin">
      <h1 className="text-2xl font-bold text-black mb-6">User Management</h1>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6">
        {(['pending', 'approved', 'rejected'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-black text-white' : 'text-neutral-400 hover:text-black'}`}>
            {t} {t === 'pending' && pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
        ))}
      </div>

      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-300" />
        <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} className="input-field pl-10" />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-black border-t-transparent rounded-full" /></div>
      ) : (
        <div className="space-y-2">
          {/* Candidates */}
          {filterByStatus(candidates).map((c) => (
            <div key={c.id} className="bg-white border border-neutral-200 p-4 flex items-center justify-between hover:border-neutral-400 transition-colors cursor-pointer" onClick={() => { setSelected(c); setSelectedType('candidate') }}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-400"><Users size={14} /></div>
                <div>
                  <p className="text-sm font-medium text-black">{c.full_name} <span className="text-neutral-300 font-normal">— {c.role_level || 'Candidate'}</span></p>
                  <p className="text-xs text-neutral-400">{c.email} &middot; {new Date(c.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {c.cv_url && <span title="CV uploaded"><FileText size={14} className="text-neutral-300" /></span>}
                {c.work_email && <span className="text-xs text-neutral-300">Verified email</span>}
                <span className={`text-xs font-medium px-2 py-1 ${statusBadge(c.approval_status || 'pending')}`}>{c.approval_status || 'pending'}</span>
              </div>
            </div>
          ))}

          {/* Employers */}
          {filterByStatus(employers).map((e) => (
            <div key={e.id} className="bg-white border border-neutral-200 p-4 flex items-center justify-between hover:border-neutral-400 transition-colors cursor-pointer" onClick={() => { setSelected(e); setSelectedType('employer') }}>
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-neutral-100 flex items-center justify-center text-xs font-bold text-neutral-400"><Building2 size={14} /></div>
                <div>
                  <p className="text-sm font-medium text-black">{e.company_name} <span className="text-neutral-300 font-normal">— {e.company_type || 'Employer'}</span></p>
                  <p className="text-xs text-neutral-400">{e.contact_name} &middot; {e.email} &middot; {new Date(e.created_at).toLocaleDateString()}</p>
                </div>
              </div>
              <span className={`text-xs font-medium px-2 py-1 ${statusBadge(e.approval_status || 'pending')}`}>{e.approval_status || 'pending'}</span>
            </div>
          ))}

          {filterByStatus(candidates).length === 0 && filterByStatus(employers).length === 0 && (
            <p className="text-center text-neutral-400 py-12">No {tab} users found.</p>
          )}
        </div>
      )}

      {/* Detail Panel */}
      {selected && (
        <div className="fixed inset-0 bg-black/40 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div className="bg-white w-full max-w-lg h-full overflow-y-auto animate-slide-in-right" onClick={(e) => e.stopPropagation()}>
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 className="text-lg font-bold text-black">{selected.full_name || selected.company_name}</h3>
              <button onClick={() => setSelected(null)} className="text-neutral-300 hover:text-black"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Email</p><p className="text-black">{selected.email}</p></div>
                {selected.phone && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Phone</p><p className="text-black">{selected.phone}</p></div>}
                {selected.work_email && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Work Email</p><p className="text-black">{selected.work_email}</p></div>}
                {selected.postcode && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Postcode</p><p className="text-black">{selected.postcode}</p></div>}
                {selected.role_level && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Role Level</p><p className="text-black">{selected.role_level}</p></div>}
                {selected.company_type && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Type</p><p className="text-black">{selected.company_type}</p></div>}
              </div>

              {selected.headline && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Headline</p><p className="text-black">{selected.headline}</p></div>}
              {selected.bio && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Bio</p><p className="text-black">{selected.bio}</p></div>}
              {selected.description && <div><p className="text-xs text-neutral-400 uppercase tracking-wider">Description</p><p className="text-black">{selected.description}</p></div>}

              {selected.product_houses?.length > 0 && <div><p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Product Houses</p><div className="flex flex-wrap gap-1">{selected.product_houses.map((p: string) => <span key={p} className="text-xs bg-neutral-100 px-2 py-1">{p}</span>)}</div></div>}
              {selected.qualifications?.length > 0 && <div><p className="text-xs text-neutral-400 uppercase tracking-wider mb-1">Qualifications</p><div className="flex flex-wrap gap-1">{selected.qualifications.map((q: string) => <span key={q} className="text-xs bg-neutral-100 px-2 py-1">{q}</span>)}</div></div>}

              {/* Documents */}
              <div><p className="text-xs text-neutral-400 uppercase tracking-wider mb-2">Documents</p>
                <div className="space-y-2">
                  {selected.cv_url && <a href={selected.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-black hover:underline"><FileText size={14} /><span>CV</span><ExternalLink size={12} /></a>}
                  {selected.insurance_document_url && <a href={selected.insurance_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-black hover:underline"><FileText size={14} /><span>Insurance</span><ExternalLink size={12} /></a>}
                  {selected.certificates_urls?.map((url: string, i: number) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-black hover:underline"><FileText size={14} /><span>Certificate {i+1}</span><ExternalLink size={12} /></a>)}
                  {!selected.cv_url && !selected.insurance_document_url && !selected.certificates_urls?.length && <p className="text-neutral-300">No documents uploaded</p>}
                </div>
              </div>

              {selected.approval_notes && <div className="bg-red-50 p-3"><p className="text-xs text-red-600">Rejection reason: {selected.approval_notes}</p></div>}
            </div>

            {/* Actions */}
            <div className="p-6 border-t border-neutral-100 sticky bottom-0 bg-white space-y-3">
              {(selected.approval_status || 'pending') !== 'approved' && (
                <button onClick={() => approve(selectedType, selected.id)} className="btn-primary w-full flex items-center justify-center space-x-2">
                  <CheckCircle size={16} /><span>Approve</span>
                </button>
              )}
              {(selected.approval_status || 'pending') !== 'rejected' && (
                <button onClick={() => setShowReject(true)} className="w-full border border-red-200 text-red-600 py-3 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center space-x-2">
                  <XCircle size={16} /><span>Reject</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showReject && selected && (
        <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" onClick={() => setShowReject(false)}>
          <div className="bg-white max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-black mb-4">Rejection Reason</h3>
            <textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input-field mb-4" placeholder="Explain why this profile is being rejected..." />
            <div className="flex gap-3">
              <button onClick={() => setShowReject(false)} className="btn-secondary flex-1">Cancel</button>
              <button onClick={() => reject(selectedType, selected.id)} className="bg-red-600 text-white px-6 py-3 text-sm font-medium hover:bg-red-700 transition-colors flex-1">Reject</button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
