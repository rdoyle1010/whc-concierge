'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

// Account recovery, step 2: the emailed reset link lands here with a
// recovery session (the Supabase browser client picks it up from the URL
// automatically), so updateUser can set the new password.

export default function ResetPasswordPage() {
  const router = useRouter()
  const supabase = createClient()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('Your new password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('The passwords do not match.')
      return
    }

    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        setError('Your reset link is invalid or has expired - please request a new one.')
        setLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) {
        setError(updateError.message)
        setLoading(false)
        return
      }

      setDone(true)
      // Sign out of the recovery session so they log in fresh with the new password
      await supabase.auth.signOut()
      setTimeout(() => router.push('/login'), 1500)
    } catch (err: any) {
      setError(err.message || 'Something went wrong - please try again.')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <Link href="/"><Image src="/images/whc-logo.jpg" alt="Wellness House Collective" width={140} height={46} className="object-contain mix-blend-multiply" /></Link>

          {done ? (
            <>
              <h1 className="text-[28px] font-medium text-ink mt-10 mb-1 leading-tight">Password updated</h1>
              <p className="text-[14px] text-muted mb-8">Your password has been changed. Taking you to sign in...</p>
              <Link href="/login" className="btn-primary w-full inline-block text-center">Go to sign in</Link>
            </>
          ) : (
            <>
              <h1 className="text-[28px] font-medium text-ink mt-10 mb-1 leading-tight">Choose a new password</h1>
              <p className="text-[14px] text-muted mb-8">Enter a new password for your account below.</p>

              {error && (
                <div className="bg-red-50 text-red-600 text-[13px] px-3 py-2.5 rounded-lg mb-5">
                  {error}{' '}
                  {error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid') ? (
                    <Link href="/forgot-password" className="font-medium underline">Request a new link</Link>
                  ) : null}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="eyebrow block mb-1.5">New password</label>
                  <div className="relative">
                    <input type={show ? 'text' : 'password'} required autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-10" placeholder="At least 8 characters" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-ink">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </div>
                <div>
                  <label className="eyebrow block mb-1.5">Confirm new password</label>
                  <input type={show ? 'text' : 'password'} required autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className="input-field" />
                </div>
                <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
                  {loading ? 'Updating...' : 'Update password'}
                </button>
              </form>

              <p className="text-[13px] text-muted mt-8">
                <Link href="/login" className="text-ink font-medium hover:underline">&larr; Back to sign in</Link>
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
