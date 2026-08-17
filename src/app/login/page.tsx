'use client'

import { useState, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-white" />}><LoginForm /></Suspense>
}

function LoginForm() {
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role') || 'talent'
  const confirmationPending = searchParams.get('registered') === '1' && searchParams.get('confirm') === '1'
  const [role, setRole] = useState<'talent' | 'employer'>(initialRole as any)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const controller = new AbortController()
      const timeout = window.setTimeout(() => controller.abort(), 15000)

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        signal: controller.signal,
        body: JSON.stringify({
          email,
          password,
          redirect: searchParams.get('redirect') || '',
        }),
      })
      window.clearTimeout(timeout)

      const result = await response.json().catch(() => ({}))
      if (!response.ok || !result?.redirect) {
        setError(result?.error || 'Sign in failed. Please try again.')
        setLoading(false)
        return
      }

      // A hard navigation is intentional here. Password auth is now completed
      // server-side and the response sets the Supabase cookies; a full request
      // guarantees the protected destination sees those cookies immediately.
      window.location.assign(result.redirect)
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setError('Sign in is taking too long. Please try again.')
      } else {
        setError('We could not sign you in. Please try again.')
      }
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <Link href="/"><Image src="/images/whc-logo.jpg" alt="Wellness House Collective" width={140} height={46} className="object-contain mix-blend-multiply" /></Link>
          <h1 className="text-[28px] font-medium text-ink mt-10 mb-1 leading-tight">Welcome back</h1>
          <p className="text-[14px] text-muted mb-8">Sign in to your account</p>

          <div className="flex bg-surface rounded-lg p-1 mb-7">
            <button type="button" onClick={() => setRole('talent')} className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-colors ${role === 'talent' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>Talent</button>
            <button type="button" onClick={() => setRole('employer')} className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-colors ${role === 'employer' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>Hotel / Employer</button>
          </div>

          {confirmationPending && <div className="bg-emerald-50 text-emerald-700 text-[13px] px-3 py-2.5 rounded-lg mb-5">Your profile is saved. Check your email to confirm your account, then sign in here.</div>}
          {error && <div className="bg-red-50 text-red-600 text-[13px] px-3 py-2.5 rounded-lg mb-5">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="eyebrow block mb-1.5">Email</label>
              <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" />
            </div>
            <div>
              <label className="eyebrow block mb-1.5">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" className="w-3.5 h-3.5 border-border rounded text-ink focus:ring-ink" /><span className="text-[12px] text-muted">Remember me</span></label>
              <Link href="/forgot-password" className="text-[12px] text-muted hover:text-ink">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Signing in...' : 'Sign in'}</button>
          </form>

          <p className="text-[13px] text-muted mt-8">New to WHC Concierge? <Link href={`/register/${role}`} className="text-ink font-medium hover:underline">Create an account &rarr;</Link></p>
        </div>
      </div>

      <div className="hidden lg:block w-[45%] relative bg-surface">
        <img src="https://images.pexels.com/photos/7587466/pexels-photo-7587466.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&dpr=1" alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-black/30" />
        <div className="absolute bottom-12 left-12 right-12">
          <p className="text-white/90 text-[20px] font-medium leading-snug">&ldquo;Where exceptional talent meets exceptional opportunity.&rdquo;</p>
          <p className="text-white/50 text-[13px] mt-3">Wellness House Collective</p>
        </div>
      </div>
    </div>
  )
}
