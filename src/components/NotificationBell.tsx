'use client'

import { useEffect, useState, useRef } from 'react'
import { Bell, Check, MessageSquare, Briefcase, Star, UserCheck, Sparkles } from 'lucide-react'
import Link from 'next/link'

const TYPE_ICON: Record<string, any> = {
  new_message: <MessageSquare size={14} className="text-blue-500" />,
  job_application: <Briefcase size={14} className="text-accent" />,
  new_match: <Sparkles size={14} className="text-emerald-500" />,
  profile_approved: <UserCheck size={14} className="text-emerald-500" />,
  review_received: <Star size={14} className="text-amber-400" />,
  general: <Bell size={14} className="text-muted" />,
}

export default function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const ref = useRef<HTMLDivElement>(null)
  const loadedOnce = useRef(false)

  const load = async () => {
    if (document.visibilityState === 'hidden') return
    const res = await fetch('/api/notifications', { cache: 'no-store' })
    if (res.ok) {
      const data = await res.json()
      setNotifications(data.notifications || [])
      setUnreadCount(data.unreadCount || 0)
      loadedOnce.current = true
    }
  }

  // One lightweight load when the bell first appears. After that, refresh far
  // less aggressively and only while the tab is visible. Opening the bell always
  // refreshes immediately, so users still see current notifications on demand.
  useEffect(() => { load() }, [userId])

  useEffect(() => {
    const interval = setInterval(() => {
      if (loadedOnce.current && document.visibilityState === 'visible') load()
    }, 120000)
    const onVisible = () => {
      if (document.visibilityState === 'visible' && loadedOnce.current) load()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [userId])

  useEffect(() => {
    const h = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const markRead = async (id: string) => {
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
    setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n))
    setUnreadCount(Math.max(0, unreadCount - 1))
  }

  const markAllAsRead = async () => {
    await fetch('/api/notifications', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAll: true }),
    })
    setNotifications(notifications.map(n => ({ ...n, is_read: true })))
    setUnreadCount(0)
  }

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    const days = Math.floor(hours / 24)
    return `${days}d ago`
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => { setOpen(!open); if (!open) load() }}
        aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : 'Notifications'}
        aria-expanded={open} aria-haspopup="menu"
        className="relative p-2 text-secondary hover:text-ink transition-colors">
        <Bell size={17} />
        {unreadCount > 0 && (
          <span className="absolute top-0.5 right-0.5 w-[14px] h-[14px] bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[340px] bg-white border border-border rounded-xl shadow-lg animate-fade-in overflow-hidden z-50">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <p className="text-[13px] font-medium text-ink">Notifications</p>
            {unreadCount > 0 && (
              <button type="button" onClick={markAllAsRead}
                className="text-[11px] text-accent hover:underline flex items-center gap-1">
                <Check size={10} /> Mark all read
              </button>
            )}
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <Bell size={24} className="mx-auto text-muted/40 mb-2" />
                <p className="text-[13px] text-muted">No notifications yet</p>
              </div>
            ) : (
              notifications.map(n => {
                const inner = (
                  <div className={`flex gap-3 px-4 py-3 hover:bg-surface transition-colors cursor-pointer ${!n.is_read ? 'bg-blue-50/40' : ''}`}
                    onClick={() => { if (!n.is_read) markRead(n.id); setOpen(false) }}>
                    <div className="mt-0.5 shrink-0">{TYPE_ICON[n.type] || TYPE_ICON.general}</div>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[13px] leading-snug ${!n.is_read ? 'text-ink font-medium' : 'text-secondary'}`}>{n.title}</p>
                      <p className="text-[12px] text-muted leading-snug mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-[10px] text-muted mt-1">{timeAgo(n.created_at)}</p>
                    </div>
                    {!n.is_read && <div className="w-2 h-2 bg-accent rounded-full mt-1.5 shrink-0" />}
                  </div>
                )
                return n.link ? <Link key={n.id} href={n.link}>{inner}</Link> : <div key={n.id}>{inner}</div>
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}
