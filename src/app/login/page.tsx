'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white" />}>
      <LoginForm />
    </Suspense>
  )
}

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const supabase = createClient()
  const initialRole = searchParams.get('role') || 'talent'

  const [role, setRole] = useState<'talent' | 'employer'>(initialRole as any)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError) { setError(authError.message); setLoading(false); return }

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Login failed'); setLoading(false); return }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role === 'admin') { router.push('/admin/dashboard'); return }
    if (profile?.role === 'employer') { router.push('/employer/dashboard'); return }
    if (profile?.role === 'candidate' || profile?.role === 'talent') {
      const { data: candidate } = await supabase.from('candidate_profiles').select('id').eq('user_id', user.id).single()
      if (candidate) { router.push('/talent/dashboard'); return }
      router.push('/register/talent'); return
    }
    if (user.user_metadata?.role === 'admin') { router.push('/admin/dashboard'); return }
    const { data: candidate } = await supabase.from('candidate_profiles').select('id').eq('user_id', user.id).single()
    if (candidate) { router.push('/talent/dashboard'); return }
    const { data: employer } = await supabase.from('employer_profiles').select('id').eq('user_id', user.id).single()
    if (employer) { router.push('/employer/dashboard'); return }
    router.push(`/register/${role}`)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* Left — form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <Link href="/" className="text-black font-semibold text-lg tracking-tight">WHC Concierge</Link>

          <h1 className="text-3xl font-bold text-black mt-10 mb-2">Welcome back</h1>
          <p className="text-neutral-400 text-sm mb-8">Sign in to your account</p>

          {/* Tabs */}
          <div className="flex border border-neutral-200 mb-8">
            <button onClick={() => setRole('talent')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${role === 'talent' ? 'bg-black text-white' : 'text-neutral-400 hover:text-black'}`}>
              Talent
            </button>
            <button onClick={() => setRole('employer')}
              className={`flex-1 py-2.5 text-sm font-medium transition-colors ${role === 'employer' ? 'bg-black text-white' : 'text-neutral-400 hover:text-black'}`}>
              Hotel / Employer
            </button>
          </div>

          {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6">{error}</div>}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field" placeholder="your@email.com" />
            </div>
            <div>
              <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Password</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={password} onChange={(e) => setPassword(e.target.value)} className="input-field pr-12" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-300 hover:text-neutral-500">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-neutral-400 hover:text-black transition-colors">Forgot password?</Link>
            </div>
            <button type="submit" disabled={loading} className="btn-primary w-full disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-sm text-neutral-400 mt-8">
            Don&apos;t have an account? <Link href={`/register/${role}`} className="text-black font-medium hover:underline">Create one</Link>
          </p>
        </div>
      </div>

      {/* Right — image */}
      <div className="hidden lg:block w-1/2 relative">
        <img src="https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1200&q=80&auto=format&fit=crop" alt="Luxury spa" className="absolute inset-0 w-full h-full object-cover" />
      </div>
    </div>
  )
}
