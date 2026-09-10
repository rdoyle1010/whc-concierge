'use client'

import { useCallback, useEffect, useState } from 'react'
import DashboardShell from '@/components/DashboardShell'
import { Check, Copy, Plus, Ticket, Users } from 'lucide-react'

// One brand, one hotel, one consultancy, four therapists, four residency
// hosts. The allocation is printed on the page rather than enforced in the
// database on purpose: it is an editorial decision about who represents the
// industry, not a constraint, and a good eleventh candidate should not be
// blocked by a check constraint written in September.
const AREAS = [
  { value: 'brand', label: 'Brand', target: 1 },
  { value: 'hotel', label: 'Hotel', target: 1 },
  { value: 'consultancy', label: 'Consultancy', target: 1 },
  { value: 'therapist', label: 'Therapist', target: 4 },
  { value: 'residency', label: 'Residency', target: 4 },
] as const

const REWARDS = [
  { value: 'academy_courses', label: 'Two Academy courses', audience: 'talent' },
  { value: 'academy_bundle', label: 'Named Academy courses', audience: 'talent' },
  { value: 'free_listing', label: 'Free Standard listing', audience: 'employer' },
] as const

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-[12px] text-secondary">
      <span className="font-medium text-ink">{label}</span>
      {children}
      {hint ? <span className="mt-1 block text-[11px] leading-5 text-muted">{hint}</span> : null}
    </label>
  )
}

export default function AdminAmbassadorsPage() {
  const [ambassadors, setAmbassadors] = useState<any[]>([])
  const [codes, setCodes] = useState<any[]>([])
  const [redemptions, setRedemptions] = useState<any[]>([])
  const [defaultSlugs, setDefaultSlugs] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [copied, setCopied] = useState('')

  const [newAmbassador, setNewAmbassador] = useState({ area: 'therapist', name: '', organisation: '', email: '', arrangement: '' })
  const [newCode, setNewCode] = useState({ ambassador_id: '', code: '', reward: 'academy_courses', reward_slugs: '', max_redemptions: '50', expires_at: '', note: '' })

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/ambassadors')
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error || 'Could not load the ambassador scheme.'); return }
      setAmbassadors(body.ambassadors || [])
      setCodes(body.codes || [])
      setRedemptions(body.redemptions || [])
      setDefaultSlugs(body.defaults?.courseSlugs || [])
      setError('')
    } catch {
      setError('Could not load the ambassador scheme.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function send(payload: Record<string, unknown>, success: string) {
    setBusy(true); setError(''); setMessage('')
    try {
      const res = await fetch('/api/admin/ambassadors', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error || 'That did not save.'); return null }
      setMessage(success)
      await load()
      return body
    } catch {
      setError('That did not save.')
      return null
    } finally {
      setBusy(false)
    }
  }

  async function copy(code: string) {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(code)
      setTimeout(() => setCopied(''), 2000)
    } catch { /* a browser that refuses the clipboard is not an error worth showing */ }
  }

  const countFor = (area: string) => ambassadors.filter(row => row.area === area && row.is_active).length
  const redemptionsFor = (codeId: string) => redemptions.filter(row => row.code_id === codeId).length

  return (
    <DashboardShell role="admin">
      <div className="mb-7">
        <h1 className="font-serif text-[26px] tracking-[-0.02em] text-ink">Ambassadors</h1>
        <p className="mt-1.5 max-w-2xl text-[13px] leading-6 text-secondary">
          One representative for each part of the industry, each carrying a code for their own network.
          The courses cost nothing to give away; what the codes buy is the answer to a question no
          analytics package can give us - whose word actually moves people.
        </p>
      </div>

      {error ? <div role="alert" className="mb-5 border border-red-100 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</div> : null}
      {message ? <div className="mb-5 border border-[#dddddd] bg-[#f1f1f1] px-4 py-3 text-[13px] text-ink">{message}</div> : null}

      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-5">
        {AREAS.map(area => {
          const held = countFor(area.value)
          return (
            <div key={area.value} className="dashboard-card">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-muted">{area.label}</p>
              <p className="mt-2 font-serif text-[24px] leading-none text-ink">{held}<span className="text-[14px] text-muted"> / {area.target}</span></p>
              <p className="mt-1.5 text-[11px] text-secondary">{held >= area.target ? 'Allocated' : `${area.target - held} to find`}</p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section className="dashboard-card">
          <h2 className="flex items-center gap-2 font-serif text-[18px] text-ink"><Users size={16} /> Add an ambassador</h2>
          <div className="mt-4 space-y-3">
            <Field label="Area">
              <select value={newAmbassador.area} onChange={e => setNewAmbassador({ ...newAmbassador, area: e.target.value })} className="input-field mt-1.5">
                {AREAS.map(area => <option key={area.value} value={area.value}>{area.label}</option>)}
              </select>
            </Field>
            <Field label="Name">
              <input value={newAmbassador.name} onChange={e => setNewAmbassador({ ...newAmbassador, name: e.target.value })} className="input-field mt-1.5" placeholder="Carol Hatton" />
            </Field>
            <Field label="Organisation" hint="The brand, property or practice they speak for.">
              <input value={newAmbassador.organisation} onChange={e => setNewAmbassador({ ...newAmbassador, organisation: e.target.value })} className="input-field mt-1.5" placeholder="Carol Joy London" />
            </Field>
            <Field label="Email">
              <input type="email" value={newAmbassador.email} onChange={e => setNewAmbassador({ ...newAmbassador, email: e.target.value })} className="input-field mt-1.5" />
            </Field>
            <Field label="What they get" hint="Their side of the arrangement, in plain words, so nobody has to reconstruct it a year from now.">
              <textarea rows={3} value={newAmbassador.arrangement} onChange={e => setNewAmbassador({ ...newAmbassador, arrangement: e.target.value })} className="input-field mt-1.5" />
            </Field>
            <button
              type="button"
              disabled={busy || newAmbassador.name.trim().length < 2}
              onClick={async () => {
                const result = await send({ action: 'create_ambassador', ...newAmbassador }, `${newAmbassador.name} added.`)
                if (result?.ambassador) {
                  setNewCode(current => ({ ...current, ambassador_id: result.ambassador.id, code: result.suggestedCode || '' }))
                  setNewAmbassador({ area: newAmbassador.area, name: '', organisation: '', email: '', arrangement: '' })
                }
              }}
              className="btn-primary inline-flex items-center gap-1.5 text-[13px] disabled:opacity-40"
            ><Plus size={13} /> Add ambassador</button>
          </div>
        </section>

        <section className="dashboard-card">
          <h2 className="flex items-center gap-2 font-serif text-[18px] text-ink"><Ticket size={16} /> Issue a code</h2>
          <div className="mt-4 space-y-3">
            <Field label="Ambassador">
              <select value={newCode.ambassador_id} onChange={e => setNewCode({ ...newCode, ambassador_id: e.target.value })} className="input-field mt-1.5">
                <option value="">Unattached</option>
                {ambassadors.map(row => <option key={row.id} value={row.id}>{row.name}{row.organisation ? ` - ${row.organisation}` : ''}</option>)}
              </select>
            </Field>
            <Field label="Code" hint="Read down the phone more often than typed from a screen, so keep it short and avoid O, I, zero and one.">
              <input value={newCode.code} onChange={e => setNewCode({ ...newCode, code: e.target.value.toUpperCase() })} className="input-field mt-1.5 font-mono" placeholder="CAROLJOY-4KPT" />
            </Field>
            <Field label="What it gives">
              <select value={newCode.reward} onChange={e => setNewCode({ ...newCode, reward: e.target.value })} className="input-field mt-1.5">
                {REWARDS.map(reward => <option key={reward.value} value={reward.value}>{reward.label}</option>)}
              </select>
            </Field>
            {newCode.reward === 'academy_bundle' ? (
              <Field label="Course slugs" hint={`One per line. Leave empty for the opening-month pair: ${defaultSlugs.join(', ')}`}>
                <textarea rows={3} value={newCode.reward_slugs} onChange={e => setNewCode({ ...newCode, reward_slugs: e.target.value })} className="input-field mt-1.5 font-mono text-[12px]" />
              </Field>
            ) : null}
            <div className="grid grid-cols-2 gap-3">
              <Field label="Places">
                <input type="number" min={1} value={newCode.max_redemptions} onChange={e => setNewCode({ ...newCode, max_redemptions: e.target.value })} className="input-field mt-1.5" />
              </Field>
              <Field label="Expires">
                <input type="date" value={newCode.expires_at} onChange={e => setNewCode({ ...newCode, expires_at: e.target.value })} className="input-field mt-1.5" />
              </Field>
            </div>
            <button
              type="button"
              disabled={busy || !newCode.code.trim()}
              onClick={async () => {
                const slugs = newCode.reward_slugs.split('\n').map(slug => slug.trim()).filter(Boolean)
                const created = await send({
                  action: 'create_code',
                  ambassador_id: newCode.ambassador_id || null,
                  code: newCode.code,
                  reward: newCode.reward,
                  reward_slugs: slugs,
                  max_redemptions: Number(newCode.max_redemptions) || 50,
                  expires_at: newCode.expires_at || null,
                  note: newCode.note || null,
                }, `${newCode.code} is live.`)
                if (created?.success) setNewCode({ ambassador_id: '', code: '', reward: 'academy_courses', reward_slugs: '', max_redemptions: '50', expires_at: '', note: '' })
              }}
              className="btn-primary inline-flex items-center gap-1.5 text-[13px] disabled:opacity-40"
            ><Plus size={13} /> Issue code</button>
          </div>
        </section>
      </div>

      <section className="mt-7">
        <h2 className="font-serif text-[18px] text-ink">Codes in the field</h2>
        {loading ? <div className="skeleton mt-3 h-40 rounded-xl" /> : !codes.length ? (
          <div className="dashboard-card mt-3 text-[13px] text-secondary">No codes issued yet.</div>
        ) : (
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr className="border-b border-border text-left text-[10px] uppercase tracking-[0.14em] text-muted">
                  <th className="py-2.5 pr-4 font-semibold">Code</th>
                  <th className="py-2.5 pr-4 font-semibold">Ambassador</th>
                  <th className="py-2.5 pr-4 font-semibold">Gives</th>
                  <th className="py-2.5 pr-4 font-semibold">Used</th>
                  <th className="py-2.5 pr-4 font-semibold">Status</th>
                  <th className="py-2.5 font-semibold">Action</th>
                </tr>
              </thead>
              <tbody>
                {codes.map(row => {
                  const owner = ambassadors.find(a => a.id === row.ambassador_id)
                  const used = redemptionsFor(row.id)
                  const expired = row.expires_at && new Date(row.expires_at) < new Date()
                  return (
                    <tr key={row.id} className="border-b border-border/60">
                      <td className="py-3 pr-4">
                        <button type="button" onClick={() => copy(row.code)} className="inline-flex items-center gap-1.5 font-mono text-[12px] font-semibold text-ink hover:underline">
                          {row.code}
                          {copied === row.code ? <Check size={12} className="text-green-700" /> : <Copy size={12} className="text-muted" />}
                        </button>
                      </td>
                      <td className="py-3 pr-4 text-secondary">{owner ? owner.name : 'Unattached'}</td>
                      <td className="py-3 pr-4 text-secondary">{REWARDS.find(r => r.value === row.reward)?.label || row.reward}</td>
                      <td className="py-3 pr-4 text-secondary">{used} / {row.max_redemptions}</td>
                      <td className="py-3 pr-4">
                        <span className={`rounded-full px-2.5 py-1 text-[11px] ${!row.is_active || expired ? 'bg-[#e7e7e7] text-secondary' : 'bg-[#f1f1f1] font-semibold text-ink'}`}>
                          {!row.is_active ? 'Paused' : expired ? 'Expired' : used >= row.max_redemptions ? 'Full' : 'Live'}
                        </span>
                      </td>
                      <td className="py-3">
                        <button type="button" disabled={busy} onClick={() => send({ action: 'update_code', id: row.id, is_active: !row.is_active }, row.is_active ? 'Code paused.' : 'Code live again.')} className="btn-secondary text-[12px] disabled:opacity-40">
                          {row.is_active ? 'Pause' : 'Resume'}
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </DashboardShell>
  )
}
