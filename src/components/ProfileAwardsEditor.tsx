'use client'

import { useEffect, useState } from 'react'
import { Award, Plus, Save, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Kind = 'talent' | 'employer'
type AwardItem = { name: string; issuer?: string; year?: string; url?: string }

function blankAward(): AwardItem { return { name: '', issuer: '', year: '', url: '' } }

export default function ProfileAwardsEditor({ kind }: { kind: Kind }) {
  const supabase = createClient()
  const [profileId, setProfileId] = useState('')
  const [awards, setAwards] = useState<AwardItem[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  // The outcome travels with the text. Deciding the colour by searching the
  // message for the word "success" meant a reworded message silently turned
  // every save red.
  const [notice, setNotice] = useState<{ kind: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setLoading(false); return }
      const table = kind === 'talent' ? 'candidate_profiles' : 'employer_profiles'
      const { data } = await supabase.from(table).select('id, awards').eq('user_id', user.id).maybeSingle()
      if (data) {
        setProfileId(data.id)
        setAwards(Array.isArray(data.awards) ? data.awards : [])
      }
      setLoading(false)
    })()
  }, [kind])

  function update(index: number, field: keyof AwardItem, value: string) {
    setAwards(current => current.map((award, i) => i === index ? { ...award, [field]: value } : award))
  }

  async function save() {
    if (!profileId) return
    const clean = awards
      .map(award => ({
        name: String(award.name || '').trim().slice(0, 180),
        issuer: String(award.issuer || '').trim().slice(0, 180),
        year: String(award.year || '').trim().slice(0, 20),
        url: String(award.url || '').trim().slice(0, 500),
      }))
      .filter(award => award.name)
    setSaving(true); setNotice(null)
    const table = kind === 'talent' ? 'candidate_profiles' : 'employer_profiles'
    const { error } = await supabase.from(table).update({ awards: clean }).eq('id', profileId)
    setSaving(false)
    if (error) setNotice({ kind: 'error', text: error.message })
    else { setAwards(clean); setNotice({ kind: 'success', text: 'Awards saved.' }) }
  }

  if (loading) return <div className="dashboard-card">Loading awards…</div>

  return <div className="dashboard-card">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <div className="flex items-center gap-2"><Award size={18} className="text-accent"/><h2 className="text-[18px] font-semibold text-ink">Awards & Recognition</h2></div>
        <p className="mt-1 max-w-2xl text-[12px] leading-5 text-muted">Add genuine professional or property awards that prospective employers or Talent should see. Include the awarding body and year where possible.</p>
      </div>
      <button type="button" onClick={() => setAwards(current => [...current, blankAward()])} className="btn-secondary inline-flex items-center gap-2 text-[12px]"><Plus size={13}/>Add award</button>
    </div>

    <div className="mt-5 space-y-3">
      {awards.length === 0 ? <div className="rounded-xl border border-dashed border-border bg-surface/50 p-5 text-[12px] text-muted">No awards added yet.</div> : awards.map((award, index) => <div key={index} className="rounded-xl border border-border p-4">
        <div className="mb-3 flex items-center justify-between"><p className="text-[11px] font-semibold uppercase tracking-[.12em] text-muted">Award {index + 1}</p><button type="button" onClick={() => setAwards(current => current.filter((_, i) => i !== index))} aria-label="Remove award" className="p-2 -m-2 text-red-500"><Trash2 size={14}/></button></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-[11px] text-muted">Award name<input className="input-field mt-1" value={award.name || ''} onChange={e => update(index, 'name', e.target.value)} placeholder="e.g. Best Hotel Spa UK"/></label>
          <label className="text-[11px] text-muted">Awarding body<input className="input-field mt-1" value={award.issuer || ''} onChange={e => update(index, 'issuer', e.target.value)} placeholder="e.g. Good Spa Guide"/></label>
          <label className="text-[11px] text-muted">Year<input className="input-field mt-1" value={award.year || ''} onChange={e => update(index, 'year', e.target.value)} placeholder="2026"/></label>
          <label className="text-[11px] text-muted">Evidence / award link (optional)<input className="input-field mt-1" value={award.url || ''} onChange={e => update(index, 'url', e.target.value)} placeholder="https://"/></label>
        </div>
      </div>)}
    </div>

    {notice && <p role={notice.kind === 'error' ? 'alert' : 'status'} className={`mt-4 text-[12px] ${notice.kind === 'success' ? 'text-emerald-700' : 'text-red-600'}`}>{notice.text}</p>}
    <button type="button" onClick={save} disabled={saving} className="btn-primary mt-5 inline-flex items-center gap-2 disabled:opacity-50"><Save size={14}/>{saving ? 'Saving…' : 'Save awards'}</button>
  </div>
}
