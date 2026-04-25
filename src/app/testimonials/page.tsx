import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Star } from 'lucide-react'

export const metadata: Metadata = {
  title: { absolute: 'Client Testimonials | WHC Concierge' },
  description: 'What spa professionals and luxury hospitality employers say about hiring and being hired through WHC Concierge.',
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk/testimonials' },
}

const testimonials = [
  {
    id: 1,
    quote: "WHC matched me with a role I'd never have found on a generic job board. The algorithm understood my ESPA background and CIDESCO qualification perfectly.",
    role: 'Senior Spa Therapist',
    company: '5★ London Hotel',
    rating: 5,
  },
  {
    id: 2,
    quote: "We filled our Senior Therapist vacancy in eleven days. The match scores saved hours of screening.",
    role: 'Spa Director',
    company: 'Country House Hotel',
    rating: 5,
  },
  {
    id: 3,
    quote: "The agency marketplace found me three regular bookings within my first month. No middlemen, no agency cuts beyond the platform fee.",
    role: 'Freelance Aesthetician',
    company: 'South East',
    rating: 5,
  },
  {
    id: 4,
    quote: "Finally, a recruitment platform that speaks our language. The candidates actually know the difference between Elemis and ESPA.",
    role: 'Owner',
    company: 'Boutique Wellness Centre',
    rating: 5,
  },
  {
    id: 5,
    quote: "Moved from a city day spa to a five-star resort in three weeks. WHC made it happen.",
    role: 'Spa Manager',
    company: 'Scottish Resort',
    rating: 5,
  },
  {
    id: 6,
    quote: "The shortlisting tools and match explanations make our hiring process genuinely faster. We've halved our time-to-hire.",
    role: 'Resort HR Manager',
    company: 'South West',
    rating: 5,
  },
  {
    id: 7,
    quote: "As a newly qualified therapist, I was nervous about finding my first role. WHC matched me on training, not just experience.",
    role: 'Newly Qualified Therapist',
    company: 'Greater London',
    rating: 5,
  },
  {
    id: 8,
    quote: "Radius search and instant booking has transformed how we fill last-minute shifts.",
    role: 'Operations Lead',
    company: 'Wellness Agency',
    rating: 5,
  },
]

export default function TestimonialsPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[60px]">
        {/* Hero */}
        <section className="bg-gradient-to-b from-surface to-white py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-ink mb-4">
              What Our Users Say
            </h1>
            <p className="text-lg text-secondary leading-relaxed">
              Hear from the spa professionals and hospitality leaders who&apos;ve found success on WHC Concierge.
            </p>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-sm italic text-muted mb-8 text-center">
              Composite testimonials representative of early platform feedback. Named case studies coming soon as our first cohort completes their hires.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="card relative"
                >
                  {/* Gold quotation mark */}
                  <div className="absolute -top-2 -left-1 text-6xl text-accent/30 font-serif leading-none">
                    "
                  </div>

                  {/* Quote */}
                  <p className="text-ink leading-relaxed mb-6 relative z-10 pt-2">
                    {testimonial.quote}
                  </p>

                  {/* Role & Company */}
                  <div className="border-t border-border pt-4 mb-3">
                    <p className="text-ink font-medium">{testimonial.role}</p>
                    {testimonial.company && (
                      <p className="text-muted text-xs mt-1">{testimonial.company}</p>
                    )}
                  </div>

                  {/* Stars */}
                  <div className="flex gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={16}
                        className={i < testimonial.rating ? 'fill-accent text-accent' : 'text-border'}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-surface py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-2xl font-serif text-ink mb-4">
              Ready to find your next opportunity?
            </h2>
            <p className="text-secondary mb-6">
              Join hundreds of spa and wellness professionals on WHC Concierge.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/jobs" className="btn-primary">
                Browse Roles
              </Link>
              <Link href="/login?role=talent" className="btn-secondary">
                Create Profile
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
