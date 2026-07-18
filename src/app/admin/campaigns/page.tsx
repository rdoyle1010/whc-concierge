'use client'

import { useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Plus, Edit2, Trash2, Play, Pause, Send } from 'lucide-react'

export default function AdminCampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editing, setEditing] = useState<any>(null)
  const [saving, setSaving] = useState(false)
  const [sendingId, setSendingId] = useState<string | null>(null)
  const [banner, setBanner] = useState('')
  const [promotion, setPromotion] = useState<any>(null)
  const [audiences, setAudiences] = useState<any>(null)
  const [featuredSel, setFeaturedSel] = useState<Array<{ type: string; id: string; label: string }>>([])

  const empty = { name: '', description: '', type: '', status: 'draft', start_date: '', end_date: '', target_audience: '', content: '' }
  const [form, setForm] = useState(empty)

  useEffect(() => {
    async function load() {
      const res = await fetch('/api/admin/campaigns')
      const j = res.ok ? await res.json() : { campaigns: [] }
      setCampaigns(j.campaigns || [])
      setPromotion(j.promotion || null)
      setAudiences(j.audiences || null)
      setLoading(false)
    }
    load()
  }, [])

  const reload = async () => {
    const res = await fetch('/api/admin/campaigns')
    const j = res.ok ? await res.json() : { campaigns: [] }
    setCampaigns(j.campaigns || [])
  }

  // REAL sending: emails the chosen audience through the platform's
  // email service. Draft first, send when ready - a sent campaign is final.
  const handleSend = async (c: any) => {
    if (!confirm(`Send "${c.name}" by email to ${c.target_audience || 'everyone'} now? This cannot be undone.`)) return
    setSendingId(c.id)
    setBanner('')
    try {
      const res = await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send', id: c.id }) })
      const j = await res.json()
      if (!res.ok) { setBanner(j.error || 'Send failed.'); return }
      setBanner(`Sent to ${j.sent} recipient${j.sent === 1 ? '' : 's'}${j.failed ? ` (${j.failed} failed - check resend.com/logs)` : ''}.`)
      await reload()
    } catch {
      setBanner('Send failed - please try again.')
    } finally {
      setSendingId(null)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    const payload = {
      name: form.name, description: form.description || null, type: form.type || null,
      status: form.status, start_date: form.start_date || null, end_date: form.end_date || null,
      target_audience: form.target_audience || null, content: form.content || null,
    }
    await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', id: editing?.id, data: { ...payload, featured_ids: featuredSel.map(f => ({ type: f.type, id: f.id })) } }) })
    await reload()
    setShowForm(false); setEditing(null); setForm(empty); setSaving(false)
  }

  const handleEdit = (c: any) => {
    setForm({
      name: c.name, description: c.description || '', type: c.type || '',
      status: c.status, start_date: c.start_date || '', end_date: c.end_date || '',
      target_audience: c.target_audience || '', content: c.content || '',
    })
    const sel: Array<{ type: string; id: string; label: string }> = []
    for (const f of (c.featured_ids || [])) {
      const pool = f.type === 'candidate'
        ? [...(promotion?.featured_candidates || []), ...(promotion?.agency_featured || [])]
        : (promotion?.preferred_employers || [])
      const m = pool.find((x: any) => x.id === f.id)
      sel.push({ type: f.type, id: f.id, label: m?.full_name || m?.property_name || m?.company_name || 'Member' })
    }
    setFeaturedSel(sel)
    setEditing(c); setShowForm(true)
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign?')) return
    await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', id }) })
    setCampaigns(campaigns.filter(c => c.id !== id))
  }

  const toggleStatus = async (c: any) => {
    const newStatus = c.status === 'active' ? 'paused' : 'active'
    await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save', id: c.id, data: { ...c, status: newStatus } }) })
    setCampaigns(campaigns.map(x => x.id === c.id ? { ...x, status: newStatus } : x))
  }

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-600', active: 'bg-green-50 text-green-700',
    paused: 'bg-amber-50 text-amber-700', completed: 'bg-blue-50 text-blue-700',
    sent: 'bg-green-50 text-green-700',
  }

  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-serif font-bold text-ink">Campaign Management</h1>
        <button onClick={() => { setForm(empty); setEditing(null); setFeaturedSel([]); setShowForm(true) }}
          className="btn-primary flex items-center space-x-2"><Plus size={16} /><span>New Campaign</span></button>
      </div>

      {banner && <div className={`text-sm px-4 py-3 rounded-lg mb-6 ${banner.startsWith('Sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>{banner}</div>}

      {/* Command-centre overview */}
      {audiences && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
          <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Reachable inboxes</p><p className="text-[20px] font-semibold text-ink">{audiences.all}</p><p className="text-[10px] text-gray-400">{audiences.candidates} talent · {audiences.employers} properties</p></div>
          <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Featured profiles</p><p className="text-[20px] font-semibold text-amber-600">{promotion?.featured_candidates?.length || 0}</p><p className="text-[10px] text-gray-400">Paying for premium visibility</p></div>
          <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Agency featured</p><p className="text-[20px] font-semibold text-amber-600">{promotion?.agency_featured?.length || 0}</p><p className="text-[10px] text-gray-400">Top of the agency register</p></div>
          <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Preferred employers</p><p className="text-[20px] font-semibold text-ink">{promotion?.preferred_employers?.length || 0}</p><p className="text-[10px] text-gray-400">£150/yr registered</p></div>
          <div className="dashboard-card !py-4"><p className="text-[11px] uppercase tracking-wide text-gray-400 mb-1">Campaigns sent</p><p className="text-[20px] font-semibold text-green-700">{campaigns.filter(c => c.status === 'sent').length}</p><p className="text-[10px] text-gray-400">{campaigns.filter(c => c.status === 'sent').reduce((s, c) => s + (c.recipients_count || 0), 0)} emails delivered</p></div>
        </div>
      )}

      {/* Promotion roster - the people paying to be seen */}
      {promotion && ((promotion.featured_candidates?.length || 0) + (promotion.agency_featured?.length || 0) + (promotion.preferred_employers?.length || 0)) > 0 && (
        <div className="dashboard-card mb-8">
          <p className="text-[14px] font-medium text-ink mb-1">Promotion roster</p>
          <p className="text-[12px] text-gray-400 mb-4">Members paying for premium placement - showcase them in the newsletter with the selector inside each campaign.</p>
          <div className="flex flex-wrap gap-2">
            {(promotion.featured_candidates || []).map((c: any) => (
              <span key={`fc-${c.id}`} className="text-[12px] bg-amber-50 text-amber-700 px-3 py-1.5 rounded-full">★ {c.full_name}{c.featured_until ? ` · until ${new Date(c.featured_until).toLocaleDateString('en-GB')}` : ''}</span>
            ))}
            {(promotion.agency_featured || []).map((c: any) => (
              <span key={`af-${c.id}`} className="text-[12px] bg-[#FDF6EC] text-accent px-3 py-1.5 rounded-full">⚡ {c.full_name} · agency featured</span>
            ))}
            {(promotion.preferred_employers || []).map((e: any) => (
              <span key={`pe-${e.id}`} className="text-[12px] bg-green-50 text-green-700 px-3 py-1.5 rounded-full">{e.property_name || e.company_name} · preferred</span>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-8" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-xl font-bold mb-6">{editing ? 'Edit Campaign' : 'New Campaign'}</h2>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Campaign Name *</label>
                <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input-field">
                    <option value="">Select</option><option>Email</option><option>Social Media</option><option>Push Notification</option><option>In-App</option>
                  </select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Target Audience</label>
                  <select value={form.target_audience} onChange={(e) => setForm({ ...form, target_audience: e.target.value })} className="input-field">
                    <option value="">All</option><option>Candidates</option><option>Employers</option><option>New Users</option>
                  </select></div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Start Date</label>
                  <input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} className="input-field" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1.5">End Date</label>
                  <input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} className="input-field" /></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                <textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1.5">Content</label>
                <textarea rows={6} value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input-field" /></div>

              {/* Showcase paying members - rendered as styled cards in the email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Feature paying members in this email</label>
                <p className="text-xs text-gray-400 mb-2">They appear as "Featured this week" cards with photo, headline and a link to their profile - the premium visibility they pay for.</p>
                <div className="flex flex-wrap gap-2">
                  {[...(promotion?.featured_candidates || []).map((c: any) => ({ type: 'candidate', id: c.id, label: c.full_name || 'Professional' })),
                    ...(promotion?.agency_featured || []).filter((c: any) => !(promotion?.featured_candidates || []).some((f: any) => f.id === c.id)).map((c: any) => ({ type: 'candidate', id: c.id, label: c.full_name || 'Professional' })),
                    ...(promotion?.preferred_employers || []).map((e: any) => ({ type: 'employer', id: e.id, label: e.property_name || e.company_name || 'Property' })),
                  ].map((opt) => {
                    const on = featuredSel.some(f => f.id === opt.id && f.type === opt.type)
                    return (
                      <button key={`${opt.type}-${opt.id}`} type="button"
                        onClick={() => setFeaturedSel(on ? featuredSel.filter(f => !(f.id === opt.id && f.type === opt.type)) : [...featuredSel, opt])}
                        className={`text-[12px] px-3 py-1.5 rounded-full border transition-all ${on ? 'bg-ink text-white border-ink' : 'bg-white text-gray-600 border-gray-200 hover:border-ink/40'}`}>
                        {on ? '✓ ' : ''}{opt.label}
                      </button>
                    )
                  })}
                  {((promotion?.featured_candidates?.length || 0) + (promotion?.agency_featured?.length || 0) + (promotion?.preferred_employers?.length || 0)) === 0 && (
                    <p className="text-xs text-gray-400">No paying members yet - featured profiles and preferred employers appear here automatically.</p>
                  )}
                </div>
              </div>
              <div className="flex gap-4 pt-2">
                <button onClick={() => setShowForm(false)} className="btn-secondary flex-1">Cancel</button>
                <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 disabled:opacity-50">{saving ? 'Saving...' : editing ? 'Update' : 'Create'}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-64"><div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full" /></div>
      ) : campaigns.length === 0 ? (
        <div className="dashboard-card text-center py-16 text-gray-400">No campaigns yet.</div>
      ) : (
        <div className="space-y-4">
          {campaigns.map((c) => (
            <div key={c.id} className="dashboard-card flex items-center justify-between">
              <div>
                <div className="flex items-center space-x-3">
                  <h3 className="font-serif text-lg font-semibold text-ink">{c.name}</h3>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusColors[c.status] || ''}`}>{c.status}</span>
                  {c.type && <span className="text-xs bg-gray-50 text-gray-500 px-2 py-1 rounded">{c.type}</span>}
                </div>
                <p className="text-sm text-gray-500 mt-1">{c.description}</p>
                {c.start_date && <p className="text-xs text-gray-400 mt-1">{c.start_date}{c.end_date ? ` — ${c.end_date}` : ''}</p>}
                {c.status === 'sent' && <p className="text-xs text-green-700 mt-1">Sent{c.recipients_count ? ` to ${c.recipients_count} recipients` : ''}{c.sent_at ? ` on ${new Date(c.sent_at).toLocaleString('en-GB')}` : ''}.</p>}
              </div>
              <div className="flex items-center space-x-2">
                {String(c.type || '').toLowerCase() === 'email' && c.status !== 'sent' && (
                  <>
                    <button
                      onClick={async () => {
                        setBanner('')
                        const res = await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'send_test', id: c.id }) })
                        const j = await res.json().catch(() => ({}))
                        setBanner(res.ok ? 'Sent a test copy to your own inbox - check it before Send Now.' : (j.error || 'Test send failed.'))
                      }}
                      className="btn-secondary !py-2 text-[12px]">Test to me</button>
                    <button onClick={() => handleSend(c)} disabled={sendingId === c.id}
                      className="btn-primary !py-2 text-[12px] flex items-center gap-1.5 disabled:opacity-50">
                      <Send size={13} /> {sendingId === c.id ? 'Sending...' : 'Send Now'}
                    </button>
                  </>
                )}
                <button onClick={() => toggleStatus(c)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400">
                  {c.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                </button>
                <button onClick={() => handleEdit(c)} className="p-2 rounded-lg hover:bg-gray-100 text-gray-400"><Edit2 size={18} /></button>
                <button onClick={() => handleDelete(c.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500"><Trash2 size={18} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardShell>
  )
}
