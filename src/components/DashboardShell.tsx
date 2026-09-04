'use client'

import { useEffect, useState } from 'react'
import { getViewer, forgetViewer } from '@/lib/viewer'
import Link from 'next/link'
import Wordmark from '@/components/Wordmark'
import NotificationBell from '@/components/NotificationBell'
import Navbar from '@/components/Navbar'
import ApplicationPipelineHub from '@/components/ApplicationPipelineHub'
import PostHireActions from '@/components/PostHireActions'
import DashboardActivityCentre from '@/components/DashboardActivityCentre'
import UniversalSearch from '@/components/UniversalSearch'
import PostHireReviews from '@/components/PostHireReviews'
import SponsoredAd from '@/components/SponsoredAd'
import { usePathname } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  employerFeatureAccess, FeatureAccess, FeatureKey, talentFeatureAccess,
} from '@/lib/feature-access'
import { TrendingUp,
  LayoutDashboard, User, Briefcase, MessageSquare, Star, Calendar,
  Settings, LogOut, Menu, X, Users, FileText, Megaphone,
  AlertTriangle, Heart, Building2, ChevronRight, BarChart3, CreditCard, GraduationCap,
  Palette, Banknote, Download, MapPin, Brain, ClipboardList, ShieldCheck, Lock,
  Search, Mail, Image as ImageIcon, LayoutGrid, Lightbulb,
  Activity, Award,
} from 'lucide-react'

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  section?: string
  accessKey?: FeatureKey
}

interface DashboardShellProps {
  children: React.ReactNode
  role: 'talent' | 'employer' | 'admin'
  userName?: string
  /** Rendered above everything else, so a page greeting opens the page. */
  intro?: React.ReactNode
}

const navItems: Record<string, NavItem[]> = {
  talent: [
    { label: 'Dashboard', href: '/talent/dashboard', icon: <LayoutDashboard size={17} />, section: 'Overview' },
    { label: 'Jobs & Matches', href: '/talent/jobs', icon: <Briefcase size={17} />, section: 'Find work' },
    { label: 'Saved Roles', href: '/talent/saved', icon: <Heart size={17} /> },
    { label: 'Applications', href: '/talent/applications', icon: <FileText size={17} /> },
    { label: 'Messages', href: '/talent/messages', icon: <MessageSquare size={17} /> },
    { label: 'Agency Shifts', href: '/talent/agency', icon: <Calendar size={17} />, section: 'Flexible work' },
    { label: 'Agency Settings', href: '/talent/agency/settings', icon: <Settings size={17} /> },
    { label: 'Shift Resolution', href: '/talent/agency/cases', icon: <AlertTriangle size={17} /> },
    { label: 'Residency', href: '/talent/residency', icon: <MapPin size={17} /> },
    { label: 'Before You Arrive', href: '/talent/before-you-arrive', icon: <ClipboardList size={17} /> },
    { label: 'Academy', href: '/talent/academy', icon: <GraduationCap size={17} />, section: 'Grow' },
    { label: 'Career Intelligence', href: '/talent/career', icon: <TrendingUp size={17} /> },
    { label: 'My Toolkit', href: '/talent/toolkit', icon: <ClipboardList size={17} /> },
    { label: 'Interview Ready', href: '/talent/interview-ready', icon: <Brain size={17} />, accessKey: 'talent_interview_ready' },
    { label: 'Get Verified', href: '/talent/verification', icon: <Star size={17} /> },
    { label: 'Reviews', href: '/talent/reviews', icon: <Star size={17} /> },
    { label: 'Go Featured', href: '/talent/upgrade', icon: <Heart size={17} /> },
    { label: 'Membership', href: '/talent/membership', icon: <CreditCard size={17} /> },
    { label: 'My Profile', href: '/talent/profile', icon: <User size={17} />, section: 'Account' },
    // Awards were built, are shown on a portfolio, in Discover Talent and in the
    // mobile directory - and had no door. Nobody can be recognised for something
    // there is no way to enter.
    { label: 'Awards & Recognition', href: '/talent/awards', icon: <Award size={17} /> },
    { label: 'Billing', href: '/talent/billing', icon: <CreditCard size={17} /> },
    { label: 'Privacy & Preferences', href: '/talent/privacy', icon: <ShieldCheck size={17} /> },
    { label: 'Security', href: '/talent/security', icon: <ShieldCheck size={17} /> },
    { label: 'Settings', href: '/talent/settings', icon: <Settings size={17} /> },
  ],
  employer: [
    { label: 'Dashboard', href: '/employer/dashboard', icon: <LayoutDashboard size={17} />, section: 'Overview' },
    { label: 'Job Listings', href: '/employer/jobs', icon: <Briefcase size={17} />, section: 'Recruitment' },
    { label: 'Applications', href: '/employer/applications', icon: <FileText size={17} /> },
    { label: 'Discover Talent', href: '/employer/candidates', icon: <Users size={17} />, accessKey: 'employer_talent_search' },
    { label: 'Saved Talent', href: '/employer/shortlist', icon: <Heart size={17} /> },
    { label: 'Hired', href: '/employer/hired', icon: <Star size={17} /> },
    { label: 'Managed Search', href: '/employer/recruitment', icon: <Search size={17} /> },
    { label: 'Messages', href: '/employer/messages', icon: <MessageSquare size={17} /> },
    { label: 'Agency Bookings', href: '/employer/agency', icon: <Calendar size={17} />, section: 'Flexible staffing' },
    { label: 'Shift Resolution', href: '/employer/agency/cases', icon: <AlertTriangle size={17} /> },
    { label: 'Residency', href: '/employer/residency', icon: <MapPin size={17} /> },
    { label: 'Consultancy', href: '/consultancy', icon: <Lightbulb size={17} /> },
    { label: 'Company Profile', href: '/employer/profile', icon: <Building2 size={17} />, section: 'Your property' },
    { label: 'Property Fact File', href: '/employer/property-fact-file', icon: <FileText size={17} /> },
    { label: 'Awards & Recognition', href: '/employer/awards', icon: <Award size={17} /> },
    { label: 'Analytics', href: '/employer/analytics', icon: <BarChart3 size={17} />, section: 'Visibility', accessKey: 'employer_analytics' },
    { label: 'Social & Advertising', href: '/employer/social', icon: <Megaphone size={17} /> },
    { label: 'Get Featured', href: '/employer/featured', icon: <Star size={17} /> },
    { label: 'Membership', href: '/employer/membership', icon: <CreditCard size={17} /> },
    { label: 'Billing', href: '/employer/billing', icon: <CreditCard size={17} />, section: 'Account' },
    { label: 'Privacy & Preferences', href: '/employer/privacy', icon: <ShieldCheck size={17} /> },
    { label: 'Security', href: '/employer/security', icon: <ShieldCheck size={17} /> },
    { label: 'Settings', href: '/employer/settings', icon: <Settings size={17} /> },
  ],
  // Somebody who signed up to list a consultancy practice does not take shifts,
  // does not need Shift Resolution or Before You Arrive, and is not asked which
  // treatments they perform. Handing them the full talent workspace tells them
  // they are in the wrong place. They can switch to the full one whenever they
  // want a role - the link sits on their Consultancy page.
  consultant: [
    { label: 'My Practice', href: '/talent/consultancy', icon: <Lightbulb size={17} />, section: 'Consultancy' },
    { label: 'Messages', href: '/talent/messages', icon: <MessageSquare size={17} /> },
    { label: 'Academy', href: '/talent/academy', icon: <GraduationCap size={17} />, section: 'Grow' },
    { label: 'Billing', href: '/talent/billing', icon: <CreditCard size={17} />, section: 'Account' },
    { label: 'Privacy & Preferences', href: '/talent/privacy', icon: <ShieldCheck size={17} /> },
    { label: 'Security', href: '/talent/security', icon: <ShieldCheck size={17} /> },
    { label: 'Settings', href: '/talent/settings', icon: <Settings size={17} /> },
  ],
  admin: [
    { label: 'Dashboard', href: '/admin/dashboard', icon: <LayoutDashboard size={17} />, section: 'Overview' },
    { label: 'Revenue', href: '/admin/revenue', icon: <Banknote size={17} /> },
    { label: 'Website & Brand', href: '/admin/website', icon: <Palette size={17} />, section: 'People & platform' },
    { label: 'Public Pages', href: '/admin/website/pages', icon: <FileText size={17} /> },
    { label: 'Pictures', href: '/admin/images', icon: <ImageIcon size={17} /> },
    { label: 'Doors & Sectors', href: '/admin/sectors', icon: <LayoutGrid size={17} /> },
    { label: 'Users', href: '/admin/users', icon: <Users size={17} /> },
    { label: 'Messages', href: '/admin/messages', icon: <MessageSquare size={17} /> },
    { label: 'Messages We Sent', href: '/admin/messages-sent', icon: <Mail size={17} /> },
    { label: 'Who Is Online', href: '/admin/activity', icon: <Activity size={17} /> },
    { label: 'Matches', href: '/admin/matches', icon: <Heart size={17} /> },
    { label: 'Agency Money', href: '/admin/agency', icon: <CreditCard size={17} /> },
    { label: 'Agency Cases', href: '/admin/agency-cases', icon: <AlertTriangle size={17} /> },
    { label: 'Verification', href: '/admin/verification', icon: <Users size={17} /> },
    { label: 'Certificates', href: '/admin/certificates', icon: <GraduationCap size={17} /> },
    { label: 'Academy', href: '/admin/academy', icon: <GraduationCap size={17} />, section: 'Content & revenue' },
    { label: 'Academy Downloads', href: '/admin/academy/downloads', icon: <Download size={17} /> },
    { label: 'Residency Listings', href: '/admin/residency', icon: <Calendar size={17} /> },
    { label: 'Consultancy', href: '/admin/consultancy', icon: <Lightbulb size={17} /> },
    { label: 'Residency Money', href: '/admin/residency-money', icon: <CreditCard size={17} /> },
    { label: 'Job Listings', href: '/admin/jobs', icon: <Briefcase size={17} /> },
    { label: 'Blog & Journal', href: '/admin/blog', icon: <FileText size={17} /> },
    { label: 'Newsletters & Campaigns', href: '/admin/campaigns', icon: <Megaphone size={17} /> },
    { label: 'Newsletter', href: '/admin/newsletter', icon: <Mail size={17} /> },
    { label: 'Sponsored Ads', href: '/admin/advertising', icon: <Megaphone size={17} /> },
    { label: 'Ad Slots', href: '/admin/ad-slots', icon: <Megaphone size={17} /> },
    { label: 'Taxonomy', href: '/admin/taxonomy', icon: <Briefcase size={17} />, section: 'Controls' },
    { label: 'Complaints', href: '/admin/complaints', icon: <AlertTriangle size={17} /> },
    { label: 'Platform Reviews', href: '/admin/platform-reviews', icon: <MessageSquare size={17} /> },
    { label: 'Managed Search', href: '/admin/recruitment', icon: <Briefcase size={17} /> },
    { label: 'Settings', href: '/admin/settings', icon: <Settings size={17} /> },
  ],
}

const workspaceLabel = {
  talent: 'Talent workspace',
  employer: 'Property workspace',
  admin: 'Platform control',
} as const

export default function DashboardShell({ children, role, userName, intro }: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [agencyShell, setAgencyShell] = useState<'checking' | 'employer' | 'public'>('checking')
  const [access, setAccess] = useState<Partial<Record<FeatureKey, FeatureAccess>>>({})
  // The notification bell lived only in the public Navbar, which the
  // signed-in shell never renders - so every offer, interview invitation,
  // hire confirmation and verification result the platform carefully creates
  // was invisible to anybody working inside their dashboard, unless they
  // happened to navigate back to the dashboard home page.
  const [viewerId, setViewerId] = useState<string | null>(null)
  const pathname = usePathname()
  const supabase = createClient()
  const [accountFocus, setAccountFocus] = useState<string | null>(null)
  const [hasConsultancy, setHasConsultancy] = useState(false)
  const baseItems = role === 'talent' && accountFocus === 'consultant' ? navItems.consultant : navItems[role]
  // Shown to somebody who actually has a practice listed, and to nobody else.
  const consultancyItem: NavItem = { label: 'Consultancy', href: '/talent/consultancy', icon: <Lightbulb size={17} /> }
  const items: NavItem[] = role === 'talent' && accountFocus !== 'consultant' && hasConsultancy
    ? [...baseItems.slice(0, 5), consultancyItem, ...baseItems.slice(5)]
    : baseItems
  const isPublicAgencyRoute = pathname === '/agency'
  const showRecruitmentPipeline = (role === 'talent' && pathname === '/talent/applications') || (role === 'employer' && pathname === '/employer/applications')
  const showPostHireActions = role === 'employer' && pathname === '/employer/applications'
  const showPostHireReviews = (role === 'talent' && pathname === '/talent/applications') || (role === 'employer' && pathname === '/employer/hired')
  const showJobsTalentSponsor = (role === 'talent' && pathname === '/talent/jobs') || (role === 'employer' && pathname === '/employer/candidates')
  const activityRole: 'talent' | 'employer' | null = role === 'talent' && pathname === '/talent/dashboard' ? 'talent' : role === 'employer' && pathname === '/employer/dashboard' ? 'employer' : null

  useEffect(() => {
    let active = true
    getViewer().then(user => { if (active) setViewerId(user?.id || null) }).catch(() => { })
    return () => { active = false }
  }, [])

  // The heartbeat behind "who has been online today".
  //
  // auth.users.last_sign_in_at was the only signal there was, and it answers a
  // different question badly: a session lasts weeks, so somebody who signed in
  // once and has used the platform daily ever since still reads as one visit
  // months ago.
  //
  // It fires on each page a signed-in person opens and then every five
  // minutes, which is the same bucket the server counts in - so a tab left
  // open overnight adds nothing, and the figure stays minutes of actual use
  // rather than wall-clock hours.
  useEffect(() => {
    const workspace = role === 'talent' && accountFocus === 'consultant' ? 'consultant' : role
    const ping = () => {
      // A person reading a page in a background tab is not using the platform,
      // and counting them would inflate every number on the admin view.
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') return
      fetch('/api/activity/ping', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: workspace }),
        keepalive: true,
      }).catch(() => { })
    }
    ping()
    const timer = setInterval(ping, 5 * 60 * 1000)
    return () => clearInterval(timer)
  }, [pathname, role, accountFocus])

  useEffect(() => {
    let active = true
    async function loadAccess() {
      if (role === 'admin') return
      const user = await getViewer()
      if (!active || !user) return
      if (role === 'talent') {
        const { data } = await supabase.from('candidate_profiles').select('membership_tier,interview_ready_credits,academy_discount_pct,free_feature_credits,account_focus').eq('user_id', user.id).maybeSingle()
        if (active) { setAccess(talentFeatureAccess(data)); setAccountFocus(data?.account_focus || null) }
        const consultancy = await fetch('/api/consultancy/mine', { cache: 'no-store' })
          .then(res => res.ok ? res.json() : null).catch(() => null)
        if (active) setHasConsultancy(Boolean(consultancy?.profile))
      } else {
        const { data } = await supabase.from('employer_profiles').select('membership_tier,annual_job_allowance,annual_jobs_used,featured_employer,featured_until,talent_search_until').eq('user_id', user.id).maybeSingle()
        if (active) setAccess(employerFeatureAccess(data))
      }
    }
    loadAccess().catch(() => {})
    return () => { active = false }
  }, [role])

  useEffect(() => {
    if (!isPublicAgencyRoute) return
    let active = true
    getViewer().then(async user => {
      if (!active) return
      if (!user) { setAgencyShell('public'); return }
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle()
      if (!active) return
      setAgencyShell(profile?.role === 'employer' ? 'employer' : 'public')
    }).catch(() => { if (active) setAgencyShell('public') })
    return () => { active = false }
  }, [isPublicAgencyRoute])

  const handleSignOut = async () => {
    forgetViewer()
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const isActive = (href: string) => pathname === href || (href.split('/').length > 3 && pathname.startsWith(`${href}/`))

  if (isPublicAgencyRoute && agencyShell !== 'employer') {
    return <div className="min-h-screen bg-white"><Navbar /><main id="main-content" className="pt-[68px]"><div className="p-5 md:p-8 lg:p-10 xl:p-12 max-w-[1560px] mx-auto">{agencyShell === 'checking' ? <div className="flex min-h-[55vh] items-center justify-center"><div className="h-8 w-8 animate-spin rounded-full border-2 border-[#555555] border-t-transparent" /></div> : children}</div></main></div>
  }

  return <div className="dashboard-shell min-h-screen">
    <header className="lg:hidden sticky top-0 z-30 bg-[#f1f1f1] text-ink px-4 py-3.5 flex items-center justify-between border-b border-[#dddddd]"><button type="button" onClick={() => setSidebarOpen(true)} aria-label="Open dashboard navigation" className="p-1 -ml-1 text-ink"><Menu size={22}/></button><div className="text-center leading-none"><Wordmark compact href={null}/><p className="mt-1.5 text-[8px] uppercase tracking-[0.2em] text-muted">{workspaceLabel[role]}</p></div><div className="flex items-center gap-2">{viewerId && <NotificationBell userId={viewerId} />}<UniversalSearch variant="navbar" /></div></header>
    {sidebarOpen && <div className="fixed inset-0 bg-[#0f0f0f]/60 backdrop-blur-[1px] z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    <aside className={`dashboard-sidebar fixed top-0 left-0 flex h-full w-[264px] flex-col text-ink z-50 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      <div className="shrink-0 px-7 pt-7 pb-4"><div className="flex items-center justify-between"><Wordmark/><button type="button" onClick={() => setSidebarOpen(false)} className="lg:hidden text-muted hover:text-ink p-1" aria-label="Close dashboard navigation"><X size={19}/></button></div><div className="mt-7 pb-5 border-b border-[#dddddd]"><p className="text-muted text-[8px] uppercase tracking-[0.22em] font-semibold">{workspaceLabel[role]}</p>{userName && <p className="font-serif text-ink text-[22px] leading-tight mt-2 truncate">{userName}</p>}</div></div>
      <nav aria-label="Dashboard navigation" className="min-h-0 flex-1 overflow-y-auto px-4 pb-4">{items.map((item,index)=>{const active=isActive(item.href);const itemAccess=item.accessKey?access[item.accessKey]:undefined;const locked=itemAccess?.state==='locked';const limited=itemAccess?.state==='limited';const href=locked?(itemAccess?.upgradeHref||item.href):item.href;return <div key={item.href}>{item.section&&<p className={`${index===0?'mt-1':'mt-5'} mb-1.5 px-3 text-[8px] font-semibold uppercase tracking-[0.2em] text-muted`}>{item.section}</p>}<Link href={href} onClick={()=>setSidebarOpen(false)} title={locked ? itemAccess?.label || 'Upgrade to unlock' : limited ? itemAccess?.label : undefined} aria-label={locked ? `${item.label}. ${itemAccess?.label || 'Locked feature'}` : item.label} className={`dashboard-nav-item relative flex items-center gap-3 px-3 py-2 text-[12.5px] transition-colors border-l ${active&&!locked?'text-ink font-medium bg-white border-ink':locked?'text-muted hover:text-secondary hover:bg-[#e7e7e7] border-transparent':'text-secondary hover:text-ink hover:bg-[#e7e7e7] border-transparent'}`}><span className={active&&!locked?'text-ink':locked?'text-muted':'text-secondary'}>{item.icon}</span><span className="tracking-[-0.01em]">{item.label}</span>{locked?<span className="ml-auto flex items-center gap-1 text-[9px] uppercase tracking-[0.08em] text-muted"><Lock size={11}/></span>:limited?<span className="ml-auto text-[9px] text-muted">{itemAccess?.label}</span>:active?<ChevronRight size={12} className="ml-auto text-ink"/>:null}</Link></div>})}</nav>
      <div className="shrink-0 px-4 py-4 bg-[#f1f1f1] border-t border-[#dddddd]"><button type="button" onClick={handleSignOut} className="dashboard-nav-item flex items-center gap-3 px-3 py-2.5 text-[12.5px] text-secondary hover:text-ink hover:bg-[#e7e7e7] w-full transition-colors"><LogOut size={17}/><span>Sign out</span></button></div>
    </aside>
    <main id="main-content" className="lg:ml-[264px] min-h-screen"><div className="hidden lg:flex h-[52px] items-center justify-end gap-4 border-b border-border bg-white px-10 xl:px-12">{viewerId && <NotificationBell userId={viewerId} />}<UniversalSearch variant="dashboard" /></div><div className="p-5 sm:p-6 md:p-8 lg:p-10 xl:p-12 max-w-[1540px] mx-auto">{intro?<div className="mb-8">{intro}</div>:null}{showJobsTalentSponsor?<div className="mb-7"><SponsoredAd placement="jobs_talent_sponsor" /></div>:null}{showPostHireActions?<PostHireActions/>:null}{showRecruitmentPipeline?<ApplicationPipelineHub role={role as 'talent'|'employer'}/>:null}{activityRole?<DashboardActivityCentre role={activityRole} consultantOnly={accountFocus === 'consultant'}/>:null}{showPostHireReviews?<PostHireReviews/>:null}{children}</div></main>
  </div>
}
