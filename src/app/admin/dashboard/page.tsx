'use client'

import DashboardShell from '@/components/DashboardShell'
import Link from 'next/link'
import {
  GraduationCap, CreditCard, FileText, Megaphone, AlertTriangle,
  Briefcase, MessageSquare, Calendar, Settings,
  Users, ArrowRight,
  Palette,
} from 'lucide-react'

// Admin home - the landing page after admin login. Static quick links into
// every admin section; deliberately no data fetching so it always renders.

const SECTIONS = [
  { group: 'People & operations', label: 'Verification', desc: 'Approve talent and properties.', href: '/admin/verification', icon: <Users size={17} /> },
  { group: 'People & operations', label: 'Messages', desc: 'Review platform conversations.', href: '/admin/messages', icon: <MessageSquare size={17} /> },
  { group: 'People & operations', label: 'Complaints', desc: 'Resolve reported issues.', href: '/admin/complaints', icon: <AlertTriangle size={17} /> },
  { group: 'Content & revenue', label: 'Website & Brand', desc: 'Control public content and identity.', href: '/admin/website', icon: <Palette size={17} /> },
  { group: 'Content & revenue', label: 'Academy', desc: 'Courses, learners and certificates.', href: '/admin/academy', icon: <GraduationCap size={17} /> },
  { group: 'Content & revenue', label: 'Blog', desc: 'Write and publish editorial content.', href: '/admin/blog', icon: <FileText size={17} /> },
  { group: 'Content & revenue', label: 'Campaigns', desc: 'Plan email and marketing activity.', href: '/admin/campaigns', icon: <Megaphone size={17} /> },
  { group: 'Content & revenue', label: 'Sponsored Ads', desc: 'Approve paid brand placements.', href: '/admin/advertising', icon: <Megaphone size={17} /> },
  { group: 'Platform', label: 'Job Listings', desc: 'Review live and closed roles.', href: '/admin/jobs', icon: <Briefcase size={17} /> },
  { group: 'Platform', label: 'Residency Listings', desc: 'Review programmes and placements.', href: '/admin/residency', icon: <Calendar size={17} /> },
  { group: 'Platform', label: 'Agency Money', desc: 'Bookings, payouts and disputes.', href: '/admin/agency', icon: <CreditCard size={17} /> },
  { group: 'Platform', label: 'Taxonomy', desc: 'Skills, brands and qualifications.', href: '/admin/taxonomy', icon: <Briefcase size={17} /> },
  { group: 'Platform', label: 'Settings', desc: 'Platform configuration.', href: '/admin/settings', icon: <Settings size={17} /> },
]

export default function AdminDashboard() {
  return (
    <DashboardShell role="admin" userName="Admin">
      <div className="mb-10">
        <p className="dashboard-eyebrow">Wellness House Collective</p>
        <h1 className="dashboard-title">Administration</h1>
        <p className="dashboard-intro">A focused view of the people, content and commercial work that needs your attention.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {['People & operations', 'Content & revenue', 'Platform'].map(group => (
          <section key={group} className="dashboard-panel">
            <p className="dashboard-eyebrow">{group}</p>
            <div>
              {SECTIONS.filter(section => section.group === group).map(section => (
                <Link key={section.href} href={section.href} className="dashboard-list-row group">
                  <div className="flex items-start gap-3">
                    <span className="text-accent mt-0.5">{section.icon}</span>
                    <span><span className="block text-[13px] font-medium text-ink">{section.label}</span><span className="block text-[11px] text-muted mt-0.5">{section.desc}</span></span>
                  </div>
                  <ArrowRight size={13} className="text-muted group-hover:text-accent" />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </DashboardShell>
  )
}
