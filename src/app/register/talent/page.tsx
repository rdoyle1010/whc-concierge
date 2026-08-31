'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'

const MIN_PASSWORD_LENGTH = 8
const MAX_PASSWORD_LENGTH = 64

const initialForm = {
  email: '',
  password: '',
  confirmPassword: '',
  full_name: '',
  phone: '',
  postcode: '',
  has_car: false,
}

export default function TalentRegisterPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState(initialForm)
  const [refCode, setRefCode] = useState('')

  useEffect(() => {
    const r = new URLSearchParams(window.location.search).get('ref')
    if (r) setRefCode(r.slice(0, 30))
  }, [])

  const update = (field: string, value: any) => {
    setError('')
    setForm(current => ({ ...current, [field]: value }))
  }

  const passwordError = () => {
    if (form.password.length < MIN_PASSWORD_LENGTH) return `Use at least ${MIN_PASSWORD_LENGTH} characters.`
    if (form.password.length > MAX_PASSWORD_LENGTH) return `Use no more than ${MAX_PASSWORD_LENGTH} characters.`
    if (form.password !== form.confirmPassword) return 'Passwords do not match.'
    return ''
  }

  const createAccount = async () => {
    setError('')
    if (!form.full_name.trim()) return setError('Please enter your full name.')
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) return setError('Please enter a valid email address.')
    const passwordMessage = passwordError()
    if (passwordMessage) return setError(passwordMessage)

    setLoading(true)
    try {
      const initResponse = await fetch('/api/register/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          password: form.password,
          role: 'talent',
          displayName: form.full_name,
          phone: form.phone,
          postcode: form.postcode,
          hasCar: form.has_car,
          refCode: refCode || undefined,
        }),
      })
      const init = await initResponse.json().catch(() => ({}))

      if (!initResponse.ok || !init.userId) {
        setError(init.error || 'We could not create your account. Please check your details and try again.')
        return
      }

      if (init.session?.access_token && init.session?.refresh_token) {
        const { error: sessionError } = await supabase.auth.setSession(init.session)
        if (sessionError) {
          setError('Your account was created, but sign-in could not be completed. Please use the login page.')
          return
        }
      }

      if (init.requiresEmailConfirmation) {
        router.push('/login?registered=1&confirm=1')
        return
      }

      router.push('/talent/profile?welcome=1')
    } catch {
      setError('We could not create your account. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="border-b border-border px-4 py-4 flex items-center justify-between max-w-3xl mx-auto">
        <Wordmark />
        <Link href="/login?role=talent" className="text-sm text-muted hover:text-ink">Already have an account?</Link>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-ink mb-2">Create your Talent account</h1>
        <p className="text-secondary mb-2">Get your account set up first. You will build your professional profile once you are inside.</p>
        <p className="text-sm text-muted mb-8">No duplicated forms. The information you add to your profile is saved directly to your Talent account.</p>

        {error && <div className="bg-red-50 text-red-600 text-sm px-4 py-3 mb-6">{error}</div>}

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5">Full Name *</label>
            <input type="text" value={form.full_name} onChange={(e) => update('full_name', e.target.value)} className="input-field" autoComplete="name" />
          </div>
          <div>
            <label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5">Email *</label>
            <input type="email" value={form.email} onChange={(e) => update('email', e.target.value)} className="input-field" autoComplete="email" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5">Password *</label>
              <input type="password" value={form.password} onChange={(e) => update('password', e.target.value)} className="input-field" maxLength={MAX_PASSWORD_LENGTH} autoComplete="new-password" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5">Confirm *</label>
              <input type="password" value={form.confirmPassword} onChange={(e) => update('confirmPassword', e.target.value)} className="input-field" maxLength={MAX_PASSWORD_LENGTH} autoComplete="new-password" />
            </div>
          </div>
          <div className="text-xs text-muted">Use {MIN_PASSWORD_LENGTH}-{MAX_PASSWORD_LENGTH} characters.</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5">Phone</label>
              <input type="tel" value={form.phone} onChange={(e) => update('phone', e.target.value)} className="input-field" autoComplete="tel" />
            </div>
            <div>
              <label className="block text-xs font-medium text-secondary uppercase tracking-wider mb-1.5">Postcode</label>
              <input type="text" value={form.postcode} onChange={(e) => update('postcode', e.target.value)} className="input-field" autoComplete="postal-code" />
            </div>
          </div>
          <label className="flex items-center space-x-3 cursor-pointer py-2">
            <input type="checkbox" checked={form.has_car} onChange={(e) => update('has_car', e.target.checked)} className="w-4 h-4 border-border text-accent focus:ring-accent rounded-sm" />
            <span className="text-sm text-secondary">I have access to a car</span>
          </label>
          <button type="button" onClick={createAccount} disabled={loading} className="btn-primary w-full disabled:opacity-40">
            {loading ? 'Creating account...' : 'Create account & build profile'}
          </button>
        </div>
      </div>
    </div>
  )
}
