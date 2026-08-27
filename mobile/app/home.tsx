import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer' | 'admin'
type Card = { title: string; copy: string; href?: '/jobs' | '/applications' | '/agency' | '/agency-account' | '/messages' | '/profile' | '/notifications' | '/interview-ready' | '/discover-talent' | '/saved' | '/residency' | '/residency-setup' | '/billing' | '/property-profile' | '/academy' | '/reputation'; locked?: boolean; badge?: string }

const talentCards: Card[] = [
  { title: 'Matches & Jobs', copy: 'Browse live roles and open the complete job and employer detail.', href: '/jobs' },
  { title: 'Saved Roles', copy: 'Come back to the opportunities you are considering.', href: '/saved' },
  { title: 'Applications', copy: 'Track every role you have applied for and withdraw interest if needed.', href: '/applications' },
  { title: 'Agency shifts', copy: 'See your day-by-day availability and upcoming flexible work.', href: '/agency' },
  { title: 'Residency', copy: 'Manage specialist residency offers and longer-form placements.', href: '/residency' },
  { title: 'Interview Ready', copy: 'Prepare using your CV, the role and the employer.', href: '/interview-ready' },
  { title: 'WHC Academy', copy: 'Learn, complete assessments and build visible professional development.', href: '/academy' },
  { title: 'Membership & Billing', copy: 'See your plan, credits and Featured Talent status.', href: '/billing' },
  { title: 'Messages', copy: 'Keep conversations with employers in one place.', href: '/messages' },
  { title: 'Profile & Stealth', copy: 'Update your profile visibility and Stealth Mode.', href: '/profile' },
]

const employerCards: Card[] = [
  { title: 'Jobs', copy: 'Post, edit, publish, close and fill roles from the app.', href: '/jobs' },
  { title: 'Property Profile', copy: 'Manage property photos, spa details and staff travel information.', href: '/property-profile' },
  { title: 'Applications', copy: 'Review candidates and recruitment progress.', href: '/applications' },
  { title: 'Discover Talent', copy: 'Search visible spa and wellness professionals.', href: '/discover-talent', locked: true, badge: 'PRO' },
  { title: 'Agency bookings', copy: 'See flexible staffing bookings for your property.', href: '/agency' },
  { title: 'Residency', copy: 'Discover specialist talent and manage structured offers.', href: '/residency' },
  { title: 'Membership & Billing', copy: 'See your plan and manage subscription billing.', href: '/billing' },
  { title: 'Messages', copy: 'Keep candidate conversations together.', href: '/messages' },
]

export default function HomeScreen() {
  const [role, setRole] = useState<Role>('talent')
  const [name, setName] = useState('')
  const [membership, setMembership] = useState('free')
  const [interviewCredits, setInterviewCredits] = useState(0)
  const [profileCompletion, setProfileCompletion] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle()
    const resolved: Role = profile?.role === 'employer' ? 'employer' : profile?.role === 'admin' ? 'admin' : 'talent'
    if (resolved === 'admin') { router.replace('/admin'); return }
    setRole(resolved); setName(profile?.full_name || '')
    if (resolved === 'talent') {
      const { data } = await supabase.from('candidate_profiles').select('membership_tier,interview_ready_credits,profile_completion_pct,profile_completion_score').eq('user_id', user.id).maybeSingle()
      setMembership(data?.membership_tier || 'free')
      setInterviewCredits(Math.max(0, Number(data?.interview_ready_credits || 0)))
      setProfileCompletion(Math.max(0, Math.min(100, Number(data?.profile_completion_pct ?? data?.profile_completion_score ?? 0))))
    } else {
      const { data } = await supabase.from('employer_profiles').select('membership_tier').eq('user_id', user.id).maybeSingle()
      setMembership(data?.membership_tier || 'free')
    }
  }

  async function signOut() { await supabase.auth.signOut(); router.replace('/') }

  const premiumEmployer = role === 'employer' && ['pro','group'].includes(membership.toLowerCase())
  const cards = (role === 'employer' ? employerCards : talentCards).map(card => {
    if (role === 'employer' && card.title === 'Discover Talent') return { ...card, locked: !premiumEmployer }
    if (role === 'talent' && card.title === 'Interview Ready') return { ...card, locked: interviewCredits < 1, badge: interviewCredits > 0 ? `${interviewCredits} LEFT` : 'LOCKED' }
    return card
  })

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <View style={styles.topRow}><View><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>{role === 'employer' ? 'EMPLOYER' : 'TALENT'}</Text></View><Pressable onPress={signOut}><Text style={styles.signOut}>Sign out</Text></Pressable></View>
    <Text style={styles.eyebrow}>{role === 'employer' ? 'PROPERTY WORKSPACE' : 'YOUR CAREER'}</Text>
    <Text style={styles.title}>{name ? `Hello, ${name.split(' ')[0]}.` : 'Welcome back.'}</Text>
    <Text style={styles.intro}>{role === 'employer' ? 'Recruit, manage and connect using the same live platform as the website.' : 'Your roles, applications, development and messages in one mobile workspace.'}</Text>
    {role === 'talent' && profileCompletion < 100 ? <Pressable onPress={() => router.push('/profile')} style={styles.progressCard}><Text style={styles.progressTitle}>Profile {profileCompletion}% complete</Text><Text style={styles.progressCopy}>Improve your profile to give matching and employers stronger evidence.</Text></Pressable> : null}
    <View style={styles.grid}>{cards.map(card => <Pressable key={card.title} onPress={()=>card.href&&router.push(card.href)} style={[styles.card,card.locked&&styles.lockedCard]}><View style={styles.cardTop}><Text style={styles.cardTitle}>{card.title}</Text>{card.badge?<Text style={styles.badge}>{card.badge}</Text>:null}</View><Text style={styles.cardCopy}>{card.copy}</Text><Text style={styles.open}>{card.locked?'View access →':'Open →'}</Text></Pressable>)}</View>
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:22,paddingBottom:32},topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:40},wordmark:{color:'#092b45',fontSize:21,letterSpacing:2,fontWeight:'600'},sub:{color:'#6f7f88',marginTop:4,fontSize:9,letterSpacing:3},signOut:{color:'#71808a',fontSize:12},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:20},progressCard:{backgroundColor:'#f4f7f8',padding:16,marginBottom:16},progressTitle:{color:'#173246',fontSize:13,fontWeight:'600'},progressCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:6},grid:{gap:12},card:{borderWidth:1,borderColor:'#dce3e7',padding:18,backgroundColor:'#fff'},lockedCard:{backgroundColor:'#f8f9fa'},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:10},cardTitle:{color:'#173246',fontSize:17,fontWeight:'600',flex:1},badge:{color:'#71808a',fontSize:8,letterSpacing:1},cardCopy:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:7},open:{color:'#092b45',fontSize:11,fontWeight:'700',marginTop:12}})
