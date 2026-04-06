import Link from 'next/link'

const links = [
  { href: '/jobs', label: 'Browse Roles' },
  { href: '/agency', label: 'Agency' },
  { href: '/residency', label: 'Residency' },
  { href: '/properties', label: 'Properties' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/blog', label: 'Blog' },
  { href: '/testimonials', label: 'Testimonials' },
  { href: '/faq', label: 'FAQ' },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
  { href: '/privacy', label: 'Privacy Policy' },
  { href: '/terms', label: 'Terms' },
]

export default function Footer() {
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
        <p className="text-neutral-300 text-xs">&copy; 2026 Wellness House Collective</p>
      </div>
    </footer>
  )
}
