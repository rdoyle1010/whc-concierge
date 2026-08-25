'use client'

import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { DEFAULT_WEBSITE_CONTENT, type WebsiteContent } from '@/lib/site-content'

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

  useEffect(() => {
    if (paused || slides.length < 2) return
    const timer = window.setInterval(next, 6500)
    return () => window.clearInterval(timer)
  }, [paused, next, slides.length])

  // Preload only the next slide, and only after the current page has settled.
  // This keeps the carousel smooth without downloading every hero image up front.
  useEffect(() => {
    if (slides.length < 2) return
    const timer = window.setTimeout(() => {
      if (document.visibilityState !== 'visible') return
      const upcoming = slides[(current + 1) % slides.length]
      const image = new window.Image()
      image.decoding = 'async'
      image.src = upcoming.image.url
    }, 4500)
    return () => window.clearTimeout(timer)
  }, [current, slides])

  const slide = slides[current] || slides[0]

  return (
    <div className="relative w-full min-h-[680px] h-[calc(100vh-60px)] overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div key={current} className="absolute inset-0 animate-fade-in">
        <Image
          src={slide.image.url}
          alt={slide.image.alt}
          fill
          sizes="100vw"
          priority={current === 0}
          fetchPriority={current === 0 ? 'high' : 'auto'}
          className="object-cover"
          style={{ objectPosition: slide.image.focalX + '% ' + slide.image.focalY + '%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/45 via-black/20 to-black/65" />
      </div>

      <div className="absolute inset-0 z-10 flex items-center">
        <div className="w-full max-w-7xl mx-auto px-6 lg:px-8">
          <div className="max-w-3xl text-white">
            <p className="text-[11px] tracking-[0.22em] uppercase font-medium mb-6 site-accent">{slide.eyebrow}</p>
            <h1 className="site-heading !text-white text-[44px] md:text-[64px] lg:text-[76px] font-medium leading-[0.98] mb-7"
              style={{ textShadow: '0 2px 18px rgba(0,0,0,.28)' }}>{slide.heading}</h1>
            <p className="text-[16px] md:text-[18px] leading-[1.7] max-w-2xl mb-10 text-white/90">{slide.text}</p>
            {current === 0 && <div className="flex flex-col sm:flex-row items-start gap-3">
              <Link href={content.hero.primaryHref} className="site-button site-accent-bg px-7 py-3.5 text-[13px] font-semibold text-white">
                {content.hero.primaryLabel}
              </Link>
              <Link href={content.hero.secondaryHref} className="site-button px-7 py-3.5 text-[13px] font-semibold text-black bg-white">
                {content.hero.secondaryLabel}<ArrowRight size={14} className="inline ml-2" />
              </Link>
            </div>}
          </div>
        </div>
      </div>

      {slides.length > 1 && <div className="absolute bottom-8 left-6 lg:left-[calc((100vw-1280px)/2+2rem)] z-20 flex items-center gap-2">
        {slides.map((_, index) => <button key={index} type="button" onClick={() => showSlide(index)}
          className="h-[2px] transition-all duration-300" style={{ width: index === current ? 44 : 24, background: index === current ? 'var(--site-accent)' : 'rgba(255,255,255,.45)' }}
          aria-label={'Go to hero slide ' + (index + 1)} aria-current={index === current ? 'true' : undefined} />)}
      </div>}
    </div>
  )
}
