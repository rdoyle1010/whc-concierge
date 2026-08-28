import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

type Counts = { users:number; employers:number; jobs:number; applications:number; agency:number }
type AdminTool={title:string;copy:string;path:string;eyebrow:string}
const WEB = (process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk').replace(/\/$/,'')

const CORE_TOOLS:AdminTool[]=[
  {eyebrow:'ANALYTICS & REPORTS',title:'Platform health',copy:'Recruitment funnel, scale, payment sources and operational attention.',path:'dashboard'},
  {eyebrow:'USERS',title:'Users & access',copy:'Review Talent, employers, verification and account access.',path:'users'},
  {eyebrow:'JOBS',title:'Job listings',copy:'Inspect live, draft, closed and filled recruitment roles.',path:'jobs'},
  {eyebrow:'PAYMENTS',title:'Payments & revenue',copy:'Commercial performance, recorded revenue and recurring platform value.',path:'revenue'},
  {eyebrow:'CONTENT',title:'Website & brand',copy:'Manage wording, imagery, navigation, sections and brand presentation.',path:'website'},
]

const OPERATIONS:AdminTool[]=[
  {eyebrow:'STAFFING',title:'Agency operations',copy:'Bookings, staffing, payouts and disputes.',path:'agency'},
  {eyebrow:'MATCHING',title:'Match activity',copy:'Review matching behaviour and platform recruitment activity.',path:'matches'},
  {eyebrow:'COMMUNICATION',title:'Platform messages',copy:'Review platform conversations where administration is required.',path:'messages'},
  {eyebrow:'QUALITY',title:'Complaints',copy:'Review issues, escalations and resolution work.',path:'complaints'},
  {eyebrow:'QUALITY',title:'Platform reviews',copy:'See Talent and property feedback about the platform.',path:'platform-reviews'},
  {eyebrow:'MARKETING',title:'Campaigns',copy:'Create, preview and send email and newsletter activity.',path:'campaigns'},
  {eyebrow:'COMMERCIAL',title:'Advertising',copy:'Manage paid placements and sponsored brand activity.',path:'advertising'},
  {eyebrow:'LEARNING',title:'Academy',copy:'Courses, learners and certificate operations.',path:'academy'},
  {eyebrow:'EDITORIAL',title:'Blog & Journal',copy:'Create and publish editorial content.',path:'blog'},
]

export default function AdminScreen() {
  const [name,setName]=useState('')
  const [counts,setCounts]=useState<Counts>({users:0,employers:0,jobs:0,applications:0,agency:0})
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  useEffect(()=>{ void load() },[])

  async function load(){
    setLoading(true);setError('')
    const { data:{ user } }=await supabase.auth.getUser()
    if(!user){ router.replace('/login?role=admin'); return }
    const { data: profile }=await supabase.from('profiles').select('role,full_name').eq('id',user.id).maybeSingle()
    if(profile?.role!=='admin'){
      await supabase.auth.signOut()
      router.replace('/login?role=admin')
      return
    }
    setName(profile?.full_name||'Admin')
    try{
      const [users,employers,jobs,applications,agency]=await Promise.all([
        supabase.from('profiles').select('id',{count:'exact',head:true}),
        supabase.from('employer_profiles').select('id',{count:'exact',head:true}),
        supabase.from('job_listings').select('id',{count:'exact',head:true}),
        supabase.from('applications').select('id',{count:'exact',head:true}),
        supabase.from('agency_bookings').select('id',{count:'exact',head:true}),
      ])
      setCounts({users:users.count||0,employers:employers.count||0,jobs:jobs.count||0,applications:applications.count||0,agency:agency.count||0})
    }catch{setError('Some live platform totals could not be loaded.')}
    setLoading(false)
  }

  async function signOut(){ await supabase.auth.signOut(); router.replace('/') }
  async function openAdmin(path:string){
    const url=`${WEB}/admin/${path}`
    const supported=await Linking.canOpenURL(url)
    if(supported)await Linking.openURL(url)
    else setError('The secure web admin area could not be opened on this device.')
  }

  const metrics=[
    ['Users',counts.users],['Employers',counts.employers],['Jobs',counts.jobs],['Applications',counts.applications],['Agency bookings',counts.agency],
  ] as const
  const firstName=name?name.split(' ')[0]:'Admin'

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <View style={styles.topRow}>
      <View><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>ADMIN</Text></View>
      <Pressable onPress={signOut} hitSlop={10}><Text style={styles.signOut}>Sign out</Text></Pressable>
    </View>

    <Text style={styles.eyebrow}>PLATFORM OPERATIONS</Text>
    <Text style={styles.title}>Good evening, {firstName}.</Text>
    <Text style={styles.intro}>A mobile control centre for checking the platform quickly. Detailed administration opens the secure web workspace rather than maintaining a second set of admin tools.</Text>
    {error?<Text style={styles.error}>{error}</Text>:null}

    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:22}}/>:<>
      <View style={styles.snapshotHeader}><Text style={styles.snapshotEyebrow}>LIVE SNAPSHOT</Text><Pressable onPress={()=>void load()}><Text style={styles.refresh}>Refresh</Text></Pressable></View>
      <View style={styles.metricGrid}>{metrics.map(([label,value])=><View key={label} style={styles.metric}><Text style={styles.value}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>)}</View>
    </>}

    <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>PHASE 1 AUDIT</Text><Text style={styles.sectionTitle}>Core administration</Text><Text style={styles.sectionCopy}>Every area from the audit now has a direct route from the mobile control centre.</Text></View>
    <View style={styles.toolList}>{CORE_TOOLS.map(tool=><AdminToolRow key={tool.path} tool={tool} onPress={()=>void openAdmin(tool.path)}/>)}</View>

    <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>OPERATIONS</Text><Text style={styles.sectionTitle}>Platform tools</Text><Text style={styles.sectionCopy}>The wider operational areas remain available without cluttering the core admin view.</Text></View>
    <View style={styles.toolList}>{OPERATIONS.map(tool=><AdminToolRow key={tool.path} tool={tool} onPress={()=>void openAdmin(tool.path)}/>)}</View>

    <View style={styles.notice}><Text style={styles.noticeEyebrow}>SECURE ADMIN</Text><Text style={styles.noticeTitle}>One administration system.</Text><Text style={styles.noticeCopy}>The app shows fast live information. Deeper editing opens the existing protected web Admin workspace, so jobs, payments, reports and content all continue to use the same source of truth.</Text></View>
  </ScrollView>
}

function AdminToolRow({tool,onPress}:{tool:AdminTool;onPress:()=>void}){
  return <Pressable onPress={onPress} style={styles.toolCard}>
    <View style={styles.toolText}><Text style={styles.toolEyebrow}>{tool.eyebrow}</Text><Text style={styles.toolTitle}>{tool.title}</Text><Text style={styles.toolCopy}>{tool.copy}</Text></View>
    <Text style={styles.arrow}>›</Text>
  </Pressable>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.paper},
  page:{paddingHorizontal:space.page,paddingTop:22,paddingBottom:42},
  topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:38},
  wordmark:{color:palette.inkStrong,fontSize:20,letterSpacing:2.2,fontWeight:'700',fontFamily:type.sans},
  sub:{color:palette.quiet,marginTop:4,fontSize:9,letterSpacing:3,fontFamily:type.sans},
  signOut:{color:palette.muted,fontSize:12,fontFamily:type.sans},
  eyebrow:{color:palette.sage,fontSize:9,letterSpacing:2.2,marginBottom:10,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:23,fontFamily:type.sans,maxWidth:365},
  error:{color:palette.danger,fontSize:10.5,lineHeight:16,marginBottom:14},
  snapshotHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginBottom:8},
  snapshotEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.7,fontWeight:'700'},
  refresh:{color:palette.sage,fontSize:9.5,fontWeight:'700'},
  metricGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  metric:{width:'48.5%',borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,padding:15,borderRadius:radius.medium},
  value:{color:palette.inkStrong,fontSize:25,lineHeight:30,fontWeight:'400',fontFamily:type.serif},
  metricLabel:{color:palette.quiet,fontSize:9.5,marginTop:4,fontFamily:type.sans},
  sectionHeader:{marginTop:30,marginBottom:10},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.7,fontWeight:'700'},
  sectionTitle:{color:palette.inkStrong,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  sectionCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:5},
  toolList:{borderBottomWidth:1,borderBottomColor:palette.line},
  toolCard:{minHeight:86,borderTopWidth:1,borderTopColor:palette.line,flexDirection:'row',alignItems:'center',paddingVertical:14,gap:12},
  toolText:{flex:1,paddingRight:10},
  toolEyebrow:{color:palette.sage,fontSize:7.5,letterSpacing:1.2,fontWeight:'800'},
  toolTitle:{color:palette.text,fontSize:14.5,fontWeight:'700',fontFamily:type.sans,marginTop:4},
  toolCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:4,fontFamily:type.sans},
  arrow:{color:palette.quiet,fontSize:24,fontWeight:'300'},
  notice:{backgroundColor:palette.sageSoft,padding:17,marginTop:28,borderRadius:radius.large},
  noticeEyebrow:{color:palette.sage,fontSize:7.5,letterSpacing:1.2,fontWeight:'800'},
  noticeTitle:{color:palette.inkStrong,fontSize:18,fontFamily:type.serif,fontWeight:'400',marginTop:5},
  noticeCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:6}
})
