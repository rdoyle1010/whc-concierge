import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer' | 'admin'
type Card = { title: string; copy: string; href?: '/jobs' | '/applications' | '/agency' | '/agency-account' | '/messages' | '/profile' | '/notifications' | '/interview-ready' | '/discover-talent' | '/saved' | '/residency' | '/residency-setup' | '/billing' | '/property-profile' | '/academy' | '/reputation' | '/tour'; locked?: boolean; badge?: string }

const talentCards: Card[] = [
  { title: 'Start here', copy: 'A 60-second guide to your profile, matches, applications, Agency, Academy and Interview Ready.', href: '/tour', badge: 'GUIDE' },
  { title: 'Matches & Jobs', copy: 'Browse live roles and open the complete job and employer detail.', href: '/jobs' },
  { title: 'Saved Roles', copy: 'Come back to the opportunities you are considering.', href: '/saved' },
  { title: 'Applications', copy: 'Track every role you have applied for and withdraw interest if needed.', href: '/applications' },
  { title: 'Agency shifts', copy: 'See your day-by-day availability and upcoming flexible work.', href: '/agency' },
  { title: 'Residency', copy: 'Manage specialist residency offers and longer-form placements.', href: '/residency' },
  { title: 'Interview Ready', copy: 'Prepare using your CV, the role and the employer.', href: '/interview-ready' },
  { title: 'WHC Academy', copy: 'Learn, complete assessments and build visible professional development.', href: '/academy' },
  { title: 'Reputation & Reviews', copy: 'See your verified star rating, reviews and employer references.', href: '/reputation' },
  { title: 'Membership & Billing', copy: 'See your plan, credits and Featured Talent status.', href: '/billing' },
  { title: 'Messages', copy: 'Keep conversations with employers in one place.', href: '/messages' },
  { title: 'Profile & Stealth', copy: 'Update your profile visibility and Stealth Mode.', href: '/profile' },
]

const employerCards: Card[] = [
  { title: 'Start here', copy: 'A 60-second guide to posting roles, finding Talent, Agency, applications and your property profile.', href: '/tour', badge: 'GUIDE' },
  { title: 'Jobs', copy: 'Post, edit, publish, close and fill roles from the app.', href: '/jobs' },
  { title: 'Property Profile', copy: 'Manage property photos, spa details and staff travel information.', href: '/property-profile' },
  { title: 'Applications', copy: 'Review candidates and recruitment progress.', href: '/applications' },
  { title: 'Discover Talent', copy: 'Search visible spa and wellness professionals.', href: '/discover-talent', locked: true, badge: 'PRO' },
  { title: 'Agency bookings', copy: 'See flexible staffing bookings for your property.', href: '/agency' },
  { title: 'Residency', copy: 'Discover specialist talent and manage structured offers.', href: '/residency' },
  { title: 'Reputation & Reviews', copy: 'See your property star rating, verified reviews and reference requests.', href: '/reputation' },
  { title: 'Membership & Billing', copy: 'See your plan and manage subscription billing.', href: '/billing' },
  { title: 'Messages', copy: 'Keep candidate conversations together.', href: '/messages' },
]

export default function HomeScreen() {
  const [role, setRole] = useState<Role>('talent')
  const [name, setName] = useState('')
  const [membership, setMembership] = useState('free')
  const [interviewCredits, setInterviewCredits] = useState(0)
  const [profileCompletion, setProfileCompletion] = useState(0)
  const [reviewScore, setReviewScore] = useState(0)
  const [reviewCount, setReviewCount] = useState(0)
  const [unreadMessages, setUnreadMessages] = useState(0)
  const [unreadNotifications, setUnreadNotifications] = useState(0)
  const [agencyAttention, setAgencyAttention] = useState(0)

  useEffect(() => { load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    const { data: profile } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle()
    const resolved: Role = profile?.role === 'employer' ? 'employer' : profile?.role === 'admin' ? 'admin' : 'talent'
    if (resolved === 'admin') { router.replace('/admin'); return }
    setRole(resolved); setName(profile?.full_name || '')

    const [{count:messageCount},{count:notificationCount}] = await Promise.all([
      supabase.from('messages').select('id',{count:'exact',head:true}).eq('recipient_id',user.id).eq('read',false),
      supabase.from('notifications').select('id',{count:'exact',head:true}).eq('user_id',user.id).eq('is_read',false),
    ])
    setUnreadMessages(messageCount||0)
    setUnreadNotifications(notificationCount||0)

    if (resolved === 'talent') {
      const { data } = await supabase.from('candidate_profiles').select('id,membership_tier,interview_ready_credits,profile_completion_pct,profile_completion_score,review_score,review_count').eq('user_id', user.id).maybeSingle()
      setMembership(data?.membership_tier || 'free')
      setInterviewCredits(Math.max(0, Number(data?.interview_ready_credits || 0)))
      setProfileCompletion(Math.max(0, Math.min(100, Number(data?.profile_completion_pct ?? data?.profile_completion_score ?? 0))))
      setReviewScore(Number(data?.review_score || 0))
      setReviewCount(Number(data?.review_count || 0))
      if(data?.id){
        const {count}=await supabase.from('agency_bookings').select('id',{count:'exact',head:true}).eq('candidate_id',data.id).in('status',['pending','offered','requested'])
        setAgencyAttention(count||0)
      }
    } else {
      const { data } = await supabase.from('employer_profiles').select('id,membership_tier,review_score,review_count').eq('user_id', user.id).maybeSingle()
      setMembership(data?.membership_tier || 'free')
      setReviewScore(Number(data?.review_score || 0))
      setReviewCount(Number(data?.review_count || 0))
      if(data?.id){
        const {count}=await supabase.from('agency_bookings').select('id',{count:'exact',head:true}).eq('employer_id',data.id).in('status',['pending','offered','requested'])
        setAgencyAttention(count||0)
      }
    }
  }

  async function signOut() { await supabase.auth.signOut(); router.replace('/') }

  const premiumEmployer = role === 'employer' && ['pro','group'].includes(membership.toLowerCase())
  const cards = (role === 'employer' ? employerCards : talentCards).map(card => {
    if (role === 'employer' && card.title === 'Discover Talent') return { ...card, locked: !premiumEmployer }
    if (role === 'talent' && card.title === 'Interview Ready') return { ...card, locked: interviewCredits < 1, badge: interviewCredits > 0 ? `${interviewCredits} LEFT` : 'LOCKED' }
    if (card.title === 'Messages' && unreadMessages > 0) return { ...card, badge: `${unreadMessages} NEW` }
    if ((card.title === 'Agency shifts' || card.title === 'Agency bookings') && agencyAttention > 0) return { ...card, badge: `${agencyAttention} NEW` }
    return card
  })

  const totalAttention = unreadMessages + unreadNotifications + agencyAttention

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <View style={styles.topRow}><View><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>{role === 'employer' ? 'EMPLOYER' : 'TALENT'}</Text></View><Pressable onPress={signOut}><Text style={styles.signOut}>Sign out</Text></Pressable></View>
    <Text style={styles.eyebrow}>{role === 'employer' ? 'PROPERTY WORKSPACE' : 'YOUR CAREER'}</Text>
    <Text style={styles.title}>{name ? `Hello, ${name.split(' ')[0]}.` : 'Welcome back.'}</Text>
    <Text style={styles.intro}>{role === 'employer' ? 'Recruit, manage and connect using the same live platform as the website.' : 'Your roles, applications, development and messages in one mobile workspace.'}</Text>

    {totalAttention > 0 ? <View style={styles.attentionBox}>
      <View style={styles.attentionHeader}><Text style={styles.attentionTitle}>Needs your attention</Text><Text style={styles.attentionTotal}>{totalAttention}</Text></View>
      {unreadMessages>0?<Pressable onPress={()=>router.push('/messages')} style={styles.attentionRow}><Text style={styles.attentionText}>New messages</Text><Text style={styles.attentionCount}>{unreadMessages}</Text></Pressable>:null}
      {agencyAttention>0?<Pressable onPress={()=>router.push('/agency')} style={styles.attentionRow}><Text style={styles.attentionText}>{role==='employer'?'Agency booking updates':'Agency shift updates'}</Text><Text style={styles.attentionCount}>{agencyAttention}</Text></Pressable>:null}
      {unreadNotifications>0?<Pressable onPress={()=>router.push('/notifications')} style={styles.attentionRow}><Text style={styles.attentionText}>Other notifications</Text><Text style={styles.attentionCount}>{unreadNotifications}</Text></Pressable>:null}
    </View>:null}

    <Pressable onPress={() => router.push('/reputation')} style={styles.ratingCard}>
      <View><Text style={styles.ratingLabel}>{role === 'employer' ? 'PROPERTY REPUTATION' : 'YOUR REPUTATION'}</Text><Text style={styles.ratingValue}>{reviewCount > 0 ? `${reviewScore.toFixed(1)} ★` : 'New'}</Text></View>
      <View style={styles.ratingRight}><Text style={styles.ratingCount}>{reviewCount} verified review{reviewCount === 1 ? '' : 's'}</Text><Text style={styles.ratingOpen}>View reputation →</Text></View>
    </Pressable>

    {role === 'talent' && profileCompletion < 100 ? <Pressable onPress={() => router.push('/profile')} style={styles.progressCard}><Text style={styles.progressTitle}>Profile {profileCompletion}% complete</Text><Text style={styles.progressCopy}>Improve your profile to give matching and employers stronger evidence.</Text></Pressable> : null}
    <View style={styles.grid}>{cards.map(card => <Pressable key={card.title} onPress={()=>card.href&&router.push(card.href)} style={[styles.card,card.locked&&styles.lockedCard,card.badge?.includes('NEW')&&styles.attentionCard]}><View style={styles.cardTop}><Text style={styles.cardTitle}>{card.title}</Text>{card.badge?<Text style={[styles.badge,card.badge.includes('NEW')&&styles.newBadge]}>{card.badge}</Text>:null}</View><Text style={styles.cardCopy}>{card.copy}</Text><Text style={styles.open}>{card.locked?'View access →':'Open →'}</Text></Pressable>)}</View>
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:22,paddingBottom:32},topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32},wordmark:{color:'#092b45',fontSize:21,letterSpacing:2,fontWeight:'600'},sub:{color:'#6f7f88',marginTop:4,fontSize:9,letterSpacing:3},signOut:{color:'#71808a',fontSize:12},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:18},attentionBox:{borderWidth:1,borderColor:'#f1b5b5',backgroundColor:'#fff8f8',padding:15,marginBottom:14},attentionHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6},attentionTitle:{color:'#8f1d1d',fontSize:14,fontWeight:'700'},attentionTotal:{backgroundColor:'#d62828',color:'#fff',minWidth:22,height:22,borderRadius:11,textAlign:'center',lineHeight:22,fontSize:10,fontWeight:'800'},attentionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:8,borderTopWidth:1,borderTopColor:'#f5dada'},attentionText:{color:'#5c3434',fontSize:12},attentionCount:{color:'#d62828',fontSize:12,fontWeight:'800'},ratingCard:{backgroundColor:'#092b45',padding:16,marginBottom:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},ratingLabel:{color:'#b8c4cc',fontSize:8,letterSpacing:1.5},ratingValue:{color:'#fff',fontSize:24,fontWeight:'600',marginTop:4},ratingRight:{alignItems:'flex-end',flex:1},ratingCount:{color:'#d7e0e5',fontSize:10},ratingOpen:{color:'#fff',fontSize:10,fontWeight:'700',marginTop:6},progressCard:{backgroundColor:'#f4f7f8',padding:16,marginBottom:16},progressTitle:{color:'#173246',fontSize:13,fontWeight:'600'},progressCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:6},grid:{gap:12},card:{borderWidth:1,borderColor:'#dce3e7',padding:18,backgroundColor:'#fff'},lockedCard:{backgroundColor:'#f8f9fa'},attentionCard:{borderColor:'#efb2b2',backgroundColor:'#fffafa'},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:10},cardTitle:{color:'#173246',fontSize:17,fontWeight:'600',flex:1},badge:{color:'#71808a',fontSize:8,letterSpacing:1},newBadge:{color:'#d62828',fontWeight:'800'},cardCopy:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:7},open:{color:'#092b45',fontSize:11,fontWeight:'700',marginTop:12}})
