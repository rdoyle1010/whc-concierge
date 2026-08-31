'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { MailCheck } from 'lucide-react'

export default function ForgotPasswordPage() {
  const supabase = createClient()
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setLoading(true); setError('')
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` })
      if (resetError) { setError(resetError.message); setLoading(false); return }
      setSent(true)
    } catch (err: any) { setError(err.message || 'Something went wrong - please try again.') }
    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-surface flex">
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[430px] public-panel p-7 md:p-9">
          <Link href="/"><Image src="/images/whc-logo.jpg" alt="Wellness House Collective" width={150} height={50} className="object-contain mix-blend-multiply" /></Link>
          {sent ? <>
            <div className="w-12 h-12 bg-[#FDF6EC] rounded-xl flex items-center justify-center mt-9 mb-6"><MailCheck size={22} className="text-accent" /></div>
            <p className="public-eyebrow mb-3">Account recovery</p><h1 className="text-[30px] font-semibold text-ink mb-2">Check your email</h1>
            <p className="text-[14px] text-secondary leading-7 mb-7">If an account exists for <span className="font-semibold text-ink">{email}</span>, a password reset link is on its way.</p>
            <button type="button" onClick={() => setSent(false)} className="btn-secondary w-full">Try another email</button>
            <p className="text-[13px] text-muted mt-6 text-center"><Link href="/login" className="text-ink font-medium hover:underline">← Back to sign in</Link></p>
          </> : <>
            <p className="public-eyebrow mt-9 mb-3">Account recovery</p><h1 className="text-[30px] font-semibold text-ink mb-2">Forgot your password?</h1>
            <p className="text-[14px] text-secondary mb-7">Enter your email and we&apos;ll send you a secure reset link.</p>
            {error && <div className="bg-red-50 text-red-600 text-[13px] px-3 py-2.5 rounded-xl mb-5">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4"><div><label className="eyebrow block mb-1.5">Email</label><input type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" /></div><button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">{loading ? 'Sending...' : 'Send reset link'}</button></form>
            <p className="text-[13px] text-muted mt-7 text-center">Remembered it? <Link href="/login" className="text-ink font-medium hover:underline">Sign in →</Link></p>
          </>}
        </div>
      </div>
      <div className="hidden lg:block w-[42%] relative bg-navy"><img src="https://images.pexels.com/photos/7587466/pexels-photo-7587466.jpeg?auto=compress&cs=tinysrgb&w=1200&h=900&dpr=1" alt="" className="absolute inset-0 w-full h-full object-cover opacity-70" /><div className="absolute inset-0 bg-[#111111]/55" /><div className="absolute bottom-12 left-12 right-12"><p className="text-white/95 text-[20px] font-medium leading-snug">&ldquo;Where exceptional talent meets exceptional opportunity.&rdquo;</p><p className="text-[#555555] text-[12px] mt-3">Wellness House Collective</p></div></div>
    </div>
  )
}
