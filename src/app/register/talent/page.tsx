'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import Wordmark from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 64

type PublicStats = { liveRoles: number | null; properties: number | null; verifiedReviews: number | null }

export default function TalentRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [refCode, setRefCode] = useState('')
  const [stats, setStats] = useState<PublicStats | null>(null)

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('ref')
    if (r) setRefCode(r.slice(0, 30))
  }, [])

  useEffect(() => {
    let cancelled = false
    fetch('/api/public-stats', { cache: 'no-store' })
      .then(res => (res.ok ? res.json() : null))
      .then(data => { if (!cancelled && data) setStats(data) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [])

  const createAccount = async () => {
    setError('')
    if (!fullName.trim()) return setError('Please enter your full name.')
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Please enter a valid email address.')
    if (password.length < MIN_PASSWORD_LENGTH) return setError(`Use at least ${MIN_PASSWORD_LENGTH} characters.`)
    if (password.length > MAX_PASSWORD_LENGTH) return setError(`Use no more than ${MAX_PASSWORD_LENGTH} characters.`)

    setLoading(true)
    try {
      const initResponse = await fetch('/api/register/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          role: 'talent',
          displayName: fullName,
          refCode: refCode || undefined,
        }),
      })
      const init = await initResponse.json().catch(() => ({}))

      if (!initResponse.ok || !init.userId) {
        setError(init.error || 'We could not create your account. Please check your details and try again.')
        return
      }

      if (init.session?.access_token && init.session?.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession(init.session)
        if (sessionError) {
          setError('Your account was created, but sign-in could not be completed. Please use the login page.')
          return
        }
      }

      if (init.requiresEmailConfirmation) {
        router.push('/login?registered=1&confirm=1')
        return
      }

      router.push('/talent/profile?welcome=1')
    } catch {
      setError('We could not create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Ruled fact rows for the navy panel. Numeric facts only appear once the
  // live counts have loaded; the two standing promises always show.
  const factRows: Array<{ value: string | null; label: string }> = [
    stats?.liveRoles ? { value: String(stats.liveRoles), label: `live role${stats.liveRoles === 1 ? '' : 's'} open right now` } : null,
    stats?.properties ? { value: String(stats.properties), label: `approved propert${stats.properties === 1 ? 'y' : 'ies'} hiring through WHC` } : null,
    { value: null, label: 'Salary expectations stay private until you choose' },
    { value: null, label: 'Verified employers only' },
  ].filter(Boolean) as Array<{ value: string | null; label: string }>

  return (
    <main id="main-content" className="min-h-screen bg-[#f5f6f8] flex items-stretch">
      <div className="flex-1 flex items-center justify-center px-6 py-10 lg:py-16">
        <div className="w-full max-w-[430px]">
          <Wordmark />
          <div className="mt-10 bg-white border border-[#e3e7eb] p-7 lg:p-8">
            <p className="text-[10px] uppercase tracking-[0.2em] text-[#8a949b] font-semibold">WHC Concierge</p>
            <h1 className="mt-2 text-[30px] leading-tight tracking-[-0.02em] font-serif font-semibold text-[#10283b]">Create your Talent account</h1>
            <p className="mt-2 mb-7 text-[13px] leading-6 text-[#5a6a76]">Three fields now. You build your professional profile once you are inside - nothing is asked twice.</p>

            {error && <div role="alert" className="bg-red-50 border border-red-100 text-red-600 text-[13px] px-3 py-2.5 mb-5">{error}</div>}

            <div className="space-y-4">
              <div>
                <label htmlFor="reg-full-name" className="block text-[10px] font-semibold text-[#5a6a76] uppercase tracking-[0.14em] mb-1.5">Full name</label>
                <input id="reg-full-name" type="text" value={fullName} onChange={(e) => { setError(''); setFullName(e.target.value) }} className="input-field" autoComplete="name" />
              </div>
              <div>
                <label htmlFor="reg-email" className="block text-[10px] font-semibold text-[#5a6a76] uppercase tracking-[0.14em] mb-1.5">Email</label>
                <input id="reg-email" type="email" value={email} onChange={(e) => { setError(''); setEmail(e.target.value) }} className="input-field" autoComplete="email" />
              </div>
              <div>
                <label htmlFor="reg-password" className="block text-[10px] font-semibold text-[#5a6a76] uppercase tracking-[0.14em] mb-1.5">Password</label>
                <div className="relative">
                  <input id="reg-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(e) => { setError(''); setPassword(e.target.value) }} className="input-field pr-10" maxLength={MAX_PASSWORD_LENGTH} autoComplete="new-password" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-[#0b2f4d]">{showPassword ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                </div>
                <p className="mt-1.5 text-[11px] text-[#8a949b]">Use {MIN_PASSWORD_LENGTH}-{MAX_PASSWORD_LENGTH} characters.</p>
              </div>

              <button type="button" onClick={createAccount} disabled={loading} className="w-full bg-[#0b2f4d] hover:bg-[#123f64] text-white px-5 py-3 text-[13px] font-semibold transition-colors disabled:opacity-40">
                {loading ? 'Creating account...' : 'Create account and build profile'}
              </button>
            </div>

            {refCode && <p className="mt-4 text-[11px] text-[#8a949b]">Referral code <span className="font-semibold text-[#10283b]">{refCode}</span> will be applied to your account.</p>}

            <p className="text-[13px] text-muted mt-7">Already have an account? <Link href="/login?role=talent" className="text-[#0b2f4d] font-semibold hover:underline">Sign in →</Link></p>
          </div>
        </div>
      </div>

      <div className="hidden lg:flex w-[42%] bg-[#0b2f4d] items-center">
        <div className="p-12 xl:p-16 max-w-xl w-full">
          <p className="text-[10px] uppercase tracking-[0.2em] text-white/50 font-semibold mb-4">Wellness House Collective</p>
          <p className="text-white text-[30px] leading-tight tracking-[-0.03em] font-serif font-semibold">The professional platform for spa and wellness careers.</p>

          <dl className="mt-10">
            {factRows.map(row => (
              <div key={row.label} className="border-t border-white/15 py-4">
                {row.value ? (
                  <div className="flex items-baseline gap-3">
                    <dt className="sr-only">{row.label}</dt>
                    <dd className="text-[26px] font-serif font-semibold text-white leading-none">{row.value}</dd>
                    <dd className="text-[13px] text-white/70 leading-5">{row.label}</dd>
                  </div>
                ) : (
                  <>
                    <dt className="sr-only">WHC standard</dt>
                    <dd className="text-[14px] font-serif font-medium text-white/85 leading-6">{row.label}</dd>
                  </>
                )}
              </div>
            ))}
            <div className="border-t border-white/15" />
          </dl>

          <p className="mt-8 text-white/55 text-[13px] leading-6">Live roles, agency cover, residencies and the Academy - one account, one platform.</p>
        </div>
      </div>
    </main>
  )
}
