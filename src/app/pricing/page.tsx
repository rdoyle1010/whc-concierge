'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Check } from 'lucide-react'

const tiers = [
  {
    name: 'Silver',
    price: '£150',
    description: 'Standard listing for your role',
    features: ['30-day listing', 'Basic candidate matching', 'Applicant management', 'Email notifications'],
    cta: 'Get Started',
    popular: false,
  },
  {
    name: 'Gold',
    price: '£200',
    description: 'Featured placement for more visibility',
    features: ['60-day listing', 'Featured placement', 'Advanced matching algorithm', 'Priority support', 'Applicant management', 'Direct messaging'],
    cta: 'Most Popular',
    popular: true,
  },
  {
    name: 'Platinum',
    price: '£250',
    description: 'Maximum visibility and promotion',
    features: ['90-day listing', 'Priority matching', 'Social media promotion', 'Highlighted across platform', 'Dedicated account support', 'Direct messaging', 'Analytics dashboard'],
    cta: 'Go Platinum',
    popular: false,
  },
]

export default function PricingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <section className="bg-ink pt-32 pb-20">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-serif font-bold text-white mb-4">Simple, Transparent Pricing</h1>
          <p className="text-white/60 max-w-xl mx-auto">Choose the right package for your recruitment needs. Candidate profiles are always free.</p>
        </div>
      </section>

      <section className="py-20 bg-parchment -mt-8">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8">
          {tiers.map((tier) => (
            <div key={tier.name} className={`card relative ${tier.popular ? 'border-gold ring-2 ring-gold/20' : ''}`}>
              {tier.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-white text-xs font-semibold px-4 py-1 rounded-full">Most Popular</div>
              )}
              <h3 className="font-serif text-2xl font-bold text-ink">{tier.name}</h3>
              <p className="text-gray-500 text-sm mt-1">{tier.description}</p>
              <p className="text-4xl font-serif font-bold text-ink mt-6">{tier.price}<span className="text-base text-gray-400 font-normal"> / role</span></p>
              <ul className="mt-8 space-y-3">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-center space-x-2 text-sm text-gray-600">
                    <Check size={16} className="text-gold flex-shrink-0" /><span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link href="/register/employer" className={`block text-center mt-8 ${tier.popular ? 'btn-primary' : 'btn-secondary'} w-full`}>
                {tier.cta}
              </Link>
            </div>
          ))}
        </div>

        <div className="max-w-2xl mx-auto px-4 mt-16 text-center">
          <h3 className="font-serif text-2xl font-semibold text-ink mb-3">For Candidates</h3>
          <p className="text-gray-500">Creating a candidate profile is <span className="text-gold font-semibold">completely free</span>. Browse roles, set up alerts, and apply without any cost.</p>
          <Link href="/register/talent" className="btn-primary inline-block mt-6">Create Free Profile</Link>
        </div>
      </section>
      <Footer />
    </div>
  )
}
