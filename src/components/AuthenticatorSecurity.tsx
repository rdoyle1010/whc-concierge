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

  async function refresh() {
    setLoading(true)
    const { data, error } = await supabase.auth.mfa.listFactors()
    if (error) setError(error.message)
    const verified = (data?.totp || []).find((f: any) => f.status === 'verified') || null
    setFactor(verified)
    setLoading(false)
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
      setMessage('Authenticator app enabled successfully.')
      setEnrollment(null); setCode('')
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
      <div className="w-10 h-10 rounded-xl bg-[#f3f1ec] flex items-center justify-center text-[#9c7a42]"><ShieldCheck size={18}/></div>
      <div className="flex-1"><h3 className="font-serif text-lg font-semibold">Authenticator app</h3><p className="text-sm text-gray-500 mt-1">Add a second sign-in check using Microsoft Authenticator, Google Authenticator, 1Password or another TOTP app. This protects sensitive personal information, bookings and money even if a password is stolen.</p></div>
    </div>

    {required && !factor && <div className="mt-4 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 text-sm"><strong>Required for WHC administrators.</strong> Set this up before using sensitive admin and payment functions.</div>}
    {message && <div className="mt-4 bg-green-50 text-green-700 px-4 py-3 text-sm">{message}</div>}
    {error && <div className="mt-4 bg-red-50 text-red-600 px-4 py-3 text-sm">{error}</div>}

    {loading ? <p className="text-sm text-gray-400 mt-5">Checking security…</p> : factor ? <div className="mt-5 flex items-center justify-between gap-4 rounded-xl bg-green-50 border border-green-200 p-4"><div className="flex items-center gap-2 text-green-800"><ShieldCheck size={17}/><div><p className="text-sm font-semibold">Authenticator enabled</p><p className="text-xs text-green-700">Your account has a verified second factor.</p></div></div><button disabled={busy || required} onClick={removeFactor} className="btn-secondary text-xs disabled:opacity-40" title={required ? 'Admin accounts must keep MFA enabled' : undefined}>Remove</button></div> : enrollment ? <div className="mt-5 space-y-4"><div className="rounded-xl bg-gray-50 p-4"><p className="text-sm font-medium text-ink mb-3">1. Scan this QR code with your authenticator app</p>{enrollment.totp?.qr_code && <img src={enrollment.totp.qr_code} alt="Authenticator QR code" className="w-48 h-48 bg-white border border-border"/>}{enrollment.totp?.secret && <p className="text-xs text-gray-500 mt-3 break-all">Can’t scan it? Enter this key manually: <strong>{enrollment.totp.secret}</strong></p>}</div><div><p className="text-sm font-medium text-ink mb-2">2. Enter the 6-digit code</p><div className="flex gap-2"><input inputMode="numeric" autoComplete="one-time-code" maxLength={8} value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,''))} className="input-field max-w-48" placeholder="123456"/><button disabled={busy || code.length < 6} onClick={verifyEnrollment} className="btn-primary disabled:opacity-50">Verify & enable</button></div></div></div> : <button disabled={busy} onClick={startEnrollment} className="btn-primary mt-5 inline-flex items-center gap-2 disabled:opacity-50"><Smartphone size={15}/>{busy ? 'Starting…' : 'Set up authenticator'}</button>}
  </div>
}
