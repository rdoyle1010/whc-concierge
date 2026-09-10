'use client'

import { useState } from 'react'
import { Check, Ticket } from 'lucide-react'

// Where somebody spends the code an ambassador gave them.
//
// Deliberately quiet and deliberately present. A code that only works on a
// page nobody finds is a code nobody redeems, and the whole value of the
// scheme is in the redemptions: they are what tells us which relationships
// are real. So it sits on the dashboard, not behind a menu.
export default function AmbassadorCodeBox({ audience }: { audience: 'talent' | 'employer' }) {
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState('')

  async function redeem() {
    const value = code.trim()
    if (!value) return
    setBusy(true); setError(''); setDone('')
    try {
      const res = await fetch('/api/ambassador/redeem', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: value }),
      })
      const body = await res.json().catch(() => ({}))
      if (!res.ok) { setError(body.error || 'That code could not be used.'); return }
      setDone(body.message || 'Your code has been applied.')
      setCode('')
    } catch {
      setError('That code could not be used just now. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  if (done) {
    return (
      <div className="dashboard-card">
        <p className="flex items-center gap-2 text-[13px] font-semibold text-ink"><Check size={15} className="text-green-700" /> Code applied</p>
        <p className="mt-1.5 text-[13px] leading-6 text-secondary">{done}</p>
        <a href={audience === 'talent' ? '/talent/academy' : '/employer/post-role'} className="btn-secondary mt-4 inline-flex text-[12px]">
          {audience === 'talent' ? 'Open my Academy' : 'Post a role'}
        </a>
      </div>
    )
  }

  return (
    <div className="dashboard-card">
      <p className="flex items-center gap-2 text-[13px] font-semibold text-ink"><Ticket size={15} /> Have a code?</p>
      <p className="mt-1.5 text-[13px] leading-6 text-secondary">
        {audience === 'talent'
          ? 'Ambassador codes unlock Academy courses. Enter yours and it lands in your Academy straight away.'
          : 'Ambassador codes unlock free job listings. Enter yours and the credit is on your account straight away.'}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        <label className="sr-only" htmlFor="ambassador-code">Ambassador code</label>
        <input
          id="ambassador-code"
          value={code}
          onChange={event => { setError(''); setCode(event.target.value.toUpperCase()) }}
          onKeyDown={event => { if (event.key === 'Enter') redeem() }}
          placeholder="CAROLJOY-4KPT"
          className="input-field font-mono uppercase"
          maxLength={40}
        />
        <button type="button" onClick={redeem} disabled={busy || !code.trim()} className="btn-primary shrink-0 text-[13px] disabled:opacity-40">
          {busy ? 'Checking...' : 'Apply code'}
        </button>
      </div>
      {error ? <p role="alert" className="mt-2 text-[12px] text-red-700">{error}</p> : null}
    </div>
  )
}
