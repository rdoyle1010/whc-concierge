'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, Flame, Bell, User, ChevronDown, LayoutDashboard, Settings, LogOut, MessageSquare } from 'lucide-react'

const NAV_LINKS = [
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
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase.from('messages').select('id', { count: 'exact', head: true })
          .eq('receiver_id', data.user.id).eq('read', false)
          .then(({ count }) => setUnread(count || 0))
      }
    })
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : '?'

  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-border h-[60px]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
        <Link href="/" className="text-ink font-semibold text-[16px] tracking-tight shrink-0">WHC Concierge</Link>

        {/* Centre */}
        <div className="hidden lg:flex items-center gap-6">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-[13px] text-muted hover:text-ink transition-colors flex items-center gap-1">
              {link.icon && <Flame size={11} className="text-muted" />}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <Link href="/messages" className="relative p-2 text-muted hover:text-ink transition-colors">
                <Bell size={17} />
                {unread > 0 && <span className="absolute top-0.5 right-0.5 w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
              </Link>
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-1.5 text-muted hover:text-ink transition-colors">
                  <div className="w-7 h-7 bg-surface border border-border rounded-full flex items-center justify-center text-[10px] font-semibold text-muted">{initials}</div>
                  <ChevronDown size={11} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-[200px] bg-white border border-border rounded-lg shadow-lg py-1 animate-fade-in">
                    <Link href="/talent/dashboard" className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><LayoutDashboard size={13} />Dashboard</Link>
                    <Link href="/talent/profile" className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><User size={13} />My Profile</Link>
                    <Link href="/messages" className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><MessageSquare size={13} />Messages</Link>
                    <Link href="/talent/settings" className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><Settings size={13} />Settings</Link>
                    <div className="border-t border-border my-1" />
                    <button onClick={handleSignOut} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-secondary hover:bg-surface hover:text-ink w-full"><LogOut size={13} />Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <Link href="/login?role=talent" className="btn-secondary !py-2 !px-4">Talent Sign In</Link>
              <Link href="/login?role=employer" className="btn-primary !py-2 !px-4">Hotel Sign In</Link>
            </>
          )}
        </div>

        <button onClick={() => setMobileOpen(!mobileOpen)} className="lg:hidden text-ink">{mobileOpen ? <X size={20} /> : <Menu size={20} />}</button>
      </div>

      {mobileOpen && (
        <div className="lg:hidden bg-white border-t border-border">
          <div className="px-6 py-5 space-y-1">
            {NAV_LINKS.map((link) => (
              <Link key={link.href} href={link.href} className="block py-2.5 text-[14px] text-secondary hover:text-ink" onClick={() => setMobileOpen(false)}>{link.label}</Link>
            ))}
            <div className="border-t border-border pt-4 mt-4 space-y-2">
              {user ? (
                <>
                  <Link href="/talent/dashboard" className="block py-2 text-[14px] text-ink font-medium" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link href="/messages" className="block py-2 text-[14px] text-secondary" onClick={() => setMobileOpen(false)}>Messages</Link>
                  <button onClick={handleSignOut} className="block py-2 text-[14px] text-muted w-full text-left">Sign Out</button>
                </>
              ) : (
                <><Link href="/login?role=talent" className="btn-secondary block text-center" onClick={() => setMobileOpen(false)}>Talent Sign In</Link>
                <Link href="/login?role=employer" className="btn-primary block text-center mt-2" onClick={() => setMobileOpen(false)}>Hotel Sign In</Link></>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
