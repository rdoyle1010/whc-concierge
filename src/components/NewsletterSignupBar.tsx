'use client'

import { FormEvent, useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Mail, X } from 'lucide-react'

const HIDE_PREFIXES = ['/admin', '/talent', '/employer', '/login', '/register']
const STORAGE_KEY = 'whc-newsletter-dismissed-until'

type Config = {
  enabled: boolean
  heading: string
  text: string
  button: string
  delaySeconds: number
  frequencyDays: number
}

export default function NewsletterSignupBar() {
  const pathname = usePathname()
  const [config, setConfig] = useState<Config | null>(null)
  const [visible, setVisible] = useState(false)
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    const status = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('newsletter') : null
    if (status === 'confirmed') {
      setMessage('You’re subscribed. Welcome to the WHC newsletter.')
      setSuccess(true)
      setVisible(true)
      localStorage.setItem(STORAGE_KEY, String(Date.now() + 365 * 86400000))
      return
    }
    if (status === 'unsubscribed') {
      setMessage('You have been unsubscribed from the WHC newsletter.')
      setSuccess(true)
      setVisible(true)
      return
    }
    if (HIDE_PREFIXES.some(prefix => pathname.startsWith(prefix))) return

    let active = true
    let timer: number | undefined
    let poll: number | undefined

    // Never two interruptions at once. The cookie banner is a legal
    // requirement and owns the bottom of the screen until it is answered;
    // the newsletter invitation waits its turn, then starts its own delay.
    const cookieAnswered = () => {
      try { return Boolean(localStorage.getItem('whc-cookie-consent')) } catch { return true }
    }

    fetch('/api/newsletter/config')
      .then(res => res.ok ? res.json() : null)
      .then((data: Config | null) => {
        if (!active || !data?.enabled) return
        setConfig(data)
        const dismissedUntil = Number(localStorage.getItem(STORAGE_KEY) || 0)
        if (dismissedUntil > Date.now()) return

        const start = () => {
          timer = window.setTimeout(() => { if (active) setVisible(true) }, Math.max(0, data.delaySeconds) * 1000)
        }
        if (cookieAnswered()) { start(); return }
        poll = window.setInterval(() => {
          if (!active) return
          if (cookieAnswered()) { window.clearInterval(poll); poll = undefined; start() }
        }, 500)
      })
      .catch(() => {})
    return () => {
      active = false
      if (timer) window.clearTimeout(timer)
      if (poll) window.clearInterval(poll)
    }
  }, [pathname])

  const dismiss = () => {
    const days = config?.frequencyDays || 14
    localStorage.setItem(STORAGE_KEY, String(Date.now() + days * 86400000))
    setVisible(false)
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setMessage('')
    setBusy(true)
    const res = await fetch('/api/newsletter/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, company }),
    })
    const body = await res.json().catch(() => ({}))
    setBusy(false)
    if (!res.ok) {
      setMessage(body.error || 'Please try again.')
      return
    }
    setSuccess(true)
    setMessage('Check your inbox and click the confirmation link. You are not subscribed until you confirm.')
    localStorage.setItem(STORAGE_KEY, String(Date.now() + 365 * 86400000))
  }

  if (!visible) return null

  return <aside className="fixed inset-x-3 bottom-3 z-[70] mx-auto max-w-5xl rounded-2xl border border-[#dddddd] bg-white shadow-[0_18px_55px_rgba(28,28,28,.18)] md:inset-x-6" aria-label="Newsletter signup">
    <div className="relative grid gap-5 px-5 py-5 md:grid-cols-[1fr_auto] md:items-center md:px-7">
      <button type="button" onClick={dismiss} aria-label="Close newsletter signup" className="absolute right-3 top-3 rounded-full p-2 text-[#6b6b6b] hover:bg-[#f1f1f1] hover:text-[#1c1c1c]"><X size={16}/></button>
      <div className="min-w-0 pr-8 md:pr-0">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[.16em] text-[#555555]"><Mail size={14}/>WHC Newsletter</div>
        <h2 className="mt-2 text-[22px] leading-tight text-[#1c1c1c] md:text-[26px]">{config?.heading || 'The best of wellness, in your inbox.'}</h2>
        <p className="mt-1.5 max-w-2xl text-[12px] leading-5 text-[#555555]">{config?.text || 'Jobs, industry insight, Academy updates and opportunities from Talent House Collective.'}</p>
        <p className="mt-2 text-[10px] leading-4 text-[#6b6b6b]">Double opt-in: we email you once to confirm. You can unsubscribe at any time. See our <a href="/privacy" className="underline">Privacy Policy</a>.</p>
      </div>

      {success ? <div className="max-w-sm rounded-xl bg-[#eef4f1] px-4 py-3 text-[12px] leading-5 text-[#355d49]" aria-live="polite">{message}</div> : <form onSubmit={submit} className="flex min-w-0 flex-col gap-2 sm:flex-row md:w-[420px]">
        <label className="sr-only" htmlFor="whc-newsletter-email">Email address</label>
        <input id="whc-newsletter-email" type="email" required autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Your email address" className="min-h-11 min-w-0 flex-1 rounded-lg border border-[#dddddd] bg-white px-3.5 text-[16px] text-[#1c1c1c] outline-none focus:border-[#1c1c1c] sm:text-[13px]" />
        <input type="text" tabIndex={-1} autoComplete="off" value={company} onChange={e => setCompany(e.target.value)} className="hidden" aria-hidden="true" />
        <button type="submit" disabled={busy} className="min-h-11 rounded-lg bg-[#1c1c1c] px-5 text-[12px] font-semibold text-white hover:bg-[#333333] disabled:opacity-50">{busy ? 'Sending…' : (config?.button || 'Join the newsletter')}</button>
        {message && <p className="text-[11px] text-red-600 sm:absolute sm:mt-12" aria-live="polite">{message}</p>}
      </form>}
    </div>
  </aside>
}
