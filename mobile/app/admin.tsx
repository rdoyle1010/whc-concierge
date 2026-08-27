import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Counts = { users:number; employers:number; jobs:number; applications:number; agency:number }

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

  const cards=[
    ['Users',counts.users,'Review platform accounts and access.'],
    ['Employers',counts.employers,'Monitor employer profiles and activity.'],
    ['Jobs',counts.jobs,'See role volume and publishing activity.'],
    ['Applications',counts.applications,'Track recruitment activity across the platform.'],
    ['Agency bookings',counts.agency,'Monitor flexible staffing activity.'],
  ] as const

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <View style={styles.topRow}><View><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>ADMIN</Text></View><Pressable onPress={signOut}><Text style={styles.signOut}>Sign out</Text></Pressable></View>
    <Text style={styles.eyebrow}>PLATFORM OPERATIONS</Text>
    <Text style={styles.title}>Hello, {name.split(' ')[0]}.</Text>
    <Text style={styles.intro}>A mobile view of the live platform for quick operational checks. Detailed administration remains available on the web dashboard.</Text>
    {loading?<ActivityIndicator color="#092b45" style={{marginTop:24}}/>:<View style={styles.grid}>{cards.map(([label,value,copy])=><View key={label} style={styles.card}><Text style={styles.value}>{value}</Text><Text style={styles.cardTitle}>{label}</Text><Text style={styles.cardCopy}>{copy}</Text></View>)}</View>}
    <View style={styles.notice}><Text style={styles.noticeTitle}>Mobile admin access is live.</Text><Text style={styles.noticeCopy}>This account is using the same Supabase permissions and data as the website. We can now extend the mobile admin area around the tasks you actually need away from your desk.</Text></View>
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:22,paddingBottom:40},topRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',marginBottom:44},wordmark:{color:'#092b45',fontSize:21,letterSpacing:2,fontWeight:'600'},sub:{color:'#71808a',fontSize:9,letterSpacing:3,marginTop:4},signOut:{color:'#71808a',fontSize:12},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:22},grid:{gap:12},card:{borderWidth:1,borderColor:'#dce3e7',padding:18},value:{color:'#092b45',fontSize:30,lineHeight:34,fontWeight:'500'},cardTitle:{color:'#173246',fontSize:16,fontWeight:'600',marginTop:4},cardCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:6},notice:{backgroundColor:'#f4f7f8',padding:18,marginTop:22},noticeTitle:{color:'#173246',fontSize:13,fontWeight:'600'},noticeCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:6}})
