import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'

type Course={slug:string;title:string;tagline:string;category:string;minutes:number;lessons:any[];quiz:any[]}
type Enrollment={course_slug:string;paid_at?:string|null;completed_at?:string|null;progress?:Record<string,boolean>;quiz_score?:number|null;certificate_code?:string|null}

type Row={course:Course;enrollment:Enrollment}

export default function AcademyTranscriptScreen(){
  const [name,setName]=useState('Learner')
  const [courses,setCourses]=useState<Course[]>([])
  const [enrollments,setEnrollments]=useState<Enrollment[]>([])
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  useEffect(()=>{void load()},[])

  async function authHeaders():Promise<Record<string,string>>{
    const {data:{session}}=await supabase.auth.getSession()
    return session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{ }
  }

  async function load(){
    setLoading(true);setError('')
    try{
      const headers=await authHeaders()
      const [catalogRes,academyRes]=await Promise.all([
        fetch(`${WEB_URL}/api/academy/catalog`),
        fetch(`${WEB_URL}/api/academy`,{headers}),
      ])
      const catalog=await catalogRes.json();const academy=await academyRes.json()
      if(!catalogRes.ok)throw new Error(catalog.error||'Could not load Academy catalogue.')
      if(!academyRes.ok)throw new Error(academy.error||'Could not load your learning record.')
      setCourses(catalog.courses||[])
      setEnrollments((academy.enrollments||[]).filter((row:any)=>row.paid_at))
      setName(academy.candidate_name||'Learner')
    }catch(e:any){setError(e.message||'Could not load transcript.')}
    setLoading(false)
  }

  const rows=useMemo<Row[]>(()=>{
    const map=new Map(courses.map(course=>[course.slug,course]))
    return enrollments.map(enrollment=>({course:map.get(enrollment.course_slug),enrollment})).filter((row:any)=>Boolean(row.course)) as Row[]
  },[courses,enrollments])

  const completed=rows.filter(row=>Boolean(row.enrollment.completed_at))
  const active=rows.filter(row=>!row.enrollment.completed_at)
  const enrolledMinutes=rows.reduce((sum,row)=>sum+Number(row.course.minutes||0),0)
  const completedMinutes=completed.reduce((sum,row)=>sum+Number(row.course.minutes||0),0)
  const completedModules=rows.reduce((sum,row)=>sum+Object.keys(row.enrollment.progress||{}).length,0)
  const totalModules=rows.reduce((sum,row)=>sum+Number(row.course.lessons?.length||0),0)
  const averageScore=completed.length?Math.round(completed.reduce((sum,row)=>sum+Number(row.enrollment.quiz_score||0),0)/completed.length):null

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Academy</Text></Pressable>
    <Text style={styles.eyebrow}>TALENT HOUSE ACADEMY · STUDENT RECORDS</Text>
    <Text style={styles.title}>Academic transcript</Text>
    <Text style={styles.intro}>A consolidated record of your Talent House Academy enrolments, documented study time, module progress, assessment results and certificates.</Text>

    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:26}}/>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}

    {!loading&&!error?<>
      <View style={styles.identityCard}>
        <Text style={styles.identityEyebrow}>LEARNER</Text>
        <Text style={styles.identityName}>{name}</Text>
        <Text style={styles.identityCopy}>Talent House Academy professional-development record</Text>
      </View>

      <View style={styles.summaryGrid}>
        <Summary value={String(rows.length)} label="Enrolments" />
        <Summary value={String(completed.length)} label="Completed" />
        <Summary value={`${Math.round(completedMinutes/60*10)/10}h`} label="Completed learning time" />
        <Summary value={averageScore==null?'—':`${averageScore}%`} label="Average assessment" />
      </View>

      <View style={styles.recordCard}>
        <Text style={styles.sectionEyebrow}>LEARNING RECORD</Text>
        <Text style={styles.sectionTitle}>Programme history</Text>
        <RecordLine label="Documented enrolled learning time" value={`${Math.round(enrolledMinutes/60*10)/10} hours`} />
        <RecordLine label="Modules completed" value={`${completedModules} of ${totalModules}`} />
        <RecordLine label="Active programmes" value={String(active.length)} />
        <RecordLine label="Certificates awarded" value={String(completed.length)} />
      </View>

      <Text style={styles.sectionHeaderEyebrow}>PROGRAMMES</Text>
      <Text style={styles.sectionHeaderTitle}>Transcript entries</Text>

      {rows.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No learning record yet.</Text><Text style={styles.emptyCopy}>Your transcript will populate automatically once you enrol on a Talent House Academy programme.</Text></View>:rows.map(({course,enrollment})=>{
        const done=Object.keys(enrollment.progress||{}).length
        const complete=Boolean(enrollment.completed_at)
        return <Pressable key={course.slug} onPress={()=>router.push({pathname:'/academy-course/[slug]',params:{slug:course.slug}})} style={styles.entry}>
          <View style={styles.entryTop}>
            <View style={{flex:1}}><Text style={styles.entryCategory}>{course.category.toUpperCase()}</Text><Text style={styles.entryTitle}>{course.title}</Text></View>
            <View style={[styles.status,complete&&styles.statusComplete]}><Text style={[styles.statusText,complete&&styles.statusTextComplete]}>{complete?'COMPLETED':'IN PROGRESS'}</Text></View>
          </View>
          <View style={styles.entryRows}>
            <RecordLine label="Learning time" value={`${course.minutes} min`} compact />
            <RecordLine label="Modules" value={`${done}/${course.lessons.length}`} compact />
            <RecordLine label="Assessment" value={enrollment.quiz_score!=null?`${enrollment.quiz_score}%`:'Not yet submitted'} compact />
            <RecordLine label="Completion" value={enrollment.completed_at?new Date(enrollment.completed_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):'In progress'} compact />
            <RecordLine label="Certificate" value={enrollment.certificate_code||'Pending completion'} compact />
          </View>
          <Text style={styles.open}>Open programme record →</Text>
        </Pressable>
      })}

      <View style={styles.disclaimer}>
        <Text style={styles.disclaimerEyebrow}>RECORD STATUS</Text>
        <Text style={styles.disclaimerTitle}>Professional-development transcript</Text>
        <Text style={styles.disclaimerCopy}>This transcript records Talent House Academy learning and assessment activity. Documented learning time reflects the course durations held in the Academy catalogue. It is not a university transcript, regulated qualification record or externally accredited CPD statement unless a future programme is explicitly awarded that status.</Text>
      </View>
    </>:null}
  </ScrollView>
}

function Summary({value,label}:{value:string;label:string}){
  return <View style={styles.summary}><Text style={styles.summaryValue}>{value}</Text><Text style={styles.summaryLabel}>{label}</Text></View>
}

function RecordLine({label,value,compact=false}:{label:string;value:string;compact?:boolean}){
  return <View style={[styles.recordLine,compact&&styles.recordLineCompact]}><Text style={styles.recordLabel}>{label}</Text><Text style={styles.recordValue}>{value}</Text></View>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
  error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:16,fontFamily:type.sans},
  identityCard:{backgroundColor:palette.ink,padding:18,borderRadius:radius.large,marginBottom:10},
  identityEyebrow:{color:'#D8E0E5',fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
  identityName:{color:palette.paper,fontSize:25,lineHeight:30,fontWeight:'400',fontFamily:type.serif,marginTop:6},
  identityCopy:{color:'#E3EAED',fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  summaryGrid:{flexDirection:'row',flexWrap:'wrap',gap:8,marginBottom:18},
  summary:{width:'48.5%',backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:14,borderRadius:radius.medium},
  summaryValue:{color:palette.inkStrong,fontSize:22,lineHeight:27,fontFamily:type.serif,fontWeight:'400'},
  summaryLabel:{color:palette.quiet,fontSize:9,lineHeight:14,marginTop:4,fontFamily:type.sans},
  recordCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginBottom:26},
  sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  sectionTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontFamily:type.serif,fontWeight:'400',marginTop:5,marginBottom:7},
  recordLine:{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:10,borderTopWidth:1,borderTopColor:palette.line},
  recordLineCompact:{paddingVertical:8},
  recordLabel:{color:palette.muted,fontSize:10,fontFamily:type.sans,flex:1},
  recordValue:{color:palette.inkStrong,fontSize:10,fontWeight:'700',fontFamily:type.sans,textAlign:'right',maxWidth:'54%'},
  sectionHeaderEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.6,fontWeight:'700',fontFamily:type.sans},
  sectionHeaderTitle:{color:palette.inkStrong,fontSize:23,lineHeight:28,fontFamily:type.serif,fontWeight:'400',marginTop:5,marginBottom:11},
  entry:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large,marginBottom:9},
  entryTop:{flexDirection:'row',gap:10,alignItems:'flex-start'},
  entryCategory:{color:palette.quiet,fontSize:7.5,letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans},
  entryTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontFamily:type.serif,fontWeight:'400',marginTop:4},
  status:{backgroundColor:palette.stoneDeep,paddingHorizontal:7,paddingVertical:4,borderRadius:999},
  statusComplete:{backgroundColor:palette.ink},
  statusText:{color:palette.quiet,fontSize:7,letterSpacing:.7,fontWeight:'700',fontFamily:type.sans},
  statusTextComplete:{color:palette.paper},
  entryRows:{marginTop:10,borderTopWidth:1,borderTopColor:palette.line},
  open:{color:palette.ink,fontSize:9.5,fontWeight:'700',fontFamily:type.sans,marginTop:11},
  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large},
  emptyTitle:{color:palette.inkStrong,fontSize:17,fontFamily:type.serif,fontWeight:'400'},
  emptyCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  disclaimer:{backgroundColor:palette.stoneDeep,padding:17,borderRadius:radius.large,marginTop:22},
  disclaimerEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  disclaimerTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontFamily:type.serif,fontWeight:'400',marginTop:5},
  disclaimerCopy:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:6,fontFamily:type.sans},
})
