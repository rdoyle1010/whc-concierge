'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, Flame } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/jobs', label: 'Browse Roles' },
    { href: '/roles/match', label: 'Match', icon: true },
    { href: '/specialisms', label: 'Specialisms' },
    { href: '/properties', label: 'Properties' },
    { href: '/agency', label: 'Agency' },
    { href: '/residency', label: 'Residency' },
    { href: '/pricing', label: 'Pricing' },
    { href: '/blog', label: 'Blog' },
    { href: '/contact', label: 'Contact' },
  ]

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-sm border-b border-neutral-100' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Wordmark */}
          <Link href="/" className="text-black font-semibold text-lg tracking-tight">
            WHC Concierge
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-7">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="text-neutral-500 hover:text-black text-[13px] font-normal tracking-wide transition-colors flex items-center space-x-1">
                {link.icon && <Flame size={12} className="text-neutral-400" />}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Auth */}
          <div className="hidden lg:flex items-center space-x-5">
            {user ? (
              <>
                <Link href="/talent/dashboard" className="text-neutral-500 hover:text-black text-[13px] tracking-wide transition-colors">Dashboard</Link>
                <button onClick={handleSignOut} className="text-neutral-500 hover:text-black text-[13px] tracking-wide transition-colors">Sign Out</button>
              </>
            ) : (
              <>
                <Link href="/login?role=talent" className="text-neutral-500 hover:text-black text-[13px] tracking-wide transition-colors">Talent Sign In</Link>
                <Link href="/login?role=employer" className="border border-black text-black px-4 py-2 text-[13px] tracking-wide hover:bg-black hover:text-white transition-colors">Hotel Sign In</Link>
              </>
            )}
          </div>

          {/* Mobile */}
          <button onClick={() => setOpen(!open)} className="lg:hidden text-black">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-white border-t border-neutral-100">
          <div className="px-4 py-6 space-y-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="block py-2.5 text-neutral-600 hover:text-black text-sm transition-colors"
                onClick={() => setOpen(false)}>
                {link.icon ? <span className="flex items-center space-x-2"><Flame size={12} /><span>{link.label}</span></span> : link.label}
              </Link>
            ))}
            <div className="pt-4 mt-4 border-t border-neutral-100 space-y-2">
              {user ? (
                <>
                  <Link href="/talent/dashboard" className="block py-2 text-sm text-black font-medium" onClick={() => setOpen(false)}>Dashboard</Link>
                  <button onClick={handleSignOut} className="block py-2 text-sm text-neutral-500">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/login?role=talent" className="block py-2 text-sm text-black" onClick={() => setOpen(false)}>Talent Sign In</Link>
                  <Link href="/login?role=employer" className="btn-primary block text-center" onClick={() => setOpen(false)}>Hotel Sign In</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
