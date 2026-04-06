'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

export default function CookieConsent() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('whc-cookie-consent')
    if (!consent) setVisible(true)
  }, [])

  const respond = (choice: 'accepted' | 'declined') => {
    localStorage.setItem('whc-cookie-consent', choice)
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] animate-slide-up" style={{ pointerEvents: 'auto' }}>
      <div className="bg-white border-t border-border shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] text-secondary leading-relaxed text-center sm:text-left">
            We use cookies to improve your experience. By continuing to use this site, you consent to our use of cookies.{' '}
            <Link href="/privacy" className="underline text-ink hover:text-accent transition-colors">Privacy Policy</Link>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button type="button" onClick={() => respond('declined')}
              className="px-4 py-1.5 text-[12px] font-medium text-muted border border-border rounded-lg hover:border-ink/20 hover:text-ink transition-colors">
              Decline
            </button>
            <button type="button" onClick={() => respond('accepted')}
              className="px-4 py-1.5 text-[12px] font-semibold rounded-lg transition-all hover:shadow-lg hover:shadow-[#C9A96E]/20"
              style={{ background: 'linear-gradient(135deg, #C9A96E, #E8D5A8)', color: '#1a1a1a' }}>
              Accept
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
