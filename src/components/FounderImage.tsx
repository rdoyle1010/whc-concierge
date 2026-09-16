'use client'

import { useState } from 'react'

// The About page portrait.
//
// /images/founder-rebecca.jpg has never existed in this repository. The page
// requested it, the browser returned a 404, and this component swallowed it
// and drew a monogram - so the failure was invisible and the About page of a
// luxury brand has always shown a grey box with two letters in it.
//
// The fallback stays, because a missing photograph should not leave a broken
// image icon on the page. What changed is that it now says so in the console,
// so the next person to look knows the file is missing rather than assuming
// the monogram was the design.
export default function FounderImage() {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div
        className="w-full max-w-[380px] aspect-[4/5] flex items-center justify-center mx-auto bg-surface border border-border"
        aria-label="Founder portrait placeholder"
      >
        <span className="text-[64px] font-serif text-accent">RD</span>
      </div>
    )
  }

  return (
    <img
      src="/images/founder-rebecca.jpg"
      alt="Rebecca Doyle, founder of Talent House Collective"
      onError={() => { console.error('[about] founder portrait missing: /images/founder-rebecca.jpg'); setErrored(true) }}
      className="w-full max-w-[380px] mx-auto"
    />
  )
}
