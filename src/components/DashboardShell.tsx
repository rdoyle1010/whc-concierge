'use client'

import { useState } from 'react'
import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, User, Briefcase, MessageSquare, Star, Calendar,
  Settings, LogOut, Menu, X, Users, FileText, Megaphone,
  AlertTriangle, Heart, Building2, ChevronRight, BarChart3, CreditCard, GraduationCap,
  Palette,
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
    { label: 'Dashboard', href: '/talent/dashboard', icon: <LayoutDashboard size={18} />, section: 'Overview' },
    { label: 'My Profile', href: '/talent/profile', icon: <User size={18} />, section: 'Career' },
    { label: 'Skills Wizard', href: '/talent/onboarding', icon: <Star size={20} /> },
    { label: 'Browse Jobs', href: '/talent/jobs', icon: <Briefcase size={20} /> },
    { label: 'Saved Roles', href: '/talent/saved', icon: <Heart size={20} /> },
    { label: 'Applications', href: '/talent/applications', icon: <FileText size={20} /> },
    { label: 'Messages', href: '/talent/messages', icon: <MessageSquare size={20} /> },
    { label: 'Reviews', href: '/talent/reviews', icon: <Star size={20} /> },
    { label: 'Agency Shifts', href: '/talent/agency', icon: <Calendar size={20} />, section: 'Agency & learning' },
    { label: 'Agency Settings', href: '/talent/agency/settings', icon: <Settings size={20} /> },
    { label: 'Get Verified', href: '/talent/verification', icon: <Star size={20} /> },
    { label: 'Academy', href: '/talent/academy', icon: <GraduationCap size={20} /> },
    { label: 'Go Featured', href: '/talent/upgrade', icon: <Heart size={20} /> },
    { label: 'Billing', href: '/talent/billing', icon: <CreditCard size={20} />, section: 'Account' },
    { label: 'Settings', href: '/talent/settings', icon: <Settings size={20} /> },
  ],
  employer: [
    { label: 'Dashboard', href: '/employer/dashboard', icon: <LayoutDashboard size={18} />, section: 'Overview' },
    { label: 'Company Profile', href: '/employer/profile', icon: <Building2 size={18} />, section: 'Recruitment' },
    { label: 'Job Listings', href: '/employer/jobs', icon: <Briefcase size={20} /> },
    { label: 'Candidates', href: '/employer/candidates', icon: <Users size={20} /> },
    { label: 'Applications', href: '/employer/applications', icon: <FileText size={20} /> },
    { label: 'Agency Bookings', href: '/employer/agency', icon: <Calendar size={20} />, section: 'Agency' },
    { label: 'Shortlist', href: '/employer/shortlist', icon: <Star size={20} /> },
    { label: 'Analytics', href: '/employer/analytics', icon: <BarChart3 size={20} /> },
    { label: 'Messages', href: '/employer/messages', icon: <MessageSquare size={20} /> },
    { label: 'Billing', href: '/employer/billing', icon: <CreditCard size={20} />, section: 'Account' },
    { label: 'Settings', href: '/employer/settings', icon: <Settings size={20} /> },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={18} />, section: 'Overview' },
    { label: 'Website & Brand', href: '/admin/website', icon: <Palette size={18} />, section: 'People & platform' },
    { label: 'Users', href: '/admin/users', icon: <Users size={20} /> },
    { label: 'Messages', href: '/admin/messages', icon: <MessageSquare size={20} /> },
    { label: 'Matches', href: '/admin/matches', icon: <Heart size={20} /> },
    { label: 'Agency Money', href: '/admin/agency', icon: <CreditCard size={20} /> },
    { label: 'Verification', href: '/admin/verification', icon: <Users size={20} /> },
    { label: 'Academy', href: '/admin/academy', icon: <GraduationCap size={20} />, section: 'Content & revenue' },
    { label: 'Residency Listings', href: '/admin/residency', icon: <Calendar size={20} /> },
    { label: 'Job Listings', href: '/admin/jobs', icon: <Briefcase size={20} /> },
    { label: 'Blog', href: '/admin/blog', icon: <FileText size={20} /> },
    { label: 'Campaigns', href: '/admin/campaigns', icon: <Megaphone size={20} /> },
    { label: 'Sponsored Ads', href: '/admin/advertising', icon: <Megaphone size={20} /> },
    { label: 'Taxonomy', href: '/admin/taxonomy', icon: <Briefcase size={20} />, section: 'Controls' },
    { label: 'Complaints', href: '/admin/complaints', icon: <AlertTriangle size={20} /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings size={20} /> },
  ],
}

export default function DashboardShell({ children, role, userName }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const pathname = usePathname()
  const supabase = createClient()
  const items = navItems[role]

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  return (
    <div className="dashboard-shell min-h-screen">
      {/* Mobile header */}
      <div className="lg:hidden bg-ink text-white px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="flex items-center space-x-2">
          <Wordmark dark compact href={null} />
        </div>
        <div className="w-6" />
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`dashboard-sidebar fixed top-0 left-0 h-full w-[248px] text-white z-50 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-center justify-between">
            <Wordmark dark />
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {userName && (
            <div className="mt-6 pb-6 border-b border-white/10">
              <p className="text-white/45 text-[9px] uppercase tracking-[0.2em]">{role} workspace</p>
              <p className="font-serif text-white text-lg mt-1 truncate">{userName}</p>
            </div>
          )}
        </div>

        <nav className="px-4 pb-20 overflow-y-auto h-[calc(100vh-154px)]">
          {items.map((item, index) => {
            const active = pathname === item.href
            return (
              <div key={item.href}>
              {item.section && <p className={`${index === 0 ? 'mt-1' : 'mt-5'} mb-1.5 px-3 text-[9px] uppercase tracking-[0.18em] text-white/35`}>{item.section}</p>}
              <Link
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`dashboard-nav-item flex items-center space-x-3 px-3 py-2 text-[13px] transition-colors border-l-2 ${
                  active
                    ? 'border-gold text-white bg-white/[0.06]'
                    : 'border-transparent text-white/60 hover:text-white hover:border-white/25'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {active && <ChevronRight size={13} className="ml-auto text-gold" />}
              </Link>
              </div>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-3 py-2.5 text-sm text-white/60 hover:text-white border-l-2 border-transparent hover:border-white/25 w-full transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-[248px] min-h-screen">
        <div className="p-5 md:p-8 lg:p-10 xl:p-12 max-w-[1560px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  )
}
