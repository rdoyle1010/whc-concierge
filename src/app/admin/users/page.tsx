'use client'

import { useEffect, useState } from 'react'
import { useDialog } from '@/components/useDialog'
import DashboardShell from '@/components/DashboardShell'
import { createClient } from '@/lib/supabase/client'
import { Search, Users, Building2, CheckCircle, XCircle, X, FileText, ExternalLink } from 'lucide-react'
import { notify } from '@/lib/notify'
import Pagination from '@/components/Pagination'

const ADMIN_USER_LIMIT = 1000

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
  // Talent and properties are two different jobs of work, so each column keeps
  // its own place in the list. The page size is shared - it is a preference
  // about the screen, not about either audience.
  const [talentPage, setTalentPage] = useState(1)
  const [hotelPage, setHotelPage] = useState(1)
  const [perPage, setPerPage] = useState(25)
  const resetPages = () => { setTalentPage(1); setHotelPage(1) }
  const [loadError, setLoadError] = useState('')
  // What the platform actually sent this person, and whether it arrived.
  const [emailLog, setEmailLog] = useState<{ rows: any[]; unavailable: boolean } | null>(null)

  // The drawer stands down while the nested reject modal is open, so Escape
  // there closes only the modal and leaves the drawer behind it.
  // Loaded when the drawer opens, because "did they get an email?" is the
  // question being asked at exactly that moment.
  useEffect(() => {
    if (!selected) { setEmailLog(null); return }
    let active = true
    fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'email_log',
        email: selected.email || selected.work_email || selected.contact_email || '',
        user_id: selected.user_id || null,
      }),
    })
      .then(res => res.ok ? res.json() : null)
      .then(json => { if (active) setEmailLog({ rows: json?.log || [], unavailable: Boolean(json?.unavailable) }) })
      .catch(() => { if (active) setEmailLog({ rows: [], unavailable: false }) })
    return () => { active = false }
  }, [selected])

  const detailDialog = useDialog(() => setSelected(null), 'admin-user-detail-heading', { enabled: Boolean(selected) })
  const rejectDialog = useDialog(() => setShowReject(false), 'admin-user-reject-heading', { enabled: Boolean(showReject) })

  useEffect(() => {
    let active = true
    async function load() {
      const [c, e] = await Promise.all([
        supabase.from('candidate_profiles').select('*').order('created_at', { ascending: false }).limit(ADMIN_USER_LIMIT),
        supabase.from('employer_profiles').select('*').order('created_at', { ascending: false }).limit(ADMIN_USER_LIMIT),
      ])
      if (!active) return
      if (c.error || e.error) setLoadError((c.error || e.error)?.message || 'Could not load users.')
      setCandidates(c.data || [])
      setEmployers(e.data || [])
      setLoading(false)

      // A professional's address lives in auth.users, which the browser cannot
      // read - so this list said "no email on profile" for everybody and it
      // looked as though people had signed up without one. They had not.
      const ids = (c.data || []).map((row: any) => row.user_id).filter(Boolean)
      if (ids.length) {
        const res = await fetch('/api/admin/users', {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'emails', user_ids: ids }),
        }).catch(() => null)
        const json = await res?.json().catch(() => null)
        if (active && json?.emails) {
          setCandidates(current => current.map((row: any) => ({ ...row, email: row.email || json.emails[row.user_id] || null })))
        }
      }
    }
    load()
    return () => { active = false }
  }, [])

  const filterByStatus = (items: any[]) => {
    let filtered = items.filter(i => (i.approval_status || 'pending') === tab)
    if (search) filtered = filtered.filter(i => (i.full_name || i.company_name || '').toLowerCase().includes(search.toLowerCase()) || (i.email || i.work_email || i.contact_email || '').toLowerCase().includes(search.toLowerCase()))
    return filtered
  }

  const byNewest = (a: any, b: any) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
  const talent = filterByStatus(candidates).sort(byNewest)
  const hotels = filterByStatus(employers).sort(byNewest)
  const pagedTalent = talent.slice((talentPage - 1) * perPage, talentPage * perPage)
  const pagedHotels = hotels.slice((hotelPage - 1) * perPage, hotelPage * perPage)

  const approve = async (type: 'candidate' | 'employer', id: string) => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, action: 'approve' }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(`Could not approve: ${data.error || res.statusText}`)
      return
    }
    if (type === 'candidate') setCandidates(candidates.map(c => c.id === id ? { ...c, approval_status: 'approved' } : c))
    else setEmployers(employers.map(e => e.id === id ? { ...e, approval_status: 'approved' } : e))
    const profile = type === 'candidate' ? candidates.find(c => c.id === id) : employers.find(e => e.id === id)
    if (profile?.user_id) {
      const dashboard = type === 'candidate' ? '/talent/dashboard' : '/employer/dashboard'
      notify(profile.user_id, 'profile_approved', 'Profile approved', 'Your profile has been approved and is now live. Employers can find you in search results.', dashboard)
    }
    setSelected(null)
  }

  const reject = async (type: 'candidate' | 'employer', id: string) => {
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, id, action: 'reject', reason: rejectReason }),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      alert(`Could not reject: ${data.error || res.statusText}`)
      return
    }
    if (type === 'candidate') setCandidates(candidates.map(c => c.id === id ? { ...c, approval_status: 'rejected', approval_notes: rejectReason } : c))
    else setEmployers(employers.map(e => e.id === id ? { ...e, approval_status: 'rejected', approval_notes: rejectReason } : e))
    // Tell the person in-app, just as an approval does.
    const profile = type === 'candidate' ? candidates.find(c => c.id === id) : employers.find(e => e.id === id)
    if (profile?.user_id) {
      const profilePage = type === 'candidate' ? '/talent/profile' : '/employer/profile'
      notify(profile.user_id, 'general', 'Profile not approved',
        `Your profile was not approved${rejectReason ? `: ${rejectReason}` : ''}. Update it and resubmit for review.`, profilePage)
    }
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
      <div className="mb-7">
        <p className="dashboard-eyebrow">People & operations</p>
        <h1 className="dashboard-title">User Management</h1>
        <p className="dashboard-intro">Approve, reject and inspect talent and employer accounts before they go live.</p>
      </div>

      {loadError && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6 border border-red-100">Could not load users - {loadError}</div>}

      <div className="flex space-x-1 mb-6">
        {(['pending', 'approved', 'rejected'] as const).map((t) => (
          <button type="button" key={t} onClick={() => { setTab(t); resetPages() }}
            className={`px-4 py-2 text-sm font-medium transition-colors capitalize ${tab === t ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>
            {t} {t === 'pending' && pendingCount > 0 && <span className="ml-1 bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">{pendingCount}</span>}
          </button>
        ))}
      </div>

      <div className="relative mb-6 max-w-md">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          type="text" value={search} onChange={(e) => { setSearch(e.target.value); resetPages() }}
          placeholder="Search by name, property or email"
          aria-label="Search users by name, property or email"
          className="input-field pl-10"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-ink border-t-transparent rounded-full" /></div>
      ) : (
        // Talent and properties side by side. Interleaved by date they were
        // impossible to tell apart at a glance, and they are not the same
        // decision: a property is a customer, a professional is the product.
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-6">
          <section>
            <div className="flex items-baseline gap-2 border-b border-border pb-2 mb-3">
              <Users size={15} className="text-muted self-center" />
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink">Talent</h2>
              <span className="text-[12px] text-muted">{talent.length}</span>
            </div>
            <div className="space-y-2">
              {pagedTalent.map((item) => (
                <div key={`candidate-${item.id}`} className="bg-white border border-border p-4 flex items-center justify-between gap-3 hover:border-muted transition-colors cursor-pointer" onClick={() => { setSelected(item); setSelectedType('candidate') }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{item.full_name} <span className="text-muted font-normal">- {item.role_level || 'Candidate'}</span></p>
                    <p className="text-xs text-muted truncate">{item.email || item.work_email || item.contact_email || 'no email on profile'} &middot; {new Date(item.created_at).toLocaleDateString('en-GB')}</p>
                  </div>
                  <div className="flex shrink-0 items-center space-x-3">
                    {item.cv_url && <span title="CV uploaded"><FileText size={14} className="text-muted" /></span>}
                    {item.work_email && <span className="hidden text-xs text-muted xl:inline">Verified email</span>}
                    <span className={`text-xs font-medium px-2 py-1 ${statusBadge(item.approval_status || 'pending')}`}>{item.approval_status || 'pending'}</span>
                  </div>
                </div>
              ))}
              {talent.length === 0 && <p className="text-center text-muted py-10 text-sm">No {tab} talent.</p>}
              {talent.length > perPage && <Pagination page={talentPage} perPage={perPage} total={talent.length} onPageChange={setTalentPage} onPerPageChange={(n) => { setPerPage(n); resetPages() }} />}
            </div>
          </section>

          <section>
            <div className="flex items-baseline gap-2 border-b border-border pb-2 mb-3">
              <Building2 size={15} className="text-muted self-center" />
              <h2 className="text-[13px] font-semibold uppercase tracking-[0.14em] text-ink">Hotels &amp; employers</h2>
              <span className="text-[12px] text-muted">{hotels.length}</span>
            </div>
            <div className="space-y-2">
              {pagedHotels.map((item) => (
                <div key={`employer-${item.id}`} className="bg-white border border-border p-4 flex items-center justify-between gap-3 hover:border-muted transition-colors cursor-pointer" onClick={() => { setSelected(item); setSelectedType('employer') }}>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{item.company_name} <span className="text-muted font-normal">- {item.company_type || 'Employer'}</span></p>
                    <p className="text-xs text-muted truncate">{item.contact_name} &middot; {item.email || item.contact_email || item.work_email || 'no email on profile'} &middot; {new Date(item.created_at).toLocaleDateString('en-GB')}</p>
                  </div>
                  <span className={`shrink-0 text-xs font-medium px-2 py-1 ${statusBadge(item.approval_status || 'pending')}`}>{item.approval_status || 'pending'}</span>
                </div>
              ))}
              {hotels.length === 0 && <p className="text-center text-muted py-10 text-sm">No {tab} hotels or employers.</p>}
              {hotels.length > perPage && <Pagination page={hotelPage} perPage={perPage} total={hotels.length} onPageChange={setHotelPage} onPerPageChange={(n) => { setPerPage(n); resetPages() }} />}
            </div>
          </section>

          {(talent.length >= ADMIN_USER_LIMIT || hotels.length >= ADMIN_USER_LIMIT) && (
            <p className="lg:col-span-2 text-center text-[11px] text-muted">Showing the most recent records. Use search and the status tabs to narrow the list.</p>
          )}
        </div>
      )}

      {selected && (
        <div className="fixed inset-0 bg-[#0f0f0f]/70 z-50 flex justify-end" onClick={() => setSelected(null)}>
          <div {...detailDialog.panelProps} className="bg-white w-full max-w-lg h-full overflow-y-auto animate-slide-in-right">
            <div className="p-6 border-b border-border flex items-center justify-between sticky top-0 bg-white z-10">
              <h3 id="admin-user-detail-heading" className="text-lg font-bold text-ink">{selected.full_name || selected.company_name}</h3>
              <button type="button" onClick={() => setSelected(null)} className="text-muted hover:text-ink"><X size={20} /></button>
            </div>
            <div className="p-6 space-y-4 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div><p className="text-xs text-muted uppercase tracking-wider">Email</p><p className="text-ink">{selected.email || selected.work_email || selected.contact_email || 'no email on profile'}</p></div>
                {selected.phone && <div><p className="text-xs text-muted uppercase tracking-wider">Phone</p><p className="text-ink">{selected.phone}</p></div>}
                {selected.work_email && <div><p className="text-xs text-muted uppercase tracking-wider">Work Email</p><p className="text-ink">{selected.work_email}</p></div>}
                {selected.postcode && <div><p className="text-xs text-muted uppercase tracking-wider">Postcode</p><p className="text-ink">{selected.postcode}</p></div>}
                {selected.role_level && <div><p className="text-xs text-muted uppercase tracking-wider">Role Level</p><p className="text-ink">{selected.role_level}</p></div>}
                {selected.company_type && <div><p className="text-xs text-muted uppercase tracking-wider">Type</p><p className="text-ink">{selected.company_type}</p></div>}
              </div>
              {selected.headline && <div><p className="text-xs text-muted uppercase tracking-wider">Headline</p><p className="text-ink">{selected.headline}</p></div>}
              {selected.bio && <div><p className="text-xs text-muted uppercase tracking-wider">Bio</p><p className="text-ink">{selected.bio}</p></div>}
              {selected.description && <div><p className="text-xs text-muted uppercase tracking-wider">Description</p><p className="text-ink">{selected.description}</p></div>}
              {selected.product_houses?.length > 0 && <div><p className="text-xs text-muted uppercase tracking-wider mb-1">Product Houses</p><div className="flex flex-wrap gap-1">{selected.product_houses.map((p: string) => <span key={p} className="text-xs bg-surface px-2 py-1">{p}</span>)}</div></div>}
              {selected.qualifications?.length > 0 && <div><p className="text-xs text-muted uppercase tracking-wider mb-1">Qualifications</p><div className="flex flex-wrap gap-1">{selected.qualifications.map((q: string) => <span key={q} className="text-xs bg-surface px-2 py-1">{q}</span>)}</div></div>}
              <div><p className="text-xs text-muted uppercase tracking-wider mb-2">Documents</p><div className="space-y-2">
                {selected.cv_url && <a href={selected.cv_url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-ink hover:underline"><FileText size={14} /><span>CV</span><ExternalLink size={12} /></a>}
                {selected.insurance_document_url && <a href={selected.insurance_document_url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-ink hover:underline"><FileText size={14} /><span>Insurance</span><ExternalLink size={12} /></a>}
                {selected.certificates_urls?.map((url: string, i: number) => <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-2 text-ink hover:underline"><FileText size={14} /><span>Certificate {i+1}</span><ExternalLink size={12} /></a>)}
                {!selected.cv_url && !selected.insurance_document_url && !selected.certificates_urls?.length && <p className="text-muted">No documents uploaded</p>}
              </div></div>
              <div>
                <p className="text-xs text-muted uppercase tracking-wider mb-2">Emails we sent</p>
                {!emailLog ? <p className="text-muted text-[12px]">Checking…</p>
                  : emailLog.unavailable ? <p className="text-[12px] text-amber-700">The email log table has not been created yet - run the email_log migration and sends from then on will be recorded here.</p>
                  : emailLog.rows.length === 0 ? <p className="text-[12px] text-muted">Nothing recorded. Anything sent before the email log existed will not appear here.</p>
                  : (
                    <div className="space-y-1.5">
                      {emailLog.rows.map(entry => (
                        <div key={entry.id} className="border border-border p-2.5">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <p className="text-[12px] font-medium text-ink">{entry.subject || entry.kind}</p>
                            <span className={`text-[10px] font-semibold uppercase tracking-wider ${entry.status === 'sent' ? 'text-emerald-700' : 'text-red-600'}`}>{entry.status}</span>
                          </div>
                          <p className="text-[11px] text-muted">{new Date(entry.created_at).toLocaleString('en-GB')}</p>
                          {entry.error && <p className="mt-1 text-[11px] leading-5 text-red-600">{entry.error}</p>}
                        </div>
                      ))}
                    </div>
                  )}
              </div>
              {selected.approval_notes && <div className="bg-red-50 p-3"><p className="text-xs text-red-600">Rejection reason: {selected.approval_notes}</p></div>}
            </div>
            <div className="p-6 border-t border-border sticky bottom-0 bg-white space-y-3">
              {(selected.approval_status || 'pending') !== 'approved' && <button type="button" onClick={() => approve(selectedType, selected.id)} className="btn-primary w-full flex items-center justify-center space-x-2"><CheckCircle size={16} /><span>Approve</span></button>}
              {(selected.approval_status || 'pending') !== 'rejected' && <button type="button" onClick={() => setShowReject(true)} className="w-full border border-red-200 text-red-600 py-3 text-sm font-medium hover:bg-red-50 transition-colors flex items-center justify-center space-x-2"><XCircle size={16} /><span>Reject</span></button>}
            </div>
          </div>
        </div>
      )}

      {showReject && selected && (
        <div className="fixed inset-0 bg-[#0f0f0f]/70 z-[60] flex items-center justify-center p-4" onClick={() => setShowReject(false)}>
          <div {...rejectDialog.panelProps} className="bg-white max-w-md w-full p-6">
            <h3 id="admin-user-reject-heading" className="text-lg font-bold text-ink mb-4">Rejection Reason</h3>
            <textarea rows={4} value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="input-field mb-4" placeholder="Explain why this profile is being rejected..." />
            <div className="flex gap-3"><button type="button" onClick={() => setShowReject(false)} className="btn-secondary flex-1">Cancel</button><button type="button" onClick={() => reject(selectedType, selected.id)} className="bg-red-600 text-white px-6 py-3 text-sm font-medium hover:bg-red-700 transition-colors flex-1">Reject</button></div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
