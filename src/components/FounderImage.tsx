'use client'

import { useState } from 'react'

// The About page portrait.
//
// This used to point at /images/founder-rebecca.jpg, a file that has never
// existed in this repository. The browser returned a 404, the component
// swallowed it and drew a monogram, and so the About page of a luxury brand
// showed a grey box with two letters in it - invisibly, for months.
//
// Worse than the missing file: there was nowhere to put one. The path was
// hardcoded, so no admin screen offered an upload slot for it. The picture now
// comes from the About page's first content block, which means it appears in
// Pictures like every other photograph on the site.
//
// The monogram stays as the fallback. A brand with no portrait yet should look
// deliberate rather than broken, and a 404 should never leave a torn image icon
// on the page.
export default function FounderImage({
  url = '',
  alt = '',
  focalX = 50,
  focalY = 50,
}: {
  url?: string
  alt?: string
  focalX?: number
  focalY?: number
}) {
  const [errored, setErrored] = useState(false)

  if (!url || errored) {
    return (
      <div
        className="w-full max-w-[380px] aspect-[4/5] flex items-center justify-center mx-auto bg-surface border border-border"
        aria-label={alt || 'Founder portrait placeholder'}
      >
        <span className="text-[64px] font-serif text-accent">RD</span>
      </div>
    )
  }

  return (
    <img
      src={url}
      alt={alt || 'Founder portrait'}
      onError={() => { console.error('[about] founder portrait failed to load:', url); setErrored(true) }}
      className="w-full max-w-[380px] mx-auto aspect-[4/5] object-cover"
      style={{ objectPosition: `${focalX}% ${focalY}%` }}
    />
  )
}
