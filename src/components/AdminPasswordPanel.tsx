'use client'

import { useState } from 'react'
import { KeyRound, Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { createClient as createIsolatedClient } from '@supabase/supabase-js'

// Change your own password, without leaving the admin area.
//
// There was nowhere for an administrator to do this. The only password forms
// on the platform live on the talent and employer settings pages, and an admin
// can reach both, so the answer to "where do I change my password" was "go to
// the candidate settings page and ignore Stealth Mode, Job Alerts and the
// agency toggles, none of which apply to you". For a founder that is a
// curiosity. For the business partner she has just brought in, it is the
// platform looking unfinished on her first afternoon.
//
// The current password is verified on a throwaway client that persists
// nothing. Signing in on the shared browser client would replace the live
// session with a fresh one at assurance level one, and this administrator has
// just cleared level two - so verifying her identity would have quietly
// downgraded it and bounced her to the authenticator challenge as a reward for
// being careful. The talent and employer forms both still do that.

export default function AdminPasswordPanel() {
  const supabase = createClient()
  const [current, setCurrent] = useState('')
  const [next, setNext] = useState('')
  const [confirm, setConfirm] = useState('')
  const [show, setShow] = useState(false)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'bad'; text: string } | null>(null)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setMessage(null)
    if (next.length < 12) return setMessage({ tone: 'bad', text: 'An administrator password must be at least 12 characters.' })
    if (next !== confirm) return setMessage({ tone: 'bad', text: 'The new passwords do not match.' })
    if (next === current) return setMessage({ tone: 'bad', text: 'The new password must be different from the current one.' })

    setBusy(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user?.email) {
        setMessage({ tone: 'bad', text: 'Your session has expired. Please sign in again.' })
        return
      }

      const url = process.env.NEXT_PUBLIC_SUPABASE_URL
      const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      if (url && key) {
        const isolated = createIsolatedClient(url, key, {
          auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
        })
        const { error } = await isolated.auth.signInWithPassword({ email: user.email, password: current })
        if (error) {
          setMessage({ tone: 'bad', text: 'That is not your current password.' })
          return
        }
        await isolated.auth.signOut().catch(() => {})
      }

      const { error } = await supabase.auth.updateUser({ password: next })
      if (error) {
        setMessage({ tone: 'bad', text: error.message })
        return
      }

      setCurrent(''); setNext(''); setConfirm('')
      setMessage({ tone: 'ok', text: 'Password changed. Your authenticator is unaffected and you stay signed in here.' })
    } catch {
      setMessage({ tone: 'bad', text: 'Could not change your password. Please try again.' })
    } finally {
      setBusy(false)
    }
  }

  const field = 'input-field'

  return <div className="dashboard-card">
    <div className="flex items-center gap-2.5">
      <KeyRound size={17} className="text-[#1c1c1c]" />
      <div>
        <p className="text-[14px] font-semibold text-ink">Your password</p>
        <p className="text-[12px] text-secondary">Change the password you use to sign in at /admin.</p>
      </div>
    </div>

    {message && <div role={message.tone === 'bad' ? 'alert' : undefined}
      className={`mt-4 px-4 py-3 text-[13px] rounded-xl ${message.tone === 'bad' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-700'}`}>
      {message.text}
    </div>}

    <form onSubmit={submit} className="mt-5 grid gap-3 sm:max-w-md">
      <div>
        <label htmlFor="admin-current-password" className="dashboard-eyebrow block mb-1.5 !text-[9px]">Current password</label>
        <input id="admin-current-password" type={show ? 'text' : 'password'} autoComplete="current-password"
          value={current} onChange={e => setCurrent(e.target.value)} className={field} required />
      </div>
      <div>
        <label htmlFor="admin-new-password" className="dashboard-eyebrow block mb-1.5 !text-[9px]">New password</label>
        <div className="relative">
          <input id="admin-new-password" type={show ? 'text' : 'password'} autoComplete="new-password"
            value={next} onChange={e => setNext(e.target.value)} className={field} required />
          <button type="button" onClick={() => setShow(!show)} aria-label={show ? 'Hide passwords' : 'Show passwords'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary">{show ? <EyeOff size={15} /> : <Eye size={15} />}</button>
        </div>
        <p className="mt-1.5 text-[11px] text-secondary">At least 12 characters. This account can see every CV and payment on the platform, so it is worth a long one.</p>
      </div>
      <div>
        <label htmlFor="admin-confirm-password" className="dashboard-eyebrow block mb-1.5 !text-[9px]">Confirm new password</label>
        <input id="admin-confirm-password" type={show ? 'text' : 'password'} autoComplete="new-password"
          value={confirm} onChange={e => setConfirm(e.target.value)} className={field} required />
      </div>
      <button type="submit" disabled={busy || !current || !next || !confirm} className="btn-primary justify-self-start disabled:opacity-50">
        {busy ? 'Changing...' : 'Change password'}
      </button>
    </form>
  </div>
}
