import Link from 'next/link'
import { DEFAULT_WEBSITE_CONTENT, type WebsiteContent } from '@/lib/site-content'

export default function Footer({ siteContent }: { siteContent?: WebsiteContent }) {
  const content = siteContent || DEFAULT_WEBSITE_CONTENT
  const links = [
    { href: '/jobs', label: content.navigation.jobs },
    { href: '/agency', label: content.navigation.agency },
    { href: '/academy', label: content.navigation.academy },
    { href: '/verify', label: 'Verify a Certificate' },
    { href: '/residency', label: content.navigation.residency },
    { href: '/properties', label: 'Properties' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/advertise', label: 'Advertise' },
    { href: '/blog', label: content.navigation.blog },
    { href: '/testimonials', label: 'Testimonials' },
    { href: '/faq', label: 'FAQ' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
    { href: '/privacy', label: 'Privacy Policy' },
    { href: '/terms', label: 'Terms' },
  ]
  return (
    <footer className="bg-white border-t border-neutral-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-neutral-400 hover:text-black text-xs tracking-wide transition-colors">
              {link.label}
            </Link>
          ))}
        </div>
        <p className="text-neutral-300 text-xs">
          {content.footer.copyright}
          <Link href="/login" className="ml-3 text-neutral-300 hover:text-neutral-500 text-[10px] transition-colors" aria-label="Staff sign in">{content.footer.staffLabel}</Link>
        </p>
      </div>
    </footer>
  )
}
