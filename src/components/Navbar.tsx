'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, ChevronDown } from 'lucide-react'

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [scrolled, setScrolled] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user))
    const handleScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-ink/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full gold-gradient flex items-center justify-center">
              <span className="text-white font-serif font-bold text-lg">W</span>
            </div>
            <span className="text-white font-serif text-xl font-semibold tracking-wide">
              WHC Concierge
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center space-x-8">
            <Link href="/" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Home</Link>
            <Link href="/jobs" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Browse Roles</Link>
            <Link href="/specialisms" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Specialisms</Link>
            <Link href="/properties" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Properties</Link>
            <Link href="/agency" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Agency</Link>
            <Link href="/residency" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Residency</Link>
            <Link href="/pricing" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Pricing</Link>
            <Link href="/blog" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Blog</Link>
            <Link href="/contact" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Contact</Link>
          </div>

          {/* Auth Buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/talent/dashboard" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Dashboard</Link>
                <button onClick={handleSignOut} className="btn-secondary text-sm !py-2 !px-4">Sign Out</button>
              </div>
            ) : (
              <>
                <Link href="/login?role=talent" className="text-white/80 hover:text-gold text-sm font-medium transition-colors">Talent Sign In</Link>
                <Link href="/login?role=employer" className="btn-primary text-sm !py-2 !px-4">Hotel Sign In</Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button onClick={() => setOpen(!open)} className="lg:hidden text-white">
            {open ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {open && (
        <div className="lg:hidden bg-ink/95 backdrop-blur-md border-t border-white/10">
          <div className="px-4 py-6 space-y-4">
            <Link href="/" className="block text-white/80 hover:text-gold py-2" onClick={() => setOpen(false)}>Home</Link>
            <Link href="/jobs" className="block text-white/80 hover:text-gold py-2" onClick={() => setOpen(false)}>Browse Roles</Link>
            <Link href="/specialisms" className="block text-white/80 hover:text-gold py-2" onClick={() => setOpen(false)}>Specialisms</Link>
            <Link href="/properties" className="block text-white/80 hover:text-gold py-2" onClick={() => setOpen(false)}>Properties</Link>
            <Link href="/agency" className="block text-white/80 hover:text-gold py-2" onClick={() => setOpen(false)}>Agency</Link>
            <Link href="/residency" className="block text-white/80 hover:text-gold py-2" onClick={() => setOpen(false)}>Residency</Link>
            <Link href="/pricing" className="block text-white/80 hover:text-gold py-2" onClick={() => setOpen(false)}>Pricing</Link>
            <Link href="/blog" className="block text-white/80 hover:text-gold py-2" onClick={() => setOpen(false)}>Blog</Link>
            <Link href="/contact" className="block text-white/80 hover:text-gold py-2" onClick={() => setOpen(false)}>Contact</Link>
            <hr className="border-white/10" />
            {user ? (
              <>
                <Link href="/talent/dashboard" className="block text-gold py-2" onClick={() => setOpen(false)}>Dashboard</Link>
                <button onClick={handleSignOut} className="btn-secondary w-full text-sm">Sign Out</button>
              </>
            ) : (
              <div className="space-y-3">
                <Link href="/login?role=talent" className="block btn-secondary text-center text-sm" onClick={() => setOpen(false)}>Talent Sign In</Link>
                <Link href="/login?role=employer" className="block btn-primary text-center text-sm" onClick={() => setOpen(false)}>Hotel Sign In</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
