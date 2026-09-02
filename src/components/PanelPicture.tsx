'use client'

import { useEffect, useState } from 'react'
import type { AdPlacementKey } from '@/lib/advertising'

// PanelBackdrop's sibling. Same inventory, same fallback order, different
// shape: this one is a picture box that sits beside the copy rather than
// behind it, for the wide bands where the text only fills half the width and
// the other half is dead space.
//
// It renders nothing at all until a picture is uploaded or a sponsor's
// campaign goes live, so adding a slot to a page changes nothing on the live
// site until Rebecca puts something in it.

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

export default function PanelPicture({
  panel,
  placement,
  className = '',
  aspect = 'aspect-[4/3]',
  tone = 'dark',
}: {
  panel: Panel
  placement: AdPlacementKey
  className?: string
  aspect?: string
  /** Which surface the box sits on, so the sponsor label stays readable. */
  tone?: 'dark' | 'light'
}) {
  const [advert, setAdvert] = useState<Advert | null>(null)

  useEffect(() => {
    if (panel.mode !== 'advert') return
    let active = true
    fetch(`/api/advertising?placement=${encodeURIComponent(placement)}`)
      .then(response => (response.ok ? response.json() : null))
      .then(json => {
        if (!active || !json) return
        const list: Advert[] = Array.isArray(json.adverts) ? json.adverts : json.advert ? [json.advert] : []
        setAdvert(list[0] || null)
      })
      .catch(() => { })
    return () => { active = false }
  }, [panel.mode, placement])

  const creative = advert?.media_type === 'video' ? null : advert?.media_url || advert?.logo_url
  const picture = creative || panel.image.url
  if (!picture) return null

  const label = tone === 'dark'
    ? 'border-white/25 bg-[#1c1c1c]/70 text-white'
    : 'border-border bg-white/90 text-ink'

  return (
    <div className={`relative overflow-hidden ${aspect} ${className}`}>
      {advert?.media_type === 'video' && advert.media_url ? (
        <video
          src={advert.media_url}
          poster={advert.logo_url || undefined}
          autoPlay muted loop playsInline
          className="h-full w-full object-cover"
        />
      ) : (
        <img
          src={picture}
          alt={creative ? '' : panel.image.alt}
          className="h-full w-full object-cover"
          style={{ objectPosition: `${panel.image.focalX}% ${panel.image.focalY}%` }}
        />
      )}

      {advert && (
        <a
          href={`/api/advertising/click?id=${encodeURIComponent(advert.id)}`}
          target="_blank"
          rel="noopener sponsored"
          className={`absolute right-4 top-4 z-10 max-w-[220px] border px-3.5 py-2.5 backdrop-blur-sm transition-opacity hover:opacity-90 ${label}`}
        >
          <p className="text-[9px] font-semibold uppercase tracking-[0.18em] opacity-70">Sponsored</p>
          <p className="mt-0.5 truncate text-[12px] font-medium">{advert.brand_name}</p>
          {advert.tagline && <p className="truncate text-[11px] opacity-70">{advert.tagline}</p>}
          <span className="mt-1 inline-block text-[10px] font-semibold uppercase tracking-wide underline">
            {advert.cta_label}
          </span>
        </a>
      )}
    </div>
  )
}
