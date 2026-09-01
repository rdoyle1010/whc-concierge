'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Bell, BookOpen, BriefcaseBusiness, Building2, CalendarDays, CheckCircle2, MapPin, MessageSquare, Newspaper, Sparkles } from 'lucide-react'

type Role = 'talent' | 'employer'

type AttentionItem = { label: string; count: number; href: string; tone: string }
type ActivityItem = { id: string; type: string; title: string; message: string; link?: string | null; is_read: boolean; created_at: string }
type ActivityPayload = { unreadMessages: number; unreadNotifications: number; attention: AttentionItem[]; recent: ActivityItem[] }

const iconFor = (type: string) => {
  if (type === 'new_message') return <MessageSquare size={15} />
  if (type === 'job_application') return <BriefcaseBusiness size={15} />
  if (type === 'review_received') return <CheckCircle2 size={15} />
  return <Bell size={15} />
}

const relativeTime = (value: string) => {
  const then = new Date(value).getTime(); const diff = Math.max(0, Date.now() - then); const minutes = Math.floor(diff / 60000)
  if (minutes < 1) return 'Just now'; if (minutes < 60) return `${minutes}m ago`; const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`; const days = Math.floor(hours / 24); if (days < 7) return `${days}d ago`
  return new Date(value).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })
}

export default function DashboardActivityCentre({ role }: { role: Role }) {
  const [data, setData] = useState<ActivityPayload | null>(null); const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch(`/api/dashboard/activity?role=${role}`, { cache: 'no-store' }).then(async response => response.ok ? response.json() : null).then(payload => { if (active) setData(payload) }).catch(() => {}).finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [role])

  const websiteReason = role === 'talent'
    ? 'Browse the public role marketplace, properties, Agency, Academy, Residency and Journal. Your dashboard is your private account; the main website is where you discover the wider platform.'
    : 'See the platform exactly as Talent sees it, browse properties and roles, and explore Agency, Academy, Residency and Journal. Your dashboard is for managing your business; the main website is the public marketplace.'

  if (loading) return <><Link href="/" className="mb-5 flex items-center justify-between gap-5 rounded-2xl bg-[#0b2f4d] px-5 py-4 text-white shadow-sm"><div><p className="text-[9px] font-semibold uppercase tracking-[.17em] text-white/55">Wider platform</p><p className="mt-1 text-[16px] font-semibold">Explore the main Wellness House website</p></div><ArrowRight size={19}/></Link><div className="dashboard-card mb-8 animate-pulse"><div className="h-4 w-44 rounded bg-surface"/><div className="mt-5 grid gap-3 md:grid-cols-3">{[1,2,3].map(i=><div key={i} className="h-20 rounded-xl bg-surface"/>)}</div></div></>
  if (!data) return null

  const hasAttention = data.attention.length > 0 || data.unreadMessages > 0
  const exploreLinks = [
    { href: '/jobs', label: 'Browse Roles', note: role === 'talent' ? 'See the public role marketplace and live opportunities.' : 'See the role marketplace as Talent sees it.', icon: <BriefcaseBusiness size={16}/> },
    { href: '/properties', label: 'Properties', note: 'Explore approved spa and wellness employers.', icon: <Building2 size={16}/> },
    { href: '/agency/about', label: 'Agency', note: 'See flexible staffing, availability and how Agency works.', icon: <CalendarDays size={16}/> },
    { href: '/academy', label: 'Academy', note: 'Explore learning, development and live courses.', icon: <BookOpen size={16}/> },
    { href: '/residency', label: 'Residency', note: 'Explore specialist placements and longer-form opportunities.', icon: <MapPin size={16}/> },
    { href: '/blog', label: 'Journal', note: 'Read industry insight, ideas and Wellness House updates.', icon: <Newspaper size={16}/> },
  ]

  return <>
    <Link href="/" className="mb-5 flex flex-col gap-3 rounded-2xl bg-[#0b2f4d] px-5 py-5 text-white shadow-sm transition hover:bg-[#123f64] sm:flex-row sm:items-center sm:justify-between">
      <div className="max-w-3xl"><p className="text-[9px] font-semibold uppercase tracking-[.17em] text-white/55">Your dashboard + the wider platform</p><p className="mt-1 text-[18px] font-semibold">Explore the main Wellness House website</p><p className="mt-1.5 text-[11px] leading-5 text-white/65">{websiteReason}</p></div>
      <span className="inline-flex shrink-0 items-center gap-2 text-[12px] font-semibold">Go to website <ArrowRight size={14}/></span>
    </Link>

    <section className="dashboard-card mb-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="dashboard-eyebrow !mb-1">Activity centre</p><h2 className="dashboard-section-title">What needs your attention</h2><p className="mt-1 text-[12px] text-muted">Important recruitment activity and conversations, all in one place.</p></div>{data.unreadNotifications > 0 && <span className="inline-flex items-center gap-2 rounded-full bg-[#f5f6f8] px-3 py-1.5 text-[11px] font-semibold text-[#10283b]"><Bell size={13}/>{data.unreadNotifications} new update{data.unreadNotifications === 1 ? '' : 's'}</span>}</div>
      {hasAttention ? <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">{data.unreadMessages > 0 && <Link href={`/${role}/messages`} className="rounded-2xl border border-[#e3e7eb] bg-[#f5f6f8] p-4 transition hover:border-[#5a6a76]"><div className="flex items-center justify-between"><span className="text-[#0b2f4d]"><MessageSquare size={17}/></span><span className="text-2xl font-serif text-[#10283b]">{data.unreadMessages}</span></div><p className="mt-3 text-[12px] font-semibold text-ink">Unread messages</p><p className="mt-1 text-[11px] text-muted">Open conversations</p></Link>}{data.attention.map(item => <Link key={`${item.label}-${item.href}`} href={item.href} className="rounded-2xl border border-[#e3e7eb] bg-[#f5f6f8] p-4 transition hover:border-[#5a6a76]"><div className="flex items-center justify-between"><span className="text-[#10283b]">{item.label.toLowerCase().includes('interview') ? <CalendarDays size={17}/> : item.label.toLowerCase().includes('hire') || item.label.toLowerCase().includes('offer') ? <CheckCircle2 size={17}/> : <BriefcaseBusiness size={17}/>}</span><span className="text-2xl font-serif text-[#10283b]">{item.count}</span></div><p className="mt-3 text-[12px] font-semibold text-ink">{item.label}</p><p className="mt-1 inline-flex items-center gap-1 text-[11px] text-[#10283b]">Review now <ArrowRight size={11}/></p></Link>)}</div> : <div className="mt-5 flex items-center gap-3 rounded-2xl border border-[#e3e7eb] bg-[#f5f6f8] px-4 py-4"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700"><CheckCircle2 size={17}/></div><div><p className="text-[12px] font-semibold text-ink">You are up to date</p><p className="mt-0.5 text-[11px] text-muted">There are no urgent recruitment actions waiting right now.</p></div></div>}
      <div className="mt-6 border-t border-[#e3e7eb] pt-5"><div className="mb-3 flex items-center gap-2"><Sparkles size={14} className="text-[#10283b]"/><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#10283b]">Recent activity</p></div>{data.recent.length === 0 ? <p className="text-[12px] text-muted">No recent updates yet.</p> : <div>{data.recent.slice(0,5).map(item => { const content = <div className="dashboard-list-row !py-3"><div className="flex min-w-0 items-start gap-3"><span className={`mt-0.5 ${item.is_read ? 'text-muted' : 'text-[#10283b]'}`}>{iconFor(item.type)}</span><div className="min-w-0"><p className={`truncate text-[12px] ${item.is_read ? 'font-medium text-ink' : 'font-semibold text-ink'}`}>{item.title}</p><p className="mt-0.5 line-clamp-1 text-[11px] text-muted">{item.message}</p></div></div><span className="shrink-0 text-[10px] text-muted">{relativeTime(item.created_at)}</span></div>; return item.link ? <Link key={item.id} href={item.link}>{content}</Link> : <div key={item.id}>{content}</div> })}</div>}</div>
      <div className="mt-6 border-t border-[#e3e7eb] pt-5"><div className="mb-1 flex items-center gap-2"><Sparkles size={14} className="text-[#0b2f4d]"/><p className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#0b2f4d]">Explore Wellness House</p></div><p className="mb-4 text-[12px] text-muted">Quick links into the public platform without signing out of your account.</p><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{exploreLinks.map(link => <Link key={link.href} href={link.href} className="group flex items-start gap-3 rounded-xl border border-[#e3e7eb] bg-white p-3.5 transition hover:border-[#6b7580] hover:bg-[#f5f6f8]"><span className="mt-0.5 text-[#0b2f4d]">{link.icon}</span><span className="min-w-0"><span className="flex items-center gap-1 text-[12px] font-semibold text-ink">{link.label}<ArrowRight size={11} className="opacity-45 transition group-hover:translate-x-0.5 group-hover:opacity-100"/></span><span className="mt-1 block text-[10.5px] leading-4 text-muted">{link.note}</span></span></Link>)}</div></div>
    </section>
  </>
}
