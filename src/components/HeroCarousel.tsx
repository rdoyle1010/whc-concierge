'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

/* ── Hardcoded fallbacks (used until DB is populated) ── */
const DEFAULT_SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1720678418766-2628e52f4634?w=1920&q=80&auto=format&fit=crop',
    heading: 'Where Luxury Wellness Meets\nExceptional Talent',
    text: 'The UK\u2019s premier platform connecting elite spa and wellness professionals with prestigious employers.',
    cta: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1770625468069-9393585d7113?w=1920&q=80&auto=format&fit=crop',
    heading: 'Precision Matching, Not Guesswork',
    text: 'Our 15-category algorithm matches therapists to roles based on skills, qualifications, brands, location, and availability.',
  },
  {
    image: 'https://plus.unsplash.com/premium_photo-1723514505301-682c69fc8edd?w=1920&q=80&auto=format&fit=crop',
    heading: 'Every Profile, Personally Vetted',
    text: 'Only qualified wellness professionals make it onto the platform. CIDESCO, CIBTAC, VTCT — we verify credentials so you don\'t have to.',
  },
  {
    image: 'https://images.unsplash.com/photo-1774175927603-129481b459c6?w=1920&q=80&auto=format&fit=crop',
    heading: 'Access the UK\'s Finest Properties',
    text: 'From five-star London hotels to country estate spas — exclusive roles at properties that set the standard.',
  },
  {
    image: 'https://images.unsplash.com/photo-1566520528415-5dba36001e10?w=1920&q=80&auto=format&fit=crop',
    heading: 'The Only Platform Built for Luxury Wellness',
    text: 'Generic job boards don\'t understand our industry. WHC Concierge speaks the language of spa, wellness, and five-star hospitality.',
  },
]

type Slide = { image: string; heading: string; text: string; cta?: boolean }

export default function HeroCarousel() {
  const [slides, setSlides] = useState<Slide[]>(DEFAULT_SLIDES)
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  /* ── Fetch slides from Supabase on mount ── */
  useEffect(() => {
    async function fetchSlides() {
      try {
        const supabase = createClient()
        const { data } = await supabase
          .from('site_images')
          .select('slot, image_url, heading, subtext, sort_order')
          .like('slot', 'hero_%')
          .eq('active', true)
          .order('sort_order', { ascending: true })

        if (data && data.length > 0) {
          setSlides(
            data.map((row, i) => ({
              image: row.image_url,
              heading: row.heading || DEFAULT_SLIDES[i]?.heading || '',
              text: row.subtext || DEFAULT_SLIDES[i]?.text || '',
              cta: i === 0,
            }))
          )
        }
      } catch {
        // Table doesn't exist yet — keep defaults
      }
    }
    fetchSlides()
  }, [])

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % slides.length)
  }, [slides.length])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [paused, next])

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-black"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {slides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0, pointerEvents: i === current ? 'auto' : 'none' }}
        >
          <img
            src={slide.image}
            alt={slide.heading}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/20 to-black/70" />
        </div>
      ))}

      {/* Text content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10">
        <div className="max-w-3xl text-center">
          <div className="w-10 h-[1px] mx-auto mb-8" style={{ backgroundColor: '#C9A96E' }} />
          <p className="text-[11px] tracking-[0.2em] uppercase font-medium mb-5" style={{ color: '#C9A96E' }}>
            {slides[current]?.cta ? 'WHC Concierge' : 'Why WHC Concierge'}
          </p>
          <h2
            className="text-[32px] md:text-[44px] lg:text-[56px] font-medium leading-[1.08] tracking-tight mb-6 whitespace-pre-line"
            style={{ color: '#FFFFFF', textShadow: '0 2px 16px rgba(0,0,0,0.5)' }}
            key={`h-${current}`}
          >
            {slides[current]?.heading}
          </h2>
          <p
            className="text-[16px] md:text-[18px] leading-[1.7] max-w-2xl mx-auto mb-10"
            style={{ color: 'rgba(255,255,255,0.95)', textShadow: '0 1px 8px rgba(0,0,0,0.5)' }}
            key={`p-${current}`}
          >
            {slides[current]?.text}
          </p>
          {slides[current]?.cta && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register/employer"
                className="px-8 py-3.5 rounded-lg text-[14px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#C9A96E]/25"
                style={{ backgroundColor: '#C9A96E' }}
              >
                Post a Role
              </Link>
              <Link href="/register/professional"
                className="px-8 py-3.5 rounded-lg text-[14px] font-semibold text-white bg-black/50 backdrop-blur-sm border border-white/20 transition-all hover:bg-black/70"
              >
                Join as Professional <ArrowRight size={16} className="inline ml-2" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {slides.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className="transition-all duration-300"
            style={{
              width: i === current ? '32px' : '8px',
              height: '8px',
              backgroundColor: i === current ? '#C9A96E' : 'rgba(255,255,255,0.4)',
              borderRadius: '4px',
              border: 'none',
              cursor: 'pointer',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </div>
  )
}
