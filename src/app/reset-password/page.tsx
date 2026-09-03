'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

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
    e.preventDefault(); setError('')
    if (password.length < 8) return setError('Your new password must be at least 8 characters.')
    if (password !== confirm) return setError('The passwords do not match.')
    setLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) { setError('Your reset link is invalid or has expired - please request a new one.'); setLoading(false); return }
      const { error: updateError } = await supabase.auth.updateUser({ password })
      if (updateError) { setError(updateError.message); setLoading(false); return }
      setDone(true); await supabase.auth.signOut(); setTimeout(() => router.push('/login'), 1500)
    } catch (err: any) { setError(err.message || 'Something went wrong - please try again.'); setLoading(false) }
  }

  return (
    <main id="main-content" className="min-h-screen bg-surface flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[430px] public-panel p-7 md:p-9">
          <Wordmark />
          {done ? <>
            <p className="public-eyebrow mt-9 mb-3">Account recovery</p><h1 className="text-[30px] font-semibold text-ink mb-2">Password updated</h1><p className="text-[14px] text-secondary mb-7">Your password has been changed. Taking you back to sign in...</p><Link href="/login" className="btn-primary w-full inline-block text-center">Go to sign in</Link>
          </> : <>
            <p className="public-eyebrow mt-9 mb-3">Account recovery</p><h1 className="text-[30px] font-semibold text-ink mb-2">Choose a new password</h1><p className="text-[14px] text-secondary mb-7">Use at least 8 characters and choose something unique to Talent House.</p>
            {error && <div role="alert" className="bg-red-50 text-red-600 text-[13px] px-3 py-2.5 rounded-xl mb-5">{error} {(error.toLowerCase().includes('expired') || error.toLowerCase().includes('invalid')) ? <Link href="/forgot-password" className="font-medium underline">Request a new link</Link> : null}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label htmlFor="reset-password" className="eyebrow block mb-1.5">New password</label><div className="relative"><input id="reset-password" type={show ? 'text' : 'password'} required autoComplete="new-password" value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="At least 8 characters" /><button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide password' : 'Show password'} className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-muted hover:text-ink">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button></div></div>
              <div><label htmlFor="reset-confirm" className="eyebrow block mb-1.5">Confirm new password</label><input id="reset-confirm" type={show ? 'text' : 'password'} required autoComplete="new-password" value={confirm} onChange={e => setConfirm(e.target.value)} className="input-field" /></div>
              <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Updating...' : 'Update password'}</button>
            </form>
            <p className="text-[13px] text-muted mt-7 text-center"><Link href="/login" className="text-ink font-medium hover:underline">← Back to sign in</Link></p>
          </>}
        </div>
      </div>
      <div className="hidden lg:block w-[42%] relative bg-[#1c1c1c]"><div className="absolute bottom-12 left-12 right-12"><p className="text-white text-[20px] font-medium leading-snug">Where exceptional talent meets exceptional opportunity.</p><p className="text-white/70 text-[12px] mt-3">Talent House Collective</p></div></div>
    </main>
  )
}
