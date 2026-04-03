'use client'

import { useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const supabase = createClient()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) { setError(error.message); setLoading(false); return }
    setSent(true)
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center">
              <span className="text-white font-serif font-bold text-xl">W</span>
            </div>
            <span className="text-white font-serif text-2xl font-semibold">WHC Concierge</span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="font-serif text-2xl font-bold text-ink text-center mb-2">Reset Password</h1>
          {sent ? (
            <div className="text-center py-6">
              <p className="text-gray-500 mb-4">Check your email for a password reset link.</p>
              <Link href="/login" className="text-gold font-medium">Back to Sign In</Link>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-center text-sm mb-8">Enter your email and we&apos;ll send you a reset link.</p>
              {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>}
              <form onSubmit={handleSubmit} className="space-y-5">
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" />
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
              <p className="text-center text-sm text-gray-500 mt-6">
                <Link href="/login" className="text-gold font-medium">Back to Sign In</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
