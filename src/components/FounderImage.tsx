'use client'

import { useState } from 'react'

export default function FounderImage() {
  const [errored, setErrored] = useState(false)

  if (errored) {
    return (
      <div
        className="w-full max-w-[380px] aspect-[4/5] rounded-2xl flex items-center justify-center mx-auto"
        style={{
          background: 'linear-gradient(135deg, #F8F7F5, #E8E5E0)',
          boxShadow: '0 20px 60px -20px rgba(201, 169, 110, 0.35)',
        }}
        aria-label="Founder portrait placeholder"
      >
        <span className="text-[64px] font-serif" style={{ color: '#C9A96E' }}>RD</span>
      </div>
    )
  }

  return (
    <img
      src="/images/founder-rebecca.jpg"
      alt="Rebecca Doyle, founder of WHC Concierge"
      onError={() => setErrored(true)}
      className="w-full max-w-[380px] rounded-2xl mx-auto"
      style={{ boxShadow: '0 20px 60px -20px rgba(201, 169, 110, 0.35)' }}
    />
  )
}
