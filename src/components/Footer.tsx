import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import { DEFAULT_WEBSITE_CONTENT, type WebsiteContent } from '@/lib/site-content'

export default function Footer({ siteContent }: { siteContent?: WebsiteContent }) {
  const content = siteContent || DEFAULT_WEBSITE_CONTENT
  const primary = [
    { href: '/jobs', label: content.navigation.jobs },
    { href: '/agency', label: content.navigation.agency },
    { href: '/academy', label: content.navigation.academy },
    { href: '/residency', label: content.navigation.residency },
    { href: '/blog', label: content.navigation.blog },
  ]
  const company = [
    { href: '/properties', label: 'Properties' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/advertise', label: 'Advertise' },
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

  return (
    <footer className="bg-[#0b2f4d] text-white border-t border-white/10">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-[1.4fr_1fr_1fr_1fr] gap-9 pb-10">
          <div>
            <Wordmark dark />
            <p className="mt-5 max-w-sm text-[13px] leading-6 text-white/60">Luxury wellness recruitment, agency cover and career opportunities for exceptional professionals and properties.</p>
          </div>
          <div><p className="text-[9px] uppercase tracking-[0.2em] text-[#d4b477] mb-4 font-semibold">Discover</p><LinkList items={primary} /></div>
          <div><p className="text-[9px] uppercase tracking-[0.2em] text-[#d4b477] mb-4 font-semibold">WHC</p><LinkList items={company} /></div>
          <div><p className="text-[9px] uppercase tracking-[0.2em] text-[#d4b477] mb-4 font-semibold">Support</p><LinkList items={support} /></div>
        </div>
        <div className="border-t border-white/10 pt-5 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <p className="text-[11px] text-white/45">{content.footer.copyright}</p>
          <Link href="/admin-sign-in" className="text-[11px] text-white/35 hover:text-white/70 transition-colors" aria-label="Staff sign in">Staff</Link>
        </div>
      </div>
    </footer>
  )
}
