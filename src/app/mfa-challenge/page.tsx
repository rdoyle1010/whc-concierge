'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Wordmark from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'

export default function MfaChallengePage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#f1f1f1]" />}><MfaChallenge /></Suspense>
}

function MfaChallenge() {
  const params = useSearchParams()
  const supabase = createClient()
  const requested = params.get('next') || ''
  const next = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/'
  const [factorId, setFactorId] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  // Losing a phone must not mean losing an account.
  const [mode, setMode] = useState<'code' | 'recovery'>('code')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [recovered, setRecovered] = useState<number | null>(null)

  useEffect(() => {
    async function load() {
      const { data: userData } = await supabase.auth.getUser()
      if (!userData.user) { window.location.replace('/login'); return }
      const { data, error } = await supabase.auth.mfa.listFactors()
      if (error) { setError(error.message); setLoading(false); return }
      const factor = (data?.totp || []).find((item: any) => item.status === 'verified')
      if (!factor) { window.location.replace(next); return }
      const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
      if (assurance?.currentLevel === 'aal2') { window.location.replace(next); return }
      setFactorId(factor.id)
      setLoading(false)
    }
    load()
  }, [])

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    if (!factorId || code.length !== 6 || busy) return
    setBusy(true); setError('')
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    if (error) { setError('That code was not accepted. Wait for the current six-digit code and try again.'); setBusy(false); return }
    window.location.replace(next)
  }

  async function redeemRecovery(e: React.FormEvent) {
    e.preventDefault()
    if (busy || recoveryCode.trim().length < 10) return
    setBusy(true); setError('')
    try {
      const response = await fetch('/api/auth/mfa-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'redeem', code: recoveryCode.trim() }),
      })
      const result = await response.json().catch(() => ({}))
      if (!response.ok) { setError(result.error || 'That recovery code was not accepted.'); setBusy(false); return }
      setRecovered(typeof result.remaining === 'number' ? result.remaining : 0)
      // The authenticator has been removed, so the session is now sufficient.
      setTimeout(() => window.location.replace(next), 2200)
    } catch {
      setError('Recovery is unavailable right now. Try again in a moment.')
      setBusy(false)
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  return <main id="main-content" className="min-h-screen bg-[#f1f1f1] flex items-center justify-center px-5 py-10">
    <div className="w-full max-w-[430px]">
      <Wordmark />
      <div className="dashboard-card !p-7 lg:!p-8 mt-9">
        <div className="h-11 w-11 rounded-full bg-[#1c1c1c] text-white flex items-center justify-center mb-5"><ShieldCheck size={20}/></div>
        <p className="dashboard-eyebrow">Two-step verification</p>
        <h1 className="dashboard-title !text-[32px]">Confirm it’s you</h1>
        <p className="dashboard-intro !mt-2 mb-6">Open your authenticator app and enter the current six-digit code for Talent House Collective.</p>
        {error && <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-[13px] px-3 py-2.5 rounded-xl mb-5">{error}</div>}
        {recovered !== null ? (
          <div role="status" className="bg-green-50 border border-green-200 text-green-800 text-[13px] px-4 py-3">
            <p className="font-semibold">Recovery code accepted.</p>
            <p className="mt-1">Two-step verification has been switched off so you can get back in. Set up your authenticator again as soon as you are signed in{recovered > 0 ? `. ${recovered} recovery code${recovered === 1 ? '' : 's'} remain` : ', and generate a fresh set of recovery codes'}.</p>
          </div>
        ) : loading ? <p className="text-sm text-muted py-4">Checking your security settings…</p> : mode === 'code' ? <form onSubmit={verify} className="space-y-4">
          <div><label htmlFor="mfa-code" className="dashboard-eyebrow block mb-1.5 !text-[9px]">Authenticator code</label><input id="mfa-code" autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g,''))} className="input-field text-center text-xl tracking-[0.35em]" placeholder="000000" /></div>
          <button type="submit" disabled={busy || code.length !== 6} className="btn-primary w-full disabled:opacity-50">{busy ? 'Verifying…' : 'Verify & continue'}</button>
        </form> : <form onSubmit={redeemRecovery} className="space-y-4">
          <div>
            <label htmlFor="mfa-recovery" className="dashboard-eyebrow block mb-1.5 !text-[9px]">Recovery code</label>
            <input id="mfa-recovery" autoFocus autoComplete="off" spellCheck={false} maxLength={13} value={recoveryCode} onChange={e => setRecoveryCode(e.target.value.toUpperCase())} className="input-field text-center text-lg tracking-[0.2em]" placeholder="XXXXX-XXXXX" />
            <p className="text-[12px] text-secondary mt-2">One of the codes you saved when you set up two-step verification. Each one works once, and using it switches the authenticator off so you can set it up again.</p>
          </div>
          <button type="submit" disabled={busy || recoveryCode.trim().length < 10} className="btn-primary w-full disabled:opacity-50">{busy ? 'Checking…' : 'Use recovery code'}</button>
        </form>}

        {recovered === null && !loading && (
          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
            <button type="button" onClick={() => { setMode(mode === 'code' ? 'recovery' : 'code'); setError('') }} className="text-xs text-ink hover:underline">
              {mode === 'code' ? 'Lost your phone? Use a recovery code' : 'Back to the authenticator code'}
            </button>
            <a href="/contact" className="text-xs text-muted hover:text-ink underline">Contact Talent House support</a>
            <button type="button" onClick={signOut} className="text-xs text-muted hover:text-ink underline">Use a different account</button>
          </div>
        )}
      </div>
    </div>
  </main>
}
