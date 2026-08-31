'use client'

import { useEffect, useState } from 'react'
import type { AdPlacementKey } from '@/lib/advertising'

export default function SponsoredAd({ placement }: { placement: AdPlacementKey }) {
  const [advert, setAdvert] = useState<any>(null)
  useEffect(() => {
    fetch(`/api/advertising?placement=${encodeURIComponent(placement)}`)
      .then(response => response.ok ? response.json() : null)
      .then(json => setAdvert(json?.advert || null))
      .catch(() => {})
  }, [placement])
  if (!advert) return null
  return <aside className="mx-auto max-w-7xl px-6 py-5 lg:px-8" aria-label="Sponsored advert">
    <a href={`/api/advertising/click?id=${encodeURIComponent(advert.id)}`} target="_blank" rel="noopener sponsored" className="group flex flex-col items-center justify-between gap-4 border border-black/10 bg-white px-5 py-4 shadow-sm transition-shadow hover:shadow-md sm:flex-row">
      <div className="flex items-center gap-4 min-w-0">
        {advert.logo_url && <img src={advert.logo_url} alt={`${advert.brand_name} logo`} className="h-12 w-28 shrink-0 object-contain" />}
        <div className="min-w-0"><p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent">Sponsored</p><p className="text-[14px] font-medium text-ink">{advert.brand_name}</p><p className="text-[12px] text-secondary truncate">{advert.tagline}</p></div>
      </div>
      <span className="text-[11px] font-semibold uppercase tracking-wide text-accent group-hover:underline">Discover more</span>
    </a>
  </aside>
}
