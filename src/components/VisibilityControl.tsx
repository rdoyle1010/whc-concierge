'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import {
  DEFAULT_VISIBILITY, VISIBILITY_COPY, visibilityFrom,
  type TalentVisibility,
} from '@/lib/talent-visibility'

// The same three answers as the registration form, in the same words.
//
// Stealth Mode already existed and was buried in Settings behind a switch
// nobody found, which meant the only professionals protected were the ones
// who went looking. A choice that matters this much belongs where somebody
// can see it, described in what it does rather than what it is called.

const OPTIONS: TalentVisibility[] = ['private', 'discreet', 'open']

export default function VisibilityControl() {
  const supabase = createClient()
  const [state, setState] = useState<TalentVisibility | null>(null)
  const [profileId, setProfileId] = useState<string | null>(null)
  const [saving, setSaving] = useState<TalentVisibility | null>(null)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      const { data } = await supabase.from('candidate_profiles')
        .select('id, profile_visible, stealth_mode, private_mode')
        .eq('user_id', user.id).maybeSingle()
      if (!active) return
      setProfileId(data?.id || null)
      setState(visibilityFrom(data))
    })().catch(() => { if (active) setError('We could not read your current setting.') })
    return () => { active = false }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function choose(next: TalentVisibility) {
    if (!profileId || next === state) return
    setSaving(next); setError(''); setSaved(false)
    try {
      const res = await fetch('/api/talent/visibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visibility: next }),
      })
      const body = await res.json().catch(() => ({}))
      // Read the answer. A save that failed and a save that worked must not
      // look the same, least of all on this setting.
      if (!res.ok) { setError(body.error || 'That did not save. Try again.'); return }
      setState(next)
      setSaved(true)
    } catch {
      setError('That did not save. Check your connection and try again.')
    } finally {
      setSaving(null)
    }
  }

  if (!state) {
    return <p className="text-[13px] text-secondary">Loading your visibility setting...</p>
  }

  return (
    <div>
      <div className="space-y-2">
        {OPTIONS.map(option => {
          const on = state === option
          return (
            <button key={option} type="button" onClick={() => choose(option)}
              disabled={saving !== null}
              className={`flex w-full items-start gap-3 border p-4 text-left transition-colors disabled:opacity-60 ${on ? 'border-[#166534] bg-[#f3fbf5] ring-1 ring-[#166534]' : 'border-border hover:border-[#6b6b6b]'}`}>
              <span aria-hidden className={`mt-0.5 h-4 w-4 shrink-0 rounded-full border ${on ? 'border-[#166534] bg-[#166534]' : 'border-[#c9c9c9]'}`} />
              <span>
                <span className="block text-[14px] font-semibold text-ink">
                  {VISIBILITY_COPY[option].label}
                  {on && <span className="ml-2 text-[11px] font-semibold uppercase tracking-[.14em] text-[#166534]">Current</span>}
                </span>
                <span className="mt-1 block text-[12.5px] leading-relaxed text-secondary">{VISIBILITY_COPY[option].detail}</span>
              </span>
            </button>
          )
        })}
      </div>
      {saving && <p className="mt-3 text-[12px] text-secondary">Saving...</p>}
      {saved && !saving && <p className="mt-3 text-[12px] text-[#166534]">Saved. This takes effect straight away.</p>}
      {error && <p className="mt-3 text-[12px] text-red-700">{error}</p>}
    </div>
  )
}
