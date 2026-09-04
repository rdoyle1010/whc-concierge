import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

type Role='talent'|'employer'|'admin'
type Card={title:string;copy:string;href:string;badge?:string;locked?:boolean}

const talentCards:Card[]=[
 {title:'Agency shifts',copy:'Flexible spa shifts and live responses.',href:'/agency'},
 {title:'Residency',copy:'Specialist opportunities and confirmed placements.',href:'/residency'},
 {title:'Interview Ready',copy:'Prepare using your CV, the role and the employer.',href:'/interview-ready'},
 {title:'Talent House Academy',copy:'Professional development and certificates.',href:'/academy'},
 {title:'Before You Arrive',copy:'Arrival packs for confirmed work.',href:'/before-you-arrive'},
 {title:'Membership & Billing',copy:'Plan, credits and Featured Talent.',href:'/billing'},
 {title:'Notifications',copy:'Platform updates and account history.',href:'/notifications'},
]

const employerCards:Card[]=[
 {title:'Talent Match',copy:'Match a live role with the strongest professionals.',href:'/match'},
 {title:'Agency bookings',copy:'Flexible staffing and live responses.',href:'/agency'},
 {title:'Property Profile',copy:'Photos, spa information and employer presence.',href:'/property-profile'},
 {title:'Residency',copy:'Specialist residency opportunities.',href:'/residency'},
 {title:'Analytics',copy:'Recruitment and role performance.',href:'/analytics'},
 {title:'Membership & Billing',copy:'Plan and Featured Employer visibility.',href:'/billing'},
 {title:'Notifications',copy:'Platform updates and account history.',href:'/notifications'},
 {title:'Security, Safety & Legal',copy:'Privacy, GDPR and account protection.',href:'/security'},
]

export default function HomeScreen(){
 const [role,setRole]=useState<Role>('talent')
 const [name,setName]=useState('')
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
  setRole(resolved);setName(profile?.full_name||'')

  const {count:messageCount}=await supabase.from('messages').select('id',{count:'exact',head:true}).eq('recipient_id',user.id).eq('read',false)
  setUnreadMessages(messageCount||0)

  if(resolved==='talent'){
   const {data}=await supabase.from('candidate_profiles').select('id,interview_ready_credits,profile_completion_pct,profile_completion_score,review_score,review_count').eq('user_id',user.id).maybeSingle()
   setInterviewCredits(Math.max(0,Number(data?.interview_ready_credits||0)))
   setProfileCompletion(Math.max(0,Math.min(100,Number(data?.profile_completion_pct??data?.profile_completion_score??0))))
   setReviewScore(Number(data?.review_score||0));setReviewCount(Number(data?.review_count||0))
   if(data?.id){const {count}=await supabase.from('agency_bookings').select('id',{count:'exact',head:true}).eq('candidate_id',data.id).in('status',['pending','offered','requested','countered']);setAgencyAttention(count||0)}else setAgencyAttention(0)
  }else{
   const {data}=await supabase.from('employer_profiles').select('id,review_score,review_count').eq('user_id',user.id).maybeSingle()
   setReviewScore(Number(data?.review_score||0));setReviewCount(Number(data?.review_count||0))
   if(data?.id){const {count}=await supabase.from('agency_bookings').select('id',{count:'exact',head:true}).eq('employer_id',data.id).in('status',['pending','offered','requested','countered']);setAgencyAttention(count||0)}else setAgencyAttention(0)
  }
 }

 async function signOut(){await supabase.auth.signOut();router.replace('/')}

 const totalAttention=unreadMessages+agencyAttention
 const firstName=name?name.split(' ')[0]:''
 const cards=(role==='employer'?employerCards:talentCards).map(card=>{
  if(role==='talent'&&card.title==='Interview Ready')return{...card,locked:interviewCredits<1,badge:interviewCredits>0?`${interviewCredits} credit${interviewCredits===1?'':'s'}`:'Locked'}
  if((card.title==='Agency shifts'||card.title==='Agency bookings')&&agencyAttention>0)return{...card,badge:`${agencyAttention} to review`}
  return card
 })

 return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
  <View style={styles.topRow}>
   <View><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>{role==='employer'?'EMPLOYER':'TALENT'}</Text></View>
   <Pressable onPress={signOut} hitSlop={10}><Text style={styles.signOut}>Sign out</Text></Pressable>
  </View>

  <Text style={styles.eyebrow}>{role==='employer'?'PROPERTY WORKSPACE':'YOUR CAREER'}</Text>
  <Text style={styles.title}>{firstName?`Good evening, ${firstName}.`:'Welcome back.'}</Text>
  <Text style={styles.intro}>{role==='employer'?'Everything you need to recruit, match and manage great people.':'Your jobs, applications, Agency work and career tools in one place.'}</Text>

  <Pressable onPress={()=>router.push(role==='employer'?'/jobs':'/jobs')} style={styles.primaryAction}>
   <Text style={styles.primaryEyebrow}>{role==='employer'?'RECRUITMENT':'NEXT STEP'}</Text>
   <Text style={styles.primaryTitle}>{role==='employer'?'Manage your live roles':'Find your next role'}</Text>
   <Text style={styles.primaryCopy}>{role==='employer'?'Post, edit and review roles, then move straight into matching and applications.':'Browse matched opportunities and move directly into your application journey.'}</Text>
   <Text style={styles.primaryLink}>{role==='employer'?'Open jobs':'Explore jobs'}  →</Text>
  </Pressable>

  <View style={styles.snapshotRow}>
   <Pressable onPress={()=>router.push('/messages')} style={styles.snapshotItem}>
    <Text style={styles.snapshotValue}>{unreadMessages}</Text><Text style={styles.snapshotLabel}>Unread</Text>
   </Pressable>
   <View style={styles.snapshotDivider}/>
   <Pressable onPress={()=>router.push('/agency')} style={styles.snapshotItem}>
    <Text style={styles.snapshotValue}>{agencyAttention}</Text><Text style={styles.snapshotLabel}>Agency actions</Text>
   </Pressable>
   <View style={styles.snapshotDivider}/>
   <Pressable onPress={()=>router.push('/reputation')} style={styles.snapshotItem}>
    <Text style={styles.snapshotValue}>{reviewCount>0?reviewScore.toFixed(1):'New'}</Text><Text style={styles.snapshotLabel}>Reputation</Text>
   </Pressable>
  </View>

  {totalAttention>0?<View style={styles.attentionBox}>
   <View style={styles.attentionHeader}><Text style={styles.attentionTitle}>Needs your attention</Text><Text style={styles.attentionTotal}>{totalAttention}</Text></View>
   {unreadMessages>0?<Pressable onPress={()=>router.push('/messages')} style={styles.attentionRow}><Text style={styles.attentionText}>Unread messages</Text><Text style={styles.attentionArrow}>→</Text></Pressable>:null}
   {agencyAttention>0?<Pressable onPress={()=>router.push('/agency')} style={styles.attentionRow}><Text style={styles.attentionText}>{role==='employer'?'Agency responses waiting':'Agency shifts needing a response'}</Text><Text style={styles.attentionArrow}>→</Text></Pressable>:null}
  </View>:null}

  {role==='talent'&&profileCompletion<100?<Pressable onPress={()=>router.push('/profile')} style={styles.profilePrompt}>
   <View style={styles.profilePromptTop}><Text style={styles.profilePromptTitle}>Complete your profile</Text><Text style={styles.profilePromptPct}>{profileCompletion}%</Text></View>
   <View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${profileCompletion}%`}]} /></View>
   <Text style={styles.profilePromptCopy}>A stronger profile improves matching and applications.</Text>
  </Pressable>:null}

  <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>YOUR WORKSPACE</Text><Text style={styles.sectionTitle}>{role==='employer'?'Run your recruitment':'Career tools'}</Text></View>
  <View style={styles.list}>{cards.map((card,index)=><Pressable key={card.title} onPress={()=>router.push(card.href as never)} style={[styles.listRow,index===0&&styles.listRowFirst]}>
   <View style={styles.listText}><View style={styles.listTitleRow}><Text style={styles.listTitle}>{card.title}</Text>{card.badge?<Text style={styles.badge}>{card.badge}</Text>:null}</View><Text style={styles.listCopy}>{card.copy}</Text></View>
   <Text style={styles.chevron}>›</Text>
  </Pressable>)}</View>
 </ScrollView>
}

const styles=StyleSheet.create({
 scroll:{flex:1,backgroundColor:palette.paper},
 page:{paddingHorizontal:space.page,paddingTop:22,paddingBottom:36},
 topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:38},
 wordmark:{color:palette.inkStrong,fontSize:20,letterSpacing:2.2,fontWeight:'700',fontFamily:type.sans},
 sub:{color:palette.quiet,marginTop:4,fontSize:9,letterSpacing:3,fontFamily:type.sans},
 signOut:{color:palette.muted,fontSize:12,fontFamily:type.sans},
 eyebrow:{color:palette.sage,fontSize:9,letterSpacing:2.2,marginBottom:10,fontWeight:'700',fontFamily:type.sans},
 title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
 intro:{color:palette.muted,fontSize:14,lineHeight:21,marginTop:10,marginBottom:24,fontFamily:type.sans},
 primaryAction:{backgroundColor:palette.inkStrong,padding:22,borderRadius:radius.medium,marginBottom:18},
 primaryEyebrow:{color:'#BFC9C4',fontSize:8,letterSpacing:1.9,fontWeight:'700',fontFamily:type.sans},
 primaryTitle:{color:'#fff',fontSize:24,lineHeight:29,fontFamily:type.serif,marginTop:8},
 primaryCopy:{color:'#D5DEDA',fontSize:12.5,lineHeight:19,marginTop:10,fontFamily:type.sans},
 primaryLink:{color:'#fff',fontSize:12,fontWeight:'700',marginTop:18,fontFamily:type.sans},
 snapshotRow:{flexDirection:'row',alignItems:'stretch',borderTopWidth:1,borderBottomWidth:1,borderColor:palette.line,marginBottom:20},
 snapshotItem:{flex:1,paddingVertical:16,alignItems:'center'},
 snapshotDivider:{width:1,backgroundColor:palette.line,marginVertical:12},
 snapshotValue:{color:palette.inkStrong,fontSize:20,fontFamily:type.serif},
 snapshotLabel:{color:palette.quiet,fontSize:9,marginTop:4,fontFamily:type.sans},
 attentionBox:{backgroundColor:palette.dangerSoft,borderRadius:radius.medium,paddingHorizontal:16,paddingTop:14,marginBottom:18},
 attentionHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingBottom:8},
 attentionTitle:{color:palette.danger,fontSize:13,fontWeight:'700',fontFamily:type.sans},
 attentionTotal:{color:palette.danger,fontSize:13,fontWeight:'800'},
 attentionRow:{borderTopWidth:1,borderTopColor:'#EEDDD9',paddingVertical:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 attentionText:{color:'#6E4540',fontSize:12,fontFamily:type.sans},
 attentionArrow:{color:palette.danger,fontSize:15},
 profilePrompt:{backgroundColor:palette.sageSoft,borderRadius:radius.medium,padding:16,marginBottom:24},
 profilePromptTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 profilePromptTitle:{color:palette.inkStrong,fontSize:13,fontWeight:'700',fontFamily:type.sans},
 profilePromptPct:{color:palette.sage,fontSize:11,fontWeight:'700'},
 progressTrack:{height:4,backgroundColor:'#DDE5DE',borderRadius:2,marginTop:12,overflow:'hidden'},
 progressFill:{height:4,backgroundColor:palette.sage,borderRadius:2},
 profilePromptCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:9,fontFamily:type.sans},
 sectionHeader:{marginTop:4,marginBottom:9},
 sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.9,fontWeight:'700',fontFamily:type.sans},
 sectionTitle:{color:palette.inkStrong,fontSize:22,fontFamily:type.serif,marginTop:6},
 list:{borderBottomWidth:1,borderBottomColor:palette.line},
 listRow:{minHeight:76,borderTopWidth:1,borderTopColor:palette.line,flexDirection:'row',alignItems:'center',paddingVertical:14},
 listRowFirst:{borderTopColor:palette.lineStrong},
 listText:{flex:1,paddingRight:14},
 listTitleRow:{flexDirection:'row',alignItems:'center',gap:8},
 listTitle:{color:palette.text,fontSize:15,fontWeight:'600',fontFamily:type.sans},
 badge:{color:palette.sage,fontSize:8.5,fontWeight:'700',textTransform:'uppercase'},
 listCopy:{color:palette.muted,fontSize:11,lineHeight:16,marginTop:4,fontFamily:type.sans},
 chevron:{color:palette.quiet,fontSize:25,fontWeight:'300'},
})
