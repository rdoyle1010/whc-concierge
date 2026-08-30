'use client'

import { useEffect, useMemo, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Megaphone, Plus, Upload, X } from 'lucide-react'

// The advertising control room: every ad slot on the site, grouped by page,
// each with an on/off switch and an optional pinned advert - plus direct
// advert placement for brands that come to WHC by email.

type Slot = {
  slot_key: string
  label: string
  page: string
  monthly_pence: number
  enabled: boolean
  pinned_placement_id: string | null
}

type Advert = {
  id: string
  brand_name: string
  tagline: string | null
  logo_url: string | null
  website_url: string | null
  placement: string
  status: string
  payment_status: string
  review_status: string
  source: string
  start_date: string | null
  end_date: string | null
  impression_count: number | null
  click_count: number | null
  contact_email: string | null
  created_at: string
}

export default function AdminAdSlotsPage() {
  const [slots, setSlots] = useState<Slot[]>([])
  const [adverts, setAdverts] = useState<Advert[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState<string | null>(null)

  const [formOpen, setFormOpen] = useState(false)
  const [brandName, setBrandName] = useState('')
  const [tagline, setTagline] = useState('')
  const [websiteUrl, setWebsiteUrl] = useState('')
  const [contactEmail, setContactEmail] = useState('')
  const [placement, setPlacement] = useState('')
  const [endDate, setEndDate] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [uploading, setUploading] = useState(false)
  const [creating, setCreating] = useState(false)

  async function load() {
    try {
      const res = await fetch('/api/admin/ad-slots')
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not load ad slots.'); return }
      setSlots(json.slots || [])
      setAdverts(json.adverts || [])
    } catch { setError('Could not load ad slots.') } finally { setLoading(false) }
  }
  useEffect(() => { load() }, [])

  async function setSlot(slotKey: string, payload: Record<string, unknown>) {
    if (busy) return
    setBusy(slotKey); setError('')
    try {
      const res = await fetch('/api/admin/ad-slots', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'set_slot', slotKey, ...payload }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not save.'); return }
      setSlots(current => current.map(slot => slot.slot_key === slotKey ? {
        ...slot,
        enabled: payload.enabled !== undefined ? Boolean(payload.enabled) : slot.enabled,
        pinned_placement_id: payload.pinnedPlacementId !== undefined ? (payload.pinnedPlacementId as string | null) : slot.pinned_placement_id,
      } : slot))
    } catch { setError('Could not save.') } finally { setBusy(null) }
  }

  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true); setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'site-images')
      fd.append('path', `adverts/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]+/g, '-')}`)
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Logo upload failed.'); return }
      setLogoUrl(json.url)
    } catch { setError('Logo upload failed.') } finally { setUploading(false) }
  }

  async function createDirect() {
    if (creating) return
    setCreating(true); setError('')
    try {
      const res = await fetch('/api/admin/ad-slots', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'create_direct', brandName, tagline, websiteUrl, contactEmail, placement, endDate, logoUrl }),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error || 'Could not create the advert.'); return }
      setAdverts(current => [json.advert, ...current])
      setFormOpen(false)
      setBrandName(''); setTagline(''); setWebsiteUrl(''); setContactEmail(''); setPlacement(''); setEndDate(''); setLogoUrl('')
    } catch { setError('Could not create the advert.') } finally { setCreating(false) }
  }

  async function advertStatus(id: string, status: string) {
    const res = await fetch('/api/admin/ad-slots', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'advert_status', id, status }),
    })
    if (res.ok) setAdverts(current => current.map(advert => advert.id === id ? { ...advert, status } : advert))
  }

  const pages = useMemo(() => {
    const grouped = new Map<string, Slot[]>()
    for (const slot of slots) {
      const list = grouped.get(slot.page) || []
      list.push(slot)
      grouped.set(slot.page, list)
    }
    return Array.from(grouped.entries())
  }, [slots])

  const advertsFor = (slotKey: string) => adverts.filter(advert => advert.placement === slotKey && advert.review_status === 'approved')
  const advertName = (id: string | null) => adverts.find(advert => advert.id === id)?.brand_name || null

  return (
    <DashboardShell role="admin">
      <div className="max-w-4xl">
        <div className="flex flex-wrap items-start justify-between gap-3 mb-2">
          <div>
            <p className="text-[11px] uppercase tracking-[0.18em] text-accent font-semibold mb-1.5">Content & revenue</p>
            <h1 className="font-serif text-[26px] font-bold text-ink">Ad slots</h1>
          </div>
          <button type="button" onClick={() => setFormOpen(true)} className="btn-primary inline-flex items-center gap-1.5 text-[12.5px]"><Plus size={14} /> Place a direct advert</button>
        </div>
        <p className="text-[13.5px] text-secondary mb-6 max-w-2xl">
          Every advertising position on the site, grouped by page. A slot shows nothing to anyone until you switch it on,
          and switches off again the moment you say so. When a brand emails you, place a direct advert and pin it to a slot -
          no payment flow involved. Self-serve paid adverts still arrive through Sponsored Ads for approval as before.
        </p>

        {error && <p className="text-[12.5px] text-red-600 font-medium mb-4">{error}</p>}
        {loading ? <p className="text-[13px] text-secondary">Loading...</p> : (
          <div className="space-y-5">
            {pages.map(([page, pageSlots]) => (
              <div key={page} className="dashboard-card">
                <h2 className="font-serif text-[16px] font-semibold text-ink mb-3">{page}</h2>
                <div className="space-y-3">
                  {pageSlots.map(slot => {
                    const candidates = advertsFor(slot.slot_key)
                    return (
                      <div key={slot.slot_key} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-3.5 py-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-semibold text-ink inline-flex items-center gap-1.5"><Megaphone size={13} className="text-[#8a6d3b]" /> {slot.label}</p>
                          <p className="text-[11.5px] text-muted mt-0.5">
                            £{Math.round(slot.monthly_pence / 100)}/month self-serve
                            {slot.pinned_placement_id ? ` · pinned: ${advertName(slot.pinned_placement_id) || 'unknown advert'}` : candidates.length ? ` · ${candidates.length} advert${candidates.length === 1 ? '' : 's'} available` : ' · no adverts yet'}
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <select value={slot.pinned_placement_id || ''} disabled={busy === slot.slot_key}
                            onChange={e => setSlot(slot.slot_key, { pinnedPlacementId: e.target.value || null })}
                            className="input-field text-[11.5px] w-auto max-w-[180px]">
                            <option value="">Auto (rotate paid adverts)</option>
                            {candidates.map(advert => <option key={advert.id} value={advert.id}>{advert.brand_name}{advert.source === 'direct' ? ' (direct)' : ''}</option>)}
                          </select>
                          <button type="button" disabled={busy === slot.slot_key}
                            onClick={() => setSlot(slot.slot_key, { enabled: !slot.enabled })}
                            className={`relative h-6 w-11 rounded-full transition-colors ${slot.enabled ? 'bg-green-500' : 'bg-gray-300'}`}
                            aria-label={slot.enabled ? 'Switch slot off' : 'Switch slot on'}>
                            <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${slot.enabled ? 'left-[22px]' : 'left-0.5'}`} />
                          </button>
                          <span className={`text-[11px] font-semibold w-10 ${slot.enabled ? 'text-green-700' : 'text-gray-400'}`}>{slot.enabled ? 'Live' : 'Hidden'}</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            <div className="dashboard-card">
              <h2 className="font-serif text-[16px] font-semibold text-ink mb-3">All adverts</h2>
              {adverts.length === 0 ? <p className="text-[13px] text-secondary">No adverts yet. Place a direct advert above, or approved Sponsored Ads purchases will appear here.</p> : (
                <div className="space-y-2">
                  {adverts.map(advert => (
                    <div key={advert.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2.5">
                      <div className="flex items-center gap-3 min-w-0">
                        {advert.logo_url && <img src={advert.logo_url} alt="" className="h-8 w-16 object-contain shrink-0" />}
                        <div className="min-w-0">
                          <p className="text-[12.5px] font-semibold text-ink truncate">{advert.brand_name} <span className="font-normal text-muted">· {advert.placement.replace(/_/g, ' ')}</span></p>
                          <p className="text-[11px] text-muted">{advert.source === 'direct' ? 'Direct deal' : `Self-serve · ${advert.payment_status}`} · {advert.review_status} · {advert.impression_count || 0} views · {advert.click_count || 0} clicks{advert.end_date ? ` · until ${advert.end_date}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-semibold ${advert.status === 'active' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{advert.status}</span>
                        {advert.status === 'active'
                          ? <button type="button" onClick={() => advertStatus(advert.id, 'paused')} className="text-[11.5px] underline text-secondary">Pause</button>
                          : <button type="button" onClick={() => advertStatus(advert.id, 'active')} className="text-[11.5px] underline text-secondary">Activate</button>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {formOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setFormOpen(false)}>
            <div className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto p-6" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-serif text-lg font-bold text-ink">Place a direct advert</h2>
                <button type="button" onClick={() => setFormOpen(false)} className="text-gray-300 hover:text-ink"><X size={20} /></button>
              </div>
              <p className="text-[12px] text-gray-500 mb-4">For brands that come to you directly - no payment flow, live as soon as you pin it to a slot that is switched on.</p>

              <label className="block text-[12px] font-semibold text-ink mb-1.5">Brand name *</label>
              <input value={brandName} onChange={e => setBrandName(e.target.value)} placeholder="e.g. ESPA" className="input-field text-[13px] w-full mb-3" />
              <label className="block text-[12px] font-semibold text-ink mb-1.5">Tagline</label>
              <input value={tagline} onChange={e => setTagline(e.target.value)} placeholder="One line shown under the brand name" className="input-field text-[13px] w-full mb-3" />
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[12px] font-semibold text-ink mb-1.5">Website link</label>
                  <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} placeholder="https://..." className="input-field text-[13px] w-full" />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-ink mb-1.5">Contact email</label>
                  <input value={contactEmail} onChange={e => setContactEmail(e.target.value)} placeholder="brand contact" className="input-field text-[13px] w-full" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label className="block text-[12px] font-semibold text-ink mb-1.5">Placement *</label>
                  <select value={placement} onChange={e => setPlacement(e.target.value)} className="input-field text-[13px] w-full">
                    <option value="">Choose...</option>
                    {slots.map(slot => <option key={slot.slot_key} value={slot.slot_key}>{slot.page} - {slot.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-ink mb-1.5">Runs until (optional)</label>
                  <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="input-field text-[13px] w-full" />
                </div>
              </div>
              <label className="block text-[12px] font-semibold text-ink mb-1.5">Logo</label>
              {logoUrl ? (
                <p className="text-[12px] text-green-700 mb-3 inline-flex items-center gap-2"><img src={logoUrl} alt="" className="h-8 w-16 object-contain" /> Uploaded <button type="button" onClick={() => setLogoUrl('')} className="underline text-secondary">change</button></p>
              ) : (
                <label className="btn-secondary inline-flex cursor-pointer items-center gap-1.5 text-[12px] mb-3"><Upload size={13} /> {uploading ? 'Uploading...' : 'Upload logo'}<input type="file" accept="image/*" className="hidden" onChange={uploadLogo} disabled={uploading} /></label>
              )}

              {error && <p className="text-[12px] text-red-600 mb-3">{error}</p>}
              <button type="button" onClick={createDirect} disabled={creating || uploading || brandName.trim().length < 2 || !placement} className="btn-primary w-full text-[13px] disabled:opacity-50">{creating ? 'Placing...' : 'Create advert'}</button>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  )
}
