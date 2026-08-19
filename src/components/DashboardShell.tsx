'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import Navbar from '@/components/Navbar'
import ApplicationPipelineHub from '@/components/ApplicationPipelineHub'
import PostHireActions from '@/components/PostHireActions'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, User, Briefcase, MessageSquare, Star, Calendar,
  Settings, LogOut, Menu, X, Users, FileText, Megaphone,
  AlertTriangle, Heart, Building2, ChevronRight, BarChart3, CreditCard, GraduationCap,
  Palette, Banknote, Download, MapPin,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  section?: string
}

interface DashboardShellProps {
  children: React.ReactNode
  role: 'talent' | 'employer' | 'admin'
  userName?: string
}

const navItems: Record<string, NavItem[]> = {
  talent: [
    { label: 'Dashboard', href: '/talent/dashboard', icon: <LayoutDashboard size={17} />, section: 'Overview' },
    { label: 'My Profile', href: '/talent/profile', icon: <User size={17} />, section: 'Career' },
    { label: 'Skills Wizard', href: '/talent/onboarding', icon: <Star size={17} /> },
    { label: 'Browse Jobs', href: '/talent/jobs', icon: <Briefcase size={17} /> },
    { label: 'Saved Roles', href: '/talent/saved', icon: <Heart size={17} /> },
    { label: 'Applications', href: '/talent/applications', icon: <FileText size={17} /> },
    { label: 'Messages', href: '/talent/messages', icon: <MessageSquare size={17} /> },
    { label: 'Reviews', href: '/talent/reviews', icon: <Star size={17} /> },
    { label: 'Agency Shifts', href: '/talent/agency', icon: <Calendar size={17} />, section: 'Flexible work' },
    { label: 'Agency Settings', href: '/talent/agency/settings', icon: <Settings size={17} /> },
    { label: 'Residency', href: '/talent/residency', icon: <MapPin size={17} /> },
    { label: 'Get Verified', href: '/talent/verification', icon: <Star size={17} />, section: 'Development' },
    { label: 'Academy', href: '/talent/academy', icon: <GraduationCap size={17} /> },
    { label: 'Go Featured', href: '/talent/upgrade', icon: <Heart size={17} /> },
    { label: 'Billing', href: '/talent/billing', icon: <CreditCard size={17} />, section: 'Account' },
    { label: 'Settings', href: '/talent/settings', icon: <Settings size={17} /> },
  ],
  employer: [
    { label: 'Dashboard', href: '/employer/dashboard', icon: <LayoutDashboard size={17} />, section: 'Overview' },
    { label: 'Company Profile', href: '/employer/profile', icon: <Building2 size={17} />, section: 'Recruitment' },
    { label: 'Job Listings', href: '/employer/jobs', icon: <Briefcase size={17} /> },
    { label: 'Discover Talent', href: '/employer/candidates', icon: <Users size={17} /> },
    { label: 'Applications', href: '/employer/applications', icon: <FileText size={17} /> },
    { label: 'Hired', href: '/employer/hired', icon: <Star size={17} /> },
    { label: 'Messages', href: '/employer/messages', icon: <MessageSquare size={17} /> },
    { label: 'Agency Bookings', href: '/employer/agency', icon: <Calendar size={17} />, section: 'Flexible staffing' },
    { label: 'Residency', href: '/employer/residency', icon: <MapPin size={17} /> },
    { label: 'Analytics', href: '/employer/analytics', icon: <BarChart3 size={17} />, section: 'Visibility' },
    { label: 'Get Featured', href: '/employer/featured', icon: <Star size={17} /> },
    { label: 'Billing', href: '/employer/billing', icon: <CreditCard size={17} />, section: 'Account' },
    { label: 'Settings', href: '/employer/settings', icon: <Settings size={17} /> },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={17} />, section: 'Overview' },
    { label: 'Revenue', href: '/admin/revenue', icon: <Banknote size={17} /> },
    { label: 'Website & Brand', href: '/admin/website', icon: <Palette size={17} />, section: 'People & platform' },
    { label: 'Users', href: '/admin/users', icon: <Users size={17} /> },
    { label: 'Messages', href: '/admin/messages', icon: <MessageSquare size={17} /> },
    { label: 'Matches', href: '/admin/matches', icon: <Heart size={17} /> },
    { label: 'Agency Money', href: '/admin/agency', icon: <CreditCard size={17} /> },
    { label: 'Verification', href: '/admin/verification', icon: <Users size={17} /> },
    { label: 'Academy', href: '/admin/academy', icon: <GraduationCap size={17} />, section: 'Content & revenue' },
    { label: 'Academy Downloads', href: '/admin/academy/downloads', icon: <Download size={17} /> },
    { label: 'Residency Listings', href: '/admin/residency', icon: <Calendar size={17} /> },
    { label: 'Residency Money', href: '/admin/residency-money', icon: <CreditCard size={17} /> },
    { label: 'Job Listings', href: '/admin/jobs', icon: <Briefcase size={17} /> },
    { label: 'Blog', href: '/admin/blog', icon: <FileText size={17} /> },
    { label: 'Campaigns', href: '/admin/campaigns', icon: <Megaphone size={17} /> },
    { label: 'Sponsored Ads', href: '/admin/advertising', icon: <Megaphone size={17} /> },
    { label: 'Taxonomy', href: '/admin/taxonomy', icon: <Briefcase size={17} />, section: 'Controls' },
    { label: 'Complaints', href: '/admin/complaints', icon: <AlertTriangle size={17} /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings size={17} /> },
  ],
}

const workspaceLabel = {
  talent: 'Talent workspace',
  employer: 'Property workspace',
  admin: 'Platform control',
} as const

export default function DashboardShell({ children, role, userName }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [agencyShell, setAgencyShell] = useState<'checking' | 'employer' | 'public'>('checking')
  const pathname = usePathname()
  const supabase = createClient()
  const items = navItems[role]
  const isPublicAgencyRoute = pathname === '/agency'
  const showRecruitmentPipeline = (role === 'talent' && pathname === '/talent/applications') || (role === 'employer' && pathname === '/employer/applications')
  const showPostHireActions = role === 'employer' && pathname === '/employer/applications'

  useEffect(() => {
    if (!isPublicAgencyRoute) return
    let active = true
    supabase.auth.getUser().then(async ({ data }) => {
      if (!active) return
      if (!data.user) {
        setAgencyShell('public')
        return
      }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
      if (!active) return
      setAgencyShell(profile?.role === 'employer' ? 'employer' : 'public')
    }).catch(() => { if (active) setAgencyShell('public') })
    return () => { active = false }
  }, [isPublicAgencyRoute])

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isActive = (href: string) => pathname === href || (href.split('/').length > 3 && pathname.startsWith(`${href}/`))

  if (isPublicAgencyRoute && agencyShell !== 'employer') {
    return (
      <div className="min-h-screen bg-[#f5f2eb]">
        <Navbar />
        <main className="pt-[68px]">
          <div className="p-5 md:p-8 lg:p-10 xl:p-12 max-w-[1560px] mx-auto">
            {agencyShell === 'checking' ? (
              <div className="flex min-h-[55vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#9c7a42] border-t-transparent" />
              </div>
            ) : children}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="dashboard-shell min-h-screen">
      <header className="lg:hidden sticky top-0 z-30 bg-[#092b45] text-white px-4 py-3.5 flex items-center justify-between border-b border-white/10">
        <button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open dashboard navigation" className="p-1 -ml-1 text-white/85"><Menu size={22} /></button>
        <div className="text-center leading-none"><Wordmark dark compact href={null} /><p className="mt-1.5 text-[8px] uppercase tracking-[0.2em] text-[#d8bf8a]">{workspaceLabel[role]}</p></div>
        <div className="w-6" />
      </header>

      {sidebarOpen && <div className="fixed inset-0 bg-[#071d2d]/60 backdrop-blur-[1px] z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`dashboard-sidebar fixed top-0 left-0 h-full w-[264px] text-white z-50 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="px-7 pt-7 pb-4">
          <div className="flex items-center justify-between"><Wordmark dark /><button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/55 hover:text-white p-1" aria-label="Close dashboard navigation"><X size={19} /></button></div>
          <div className="mt-7 pb-5 border-b border-white/10"><p className="text-[#d8bf8a] text-[8px] uppercase tracking-[0.22em] font-semibold">{workspaceLabel[role]}</p>{userName && <p className="font-serif text-white text-[22px] leading-tight mt-2 truncate">{userName}</p>}</div>
        </div>

        <nav className="px-4 pb-20 overflow-y-auto h-[calc(100vh-156px)]">
          {items.map((item, index) => {
            const active = isActive(item.href)
            return <div key={item.href}>
              {item.section && <p className={`${index === 0 ? 'mt-1' : 'mt-5'} mb-1.5 px-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-white/32`}>{item.section}</p>}
              <Link href={item.href} onClick={() => setSidebarOpen(false)} className={`dashboard-nav-item relative flex items-center gap-3 px-3 py-2 text-[12.5px] transition-colors border-l ${active ? 'text-white bg-white/[0.055] border-[#c9a96e]' : 'text-white/58 hover:text-white hover:bg-white/[0.035] border-transparent'}`}>
                <span className={active ? 'text-[#d8bf8a]' : 'text-white/44'}>{item.icon}</span><span className="tracking-[-0.01em]">{item.label}</span>{active && <ChevronRight size={12} className="ml-auto text-[#d8bf8a]" />}
              </Link>
            </div>
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 px-4 py-4 bg-[#092b45] border-t border-white/[0.07]">
          <button type="button" onClick={handleSignOut} className="dashboard-nav-item flex items-center gap-3 px-3 py-2.5 text-[12.5px] text-white/48 hover:text-white hover:bg-white/[0.035] w-full transition-colors"><LogOut size={17} /><span>Sign out</span></button>
        </div>
      </aside>

      <main className="lg:ml-[264px] min-h-screen"><div className="p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12 max-w-[1540px] mx-auto">{showPostHireActions ? <PostHireActions /> : null}{showRecruitmentPipeline ? <ApplicationPipelineHub role={role as 'talent' | 'employer'} /> : null}{children}</div></main>
    </div>
  )
}
