'use client'

import { useEffect, useState } from 'react'
import { thoughtForDay, type Thought } from '@/lib/daily-thought'

// The line of the day, at the top of the workspace somebody opens first.
//
// Not a modal. A modal on sign-in is a thing to dismiss, and by the third
// morning it is a thing to dismiss without reading, which is worse than not
// having it. This sits above the fold on the dashboard, gets read once, and
// is scrolled past, which is the right amount of attention for a sentence.
//
// The takeaway is not decoration and it is not optional. A quotation on its
// own is a poster; what makes it worth the space is the line underneath
// saying what to do about it before Friday.
//
// Rendered after mount rather than on the server. The line changes at
// midnight London time, and a page cached at eleven would otherwise serve
// yesterday's for as long as the cache lived.

export default function DailyThought({ className = '' }: { className?: string }) {
  const [thought, setThought] = useState<Thought | null>(null)
  useEffect(() => { setThought(thoughtForDay()) }, [])

  // Held back rather than flashed in with a placeholder. Nothing here is worth
  // a layout shift at the top of the page.
  if (!thought) return null

  return (
    <div className={`border-l-2 border-[#1c1c1c] pl-5 ${className}`}>
      <p className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#8a8a8a]">Today</p>
      <p className="mt-1.5 font-serif text-[19px] leading-[1.45] text-[#1c1c1c] md:text-[22px]">
        {thought.text}
      </p>
      <p className="mt-2 text-[11px] uppercase tracking-[.12em] text-[#8a8a8a]">
        {thought.author || 'Talent House Collective'}
      </p>
      <p className="mt-3 max-w-2xl border-t border-[#e7e7e7] pt-3 text-[13px] leading-relaxed text-[#555555]">
        <span className="font-semibold text-[#1c1c1c]">What to do with it. </span>
        {thought.why}
      </p>
    </div>
  )
}
