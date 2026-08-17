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
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user)
      if (data.user) {
        supabase.from('profiles').select('role').eq('id', data.user.id).single().then(({ data: p }) => {
          setRole(p?.role || null)
        })
      }
    })
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
            { href: '/agency', label: 'Agency' },
            { href: '/academy', label: 'Academy' },
            { href: '/residency', label: 'Residency' },
          ]
    : [
        { href: '/jobs', label: labels.jobs },
        { href: '/roles/match', label: 'Match', icon: true },
        { href: '/properties', label: 'Properties' },
        { href: '/agency', label: labels.agency },
        { href: '/academy', label: labels.academy },
        { href: '/residency', label: labels.residency },
        { href: '/blog', label: labels.blog },
      ]

  const isActive = (href: string) => {
    const path = href.split('?')[0]
    return pathname === path || (path !== '/' && pathname.startsWith(`${path}/`))
  }

  return (
    <nav className="fixed top-0 z-50 h-[68px] w-full border-b border-white/10 bg-[#0b2f4d] text-white shadow-[0_8px_24px_rgba(7,36,59,0.12)]">
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-6 lg:px-8">
        <Wordmark dark compact />

        <div className="hidden items-center gap-0.5 lg:flex">
          {navLinks.map(link => {
            const active = isActive(link.href)
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative flex items-center gap-1 rounded-xl px-3 py-2 text-[12px] font-medium transition-all ${active ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
              >
                {(link as any).icon && <Flame size={11} className="text-[#d4b477]" />}
                <span>{link.label}</span>
                {active && <span className="absolute inset-x-3 -bottom-[9px] h-[2px] rounded-full bg-[#d4b477]" />}
              </Link>
            )
          })}
        </div>

        <div className="hidden items-center gap-2.5 lg:flex">
          {user ? (
            <>
              <div className="rounded-xl bg-white/10 p-1 text-white"><NotificationBell userId={user.id} /></div>
              <div className="relative" ref={dropdownRef}>
                <button type="button" onClick={() => setProfileOpen(!profileOpen)} aria-label="Open account menu"
                  aria-expanded={profileOpen} aria-haspopup="menu" className="flex items-center gap-2 rounded-xl px-2 py-1.5 text-white/75 transition-colors hover:bg-white/10 hover:text-white">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/15 bg-white/10 text-[10px] font-semibold text-white">
                    {initials || (isAdmin ? <ShieldCheck size={15} /> : isEmployer ? <Building2 size={15} /> : <User size={15} />)}
                  </div>
                  <ChevronDown size={12} className={`transition-transform ${profileOpen ? 'rotate-180' : ''}`} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-3 w-[210px] overflow-hidden rounded-2xl border border-border bg-white py-1.5 text-ink shadow-xl animate-fade-in">
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
            <>
              <Link href="/login?role=talent" className="rounded-xl border border-white/20 px-4 py-2 text-[12px] font-semibold text-white transition-all hover:bg-white/10">{labels.talentSignIn}</Link>
              <Link href="/login?role=employer" className="rounded-xl bg-[#c9a96e] px-4 py-2 text-[12px] font-semibold text-[#0b2f4d] transition-all hover:bg-[#d4b477]">{labels.employerSignIn}</Link>
            </>
          )}
        </div>

        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="rounded-xl p-2 text-white transition-colors hover:bg-white/10 lg:hidden"
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-navigation" className="border-t border-white/10 bg-[#0b2f4d] lg:hidden">
          <div className="space-y-1 px-6 py-5">
            {navLinks.map(link => (
              <Link key={link.href} href={link.href} className={`block rounded-xl px-3 py-2.5 text-[14px] ${isActive(link.href) ? 'bg-white/10 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`} onClick={() => setMobileOpen(false)}>{link.label}</Link>
            ))}
            <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
              {user ? (
                <>
                  <Link href={dashboardHref} className="block rounded-xl px-3 py-2 text-[14px] font-medium text-white" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link href={isEmployer ? '/employer/messages' : isAdmin ? '/admin/messages' : '/talent/messages'} className="block rounded-xl px-3 py-2 text-[14px] text-white/70" onClick={() => setMobileOpen(false)}>Messages</Link>
                  <button type="button" onClick={handleSignOut} className="block w-full rounded-xl px-3 py-2 text-left text-[14px] text-white/70">Sign Out</button>
                </>
              ) : (
                <>
                  <Link href="/login?role=talent" className="block rounded-xl border border-white/20 px-4 py-2.5 text-center text-[13px] font-semibold text-white" onClick={() => setMobileOpen(false)}>{labels.talentSignIn}</Link>
                  <Link href="/login?role=employer" className="mt-2 block rounded-xl bg-[#c9a96e] px-4 py-2.5 text-center text-[13px] font-semibold text-[#0b2f4d]" onClick={() => setMobileOpen(false)}>{labels.employerSignIn}</Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
