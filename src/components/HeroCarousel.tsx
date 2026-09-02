'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { DEFAULT_WEBSITE_CONTENT } from '@/lib/site-content-values'
import type { WebsiteContent } from '@/lib/site-content'

export default function HeroCarousel({ siteContent }: { siteContent?: WebsiteContent }) {
  const content = siteContent || DEFAULT_WEBSITE_CONTENT
  const slides = content.hero.slides
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  useEffect(() => {
    if (current >= slides.length) setCurrent(0)
  }, [current, slides.length])

  const showSlide = useCallback((index: number) => {
    setCurrent(index)
  }, [])

  const next = useCallback(() => {
    setCurrent(value => (value + 1) % slides.length)
  }, [slides.length])

  // Keep the first hero stable during the critical loading window. The
  // carousel still rotates, but only after the page has had time to settle.
  useEffect(() => {
    if (paused || slides.length < 2) return
    const timer = window.setInterval(next, 12000)
    return () => window.clearInterval(timer)
  }, [paused, next, slides.length])

  // Preload only the next slide, well after the critical Lighthouse window.
  // This preserves a smooth later transition without pulling another large
  // source image into the initial page load.
  useEffect(() => {
    if (slides.length < 2) return
    const timer = window.setTimeout(() => {
      if (document.visibilityState !== 'visible') return
      const upcoming = slides[(current + 1) % slides.length]
      const image = new window.Image()
      image.decoding = 'async'
      image.src = upcoming.image.url
    }, 10000)
    return () => window.clearTimeout(timer)
  }, [current, slides])

  const slide = slides[current] || slides[0]

  return (
    <div className="relative w-full min-h-[620px] h-[calc(100vh-76px)] overflow-hidden bg-accent"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div key={current} className="absolute inset-0 animate-fade-in">
        <Image
          src={slide.image.url}
          alt={slide.image.alt}
          fill
          sizes="100vw"
          priority={current === 0}
          fetchPriority={current === 0 ? 'high' : 'auto'}
          quality={72}
          className="object-cover"
          style={{ objectPosition: slide.image.focalX + '% ' + slide.image.focalY + '%' }}
        />
        {/* Charcoal legibility gradient - the destination-page idiom. */}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(28,28,28,.92) 0%, rgba(28,28,28,.48) 50%, rgba(28,28,28,.16) 100%)' }} />
      </div>

      <div className="absolute inset-0 z-10 flex items-end">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8 pb-24 md:pb-28">
          <div className="max-w-4xl">
            <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-white/75">{slide.eyebrow}</p>
            <h1 className="site-heading !text-white text-[40px] md:text-[58px] lg:text-[68px] leading-[1.03] tracking-[-.04em] font-medium mb-6">{slide.heading}</h1>
            <p className="mb-9 max-w-2xl text-[15px] md:text-[17px] leading-[1.7] text-white/85">{slide.text}</p>
            <Link href={content.hero.primaryHref} className="site-button site-accent inline-block bg-white px-7 py-3.5 text-[13px] font-semibold">
              {content.hero.primaryLabel}
            </Link>
          </div>
        </div>
      </div>

      {slides.length > 1 && <div className="absolute bottom-8 left-6 lg:left-[calc((100vw-1280px)/2+2rem)] z-20 flex items-center gap-2">
        {slides.map((_, index) => <button key={index} type="button" onClick={() => showSlide(index)}
          className="h-[2px] transition-all duration-300" style={{ width: index === current ? 44 : 24, background: index === current ? '#ffffff' : 'rgba(255,255,255,.4)' }}
          aria-label={'Go to hero slide ' + (index + 1)} aria-current={index === current ? 'true' : undefined} />)}
      </div>}
    </div>
  )
}
