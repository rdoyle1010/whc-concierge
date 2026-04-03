'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Sparkles } from 'lucide-react'

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-ink" />}>
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

    if (authError) {
      setError(authError.message)
      setLoading(false)
      return
    }

    // Check profile type and redirect accordingly
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { setError('Login failed'); setLoading(false); return }

    // 1. Check the profiles table for role (covers admin, employer, candidate)
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (profile?.role === 'admin') {
      router.push('/admin/dashboard')
      return
    }

    if (profile?.role === 'employer') {
      router.push('/employer/dashboard')
      return
    }

    if (profile?.role === 'candidate' || profile?.role === 'talent') {
      // Check if they have a candidate_profiles record (complete profile)
      const { data: candidate } = await supabase
        .from('candidate_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single()

      if (candidate) {
        router.push('/talent/dashboard')
        return
      }
      // Has a profiles role but no candidate_profiles row yet — send to register
      router.push('/register/talent')
      return
    }

    // 2. Fallback: check user_metadata.role (in case profiles table wasn't populated)
    if (user.user_metadata?.role === 'admin') {
      router.push('/admin/dashboard')
      return
    }

    // 3. Fallback: check candidate_profiles / employer_profiles directly
    const { data: candidate } = await supabase
      .from('candidate_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (candidate) {
      router.push('/talent/dashboard')
      return
    }

    const { data: employer } = await supabase
      .from('employer_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (employer) {
      router.push('/employer/dashboard')
      return
    }

    // No profile found anywhere — redirect to create one
    router.push(`/register/${role}`)
  }

  return (
    <div className="min-h-screen bg-ink flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full gold-gradient flex items-center justify-center">
              <span className="text-white font-serif font-bold text-xl">W</span>
            </div>
            <span className="text-white font-serif text-2xl font-semibold">WHC Concierge</span>
          </Link>
        </div>

        <div className="bg-white rounded-2xl p-8 shadow-xl">
          <h1 className="font-serif text-2xl font-bold text-ink text-center mb-2">Welcome Back</h1>
          <p className="text-gray-400 text-center text-sm mb-8">Sign in to your account</p>

          {/* Role Tabs */}
          <div className="flex bg-gray-100 rounded-lg p-1 mb-8">
            <button
              onClick={() => setRole('talent')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                role === 'talent' ? 'bg-white text-ink shadow-sm' : 'text-gray-500'
              }`}
            >
              Talent
            </button>
            <button
              onClick={() => setRole('employer')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-md transition-colors ${
                role === 'employer' ? 'bg-white text-ink shadow-sm' : 'text-gray-500'
              }`}
            >
              Hotel / Employer
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 text-sm px-4 py-3 rounded-lg mb-6">{error}</div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pr-12"
                  placeholder="Enter your password"
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

            <div className="flex items-center justify-between">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input type="checkbox" className="rounded border-gray-300 text-gold focus:ring-gold" />
                <span className="text-sm text-gray-500">Remember me</span>
              </label>
              <Link href="/forgot-password" className="text-sm text-gold hover:text-gold-dark">Forgot password?</Link>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-sm text-gray-500">
              Don&apos;t have an account?{' '}
              <Link href={`/register/${role}`} className="text-gold hover:text-gold-dark font-medium">
                Create one
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-8">
          &copy; {new Date().getFullYear()} Wellness House Collective
        </p>
      </div>
    </div>
  )
}
