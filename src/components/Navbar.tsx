'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, Flame, MessageSquare, User, ChevronDown, LayoutDashboard, Settings, LogOut } from 'lucide-react'

const publicLinks = [
  { href: '/', label: 'Home' },
  { href: '/jobs', label: 'Browse Roles' },
  { href: '/roles/match', label: 'Match', icon: true },
  { href: '/agency', label: 'Agency' },
  { href: '/residency', label: 'Residency' },
  { href: '/blog', label: 'Blog' },
]

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [unread, setUnread] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        // Check unread messages
        supabase.from('messages').select('id', { count: 'exact', head: true })
          .eq('receiver_id', data.user.id).eq('read', false)
          .then(({ count }) => setUnread(count || 0))
      }
    })
    const handleScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-white/95 backdrop-blur-sm border-b border-neutral-100' : 'bg-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Wordmark */}
          <Link href="/" className="text-black font-semibold text-lg tracking-tight flex-shrink-0">
            WHC Concierge
          </Link>

          {/* Centre nav — desktop */}
          <div className="hidden lg:flex items-center space-x-7">
            {publicLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="text-neutral-500 hover:text-black text-[13px] font-normal tracking-wide transition-colors flex items-center space-x-1">
                {link.icon && <Flame size={12} className="text-neutral-400" />}
                <span>{link.label}</span>
              </Link>
            ))}
          </div>

          {/* Right side — desktop */}
          <div className="hidden lg:flex items-center space-x-4">
            {user ? (
              <>
                {/* Messages */}
                <Link href="/messages" className="relative text-neutral-500 hover:text-black transition-colors p-1">
                  <MessageSquare size={18} />
                  {unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>
                  )}
                </Link>

                {/* Profile dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center space-x-1.5 text-neutral-500 hover:text-black transition-colors">
                    <div className="w-7 h-7 bg-neutral-100 rounded-full flex items-center justify-center">
                      <User size={14} className="text-neutral-400" />
                    </div>
                    <ChevronDown size={12} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                  </button>

                  {profileOpen && (
                    <div className="absolute right-0 mt-2 w-48 bg-white border border-neutral-200 shadow-lg py-1 animate-fade-in">
                      <Link href="/talent/dashboard" className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors" onClick={() => setProfileOpen(false)}>
                        <LayoutDashboard size={14} /><span>Dashboard</span>
                      </Link>
                      <Link href="/talent/profile" className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors" onClick={() => setProfileOpen(false)}>
                        <User size={14} /><span>My Profile</span>
                      </Link>
                      <Link href="/talent/settings" className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors" onClick={() => setProfileOpen(false)}>
                        <Settings size={14} /><span>Settings</span>
                      </Link>
                      <div className="border-t border-neutral-100 my-1" />
                      <button onClick={handleSignOut} className="flex items-center space-x-2.5 px-4 py-2.5 text-sm text-neutral-600 hover:bg-neutral-50 hover:text-black transition-colors w-full text-left">
                        <LogOut size={14} /><span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/login?role=talent" className="text-neutral-500 hover:text-black text-[13px] font-medium tracking-wide transition-colors border border-neutral-300 px-4 py-2 hover:border-black">
                  Talent Sign In
                </Link>
                <Link href="/login?role=employer" className="bg-black text-white text-[13px] font-medium tracking-wide px-4 py-2 hover:bg-neutral-800 transition-colors">
                  Hotel Sign In
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-black">
            {mobileOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-neutral-100">
          <div className="px-4 py-5 space-y-1">
            {publicLinks.map((link) => (
              <Link key={link.href} href={link.href}
                className="block py-2.5 text-neutral-600 hover:text-black text-sm transition-colors"
                onClick={() => setMobileOpen(false)}>
                {link.icon ? <span className="flex items-center space-x-2"><Flame size={12} /><span>{link.label}</span></span> : link.label}
              </Link>
            ))}

            <div className="border-t border-neutral-100 pt-4 mt-4 space-y-2">
              {user ? (
                <>
                  <Link href="/messages" className="block py-2.5 text-sm text-neutral-600 hover:text-black flex items-center space-x-2" onClick={() => setMobileOpen(false)}>
                    <MessageSquare size={14} /><span>Messages</span>
                    {unread > 0 && <span className="w-4 h-4 bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center">{unread}</span>}
                  </Link>
                  <Link href="/talent/dashboard" className="block py-2.5 text-sm text-neutral-600 hover:text-black" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link href="/talent/profile" className="block py-2.5 text-sm text-neutral-600 hover:text-black" onClick={() => setMobileOpen(false)}>My Profile</Link>
                  <Link href="/talent/settings" className="block py-2.5 text-sm text-neutral-600 hover:text-black" onClick={() => setMobileOpen(false)}>Settings</Link>
                  <button onClick={handleSignOut} className="block py-2.5 text-sm text-neutral-400 hover:text-black w-full text-left">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/login?role=talent" className="btn-secondary block text-center text-sm" onClick={() => setMobileOpen(false)}>Talent Sign In</Link>
                  <Link href="/login?role=employer" className="btn-primary block text-center text-sm" onClick={() => setMobileOpen(false)}>Hotel Sign In</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
