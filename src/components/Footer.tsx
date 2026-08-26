'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import { DEFAULT_WEBSITE_CONTENT, type WebsiteContent } from '@/lib/site-content'
import { DEFAULT_PUBLIC_PAGES_CONTENT } from '@/lib/public-page-content'
import { Linkedin, Instagram, Facebook, MessageCircle, Mail, Link2, Share2, Check } from 'lucide-react'

const WHC_LINKEDIN = 'https://www.linkedin.com/company/wellnesshousecollective/'
const WHC_INSTAGRAM = 'https://www.instagram.com/wellnesshousecollective/'
const WHC_FACEBOOK = 'https://www.facebook.com/wellnesshousecollective'

let cachedEditorialBand = DEFAULT_PUBLIC_PAGES_CONTENT.editorialBand
let publicPagesPromise: Promise<any> | null = null

function loadPublicPagesOnce() {
  if (!publicPagesPromise) {
    publicPagesPromise = fetch('/api/public-pages', { cache: 'force-cache' })
      .then(response => response.ok ? response.json() : null)
      .catch(() => null)
  }
  return publicPagesPromise
}

export default function Footer({ siteContent }: { siteContent?: WebsiteContent }) {
  const content = siteContent || DEFAULT_WEBSITE_CONTENT
  const [editorialImages, setEditorialImages] = useState(cachedEditorialBand)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    let active = true
    loadPublicPagesOnce().then(data => {
      if (!active) return
      if (Array.isArray(data?.content?.editorialBand) && data.content.editorialBand.length === 4) {
        cachedEditorialBand = data.content.editorialBand
        setEditorialImages(cachedEditorialBand)
      }
    })
    return () => { active = false }
  }, [])

  const primary = [
    { href: '/jobs', label: content.navigation.jobs },
    { href: '/agency/about', label: content.navigation.agency },
    { href: '/academy', label: content.navigation.academy },
    { href: '/residency', label: content.navigation.residency },
    { href: '/blog', label: content.navigation.blog },
  ]
  const company = [
    { href: '/properties', label: 'Properties' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/advertise', label: 'Advertise' },
    { href: '/coming-soon', label: 'Coming Soon' },
    { href: '/testimonials', label: 'Testimonials' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ]
  const support = [
    { href: '/verify', label: 'Verify a Certificate' },
    { href: '/faq', label: 'FAQ' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms' },
  ]

  const LinkList = ({ items }: { items: { href: string; label: string }[] }) => (
    <div className="space-y-2.5">
      {items.map((link) => (
        <Link key={link.href} href={link.href} className="block text-[12px] text-white/65 hover:text-white transition-colors">
          {link.label}
        </Link>
      ))}
    </div>
  )

  const currentUrl = () => typeof window !== 'undefined' ? window.location.href : 'https://talent.wellnesshousecollective.co.uk'
  const pageTitle = () => typeof document !== 'undefined' ? document.title : 'Wellness House Collective'

  const openShare = (network: 'linkedin' | 'facebook' | 'whatsapp' | 'email') => {
    const url = encodeURIComponent(currentUrl())
    const title = encodeURIComponent(pageTitle())
    const text = encodeURIComponent(`Take a look at this from Wellness House Collective: ${pageTitle()} ${currentUrl()}`)
    const targets = {
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      whatsapp: `https://wa.me/?text=${text}`,
      email: `mailto:?subject=${title}&body=${text}`,
    }
    window.open(targets[network], network === 'email' ? '_self' : '_blank', 'noopener,noreferrer')
  }

  const copyPage = async () => {
    try {
      await navigator.clipboard.writeText(currentUrl())
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {}
  }

  const nativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: pageTitle(), text: 'Wellness House Collective', url: currentUrl() })
        return
      } catch {}
    }
    copyPage()
  }

  return (
    <>
      <section className="bg-white border-t border-[#e3e7eb] overflow-hidden" aria-label="Spa Platform hospitality photography">
        <div className="max-w-[1500px] mx-auto px-0 md:px-6 lg:px-8 py-0 md:py-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-px md:gap-3 bg-[#e3e7eb] md:bg-transparent">
            {editorialImages.map((image, index) => (
              <div key={`${image.url}-${index}`} className="group relative overflow-hidden bg-[#f2f4f6] aspect-[4/5] md:aspect-[3/4]">
                {image.url ? <img src={image.url} alt={image.alt} loading="lazy" decoding="async" fetchPriority="low" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.025]" style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} /> : null}
                <div className="absolute inset-0 bg-gradient-to-t from-[#071d2d]/55 via-transparent to-transparent" />
                <p className="absolute bottom-4 left-4 right-4 text-[9px] md:text-[10px] uppercase tracking-[.16em] font-semibold text-white/90">{image.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-white border-t border-[#e3e7eb] border-b border-[#e3e7eb]" aria-label="Share and follow Wellness House Collective">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 md:py-10 grid lg:grid-cols-2 gap-8 lg:gap-12">
          <div>
            <p className="text-[9px] uppercase tracking-[.2em] font-semibold text-[#6f7f88]">Share this page</p>
            <h2 className="mt-2 text-[24px] md:text-[28px] text-[#10283b]">Worth sharing? Pass it on.</h2>
            <p className="mt-2 text-[12px] leading-5 text-[#65717a] max-w-xl">Share jobs, Academy courses, Residency opportunities, articles or any WHC page directly with your network.</p>
            <div className="flex flex-wrap gap-2 mt-5">
              <button type="button" onClick={() => openShare('linkedin')} className="inline-flex items-center gap-2 border border-[#dfe5e8] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#10283b] hover:bg-[#f7f9fa] transition-colors rounded-lg"><Linkedin size={15}/>LinkedIn</button>
              <button type="button" onClick={() => openShare('facebook')} className="inline-flex items-center gap-2 border border-[#dfe5e8] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#10283b] hover:bg-[#f7f9fa] transition-colors rounded-lg"><Facebook size={15}/>Facebook</button>
              <button type="button" onClick={() => openShare('whatsapp')} className="inline-flex items-center gap-2 border border-[#dfe5e8] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#10283b] hover:bg-[#f7f9fa] transition-colors rounded-lg"><MessageCircle size={15}/>WhatsApp</button>
              <button type="button" onClick={() => openShare('email')} className="inline-flex items-center gap-2 border border-[#dfe5e8] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#10283b] hover:bg-[#f7f9fa] transition-colors rounded-lg"><Mail size={15}/>Email</button>
              <button type="button" onClick={copyPage} className="inline-flex items-center gap-2 border border-[#dfe5e8] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#10283b] hover:bg-[#f7f9fa] transition-colors rounded-lg">{copied ? <Check size={15}/> : <Link2 size={15}/>} {copied ? 'Copied' : 'Copy link'}</button>
              <button type="button" onClick={nativeShare} className="inline-flex items-center gap-2 bg-[#0b2f4d] px-3.5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#123f64] transition-colors rounded-lg"><Share2 size={15}/>More</button>
            </div>
          </div>

          <div className="lg:border-l lg:border-[#e3e7eb] lg:pl-12">
            <p className="text-[9px] uppercase tracking-[.2em] font-semibold text-[#6f7f88]">Connect with WHC</p>
            <h2 className="mt-2 text-[24px] md:text-[28px] text-[#10283b]">Follow the conversation.</h2>
            <p className="mt-2 text-[12px] leading-5 text-[#65717a] max-w-xl">Jobs, industry insight, Academy updates, employer features and new opportunities from Wellness House Collective.</p>
            <div className="grid sm:grid-cols-3 gap-3 mt-5">
              <a href={WHC_LINKEDIN} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 border border-[#dfe5e8] rounded-xl p-4 hover:border-[#aebbc2] hover:bg-[#f7f9fa] transition-all"><div className="h-9 w-9 rounded-lg bg-[#eef2f4] flex items-center justify-center text-[#0b2f4d]"><Linkedin size={17}/></div><div><p className="text-[12px] font-semibold text-[#10283b]">LinkedIn</p><p className="text-[10px] text-[#7d8990] group-hover:text-[#65717a]">Follow WHC</p></div></a>
              <a href={WHC_INSTAGRAM} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 border border-[#dfe5e8] rounded-xl p-4 hover:border-[#aebbc2] hover:bg-[#f7f9fa] transition-all"><div className="h-9 w-9 rounded-lg bg-[#eef2f4] flex items-center justify-center text-[#0b2f4d]"><Instagram size={17}/></div><div><p className="text-[12px] font-semibold text-[#10283b]">Instagram</p><p className="text-[10px] text-[#7d8990] group-hover:text-[#65717a]">Follow WHC</p></div></a>
              <a href={WHC_FACEBOOK} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 border border-[#dfe5e8] rounded-xl p-4 hover:border-[#aebbc2] hover:bg-[#f7f9fa] transition-all"><div className="h-9 w-9 rounded-lg bg-[#eef2f4] flex items-center justify-center text-[#0b2f4d]"><Facebook size={17}/></div><div><p className="text-[12px] font-semibold text-[#10283b]">Facebook</p><p className="text-[10px] text-[#7d8990] group-hover:text-[#65717a]">Follow WHC</p></div></a>
            </div>
          </div>
        </div>
      </section>

      <footer className="bg-[#0b2f4d] text-white border-t border-white/10">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
          <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-9 pb-10">
            <div>
              <Wordmark dark />
              <p className="mt-5 max-w-sm text-[13px] leading-6 text-white/60">Luxury wellness recruitment, agency cover and career opportunities for exceptional professionals and properties.</p>
            </div>
            <div><p className="text-[9px] uppercase tracking-[0.2em] text-white/55 mb-4 font-semibold">Discover</p><LinkList items={primary} /></div>
            <div><p className="text-[9px] uppercase tracking-[0.2em] text-white/55 mb-4 font-semibold">WHC</p><LinkList items={company} /></div>
            <div><p className="text-[9px] uppercase tracking-[0.2em] text-white/55 mb-4 font-semibold">Support</p><LinkList items={support} /></div>
          </div>
          <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
            <p className="text-[11px] text-white/45">{content.footer.copyright}</p>
            <Link href="/admin-sign-in" className="text-[11px] text-white/35 hover:text-white/70 transition-colors" aria-label={`${content.footer.staffLabel} sign in`}>{content.footer.staffLabel}</Link>
          </div>
        </div>
      </footer>
    </>
  )
}
