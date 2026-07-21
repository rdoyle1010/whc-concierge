'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { MailCheck } from 'lucide-react'

// Account recovery, step 1: email a password reset link. The link lands on
// /reset-password, where the new password is set.

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (resetError) {
        setError(resetError.message)
        setLoading(false)
        return
      }
      setSent(true)
    } catch (err: any) {
      setError(err.message || 'Something went wrong - please try again.')
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <Link href="/"><Image src="/images/whc-logo.jpg" alt="Wellness House Collective" width={140} height={46} className="object-contain mix-blend-multiply" /></Link>

          {sent ? (
            <>
              <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mt-10 mb-6">
                <MailCheck size={22} className="text-green-600" />
              </div>
              <h1 className="text-[28px] font-medium text-ink mb-1 leading-tight">Check your email</h1>
              <p className="text-[14px] text-muted mb-8">
                If an account exists for <span className="font-medium text-ink">{email}</span>, a password reset link is on its way. The link takes you straight to a page where you can choose a new password.
              </p>
              <p className="text-[13px] text-muted">
                Nothing arrived? Check your spam folder, or{' '}
                <button type="button" onClick={() => setSent(false)} className="text-ink font-medium hover:underline">try again</button>.
              </p>
              <p className="text-[13px] text-muted mt-8">
                <Link href="/login" className="text-ink font-medium hover:underline">&larr; Back to sign in</Link>
              </p>
            </>
          ) : (
            <>
              <h1 className="text-[28px] font-medium text-ink mt-10 mb-1 leading-tight">Forgot your password?</h1>
              <p className="text-[14px] text-muted mb-8">Enter your email and we will send you a link to reset it.</p>

              {error && <div className="bg-red-50 text-red-600 text-[13px] px-3 py-2.5 rounded-lg mb-5">{error}</div>}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="eyebrow block mb-1.5">Email</label>
                  <input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send reset link'}
                </button>
              </form>

              <p className="text-[13px] text-muted mt-8">
                Remembered it? <Link href="/login" className="text-ink font-medium hover:underline">Sign in &rarr;</Link>
              </p>
            </>
          )}
        </div>
      </div>

      {/* Right: image */}
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
