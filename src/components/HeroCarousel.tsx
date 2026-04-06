'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=1920&q=80&auto=format&fit=crop',
    heading: 'Where Luxury Wellness Meets\nExceptional Talent',
    text: 'The UK\u2019s premier platform connecting elite spa and wellness professionals with prestigious employers.',
    cta: true,
  },
  {
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1920&q=80&auto=format&fit=crop',
    heading: 'Precision Matching, Not Guesswork',
    text: 'Our 15-category algorithm matches therapists to roles based on skills, qualifications, brands, location, and availability.',
  },
  {
    image: 'https://images.unsplash.com/photo-1596178065887-1198b6148b2b?w=1920&q=80&auto=format&fit=crop',
    heading: 'Every Profile, Personally Vetted',
    text: 'Only qualified wellness professionals make it onto the platform. CIDESCO, CIBTAC, VTCT \u2014 we verify credentials so you don\'t have to.',
  },
  {
    image: 'https://images.unsplash.com/photo-1560750588-73207b1ef5b8?w=1920&q=80&auto=format&fit=crop',
    heading: 'Access the UK\'s Finest Properties',
    text: 'From five-star London hotels to country estate spas \u2014 exclusive roles at properties that set the standard.',
  },
  {
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=80&auto=format&fit=crop',
    heading: 'The Only Platform Built for Luxury Wellness',
    text: 'Generic job boards don\'t understand our industry. WHC Concierge speaks the language of spa, wellness, and five-star hospitality.',
  },
]

export default function HeroCarousel() {
  const [current, setCurrent] = useState(0)
  const [paused, setPaused] = useState(false)

  const next = useCallback(() => {
    setCurrent(c => (c + 1) % SLIDES.length)
  }, [])

  useEffect(() => {
    if (paused) return
    const timer = setInterval(next, 6000)
    return () => clearInterval(timer)
  }, [paused, next])

  return (
    <section
      className="relative min-h-[85vh] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-1000 ease-in-out"
          style={{ opacity: i === current ? 1 : 0, zIndex: i === current ? 1 : 0 }}
        >
          <Image
            src={slide.image}
            alt={slide.heading}
            fill
            className="object-cover"
            sizes="100vw"
            priority={i === 0}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/70 via-white/50 to-white/70" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[85vh] px-6 lg:px-8">
        <div className="max-w-3xl text-center">
          <div className="w-10 h-[1px] mx-auto mb-8" style={{ backgroundColor: '#C9A96E' }} />
          <p className="text-[11px] tracking-[0.2em] uppercase font-medium mb-5" style={{ color: '#C9A96E' }}>
            {SLIDES[current].cta ? 'WHC Concierge' : 'Why WHC Concierge'}
          </p>
          <h2
            className="text-[32px] md:text-[44px] lg:text-[56px] font-medium leading-[1.08] tracking-tight mb-6 whitespace-pre-line"
            style={{ color: '#1a1a1a' }}
            key={`h-${current}`}
          >
            {SLIDES[current].heading}
          </h2>
          <p
            className="text-[16px] md:text-[18px] leading-[1.7] max-w-2xl mx-auto mb-10"
            style={{ color: '#4B5563' }}
            key={`p-${current}`}
          >
            {SLIDES[current].text}
          </p>
          {SLIDES[current].cta && (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/register/employer"
                className="px-8 py-3.5 rounded-lg text-[14px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#C9A96E]/25"
                style={{ backgroundColor: '#C9A96E' }}>
                Find Talent
              </Link>
              <Link href="/roles"
                className="px-8 py-3.5 rounded-lg text-[14px] font-medium transition-all hover:bg-[#C9A96E]/10"
                style={{ border: '1.5px solid #C9A96E', color: '#1a1a1a' }}>
                Find Roles <ArrowRight size={14} className="inline ml-1" />
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setCurrent(i)}
            className="transition-all duration-300"
            style={{
              width: i === current ? 24 : 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: i === current ? '#C9A96E' : 'rgba(0,0,0,0.15)',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
