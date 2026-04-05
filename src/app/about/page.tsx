import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'About',
  description: 'WHC Concierge is the specialist careers platform for luxury wellness, connecting exceptional spa and hospitality professionals with the world\'s finest properties.',
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[60px]">
        <section className="bg-gradient-to-b from-surface to-white py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-ink mb-6">
              The right people.<br />The right properties.
            </h1>
            <p className="text-lg text-secondary leading-relaxed">
              WHC Concierge is the specialist careers platform built exclusively for
              luxury wellness and hospitality. We connect exceptional spa, beauty and
              wellness professionals with the world&apos;s finest properties &mdash;
              intelligently, transparently and with real care for both sides.
            </p>
          </div>
        </section>

        <section className="py-16 px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <div>
              <h2 className="text-2xl font-serif text-ink mb-4">Why we exist</h2>
              <p className="text-secondary leading-relaxed">
                Recruitment in luxury wellness has been broken for years. Talented therapists
                struggle to find roles that match their skills and aspirations. Five-star properties
                waste time sifting through unsuitable candidates. We built WHC Concierge to fix
                that &mdash; a platform where intelligent matching replaces guesswork, and both
                sides get a genuinely better experience.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-ink mb-4">What makes us different</h2>
              <p className="text-secondary leading-relaxed">
                We&apos;re not a generic job board with a wellness filter bolted on. Every feature
                &mdash; from our matching algorithm to the way profiles are structured &mdash; has
                been designed specifically for the luxury spa and wellness sector. We understand the
                nuances: product house expertise, treatment specialisms, the difference between a
                resort spa and a destination spa.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-ink mb-4">For talent</h2>
              <p className="text-secondary leading-relaxed">
                Create a profile that properly represents your skills, experience and
                certifications. Get matched to roles that genuinely suit you. Browse live positions
                at verified properties. No middlemen, no guesswork &mdash; just direct connections
                to the opportunities you deserve.
              </p>
            </div>

            <div>
              <h2 className="text-2xl font-serif text-ink mb-4">For properties</h2>
              <p className="text-secondary leading-relaxed">
                Post roles and let our algorithm surface the best-matched candidates from a pool
                of verified, qualified professionals. Review detailed profiles, communicate directly
                and fill positions faster &mdash; with confidence that every candidate has been
                matched on the criteria that actually matter in luxury wellness.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-ink py-16 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl font-serif text-white mb-4">Ready to find your match?</h2>
            <p className="text-white/70 mb-8">
              Whether you&apos;re a spa professional looking for your next role or a property
              searching for exceptional talent, we&apos;re here to make it happen.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register/talent" className="btn-primary !bg-accent !text-ink hover:!bg-accent/90">
                Join as Talent
              </Link>
              <Link href="/register/employer" className="btn-secondary !border-white/30 !text-white hover:!bg-white/10">
                Register a Property
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
