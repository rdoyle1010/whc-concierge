'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
// These four tiles sit in the footer of every page. As raw <img> they pulled
// the full 2400px original from storage for a card a few hundred pixels wide -
// about 760KB per page load, and the largest single item on a Lighthouse run.
import Image from 'next/image'
import Wordmark from '@/components/Wordmark'
import type { WebsiteContent } from '@/lib/site-content'
import { usePublicSiteContent } from '@/lib/use-site-content'
import { DEFAULT_PUBLIC_PAGES_CONTENT } from '@/lib/public-page-content-values'
import { SOCIAL_LINKS } from '@/lib/social-links'
import { Linkedin, Instagram, Facebook, MessageCircle, Mail, Link2, Share2, Check, Youtube, Music2 } from 'lucide-react'

const DEFAULT_SOCIAL = {
  linkedin_url: SOCIAL_LINKS.linkedin,
  instagram_url: SOCIAL_LINKS.instagram,
  facebook_url: SOCIAL_LINKS.facebook,
  tiktok_url: '',
  youtube_url: '',
}

let cachedEditorialBand = DEFAULT_PUBLIC_PAGES_CONTENT.editorialBand
let publicPagesPromise: Promise<any> | null = null

// Both of these serve content an administrator edits, so neither may be asked
// for with force-cache. That setting tells the browser to reuse a stored
// response whether or not it is still fresh, so a change made in admin could
// sit behind a stale copy in somebody's browser long after it was published.
//
// Neither is asked for with no-store either, which was the other extreme: it
// forbids the browser from keeping the response at all, so every page a
// visitor opened paid a fresh round trip for four image URLs and a handful of
// social links. Asked for plainly, each endpoint's own Cache-Control decides,
// which is what that header was written to do.
function loadPublicPagesOnce() {
  if (!publicPagesPromise) {
    publicPagesPromise = fetch('/api/public-pages').then(response => response.ok ? response.json() : null).catch(() => null)
  }
  return publicPagesPromise
}

export default function Footer({ siteContent }: { siteContent?: WebsiteContent }) {
  const content = usePublicSiteContent(siteContent)
  const [editorialImages, setEditorialImages] = useState(cachedEditorialBand)
  const [copied, setCopied] = useState(false)
  const [social, setSocial] = useState(DEFAULT_SOCIAL)
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [newsletterHoneypot, setNewsletterHoneypot] = useState('')
  const [newsletterState, setNewsletterState] = useState<'idle' | 'sending' | 'success' | 'error'>('idle')
  const [newsletterError, setNewsletterError] = useState('')

  const subscribeToNewsletter = async (event: React.FormEvent) => {
    event.preventDefault()
    if (newsletterState === 'sending') return
    setNewsletterState('sending'); setNewsletterError('')
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newsletterEmail.trim(), company: newsletterHoneypot }),
      })
      const json = await res.json().catch(() => null)
      if (!res.ok) { setNewsletterState('error'); setNewsletterError(json?.error || 'Something went wrong. Please try again.'); return }
      setNewsletterState('success'); setNewsletterEmail('')
    } catch {
      setNewsletterState('error'); setNewsletterError('Something went wrong. Please try again.')
    }
  }

  useEffect(() => {
    let active = true
    loadPublicPagesOnce().then(data => {
      if (!active) return
      if (Array.isArray(data?.content?.editorialBand) && data.content.editorialBand.length === 4) {
        cachedEditorialBand = data.content.editorialBand
        setEditorialImages(cachedEditorialBand)
      }
    })
    fetch('/api/public-social-links').then(async response => response.ok ? response.json() : null).then(data => {
      if (!active || !data?.links) return
      setSocial({ ...DEFAULT_SOCIAL, ...data.links })
    }).catch(() => {})
    return () => { active = false }
  }, [])

  // Everything the platform does, whether or not it is in the header.
  //
  // The header now carries seven, because two of the nine led somewhere
  // effectively empty and a nav that overpromises costs more than a short one
  // does. This is where the full map lives instead: nothing is unreachable, a
  // crawler finds every page, and an orphan page earns no internal link
  // equity however good the copy on it is.
  const primary = [
    { href: '/jobs', label: content.navigation.jobs },
    { href: '/agency/about', label: content.navigation.agency },
    { href: '/residency', label: content.navigation.residency },
    { href: '/standards', label: 'Standards' },
    { href: '/academy', label: content.navigation.academy },
    { href: '/events', label: 'Events' },
    { href: '/consultancy', label: 'Consultancy' },
    { href: '/intelligence', label: 'Intelligence' },
    { href: '/blog', label: content.navigation.blog },
  ]
  // Specialisms and How It Works were in the sitemap and in nobody's reach:
  // a crawler could find them, a visitor could not, and an orphan page earns
  // no internal link equity however good the copy on it is.
  const company = [
    { href: '/properties', label: 'Properties' }, { href: '/brands', label: 'Brands' },
    { href: '/specialisms', label: 'Specialisms' }, { href: '/pricing', label: 'Pricing' }, { href: '/advertise', label: 'Advertise' },
    { href: '/coming-soon', label: 'Coming Soon' }, { href: '/testimonials', label: 'Testimonials' }, { href: '/about', label: 'About' }, { href: '/contact', label: 'Contact' },
  ]
  const support = [
    { href: '/good-to-know', label: 'Good to Know' },
    { href: '/verify', label: 'Verify a Certificate' }, { href: '/how-to-use', label: 'How It Works' }, { href: '/match', label: 'How Matching Works' }, { href: '/faq', label: 'FAQ' }, { href: '/privacy', label: 'Privacy Policy' }, { href: '/terms', label: 'Terms' },
  ]

  // Footer rows were about nineteen pixels tall on a phone, which is a fiddly
  // target for a thumb and a row of near-misses for anybody with shaky hands.
  // The link box is now forty-four; the spacing between rows carries the look,
  // so nothing appears further apart than before.
  const LinkList = ({ items }: { items: { href: string; label: string }[] }) => <div>{items.map(link => <Link key={link.href} href={link.href} className="flex min-h-11 items-center text-[12px] text-secondary hover:text-ink transition-colors">{link.label}</Link>)}</div>

  const currentUrl = () => typeof window !== 'undefined' ? window.location.href : 'https://talenthousecollective.co.uk'
  const pageTitle = () => typeof document !== 'undefined' ? document.title : 'Talent House Collective'
  const openShare = (network: 'linkedin' | 'facebook' | 'whatsapp' | 'email') => {
    const url = encodeURIComponent(currentUrl()); const title = encodeURIComponent(pageTitle()); const text = encodeURIComponent(`Take a look at this from Talent House Collective: ${pageTitle()} ${currentUrl()}`)
    const targets = { linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${url}`, facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`, whatsapp: `https://wa.me/?text=${text}`, email: `mailto:?subject=${title}&body=${text}` }
    window.open(targets[network], network === 'email' ? '_self' : '_blank', 'noopener,noreferrer')
  }
  const copyPage = async () => { try { await navigator.clipboard.writeText(currentUrl()); setCopied(true); window.setTimeout(() => setCopied(false), 1800) } catch {} }
  const nativeShare = async () => { if (navigator.share) { try { await navigator.share({ title: pageTitle(), text: 'Talent House Collective', url: currentUrl() }); return } catch {} } copyPage() }

  const socialCards = [
    { key:'linkedin', label:'LinkedIn', url:social.linkedin_url, icon:<Linkedin size={17}/> },
    { key:'instagram', label:'Instagram', url:social.instagram_url, icon:<Instagram size={17}/> },
    { key:'facebook', label:'Facebook', url:social.facebook_url, icon:<Facebook size={17}/> },
    { key:'tiktok', label:'TikTok', url:social.tiktok_url, icon:<Music2 size={17}/> },
    { key:'youtube', label:'YouTube', url:social.youtube_url, icon:<Youtube size={17}/> },
  ].filter(item => item.url)

  return <>
    <section className="bg-white border-t border-[#dcd4c8] overflow-hidden" aria-label="Talent House Collective hospitality photography">
      <div className="max-w-[1500px] mx-auto px-0 md:px-6 lg:px-8 py-0 md:py-8"><div className="grid grid-cols-2 lg:grid-cols-4 gap-px md:gap-3 bg-[#dcd4c8] md:bg-transparent">{editorialImages.map((image, index) => <div key={`${image.url}-${index}`} className="group relative overflow-hidden bg-[#ede8df] aspect-[4/5] md:aspect-[3/4]">{image.url ? <Image src={image.url} alt={image.alt} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover transition-transform duration-700 group-hover:scale-[1.025]" style={{ objectPosition: `${image.focalX}% ${image.focalY}%` }} /> : null}<div className="absolute inset-0 bg-gradient-to-t from-[#161814]/80 via-[#161814]/25 to-transparent" /><p className="absolute bottom-4 left-4 right-4 text-[9px] md:text-[10px] uppercase tracking-[.16em] font-semibold text-white [text-shadow:0_1px_3px_rgba(15,15,15,.65)]">{image.label}</p></div>)}</div></div>
    </section>

    <section className="bg-white border-t border-[#dcd4c8] border-b border-[#dcd4c8]" aria-label="Share and follow Talent House Collective">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-8 md:py-10 grid lg:grid-cols-2 gap-8 lg:gap-12">
        <div><p className="text-[9px] uppercase tracking-[.2em] font-semibold text-[#57544c]">Share this page</p><h2 className="mt-2 text-[24px] md:text-[28px] text-[#222321]">Worth sharing? Pass it on.</h2><p className="mt-2 text-[12px] leading-5 text-[#57544c] max-w-xl">Share jobs, Academy courses, Residency opportunities, articles or any Talent House page directly with your network.</p><div className="flex flex-wrap gap-2 mt-5"><button type="button" onClick={() => openShare('linkedin')} className="inline-flex items-center gap-2 border border-[#dcd4c8] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#222321] hover:bg-[#ede8df] transition-colors rounded-lg"><Linkedin size={15}/>LinkedIn</button><button type="button" onClick={() => openShare('facebook')} className="inline-flex items-center gap-2 border border-[#dcd4c8] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#222321] hover:bg-[#ede8df] transition-colors rounded-lg"><Facebook size={15}/>Facebook</button><button type="button" onClick={() => openShare('whatsapp')} className="inline-flex items-center gap-2 border border-[#dcd4c8] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#222321] hover:bg-[#ede8df] transition-colors rounded-lg"><MessageCircle size={15}/>WhatsApp</button><button type="button" onClick={() => openShare('email')} className="inline-flex items-center gap-2 border border-[#dcd4c8] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#222321] hover:bg-[#ede8df] transition-colors rounded-lg"><Mail size={15}/>Email</button><button type="button" onClick={copyPage} className="inline-flex items-center gap-2 border border-[#dcd4c8] bg-white px-3.5 py-2.5 text-[12px] font-semibold text-[#222321] hover:bg-[#ede8df] transition-colors rounded-lg">{copied ? <Check size={15}/> : <Link2 size={15}/>} {copied ? 'Copied' : 'Copy link'}</button><button type="button" onClick={nativeShare} className="inline-flex items-center gap-2 bg-[#222321] px-3.5 py-2.5 text-[12px] font-semibold text-white hover:bg-[#3a4239] transition-colors rounded-lg"><Share2 size={15}/>More</button></div></div>

        <div className="lg:border-l lg:border-[#dcd4c8] lg:pl-12"><p className="text-[9px] uppercase tracking-[.2em] font-semibold text-[#57544c]">Connect with Talent House</p><h2 className="mt-2 text-[24px] md:text-[28px] text-[#222321]">Follow the conversation.</h2><p className="mt-2 text-[12px] leading-5 text-[#57544c] max-w-xl">Jobs, industry insight, Academy updates, employer features and new opportunities from Talent House Collective.</p>{socialCards.length ? <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-3 mt-5">{socialCards.map(item => <a key={item.key} href={item.url} target="_blank" rel="noopener noreferrer" className="group flex items-center gap-3 border border-[#dcd4c8] rounded-xl p-4 hover:border-[#6e6a60] hover:bg-[#ede8df] transition-all"><div className="h-9 w-9 rounded-lg bg-[#e3dcd1] flex items-center justify-center text-[#222321]">{item.icon}</div><div><p className="text-[12px] font-semibold text-[#222321]">{item.label}</p><p className="text-[10px] text-[#6e6a60] group-hover:text-[#57544c]">View public profile</p></div></a>)}</div> : <p className="mt-5 text-[12px] text-[#6e6a60]">Public social profiles will appear here when added by Talent House Admin.</p>}</div>
      </div>
    </section>

    <footer className="bg-[#ede8df] text-ink border-t border-[#dcd4c8]"><div className="max-w-7xl mx-auto px-6 lg:px-8 py-12"><div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-9 pb-10"><div><Wordmark /><p className="mt-5 max-w-sm text-[13px] leading-6 text-secondary">The professional platform for spa and wellness careers. Live roles, agency cover, residencies and the Academy.</p>
    <div className="mt-7 max-w-sm">
      <p className="text-[9px] uppercase tracking-[0.2em] text-secondary font-semibold">Join our mailing list</p>
      <p className="mt-2 text-[12px] leading-5 text-secondary">Jobs, industry insight and opportunities from Talent House Collective, straight to your inbox.</p>
      {newsletterState === 'success' ? (
        <p role="status" className="mt-3 text-[12px] font-semibold text-body">Check your inbox to confirm your subscription.</p>
      ) : (
        <form onSubmit={subscribeToNewsletter} className="mt-3">
          <div className="flex gap-2">
            <label htmlFor="footer-newsletter-email" className="sr-only">Email address</label>
            <input
              id="footer-newsletter-email"
              type="email"
              required
              value={newsletterEmail}
              onChange={e => setNewsletterEmail(e.target.value)}
              placeholder="Your email address"
              autoComplete="email"
              className="flex-1 min-w-0 rounded-lg border border-[#dcd4c8] bg-[#e3dcd1] px-3.5 py-2.5 text-[12px] text-ink placeholder:text-muted focus:outline-none focus:border-[#dcd4c8] transition-colors"
            />
            <button type="submit" disabled={newsletterState === 'sending'} className="shrink-0 rounded-lg bg-ink px-4 py-2.5 text-[12px] font-semibold text-white hover:bg-[#3a4239] transition-colors disabled:opacity-60">
              {newsletterState === 'sending' ? 'Sending...' : 'Subscribe'}
            </button>
          </div>
          <input type="text" name="company" value={newsletterHoneypot} onChange={e => setNewsletterHoneypot(e.target.value)} tabIndex={-1} autoComplete="off" aria-hidden="true" className="hidden" />
          {newsletterState === 'error' && <p role="alert" className="mt-2 text-[11.5px] text-secondary">{newsletterError}</p>}
        </form>
      )}
    </div>
    </div><div><p className="text-[9px] uppercase tracking-[0.2em] text-secondary mb-4 font-semibold">Discover</p><LinkList items={primary} /></div><div><p className="text-[9px] uppercase tracking-[0.2em] text-secondary mb-4 font-semibold">Talent House</p><LinkList items={company} /></div><div><p className="text-[9px] uppercase tracking-[0.2em] text-secondary mb-4 font-semibold">Support</p><LinkList items={support} /></div></div><div className="border-t border-[#dcd4c8] pt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between"><p className="text-[11px] text-muted">{content.footer.copyright}</p><Link href="/admin-sign-in" className="inline-flex min-h-11 items-center text-[11px] text-muted hover:text-ink transition-colors" aria-label={`${content.footer.staffLabel} sign in`}>{content.footer.staffLabel}</Link></div></div></footer>
  </>
}
