import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer' | 'admin'
type Card = { title: string; copy: string; href?: '/jobs' | '/applications' | '/agency' | '/messages' | '/profile' | '/notifications' | '/interview-ready' | '/discover-talent' | '/saved' | '/residency' | '/billing'; locked?: boolean; badge?: string }

const talentCards: Card[] = [
  { title: 'Matches & Jobs', copy: 'Browse live roles and open the complete job and employer detail.', href: '/jobs' },
  { title: 'Saved Roles', copy: 'Come back to the opportunities you are considering.', href: '/saved' },
  { title: 'Applications', copy: 'Track every role you have applied for and withdraw interest if needed.', href: '/applications' },
  { title: 'Agency shifts', copy: 'See your day-by-day availability and upcoming flexible work.', href: '/agency' },
  { title: 'Residency', copy: 'Manage specialist residency offers, negotiations and longer-form placements.', href: '/residency' },
  { title: 'Interview Ready', copy: 'Prepare using your CV, the role and the employer.', href: '/interview-ready' },
  { title: 'Membership & Billing', copy: 'See your plan, credits, Featured Talent status and subscription settings.', href: '/billing' },
  { title: 'Messages', copy: 'Keep conversations with employers in one place.', href: '/messages' },
  { title: 'Notifications', copy: 'See application, booking and platform updates.', href: '/notifications' },
  { title: 'Profile & Stealth', copy: 'Update your profile visibility, alerts and Stealth Mode.', href: '/profile' },
]

const employerCards: Card[] = [
  { title: 'Jobs', copy: 'See and manage the same opportunities as your web workspace.', href: '/jobs' },
  { title: 'Applications', copy: 'Review candidates and see where they sit in the recruitment process.', href: '/applications' },
  { title: 'Discover Talent', copy: 'Search visible spa and wellness professionals.', href: '/discover-talent', locked: true, badge: 'PRO' },
  { title: 'Agency bookings', copy: 'See upcoming flexible staffing bookings for your property.', href: '/agency' },
  { title: 'Residency', copy: 'Discover specialist talent, start private conversations and send structured offers.', href: '/residency' },
  { title: 'Membership & Billing', copy: 'See your plan, annual allowance and manage employer subscription billing.', href: '/billing' },
  { title: 'Messages', copy: 'Keep candidate conversations together.', href: '/messages' },
  { title: 'Notifications', copy: 'See recruitment, booking and platform updates.', href: '/notifications' },
  { title: 'Analytics', copy: 'Understand applications, matching and role performance.', locked: true, badge: 'PRO' },
]

export default function HomeScreen() {
  const params = useLocalSearchParams<{ role?: string }>()
  const [role, setRole] = useState<Role>((params.role as Role) || 'talent')
  const [name, setName] = useState('')
  const [membership, setMembership] = useState('free')
  const [interviewCredits, setInterviewCredits] = useState(0)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [unread, setUnread] = useState(0)

  useEffect(() => { load() }, [])
  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const [{ data: profile }, { count: unreadCount }] = await Promise.all([
      supabase.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle(),
      supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('user_id', user.id).eq('is_read', false),
    ])
    setUnread(unreadCount || 0)
    const resolved: Role = profile?.role === 'employer' ? 'employer' : profile?.role === 'admin' ? 'admin' : 'talent'
    setRole(resolved); setName(profile?.full_name || '')
    if (resolved === 'talent') {
      const { data } = await supabase.from('candidate_profiles').select('membership_tier,interview_ready_credits,profile_completion_pct,profile_completion_score').eq('user_id', user.id).maybeSingle()
      setMembership(data?.membership_tier || 'free'); setInterviewCredits(Math.max(0, Number(data?.interview_ready_credits || 0)))
      setProfileCompletion(Math.max(0, Math.min(100, Number(data?.profile_completion_pct ?? data?.profile_completion_score ?? 0))))
    } else if (resolved === 'employer') {
      const { data } = await supabase.from('employer_profiles').select('membership_tier').eq('user_id', user.id).maybeSingle()
      setMembership(data?.membership_tier || 'free')
    }
  }
  async function signOut() { await supabase.auth.signOut(); router.replace('/login') }

  if (role === 'admin') return <View style={styles.page}><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.title}>Admin stays web-first.</Text><Text style={styles.intro}>The mobile app is focused on Talent and Employer workflows. Full platform administration remains on the web dashboard.</Text><Pressable onPress={signOut} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Sign out</Text></Pressable></View>

  const premiumEmployer = role === 'employer' && ['pro','group'].includes(membership.toLowerCase())
  const cards = (role === 'employer' ? employerCards : talentCards).map(card => {
    if (role === 'employer' && card.title === 'Discover Talent') return { ...card, locked: !premiumEmployer }
    if (role === 'employer' && card.title === 'Analytics') return { ...card, locked: !premiumEmployer }
    if (role === 'talent' && card.title === 'Interview Ready') return { ...card, locked: interviewCredits < 1, badge: interviewCredits > 0 ? `${interviewCredits} LEFT` : 'LOCKED' }
    if (card.title === 'Notifications' && unread > 0) return { ...card, badge: `${unread} NEW` }
    return card
  })

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <View style={styles.topRow}><View><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>{role === 'employer' ? 'EMPLOYER' : 'TALENT'}</Text></View><Pressable onPress={signOut}><Text style={styles.signOut}>Sign out</Text></Pressable></View>
    <Text style={styles.eyebrow}>{role === 'employer' ? 'PROPERTY WORKSPACE' : 'YOUR CAREER'}</Text><Text style={styles.title}>{name ? `Hello, ${name.split(' ')[0]}.` : 'Welcome back.'}</Text><Text style={styles.intro}>{role === 'employer' ? 'Recruit, manage and connect from the same platform you already use on the web.' : 'Your jobs, applications, shifts, development and messages in one mobile workspace.'}</Text>
    {role === 'talent' && profileCompletion < 100 ? <Pressable onPress={() => router.push('/profile')} style={styles.progressCard}><View style={styles.progressTop}><Text style={styles.progressTitle}>Profile {profileCompletion}% complete</Text><Text style={styles.progressAction}>Improve profile →</Text></View><View style={styles.track}><View style={[styles.fill,{width:`${Math.max(6,profileCompletion)}%`}]} /></View><Text style={styles.progressCopy}>A stronger profile gives the matching engine more evidence to work with and helps employers understand your fit.</Text></Pressable> : null}
    <View style={styles.grid}>{cards.map(card => { const isLocked=Boolean(card.locked); const canOpen=Boolean(card.href); return <Pressable key={card.title} disabled={!canOpen} onPress={()=>card.href&&router.push(card.href)} style={[styles.card,isLocked&&styles.lockedCard]}><View style={styles.cardTop}><Text style={[styles.cardTitle,isLocked&&styles.lockedText]}>{card.title}</Text>{card.badge?<Text style={styles.badge}>{isLocked?'🔒 ':''}{card.badge}</Text>:null}</View><Text style={styles.cardCopy}>{card.copy}</Text>{canOpen?<Text style={styles.open}>{isLocked?'View access →':'Open →'}</Text>:<Text style={styles.lockCopy}>Available on the web while this mobile screen is being built.</Text>}</Pressable> })}</View>
    <View style={styles.notice}><Text style={styles.noticeTitle}>Same platform. Same account.</Text><Text style={styles.noticeCopy}>Everything here reads from the existing Wellness House Talent platform, so changes made in the app and website stay in sync.</Text></View>
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{flexGrow:1,backgroundColor:'#fff',paddingHorizontal:22,paddingTop:68,paddingBottom:28},topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:46},wordmark:{color:'#092b45',fontSize:20,letterSpacing:1.8,fontWeight:'600'},sub:{color:'#6f7f88',marginTop:4,fontSize:9,letterSpacing:3},signOut:{color:'#71808a',fontSize:12,paddingTop:4},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:32,lineHeight:38,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:22,maxWidth:520},progressCard:{backgroundColor:'#f4f7f8',padding:18,marginBottom:18},progressTop:{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'center'},progressTitle:{color:'#173246',fontSize:13,fontWeight:'600'},progressAction:{color:'#092b45',fontSize:10,fontWeight:'600'},track:{height:5,backgroundColor:'#dbe3e7',marginTop:12,overflow:'hidden'},fill:{height:5,backgroundColor:'#092b45'},progressCopy:{color:'#71808a',fontSize:10,lineHeight:15,marginTop:10},grid:{gap:12},card:{borderWidth:1,borderColor:'#dce3e7',padding:20,backgroundColor:'#fff'},lockedCard:{backgroundColor:'#f8f9fa',borderColor:'#e5e9eb'},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:10},cardTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginBottom:7,flex:1},lockedText:{color:'#738089'},badge:{color:'#71808a',fontSize:8,letterSpacing:1.1,paddingTop:3},cardCopy:{color:'#71808a',fontSize:12,lineHeight:18},open:{color:'#092b45',fontSize:11,fontWeight:'600',marginTop:13},lockCopy:{color:'#7c878d',fontSize:10,marginTop:13},notice:{marginTop:26,backgroundColor:'#f4f7f8',padding:18},noticeTitle:{color:'#173246',fontSize:13,fontWeight:'600',marginBottom:6},noticeCopy:{color:'#71808a',fontSize:11,lineHeight:17},secondaryButton:{borderWidth:1,borderColor:'#092b45',paddingVertical:15,alignItems:'center',marginTop:24},secondaryButtonText:{color:'#092b45',fontWeight:'600'}})
