'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { Check, X, ChevronDown, Shield } from 'lucide-react'
import { JOB_TIERS } from '@/lib/constants'

const TIER_KEYS = ['Bronze', 'Silver', 'Gold', 'Platinum'] as const
const TIERS = TIER_KEYS.map(k => ({ name: k, ...JOB_TIERS[k] }))

const ROWS: { label: string; key: string; boolean?: boolean }[] = [
  { label: 'Price', key: 'display' },
  { label: 'Duration', key: 'days' },
  { label: 'Listing visibility', key: 'visibility' },
  { label: 'Match notifications', key: 'matchNotifs' },
  { label: 'Featured badge', key: 'badge', boolean: true },
  { label: 'Candidate shortlisting', key: 'shortlisting', boolean: true },
  { label: 'Analytics access', key: 'analytics', boolean: true },
  { label: 'Support level', key: 'support' },
]

const FAQS = [
  { q: 'Can I upgrade my listing?', a: 'Yes — contact us to upgrade during the listing period. We\'ll apply the price difference to the higher tier.' },
  { q: 'What payment methods do you accept?', a: 'All major credit and debit cards via Stripe. We also accept Apple Pay and Google Pay.' },
  { q: 'Do you charge commission on permanent hires?', a: 'No, never. You pay for the listing, not the hire. Once you\'ve found your candidate, there are no additional fees.' },
  { q: 'Can I get a refund?', a: 'Within 48 hours if no applications have been received. Contact us and we\'ll process it promptly.' },
  { q: 'Do you offer bulk discounts?', a: 'Yes — contact us for volume pricing on multiple listings. We offer packages for hotel groups and multi-property employers.' },
]

export default function PricingPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* Hero */}
      <section className="pt-28 pb-16 px-6 bg-white">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-4" style={{ color: '#C9A96E' }}>Pricing</p>
          <h1 className="text-[40px] md:text-[52px] font-medium tracking-tight leading-[1.08] mb-4" style={{ color: '#1a1a1a' }}>
            Simple, <span style={{ color: '#C9A96E' }}>Transparent</span> Pricing
          </h1>
          <p className="text-[16px] md:text-[18px] leading-[1.7] max-w-2xl mx-auto" style={{ color: '#6B7280' }}>
            No commission on hires. No hidden fees. Just the right plan for your hiring needs.
          </p>
        </div>
      </section>

      {/* Talent — Free */}
      <section className="pb-12 px-6" style={{ background: '#F8F7F5' }}>
        <div className="max-w-5xl mx-auto -mt-4 pt-12">
          <div className="bg-white rounded-xl p-8 md:p-10" style={{ border: '1px solid #E5E5E5' }}>
            <div className="flex flex-col md:flex-row items-center justify-between gap-8">
              <div>
                <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-2" style={{ color: '#C9A96E' }}>For Therapists &amp; Professionals</p>
                <h2 className="text-[28px] font-medium mb-2" style={{ color: '#1a1a1a' }}>Free to join</h2>
                <p className="text-[14px] mb-4" style={{ color: '#6B7280' }}>Create your profile, get matched, apply for roles — always free.</p>
                <div className="bg-white rounded-lg p-4 mb-4" style={{ border: '1px solid rgba(201, 169, 110, 0.25)', background: '#FDFBF7' }}>
                  <p className="text-[13px] font-medium mb-1" style={{ color: '#1a1a1a' }}>Go Featured — £10/month</p>
                  <p className="text-[12px]" style={{ color: '#6B7280' }}>Priority visibility, featured badge, appear at the top of search results.</p>
                </div>
              </div>
              <div className="text-center shrink-0">
                <p className="text-[48px] font-semibold" style={{ color: '#1a1a1a' }}>£0</p>
                <p className="text-[13px] mb-4" style={{ color: '#6B7280' }}>forever</p>
                <div className="flex flex-col gap-2">
                  <Link href="/register/talent" className="btn-primary text-center">Create Free Profile</Link>
                  <Link href="/talent/upgrade" className="px-5 py-2 rounded-lg text-[13px] font-medium text-center" style={{ backgroundColor: '#C9A96E', color: 'white' }}>Go Featured</Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Employer comparison table */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-3" style={{ color: '#C9A96E' }}>For Employers</p>
            <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight" style={{ color: '#1a1a1a' }}>Job posting packages</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="text-left py-4 pr-4 w-[180px]" />
                  {TIERS.map(t => (
                    <th key={t.name} className="py-4 px-3 text-center relative" style={'popular' in t && t.popular ? { borderLeft: '2px solid #C9A96E', borderRight: '2px solid #C9A96E', borderTop: '2px solid #C9A96E', borderRadius: '12px 12px 0 0', background: 'rgba(201, 169, 110, 0.04)' } : {}}>
                      {'popular' in t && t.popular && <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[9px] font-semibold px-3 py-0.5 rounded-full text-white" style={{ backgroundColor: '#C9A96E' }}>Most Popular</span>}
                      <p className="text-[15px] font-medium" style={{ color: '#1a1a1a' }}>{t.name}</p>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ROWS.map((row) => (
                  <tr key={row.key} style={{ borderBottom: '1px solid #F0EFED' }}>
                    <td className="py-3.5 pr-4 text-[13px] font-medium" style={{ color: '#6B7280' }}>{row.label}</td>
                    {TIERS.map(t => {
                      const val = (t as any)[row.key]
                      const isGold = 'popular' in t && t.popular
                      const displayVal = row.key === 'days' ? `${val} days` : val
                      return (
                        <td key={t.name} className="py-3.5 px-3 text-center text-[13px]"
                          style={isGold ? { borderLeft: '2px solid #C9A96E', borderRight: '2px solid #C9A96E', background: 'rgba(201, 169, 110, 0.04)' } : {}}>
                          {row.boolean ? (
                            val ? <span style={{ color: '#1a1a1a' }}>{val}</span> : <X size={14} className="inline" style={{ color: '#D1D5DB' }} />
                          ) : (
                            <span style={{ color: row.key === 'display' ? '#1a1a1a' : '#4B5563', fontWeight: row.key === 'display' ? 600 : 400, fontSize: row.key === 'display' ? 18 : 13 }}>{displayVal}</span>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
                {/* CTA row */}
                <tr>
                  <td className="py-5" />
                  {TIERS.map(t => (
                    <td key={t.name} className="py-5 px-3 text-center"
                      style={'popular' in t && t.popular ? { borderLeft: '2px solid #C9A96E', borderRight: '2px solid #C9A96E', borderBottom: '2px solid #C9A96E', borderRadius: '0 0 12px 12px', background: 'rgba(201, 169, 110, 0.04)' } : {}}>
                      <Link href="/employer/post-role"
                        className="inline-block px-5 py-2.5 rounded-lg text-[12px] font-semibold transition-all"
                        style={'popular' in t && t.popular ? { backgroundColor: '#C9A96E', color: 'white' } : { border: '1px solid #E5E5E5', color: '#1a1a1a' }}>
                        Post a Role
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Agency */}
      <section className="py-12 px-6" style={{ background: '#F8F7F5' }}>
        <div className="max-w-5xl mx-auto">
          <div className="bg-white rounded-xl p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8" style={{ border: '1px solid #E5E5E5' }}>
            <div>
              <p className="text-[11px] tracking-[0.15em] uppercase font-medium mb-2" style={{ color: '#C9A96E' }}>For Agency &amp; Temporary Staffing</p>
              <h2 className="text-[24px] font-medium mb-2" style={{ color: '#1a1a1a' }}>10% commission on confirmed bookings</h2>
              <p className="text-[14px]" style={{ color: '#6B7280' }}>No upfront cost. List your availability and only pay when a booking is confirmed through the platform.</p>
            </div>
            <Link href="/agency" className="btn-primary shrink-0">List Agency Shifts</Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 px-6 bg-white">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[28px] font-medium text-center mb-10" style={{ color: '#1a1a1a' }}>Frequently Asked Questions</h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <div key={i} className="rounded-xl" style={{ border: '1px solid #E5E5E5' }}>
                <button type="button" onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left">
                  <span className="text-[14px] font-medium" style={{ color: '#1a1a1a' }}>{faq.q}</span>
                  <ChevronDown size={16} className={`transition-transform shrink-0 ml-4 ${openFaq === i ? 'rotate-180' : ''}`} style={{ color: '#6B7280' }} />
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-[14px] leading-[1.7]" style={{ color: '#6B7280' }}>{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Trust bar */}
      <section className="py-8 px-6" style={{ background: '#F8F7F5', borderTop: '1px solid #E8E5E0' }}>
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-3">
          <Shield size={16} style={{ color: '#6B7280' }} />
          <p className="text-[13px]" style={{ color: '#6B7280' }}>Secure payments via Stripe. All data encrypted and GDPR compliant.</p>
        </div>
      </section>

      <Footer />
    </div>
  )
}
