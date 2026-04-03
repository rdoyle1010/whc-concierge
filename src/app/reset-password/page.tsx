'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}

function ResetPasswordForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const code = searchParams.get('code')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [sessionReady, setSessionReady] = useState(false)
  const [exchangeError, setExchangeError] = useState(false)

  useEffect(() => {
    async function exchangeCode() {
      if (!code) {
        // No code — check if there's already a session from the auth callback
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setSessionReady(true)
        } else {
          setExchangeError(true)
        }
        return
      }

      // Exchange the code from the URL for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code)

      if (error) {
        console.error('Code exchange failed:', error.message)
        setExchangeError(true)
        return
      }

      if (data.session) {
        setSessionReady(true)
      } else {
        setExchangeError(true)
      }
    }

    // Also listen for PASSWORD_RECOVERY event as a fallback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setSessionReady(true)
      }
    })

    exchangeCode()

    return () => subscription.unsubscribe()
  }, [code])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)
    setError('')

    const { error: updateError } = await supabase.auth.updateUser({ password })

    if (updateError) {
      setError(updateError.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
    setTimeout(() => router.push('/login'), 3000)
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
          <h1 className="font-serif text-2xl font-bold text-ink text-center mb-2">Set New Password</h1>

          {success ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">Your password has been updated.</p>
              <p className="text-gray-400 text-sm">Redirecting to sign in...</p>
            </div>
          ) : exchangeError ? (
            <div className="text-center py-6">
              <p className="text-red-500 mb-4">This reset link is invalid or has expired.</p>
              <Link href="/forgot-password" className="text-gold font-medium">Request a new reset link</Link>
            </div>
          ) : !sessionReady ? (
            <div className="text-center py-6">
              <div className="animate-spin w-8 h-8 border-2 border-gold border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-gray-500 text-sm">Verifying your reset link...</p>
            </div>
          ) : (
            <>
              <p className="text-gray-400 text-center text-sm mb-8">Enter your new password below.</p>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">New Password</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      minLength={8}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="input-field pr-12"
                      placeholder="Min 8 characters"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm New Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input-field"
                    placeholder="Confirm your password"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </>
          )}

          <p className="text-center text-sm text-gray-500 mt-6">
            <Link href="/login" className="text-gold font-medium">Back to Sign In</Link>
          </p>
        </div>

        <p className="text-center text-white/30 text-xs mt-8">
          &copy; {new Date().getFullYear()} Wellness House Collective
        </p>
      </div>
    </div>
  )
}
