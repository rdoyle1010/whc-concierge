'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, Flame, User, ChevronDown, LayoutDashboard, Settings, LogOut, MessageSquare, Briefcase } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const supabase = createClient()

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        // Get role
        supabase.from('profiles').select('role').eq('id', data.user.id).single().then(({ data: p }) => {
          setRole(p?.role || data.user?.user_metadata?.role || 'talent')
        })
      }
    })
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : '?'

  const isEmployer = role === 'employer'
  const isAdmin = role === 'admin'
  const dashboardHref = isAdmin ? '/admin/dashboard' : isEmployer ? '/employer/dashboard' : '/talent/dashboard'
  const profileHref = isEmployer ? '/employer/profile' : '/talent/profile'

  // Nav links based on role
  const navLinks = user
    ? isEmployer
      ? [{ href: '/employer/post-role', label: 'Post a Role' }, { href: '/employer/jobs', label: 'My Listings' }, { href: '/agency', label: 'Agency' }, { href: '/residency', label: 'Residency' }]
      : isAdmin
        ? [{ href: '/admin/users', label: 'Users' }, { href: '/admin/blog', label: 'Blog' }, { href: '/admin/complaints', label: 'Complaints' }]
        : [{ href: '/jobs', label: 'Browse Roles' }, { href: '/roles/match', label: 'Match', icon: true }, { href: '/agency', label: 'Agency' }, { href: '/residency', label: 'Residency' }]
    : [{ href: '/jobs', label: 'Browse Roles' }, { href: '/agency', label: 'Agency' }, { href: '/residency', label: 'Residency' }, { href: '/blog', label: 'Blog' }]

  return (
    <nav className="fixed top-0 w-full z-50 bg-white border-b border-border h-[60px]">
      <div className="max-w-7xl mx-auto px-6 lg:px-8 h-full flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <div className="bg-white px-3 py-2 rounded">
            <Image src="/images/whc-logo.jpg" alt="Wellness House Collective" width={140} height={46} className="h-10 w-auto object-contain" />
          </div>
        </Link>

        {/* Centre nav */}
        <div className="hidden lg:flex items-center gap-6">
          {navLinks.map(link => (
            <Link key={link.href} href={link.href} className="text-[13px] text-muted hover:text-ink transition-colors flex items-center gap-1">
              {(link as any).icon && <Flame size={11} className="text-accent" />}
              <span>{link.label}</span>
            </Link>
          ))}
        </div>

        {/* Right */}
        <div className="hidden lg:flex items-center gap-3">
          {user ? (
            <>
              <NotificationBell userId={user.id} />
              <div className="relative" ref={dropdownRef}>
                <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-1.5 text-muted hover:text-ink transition-colors">
                  <div className="w-7 h-7 bg-surface border border-border rounded-full flex items-center justify-center text-[10px] font-semibold text-muted">{initials}</div>
                  <ChevronDown size={11} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-[200px] bg-white border border-border rounded-lg shadow-lg py-1 animate-fade-in">
                    <Link href={dashboardHref} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><LayoutDashboard size={13} />Dashboard</Link>
                    {!isAdmin && <Link href={profileHref} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><User size={13} />My Profile</Link>}
                    <Link href="/messages" className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><MessageSquare size={13} />Messages</Link>
                    <Link href="/talent/settings" className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><Settings size={13} />Settings</Link>
                    <div className="border-t border-border my-1" />
                    <button type="button" onClick={handleSignOut} className="flex items-center gap-2.5 px-4 py-2 text-[13px] text-secondary hover:bg-surface hover:text-ink w-full"><LogOut size={13} />Sign Out</button>
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
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className="block py-2.5 text-[14px] text-secondary hover:text-ink" onClick={() => setMobileOpen(false)}>{link.label}</Link>
            ))}
            <div className="border-t border-border pt-4 mt-4 space-y-2">
              {user ? (
                <>
                  <Link href={dashboardHref} className="block py-2 text-[14px] text-ink font-medium" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link href="/messages" className="block py-2 text-[14px] text-secondary" onClick={() => setMobileOpen(false)}>Messages</Link>
                  <button type="button" onClick={handleSignOut} className="block py-2 text-[14px] text-muted w-full text-left">Sign Out</button>
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
