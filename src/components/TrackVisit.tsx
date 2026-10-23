'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef } from 'react'

// One beacon per page, so the platform knows how many people came rather than
// only how many signed up. Nothing is stored on the visitor's device and the
// beacon never blocks or delays the page: a failure here is silence, not an
// error.

export default function TrackVisit() {
  const pathname = usePathname()
  const last = useRef<string | null>(null)

  useEffect(() => {
    if (!pathname || last.current === pathname) return
    last.current = pathname
    try {
      const body = JSON.stringify({ path: pathname, referrer: document.referrer || '' })
      let sent = false
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          sent = navigator.sendBeacon('/api/track-visit', new Blob([body], { type: 'application/json' }))
        } catch {
          sent = false
        }
      }
      if (!sent) {
        fetch('/api/track-visit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => { /* silent by design */ })
      }
    } catch {
      // Silent: visit counting never surfaces anything to the visitor.
    }
  }, [pathname])

  return null
}
