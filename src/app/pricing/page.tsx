'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Check } from 'lucide-react'

const jobTiers = [
  { name: 'Bronze', price: '£150', period: '30 days', features: ['30-day listing', 'Basic candidate matching', 'Applicant tracking', 'Email notifications'] },
  { name: 'Silver', price: '£175', period: '45 days', features: ['45-day listing', 'Enhanced matching algorithm', 'Priority support', 'Applicant tracking', 'Direct messaging'], popular: true },
  { name: 'Gold', price: '£200', period: '60 days', features: ['60-day listing', 'Advanced matching', 'Featured placement', 'Priority support', 'Direct messaging', 'Analytics dashboard'] },
  { name: 'Platinum', price: '£250', period: '90 days', features: ['90-day listing', 'Priority matching', 'Homepage featuring', 'Social media promotion', 'Dedicated account support', 'Full analytics'] },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <section className="pt-28 pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-neutral-400 text-xs tracking-widest uppercase mb-3">Pricing</p>
          <h1 className="text-5xl md:text-6xl font-bold text-black tracking-tight mb-4">Simple, transparent pricing</h1>
          <p className="text-neutral-400 text-lg font-light max-w-xl">No hidden fees. Candidate profiles are always free.</p>
        </div>
      </section>

      {/* Talent — Free */}
      <section className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-neutral-50 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-2">For Talent</p>
              <h2 className="text-3xl font-bold text-black mb-2">Free to join</h2>
              <p className="text-neutral-400">Create your profile, browse roles, get matched, and apply — all completely free.</p>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-4xl font-bold text-black">£0</p>
              <p className="text-neutral-400 text-sm">forever</p>
              <Link href="/register/talent" className="btn-primary inline-block mt-4">Create Free Profile</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Profile */}
      <section className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-black text-white p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-xs font-medium text-white/40 uppercase tracking-widest mb-2">Featured Profile</p>
              <h2 className="text-3xl font-bold mb-2">Stand out from the crowd</h2>
              <p className="text-white/50 mb-4">Get premium visibility with a featured profile.</p>
              <ul className="space-y-2">
                {['Top of employer search results', 'Homepage talent spotlight', 'Social media promotion', 'Weekly newsletter inclusion'].map((f) => (
                  <li key={f} className="flex items-center space-x-2 text-sm text-white/60"><Check size={14} className="text-white flex-shrink-0" /><span>{f}</span></li>
                ))}
              </ul>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-4xl font-bold">£10<span className="text-lg font-normal text-white/50">/month</span></p>
              <p className="text-white/30 text-sm">Cancel anytime</p>
              <Link href="/talent/upgrade" className="bg-white text-black px-6 py-3 text-sm font-medium hover:bg-neutral-100 transition-colors inline-block mt-4">Upgrade Now</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Job Posting Tiers */}
      <section className="pb-16 px-4">
        <div className="max-w-7xl mx-auto">
          <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-3">For Employers</p>
          <h2 className="text-3xl font-bold text-black mb-8">Job posting packages</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {jobTiers.map((tier) => (
              <div key={tier.name} className={`border p-6 ${tier.popular ? 'border-black' : 'border-neutral-200'} relative`}>
                {tier.popular && <div className="absolute -top-3 left-4 bg-black text-white text-[10px] font-semibold px-3 py-1 uppercase tracking-wider">Popular</div>}
                <h3 className="font-bold text-black text-lg">{tier.name}</h3>
                <p className="text-3xl font-bold text-black mt-2">{tier.price}</p>
                <p className="text-neutral-400 text-xs mb-6">{tier.period}</p>
                <ul className="space-y-2.5 mb-8">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center space-x-2 text-sm text-neutral-500"><Check size={14} className="text-black flex-shrink-0" /><span>{f}</span></li>
                  ))}
                </ul>
                <Link href="/register/employer" className={`block text-center text-sm font-medium py-3 ${tier.popular ? 'btn-primary' : 'btn-secondary'}`}>Get Started</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Agency Commission */}
      <section className="pb-24 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="bg-neutral-50 p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
            <div>
              <p className="text-xs font-medium text-neutral-400 uppercase tracking-widest mb-2">Agency Marketplace</p>
              <h2 className="text-3xl font-bold text-black mb-2">10% commission</h2>
              <p className="text-neutral-400 max-w-lg">When a booking is confirmed through the WHC agency marketplace, a 10% commission is applied to the agreed rate. No upfront fees — you only pay when a booking happens.</p>
            </div>
            <div className="text-center flex-shrink-0">
              <p className="text-4xl font-bold text-black">10%</p>
              <p className="text-neutral-400 text-sm">per confirmed booking</p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

