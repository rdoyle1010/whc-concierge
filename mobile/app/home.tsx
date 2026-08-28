import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role='talent'|'employer'|'admin'
type Card={title:string;copy:string;href:string;badge?:string;locked?:boolean}

const talentCards:Card[]=[
 {title:'Applications',copy:'Track active applications, interviews and offers.',href:'/applications'},
 {title:'Agency shifts',copy:'Find and manage flexible spa shifts.',href:'/agency'},
 {title:'Residency',copy:'Manage specialist residency opportunities.',href:'/residency'},
 {title:'Interview Ready',copy:'Prepare from your CV, the role and the employer.',href:'/interview-ready'},
 {title:'WHC Academy',copy:'Build your professional development and certificates.',href:'/academy'},
 {title:'Before You Arrive',copy:'Open arrival packs for confirmed placements and shifts.',href:'/before-you-arrive'},
 {title:'Reputation & Reviews',copy:'See verified reviews and references.',href:'/reputation'},
 {title:'Membership & Billing',copy:'Manage your plan, credits and Featured Talent.',href:'/billing'},
 {title:'Notifications',copy:'See updates and platform history. These do not inflate the red attention count.',href:'/notifications'},
 {title:'Security, Safety & Legal',copy:'Privacy, GDPR, safety guidance and account protection.',href:'/security'},
]

const employerCards:Card[]=[
 {title:'Applications',copy:'Review active candidates, interviews and offers.',href:'/applications'},
 {title:'Agency bookings',copy:'Manage flexible staffing responses.',href:'/agency'},
 {title:'Property Profile',copy:'Manage property photos and spa information.',href:'/property-profile'},
 {title:'Residency',copy:'Manage specialist residency opportunities.',href:'/residency'},
 {title:'Analytics',copy:'Track recruitment and role performance.',href:'/analytics'},
 {title:'Discover Talent',copy:'Search visible spa and wellness professionals.',href:'/discover-talent'},
 {title:'Reputation & Reviews',copy:'See verified employer reviews and references.',href:'/reputation'},
 {title:'Membership & Billing',copy:'Manage your plan and Featured Employer visibility.',href:'/billing'},
 {title:'Notifications',copy:'See updates and platform history. These do not inflate the red attention count.',href:'/notifications'},
 {title:'Security, Safety & Legal',copy:'Privacy, GDPR, safety guidance and account protection.',href:'/security'},
]

export default function HomeScreen(){
 const [role,setRole]=useState<Role>('talent')
 const [name,setName]=useState('')
 const [membership,setMembership]=useState('free')
 const [interviewCredits,setInterviewCredits]=useState(0)
 const [profileCompletion,setProfileCompletion]=useState(0)
 const [reviewScore,setReviewScore]=useState(0)
 const [reviewCount,setReviewCount]=useState(0)
 const [unreadMessages,setUnreadMessages]=useState(0)
 const [agencyAttention,setAgencyAttention]=useState(0)

 useFocusEffect(useCallback(()=>{void load()},[]))

 async function load(){
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){router.replace('/login');return}
  const {data:profile}=await supabase.from('profiles').select('role,full_name').eq('id',user.id).maybeSingle()
  const resolved:Role=profile?.role==='employer'?'employer':profile?.role==='admin'?'admin':'talent'
  if(resolved==='admin'){router.replace('/admin');return}
  setRole(resolved)
  setName(profile?.full_name||'')

  const {count:messageCount}=await supabase.from('messages').select('id',{count:'exact',head:true}).eq('recipient_id',user.id).eq('read',false)
  setUnreadMessages(messageCount||0)

  if(resolved==='talent'){
   const {data}=await supabase.from('candidate_profiles').select('id,membership_tier,interview_ready_credits,profile_completion_pct,profile_completion_score,review_score,review_count').eq('user_id',user.id).maybeSingle()
   setMembership(data?.membership_tier||'free')
   setInterviewCredits(Math.max(0,Number(data?.interview_ready_credits||0)))
   setProfileCompletion(Math.max(0,Math.min(100,Number(data?.profile_completion_pct??data?.profile_completion_score??0))))
   setReviewScore(Number(data?.review_score||0));setReviewCount(Number(data?.review_count||0))
   if(data?.id){const {count}=await supabase.from('agency_bookings').select('id',{count:'exact',head:true}).eq('candidate_id',data.id).in('status',['pending','offered','requested','countered']);setAgencyAttention(count||0)}else setAgencyAttention(0)
  }else{
   const {data}=await supabase.from('employer_profiles').select('id,membership_tier,review_score,review_count').eq('user_id',user.id).maybeSingle()
   setMembership(data?.membership_tier||'free');setReviewScore(Number(data?.review_score||0));setReviewCount(Number(data?.review_count||0))
   if(data?.id){const {count}=await supabase.from('agency_bookings').select('id',{count:'exact',head:true}).eq('employer_id',data.id).in('status',['pending','offered','requested','countered']);setAgencyAttention(count||0)}else setAgencyAttention(0)
  }
 }

 async function signOut(){await supabase.auth.signOut();router.replace('/')}

 const totalAttention=unreadMessages+agencyAttention
 const cards=(role==='employer'?employerCards:talentCards).map(card=>{
  if(role==='talent'&&card.title==='Interview Ready')return{...card,locked:interviewCredits<1,badge:interviewCredits>0?`${interviewCredits} LEFT`:'LOCKED'}
  if((card.title==='Agency shifts'||card.title==='Agency bookings')&&agencyAttention>0)return{...card,badge:`${agencyAttention} ACTION`}
  return card
 })

 return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
  <View style={styles.topRow}><View><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>{role==='employer'?'EMPLOYER':'TALENT'}</Text></View><Pressable onPress={signOut}><Text style={styles.signOut}>Sign out</Text></Pressable></View>
  <Text style={styles.eyebrow}>{role==='employer'?'PROPERTY WORKSPACE':'YOUR CAREER'}</Text>
  <Text style={styles.title}>{name?`Hello, ${name.split(' ')[0]}.`:'Welcome back.'}</Text>
  <Text style={styles.intro}>{role==='employer'?'Recruit, manage and connect.':'Discover roles in Jobs, save what interests you, apply with AI and track everything in Applications.'}</Text>

  {totalAttention>0?<View style={styles.attentionBox}><View style={styles.attentionHeader}><Text style={styles.attentionTitle}>Needs your attention</Text><Text style={styles.attentionTotal}>{totalAttention}</Text></View><Text style={styles.attentionHelp}>This red number now only means something you genuinely need to act on.</Text>{unreadMessages>0?<Pressable onPress={()=>router.push('/messages')} style={styles.attentionRow}><Text style={styles.attentionText}>Unread messages</Text><Text style={styles.attentionCount}>{unreadMessages}</Text></Pressable>:null}{agencyAttention>0?<Pressable onPress={()=>router.push('/agency')} style={styles.attentionRow}><Text style={styles.attentionText}>{role==='employer'?'Agency responses waiting':'Agency shifts needing a response'}</Text><Text style={styles.attentionCount}>{agencyAttention}</Text></Pressable>:null}</View>:<View style={styles.caughtUp}><Text style={styles.caughtUpTitle}>You’re up to date</Text><Text style={styles.caughtUpCopy}>No unread messages or Agency responses are waiting.</Text></View>}

  <View style={styles.quickRow}>
   <Pressable onPress={()=>router.push('/jobs')} style={styles.quickPrimary}><Text style={styles.quickPrimaryTitle}>{role==='employer'?'Manage jobs':'Find jobs'}</Text><Text style={styles.quickPrimaryCopy}>{role==='employer'?'Post and manage live roles.':'Swipe roles and apply with AI.'}</Text></Pressable>
   <Pressable onPress={()=>router.push('/applications')} style={styles.quickSecondary}><Text style={styles.quickSecondaryTitle}>Applications</Text><Text style={styles.quickSecondaryCopy}>Track active recruitment.</Text></Pressable>
  </View>

  <Pressable onPress={()=>router.push('/reputation')} style={styles.ratingCard}><View><Text style={styles.ratingLabel}>{role==='employer'?'PROPERTY REPUTATION':'YOUR REPUTATION'}</Text><Text style={styles.ratingValue}>{reviewCount>0?`${reviewScore.toFixed(1)} ★`:'New'}</Text></View><View style={styles.ratingRight}><Text style={styles.ratingCount}>{reviewCount} verified review{reviewCount===1?'':'s'}</Text><Text style={styles.ratingOpen}>View full reputation →</Text></View></Pressable>

  {role==='talent'&&profileCompletion<100?<Pressable onPress={()=>router.push('/profile')} style={styles.progressCard}><Text style={styles.progressTitle}>Profile {profileCompletion}% complete</Text><Text style={styles.progressCopy}>Improve your profile to strengthen matching and applications.</Text></Pressable>:null}

  <View style={styles.grid}>{cards.map(card=><Pressable key={card.title} onPress={()=>router.push(card.href as never)} style={[styles.card,card.locked&&styles.lockedCard,card.badge?.includes('ACTION')&&styles.attentionCard]}><View style={styles.cardTop}><Text style={styles.cardTitle}>{card.title}</Text>{card.badge?<Text style={[styles.badge,card.badge.includes('ACTION')&&styles.newBadge]}>{card.badge}</Text>:null}</View><Text style={styles.cardCopy}>{card.copy}</Text><Text style={styles.open}>{card.locked?'View access →':'Open →'}</Text></Pressable>)}</View>
 </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:22,paddingBottom:32},topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:32},wordmark:{color:'#092b45',fontSize:21,letterSpacing:2,fontWeight:'600'},sub:{color:'#6f7f88',marginTop:4,fontSize:9,letterSpacing:3},signOut:{color:'#71808a',fontSize:12},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:18},attentionBox:{borderWidth:1,borderColor:'#f1b5b5',backgroundColor:'#fff8f8',padding:15,marginBottom:14},attentionHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:6},attentionTitle:{color:'#8f1d1d',fontSize:14,fontWeight:'700'},attentionTotal:{backgroundColor:'#d62828',color:'#fff',minWidth:22,height:22,borderRadius:11,textAlign:'center',lineHeight:22,fontSize:10,fontWeight:'800'},attentionHelp:{color:'#7b5555',fontSize:10,lineHeight:15,marginBottom:5},attentionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:8,borderTopWidth:1,borderTopColor:'#f5dada'},attentionText:{color:'#5c3434',fontSize:12},attentionCount:{color:'#d62828',fontSize:12,fontWeight:'800'},caughtUp:{borderWidth:1,borderColor:'#d8e6dd',backgroundColor:'#f7fbf8',padding:14,marginBottom:14},caughtUpTitle:{color:'#315846',fontSize:13,fontWeight:'700'},caughtUpCopy:{color:'#60776a',fontSize:10.5,lineHeight:16,marginTop:4},quickRow:{flexDirection:'row',gap:10,marginBottom:14},quickPrimary:{flex:1,backgroundColor:'#092b45',padding:16},quickPrimaryTitle:{color:'#fff',fontSize:15,fontWeight:'700'},quickPrimaryCopy:{color:'#d6e0e6',fontSize:10.5,lineHeight:15,marginTop:5},quickSecondary:{flex:1,borderWidth:1,borderColor:'#cfd9de',padding:16},quickSecondaryTitle:{color:'#092b45',fontSize:15,fontWeight:'700'},quickSecondaryCopy:{color:'#71808a',fontSize:10.5,lineHeight:15,marginTop:5},ratingCard:{backgroundColor:'#092b45',padding:16,marginBottom:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:12},ratingLabel:{color:'#b8c4cc',fontSize:8,letterSpacing:1.5},ratingValue:{color:'#fff',fontSize:24,fontWeight:'600',marginTop:4},ratingRight:{alignItems:'flex-end',flex:1},ratingCount:{color:'#d7e0e5',fontSize:10},ratingOpen:{color:'#fff',fontSize:10,fontWeight:'700',marginTop:6},progressCard:{backgroundColor:'#f4f7f8',padding:16,marginBottom:16},progressTitle:{color:'#173246',fontSize:13,fontWeight:'600'},progressCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:6},grid:{gap:12},card:{borderWidth:1,borderColor:'#dce3e7',padding:18,backgroundColor:'#fff'},lockedCard:{backgroundColor:'#f8f9fa'},attentionCard:{borderColor:'#efb2b2',backgroundColor:'#fffafa'},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:10},cardTitle:{color:'#173246',fontSize:17,fontWeight:'600',flex:1},badge:{color:'#71808a',fontSize:8,letterSpacing:1},newBadge:{color:'#d62828',fontWeight:'800'},cardCopy:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:7},open:{color:'#092b45',fontSize:11,fontWeight:'700',marginTop:12}})
