'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Wordmark from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, Flame, User, ChevronDown, LayoutDashboard, Settings, LogOut, MessageSquare, Building2, ShieldCheck } from 'lucide-react'
import NotificationBell from '@/components/NotificationBell'
import { DEFAULT_WEBSITE_CONTENT, type WebsiteContent } from '@/lib/site-content'

export default function Navbar({ siteContent }: { siteContent?: WebsiteContent }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [role, setRole] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const pathname = usePathname()
  const supabase = createClient()

  useEffect(() => {
    let active = true
    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      const sessionUser = data.session?.user || null
      setUser(sessionUser)
      if (sessionUser) {
        supabase.from('profiles').select('role').eq('id', sessionUser.id).single().then(({ data: p }) => {
          if (active) setRole(p?.role || null)
        })
      }
    })
    return () => { active = false }
  }, [])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setProfileOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleSignOut = async () => { await supabase.auth.signOut(); window.location.href = '/' }

  const initials = user?.user_metadata?.full_name
    ? user.user_metadata.full_name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
    : ''

  const isEmployer = role === 'employer'
  const isAdmin = role === 'admin'
  const dashboardHref = isAdmin ? '/admin/dashboard' : isEmployer ? '/employer/dashboard' : '/talent/dashboard'
  const profileHref = isEmployer ? '/employer/profile' : '/talent/profile'
  const labels = (siteContent || DEFAULT_WEBSITE_CONTENT).navigation

  const navLinks = user
    ? isEmployer
      ? [
          { href: '/employer/post-role', label: 'Post a Role' },
          { href: '/employer/jobs', label: 'My Listings' },
          { href: '/properties', label: 'Properties' },
          { href: '/agency', label: 'Agency' },
          { href: '/residency', label: 'Residency' },
        ]
      : isAdmin
        ? [{ href: '/admin/users', label: 'Users' }, { href: '/admin/blog', label: 'Blog' }, { href: '/admin/complaints', label: 'Complaints' }]
        : [
            { href: '/jobs', label: 'Browse Roles' },
            { href: '/roles/match', label: 'Match', icon: true },
            { href: '/properties', label: 'Properties' },
            { href: '/talent/agency', label: 'Agency' },
            { href: '/academy', label: 'Academy' },
            { href: '/residency', label: 'Residency' },
          ]
    : [
        { href: '/jobs', label: labels.jobs },
        { href: '/roles/match', label: 'Match', icon: true },
        { href: '/properties', label: 'Properties' },
        { href: '/agency/about', label: labels.agency },
        { href: '/academy', label: labels.academy },
        { href: '/residency', label: labels.residency },
        { href: '/blog', label: labels.blog },
      ]

  const isActive = (href: string) => {
    const path = href.split('?')[0]
    return pathname === path || (path !== '/' && pathname.startsWith(`${path}/`))
  }

  return (
    <nav className="fixed top-0 z-50 h-[72px] w-full border-b border-white/10 bg-[#0b2f4d] text-white shadow-[0_8px_24px_rgba(7,36,59,0.10)]">
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-8 px-6 lg:px-10">
        <div className="shrink-0"><Wordmark dark compact /></div>

        <div className="hidden h-full items-center justify-center lg:flex">
          <div className="flex h-full items-center gap-1">
            {navLinks.map(link => {
              const active = isActive(link.href)
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative flex h-full items-center gap-1.5 px-3.5 text-[11px] font-semibold tracking-[0.015em] transition-colors ${active ? 'text-white' : 'text-white/66 hover:text-white'}`}
                >
                  {(link as any).icon && <Flame size={10} className="text-[#d4b477]" />}
                  <span>{link.label}</span>
                  {active && <span className="absolute inset-x-3 bottom-0 h-[2px] bg-[#d4b477]" />}
                </Link>
              )
            })}
          </div>
        </div>

        <div className="hidden items-center justify-end lg:flex">
          {user ? (
            <>
              <div className="mr-2 border-r border-white/12 pr-3 text-white"><NotificationBell userId={user.id} /></div>
              <div className="relative" ref={dropdownRef}>
                <button type="button" onClick={() => setProfileOpen(!profileOpen)} aria-label="Open account menu"
                  aria-expanded={profileOpen} aria-haspopup="menu" className="flex items-center gap-2 px-1.5 py-1 text-white/75 transition-colors hover:text-white">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/18 bg-white/7 text-[10px] font-semibold text-white">
                    {initials || (isAdmin ? <ShieldCheck size={15} /> : isEmployer ? <Building2 size={15} /> : <User size={15} />)}
                  </div>
                  <ChevronDown size={11} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-[210px] overflow-hidden border border-border bg-white py-1.5 text-ink shadow-xl animate-fade-in">
                    <Link href={dashboardHref} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><LayoutDashboard size={13} />Dashboard</Link>
                    {!isAdmin && <Link href={profileHref} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><User size={13} />My Profile</Link>}
                    <Link href={isEmployer ? '/employer/messages' : isAdmin ? '/admin/messages' : '/talent/messages'} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><MessageSquare size={13} />Messages</Link>
                    <Link href={isEmployer ? '/employer/settings' : isAdmin ? '/admin/settings' : '/talent/settings'} className="flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-secondary hover:bg-surface hover:text-ink" onClick={() => setProfileOpen(false)}><Settings size={13} />Settings</Link>
                    <div className="my-1 border-t border-border" />
                    <button type="button" onClick={handleSignOut} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-[13px] text-secondary hover:bg-surface hover:text-ink"><LogOut size={13} />Sign Out</button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-stretch border border-white/18">
              <Link href="/login?role=talent" className="px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/78 transition-colors hover:bg-white/8 hover:text-white">For Talent</Link>
              <span className="w-px bg-white/15" />
              <Link href="/login?role=employer" className="bg-[#c9a96e] px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#0b2f4d] transition-colors hover:bg-[#d4b477]">For Properties</Link>
            </div>
          )}
        </div>

        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="col-start-3 rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-navigation" className="border-t border-white/10 bg-[#0b2f4d] lg:hidden">
          <div className="space-y-1 px-6 py-5">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className={`block border-b border-white/8 px-1 py-3 text-[13px] font-medium ${isActive(link.href) ? 'text-white' : 'text-white/70 hover:text-white'}`} onClick={() => setMobileOpen(false)}>{link.label}</Link>
            ))}
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              {user ? (
                <>
                  <Link href={dashboardHref} className="block px-1 py-2 text-[13px] font-medium text-white" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link href={isEmployer ? '/employer/messages' : isAdmin ? '/admin/messages' : '/talent/messages'} className="block px-1 py-2 text-[13px] text-white/70" onClick={() => setMobileOpen(false)}>Messages</Link>
                  <button type="button" onClick={handleSignOut} className="block w-full px-1 py-2 text-left text-[13px] text-white/70">Sign Out</button>
                </>
              ) : (
                <div className="grid grid-cols-2 border border-white/18">
                  <Link href="/login?role=talent" className="px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-white" onClick={() => setMobileOpen(false)}>For Talent</Link>
                  <Link href="/login?role=employer" className="bg-[#c9a96e] px-3 py-3 text-center text-[10px] font-semibold uppercase tracking-[0.1em] text-[#0b2f4d]" onClick={() => setMobileOpen(false)}>For Properties</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
