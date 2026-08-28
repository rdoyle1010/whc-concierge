import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

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
  const values=(items||[]).filter(Boolean)
  if(!values.length)return null
  return <View style={styles.bullets}>{values.map((item,i)=><View key={`${item}-${i}`} style={styles.bulletRow}><Text style={styles.bullet}>•</Text><Text style={styles.bulletCopy}>{item}</Text></View>)}</View>
}

export default function InterviewReady(){
  const [credits,setCredits]=useState<number|null>(null)
  const [jobs,setJobs]=useState<any[]>([])
  const [loading,setLoading]=useState(true)
  const [preparing,setPreparing]=useState<string|null>(null)
  const [prep,setPrep]=useState<Prep|null>(null)
  const [preparedJob,setPreparedJob]=useState<any>(null)

  useEffect(()=>{void load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){router.replace('/login');return}
    const {data:candidate}=await supabase.from('candidate_profiles').select('id,interview_ready_credits').eq('user_id',user.id).maybeSingle()
    setCredits(Number(candidate?.interview_ready_credits||0))
    const {data:apps}=candidate?.id
      ?await supabase.from('applications').select('role_id,status,job_listings:role_id(id,job_title,location,employer_profiles(property_name,company_name))').eq('candidate_id',candidate.id).neq('status','withdrawn').order('created_at',{ascending:false})
      :{data:[] as any[]}
    const unique=new Map<string,any>()
    ;(apps||[]).map((x:any)=>x.job_listings).filter(Boolean).forEach((job:any)=>unique.set(job.id,job))
    setJobs(Array.from(unique.values()))
    setLoading(false)
  }

  async function prepare(job:any){
    if(!job?.id||preparing||Number(credits||0)<1)return
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
      setCredits(Number(data.creditsRemaining??Math.max(0,Number(credits||0)-1)))
    }catch{
      Alert.alert('Interview Ready','We could not connect to Interview Ready. Please try again.')
    }finally{
      setPreparing(null)
    }
  }

  const score=Math.max(0,Math.min(100,Math.round(Number(prep?.readiness?.overall||0))))

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>INTERVIEW READY</Text>
    <Text style={styles.title}>Know the role. Know your evidence.</Text>
    <Text style={styles.intro}>Built from your profile, CV, experience and the exact job. Use it to understand what the employer is really hiring for and prepare answers that sound like you.</Text>

    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:24}}/>:<>
      <View style={styles.creditCard}>
        <View><Text style={styles.creditEyebrow}>PREPARATION BALANCE</Text><Text style={styles.creditNumber}>{credits}</Text></View>
        <Text style={styles.creditCopy}>{credits===1?'credit available':'credits available'}</Text>
      </View>

      {credits===0?<View style={styles.locked}><Text style={styles.lockTitle}>No new preparation credits available</Text><Text style={styles.lockCopy}>Your membership controls how many new role preparations you can create. Existing applications and completed preparation remain unchanged.</Text><Pressable onPress={()=>router.push('/billing')} style={styles.membershipLink}><Text style={styles.membershipLinkText}>View membership</Text><Text style={styles.arrow}>→</Text></Pressable></View>:null}

      {prep?<View style={styles.result}>
        <Text style={styles.resultEyebrow}>YOUR PREPARATION</Text>
        <Text style={styles.resultTitle}>{preparedJob?.job_title}</Text>
        <Text style={styles.resultMeta}>{prep.company_intelligence?.name||''}</Text>

        <View style={styles.readinessCard}>
          <View style={styles.readinessTop}><View><Text style={styles.readinessLabel}>READINESS STARTING POINT</Text><Text style={styles.readinessNumber}>{score}%</Text></View><Text style={styles.readinessFlag}>{score>=80?'Strong':score>=60?'Developing':'Build confidence'}</Text></View>
          <View style={styles.progressTrack}><View style={[styles.progressFill,{width:`${score}%`}]} /></View>
          {prep.readiness?.message?<Text style={styles.readinessCopy}>{prep.readiness.message}</Text>:null}
        </View>

        <View style={styles.resultSection}><Text style={styles.sectionEyebrow}>ROLE</Text><Text style={styles.resultSectionTitle}>What this role is really hiring for</Text>{prep.role_intelligence?.role_summary?<Text style={styles.body}>{prep.role_intelligence.role_summary}</Text>:null}<BulletList items={prep.role_intelligence?.what_they_are_really_hiring_for}/></View>
        <View style={styles.resultSection}><Text style={styles.sectionEyebrow}>YOUR FIT</Text><Text style={styles.resultSectionTitle}>Why you match</Text><BulletList items={prep.cv_match?.why_you_match}/></View>
        <View style={styles.resultSection}><Text style={styles.sectionEyebrow}>EVIDENCE</Text><Text style={styles.resultSectionTitle}>Your strongest proof</Text><BulletList items={prep.cv_match?.strongest_evidence}/></View>
        <View style={styles.resultSection}><Text style={styles.sectionEyebrow}>INTERVIEW STORY</Text><Text style={styles.resultSectionTitle}>What to talk about</Text><BulletList items={prep.cv_match?.talk_about_this}/></View>

        {(prep.cv_match?.gaps_or_risks||[]).length>0?<View style={styles.challengeSection}><Text style={styles.sectionEyebrow}>WATCH-OUTS</Text><Text style={styles.challengeTitle}>Where they may challenge you</Text><BulletList items={prep.cv_match?.gaps_or_risks}/></View>:null}

        {(prep.likely_questions||[]).length>0?<View style={styles.resultSection}><Text style={styles.sectionEyebrow}>PRACTISE</Text><Text style={styles.resultSectionTitle}>Likely interview questions</Text><BulletList items={prep.likely_questions}/></View>:null}

        {(prep.hard_questions||[]).map((q,i)=><View key={`hard-${i}`} style={styles.hardCard}><Text style={styles.hardLabel}>CHALLENGE QUESTION {i+1}</Text><Text style={styles.hardQuestion}>{q.question}</Text><Text style={styles.hardPrep}>Prepare your evidence</Text><BulletList items={q.prepare}/></View>)}

        {(prep.questions_to_ask||[]).length>0?<View style={styles.resultSection}><Text style={styles.sectionEyebrow}>YOUR QUESTIONS</Text><Text style={styles.resultSectionTitle}>Good questions to ask them</Text><BulletList items={prep.questions_to_ask}/></View>:null}

        <View style={styles.sourceCard}><Text style={styles.sourceTitle}>Built from your real information</Text><Text style={styles.source}>{prep.source?.hasCv?'Your CV was included. ':'Your WHC profile was used. '}{prep.source?.usedAi?'Coaching intelligence was added to help structure your preparation.':'Role-based preparation was created from the information available.'}</Text></View>
      </View>:null}

      <Text style={styles.rolesEyebrow}>{prep?'PREPARE ANOTHER ROLE':'YOUR APPLICATIONS'}</Text>
      <Text style={styles.rolesTitle}>{prep?'Choose another application':'Roles to prepare for'}</Text>
      <Text style={styles.rolesCopy}>Interview Ready only uses roles you have actually applied for, so the preparation stays specific.</Text>

      {jobs.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No active applications yet.</Text><Text style={styles.emptyCopy}>Apply for a role and it will appear here automatically.</Text><Pressable onPress={()=>router.push('/jobs')} style={styles.secondary}><Text style={styles.secondaryText}>Browse jobs</Text></Pressable></View>:<View style={styles.list}>{jobs.map(job=>{
        const employer=job.employer_profiles?.property_name||job.employer_profiles?.company_name
        const disabled=Number(credits||0)<1||Boolean(preparing)
        return <View key={job.id} style={styles.card}>
          <Text style={styles.job}>{job.job_title}</Text>
          <Text style={styles.meta}>{[employer,job.location].filter(Boolean).join(' · ')}</Text>
          <Pressable disabled={disabled} onPress={()=>prepare(job)} style={[styles.prepareButton,disabled&&styles.prepareDisabled]}><Text style={styles.prepareText}>{preparing===job.id?'Building your preparation…':'Prepare for this role'}</Text><Text style={styles.prepareArrow}>→</Text></Pressable>
        </View>
      })}</View>}
    </>}
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9},
  title:{color:palette.inkStrong,fontFamily:type.serif,fontSize:34,lineHeight:40,fontWeight:'400',maxWidth:360},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,maxWidth:365},
  creditCard:{backgroundColor:palette.inkStrong,padding:18,borderRadius:radius.large,flexDirection:'row',alignItems:'flex-end',justifyContent:'space-between'},
  creditEyebrow:{color:'#C8D1D2',fontSize:7.5,letterSpacing:1.5,fontWeight:'700'},
  creditNumber:{color:palette.paper,fontFamily:type.serif,fontSize:34,fontWeight:'400',marginTop:5},
  creditCopy:{color:'#D8DEDF',fontSize:10.5,paddingBottom:5},
  locked:{borderWidth:1,borderColor:palette.line,padding:16,backgroundColor:palette.paper,borderRadius:radius.large,marginTop:10},
  lockTitle:{color:palette.inkStrong,fontSize:14,fontWeight:'700'},
  lockCopy:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:5},
  membershipLink:{borderTopWidth:1,borderTopColor:palette.line,marginTop:13,paddingTop:12,flexDirection:'row',justifyContent:'space-between'},
  membershipLinkText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},
  arrow:{color:palette.ink,fontSize:15},
  result:{marginTop:20},
  resultEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.7,fontWeight:'700'},
  resultTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:27,lineHeight:32,fontWeight:'400',marginTop:7},
  resultMeta:{color:palette.muted,fontSize:11,marginTop:4},
  readinessCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large,marginTop:15},
  readinessTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start'},
  readinessLabel:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700'},
  readinessNumber:{color:palette.inkStrong,fontFamily:type.serif,fontSize:31,fontWeight:'400',marginTop:4},
  readinessFlag:{color:palette.sage,fontSize:9.5,fontWeight:'700'},
  progressTrack:{height:3,backgroundColor:palette.stoneDeep,marginTop:11,borderRadius:999,overflow:'hidden'},
  progressFill:{height:3,backgroundColor:palette.sage},
  readinessCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:10},
  resultSection:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large,marginTop:11},
  sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.4,fontWeight:'700',marginBottom:5},
  resultSectionTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:20,lineHeight:25,fontWeight:'400',marginBottom:7},
  body:{color:palette.muted,fontSize:11,lineHeight:18},
  bullets:{gap:7,marginTop:3},
  bulletRow:{flexDirection:'row',gap:8},
  bullet:{color:palette.sage,fontSize:12},
  bulletCopy:{color:palette.muted,fontSize:11,lineHeight:17,flex:1},
  challengeSection:{backgroundColor:'#F8F3EE',borderWidth:1,borderColor:'#E5D9CC',padding:16,borderRadius:radius.large,marginTop:11},
  challengeTitle:{color:'#5A4638',fontFamily:type.serif,fontSize:20,lineHeight:25,fontWeight:'400',marginBottom:7},
  hardCard:{backgroundColor:palette.inkStrong,padding:17,borderRadius:radius.large,marginTop:11},
  hardLabel:{color:'#C8D1D2',fontSize:7.5,letterSpacing:1.3,fontWeight:'700'},
  hardQuestion:{color:palette.paper,fontFamily:type.serif,fontSize:20,lineHeight:26,fontWeight:'400',marginTop:7},
  hardPrep:{color:'#D8DEDF',fontSize:9.5,fontWeight:'700',marginTop:13,marginBottom:3},
  sourceCard:{backgroundColor:palette.sageSoft,padding:14,borderRadius:radius.large,marginTop:11},
  sourceTitle:{color:palette.sage,fontSize:10.5,fontWeight:'700'},
  source:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:4},
  rolesEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.7,fontWeight:'700',marginTop:30},
  rolesTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:23,lineHeight:28,fontWeight:'400',marginTop:5},
  rolesCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:5,marginBottom:12},
  list:{gap:9},
  card:{borderWidth:1,borderColor:palette.line,padding:16,backgroundColor:palette.paper,borderRadius:radius.large},
  job:{color:palette.inkStrong,fontSize:15,fontWeight:'700'},
  meta:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:5},
  prepareButton:{backgroundColor:palette.inkStrong,paddingHorizontal:13,paddingVertical:12,marginTop:13,borderRadius:radius.medium,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  prepareDisabled:{opacity:.4},
  prepareText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},
  prepareArrow:{color:palette.paper,fontSize:15},
  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large},
  emptyTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:19,fontWeight:'400'},
  emptyCopy:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:5},
  secondary:{borderWidth:1,borderColor:palette.lineStrong,paddingVertical:12,alignItems:'center',marginTop:13,borderRadius:radius.medium},
  secondaryText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},
})