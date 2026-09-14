'use client'

import { useState, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { createClient } from '@/lib/supabase/client'
import { Loader2 } from 'lucide-react'

// Four fields, because they came here to buy a document.
//
// Requiring an account is right: a procedure bought once is referred to for
// years, and a library that lives in one email goes with the inbox when
// somebody changes job. Requiring the full property registration on the way
// to a thirty-nine pound purchase is not. A spa manager who wanted one
// procedure this afternoon does not want to declare their treatment rooms,
// their product houses and their team size first, and the ones who abandon
// that form do not come back to finish it.
//
// So this is the same account as any other property, created with the least
// it can be created with, and everything else is asked later by the part of
// the platform that needs it. They land on their documents, not on a
// dashboard full of recruitment they never asked for.

function Form() {
  const router = useRouter()
  const params = useSearchParams()
  const supabase = createClient()

  const requested = params.get('redirect') || ''
  const back = requested.startsWith('/') && !requested.startsWith('//') ? requested : '/standards'

  const [form, setForm] = useState({ property: '', name: '', email: '', password: '' })
  const [agreed, setAgreed] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const update = (field: string, value: string) => {
    setError('')
    setForm(current => ({ ...current, [field]: value }))
  }

  async function submit() {
    setError('')
    if (!form.property.trim()) { setError('Please enter your property or company name.'); return }
    if (!form.name.trim()) { setError('Please enter your name.'); return }
    if (!/^\S+@\S+\.\S+$/.test(form.email.trim())) { setError('Please enter a valid email address.'); return }
    if (form.password.length < 8) { setError('Please choose a password of at least eight characters.'); return }
    if (!agreed) { setError('Please accept the terms to continue.'); return }
    setBusy(true)

    const initResponse = await fetch('/api/register/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: form.email,
        password: form.password,
        role: 'employer',
        marketingOptIn: false,
        agreedTerms: true,
        displayName: form.property,
      }),
    })
    const init = await initResponse.json().catch(() => ({}))
    if (!initResponse.ok || !init.userId || !init.registrationProof) {
      setError(init.error || 'That account could not be created.')
      setBusy(false)
      return
    }

    if (init.session?.access_token && init.session?.refresh_token) {
      const { error: sessionError } = await supabase.auth.setSession(init.session)
      if (sessionError) {
        setError('Your account was created, but signing in did not complete. Use the login page.')
        setBusy(false)
        return
      }
    }

    // The server sanitiser treats every other column as optional, so this is
    // genuinely all of it. Nothing is invented to fill a field.
    const res = await fetch('/api/register/employer', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: init.userId,
        registrationProof: init.registrationProof,
        profileData: {
          user_id: init.userId,
          company_name: form.property,
          property_name: form.property,
          contact_name: form.name,
          contact_email: form.email,
          agreed_terms: true,
          approval_status: 'pending',
        },
      }),
    })
    if (!res.ok) {
      const result = await res.json().catch(() => null)
      setError(result?.error || 'Your account was created but its details did not save. Tell us and we will fix it.')
      setBusy(false)
      return
    }

    // Back to what they were buying. An account created to finish a purchase
    // that then drops somebody on a dashboard has not finished the purchase.
    router.push(init.requiresEmailConfirmation ? '/login?registered=1&confirm=1' : back)
  }

  return (
    <div className="max-w-md">
      <p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#6b6b6b]">Standards</p>
      <h1 className="mt-3 text-[32px] font-semibold leading-tight text-[#1c1c1c] md:text-[38px]">
        Create your account
      </h1>
      <p className="mt-4 text-[15px] leading-relaxed text-[#555555]">
        Four fields. Everything you buy is kept in your account, so it is still there next year when a new manager
        asks where the procedure is.
      </p>

      {error && (
        <p className="mt-6 border border-amber-200 bg-amber-50 px-4 py-3 text-[13px] text-amber-800">{error}</p>
      )}

      <div className="mt-7 space-y-4">
        {[
          { key: 'property', label: 'Property or company name', type: 'text', autoComplete: 'organization' },
          { key: 'name', label: 'Your name', type: 'text', autoComplete: 'name' },
          { key: 'email', label: 'Work email', type: 'email', autoComplete: 'email' },
          { key: 'password', label: 'Password', type: 'password', autoComplete: 'new-password' },
        ].map(field => (
          <div key={field.key}>
            <label htmlFor={`buyer-${field.key}`} className="block text-[12px] font-medium text-[#1c1c1c]">
              {field.label}
            </label>
            <input
              id={`buyer-${field.key}`}
              type={field.type}
              autoComplete={field.autoComplete}
              value={(form as any)[field.key]}
              onChange={event => update(field.key, event.target.value)}
              className="mt-1.5 w-full border border-[#dddddd] px-3 py-2.5 text-[14px] text-[#1c1c1c]"
            />
            {field.key === 'password' && (
              <p className="mt-1 text-[11px] text-[#8a8a8a]">At least eight characters.</p>
            )}
          </div>
        ))}

        <label className="flex items-start gap-2.5 pt-1 text-[13px] leading-relaxed text-[#555555]">
          <input type="checkbox" checked={agreed} onChange={event => setAgreed(event.target.checked)}
            className="mt-1 h-3.5 w-3.5 shrink-0" />
          <span>
            I accept the <Link href="/terms" className="underline">terms</Link> and the{' '}
            <Link href="/privacy" className="underline">privacy notice</Link>.
          </span>
        </label>

        <button type="button" onClick={submit} disabled={busy}
          className="inline-flex w-full items-center justify-center gap-2 border border-[#1c1c1c] bg-[#1c1c1c] px-5 py-3 text-[14px] font-semibold text-white disabled:opacity-50">
          {busy && <Loader2 size={15} className="animate-spin" />}
          {busy ? 'Creating your account...' : 'Create account and continue'}
        </button>
      </div>

      <p className="mt-6 text-[13px] text-[#6b6b6b]">
        Already have an account?{' '}
        <Link href={`/login?redirect=${encodeURIComponent(back)}`} className="underline">Sign in</Link>.
      </p>
      <p className="mt-4 text-[13px] leading-relaxed text-[#6b6b6b]">
        Hiring as well as buying documents? This is the same account. Fill in the rest of your property profile
        whenever you want to post a role, not now.
      </p>
    </div>
  )
}

export default function BuyerRegisterPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <main id="main-content" className="mx-auto max-w-5xl px-6 pb-24 pt-[120px] lg:px-8">
        <Suspense fallback={<p className="text-[14px] text-[#555555]">Loading...</p>}>
          <Form />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
