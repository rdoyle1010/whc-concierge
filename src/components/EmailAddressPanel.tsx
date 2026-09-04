'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Mail, Check, AlertTriangle } from 'lucide-react'

// People change jobs, leave agencies and lose access to inboxes. Without this
// they lose the account with it: the sign-in address was fixed at registration
// and nothing on the platform could change it, so the only route back was to
// register again from scratch and abandon their profile, their applications
// and their Academy record.
//
// Two deliberate frictions. The current password is required, because a
// laptop left open on a signed-in session would otherwise be enough to move
// somebody's account to an address they do not control. And nothing changes
// until the link in the new inbox is clicked, which proves the person can
// actually receive mail there - a typo would otherwise lock them out for good.

export default function EmailAddressPanel() {
  const supabase = createClient()
  const [current, setCurrent] = useState('')
  const [pending, setPending] = useState('')
  const [next, setNext] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [sent, setSent] = useState('')

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setCurrent(data.user?.email || '')
      // Supabase holds the unconfirmed address here until the link is used.
      // Without showing it, a change already in flight is invisible and the
      // person starts again, wondering why nothing happened.
      setPending((data.user as any)?.new_email || '')
    })
  }, [supabase])

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError(''); setSent('')
    const address = next.trim().toLowerCase()
    if (!address || !address.includes('@')) { setError('Enter the new email address.'); return }
    if (address === current.toLowerCase()) { setError('That is already the address on this account.'); return }
    setBusy(true)

    // Re-authenticate first. Supabase will happily change the address on any
    // live session, which makes an unattended laptop enough to take over an
    // account - and the takeover is silent, because the confirmation goes to
    // the attacker's inbox.
    const { error: passwordError } = await supabase.auth.signInWithPassword({ email: current, password })
    if (passwordError) {
      setError('That password is not right. Enter the password you sign in with now.')
      setBusy(false)
      return
    }

    const { error: updateError } = await supabase.auth.updateUser({ email: address })
    if (updateError) {
      setError(updateError.message || 'That address could not be used.')
      setBusy(false)
      return
    }

    setPending(address)
    setSent(address)
    setNext('')
    setPassword('')
    setBusy(false)
  }

  return <div className="dashboard-card">
    <div className="mb-4 flex items-start gap-3">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#e7e7e7] text-[#1c1c1c]"><Mail size={18} /></div>
      <div>
        <h3 className="font-serif text-lg font-semibold">Your email address</h3>
        <p className="mt-1 text-sm text-gray-500">
          This is the address you sign in with and the one every message from us goes to. Change it here if you
          move jobs or lose access to an inbox.
        </p>
      </div>
    </div>

    <p className="rounded-xl bg-[#f1f1f1] px-4 py-3 text-[13px] text-ink">
      Signing in as <span className="font-semibold">{current || '...'}</span>
    </p>

    {pending && pending.toLowerCase() !== current.toLowerCase() && <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-4 py-3 text-[12.5px] leading-5 text-amber-800">
      <AlertTriangle size={14} className="mt-0.5 shrink-0" />
      <span>
        A change to <strong>{pending}</strong> is waiting. Open the link we sent to that inbox to finish it.
        Until you do, keep signing in with {current}.
      </span>
    </div>}

    {sent && <div className="mt-3 flex items-start gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-[12.5px] leading-5 text-emerald-800">
      <Check size={14} className="mt-0.5 shrink-0" />
      <span>Check {sent} and open the link in that email. Nothing changes until you do, so if the address was a typo, simply try again.</span>
    </div>}

    {error && <div className="mt-3 rounded-xl bg-red-50 px-4 py-3 text-[12.5px] leading-5 text-red-600">{error}</div>}

    <form onSubmit={submit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="new-email" className="block text-sm font-medium text-gray-700 mb-1.5">New email address</label>
        <input id="new-email" type="email" autoComplete="email" value={next} onChange={e => setNext(e.target.value)} className="input-field" />
      </div>
      <div>
        <label htmlFor="current-password-email" className="block text-sm font-medium text-gray-700 mb-1.5">Your current password</label>
        <input id="current-password-email" type="password" autoComplete="current-password" value={password} onChange={e => setPassword(e.target.value)} className="input-field" />
        <p className="mt-1 text-xs text-gray-400">Asked for so that nobody who finds your screen unlocked can move your account.</p>
      </div>
      <button type="submit" disabled={busy || !next.trim() || !password} className="btn-primary disabled:opacity-50">
        {busy ? 'Sending...' : 'Send confirmation to the new address'}
      </button>
    </form>
  </div>
}
