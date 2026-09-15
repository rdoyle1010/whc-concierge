'use client'

import { useEffect, useState } from 'react'
import CollapsibleCheckboxSection from '@/components/CollapsibleCheckboxSection'
import { ROLE_LEVELS, TRAVEL_OPTIONS, AVAILABILITY_STATUSES } from '@/lib/constants'
import { SERVICES_CATEGORIES, PRODUCT_HOUSES_FULL, QUALS_CATEGORIES, SYSTEMS_FULL } from '@/lib/taxonomy'
import { EDITABLE_FIELDS } from '@/lib/candidate-fields'
import { Save } from 'lucide-react'

// Their profile, filled in from her side of the platform.
//
// The alternative was signing in as them, which signed her out of admin and
// left two errors on screen that between them said nothing about what had
// happened. This is the same fields, in her own session, saved by an
// administrator who is still an administrator afterwards.

const BUSINESS_SKILLS = ['Reception & Front of House','Revenue Management','Stock Control','Team Leadership','Staff Training','Rota Management','KPI Reporting','Health & Safety','COSHH Management','Budget Management','Client Consultation','Upselling & Retail','Social Media','Event Coordination','Membership Management']

type Props = {
  requestId: string
  fullName: string
  /** Reload the queue after a save, so the card and the profile agree. */
  onSaved?: () => void
}

type Draft = Record<string, any>

export default function AdminProfileEditor({ requestId, fullName, onSaved }: Props) {
  const [draft, setDraft] = useState<Draft | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [note, setNote] = useState('')
  const [completion, setCompletion] = useState(0)
  const [missing, setMissing] = useState<string[]>([])
  const [hasCv, setHasCv] = useState(false)

  async function post(action: string, extra: Record<string, any> = {}) {
    const res = await fetch('/api/admin/profile-build', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: requestId, action, ...extra }),
    })
    const body = await res.json().catch(() => null)
    if (!res.ok) {
      throw new Error(body?.error || `That did not work (${res.status}). Tell Claude what you pressed and this number.`)
    }
    return body
  }

  function absorb(body: any) {
    const profile = body?.profile || {}
    const next: Draft = {}
    for (const field of EDITABLE_FIELDS) next[field] = profile[field] ?? (Array.isArray(profile[field]) ? [] : null)
    setDraft(next)
    setHasCv(Boolean(profile.cv_url))
    setCompletion(Number(body?.completion) || 0)
    setMissing(Array.isArray(body?.missing) ? body.missing : [])
  }

  useEffect(() => {
    let live = true
    ;(async () => {
      try {
        const body = await post('profile')
        if (live) absorb(body)
      } catch (loadError: any) {
        if (live) setError(loadError.message)
      } finally {
        if (live) setLoading(false)
      }
    })()
    return () => { live = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId])

  const set = (field: string, value: any) => setDraft(current => ({ ...(current || {}), [field]: value }))
  const listOf = (field: string): string[] => (Array.isArray(draft?.[field]) ? draft![field] : [])

  async function save() {
    if (!draft) return
    setSaving(true); setError(''); setNote('')
    try {
      const body = await post('save_profile', { profile: draft })
      absorb(body)
      setNote(body?.warning || 'Saved to their profile.')
      onSaved?.()
    } catch (saveError: any) {
      setError(saveError.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="mt-4 text-[13px] text-secondary">Opening their profile...</p>
  if (!draft) {
    return <p className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error || 'Their profile could not be opened.'}</p>
  }

  const field = (label: string, name: string, type: 'text' | 'number' = 'text') => (
    <label className="block">
      <span className="block text-[12px] font-semibold text-ink">{label}</span>
      <input type={type} value={draft[name] ?? ''} onChange={e => set(name, e.target.value)}
        className="mt-1.5 w-full border border-border px-3 py-2 text-[13px]" />
    </label>
  )

  // Some of these lists are plain strings and some are value/label pairs, and
  // a select that renders "[object Object]" is how a stored value ends up
  // being whatever the browser fell back to.
  const chooser = (label: string, name: string, options: readonly (string | { value: string; label: string })[]) => (
    <label className="block">
      <span className="block text-[12px] font-semibold text-ink">{label}</span>
      <select value={draft[name] ?? ''} onChange={e => set(name, e.target.value)}
        className="mt-1.5 w-full border border-border px-3 py-2 text-[13px]">
        <option value="">Not said</option>
        {options.map(option => {
          const value = typeof option === 'string' ? option : option.value
          const text = typeof option === 'string' ? option : option.label
          return <option key={value} value={value}>{text}</option>
        })}
      </select>
    </label>
  )

  const commaList = (label: string, name: string, hint: string) => (
    <label className="block">
      <span className="block text-[12px] font-semibold text-ink">{label}</span>
      <input value={listOf(name).join(', ')} placeholder={hint}
        onChange={e => set(name, e.target.value.split(',').map(part => part.trim()).filter(Boolean))}
        className="mt-1.5 w-full border border-border px-3 py-2 text-[13px]" />
    </label>
  )

  return (
    <div className="mt-4 border-t border-border pt-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-ink">Fill in {fullName.split(' ')[0]}&rsquo;s profile</p>
        <button type="button" onClick={save} disabled={saving}
          className="inline-flex items-center gap-1.5 border border-[#222321] bg-[#222321] px-3 py-1.5 text-[12px] font-semibold text-white disabled:opacity-40">
          <Save size={13} /> {saving ? 'Saving...' : 'Save to their profile'}
        </button>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#e3dcd1]">
          <div className="h-full bg-[#222321]" style={{ width: `${completion}%` }} />
        </div>
        <span className="text-[12px] text-secondary">{completion}%</span>
      </div>
      {missing.length > 0 && (
        <p className="mt-2 text-[12px] text-secondary">Still missing: {missing.join(', ')}.</p>
      )}
      {!hasCv && (
        <p className="mt-1 text-[12px] text-muted">
          A CV can only be attached from their own workspace, so that one stays on the list until they claim the account.
        </p>
      )}

      {error && <p className="mt-3 border border-red-200 bg-red-50 px-4 py-3 text-[13px] text-red-700">{error}</p>}
      {note && <p className="mt-3 border border-[#166534]/30 bg-[#f3fbf5] px-4 py-3 text-[13px] text-[#166534]">{note}</p>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {field('Full name', 'full_name')}
        {chooser('Role level', 'role_level', ROLE_LEVELS)}
        {field('Years of experience', 'experience_years', 'number')}
        {field('Postcode', 'postcode')}
        {field('Phone', 'phone')}
        {field('Current employer', 'current_employer')}
        {chooser('Availability', 'availability_status', AVAILABILITY_STATUSES)}
        {chooser('Travel', 'travel_availability', TRAVEL_OPTIONS)}
        {field('Day rate from (£)', 'day_rate_min', 'number')}
        {field('Day rate to (£)', 'day_rate_max', 'number')}
      </div>

      <label className="mt-4 block">
        <span className="block text-[12px] font-semibold text-ink">Headline</span>
        <input value={draft.headline ?? ''} onChange={e => set('headline', e.target.value)}
          placeholder="Director of Spa, thirty years across five-star resorts"
          className="mt-1.5 w-full border border-border px-3 py-2 text-[13px]" />
      </label>

      <label className="mt-4 block">
        <span className="block text-[12px] font-semibold text-ink">About them</span>
        <textarea rows={5} value={draft.bio ?? ''} onChange={e => set('bio', e.target.value)}
          placeholder="Written as they would want to be introduced, not as a job application."
          className="mt-1.5 w-full border border-border px-3 py-2 text-[13px]" />
      </label>

      <div className="mt-4 space-y-2">
        <CollapsibleCheckboxSection title="Treatments and services" categories={SERVICES_CATEGORIES}
          selected={listOf('services_offered')} onChange={value => set('services_offered', value)} />
        <CollapsibleCheckboxSection title="Qualifications" categories={QUALS_CATEGORIES}
          selected={listOf('qualifications')} onChange={value => set('qualifications', value)} />
        <CollapsibleCheckboxSection title="Product houses" flatItems={PRODUCT_HOUSES_FULL}
          selected={listOf('product_houses')} onChange={value => set('product_houses', value)} />
        <CollapsibleCheckboxSection title="Systems" flatItems={SYSTEMS_FULL}
          selected={listOf('systems_experience')} onChange={value => set('systems_experience', value)} />
        <CollapsibleCheckboxSection title="Business skills" flatItems={BUSINESS_SKILLS}
          selected={listOf('business_skills')} onChange={value => set('business_skills', value)} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {commaList('Languages', 'languages', 'English, French')}
        {commaList('Hotel brands worked with', 'hotel_brands_worked', 'Four Seasons, Rosewood')}
      </div>

      <div className="mt-4 flex justify-end">
        <button type="button" onClick={save} disabled={saving}
          className="inline-flex items-center gap-1.5 border border-[#222321] bg-[#222321] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-40">
          <Save size={13} /> {saving ? 'Saving...' : 'Save to their profile'}
        </button>
      </div>
    </div>
  )
}
