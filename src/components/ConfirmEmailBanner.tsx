'use client'

import { useEffect, useState } from 'react'
import { MailWarning } from 'lucide-react'

// Asks, and never blocks.
//
// An unconfirmed address is not a security problem, it is a silent one: every
// job alert, interview invitation and message goes out and lands nowhere, and
// the person it was for has no idea anything was sent. So this sits at the top
// of the workspace until the address is confirmed, and everything underneath
// it carries on working exactly as it did.

export default function ConfirmEmailBanner() {
  const [state, setState] = useState<'checking' | 'confirmed' | 'unconfirmed'>('checking')
  const [email, setEmail] = useState<string | null>(null)
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    fetch('/api/account/confirm-email', { cache: 'no-store' })
      .then(res => res.ok ? res.json() : null)
      .then(body => {
        if (!active || !body) return
        setEmail(body.email || null)
        // A failed check says nothing, so it shows nothing. A banner that
        // appears because a request timed out is worse than no banner.
        setState(body.confirmed ? 'confirmed' : 'unconfirmed')
      })
      .catch(() => { /* silent: the workspace is not blocked on this */ })
    return () => { active = false }
  }, [])

  async function send() {
    setSending(true); setError('')
    try {
      const res = await fetch('/api/account/confirm-email', { method: 'POST' })
      const body = await res.json().catch(() => ({}))
      // The outcome is read from the answer, not assumed from the request
      // having finished.
      if (!res.ok) { setError(body.error || 'That did not send. Try again shortly.'); return }
      if (body.confirmed) { setState('confirmed'); return }
      setSent(true)
    } catch {
      setError('That did not send. Check your connection and try again.')
    } finally {
      setSending(false)
    }
  }

  if (state !== 'unconfirmed') return null

  return (
    <div className="mb-6 border border-[#1c1c1c] bg-[#f6f6f6] px-5 py-4">
      <div className="flex flex-wrap items-start gap-3">
        <span className="mt-0.5 shrink-0 text-[#1c1c1c]"><MailWarning size={18} /></span>
        <div className="flex-1 min-w-[240px]">
          <p className="text-[14px] font-semibold text-ink">Confirm your email address</p>
          <p className="mt-1 text-[13px] leading-relaxed text-secondary">
            {sent
              ? `Sent to ${email || 'your address'}. Open it and click the button, and this will disappear. Check your spam folder if it is not there in a minute.`
              : <>We have not confirmed {email ? <strong className="text-ink">{email}</strong> : 'your address'} yet.
                 Until we do, job alerts, interview invitations and messages from properties may never reach you.</>}
          </p>
          {error && <p className="mt-2 text-[12px] text-red-700">{error}</p>}
        </div>
        {!sent && (
          <button type="button" onClick={send} disabled={sending}
            className="shrink-0 border border-[#1c1c1c] bg-[#1c1c1c] px-4 py-2 text-[12px] font-semibold text-white disabled:opacity-50">
            {sending ? 'Sending...' : 'Send me the link'}
          </button>
        )}
      </div>
    </div>
  )
}
