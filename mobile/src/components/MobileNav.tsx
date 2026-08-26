import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { router, usePathname } from 'expo-router'
import { supabase } from '../lib/supabase'

type Role = 'talent' | 'employer'
type NavItem = { label: string; href: string; symbol: string }

const talentItems: NavItem[] = [
  { label: 'Home', href: '/home', symbol: '⌂' },
  { label: 'Jobs', href: '/jobs', symbol: '◎' },
  { label: 'Saved', href: '/saved', symbol: '♡' },
  { label: 'Messages', href: '/messages', symbol: '✉' },
  { label: 'Profile', href: '/profile', symbol: '○' },
]

const employerItems: NavItem[] = [
  { label: 'Home', href: '/home', symbol: '⌂' },
  { label: 'Jobs', href: '/jobs', symbol: '◎' },
  { label: 'Applicants', href: '/applications', symbol: '◇' },
  { label: 'Messages', href: '/messages', symbol: '✉' },
  { label: 'Agency', href: '/agency', symbol: '○' },
]

export default function MobileNav() {
  const pathname = usePathname()
  const [role, setRole] = useState<Role>('talent')
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)

  useEffect(() => {
    if (pathname === '/login' || pathname === '/') return
    let active = true
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user || !active) return
      const [{ data: account }, { count: messageCount }, { count: notificationCount }] = await Promise.all([
        supabase.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        supabase.from('messages').select('id', { count: 'exact', head: true }).eq('recipient_id', user.id).eq('read', false),
        supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
      ])
      setRole(account?.role === 'employer' ? 'employer' : 'talent')
      setUnreadMessages(messageCount || 0)
      setUnreadNotifications(notificationCount || 0)
    }
    load()
    return () => { active = false }
  }, [pathname])

  if (pathname === '/login' || pathname === '/' || pathname.startsWith('/message/') || pathname.startsWith('/job/')) return null
  const items = role === 'employer' ? employerItems : talentItems

  return <View style={styles.wrap}>
    {items.map(item => {
      const active = pathname === item.href
      const badge = item.href === '/messages' ? unreadMessages : item.href === '/home' ? unreadNotifications : 0
      return <Pressable key={item.href} onPress={() => router.replace(item.href as never)} style={styles.item}>
        <View style={styles.iconWrap}>
          <Text style={[styles.symbol, active && styles.active]}>{item.symbol}</Text>
          {badge > 0 ? <View style={styles.badge}><Text style={styles.badgeText}>{badge > 9 ? '9+' : badge}</Text></View> : null}
        </View>
        <Text style={[styles.label, active && styles.active]}>{item.label}</Text>
      </Pressable>
    })}
  </View>
}

const styles = StyleSheet.create({
  wrap: { height: 76, paddingBottom: 10, borderTopWidth: 1, borderTopColor: '#e6ebee', backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around' },
  item: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4 },
  iconWrap: { position: 'relative', minWidth: 28, alignItems: 'center' },
  symbol: { color: '#8a969d', fontSize: 20, lineHeight: 22 },
  label: { color: '#8a969d', fontSize: 9, letterSpacing: .2 },
  active: { color: '#092b45', fontWeight: '700' },
  badge: { position: 'absolute', top: -5, right: -6, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 8, backgroundColor: '#092b45', alignItems: 'center', justifyContent: 'center' },
  badgeText: { color: '#fff', fontSize: 8, fontWeight: '700' },
})
