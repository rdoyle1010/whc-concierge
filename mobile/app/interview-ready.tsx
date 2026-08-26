import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Prep = {
  company_intelligence?: { name?: string; verified_facts?: Array<{ label: string; value: string }> }
  role_intelligence?: { seniority?: string; role_summary?: string; what_they_are_really_hiring_for?: string[] }
  cv_match?: { why_you_match?: string[]; strongest_evidence?: string[]; gaps_or_risks?: string[]; talk_about_this?: string[] }
  likely_questions?: string[]
  hard_questions?: Array<{ question?: string; prepare?: string[] }>
  questions_to_ask?: string[]
  readiness?: { overall?: number; message?: string }
  creditsRemaining?: number
  source?: { hasCv?: boolean; usedAi?: boolean }
}

function BulletList({ items }: { items?: string[] }) {
  const values = (items || []).filter(Boolean)
  if (!values.length) return null
  return <View style={styles.bullets}>{values.map((item, i) => <View key={`${item}-${i}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletCopy}>{item}</Text></View>)}</View>
}

export default function InterviewReady(){
  const [credits,setCredits]=useState<number|null>(null)
  const [jobs,setJobs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [preparing,setPreparing]=useState<string|null>(null)
  const [prep,setPrep]=useState<Prep|null>(null)
  const [preparedJob,setPreparedJob]=useState<any>(null)

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){router.replace('/login');return}
    const {data:candidate}=await supabase.from('candidate_profiles').select('id,interview_ready_credits').eq('user_id',user.id).maybeSingle()
    setCredits(Number(candidate?.interview_ready_credits||0))
    const {data:apps}=candidate?.id?await supabase.from('applications').select('role_id,status,job_listings:role_id(id,job_title,location,employer_profiles(property_name,company_name))').eq('candidate_id',candidate.id).neq('status','withdrawn').order('created_at',{ascending:false}):{data:[] as any[]}
    const unique = new Map<string, any>()
    ;(apps||[]).map((x:any)=>x.job_listings).filter(Boolean).forEach((job:any)=>unique.set(job.id,job))
    setJobs(Array.from(unique.values()))
    setLoading(false)
  }

  async function prepare(job:any){
    if(!job?.id || preparing || Number(credits||0)<1) return
    setPreparing(job.id)
    setPrep(null)
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token){setPreparing(null);router.replace('/login');return}
    const base=(process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk').replace(/\/$/,'')
    try{
      const response=await fetch(`${base}/api/mobile/interview-ready`,{
        method:'POST',
        headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`},
        body:JSON.stringify({jobId:job.id}),
      })
      const data=await response.json().catch(()=>({}))
      if(!response.ok){
        Alert.alert('Interview Ready',data?.error||'We could not build this preparation. Please try again.')
        if(data?.code==='FEATURE_LOCKED')setCredits(0)
        return
      }
      setPreparedJob(job)
      setPrep(data)
      setCredits(Number(data.creditsRemaining ?? Math.max(0,Number(credits||0)-1)))
    }catch{
      Alert.alert('Interview Ready','We could not connect to Interview Ready. Please try again.')
    }finally{
      setPreparing(null)
    }
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>CONFIDENCE BUILDER</Text>
    <Text style={styles.title}>Interview Ready</Text>
    <Text style={styles.intro}>Built from your profile, CV, experience and the exact role. It helps you understand what the employer is really hiring for, pull out your strongest evidence and practise the questions most likely to challenge you.</Text>

    {loading?<ActivityIndicator color="#092b45" style={{marginTop:30}}/>:<>
      <View style={styles.creditCard}><Text style={styles.creditNumber}>{credits}</Text><Text style={styles.creditLabel}>{credits===1?'PREPARATION CREDIT':'PREPARATION CREDITS'} LEFT</Text></View>
      {credits===0?<View style={styles.locked}><Text style={styles.lockTitle}>🔒 New preparation is locked</Text><Text style={styles.lockCopy}>Your current allowance has been used. Your membership controls how many new preparations you can create.</Text></View>:null}

      {prep ? <View style={styles.result}>
        <Text style={styles.resultEyebrow}>YOUR PREPARATION</Text>
        <Text style={styles.resultTitle}>{preparedJob?.job_title}</Text>
        <Text style={styles.resultMeta}>{prep.company_intelligence?.name || ''}</Text>
        <View style={styles.readiness}><Text style={styles.readinessNumber}>{Math.round(Number(prep.readiness?.overall||0))}%</Text><View style={{flex:1}}><Text style={styles.readinessLabel}>READINESS STARTING POINT</Text><Text style={styles.readinessCopy}>{prep.readiness?.message}</Text></View></View>

        <View style={styles.resultSection}><Text style={styles.resultSectionTitle}>What this role is really hiring for</Text><Text style={styles.body}>{prep.role_intelligence?.role_summary}</Text><BulletList items={prep.role_intelligence?.what_they_are_really_hiring_for}/></View>
        <View style={styles.resultSection}><Text style={styles.resultSectionTitle}>Why you match</Text><BulletList items={prep.cv_match?.why_you_match}/></View>
        <View style={styles.resultSection}><Text style={styles.resultSectionTitle}>Your strongest evidence</Text><BulletList items={prep.cv_match?.strongest_evidence}/></View>
        <View style={styles.resultSection}><Text style={styles.resultSectionTitle}>What to talk about</Text><BulletList items={prep.cv_match?.talk_about_this}/></View>
        {(prep.cv_match?.gaps_or_risks||[]).length>0?<View style={styles.resultSection}><Text style={styles.resultSectionTitle}>Questions they may challenge you on</Text><BulletList items={prep.cv_match?.gaps_or_risks}/></View>:null}
        <View style={styles.resultSection}><Text style={styles.resultSectionTitle}>Likely interview questions</Text><BulletList items={prep.likely_questions}/></View>
        {(prep.hard_questions||[]).map((q,i)=><View key={`hard-${i}`} style={styles.hardCard}><Text style={styles.hardLabel}>HARD QUESTION {i+1}</Text><Text style={styles.hardQuestion}>{q.question}</Text><BulletList items={q.prepare}/></View>)}
        <View style={styles.resultSection}><Text style={styles.resultSectionTitle}>Good questions to ask them</Text><BulletList items={prep.questions_to_ask}/></View>
        <Text style={styles.source}>{prep.source?.hasCv?'Your CV was included. ':'Your WHC profile was used. '}{prep.source?.usedAi?'AI coaching added.':'Role-based coaching prepared.'}</Text>
      </View> : null}

      <Text style={styles.section}>{prep?'Prepare another role':'Roles to prepare for'}</Text>
      {jobs.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No active applications yet.</Text><Text style={styles.emptyCopy}>Apply for a role and it will appear here automatically.</Text></View>:<View style={styles.list}>{jobs.map(job=><View key={job.id} style={styles.card}><Text style={styles.job}>{job.job_title}</Text><Text style={styles.meta}>{[job.employer_profiles?.property_name||job.employer_profiles?.company_name,job.location].filter(Boolean).join(' · ')}</Text><Pressable disabled={Number(credits||0)<1||Boolean(preparing)} onPress={()=>prepare(job)} style={[styles.prepareButton,(Number(credits||0)<1||Boolean(preparing))&&styles.prepareDisabled]}><Text style={styles.prepareText}>{preparing===job.id?'Building your preparation…':'Prepare for this role'}</Text></Pressable></View>)}</View>}
    </>}
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:52},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:24},creditCard:{backgroundColor:'#f4f7f8',padding:20,alignItems:'center'},creditNumber:{color:'#092b45',fontSize:34,fontWeight:'600'},creditLabel:{color:'#71808a',fontSize:9,letterSpacing:1.6,marginTop:4},locked:{borderWidth:1,borderColor:'#dce3e7',padding:18,marginTop:14},lockTitle:{color:'#173246',fontSize:14,fontWeight:'600'},lockCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:6},section:{color:'#092b45',fontSize:17,fontWeight:'600',marginTop:28,marginBottom:12},list:{gap:10},card:{borderWidth:1,borderColor:'#dce3e7',padding:18},job:{color:'#173246',fontSize:15,fontWeight:'600'},meta:{color:'#71808a',fontSize:11,marginTop:6},prepareButton:{backgroundColor:'#092b45',paddingVertical:13,alignItems:'center',marginTop:15},prepareDisabled:{opacity:.42},prepareText:{color:'#fff',fontSize:12,fontWeight:'600'},empty:{backgroundColor:'#f4f7f8',padding:20},emptyTitle:{color:'#173246',fontSize:14,fontWeight:'600'},emptyCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:6},result:{marginTop:22,borderWidth:1,borderColor:'#dce3e7',padding:20},resultEyebrow:{color:'#71808a',fontSize:8,letterSpacing:1.7},resultTitle:{color:'#092b45',fontSize:23,fontWeight:'600',marginTop:8},resultMeta:{color:'#71808a',fontSize:11,marginTop:5},readiness:{backgroundColor:'#f4f7f8',padding:16,marginTop:18,flexDirection:'row',alignItems:'center',gap:14},readinessNumber:{color:'#092b45',fontSize:28,fontWeight:'600'},readinessLabel:{color:'#66747c',fontSize:8,letterSpacing:1.2},readinessCopy:{color:'#526976',fontSize:11,lineHeight:16,marginTop:4},resultSection:{borderTopWidth:1,borderTopColor:'#e4e9ec',paddingTop:18,marginTop:20},resultSectionTitle:{color:'#173246',fontSize:15,fontWeight:'600',marginBottom:9},body:{color:'#66747c',fontSize:12,lineHeight:19},bullets:{gap:7,marginTop:3},bulletRow:{flexDirection:'row',gap:8},bullet:{color:'#092b45',fontSize:13},bulletCopy:{color:'#66747c',fontSize:12,lineHeight:18,flex:1},hardCard:{backgroundColor:'#f7f9fa',padding:16,marginTop:12},hardLabel:{color:'#71808a',fontSize:8,letterSpacing:1.2},hardQuestion:{color:'#173246',fontSize:13,fontWeight:'600',lineHeight:19,marginTop:7},source:{color:'#8a969d',fontSize:9,lineHeight:14,marginTop:20}
})
