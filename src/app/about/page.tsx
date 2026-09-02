import type { Metadata } from 'next'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Award, Shield, Users, Heart } from 'lucide-react'
import FounderImage from '@/components/FounderImage'

export const metadata: Metadata = {
  title: { absolute: 'About WHC Concierge | The Professional Platform for Spa and Wellness Careers' },
  description: 'WHC Concierge is the professional platform for spa and wellness careers - built by someone who has lived inside the industry.',
  alternates: { canonical: 'https://talent.wellnesshousecollective.co.uk/about' },
  openGraph: { title: 'About WHC Concierge | The Professional Platform for Spa and Wellness Careers', description: 'The story behind the professional platform for spa and wellness careers.' },
}

export default function AboutPage() {
  const values = [
    [Award, 'Quality over quantity', 'We vet every profile and verify every property. No spam, no time-wasters, no padding the numbers.'],
    [Users, 'Industry expertise', 'Built by someone who has lived inside luxury wellness - not by generalists guessing at the sector.'],
    [Heart, 'Fairness', 'No commission on hires. Transparent fixed pricing. The platform earns by working, not by extracting.'],
    [Shield, 'Confidentiality', 'Stealth mode for candidates. Encrypted profiles. Discretion built in - because reputation matters in this industry.'],
  ] as const

  return (
    <div className="public-page">
      <Navbar />
      <main id="main-content" className="pt-[76px]">
        <section className="public-hero py-16 md:py-20 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <p className="public-eyebrow mb-4">About</p>
            <h1 className="public-title mb-5">Built for an industry that deserves better.</h1>
            <p className="public-intro max-w-2xl mx-auto">WHC Concierge is the professional platform for spa and wellness careers - built by someone who has lived inside the industry.</p>
          </div>
        </section>

        <section className="py-16 md:py-20 px-6 bg-white border-b border-border">
          <div className="max-w-3xl mx-auto space-y-7 text-[15px] md:text-[16px] leading-8 text-secondary">
            <p>Recruitment in luxury wellness has been broken for years. Generic job boards do not understand what a CIDESCO qualification means, or why ESPA training is not interchangeable with Dermalogica. Talented therapists vanish into stacks of unsuitable applicants. Five-star properties settle for whoever applied first. Everyone loses.</p>
            <p>WHC Concierge exists to change that. Every profile is vetted. Every property is verified. Our matching engine scores candidates across fifteen weighted categories - treatment skills, product house expertise, brand experience, location, availability, role level - so the right people surface first.</p>
            <p>No commission on hires. No spam. No generic filters built for office workers. Just the tools the wellness industry should always have had.</p>
          </div>
        </section>

        <section className="py-16 md:py-20 px-6 bg-parchment border-b border-border">
          <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-[380px_1fr] gap-10 md:gap-14 items-center">
            <FounderImage />
            <div>
              <p className="public-eyebrow mb-3">Founder</p>
              <h2 className="text-[30px] md:text-[38px] font-semibold tracking-[-0.035em] text-ink mb-6">Founded by Rebecca Doyle</h2>
              <p className="text-[15px] leading-8 text-secondary mb-5">Rebecca built her career inside the luxury spa and wellness sector - watching firsthand how poorly the industry was served by mainstream recruitment. Properties she admired struggled to find the right people. Therapists with extraordinary CVs were stuck in the wrong roles. The disconnect was costing the entire sector its standards.</p>
              <p className="text-[15px] leading-8 text-secondary mb-8">WHC Concierge is the platform she wished had existed when she was hiring. Built with industry knowledge, not algorithms designed for office workers. Made for the people who make luxury wellness what it is.</p>
              <a href="https://www.linkedin.com/in/rebecca-doyle-whc/" target="_blank" rel="noopener noreferrer" className="btn-primary inline-block">Connect on LinkedIn →</a>
            </div>
          </div>
        </section>

        <section className="bg-surface py-16 md:py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10"><p className="public-eyebrow mb-3">Our principles</p><h2 className="text-[30px] md:text-[38px] font-semibold text-ink">What we stand for</h2></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {values.map(([Icon, title, copy]) => (
                <div key={title} className="public-panel p-7">
                  <div className="w-11 h-11 rounded-xl bg-[#f3f0eb] flex items-center justify-center mb-5"><Icon className="w-5 h-5 text-accent" /></div>
                  <h3 className="text-[18px] font-semibold text-ink mb-2">{title}</h3>
                  <p className="text-[13px] text-secondary leading-7">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-6 bg-[#1c1b1a] text-white">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-semibold mb-8">What we believe</p>
            <div className="space-y-8 text-[22px] md:text-[28px] leading-[1.4] font-medium text-white/90">
              <p>Recruitment should reward expertise, not advertising spend.</p>
              <div className="w-12 h-px bg-[#57534e] mx-auto" />
              <p>Discretion is non-negotiable in luxury hospitality.</p>
              <div className="w-12 h-px bg-[#57534e] mx-auto" />
              <p>If a platform doesn&apos;t understand the industry, it can&apos;t serve it.</p>
            </div>
          </div>
        </section>

        <section className="bg-parchment py-16 md:py-20 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <p className="public-eyebrow mb-3">Join WHC</p>
            <h2 className="text-[28px] md:text-[36px] font-semibold text-ink mb-8">Whether you&apos;re hiring or hired, WHC works for you.</h2>
            <div className="flex flex-col sm:flex-row gap-3 justify-center"><Link href="/register/talent" className="btn-primary">Create a profile</Link><Link href="/register/employer" className="btn-secondary">Post a role</Link></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
