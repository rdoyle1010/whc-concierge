'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, User, Briefcase, MessageSquare, Star, Calendar,
  Settings, LogOut, Menu, X, Users, FileText, Image as ImageIcon, Megaphone,
  AlertTriangle, Heart, Building2, ChevronRight, BarChart3, CreditCard
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
}

interface DashboardShellProps {
  children: React.ReactNode
  role: 'talent' | 'employer' | 'admin'
  userName?: string
}

const navItems: Record<string, NavItem[]> = {
  talent: [
    { label: 'Dashboard', href: '/talent/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'My Profile', href: '/talent/profile', icon: <User size={20} /> },
    { label: 'Browse Jobs', href: '/talent/jobs', icon: <Briefcase size={20} /> },
    { label: 'Saved Roles', href: '/talent/saved', icon: <Heart size={20} /> },
    { label: 'Applications', href: '/talent/applications', icon: <FileText size={20} /> },
    { label: 'Messages', href: '/talent/messages', icon: <MessageSquare size={20} /> },
    { label: 'Reviews', href: '/talent/reviews', icon: <Star size={20} /> },
    { label: 'Agency Shifts', href: '/talent/agency', icon: <Calendar size={20} /> },
    { label: 'Billing', href: '/talent/billing', icon: <CreditCard size={20} /> },
    { label: 'Settings', href: '/talent/settings', icon: <Settings size={20} /> },
  ],
  employer: [
    { label: 'Dashboard', href: '/employer/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Company Profile', href: '/employer/profile', icon: <Building2 size={20} /> },
    { label: 'Job Listings', href: '/employer/jobs', icon: <Briefcase size={20} /> },
    { label: 'Candidates', href: '/employer/candidates', icon: <Users size={20} /> },
    { label: 'Applications', href: '/employer/applications', icon: <FileText size={20} /> },
    { label: 'Shortlist', href: '/employer/shortlist', icon: <Star size={20} /> },
    { label: 'Analytics', href: '/employer/analytics', icon: <BarChart3 size={20} /> },
    { label: 'Messages', href: '/employer/messages', icon: <MessageSquare size={20} /> },
    { label: 'Billing', href: '/employer/billing', icon: <CreditCard size={20} /> },
    { label: 'Settings', href: '/employer/settings', icon: <Settings size={20} /> },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={20} /> },
    { label: 'Users', href: '/admin/users', icon: <Users size={20} /> },
    { label: 'Messages', href: '/admin/messages', icon: <MessageSquare size={20} /> },
    { label: 'Matches', href: '/admin/matches', icon: <Heart size={20} /> },
    { label: 'Blog', href: '/admin/blog', icon: <FileText size={20} /> },
    { label: 'Campaigns', href: '/admin/campaigns', icon: <Megaphone size={20} /> },
    { label: 'Images', href: '/admin/images', icon: <ImageIcon size={20} /> },
    { label: 'Taxonomy', href: '/admin/taxonomy', icon: <Briefcase size={20} /> },
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
    <div className="min-h-screen bg-gray-50">
      {/* Mobile header */}
      <div className="lg:hidden bg-ink text-white px-4 py-3 flex items-center justify-between">
        <button onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="flex items-center space-x-2">
          <div className="bg-white px-2 py-1.5 rounded"><Image src="/images/whc-logo.jpg" alt="WHC" width={90} height={28} className="h-7 w-auto object-contain" /></div>
        </div>
        <div className="w-6" />
      </div>

      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 h-full w-64 bg-ink text-white z-50 transform transition-transform lg:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="bg-white px-2 py-1.5 rounded"><Image src="/images/whc-logo.jpg" alt="Wellness House Collective" width={110} height={36} className="h-8 w-auto object-contain" /></div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-white/60 hover:text-white">
              <X size={20} />
            </button>
          </div>

          {userName && (
            <div className="mt-6 pb-6 border-b border-white/10">
              <p className="text-white/60 text-xs uppercase tracking-wider">Welcome back</p>
              <p className="text-white font-medium mt-1 truncate">{userName}</p>
              <span className="inline-block mt-2 text-xs bg-gold/20 text-gold px-2 py-1 rounded capitalize">{role}</span>
            </div>
          )}
        </div>

        <nav className="px-4 space-y-1">
          {items.map((item) => {
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  active
                    ? 'bg-gold/20 text-gold'
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {active && <ChevronRight size={16} className="ml-auto" />}
              </Link>
            )
          })}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4">
          <button
            onClick={handleSignOut}
            className="flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm text-white/60 hover:text-red-400 hover:bg-red-400/10 w-full transition-colors"
          >
            <LogOut size={20} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="lg:ml-64 min-h-screen">
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  )
}
