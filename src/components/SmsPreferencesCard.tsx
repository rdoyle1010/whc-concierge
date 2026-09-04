'use client'

import { useEffect, useState } from 'react'
import { MessageSquareText } from 'lucide-react'

export default function SmsPreferencesCard() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [optIn, setOptIn] = useState(false)
  const [phone, setPhone] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/sms/preferences', { cache: 'no-store' })
      .then(async res => ({ ok: res.ok, body: await res.json().catch(() => ({})) }))
      .then(({ ok, body }) => {
        if (ok) { setOptIn(Boolean(body.optIn)); setPhone(body.phone || '') }
        else setMessage(body.error || 'Could not load SMS preferences.')
      })
      .catch(() => setMessage('Could not load SMS preferences.'))
      .finally(() => setLoading(false))
  }, [])

  async function toggle() {
    if (saving || loading) return
    const next = !optIn
    setSaving(true); setMessage('')
    const res = await fetch('/api/sms/preferences', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optIn: next }),
    }).catch(() => null)
    const body = res ? await res.json().catch(() => ({})) : {}
    if (!res?.ok) setMessage(body.error || 'Could not save SMS preference.')
    else { setOptIn(next); setPhone(body.phone || phone); setMessage(next ? 'SMS alerts enabled.' : 'SMS alerts disabled.') }
    setSaving(false)
  }

  return <div className="mt-6 max-w-2xl dashboard-card">
    <div className="flex items-start justify-between gap-5">
      <div className="flex min-w-0 gap-3">
        <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f1f1f1] text-[#1c1c1c]"><MessageSquareText size={18}/></div>
        <div>
          <h3 className="font-serif text-lg font-semibold text-ink">Important SMS alerts</h3>
          <p className="mt-1 text-[13px] leading-5 text-secondary">Receive text alerts for important recruitment milestones such as shortlist, interview invitations and job offers. Email and in-app notifications continue as normal.</p>
          {phone ? <p className="mt-2 text-[11px] text-muted">Mobile on profile: {phone}</p> : <p className="mt-2 text-[11px] font-medium text-amber-700">Add a mobile number to your profile before enabling SMS.</p>}
          {message && <p className={`mt-2 text-[11px] ${message.includes('enabled') || message.includes('disabled') ? 'text-emerald-700' : 'text-red-600'}`}>{message}</p>}
        </div>
      </div>
      <button type="button" onClick={toggle} disabled={loading || saving || (!phone && !optIn)} aria-label={optIn ? 'Turn SMS alerts off' : 'Turn SMS alerts on'} className={`relative mt-1 inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${optIn ? 'bg-[#1c1c1c]' : 'bg-gray-200'}`}>
        <span className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${optIn ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  </div>
}
