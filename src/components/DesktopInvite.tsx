'use client'

import { useEffect, useState } from 'react'
import { Laptop, X } from 'lucide-react'

// The quiet word on a phone.
//
// Most people find us on a phone, and the site works perfectly well on one.
// But a profile is photographs, qualifications and a few paragraphs, and that
// is a laptop job: the ones built on a desktop come out better and get further
// through. So this says so once, warmly, and gets out of the way. It is a
// suggestion, not a wall - "carry on here" is a real button and nothing is
// withheld from anybody who taps it.
//
// Shown once per device. Held back until the cookie banner has been answered,
// because two things at the foot of the screen at once is a mess.

const SEEN_KEY = 'thc-desktop-invite'
const CONSENT_KEY = 'whc-cookie-consent'

function isSmallScreen() {
  if (typeof window === 'undefined') return false
  return window.matchMedia('(max-width: 820px)').matches
}

export default function DesktopInvite() {
  const [visible, setVisible] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!isSmallScreen()) return
    let seen: string | null = null
    let consent: string | null = null
    try {
      seen = localStorage.getItem(SEEN_KEY)
      consent = localStorage.getItem(CONSENT_KEY)
    } catch {
      // A browser with storage blocked simply does not get the notice, which
      // is better than getting it on every page.
      return
    }
    if (seen || !consent) return
    const timer = setTimeout(() => setVisible(true), 2500)
    return () => clearTimeout(timer)
  }, [])

  const dismiss = () => {
    try { localStorage.setItem(SEEN_KEY, 'seen') } catch { /* nothing to do */ }
    setVisible(false)
  }

  const copy = async () => {
    const link = 'https://talenthousecollective.co.uk'
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(dismiss, 1400)
    } catch {
      // No clipboard permission: show the address so it can be typed, rather
      // than a button that appears to do nothing.
      setCopied(true)
    }
  }

  if (!visible) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] p-3 print:hidden animate-slide-up">
      <div className="mx-auto max-w-md border border-[#1c1c1c] bg-white shadow-xl">
        <div className="flex items-start gap-3 p-4">
          <span className="mt-0.5 shrink-0 text-[#1c1c1c]"><Laptop size={20} /></span>
          <div className="flex-1">
            <p className="text-[15px] font-semibold text-ink">A tip before you start</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-secondary">
              Our app is on its way. Everything here works on a phone in the meantime, but profiles
              built on a laptop come out better, and it only takes about ten minutes. Open the site
              on a computer when you have a moment.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" onClick={copy}
                className="border border-[#1c1c1c] bg-[#1c1c1c] px-3.5 py-2 text-[12px] font-semibold text-white">
                {copied ? 'Link copied' : 'Copy the link for later'}
              </button>
              <button type="button" onClick={dismiss}
                className="border border-border px-3.5 py-2 text-[12px] font-medium text-secondary">
                Carry on here
              </button>
            </div>
            {copied && (
              <p className="mt-2 text-[11px] text-muted">talenthousecollective.co.uk</p>
            )}
          </div>
          <button type="button" onClick={dismiss} aria-label="Close" className="shrink-0 text-muted hover:text-ink">
            <X size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
