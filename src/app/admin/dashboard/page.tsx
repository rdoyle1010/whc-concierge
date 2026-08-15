'use client'

import DashboardShell from '@/components/DashboardShell'
import Link from 'next/link'
import {
  GraduationCap, CreditCard, FileText, Megaphone, AlertTriangle,
  Image as ImageIcon, Briefcase, MessageSquare, Calendar, Settings,
  Users, ArrowRight,
  Palette,
} from 'lucide-react'

// Admin home - the landing page after admin login. Static quick links into
// every admin section; deliberately no data fetching so it always renders.

const SECTIONS = [
  { label: 'Website & Brand', desc: 'Edit homepage wording, photos, fonts, colours and navigation.', href: '/admin/website', icon: <Palette size={18} /> },
  { label: 'Verification', desc: 'Review and approve talent and property accounts.', href: '/admin/verification', icon: <Users size={18} /> },
  { label: 'Agency Money', desc: 'Bookings, payments, payouts and disputes.', href: '/admin/agency', icon: <CreditCard size={18} /> },
  { label: 'Academy', desc: 'Learners, enrolments, revenue and certificates.', href: '/admin/academy', icon: <GraduationCap size={18} /> },
  { label: 'Job Listings', desc: 'Every listing on the platform, live and closed.', href: '/admin/jobs', icon: <Briefcase size={18} /> },
  { label: 'Residency Listings', desc: 'Residency programmes and placements.', href: '/admin/residency', icon: <Calendar size={18} /> },
  { label: 'Messages', desc: 'Platform conversations overview.', href: '/admin/messages', icon: <MessageSquare size={18} /> },
  { label: 'Blog', desc: 'Write, edit and publish blog posts.', href: '/admin/blog', icon: <FileText size={18} /> },
  { label: 'Campaigns', desc: 'Email and marketing campaigns.', href: '/admin/campaigns', icon: <Megaphone size={18} /> },
  { label: 'Legacy Images', desc: 'Older image-slot controls retained during the redesign.', href: '/admin/images', icon: <ImageIcon size={18} /> },
  { label: 'Taxonomy', desc: 'Skills, systems, brands and certifications.', href: '/admin/taxonomy', icon: <Briefcase size={18} /> },
  { label: 'Complaints', desc: 'Reported issues and their resolution.', href: '/admin/complaints', icon: <AlertTriangle size={18} /> },
  { label: 'Settings', desc: 'Platform configuration.', href: '/admin/settings', icon: <Settings size={18} /> },
]

export default function AdminDashboard() {
  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-8">
        <h1 className="text-[24px] font-medium text-ink">Admin Dashboard</h1>
        <p className="text-[13px] text-muted mt-1">
          {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {SECTIONS.map(section => (
          <Link key={section.href} href={section.href} className="dashboard-card hover:shadow-md hover:-translate-y-0.5 transition-all group">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center text-accent">
                {section.icon}
              </div>
              <ArrowRight size={14} className="text-muted group-hover:text-ink transition-colors" />
            </div>
            <p className="text-[14px] font-medium text-ink mb-1">{section.label}</p>
            <p className="text-[12px] text-muted">{section.desc}</p>
          </Link>
        ))}
      </div>
    </DashboardShell>
  )
}
