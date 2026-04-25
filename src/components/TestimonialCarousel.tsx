'use client'

import { useState, useEffect } from 'react'
import { Star, ChevronLeft, ChevronRight } from 'lucide-react'

interface Testimonial {
  id: number
  quote: string
  role: string
  company: string
  rating: number
}

interface TestimonialCarouselProps {
  testimonials?: Testimonial[]
}

const defaultTestimonials: Testimonial[] = [
  {
    id: 1,
    quote:
      "WHC matched me with a role I'd never have found on a generic job board. The algorithm understood my ESPA background and CIDESCO qualification perfectly.",
    role: 'Senior Spa Therapist',
    company: '5★ London Hotel',
    rating: 5,
  },
  {
    id: 3,
    quote:
      "The agency marketplace found me three regular bookings within my first month. No middlemen, no agency cuts beyond the platform fee.",
    role: 'Freelance Aesthetician',
    company: 'South East',
    rating: 5,
  },
  {
    id: 5,
    quote: "Moved from a city day spa to a five-star resort in three weeks. WHC made it happen.",
    role: 'Spa Manager',
    company: 'Scottish Resort',
    rating: 5,
  },
]

export default function TestimonialCarousel({ testimonials = defaultTestimonials }: TestimonialCarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [itemsPerPage, setItemsPerPage] = useState(1)

  // Update items per page on client side based on screen size
  useEffect(() => {
    const handleResize = () => {
      setItemsPerPage(window.innerWidth >= 768 ? 3 : 1)
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Auto-rotate carousel
  useEffect(() => {
    if (isHovered) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % Math.max(1, testimonials.length - itemsPerPage + 1))
    }, 6000)

    return () => clearInterval(interval)
  }, [isHovered, testimonials.length, itemsPerPage])

  const handlePrev = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? Math.max(0, testimonials.length - itemsPerPage) : prev - 1
    )
  }

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % Math.max(1, testimonials.length - itemsPerPage + 1))
  }

  const visibleTestimonials = testimonials.slice(currentIndex, currentIndex + itemsPerPage)
  const totalSlides = Math.max(1, testimonials.length - itemsPerPage + 1)

  return (
    <div
      className="w-full"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="relative">
        {/* Carousel container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {visibleTestimonials.map((testimonial) => (
            <div key={testimonial.id} className="card animate-fade-in">
              {/* Gold quotation mark */}
              <div className="text-5xl text-accent/30 font-serif leading-none mb-2">
                "
              </div>

              {/* Quote */}
              <p className="text-ink text-sm leading-relaxed mb-4 flex-1">
                {testimonial.quote}
              </p>

              {/* Role & Company */}
              <div className="border-t border-border pt-3 mb-3">
                <p className="text-ink font-medium text-sm">{testimonial.role}</p>
                {testimonial.company && (
                  <p className="text-muted text-xs mt-1">{testimonial.company}</p>
                )}
              </div>

              {/* Stars */}
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={14}
                    className={i < testimonial.rating ? 'fill-accent text-accent' : 'text-border'}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Navigation arrows */}
        {testimonials.length > itemsPerPage && (
          <>
            <button
              onClick={handlePrev}
              className="absolute -left-6 md:-left-12 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-surface transition-colors text-secondary hover:text-accent"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={20} />
            </button>

            <button
              onClick={handleNext}
              className="absolute -right-6 md:-right-12 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-surface transition-colors text-secondary hover:text-accent"
              aria-label="Next testimonial"
            >
              <ChevronRight size={20} />
            </button>
          </>
        )}
      </div>

      {/* Navigation dots */}
      {testimonials.length > itemsPerPage && (
        <div className="flex items-center justify-center gap-2 mt-8">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentIndex(i)}
              className={`transition-all duration-200 rounded-full ${
                i === currentIndex
                  ? 'bg-accent w-2 h-2'
                  : 'bg-border w-2 h-2 hover:bg-border/60'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
