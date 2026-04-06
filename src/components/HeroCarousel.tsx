'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'

const SLIDES = [
  {
    image: 'https://images.unsplash.com/photo-1600334089648-b0d9d3028eb2?w=1920&q=80&auto=format&fit=crop',
    heading: 'Precision Matching, Not Guesswork',
    text: 'Our 15-category algorithm matches therapists to roles based on skills, qualifications, brands, location, and availability. Every match is meaningful.',
  },
  {
    image: 'https://images.unsplash.com/photo-1544161515-4ab6ce6db874?w=1920&q=80&auto=format&fit=crop',
    heading: 'Every Profile, Personally Vetted',
    text: 'Only qualified wellness professionals make it onto the platform. CIDESCO, CIBTAC, VTCT — we verify credentials so you don\'t have to.',
  },
  {
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1920&q=80&auto=format&fit=crop',
    heading: 'Access the UK\'s Finest Properties',
    text: 'From five-star London hotels to country estate spas — browse exclusive roles at properties that set the standard for luxury wellness.',
  },
  {
    image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1920&q=80&auto=format&fit=crop',
    heading: 'Residencies, Agency Shifts & Permanent Roles',
    text: 'Whether you want a seasonal placement in the Cotswolds, weekend agency cover, or your forever role — it\'s all here.',
  },
  {
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbec6d?w=1920&q=80&auto=format&fit=crop',
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
    const timer = setInterval(next, 5000)
    return () => clearInterval(timer)
  }, [paused, next])

  return (
    <section
      className="relative min-h-[520px] overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Slides */}
      {SLIDES.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-opacity duration-700 ease-in-out"
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
          <div className="absolute inset-0 bg-white/55" />
        </div>
      ))}

      {/* Content */}
      <div className="relative z-10 flex items-center justify-center min-h-[520px] px-6 lg:px-8">
        <div className="max-w-3xl text-center">
          <p className="text-[11px] tracking-[0.2em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>
            Why WHC Concierge
          </p>
          <h2
            className="text-[30px] md:text-[40px] lg:text-[46px] font-medium leading-[1.12] tracking-tight mb-5 transition-opacity duration-500"
            style={{ color: '#1a1a1a' }}
            key={`h-${current}`}
          >
            {SLIDES[current].heading}
          </h2>
          <p
            className="text-[16px] md:text-[18px] leading-[1.7] max-w-2xl mx-auto transition-opacity duration-500"
            style={{ color: '#4B5563' }}
            key={`p-${current}`}
          >
            {SLIDES[current].text}
          </p>
        </div>
      </div>

      {/* Navigation dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
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
              backgroundColor: i === current ? '#C9A96E' : '#D1D5DB',
            }}
            aria-label={`Go to slide ${i + 1}`}
          />
        ))}
      </div>
    </section>
  )
}
