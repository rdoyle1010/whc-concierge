'use client'

import { useEffect, useState } from 'react'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { FEATURED_TALENT } from '@/lib/constants'
// The defaults come from the values file, not from public-page-content.
// That module builds the zod schemas these types are inferred from, so
// importing a default through it pulled the whole of zod into this page:
// 62KB gzipped, to render copy that is already in the HTML. Types are
// erased at compile time, so `import type` from it stays free.
import { DEFAULT_FAQ_SECTIONS } from '@/lib/public-page-content-values'

// Prices are substituted, not stored.
//
// One answer quotes what a featured listing costs. Storing the number would
// mean the FAQ kept quoting it the first afternoon somebody changed a price on
// the pricing screen, which is the whole thing that screen exists to prevent.
// The editable text carries a token and the live figure is put in here.
function withLivePrices(answer: string): string {
  return answer
    .replace('{featured_7day_price}', formatPrice(FEATURED_TALENT.seven_days.price))
    .replace('{featured_7day_days}', String(FEATURED_TALENT.seven_days.days))
    .replace('{featured_30day_price}', formatPrice(FEATURED_TALENT.thirty_days.price))
    .replace('{featured_30day_days}', String(FEATURED_TALENT.thirty_days.days))
}

const formatPrice = (pence: number) => `£${(pence / 100).toFixed(2)}`

interface FAQItem { question: string; answer: string }
interface FAQSection { title: string; items: FAQItem[] }


function AccordionItem({ question, answer, isOpen, onToggle }: { question: string; answer: string; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="border-b border-border last:border-b-0">
      <button onClick={onToggle} className={`w-full text-left py-5 px-5 md:px-6 flex items-center justify-between transition-all ${isOpen ? 'border-l-[3px] border-l-accent bg-surface' : 'border-l-[3px] border-l-transparent hover:bg-surface/60'}`} aria-expanded={isOpen}>
        <span className="text-[15px] font-semibold text-ink pr-4">{question}</span>
        <ChevronDown size={18} className={`text-accent flex-shrink-0 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-200 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <div className="px-6 pb-6 text-[13px] text-secondary leading-7">{withLivePrices(answer)}</div>
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
  // The questions, hers to change. The code default is the same twenty-three,
  // so the page reads correctly before the real list arrives.
  const [faqSections, setFaqSections] = useState<FAQSection[]>(DEFAULT_FAQ_SECTIONS)
  useEffect(() => {
    const draft = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('pagePreview') === 'draft' ? '&draft=1' : ''
    fetch(`/api/public/page-content?part=faq${draft}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (Array.isArray(data?.faq) && data.faq.length) setFaqSections(data.faq) })
      .catch(() => {})
  }, [])

  return (
    <div className="public-page">
      <Navbar />
      <main id="main-content" className="pt-[76px]">
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
            <p className="text-[14px] text-secondary mb-7 leading-7">Get in touch with the Talent House team and we&apos;ll help you find the right next step.</p>
            <Link href="/contact" className="btn-primary inline-block">Get in Touch</Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
