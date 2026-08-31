'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { MessageSquareText } from 'lucide-react'

export default function TalentSmsPreference() {
  const pathname = usePathname()
  const supabase = createClient()
  const [profileId, setProfileId] = useState<string | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [saving, setSaving] = useState(false)
  const [loaded, setLoaded] = useState(false)

  const show = pathname === '/talent/settings' || pathname === '/talent/agency/settings'

  useEffect(() => {
    if (!show) return
    let active = true
    ;(async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      const { data } = await supabase
        .from('candidate_profiles')
        .select('id,sms_opt_in')
        .eq('user_id', user.id)
        .maybeSingle()
      if (!active) return
      setProfileId(data?.id || null)
      setEnabled(Boolean(data?.sms_opt_in))
      setLoaded(true)
    })()
    return () => { active = false }
  }, [show])

  if (!show || !loaded || !profileId) return null

  const toggle = async () => {
    if (saving) return
    const next = !enabled
    setSaving(true)
    setEnabled(next)
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileId, data: { sms_opt_in: next } }),
      })
      if (!res.ok) throw new Error('Could not save')
    } catch {
      setEnabled(!next)
      alert('Could not update SMS notifications. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed right-5 bottom-5 z-40 w-[min(390px,calc(100vw-2.5rem))] rounded-2xl border border-border bg-white p-4 shadow-xl">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 rounded-full bg-[#e8eef4] p-2 text-[#0b2f4d]"><MessageSquareText size={17} /></div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[14px] font-semibold text-ink">SMS notifications</p>
              <p className="mt-1 text-[12px] leading-5 text-secondary">Get a short text when you have a new message, interview update, application update, Agency Cover request, urgent cover request or Residency update. Full details stay inside WHC Concierge.</p>
            </div>
            <button type="button" onClick={toggle} disabled={saving} aria-label={enabled ? 'Turn SMS notifications off' : 'Turn SMS notifications on'} className={`relative mt-0.5 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${enabled ? 'bg-[#0b2f4d]' : 'bg-gray-200'} ${saving ? 'opacity-60' : ''}`}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          <p className={`mt-2 text-[11px] font-medium ${enabled ? 'text-green-700' : 'text-muted'}`}>{enabled ? 'SMS alerts are on' : 'SMS alerts are off'}</p>
        </div>
      </div>
    </div>
  )
}
