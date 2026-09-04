'use client'

import { useEffect, useRef } from 'react'

// Fires a single view-tracking beacon on mount and renders nothing. The
// beacon is best-effort by design: a failed or blocked request must never
// affect the page that mounted it.

export default function TrackView({ kind, id }: { kind: 'job' | 'candidate'; id: string }) {
  const fired = useRef(false)

  useEffect(() => {
    if (fired.current || !id) return
    fired.current = true
    try {
      const body = JSON.stringify({ kind, id })
      let sent = false
      if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
        try {
          sent = navigator.sendBeacon('/api/track-view', new Blob([body], { type: 'application/json' }))
        } catch {
          sent = false
        }
      }
      if (!sent) {
        fetch('/api/track-view', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => { /* silent by design */ })
      }
    } catch {
      // Silent: view tracking never surfaces an error to the viewer.
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}
