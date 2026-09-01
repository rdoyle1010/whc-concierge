import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Counts = { users:number; employers:number; jobs:number; applications:number; agency:number }
const WEB = (process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk').replace(/\/$/,'')

export default function AdminScreen() {
  const [name,setName]=useState('')
  const [counts,setCounts]=useState<Counts>({users:0,employers:0,jobs:0,applications:0,agency:0})
  const [loading,setLoading]=useState(true)

  useEffect(()=>{ load() },[])

  async function load(){
    const { data:{ user } }=await supabase.auth.getUser()
    if(!user){ router.replace('/login?role=admin'); return }
    const { data: profile }=await supabase.from('profiles').select('role,full_name').eq('id',user.id).maybeSingle()
    if(profile?.role!=='admin'){
      await supabase.auth.signOut()
      router.replace('/login?role=admin')
      return
    }
    setName(profile?.full_name||'Admin')
    const [users,employers,jobs,applications,agency]=await Promise.all([
      supabase.from('profiles').select('id',{count:'exact',head:true}),
      supabase.from('employer_profiles').select('id',{count:'exact',head:true}),
      supabase.from('job_listings').select('id',{count:'exact',head:true}),
      supabase.from('applications').select('id',{count:'exact',head:true}),
      supabase.from('agency_bookings').select('id',{count:'exact',head:true}),
    ])
    setCounts({users:users.count||0,employers:employers.count||0,jobs:jobs.count||0,applications:applications.count||0,agency:agency.count||0})
    setLoading(false)
  }

  async function signOut(){ await supabase.auth.signOut(); router.replace('/') }
  function openAdmin(path:string){ Linking.openURL(`${WEB}/admin/${path}`) }

  const metrics=[
    ['Users',counts.users],['Employers',counts.employers],['Jobs',counts.jobs],['Applications',counts.applications],['Agency',counts.agency],
  ] as const
  const tools=[
    ['Dashboard','dashboard','Overall platform operations'],
    ['Users & access','users','Review platform accounts'],
    ['Jobs','jobs','Manage and inspect live roles'],
    ['Matches','matches','Check matching activity'],
    ['Agency','agency','Bookings, staffing and disputes'],
    ['Messages','messages','Platform conversations'],
    ['Complaints','complaints','Review issues and escalations'],
    ['Campaigns','campaigns','Marketing and email activity'],
    ['Advertising','advertising','Paid placements and adverts'],
    ['Academy','academy','Learning content and courses'],
    ['Platform reviews','platform-reviews','Review quality and feedback'],
  ] as const

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <View style={styles.topRow}><View><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>ADMIN</Text></View><Pressable onPress={signOut}><Text style={styles.signOut}>Sign out</Text></Pressable></View>
    <Text style={styles.eyebrow}>PLATFORM OPERATIONS</Text>
    <Text style={styles.title}>Hello, {name.split(' ')[0]}.</Text>
    <Text style={styles.intro}>Your mobile control centre for quick checks and platform actions. It uses the same live account and data as the website.</Text>

    {loading?<ActivityIndicator color="#0b2f4d" style={{marginTop:22}}/>:<View style={styles.metricGrid}>{metrics.map(([label,value])=><View key={label} style={styles.metric}><Text style={styles.value}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>)}</View>}

    <Text style={styles.sectionTitle}>Admin tools</Text>
    <View style={styles.toolList}>{tools.map(([label,path,copy])=><Pressable key={path} onPress={()=>openAdmin(path)} style={styles.toolCard}><View style={{flex:1}}><Text style={styles.toolTitle}>{label}</Text><Text style={styles.toolCopy}>{copy}</Text></View><Text style={styles.arrow}>→</Text></Pressable>)}</View>

    <View style={styles.notice}><Text style={styles.noticeTitle}>App + web, working together.</Text><Text style={styles.noticeCopy}>Quick information is native in the app. Deeper admin tools open the secure web admin area so you are not maintaining two different administration systems.</Text></View>
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:18,paddingBottom:34},
  topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:36},wordmark:{color:'#0b2f4d',fontSize:20,letterSpacing:2,fontWeight:'700'},sub:{color:'#71808a',fontSize:8,letterSpacing:3,marginTop:4},signOut:{color:'#71808a',fontSize:12},
  eyebrow:{color:'#71808a',fontSize:8,letterSpacing:2,marginBottom:9},title:{color:'#0b2f4d',fontSize:30,lineHeight:36,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:9,marginBottom:20},
  metricGrid:{flexDirection:'row',flexWrap:'wrap',gap:9},metric:{width:'48%',borderWidth:1,borderColor:'#dce3e7',padding:16},value:{color:'#0b2f4d',fontSize:27,lineHeight:31,fontWeight:'600'},metricLabel:{color:'#71808a',fontSize:10,marginTop:4},
  sectionTitle:{color:'#173246',fontSize:18,fontWeight:'600',marginTop:28,marginBottom:11},toolList:{gap:9},toolCard:{borderWidth:1,borderColor:'#dce3e7',padding:16,flexDirection:'row',alignItems:'center',gap:12},toolTitle:{color:'#173246',fontSize:14,fontWeight:'600'},toolCopy:{color:'#71808a',fontSize:11,lineHeight:16,marginTop:4},arrow:{color:'#0b2f4d',fontSize:18},
  notice:{backgroundColor:'#f4f7f8',padding:17,marginTop:22},noticeTitle:{color:'#173246',fontSize:13,fontWeight:'600'},noticeCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:6}
})
