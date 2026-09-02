'use client'

import { createContext, useContext } from 'react'
import { DEFAULT_LOGO } from '@/lib/site-content'

// The published logo is resolved once on the server in layout.tsx and handed
// down here. Reading it from context rather than fetching it in the browser
// is what stops a custom logo flashing the bundled WHC artwork on first paint.

export type SiteLogo = { url: string; alt: string; fit: 'fill' | 'contain' }

const SiteLogoContext = createContext<SiteLogo>(DEFAULT_LOGO)

export function SiteBrandProvider({ logo, children }: { logo: SiteLogo; children: React.ReactNode }) {
  return <SiteLogoContext.Provider value={logo}>{children}</SiteLogoContext.Provider>
}

export function useSiteLogo(): SiteLogo {
  return useContext(SiteLogoContext)
}
