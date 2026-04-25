'use client'

import { useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

interface FAQSection {
  title: string
  items: FAQItem[]
}

const faqSections: FAQSection[] = [
  {
    title: 'For Therapists & Wellness Professionals',
    items: [
      {
        question: 'How do I create a profile?',
        answer: 'Sign up free, complete the onboarding wizard covering your skills, qualifications, product house experience, and availability. Takes about 10 minutes.',
      },
      {
        question: 'Is it free to use?',
        answer: 'Yes, basic profiles are always free. Featured profiles cost £10/month for priority visibility in search results.',
      },
      {
        question: 'How does matching work?',
        answer: 'Our algorithm scores you across 15 categories including treatment skills, qualifications, product house knowledge, location, and availability.',
      },
      {
        question: 'Can I hide my profile from my current employer?',
        answer: 'Yes. Stealth Mode lets you block specific employers from seeing your profile.',
      },
      {
        question: 'What qualifications do you accept?',
        answer: 'CIDESCO, CIBTAC, VTCT, NVQ, ITEC, and more. Add any recognised qualification during onboarding.',
      },
      {
        question: 'How do I apply for a role?',
        answer: 'Browse matched roles, click Apply. The employer receives your profile with your match score.',
      },
      {
        question: 'Can I set up job alerts?',
        answer: 'Yes. Configure email alerts in your dashboard settings for new roles matching your profile.',
      },
    ],
  },
  {
    title: 'For Employers & Properties',
    items: [
      {
        question: 'How do I post a role?',
        answer: 'Create an employer account, complete your property profile, then post a role by selecting a tier.',
      },
      {
        question: 'What are the job posting tiers?',
        answer: 'Bronze (7 days, £49), Silver (14 days, £89), Gold (30 days, £149), Platinum (60 days, £249) — each with increasing visibility and features.',
      },
      {
        question: 'How long does approval take?',
        answer: 'We review employer accounts within 24–48 hours to maintain platform quality.',
      },
      {
        question: 'Can I search for candidates?',
        answer: 'Yes. Browse the talent pool, filter by skills and qualifications, and shortlist candidates directly.',
      },
      {
        question: "What's included in the match score?",
        answer: '15 weighted categories including role level, treatment skills, product houses, qualifications, location, and availability.',
      },
      {
        question: 'Do you offer bulk pricing?',
        answer: 'Contact us for volume discounts on multiple listings.',
      },
    ],
  },
  {
    title: 'Account & Privacy',
    items: [
      {
        question: 'How do I download my data?',
        answer: "Go to Settings and click 'Download My Data' for a full GDPR-compliant export.",
      },
      {
        question: 'How do I delete my account?',
        answer: "Go to Settings and click 'Request Account Deletion'. We process it within 72 hours.",
      },
      {
        question: 'Is my data secure?',
        answer: 'Yes. We use bank-grade encryption, secure hosting, and comply with UK GDPR.',
      },
      {
        question: 'Who can see my profile?',
        answer: 'Only approved employers can view talent profiles. You control visibility via Stealth Mode.',
      },
    ],
  },
  {
    title: 'Payments & Billing',
    items: [
      {
        question: 'What payment methods do you accept?',
        answer: 'All major credit and debit cards via Stripe.',
      },
      {
        question: "Can I get a refund?",
        answer: "Contact us within 48 hours of posting if the role hasn't received applications.",
      },
      {
        question: 'Do you charge commission on hires?',
        answer: 'No commission. You pay for the listing, not the hire.',
      },
    ],
  },
]

function AccordionItem({
  question,
  answer,
  isOpen,
  onToggle,
}: {
  question: string
  answer: string
  isOpen: boolean
  onToggle: () => void
}) {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button
        onClick={onToggle}
        className={`w-full text-left py-6 px-6 flex items-center justify-between transition-all ${
          isOpen ? 'border-l-[3px] border-l-[#C9A96E] bg-gray-50' : 'border-l-[3px] border-l-transparent'
        }`}
        aria-expanded={isOpen}
      >
        <span className="text-lg font-serif text-ink font-medium">{question}</span>
        <ChevronDown
          size={20}
          className={`text-[#C9A96E] flex-shrink-0 ml-4 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-96' : 'max-h-0'
        }`}
      >
        <div className="px-6 pb-6 text-secondary leading-relaxed">
          {answer}
        </div>
      </div>
    </div>
  )
}

function FAQAccordionSection({
  section,
}: {
  section: FAQSection
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <section className="py-12">
      <h2 className="text-2xl md:text-3xl font-serif text-ink mb-8">{section.title}</h2>
      <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
        {section.items.map((item, index) => (
          <AccordionItem
            key={index}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            onToggle={() => setOpenIndex(openIndex === index ? null : index)}
          />
        ))}
      </div>
    </section>
  )
}

export default function FAQPage() {
  return (
    <>
      <Navbar />
      <main className="pt-[60px]">
        {/* Hero Section */}
        <section className="bg-white py-16 md:py-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <p className="eyebrow text-[#C9A96E] uppercase tracking-wider mb-4 text-sm font-semibold">
              Help & Support
            </p>
            <h1 className="section-heading text-4xl md:text-5xl font-serif text-ink mb-6">
              Frequently Asked Questions
            </h1>
            <p className="text-lg text-secondary leading-relaxed">
              Find answers to common questions about WHC Concierge, from creating your profile to managing your account and billing.
            </p>
          </div>
        </section>

        {/* FAQ Sections */}
        <section className="bg-white py-12 md:py-20 px-6">
          <div className="max-w-3xl mx-auto">
            {faqSections.map((section, index) => (
              <FAQAccordionSection key={index} section={section} />
            ))}
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-white py-16 px-6 border-t border-gray-200">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-ink mb-4">Still have questions?</h2>
            <p className="text-lg text-secondary mb-8 leading-relaxed">
              We&apos;re here to help. Get in touch with our support team and we&apos;ll be happy to assist.
            </p>
            <Link
              href="/contact"
              className="btn-primary inline-block bg-[#C9A96E] text-ink hover:bg-[#B8925C] transition-colors"
            >
              Get in Touch
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  )
}
