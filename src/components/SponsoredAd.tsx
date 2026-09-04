'use client'

import { useEffect, useRef, useState } from 'react'
import type { AdPlacementKey } from '@/lib/advertising'

// Advertising is how this platform makes money, so a slot has to behave like
// a slot: several brands can hold one, it cycles between them, and a brand
// can supply real creative - a still or a video - rather than a logo, a name
// and a line of text, which is a directory entry rather than an advert.
//
// The rotation is honest about what it counts. The server records one
// impression per advert it returns, so a brand is charged for being served,
// not for happening to be the frame on screen when someone looked.
type Advert = {
  id: string
  brand_name: string
  tagline: string | null
  logo_url: string | null
  media_url: string | null
  media_type: 'logo' | 'image' | 'video'
  cta_label: string
}

export default function SponsoredAd({ placement }: { placement: AdPlacementKey }) {
  const [adverts, setAdverts] = useState<Advert[]>([])
  const [rotateSeconds, setRotateSeconds] = useState(8)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const reducedMotion = useRef(false)

  useEffect(() => {
    reducedMotion.current = typeof window !== 'undefined'
      && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches === true

    let active = true
    fetch(`/api/advertising?placement=${encodeURIComponent(placement)}`)
      .then(response => response.ok ? response.json() : null)
      .then(json => {
        if (!active || !json) return
        const list: Advert[] = Array.isArray(json.adverts) ? json.adverts : (json.advert ? [json.advert] : [])
        setAdverts(list)
        if (typeof json.rotateSeconds === 'number') setRotateSeconds(json.rotateSeconds)
      })
      .catch(() => { })
    return () => { active = false }
  }, [placement])

  useEffect(() => {
    // One advert never rotates. Nor does it rotate while somebody is reading
    // it, or for a reader who has asked for reduced motion.
    if (adverts.length < 2 || paused || reducedMotion.current) return
    const timer = window.setInterval(() => {
      setIndex(current => (current + 1) % adverts.length)
    }, rotateSeconds * 1000)
    return () => window.clearInterval(timer)
  }, [adverts.length, paused, rotateSeconds])

  if (adverts.length === 0) return null
  const advert = adverts[Math.min(index, adverts.length - 1)]

  return (
    <aside
      className="mx-auto max-w-7xl px-6 py-5 lg:px-8"
      aria-label="Sponsored advert"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <a
        href={`/api/advertising/click?id=${encodeURIComponent(advert.id)}`}
        target="_blank"
        rel="noopener sponsored"
        className="group block border border-border bg-white transition-colors hover:border-accent"
      >
        {advert.media_type === 'video' && advert.media_url ? (
          <video
            key={advert.id}
            src={advert.media_url}
            poster={advert.logo_url || undefined}
            autoPlay
            muted
            loop
            playsInline
            aria-hidden="true"
            className="h-auto w-full object-cover"
          />
        ) : advert.media_type === 'image' && advert.media_url ? (
          <img decoding="async" src={advert.media_url} alt="" className="h-auto w-full object-cover" />
        ) : null}

        <div className="flex flex-col items-start justify-between gap-4 px-5 py-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 items-center gap-4">
            {advert.media_type === 'logo' && advert.logo_url && (
              <img decoding="async" src={advert.logo_url} alt={`${advert.brand_name} logo`} className="h-12 w-28 shrink-0 object-contain" />
            )}
            <div className="min-w-0">
              <p className="text-[9px] font-semibold uppercase tracking-[0.18em] text-accent">Sponsored</p>
              <p className="text-[14px] font-medium text-ink">{advert.brand_name}</p>
              {advert.tagline && <p className="truncate text-[12px] text-secondary">{advert.tagline}</p>}
            </div>
          </div>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-accent group-hover:underline">
            {advert.cta_label}
          </span>
        </div>
      </a>

      {adverts.length > 1 && (
        <div className="mt-2 flex items-center justify-end gap-1.5" role="group" aria-label="Choose a sponsor">
          {adverts.map((item, position) => (
            <button
              key={item.id}
              type="button"
              onClick={() => setIndex(position)}
              aria-label={`Show ${item.brand_name}`}
              aria-current={position === index}
              className={`h-1.5 w-6 transition-colors ${position === index ? 'bg-accent' : 'bg-border hover:bg-secondary'}`}
            />
          ))}
        </div>
      )}
    </aside>
  )
}
