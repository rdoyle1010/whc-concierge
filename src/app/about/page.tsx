import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Award, Shield, Users, Heart } from 'lucide-react'
import FounderImage from '@/components/FounderImage'

// British-English audit (PART 1): the only American-spelled user copy in src/
// was on this page (specialised, realised). All other matches across src/
// are framework code (Tailwind `transition-colors`, the DOM
// `ScrollIntoViewOptions.behavior` API, `colors` design tokens) and must
// stay American-spelled. No further copy changes required elsewhere.

export const metadata: Metadata = {
  title: 'About WHC Concierge | Luxury Wellness Recruitment',
  description: 'WHC Concierge is the UK\'s specialist recruitment platform for luxury spa and wellness — built by someone who has lived inside it.',
  openGraph: {
    title: 'About WHC Concierge | Luxury Wellness Recruitment',
    description: 'The story behind the UK\'s specialist recruitment platform for luxury spa and wellness.',
  },
}

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[60px]">
        {/* Hero — typography matches /pricing and /faq */}
        <section className="pt-28 pb-16 px-6 bg-white">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>About</p>
            <h1 className="text-[40px] md:text-[52px] font-medium tracking-tight leading-[1.08] mb-4" style={{ color: '#1a1a1a' }}>
              Built for an industry that deserves better.
            </h1>
            <p className="text-[16px] md:text-[18px] leading-[1.7] max-w-2xl mx-auto" style={{ color: '#6B7280' }}>
              WHC Concierge is the UK&apos;s specialist recruitment platform for luxury spa and wellness — built by someone who has lived inside it.
            </p>
          </div>
        </section>

        {/* Opening paragraphs */}
        <section className="bg-white pb-20 px-6">
          <div className="max-w-3xl mx-auto space-y-8">
            <p className="text-[16px] md:text-[17px] leading-[1.8]" style={{ color: '#374151' }}>
              Recruitment in luxury wellness has been broken for years. Generic job boards do not understand what a CIDESCO qualification means, or why ESPA training is not interchangeable with Dermalogica. Talented therapists vanish into stacks of unsuitable applicants. Five-star properties settle for whoever applied first. Everyone loses.
            </p>
            <p className="text-[16px] md:text-[17px] leading-[1.8]" style={{ color: '#374151' }}>
              WHC Concierge exists to change that. Every profile is vetted. Every property is verified. Our matching engine scores candidates across fifteen weighted categories — treatment skills, product house expertise, brand experience, location, availability, role level — so the right people surface first.
            </p>
            <p className="text-[16px] md:text-[17px] leading-[1.8]" style={{ color: '#374151' }}>
              No commission on hires. No spam. No generic filters built for office workers. Just the tools the wellness industry should always have had.
            </p>
          </div>
        </section>

        {/* Founder Section */}
        <section className="py-20 px-6" style={{ background: '#F8F7F5', borderTop: '1px solid #E8E5E0', borderBottom: '1px solid #E8E5E0' }}>
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[380px_1fr] gap-10 md:gap-14 items-center">
            <div>
              {/* Rebecca will upload founder-rebecca.jpg to /public/images/ — until then this will fall back to the placeholder */}
              <FounderImage />
            </div>
            <div>
              <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-3" style={{ color: '#C9A96E' }}>Founder</p>
              <h2 className="text-[28px] md:text-[36px] font-medium tracking-tight leading-[1.12] mb-6" style={{ color: '#1a1a1a' }}>
                Founded by Rebecca Doyle
              </h2>
              <p className="text-[15px] md:text-[16px] leading-[1.8] mb-5" style={{ color: '#374151' }}>
                Rebecca built her career inside the luxury spa and wellness sector — watching firsthand how poorly the industry was served by mainstream recruitment. Properties she admired struggled to find the right people. Therapists with extraordinary CVs were stuck in the wrong roles. The disconnect was costing the entire sector its standards.
              </p>
              <p className="text-[15px] md:text-[16px] leading-[1.8] mb-8" style={{ color: '#374151' }}>
                WHC Concierge is the platform she wished had existed when she was hiring. Built with industry knowledge, not algorithms designed for office workers. Designed to elevate the people who make luxury wellness what it is.
              </p>
              <a
                href="https://www.linkedin.com/in/rebecca-doyle-whc/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block px-6 py-2.5 rounded-lg text-[13px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#C9A96E]/25"
                style={{ backgroundColor: '#C9A96E' }}
              >
                Connect on LinkedIn →
              </a>
            </div>
          </div>
        </section>

        {/* Values */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-[28px] md:text-[36px] font-medium tracking-tight leading-[1.12] mb-12 text-center" style={{ color: '#1a1a1a' }}>
              What we stand for
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="card card-hover p-8">
                <Award className="w-10 h-10 mb-4" style={{ color: '#C9A96E' }} />
                <h3 className="text-xl font-serif text-ink mb-3">Quality over quantity</h3>
                <p className="text-secondary leading-relaxed">
                  We vet every profile and verify every property. No spam, no time-wasters, no padding the numbers.
                </p>
              </div>

              <div className="card card-hover p-8">
                <Users className="w-10 h-10 mb-4" style={{ color: '#C9A96E' }} />
                <h3 className="text-xl font-serif text-ink mb-3">Industry expertise</h3>
                <p className="text-secondary leading-relaxed">
                  Built by someone who has lived inside luxury wellness — not by generalists guessing at the sector.
                </p>
              </div>

              <div className="card card-hover p-8">
                <Heart className="w-10 h-10 mb-4" style={{ color: '#C9A96E' }} />
                <h3 className="text-xl font-serif text-ink mb-3">Fairness</h3>
                <p className="text-secondary leading-relaxed">
                  No commission on hires. Transparent fixed pricing. The platform earns by working, not by extracting.
                </p>
              </div>

              <div className="card card-hover p-8">
                <Shield className="w-10 h-10 mb-4" style={{ color: '#C9A96E' }} />
                <h3 className="text-xl font-serif text-ink mb-3">Confidentiality</h3>
                <p className="text-secondary leading-relaxed">
                  Stealth mode for candidates. Encrypted profiles. Discretion built in — because reputation matters in this industry.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* What we believe */}
        <section className="py-24 px-6" style={{ background: '#F8F7F5', borderTop: '1px solid #E8E5E0', borderBottom: '1px solid #E8E5E0' }}>
          <div className="max-w-3xl mx-auto">
            <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-10 text-left md:text-center" style={{ color: '#C9A96E' }}>
              What we believe
            </p>
            <div className="space-y-10 md:space-y-12 text-left md:text-center">
              <p className="font-serif italic text-[22px] md:text-[28px] leading-[1.4]" style={{ color: '#1a1a1a' }}>
                Recruitment should reward expertise, not advertising spend.
              </p>
              <div className="w-12 h-[1px] mx-0 md:mx-auto" style={{ backgroundColor: '#C9A96E' }} />
              <p className="font-serif italic text-[22px] md:text-[28px] leading-[1.4]" style={{ color: '#1a1a1a' }}>
                Discretion is non-negotiable in luxury hospitality.
              </p>
              <div className="w-12 h-[1px] mx-0 md:mx-auto" style={{ backgroundColor: '#C9A96E' }} />
              <p className="font-serif italic text-[22px] md:text-[28px] leading-[1.4]" style={{ color: '#1a1a1a' }}>
                If a platform doesn&apos;t understand the industry, it can&apos;t serve it.
              </p>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="bg-white py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-[28px] md:text-[36px] font-medium tracking-tight leading-[1.15] mb-8" style={{ color: '#1a1a1a' }}>
              Whether you&apos;re hiring or hired, WHC works for you.
            </h2>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/register/talent"
                className="inline-block px-8 py-3.5 rounded-lg text-[14px] font-semibold text-white transition-all hover:shadow-lg hover:shadow-[#C9A96E]/25"
                style={{ backgroundColor: '#C9A96E' }}
              >
                Create a profile
              </Link>
              <Link href="/register/employer" className="btn-secondary inline-block px-8 py-3.5 text-[14px]">
                Post a role
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
