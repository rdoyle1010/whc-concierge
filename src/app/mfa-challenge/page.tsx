'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Wordmark from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'
import { ShieldCheck } from 'lucide-react'

export default function MfaChallengePage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#f5f6f8]" />}><MfaChallenge /></Suspense>
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

  async function signOut() {
    await supabase.auth.signOut()
    window.location.replace('/login')
  }

  return <div className="min-h-screen bg-[#f5f6f8] flex items-center justify-center px-5 py-10">
    <div className="w-full max-w-[430px]">
      <Wordmark />
      <div className="dashboard-card !p-7 lg:!p-8 mt-9">
        <div className="h-11 w-11 rounded-full bg-[#0b2f4d] text-white flex items-center justify-center mb-5"><ShieldCheck size={20}/></div>
        <p className="dashboard-eyebrow">Two-step verification</p>
        <h1 className="dashboard-title !text-[32px]">Confirm it’s you</h1>
        <p className="dashboard-intro !mt-2 mb-6">Open your authenticator app and enter the current six-digit code for WHC Concierge.</p>
        {error && <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] px-3 py-2.5 rounded-xl mb-5">{error}</div>}
        {loading ? <p className="text-sm text-muted py-4">Checking your security settings…</p> : <form onSubmit={verify} className="space-y-4">
          <div><label className="dashboard-eyebrow block mb-1.5 !text-[9px]">Authenticator code</label><input autoFocus inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g,''))} className="input-field text-center text-xl tracking-[0.35em]" placeholder="000000" /></div>
          <button type="submit" disabled={busy || code.length !== 6} className="btn-primary w-full disabled:opacity-50">{busy ? 'Verifying…' : 'Verify & continue'}</button>
        </form>}
        <button type="button" onClick={signOut} className="mt-5 text-xs text-muted hover:text-ink underline">Use a different account</button>
      </div>
    </div>
  </div>
}
