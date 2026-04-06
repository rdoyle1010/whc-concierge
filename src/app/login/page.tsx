'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  return <Suspense fallback={<div className="min-h-screen bg-white" />}><LoginForm /></Suspense>
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const initialRole = searchParams.get('role') || 'talent'
  const [role, setRole] = useState<'talent' | 'employer'>(initialRole as any)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 1. Sign in
      const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
      if (authError) { setError(authError.message); setLoading(false); return }

      // 2. Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { setError('Login failed'); setLoading(false); return }

      // 3. Check role from profiles table (may not exist — that's OK)
      let userRole: string | null = null
      try {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
        userRole = profile?.role || null
      } catch {
        // profiles table may not exist or query may fail — continue
      }

      // Also check user_metadata
      const metaRole = user.user_metadata?.role

      // 4. Route — admin
      if (userRole === 'admin' || metaRole === 'admin') {
        router.push('/admin/dashboard')
        return
      }

      // 5. Route — talent: redirect immediately, never touch employer_profiles
      if (userRole === 'talent' || userRole === 'candidate' || metaRole === 'talent' || metaRole === 'candidate') {
        router.push('/talent/dashboard')
        return
      }

      // 6. Route — employer
      if (userRole === 'employer' || metaRole === 'employer') {
        router.push('/employer/dashboard')
        return
      }

      // 7. Role unknown — only check employer_profiles if user selected employer tab
      if (role === 'employer') {
        try {
          const { data: emp } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).single()
          if (emp) { router.push('/employer/dashboard'); return }
        } catch {
          // No employer profile found
        }
      }

      // 8. Default — talent dashboard
      router.push('/talent/dashboard')
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left: form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-[360px]">
          <Link href="/"><Image src="/images/whc-logo.jpg" alt="Wellness House Collective" width={140} height={46} className="object-contain mix-blend-multiply" /></Link>
          <h1 className="text-[28px] font-medium text-ink mt-10 mb-1 leading-tight">Welcome back</h1>
          <p className="text-[14px] text-muted mb-8">Sign in to your account</p>

          {/* Tabs — outside the form to prevent accidental submission */}
          <div className="flex bg-surface rounded-lg p-1 mb-7">
            <button type="button" onClick={() => setRole('talent')} className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-colors ${role === 'talent' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>Talent</button>
            <button type="button" onClick={() => setRole('employer')} className={`flex-1 py-2 rounded-md text-[13px] font-medium transition-colors ${role === 'employer' ? 'bg-white text-ink shadow-sm' : 'text-muted'}`}>Hotel / Employer</button>
          </div>

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
