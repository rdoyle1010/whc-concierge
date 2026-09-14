'use client'

import { useEffect, useState } from 'react'

// The price, always within reach of a thumb.
//
// This page is long on purpose: the depth is the product, and a spa director
// comparing it against a consultancy quote reads a lot of it. On a desktop
// that is fine, because the prices are a scroll wheel away. On a phone the
// same page is fifteen screens, and somebody three quarters of the way down
// who has decided has to scroll back up through six photographs of documents
// to find out what it costs.
//
// So once the hero is gone, a bar. It says the entry price, because the
// objection at this point is never "is it good", it is "is this a four
// figure decision I have to take to my GM".

export default function StandardsStickyBuy({ from }: { from: string }) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    // After the hero, and gone again at the footer so it never covers the
    // last thing on the page.
    const onScroll = () => {
      const past = window.scrollY > 700
      const atEnd = window.scrollY + window.innerHeight > document.body.scrollHeight - 400
      setShow(past && !atEnd)
    }
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <div
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-40 border-t border-[#dddddd] bg-white px-4 py-3
        transition-transform duration-200 sm:hidden
        ${show ? 'translate-y-0' : 'pointer-events-none translate-y-full'}`}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] leading-tight text-[#555555]">
          From <strong className="font-semibold text-[#1c1c1c]">{from}</strong> a document
        </p>
        <a href="#ways-to-buy"
          className="shrink-0 bg-[#1c1c1c] px-4 py-2.5 text-[13px] font-semibold text-white">
          See prices
        </a>
      </div>
    </div>
  )
}
