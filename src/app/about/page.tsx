import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Award, Shield, Users, Heart } from 'lucide-react'

export const metadata: Metadata = {
  title: 'About WHC Concierge | Luxury Wellness Recruitment',
  description: 'WHC Concierge is the UK\'s specialist careers platform for luxury wellness, connecting exceptional spa and hospitality professionals with the world\'s finest properties.',
  openGraph: {
    title: 'About WHC Concierge | Luxury Wellness Recruitment',
    description: 'The story behind the UK\'s specialist careers platform for luxury wellness professionals.',
  },
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[60px]">
        {/* Hero Section */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-serif text-ink mb-6">
              Redefining Wellness Recruitment
            </h1>
            <p className="text-lg text-secondary leading-relaxed">
              Built by wellness industry insiders who knew there had to be a better way to connect exceptional talent with extraordinary properties.
            </p>
          </div>
        </section>

        {/* The Story Section */}
        <section className="bg-white py-16 px-6">
          <div className="max-w-3xl mx-auto space-y-6">
            <p className="text-secondary leading-relaxed">
              Recruitment in luxury wellness is broken. Generic job boards don't understand the industry. Talented therapists get lost in a sea of unqualified applicants. Premium properties waste precious time screening candidates who don't fit. The whole system was built for generic corporate roles, not for the specialized world of luxury spa and hospitality.
            </p>

            <p className="text-secondary leading-relaxed">
              That's when we realized: the wellness industry needs its own dedicated, quality-controlled recruitment platform. One that speaks the language of CIDESCO, Elemis, and five-star service. One where a resume field actually understands what matters — product house expertise, treatment specialisms, the difference between a destination spa and a resort spa. One built by people who know the industry, not algorithms that don't.
            </p>

            <p className="text-secondary leading-relaxed">
              So we built WHC Concierge. A matching platform designed specifically for luxury spa and wellness, where every candidate is vetted and every property is verified. Where talented professionals find roles that genuinely suit them. Where five-star properties find the exceptional candidates they deserve. No generic filters. No spam. Just intelligent matching, built for the people who care most about this industry.
            </p>
          </div>
        </section>

        {/* Values Section */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif text-ink mb-12 text-center">Our Values</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Quality Over Quantity */}
              <div className="card card-hover p-8">
                <Award className="w-10 h-10 text-ink mb-4" />
                <h3 className="text-xl font-serif text-ink mb-3">Quality Over Quantity</h3>
                <p className="text-secondary">
                  We vet every profile. No spam, no time-wasters.
                </p>
              </div>

              {/* Industry Expertise */}
              <div className="card card-hover p-8">
                <Users className="w-10 h-10 text-ink mb-4" />
                <h3 className="text-xl font-serif text-ink mb-3">Industry Expertise</h3>
                <p className="text-secondary">
                  Built by people who know the difference between a hot stone and a cold plunge.
                </p>
              </div>

              {/* Fairness */}
              <div className="card card-hover p-8">
                <Heart className="w-10 h-10 text-ink mb-4" />
                <h3 className="text-xl font-serif text-ink mb-3">Fairness</h3>
                <p className="text-secondary">
                  No commission on hires. Transparent pricing. No hidden fees.
                </p>
              </div>

              {/* Confidentiality */}
              <div className="card card-hover p-8">
                <Shield className="w-10 h-10 text-ink mb-4" />
                <h3 className="text-xl font-serif text-ink mb-3">Confidentiality</h3>
                <p className="text-secondary">
                  Stealth mode, data protection, and discretion built in.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Founder Section */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-serif text-ink mb-8 text-center">Founded by Rebecca Doyle</h2>
            <div className="text-center">
              <p className="text-secondary leading-relaxed mb-4">
                Rebecca spent years working in luxury wellness and hospitality, seeing firsthand how the industry struggled with recruitment. Talented professionals were stuck in the wrong roles. Five-star properties were settling for second-best candidates. The disconnect was costing everyone — the talented people who wanted better, the properties searching for better, and the industry as a whole.
              </p>
              <p className="text-secondary leading-relaxed">
                WHC Concierge was built to bridge that gap — with technology that actually understands the sector, designed by someone who's lived it.
              </p>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-ink mb-8">Ready to join?</h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register/talent" className="btn-primary">
                Join as Talent
              </Link>
              <Link href="/register/employer" className="btn-secondary">
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
