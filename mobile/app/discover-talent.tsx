import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { calculateMatchScore } from '../src/lib/matching'
import { palette, radius, space, type } from '../src/lib/theme'

export default function DiscoverTalent(){
 const [items,setItems]=useState<any[]>([])
 const [jobs,setJobs]=useState<any[]>([])
 const [selectedJobId,setSelectedJobId]=useState('')
 const [loading,setLoading]=useState(true)
 const [locked,setLocked]=useState(false)

 useEffect(()=>{void load()},[])

 async function load(){
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){router.replace('/login');return}
  const {data:employer}=await supabase.from('employer_profiles').select('id,membership_tier').eq('user_id',user.id).maybeSingle()
  const tier=String(employer?.membership_tier||'free').toLowerCase()
  if(!['pro','group'].includes(tier)){setLocked(true);setLoading(false);return}
  const {data:jobRows}=employer?.id?await supabase.from('job_listings').select('*').eq('employer_id',employer.id).order('posted_date',{ascending:false}):{data:[] as any[]}
  setJobs(jobRows||[])
  if(jobRows?.[0]?.id)setSelectedJobId(jobRows[0].id)
  const {data}=await supabase.from('candidate_profiles').select('*').eq('profile_visible',true).eq('stealth_mode',false).order('is_featured',{ascending:false}).limit(100)
  setItems(data||[])
  setLoading(false)
 }

 const selectedJob=jobs.find(job=>job.id===selectedJobId)||null
 const ranked=useMemo(()=>items.map(item=>({item,match:selectedJob?calculateMatchScore(item,selectedJob):null})).sort((a,b)=>{
  if(Boolean(b.item.is_featured)!==Boolean(a.item.is_featured))return Number(Boolean(b.item.is_featured))-Number(Boolean(a.item.is_featured))
  return Number(b.match?.score||0)-Number(a.match?.score||0)
 }),[items,selectedJobId,jobs])

 if(locked)return <View style={styles.lockPage}>
  <Text style={styles.lockEyebrow}>EMPLOYER PRO</Text>
  <Text style={styles.lockTitle}>Search the market, not just your inbox.</Text>
  <Text style={styles.lockCopy}>Discover Talent gives Pro employers access to visible professionals across WHC, ranked against your live roles using the same matching logic as the website.</Text>
  <View style={styles.lockCard}><Text style={styles.lockCardTitle}>Included with Pro</Text><Text style={styles.lockLine}>Role-based match ranking</Text><Text style={styles.lockLine}>Verified and featured profile signals</Text><Text style={styles.lockLine}>Direct employer-to-talent messaging</Text></View>
  <Pressable onPress={()=>router.back()} style={styles.outline}><Text style={styles.outlineText}>Back to employer home</Text></Pressable>
 </View>

 return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
  <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
  <Text style={styles.eyebrow}>DISCOVER TALENT</Text>
  <Text style={styles.title}>Find people who fit the role.</Text>
  <Text style={styles.intro}>{selectedJob?'Talent is ranked against the role you choose, so you can see the strongest fit before starting a conversation.':'Choose one of your roles to turn the Talent directory into a ranked shortlist.'}</Text>

  {jobs.length?<View style={styles.rolePanel}>
   <Text style={styles.roleEyebrow}>MATCH AGAINST</Text>
   <Text style={styles.roleTitle}>{selectedJob?.job_title||'Choose a role'}</Text>
   <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobPicker}>{jobs.map(job=><Pressable key={job.id} onPress={()=>setSelectedJobId(job.id)} style={[styles.jobChip,selectedJobId===job.id&&styles.jobChipActive]}><Text style={[styles.jobChipText,selectedJobId===job.id&&styles.jobChipTextActive]}>{job.job_title}</Text></Pressable>)}</ScrollView>
  </View>:<View style={styles.notice}><Text style={styles.noticeEyebrow}>START WITH A ROLE</Text><Text style={styles.noticeTitle}>Post a role to unlock meaningful ranking.</Text><Text style={styles.noticeCopy}>Without a real job description and requirements, Talent can be browsed but not intelligently prioritised for your vacancy.</Text></View>}

  {loading?<View style={styles.loading}><ActivityIndicator color={palette.ink}/><Text style={styles.loadingText}>Building your Talent view…</Text></View>:null}

  {!loading?<>
   <View style={styles.resultsHeader}><View><Text style={styles.resultsEyebrow}>TALENT POOL</Text><Text style={styles.resultsTitle}>{ranked.length} visible professional{ranked.length===1?'':'s'}</Text></View>{selectedJob?<Text style={styles.rankLabel}>Ranked by fit</Text>:null}</View>
   <View style={styles.list}>{ranked.length?ranked.map(({item,match},index)=>{
    const display=item.show_first_name_only&&item.full_name?item.full_name.split(' ')[0]:item.full_name||'Talent profile'
    const headline=item.headline||[item.role_level,item.primary_specialism].filter(Boolean).join(' · ')
    return <View key={item.id} style={[styles.card,item.is_featured&&styles.featured]}>
     <View style={styles.cardTop}>
      <View style={styles.identity}><Text style={styles.position}>{String(index+1).padStart(2,'0')}</Text><View style={styles.nameBlock}><Text style={styles.name}>{display}</Text><Text style={styles.headline}>{headline||'Wellness professional'}</Text></View></View>
      {match?<View style={styles.matchBlock}><Text style={styles.matchScore}>{match.score}%</Text><Text style={styles.matchLabel}>MATCH</Text></View>:null}
     </View>

     <View style={styles.metaRow}>{item.location?<Text style={styles.meta}>{item.location}</Text>:null}{item.years_experience?<Text style={styles.meta}>{item.years_experience} yrs experience</Text>:null}</View>

     <View style={styles.signalRow}>{item.whc_verified?<View style={styles.signal}><Text style={styles.signalText}>WHC VERIFIED</Text></View>:null}{item.is_featured?<View style={styles.signal}><Text style={styles.signalText}>FEATURED</Text></View>:null}{Number(item.review_count||0)>0?<View style={styles.signal}><Text style={styles.signalText}>{Number(item.review_score||0).toFixed(1)} / 5 · {item.review_count} review{item.review_count===1?'':'s'}</Text></View>:null}</View>

     {match?.matchExplanation?<View style={styles.insight}><Text style={styles.insightEyebrow}>WHY THIS MATCH</Text><Text style={styles.explanation}>{match.matchExplanation}</Text></View>:null}
     {match?.hardStop?<View style={styles.warningBox}><Text style={styles.warningEyebrow}>CHECK BEFORE CONTACT</Text><Text style={styles.warning}>{match.hardStopReason}</Text></View>:null}

     <Pressable onPress={()=>router.push(`/message/${item.user_id}`)} style={styles.messageBtn}><Text style={styles.messageText}>Start conversation</Text><Text style={styles.arrow}>→</Text></Pressable>
    </View>
   }):<View style={styles.empty}><Text style={styles.emptyEyebrow}>NO VISIBLE TALENT</Text><Text style={styles.emptyTitle}>There is nobody to show here yet.</Text><Text style={styles.emptyCopy}>Visible professionals who are not using stealth mode will appear here automatically.</Text></View>}</View>
  </>:null}
 </ScrollView>
}

const styles=StyleSheet.create({
 scroll:{flex:1,backgroundColor:palette.stone},
 page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:100},
 backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
 back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
 eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9,fontFamily:type.sans},
 title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
 intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
 rolePanel:{backgroundColor:palette.inkStrong,borderRadius:radius.large,padding:18,marginBottom:18},
 roleEyebrow:{color:'#C7D0D2',fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
 roleTitle:{color:palette.paper,fontFamily:type.serif,fontSize:22,lineHeight:27,marginTop:5,marginBottom:13},
 jobPicker:{gap:7,paddingRight:4},
 jobChip:{borderWidth:1,borderColor:'rgba(255,255,255,.24)',paddingHorizontal:11,paddingVertical:8,borderRadius:radius.small},
 jobChipActive:{backgroundColor:palette.paper,borderColor:palette.paper},
 jobChipText:{color:'#D6DDDE',fontSize:9.5,fontFamily:type.sans},
 jobChipTextActive:{color:palette.inkStrong,fontWeight:'700'},
 notice:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:18,marginBottom:18},
 noticeEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
 noticeTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:20,lineHeight:25,marginTop:5},
 noticeCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
 loading:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:22,alignItems:'center'},
 loadingText:{color:palette.muted,fontSize:10,marginTop:10,fontFamily:type.sans},
 resultsHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',gap:12,marginTop:5,marginBottom:11},
 resultsEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
 resultsTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontFamily:type.serif,marginTop:4},
 rankLabel:{color:palette.sage,fontSize:8.5,fontWeight:'700',fontFamily:type.sans},
 list:{gap:11},
 card:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:17},
 featured:{borderColor:palette.lineStrong,backgroundColor:'#FBFCFC'},
 cardTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},
 identity:{flexDirection:'row',gap:11,flex:1},
 position:{color:palette.quiet,fontSize:8.5,fontWeight:'700',letterSpacing:1,fontFamily:type.sans,marginTop:4},
 nameBlock:{flex:1},
 name:{color:palette.inkStrong,fontSize:20,lineHeight:24,fontFamily:type.serif},
 headline:{color:palette.text,fontSize:10.5,lineHeight:16,marginTop:3,fontFamily:type.sans},
 matchBlock:{alignItems:'flex-end'},
 matchScore:{color:palette.inkStrong,fontSize:22,lineHeight:24,fontFamily:type.serif},
 matchLabel:{color:palette.quiet,fontSize:7,letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans,marginTop:2},
 metaRow:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:12},
 meta:{color:palette.muted,fontSize:9.5,fontFamily:type.sans},
 signalRow:{flexDirection:'row',flexWrap:'wrap',gap:6,marginTop:11},
 signal:{backgroundColor:palette.sageSoft,borderRadius:radius.small,paddingHorizontal:8,paddingVertical:5},
 signalText:{color:palette.sage,fontSize:7.5,fontWeight:'700',letterSpacing:.4,fontFamily:type.sans},
 insight:{backgroundColor:palette.stone,padding:13,borderRadius:radius.medium,marginTop:13},
 insightEyebrow:{color:palette.quiet,fontSize:7,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
 explanation:{color:palette.text,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
 warningBox:{backgroundColor:palette.dangerSoft,padding:13,borderRadius:radius.medium,marginTop:9},
 warningEyebrow:{color:palette.danger,fontSize:7,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
 warning:{color:palette.danger,fontSize:10,lineHeight:16,marginTop:4,fontFamily:type.sans},
 messageBtn:{marginTop:14,borderTopWidth:1,borderTopColor:palette.line,paddingTop:13,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
 messageText:{color:palette.ink,fontWeight:'700',fontSize:10.5,fontFamily:type.sans},
 arrow:{color:palette.ink,fontSize:15},
 empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:19},
 emptyEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
 emptyTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:20,lineHeight:25,marginTop:5},
 emptyCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
 lockPage:{flex:1,backgroundColor:palette.stone,padding:28,justifyContent:'center'},
 lockEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2,fontWeight:'700',fontFamily:type.sans},
 lockTitle:{color:palette.inkStrong,fontSize:31,lineHeight:37,fontWeight:'400',fontFamily:type.serif,marginTop:9},
 lockCopy:{color:palette.muted,fontSize:12.5,lineHeight:20,marginTop:10,maxWidth:360,fontFamily:type.sans},
 lockCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:17,marginTop:20},
 lockCardTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:18,marginBottom:8},
 lockLine:{color:palette.text,fontSize:10.5,lineHeight:19,fontFamily:type.sans},
 outline:{borderWidth:1,borderColor:palette.ink,paddingHorizontal:18,paddingVertical:13,marginTop:18,borderRadius:radius.medium,alignItems:'center'},
 outlineText:{color:palette.ink,fontWeight:'700',fontSize:10.5,fontFamily:type.sans},
})