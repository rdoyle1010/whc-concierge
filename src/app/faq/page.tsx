'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { FEATURED_TALENT } from '@/lib/constants'

const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

interface FAQItem { question: string; answer: string }
interface FAQSection { title: string; items: FAQItem[] }

const faqSections: FAQSection[] = [
  { title: 'For Therapists & Wellness Professionals', items: [
    { question: 'How do I create a profile?', answer: 'Sign up free, complete the onboarding wizard covering your skills, qualifications, product house experience, and availability. Takes about 10 minutes.' },
    { question: 'Is it free to use?', answer: `Yes, basic profiles are always free. If you want priority visibility in search results, you can purchase a one-off featured boost: ${formatPrice(FEATURED_TALENT.seven_days.price)} for ${FEATURED_TALENT.seven_days.days} days or ${formatPrice(FEATURED_TALENT.thirty_days.price)} for ${FEATURED_TALENT.thirty_days.days} days.` },
    { question: 'How does matching work?', answer: 'Matching considers role level, treatment skills, qualifications, product-house knowledge, availability and location. A score is a guide for both sides, not an automatic hiring decision.' },
    { question: 'Can I hide my profile from my current employer?', answer: 'Yes. In Talent Settings, Stealth Mode lets you block a specific employer. That business will not receive your profile in new searches, matching results, agency results or shortlists. It cannot withdraw information you already chose to send in an application or message, and authorised WHC administrators can still access accounts when needed for safety and support.' },
    { question: 'What qualifications do you accept?', answer: 'CIDESCO, CIBTAC, VTCT, NVQ, ITEC, and more. Add any recognised qualification during onboarding.' },
    { question: 'How do I apply for a role?', answer: 'Browse matched roles, click Apply. The employer receives your profile with your match score.' },
    { question: 'Can I set up job alerts?', answer: 'Yes. Configure email alerts in your dashboard settings for new roles matching your profile.' },
  ]},
  { title: 'For Employers & Properties', items: [
    { question: 'How do I post a role?', answer: 'Create an employer account, complete your property profile, then post a role by selecting a tier.' },
    { question: 'What are the job posting tiers?', answer: 'The current tiers are Bronze and Platinum, with different listing lengths and visibility. Please use the Pricing page for the live price and inclusions before purchasing, as offers may change.' },
    { question: 'How long does approval take?', answer: 'Employer accounts are reviewed before they can view private talent profiles. Timing depends on whether the information supplied can be verified; contact support if your review appears to be delayed.' },
    { question: 'Can I search for candidates?', answer: 'Yes. Browse the talent pool, filter by skills and qualifications, and shortlist candidates directly.' },
    { question: "What's included in the match score?", answer: 'The score compares relevant role requirements with the professional’s profile, including skills, product houses, qualifications, role level, availability and location. Employers should still review the full profile and speak with the person.' },
    { question: 'How does location and travel matching work?', answer: 'Distance searches use postcode coordinates and straight-line miles. A professional is only included when the distance fits both the employer’s chosen search radius and the professional’s own travel radius. This is not a journey-time promise, so properties can also provide the nearest station or Tube, approximate walk, whether a car is required, parking and any taxi or shuttle support.' },
    { question: 'Do you offer bulk pricing?', answer: 'Contact us for volume discounts on multiple listings.' },
  ]},
  { title: 'Account & Privacy', items: [
    { question: 'How do I download my data?', answer: "Go to Settings and click 'Download My Data' for a full GDPR-compliant export." },
    { question: 'How do I delete my account?', answer: "Go to Settings and click 'Request Account Deletion'. The request is sent for review; support will confirm the next steps and any records that must be retained for legal or safety reasons." },
    { question: 'Is my data secure?', answer: 'We use authenticated accounts, role-based access controls and restricted database policies. Please use a unique password and report anything unexpected. Our Privacy Policy explains how personal data is handled under UK data-protection law.' },
    { question: 'Who can see my profile?', answer: 'Approved employers can view discoverable talent profiles. An employer blocked through Stealth Mode is excluded before profile data is sent to them. Authorised WHC administrators retain access for moderation, safety and support.' },
  ]},
  { title: 'Payments & Billing', items: [
    { question: 'What payment methods do you accept?', answer: 'All major credit and debit cards via Stripe.' },
    { question: 'Can I get a refund?', answer: 'Please check the Terms and contact support with the payment details. A refund is not automatically guaranteed once a listing or paid service has been published or started.' },
    { question: 'Do you charge commission on hires?', answer: 'No commission. You pay for the listing, not the hire.' },
  ]},
]

function AccordionItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button onClick={onToggle} className={`w-full text-left py-5 px-5 md:px-6 flex items-center justify-between transition-all ${isOpen ? 'border-l-[3px] border-l-accent bg-surface' : 'border-l-[3px] border-l-transparent hover:bg-surface/60'}`} aria-expanded={isOpen}>
        <span className="text-[15px] font-semibold text-ink pr-4">{question}</span>
        <ChevronDown size={18} className={`text-accent flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-6 pb-6 text-[13px] text-secondary leading-7">{answer}</div>
      </div>
    </div>
  )
}

function FAQAccordionSection({ section }: { section: FAQSection }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)
  return (
    <section className="py-8 md:py-10">
      <p className="public-eyebrow mb-3">Help centre</p>
      <h2 className="text-[24px] md:text-[30px] font-semibold text-ink mb-6">{section.title}</h2>
      <div className="public-panel overflow-hidden">
        {section.items.map((item, index) => <AccordionItem key={index} {...item} isOpen={openIndex === index} onToggle={() => setOpenIndex(openIndex === index ? null : index)} />)}
      </div>
    </section>
  )
}

export default function FAQPage() {
  return (
    <div className="public-page">
      <Navbar />
      <main className="pt-[76px]">
        <section className="public-hero py-16 md:py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="public-eyebrow mb-4">Help & Support</p>
            <h1 className="public-title mb-5">Frequently Asked Questions</h1>
            <p className="public-intro max-w-2xl mx-auto">Everything you need to know about profiles, hiring, privacy, matching and billing.</p>
          </div>
        </section>
        <section className="px-6 py-8 md:py-12"><div className="max-w-3xl mx-auto">{faqSections.map((section, index) => <FAQAccordionSection key={index} section={section} />)}</div></section>
        <section className="bg-parchment py-16 px-6 border-t border-border">
          <div className="max-w-3xl mx-auto text-center">
            <p className="public-eyebrow mb-3">Need more help?</p>
            <h2 className="text-[28px] md:text-[34px] font-semibold text-ink mb-4">Still have questions?</h2>
            <p className="text-[14px] text-secondary mb-7 leading-7">Get in touch with the WHC team and we&apos;ll help you find the right next step.</p>
            <Link href="/contact" className="btn-primary inline-block">Get in Touch</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
