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
      <main className="pt-[60px] bg-surface">
        {/* Hero */}
        <section className="bg-white border-b border-border">
          <div className="max-w-3xl mx-auto px-6 lg:px-8 py-16 text-center">
            <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#555555' }}>Testimonials</p>
            <h1 className="text-[36px] md:text-[48px] font-medium text-ink tracking-tight leading-[1.08] mb-4">
              What Our Users Say
            </h1>
            <p className="text-[15px] text-secondary leading-relaxed max-w-xl mx-auto">
              Hear from the spa professionals and hospitality leaders who&apos;ve found success on WHC Concierge.
            </p>
          </div>
        </section>

        {/* Testimonials Grid */}
        <section className="py-14 px-6">
          <div className="max-w-6xl mx-auto">
            <p className="text-[13px] italic text-muted mb-8 text-center">
              Composite testimonials representative of early platform feedback. Named case studies coming soon as our first cohort completes their hires.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {testimonials.map((testimonial) => (
                <div
                  key={testimonial.id}
                  className="bg-white border border-border rounded-xl p-6 relative"
                >
                  {/* Gold quotation mark */}
                  <div className="absolute top-2 left-4 text-5xl leading-none select-none" style={{ color: 'rgba(201, 169, 110, 0.3)' }} aria-hidden="true">
                    &ldquo;
                  </div>

                  {/* Quote */}
                  <p className="text-[15px] text-ink leading-relaxed mb-6 relative z-10 pt-4">
                    {testimonial.quote}
                  </p>

                  {/* Role & Company */}
                  <div className="border-t border-border pt-4 mb-3">
                    <p className="text-[14px] text-ink font-medium">{testimonial.role}</p>
                    {testimonial.company && (
                      <p className="text-muted text-[12px] mt-1">{testimonial.company}</p>
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
        <section className="bg-white border-t border-border py-16 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#555555' }}>Get Started</p>
            <h2 className="text-[24px] md:text-[28px] font-medium text-ink tracking-tight mb-3">
              Ready to find your next opportunity?
            </h2>
            <p className="text-[14px] text-secondary mb-8">
              Join hundreds of spa and wellness professionals on WHC Concierge.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link href="/jobs" className="px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:shadow-lg" style={{ backgroundColor: '#555555' }}>
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
