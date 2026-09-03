'use client'

import { useState } from 'react'
import { KeyRound, AlertTriangle, Check, Search } from 'lucide-react'

// "Kelly cannot get in" used to be unanswerable from inside the platform.
// Every cause - wrong role, unconfirmed address, an authenticator on a phone
// she no longer owns - looks identical from outside: a person who cannot sign
// in. This says which one it is, in a sentence, and then fixes it.

type Diagnosis = {
  found: boolean
  email?: string
  role?: string | null
  emailConfirmed?: boolean
  lastSignIn?: string | null
  createdAt?: string | null
  twoStep?: 'enrolled' | 'none' | 'unknown'
  recoveryCodesLeft?: number | null
  verdict?: string
  fix?: string
}

function when(value: string | null | undefined) {
  if (!value) return 'never'
  return new Date(value).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
}

export default function AccountAccessPanel() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState<string | null>(null)
  const [result, setResult] = useState<Diagnosis | null>(null)
  const [error, setError] = useState('')
  const [outcome, setOutcome] = useState('')

  async function check(event?: React.FormEvent) {
    event?.preventDefault()
    if (!email.trim()) return
    setBusy('check'); setError(''); setOutcome(''); setResult(null)
    try {
      const res = await fetch(`/api/admin/account-access?email=${encodeURIComponent(email.trim())}`, { cache: 'no-store' })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) setError(body.error || 'Could not check that account.')
      else setResult(body)
    } catch { setError('Could not reach the server.') }
    setBusy(null)
  }

  async function act(action: 'send_reset' | 'clear_two_step', confirmText?: string) {
    if (confirmText && !confirm(confirmText)) return
    setBusy(action); setError(''); setOutcome('')
    try {
      const res = await fetch('/api/admin/account-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), action }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) setError(body.error || 'That did not work.')
      else { setOutcome(body.detail || 'Done.'); await check() }
    } catch { setError('Could not reach the server.') }
    setBusy(null)
  }

  const roleLabel = result?.role === 'candidate' ? 'Talent'
    : result?.role === 'employer' ? 'Hotel / employer'
      : result?.role === 'admin' ? 'Administrator'
        : 'None set'

  return <div className="dashboard-card">
    <div className="mb-5 flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7e7e7] text-[#1c1c1c]"><KeyRound size={18} /></div>
      <div>
        <p className="text-[15px] font-semibold text-ink">Somebody cannot sign in</p>
        <p className="mt-1 max-w-2xl text-[12px] leading-5 text-muted">
          Type their email address. This reads the account state the browser cannot see - role, confirmed
          address, two-step verification - and tells you which one is in the way.
        </p>
      </div>
    </div>

    <form onSubmit={check} className="flex flex-wrap gap-2">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="their@email.com"
        aria-label="Email address on the account"
        className="input-field min-w-[220px] flex-1"
      />
      <button type="submit" disabled={busy !== null || !email.trim()} className="btn-primary inline-flex shrink-0 items-center gap-2 disabled:opacity-50">
        <Search size={14} />{busy === 'check' ? 'Checking...' : 'Check account'}
      </button>
    </form>

    {error && <div className="mt-3 rounded-xl bg-red-50 px-3 py-2.5 text-[12px] leading-5 text-red-700">{error}</div>}
    {outcome && <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 px-3 py-2.5 text-[12px] leading-5 text-emerald-800">
      <Check size={14} className="mt-0.5 shrink-0" />{outcome}
    </div>}

    {result && <div className="mt-4 rounded-2xl border border-border bg-[#f1f1f1] p-4">
      <div className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-[12.5px] leading-5 ${
        result.found ? 'bg-white text-ink' : 'bg-amber-50 text-amber-800'}`}>
        <AlertTriangle size={14} className="mt-0.5 shrink-0" />
        <span><strong className="font-semibold">{result.verdict}</strong>{result.fix ? <> {result.fix}</> : null}</span>
      </div>

      {result.found && <>
        <dl className="mt-4 grid gap-x-6 gap-y-2 text-[12px] sm:grid-cols-2">
          {[
            ['Role', roleLabel],
            ['Address confirmed', result.emailConfirmed ? 'Yes' : 'No'],
            ['Two-step verification', result.twoStep === 'enrolled'
              ? `Enrolled${result.recoveryCodesLeft != null ? ` - ${result.recoveryCodesLeft} recovery codes left` : ''}`
              : result.twoStep === 'none' ? 'Not set up' : 'Could not be read'],
            ['Last signed in', when(result.lastSignIn)],
            ['Account created', when(result.createdAt)],
          ].map(([label, value]) => <div key={String(label)} className="flex justify-between gap-3 border-b border-border pb-1.5">
            <dt className="text-muted">{label}</dt>
            <dd className="text-right font-medium text-ink">{value}</dd>
          </div>)}
        </dl>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => act('send_reset')}
            disabled={busy !== null}
            className="btn-secondary text-[12px] disabled:opacity-50"
          >{busy === 'send_reset' ? 'Sending...' : 'Send a password reset'}</button>

          {result.twoStep === 'enrolled' && <button
            type="button"
            onClick={() => act('clear_two_step',
              `Remove two-step verification from ${result.email}?\n\nThey will be able to sign in on their password alone until they set up a new authenticator. Only do this if you have confirmed by phone that it is really them.`)}
            disabled={busy !== null}
            className="btn-secondary text-[12px] !border-red-200 !text-red-700 disabled:opacity-50"
          >{busy === 'clear_two_step' ? 'Removing...' : 'Clear two-step verification'}</button>}
        </div>

        <p className="mt-3 text-[10.5px] leading-4 text-muted">
          Clearing two-step is recorded against your name in the audit log. Confirm by phone that it is really
          them before you press it - an email asking for it is exactly what an attacker would send.
        </p>
      </>}
    </div>}
  </div>
}
