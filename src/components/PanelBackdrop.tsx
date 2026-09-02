'use client'

import { useEffect, useState } from 'react'
import type { AdPlacementKey } from '@/lib/advertising'

// The platform's large charcoal panels are the most valuable empty space on
// the site. This turns one into inventory without turning the page into a
// banner farm: the panel keeps its own copy and buttons, and the backdrop
// behind them is either a picture WHC controls or a sponsor's creative.
//
// The rule is deliberately blunt: a panel with a picture shows that picture.
// An earlier version gated it behind a separate on/off setting, so uploading
// a picture appeared to do nothing at all. The presence of the picture is the
// decision; removing it returns the panel to plain charcoal.
//
// The fallback order matters commercially. A panel sold to sponsors that has
// no live advert - between campaigns, or while one is awaiting approval -
// drops back to the house picture, then to plain charcoal. The space is never
// blank and never advertises a brand that has not paid.

type Panel = {
  mode: 'brand' | 'image' | 'advert'
  image: { url: string; alt: string; focalX: number; focalY: number }
  overlay: number
}

type Advert = {
  id: string
  brand_name: string
  tagline: string | null
  logo_url: string | null
  media_url: string | null
  media_type: 'logo' | 'image' | 'video'
  cta_label: string
}

export default function PanelBackdrop({ panel, placement }: { panel: Panel; placement: AdPlacementKey }) {
  const [advert, setAdvert] = useState<Advert | null>(null)

  useEffect(() => {
    if (panel.mode !== 'advert') return
    let active = true
    fetch(`/api/advertising?placement=${encodeURIComponent(placement)}`)
      .then(response => (response.ok ? response.json() : null))
      .then(json => {
        if (!active || !json) return
        const list: Advert[] = Array.isArray(json.adverts) ? json.adverts : json.advert ? [json.advert] : []
        // One sponsor holds a panel at a time: a backdrop that cycles behind
        // fixed copy reads as a glitch rather than a rotation.
        setAdvert(list[0] || null)
      })
      .catch(() => { })
    return () => { active = false }
  }, [panel.mode, placement])

  const creative = advert?.media_type === 'video' ? null : advert?.media_url || advert?.logo_url
  const backdrop = creative || panel.image.url
  if (!backdrop) return null

  const scrim = Math.min(100, Math.max(0, panel.overlay)) / 100

  return (
    <>
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {advert?.media_type === 'video' && advert.media_url ? (
          <video
            src={advert.media_url}
            poster={advert.logo_url || undefined}
            autoPlay
            muted
            loop
            playsInline
            className="h-full w-full object-cover"
          />
        ) : (
          <img
            src={backdrop}
            alt=""
            className="h-full w-full object-cover"
            style={{ objectPosition: `${panel.image.focalX}% ${panel.image.focalY}%` }}
          />
        )}
        <div className="absolute inset-0 bg-[#1c1c1c]" style={{ opacity: scrim }} />
      </div>

      {advert && (
        <a
          href={`/api/advertising/click?id=${encodeURIComponent(advert.id)}`}
          target="_blank"
          rel="noopener sponsored"
          className="absolute right-5 top-5 z-10 max-w-[240px] border border-white/25 bg-[#1c1c1c]/70 px-3.5 py-2.5 backdrop-blur-sm transition-colors hover:border-white/60"
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-white/70">Sponsored</p>
          <p className="mt-0.5 truncate text-[12px] font-medium text-white">{advert.brand_name}</p>
          {advert.tagline && <p className="truncate text-[11px] text-white/70">{advert.tagline}</p>}
          <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide text-white underline">
            {advert.cta_label}
          </span>
        </a>
      )}
    </>
  )
}
