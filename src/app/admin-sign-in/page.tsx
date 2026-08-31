'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import Wordmark from '@/components/Wordmark'

export default function AdminSignInPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify({ email, password, role: 'admin', redirect: '/admin/dashboard' }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok || !body.redirect) {
        setError(body.error || 'Admin sign in failed.')
        setLoading(false)
        return
      }
      window.location.assign(body.redirect)
    } catch {
      setError('Admin sign in failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f5f5] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-[430px]">
        <Wordmark />
        <div className="mt-10 dashboard-card !p-8">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#0b2f4d] text-white mb-5">
            <ShieldCheck size={20} />
          </div>
          <p className="dashboard-eyebrow">WHC internal</p>
          <h1 className="dashboard-title !text-[32px]">Admin sign in</h1>
          <p className="dashboard-intro !mt-2 mb-7">For authorised Wellness House Collective administrators only.</p>

          {error && <div className="bg-red-50 border border-red-100 text-red-600 text-[13px] px-3 py-2.5 rounded-xl mb-5">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="dashboard-eyebrow block mb-1.5 !text-[9px]">Email</label>
              <input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" />
            </div>
            <div>
              <label className="dashboard-eyebrow block mb-1.5 !text-[9px]">Password</label>
              <div className="relative">
                <input type={show ? 'text' : 'password'} required autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" />
                <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-[#0b2f4d]" aria-label={show ? 'Hide password' : 'Show password'}>
                  {show ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-[#0b2f4d] hover:bg-[#123f64] text-white px-5 py-3 text-[13px] font-semibold transition-colors disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign in to Admin'}
            </button>
          </form>

          <p className="text-[12px] text-muted mt-6">Talent or employer? <Link href="/login" className="text-[#0b2f4d] font-semibold hover:underline">Use the main sign in</Link>.</p>
        </div>
      </div>
    </main>
  )
}
