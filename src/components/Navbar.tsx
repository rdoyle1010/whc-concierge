'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import Wordmark from '@/components/Wordmark'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, User, ChevronDown, LayoutDashboard, Settings, LogOut, MessageSquare, Building2, ShieldCheck } from 'lucide-react'
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
            { href: '/roles/match', label: 'Match' },
            { href: '/properties', label: 'Properties' },
            { href: '/talent/agency', label: 'Agency' },
            { href: '/academy', label: 'Academy' },
            { href: '/residency', label: 'Residency' },
          ]
    : []

  const publicGroups = [
    {
      label: 'Careers',
      paths: ['/jobs', '/match', '/roles/match', '/properties'],
      items: [
        { href: '/jobs', label: labels.jobs, note: 'Browse permanent opportunities' },
        { href: '/match', label: 'Match', note: 'See how swipe matching works' },
        { href: '/properties', label: 'Properties', note: 'Meet verified employers' },
      ],
    },
    {
      label: 'Flexible Work',
      paths: ['/agency', '/residency'],
      items: [
        { href: '/agency/about', label: labels.agency, note: 'Flexible shifts and cover' },
        { href: '/residency', label: labels.residency, note: 'Specialist placements' },
      ],
    },
  ]

  const isActive = (href: string) => {
    const path = href.split('?')[0]
    return pathname === path || (path !== '/' && pathname.startsWith(`${path}/`))
  }

  const groupActive = (paths: string[]) => paths.some(path => pathname === path || pathname.startsWith(`${path}/`))

  return (
    <nav className="fixed top-0 z-50 h-[76px] w-full border-b border-white/10 bg-[#0b2f4d] text-white shadow-[0_8px_24px_rgba(7,36,59,0.10)]">
      <div className="mx-auto grid h-full max-w-[1440px] grid-cols-[auto_1fr_auto] items-center gap-10 px-6 lg:px-10">
        <div className="shrink-0"><Wordmark dark compact /></div>

        <div className="hidden h-full items-center justify-center lg:flex">
          {user ? (
            <div className="flex h-full items-center gap-1">
              {navLinks.map(link => {
                const active = isActive(link.href)
                return (
                  <Link key={link.href} href={link.href} className={`relative flex h-full items-center px-3.5 text-[11px] font-semibold tracking-[0.015em] transition-colors ${active ? 'text-white' : 'text-white/66 hover:text-white'}`}>
                    <span>{link.label}</span>
                    {active && <span className="absolute inset-x-3 bottom-0 h-[2px] bg-white" />}
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="flex h-full items-center gap-8">
              {publicGroups.map(group => {
                const active = groupActive(group.paths)
                return (
                  <div key={group.label} className="group relative flex h-full items-center">
                    <button type="button" className={`relative flex h-full items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${active ? 'text-white' : 'text-white/68 group-hover:text-white'}`}>
                      {group.label}<ChevronDown size={11} className="opacity-65 transition-transform group-hover:rotate-180" />
                      {active && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-white" />}
                    </button>
                    <div className="pointer-events-none absolute left-1/2 top-[64px] w-[290px] -translate-x-1/2 translate-y-2 border border-[#d8dde1] bg-white p-2 opacity-0 shadow-[0_18px_48px_rgba(5,29,46,.16)] transition-all duration-150 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:translate-y-0 group-focus-within:opacity-100">
                      {group.items.map(item => <Link key={item.href} href={item.href} className="block border-b border-[#e8ecef] px-4 py-3.5 last:border-0 hover:bg-[#f7f8fa]">
                        <span className="block text-[12px] font-semibold text-[#10283b]">{item.label}</span>
                        <span className="mt-1 block text-[10px] leading-4 text-[#7a858c]">{item.note}</span>
                      </Link>)}
                    </div>
                  </div>
                )
              })}

              <Link href="/academy" className={`relative flex h-full items-center text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${isActive('/academy') ? 'text-white' : 'text-white/68 hover:text-white'}`}>Academy{isActive('/academy') && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-white" />}</Link>
              <Link href="/blog" className={`relative flex h-full items-center text-[10px] font-semibold uppercase tracking-[0.16em] transition-colors ${isActive('/blog') ? 'text-white' : 'text-white/68 hover:text-white'}`}>Journal{isActive('/blog') && <span className="absolute inset-x-0 bottom-0 h-[2px] bg-white" />}</Link>
            </div>
          )}
        </div>

        <div className="hidden items-center justify-end lg:flex">
          {user ? (
            <>
              <div className="mr-2 border-r border-white/12 pr-3 text-white"><NotificationBell userId={user.id} /></div>
              <div className="relative" ref={dropdownRef}>
                <button type="button" onClick={() => setProfileOpen(!profileOpen)} aria-label="Open account menu" aria-expanded={profileOpen} aria-haspopup="menu" className="flex items-center gap-2 px-1.5 py-1 text-white/75 transition-colors hover:text-white">
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
            <div className="flex items-center gap-5 whitespace-nowrap">
              <Link href="/login?role=talent" className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/66 transition-colors hover:text-white">Talent Portal</Link>
              <span className="h-5 w-px bg-white/18" />
              <Link href="/login?role=employer" className="text-[9px] font-semibold uppercase tracking-[0.17em] text-white/82 transition-colors hover:text-white">Property Portal</Link>
            </div>
          )}
        </div>

        <button type="button" onClick={() => setMobileOpen(!mobileOpen)} className="col-start-3 rounded-lg p-2 text-white transition-colors hover:bg-white/10 lg:hidden" aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'} aria-expanded={mobileOpen} aria-controls="mobile-navigation">
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {mobileOpen && (
        <div id="mobile-navigation" className="max-h-[calc(100vh-76px)] overflow-y-auto border-t border-white/10 bg-[#0b2f4d] lg:hidden">
          <div className="px-6 py-5">
            {user ? navLinks.map(link => <Link key={link.href} href={link.href} className={`block border-b border-white/8 py-3 text-[13px] font-medium ${isActive(link.href) ? 'text-white' : 'text-white/70 hover:text-white'}`} onClick={() => setMobileOpen(false)}>{link.label}</Link>) : (
              <>
                <p className="pb-2 text-[9px] font-semibold uppercase tracking-[.18em] text-white/55">Careers</p>
                {publicGroups[0].items.map(item => <Link key={item.href} href={item.href} className="block border-b border-white/8 py-3 text-[13px] text-white/78" onClick={() => setMobileOpen(false)}>{item.label}</Link>)}
                <p className="pb-2 pt-6 text-[9px] font-semibold uppercase tracking-[.18em] text-white/55">Flexible Work</p>
                {publicGroups[1].items.map(item => <Link key={item.href} href={item.href} className="block border-b border-white/8 py-3 text-[13px] text-white/78" onClick={() => setMobileOpen(false)}>{item.label}</Link>)}
                <p className="pb-2 pt-6 text-[9px] font-semibold uppercase tracking-[.18em] text-white/55">Development & Ideas</p>
                <Link href="/academy" className="block border-b border-white/8 py-3 text-[13px] text-white/78" onClick={() => setMobileOpen(false)}>Academy</Link>
                <Link href="/blog" className="block border-b border-white/8 py-3 text-[13px] text-white/78" onClick={() => setMobileOpen(false)}>Journal</Link>
              </>
            )}

            <div className="mt-5 border-t border-white/12 pt-5">
              {user ? (
                <>
                  <Link href={dashboardHref} className="block py-2 text-[13px] font-medium text-white" onClick={() => setMobileOpen(false)}>Dashboard</Link>
                  <Link href={isEmployer ? '/employer/messages' : isAdmin ? '/admin/messages' : '/talent/messages'} className="block py-2 text-[13px] text-white/70" onClick={() => setMobileOpen(false)}>Messages</Link>
                  <button type="button" onClick={handleSignOut} className="block w-full py-2 text-left text-[13px] text-white/70">Sign Out</button>
                </>
              ) : (
                <div className="flex items-center gap-5">
                  <Link href="/login?role=talent" className="text-[10px] font-semibold uppercase tracking-[.14em] text-white" onClick={() => setMobileOpen(false)}>Talent Portal</Link>
                  <span className="h-5 w-px bg-white/18" />
                  <Link href="/login?role=employer" className="text-[10px] font-semibold uppercase tracking-[.14em] text-white/82" onClick={() => setMobileOpen(false)}>Property Portal</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  )
}
