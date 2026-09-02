'use client'

import { useState } from 'react'

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
      onError={() => setErrored(true)}
      className="w-full max-w-[380px] mx-auto"
    />
  )
}
