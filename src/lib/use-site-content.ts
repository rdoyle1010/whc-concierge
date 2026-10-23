'use client'

import { useEffect, useState } from 'react'
import { DEFAULT_WEBSITE_CONTENT } from '@/lib/site-content-values'
import type { WebsiteContent } from '@/lib/site-content'

// Published navigation/footer/brand for client components on pages that do
// not fetch website content server-side. Cached per page load so the Navbar
// and Footer share one request.

export type PublicSiteContent = Pick<WebsiteContent, 'navigation' | 'footer' | 'brand' | 'panels'>

let cached: PublicSiteContent | null = null
let inflight: Promise<PublicSiteContent | null> | null = null

export function usePublicSiteContent(provided?: WebsiteContent): PublicSiteContent {
  const [content, setContent] = useState<PublicSiteContent>(provided || cached || DEFAULT_WEBSITE_CONTENT)
  useEffect(() => {
    if (provided) return
    if (cached) { setContent(cached); return }
    if (!inflight) {
      inflight = fetch('/api/public/site-content')
        .then(response => response.ok ? response.json() : null)
        .catch(() => null)
    }
    let active = true
    inflight.then(data => {
      if (active && data?.navigation && data?.footer) { cached = data; setContent(data) }
    })
    return () => { active = false }
  }, [provided])
  return content
}
