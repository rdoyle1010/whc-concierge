'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff, BriefcaseBusiness, Sparkles } from 'lucide-react'
import Wordmark from '@/components/Wordmark'

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-[#f3f0eb]" />}><LoginForm /></Suspense>
}

function LoginForm() {
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') || 'talent'
  const requestedDestination = searchParams.get('redirect') || searchParams.get('next') || searchParams.get('returnTo') || ''
  const safeDestination = requestedDestination.startsWith('/') && !requestedDestination.startsWith('//') ? requestedDestination : ''
  const confirmationPending = searchParams.get('registered') === '1' && searchParams.get('confirm') === '1'
  const [role, setRole] = useState<'talent' | 'employer'>(initialRole === 'employer' ? 'employer' : 'talent')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [liveRoles, setLiveRoles] = useState<number | null>(null)
  const [properties, setProperties] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    fetch('/api/public-stats', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => {
        if (cancelled) return
        if (typeof data?.liveRoles === 'number') setLiveRoles(data.liveRoles)
        if (typeof data?.properties === 'number') setProperties(data.properties)
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 15000)
      const response = await fetch('/api/auth/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, cache: 'no-store', signal: controller.signal,
        body: JSON.stringify({ email, password, role, redirect: safeDestination }),
      })
      window.clearTimeout(timeout)
      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.redirect) {
        setError(result?.error || 'Sign in failed. Please try again.')
        setLoading(false)
        return
      }
      window.location.assign(result.redirect)
    } catch (err: any) {
      setError(err?.name === 'AbortError' ? 'Sign in is taking too long. Please try again.' : 'We could not sign you in. Please try again.')
      setLoading(false)
    }
  }

  const registerHref = `/register/${role}${safeDestination ? `?redirect=${encodeURIComponent(safeDestination)}` : ''}`

  return (
    <main id="main-content" className="min-h-screen bg-[#f3f0eb] flex items-stretch">
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-16">
        <div className="w-full max-w-[430px]">
          <Wordmark />
          <div className="mt-10 dashboard-card !p-7 lg:!p-8">
            <p className="dashboard-eyebrow">WHC Concierge</p>
            <h1 className="dashboard-title !text-[34px]">Welcome back</h1>
            <p className="dashboard-intro !mt-2 mb-7">Choose the workspace linked to your account, then sign in.</p>

            {safeDestination === '/roles/match' && (
              <div className="mb-5 rounded-xl border border-[#e0dad2] bg-[#f3f0eb] px-4 py-3 text-[12px] leading-5 text-[#57534e]">
                Sign in as Talent to continue to your role matches. We&apos;ll take you straight back to Match after sign-in.
              </div>
            )}

            <div className="grid grid-cols-2 gap-2 bg-[#f3f0eb] rounded-xl p-1.5 mb-7">
              <button type="button" onClick={() => { setRole('talent'); setError('') }} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${role === 'talent' ? 'bg-[#1c1b1a] text-white shadow-sm' : 'text-secondary hover:text-[#1c1b1a]'}`}><Sparkles size={13} />Talent</button>
              <button type="button" onClick={() => { setRole('employer'); setError('') }} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg text-[12px] font-semibold transition-all ${role === 'employer' ? 'bg-[#1c1b1a] text-white shadow-sm' : 'text-secondary hover:text-[#1c1b1a]'}`}><BriefcaseBusiness size={13} />Hotel / Employer</button>
            </div>

            {confirmationPending && <div role="status" className="bg-emerald-50 border border-emerald-100 text-emerald-700 text-[13px] px-3 py-2.5 rounded-xl mb-5">Your profile is saved. Check your email to confirm your account, then sign in here.</div>}
            {error && <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-[13px] px-3 py-2.5 rounded-xl mb-5">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div><label htmlFor="login-email" className="dashboard-eyebrow block mb-1.5 !text-[9px]">Email</label><input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" /></div>
              <div>
                <label htmlFor="login-password" className="dashboard-eyebrow block mb-1.5 !text-[9px]">Password</label>
                <div className="relative">
                  <input id="login-password" type={show ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" />
                  <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-[#1c1b1a]">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <p className="text-[12px] text-secondary">You will stay signed in on this device.</p>
                <Link href="/forgot-password" className="text-[12px] text-[#1c1b1a] hover:underline">Forgot password?</Link>
              </div>
              <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#1c1b1a] hover:bg-[#33302d] text-white px-5 py-3 text-[13px] font-semibold transition-colors disabled:opacity-50">{loading ? 'Signing in...' : `Sign in as ${role === 'employer' ? 'Hotel / Employer' : 'Talent'}`}</button>
            </form>

            <p className="text-[13px] text-muted mt-7">New to WHC Concierge? <Link href={registerHref} className="text-[#1c1b1a] font-semibold hover:underline">Create an account →</Link></p>
          </div>
        </div>
      </div>

      {/* The brand panel carries facts, not a stock photograph hotlinked from
          a third-party CDN with its URL in view-source. The registration page
          already does it this way and it reads considerably more expensive. */}
      <div className="hidden lg:flex w-[42%] bg-[#1c1b1a] relative items-end">
        <div className="relative p-12 xl:p-16 max-w-xl">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold mb-4">Wellness House Collective</p>
          <p className="text-white text-[30px] leading-tight tracking-[-0.03em] font-semibold">The professional platform for spa and wellness careers.</p>
          <p className="text-white/80 text-[13px] mt-4 leading-6">Live roles, Agency cover, Residency and the Academy - one account, one platform.</p>
          <dl className="mt-9 border-t border-white/20">
            {liveRoles !== null && liveRoles > 0 && (
              <div className="flex items-baseline gap-3 border-b border-white/15 py-4">
                <dt className="sr-only">Live roles this week</dt>
                <dd className="text-[24px] font-serif font-semibold text-white leading-none tabular-nums">{liveRoles}</dd>
                <p className="text-[13px] text-white/80">live role{liveRoles === 1 ? '' : 's'} this week</p>
              </div>
            )}
            {properties !== null && properties > 0 && (
              <div className="flex items-baseline gap-3 border-b border-white/15 py-4">
                <dt className="sr-only">Approved properties</dt>
                <dd className="text-[24px] font-serif font-semibold text-white leading-none tabular-nums">{properties}</dd>
                <p className="text-[13px] text-white/80">approved propert{properties === 1 ? 'y' : 'ies'}</p>
              </div>
            )}
            <div className="py-4">
              <dt className="sr-only">How reviews work</dt>
              <dd className="text-[13px] text-white/80 leading-6">
                Every review comes from a completed, paid engagement between two verified accounts.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </main>
  )
}
