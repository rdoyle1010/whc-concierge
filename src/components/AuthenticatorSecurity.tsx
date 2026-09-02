'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck, Smartphone } from 'lucide-react'

export default function AuthenticatorSecurity({ required = false }: { required?: boolean }) {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [factor, setFactor] = useState<any>(null)
  const [enrollment, setEnrollment] = useState<any>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  // Shown exactly once, immediately after enrolment. Nothing on the platform
  // can retrieve them again - only hashes are stored.
  const [recoveryCodes, setRecoveryCodes] = useState<string[] | null>(null)
  const [remainingCodes, setRemainingCodes] = useState<number | null>(null)

  async function refresh() {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) setError(error.message)
    const totp = data?.totp || []
    const verified = totp.find((f: any) => f.status === 'verified') || null

    // An abandoned enrolment leaves an unverified factor behind, and Supabase
    // then refuses a second enrolment under the same friendly name - so the
    // user saw a raw API error and had no way to clear it. Sweep them.
    if (!verified) {
      for (const stale of totp.filter((f: any) => f.status !== 'verified')) {
        try { await supabase.auth.mfa.unenroll({ factorId: stale.id }) } catch { }
      }
    }

    setFactor(verified)
    if (verified) {
      try {
        const response = await fetch('/api/auth/mfa-recovery')
        if (response.ok) {
          const body = await response.json()
          setRemainingCodes(typeof body.remaining === 'number' ? body.remaining : null)
        }
      } catch { }
    }
    setLoading(false)
  }

  async function issueRecoveryCodes(): Promise<string[] | null> {
    try {
      const response = await fetch('/api/auth/mfa-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'issue' }),
      })
      const body = await response.json().catch(() => ({}))
      if (!response.ok) { setError(body.error || 'Recovery codes could not be generated.'); return null }
      setRecoveryCodes(body.codes || [])
      setRemainingCodes((body.codes || []).length)
      return body.codes || []
    } catch {
      setError('Recovery codes could not be generated.')
      return null
    }
  }

  useEffect(() => { refresh() }, [])

  async function startEnrollment() {
    setBusy(true); setError(''); setMessage('')
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', friendlyName: 'WHC Authenticator' })
    if (error) setError(error.message)
    else setEnrollment(data)
    setBusy(false)
  }

  async function verifyEnrollment() {
    if (!enrollment?.id || code.trim().length < 6) return
    setBusy(true); setError(''); setMessage('')
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId: enrollment.id, code: code.trim() })
    if (error) setError(error.message)
    else {
      setEnrollment(null); setCode('')
      // Codes are issued immediately, while the person is still here to save
      // them. Enrolling without them is how somebody ends up locked out.
      const codes = await issueRecoveryCodes()
      setMessage(codes
        ? 'Authenticator enabled. Save your recovery codes now - they are shown once and cannot be retrieved later.'
        : 'Authenticator enabled, but recovery codes could not be generated. Use "Generate new recovery codes" below before you sign out.')
      await refresh()
    }
    setBusy(false)
  }

  async function removeFactor() {
    if (!factor?.id || !confirm('Remove authenticator protection from this account?')) return
    setBusy(true); setError(''); setMessage('')
    const { error } = await supabase.auth.mfa.unenroll({ factorId: factor.id })
    if (error) setError(error.message)
    else { setMessage('Authenticator app removed.'); await refresh() }
    setBusy(false)
  }

  return <div className={`dashboard-card ${required && !factor ? 'border-amber-300 ring-1 ring-amber-100' : ''}`}>
    <div className="flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#f1f1f1] flex items-center justify-center text-[#1c1c1c]"><ShieldCheck size={18}/></div>
      <div className="flex-1"><h3 className="font-serif text-lg font-semibold">Authenticator app</h3><p className="text-sm text-secondary mt-1">Add a second sign-in check using Microsoft Authenticator, Google Authenticator, 1Password or another TOTP app. This protects sensitive personal information, bookings and money even if a password is stolen.</p></div>
    </div>

    {required && !factor && <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm"><strong>Required for WHC administrators.</strong> Set this up before using sensitive admin and payment functions.</div>}
    {message && <div role="status" className="mt-4 bg-green-50 text-green-700 px-4 py-3 text-sm">{message}</div>}
    {error && <div role="alert" className="mt-4 bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>}

    {recoveryCodes && recoveryCodes.length > 0 && <div className="mt-5 border-2 border-accent p-5">
      <p className="dashboard-eyebrow">Save these now</p>
      <h4 className="text-[16px] font-serif text-ink mt-1 mb-2">Your recovery codes</h4>
      <p className="text-[13px] text-secondary leading-relaxed mb-4 max-w-[58ch]">Print them, or put them in your password manager. If you lose your phone these are the only way back into your account - each one works once, and WHC cannot recover them for you because only a hashed copy is stored.</p>
      <ul className="grid grid-cols-2 gap-x-6 gap-y-1.5 font-mono text-[14px] text-ink mb-4">
        {recoveryCodes.map(item => <li key={item} className="tabular-nums tracking-wide">{item}</li>)}
      </ul>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={() => { navigator.clipboard?.writeText(recoveryCodes.join('\n')); setMessage('Recovery codes copied.') }} className="btn-secondary text-xs">Copy all</button>
        <button type="button" onClick={() => setRecoveryCodes(null)} className="btn-primary text-xs">I have saved them</button>
      </div>
    </div>}

    {loading ? <p className="text-sm text-muted mt-5">Checking security…</p> : factor ? <div className="mt-5 space-y-3"><div className="flex items-center justify-between gap-4 rounded-xl bg-green-50 border border-green-200 p-4"><div className="flex items-center gap-2 text-green-800"><ShieldCheck size={17}/><div><p className="text-sm font-semibold">Authenticator enabled</p><p className="text-xs text-green-700">Your account has a verified second factor.</p></div></div><button disabled={busy || required} onClick={removeFactor} className="btn-secondary text-xs disabled:opacity-40" title={required ? 'Admin accounts must keep MFA enabled' : undefined}>Remove</button></div>
      <div className="flex flex-wrap items-center justify-between gap-3 border border-border p-4">
        <div>
          <p className="text-[13px] font-medium text-ink">Recovery codes</p>
          <p className="text-[12px] text-secondary mt-0.5">{remainingCodes === null ? 'Unknown' : remainingCodes === 0 ? 'None left. Generate a set now - without them, losing your phone means losing this account.' : `${remainingCodes} unused code${remainingCodes === 1 ? '' : 's'} remaining.`}</p>
        </div>
        <button type="button" disabled={busy} onClick={async () => { setBusy(true); setError(''); setMessage(''); await issueRecoveryCodes(); setBusy(false) }} className={`text-xs ${remainingCodes === 0 ? 'btn-primary' : 'btn-secondary'} disabled:opacity-50`}>Generate new codes</button>
      </div>
    </div> : enrollment ? <div className="mt-5 space-y-4"><div className="rounded-xl bg-[#f1f1f1] p-4"><p className="text-sm font-medium text-ink mb-3">1. Scan this QR code with your authenticator app</p>{enrollment.totp?.qr_code && <img src={enrollment.totp.qr_code} alt="Authenticator QR code" className="w-48 h-48 bg-white border border-border"/>}{enrollment.totp?.secret && <p className="text-xs text-secondary mt-3 break-all">Can’t scan it? Enter this key manually: <strong>{enrollment.totp.secret}</strong></p>}</div><div><p className="text-sm font-medium text-ink mb-2">2. Enter the 6-digit code</p><div className="flex gap-2"><input aria-label="Authenticator code" inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} className="input-field max-w-48" placeholder="123456"/><button disabled={busy || code.length < 6} onClick={verifyEnrollment} className="btn-primary disabled:opacity-50">Verify & enable</button></div></div></div> : <button disabled={busy} onClick={startEnrollment} className="btn-primary mt-5 inline-flex items-center gap-2 disabled:opacity-50"><Smartphone size={15}/>{busy ? 'Starting…' : 'Set up authenticator'}</button>}
  </div>
}
