import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

type Course = { slug:string; title:string; tagline:string; category:string; minutes:number; price?:number; lessons:any[]; quiz:any[]; is_core?:boolean }
type Enrollment = { course_slug:string; paid_at?:string|null; completed_at?:string|null; progress?:Record<string,boolean>; quiz_score?:number|null; certificate_code?:string|null }

export default function AcademyScreen(){
  const [courses,setCourses]=useState<Course[]>([])
  const [enrollments,setEnrollments]=useState<Enrollment[]>([])
  const [discount,setDiscount]=useState(0)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{void load()},[])

  async function authHeaders():Promise<Record<string,string>>{
    const { data:{ session } }=await supabase.auth.getSession()
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
      const c=await catalogRes.json();const a=await academyRes.json()
      if(!catalogRes.ok)throw new Error(c.error||'Could not load Academy catalogue.')
      if(!academyRes.ok)throw new Error(a.error||'Could not load your Academy progress.')
      setCourses(c.courses||[])
      setEnrollments(a.enrollments||[])
      setDiscount(Number(a.academy_discount_pct||0))
    }catch(e:any){setError(e.message||'Could not load Academy.')}
    setLoading(false)
  }

  const enrollmentMap=useMemo(()=>new Map(enrollments.filter(e=>e.paid_at).map(e=>[e.course_slug,e])),[enrollments])
  const categories=useMemo(()=>Array.from(new Set(courses.map(c=>c.category))),[courses])
  const core=courses.filter(c=>c.is_core)
  const coreOwned=core.filter(c=>enrollmentMap.has(c.slug)).length
  const enrolledCourses=courses.filter(c=>enrollmentMap.has(c.slug))
  const activeCourses=enrolledCourses.filter(c=>!enrollmentMap.get(c.slug)?.completed_at)
  const completedCourses=enrolledCourses.filter(c=>Boolean(enrollmentMap.get(c.slug)?.completed_at))
  const totalStudyMinutes=enrolledCourses.reduce((sum,c)=>sum+Number(c.minutes||0),0)

  function progressFor(course:Course){
    const enrollment=enrollmentMap.get(course.slug)
    if(!enrollment)return 0
    if(enrollment.completed_at)return 100
    const done=Object.keys(enrollment.progress||{}).length
    return Math.round((done/(Math.max(1,course.lessons.length)+1))*100)
  }

  async function checkout(product:'course'|'bundle',courseSlug?:string){
    setBusy(product==='bundle'?'__bundle__':courseSlug||'');setError('')
    try{
      const headers=await authHeaders()
      const res=await fetch(`${WEB_URL}/api/mobile/academy/checkout`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({product,courseSlug,source:'app',returnToApp:true})})
      const j=await res.json()
      if(!res.ok||!j.url)throw new Error(j.error||'Could not start payment.')
      const saving=j.discountPct>0?` Your ${j.discountPct}% member Academy discount has been applied.`:''
      Alert.alert('Academy enrolment',`Your enrolment total is £${(j.amountPence/100).toFixed(2)}.${saving}`,[{text:'Cancel',style:'cancel',onPress:()=>setBusy('')},{text:'Continue to secure checkout',onPress:()=>Linking.openURL(j.url)}])
    }catch(e:any){setError(e.message||'Could not start payment.');setBusy('')}
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>WHC ACADEMY · STUDENT PORTAL</Text>
    <Text style={styles.title}>Professional learning, properly structured.</Text>
    <Text style={styles.intro}>Your studies, progress, assessments and certificates in one academic-style learning record for spa and wellness development.</Text>

    {error?<Text style={styles.error}>{error}</Text>:null}
    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:null}

    {!loading?<>
      <View style={styles.portalHero}>
        <View style={styles.portalHeroTop}>
          <View style={{flex:1}}><Text style={styles.portalEyebrow}>LEARNER RECORD</Text><Text style={styles.portalTitle}>{activeCourses.length>0?'Studies in progress':'Ready for your next programme'}</Text></View>
          <Text style={styles.portalCount}>{completedCourses.length}</Text>
        </View>
        <Text style={styles.portalCopy}>{completedCourses.length} certificate{completedCourses.length===1?'':'s'} earned · {activeCourses.length} active course{activeCourses.length===1?'':'s'} · {totalStudyMinutes} enrolled study minutes</Text>
        <View style={styles.portalStats}>
          <View style={styles.portalStat}><Text style={styles.portalStatNumber}>{enrolledCourses.length}</Text><Text style={styles.portalStatLabel}>Enrolled</Text></View>
          <View style={styles.portalStat}><Text style={styles.portalStatNumber}>{activeCourses.length}</Text><Text style={styles.portalStatLabel}>In progress</Text></View>
          <View style={styles.portalStat}><Text style={styles.portalStatNumber}>{completedCourses.length}</Text><Text style={styles.portalStatLabel}>Certified</Text></View>
        </View>
      </View>

      <Pressable onPress={()=>router.push('/academy-transcript')} style={styles.transcriptCard}>
        <View style={{flex:1}}>
          <Text style={styles.transcriptEyebrow}>STUDENT RECORDS</Text>
          <Text style={styles.transcriptTitle}>Academic Transcript</Text>
          <Text style={styles.transcriptCopy}>View your complete WHC Academy learning history, study time, module progress, assessment results and certificate codes.</Text>
        </View>
        <Text style={styles.transcriptArrow}>→</Text>
      </Pressable>

      {discount>0?<View style={styles.supportCard}><Text style={styles.supportEyebrow}>MEMBER LEARNING SUPPORT</Text><Text style={styles.supportTitle}>{discount}% Academy tuition reduction active</Text><Text style={styles.supportCopy}>Your member rate is applied automatically at secure enrolment checkout.</Text></View>:null}

      <SectionHeader eyebrow="MY LEARNING" title="Current studies" copy="Return to your enrolled programmes, continue from where you stopped and keep your learning record moving." />
      {activeCourses.length===0?<View style={styles.emptyCard}><Text style={styles.emptyEyebrow}>NO ACTIVE STUDIES</Text><Text style={styles.emptyTitle}>{completedCourses.length?'Your current learning is complete.':'You have not started a programme yet.'}</Text><Text style={styles.emptyCopy}>Choose a programme from the catalogue below when you are ready to begin your next area of professional development.</Text></View>:activeCourses.map(course=>{
        const enrollment=enrollmentMap.get(course.slug)
        const progress=progressFor(course)
        const lessonsDone=Object.keys(enrollment?.progress||{}).length
        return <Pressable key={course.slug} onPress={()=>router.push({pathname:'/academy-course/[slug]',params:{slug:course.slug}})} style={styles.studyCard}>
          <View style={styles.studyCardTop}><View style={{flex:1}}><Text style={styles.studyCategory}>{course.category.toUpperCase()}</Text><Text style={styles.studyTitle}>{course.title}</Text><Text style={styles.studyTagline}>{course.tagline}</Text></View><Text style={styles.studyProgress}>{progress}%</Text></View>
          <View style={styles.studyTrack}><View style={[styles.studyFill,{width:`${Math.max(3,progress)}%`}]} /></View>
          <View style={styles.studyFooter}><Text style={styles.studyMeta}>{lessonsDone}/{course.lessons.length} modules complete</Text><Text style={styles.studyAction}>Continue →</Text></View>
        </Pressable>
      })}

      <SectionHeader eyebrow="ACADEMIC RECORD" title="Certificates & completions" copy="Your completed WHC Academy learning stays attached to your professional development record." />
      {completedCourses.length===0?<View style={styles.recordEmpty}><Text style={styles.recordEmptyTitle}>No certificates earned yet.</Text><Text style={styles.recordEmptyCopy}>Complete every module and pass the final assessment to create your first verified WHC Academy completion record.</Text></View>:completedCourses.map(course=>{
        const enrollment=enrollmentMap.get(course.slug)
        return <Pressable key={course.slug} onPress={()=>router.push({pathname:'/academy-course/[slug]',params:{slug:course.slug}})} style={styles.recordRow}>
          <View style={styles.recordTick}><Text style={styles.recordTickText}>✓</Text></View>
          <View style={{flex:1}}><Text style={styles.recordCourse}>{course.title}</Text><Text style={styles.recordMeta}>{enrollment?.quiz_score!=null?`${enrollment.quiz_score}% assessment · `:''}${enrollment?.certificate_code||'Certificate awarded'}</Text></View>
          <Text style={styles.rowArrow}>›</Text>
        </Pressable>
      })}

      {!loading&&core.length>0&&coreOwned<core.length?<View style={styles.curriculum}>
        <Text style={styles.curriculumEyebrow}>FOUNDATION CURRICULUM</Text>
        <Text style={styles.curriculumTitle}>Complete the WHC core learning pathway.</Text>
        <Text style={styles.curriculumCopy}>{core.length} core programmes covering guest experience, standards, commercial awareness and professional practice. £79 before any member learning reduction.</Text>
        <View style={styles.curriculumMetaRow}><Text style={styles.curriculumMeta}>{coreOwned}/{core.length} already enrolled</Text><Text style={styles.curriculumMeta}>Certificates included</Text></View>
        <Pressable disabled={busy==='__bundle__'} onPress={()=>checkout('bundle')} style={styles.curriculumButton}><Text style={styles.curriculumButtonText}>{busy==='__bundle__'?'Opening enrolment…':'Enrol on the core pathway'}</Text></Pressable>
      </View>:null}

      <SectionHeader eyebrow="PROGRAMME CATALOGUE" title="Explore programmes" copy="Choose development by subject area. Programme information comes first; enrolment sits at the end of each course card." />
      {categories.map(category=><View key={category} style={styles.catalogueSection}>
        <Text style={styles.catalogueCategory}>{category.toUpperCase()}</Text>
        {courses.filter(c=>c.category===category).map(course=>{
          const enrollment=enrollmentMap.get(course.slug)
          const done=Boolean(enrollment?.completed_at)
          const base=Number(course.price??1000)
          return <View key={course.slug} style={styles.programmeCard}>
            <View style={styles.programmeTop}>
              <View style={{flex:1}}><Text style={styles.programmeTitle}>{course.title}</Text><Text style={styles.programmeTagline}>{course.tagline}</Text></View>
              {done?<View style={styles.statusBadge}><Text style={styles.statusBadgeText}>COMPLETED</Text></View>:enrollment?<View style={styles.statusBadge}><Text style={styles.statusBadgeText}>ENROLLED</Text></View>:null}
            </View>
            <View style={styles.programmeMetaRow}><Text style={styles.programmeMeta}>{course.lessons?.length||0} modules</Text><Text style={styles.programmeMeta}>~{course.minutes} min</Text><Text style={styles.programmeMeta}>{course.quiz?.length||0} assessment questions</Text></View>
            {enrollment?<Pressable onPress={()=>router.push({pathname:'/academy-course/[slug]',params:{slug:course.slug}})} style={styles.openProgramme}><Text style={styles.openProgrammeText}>{done?'Open academic record':'Open programme'}</Text><Text style={styles.openProgrammeArrow}>→</Text></Pressable>:<Pressable disabled={busy===course.slug} onPress={()=>checkout('course',course.slug)} style={styles.enrolProgramme}><Text style={styles.enrolProgrammeText}>{busy===course.slug?'Opening enrolment…':`Enrol · £${(base/100).toFixed(base%100?2:0)}${discount?` before ${discount}% member reduction`:''}`}</Text></Pressable>}
          </View>
        })}
      </View>)}

      <View style={styles.footBox}><Text style={styles.footEyebrow}>ACADEMIC INTEGRITY</Text><Text style={styles.footTitle}>Professional development, clearly represented.</Text><Text style={styles.foot}>WHC Academy certificates evidence completion and knowledge assessment. They do not replace accredited qualifications, licences, regulated training or insurance requirements.</Text></View>
    </>:null}
  </ScrollView>
}

function SectionHeader({eyebrow,title,copy}:{eyebrow:string;title:string;copy:string}){
  return <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionCopy}>{copy}</Text></View>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif,maxWidth:365},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans,maxWidth:365},
  error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:16,fontFamily:type.sans},
  portalHero:{backgroundColor:palette.ink,padding:19,borderRadius:radius.large,marginBottom:10},
  portalHeroTop:{flexDirection:'row',justifyContent:'space-between',gap:14,alignItems:'flex-start'},
  portalEyebrow:{color:'#D8E0E5',fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
  portalTitle:{color:palette.paper,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginTop:6},
  portalCount:{color:palette.paper,fontSize:34,lineHeight:38,fontWeight:'400',fontFamily:type.serif},
  portalCopy:{color:'#E3EAED',fontSize:10.5,lineHeight:17,marginTop:9,fontFamily:type.sans},
  portalStats:{flexDirection:'row',marginTop:15,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.15)',paddingTop:13},
  portalStat:{flex:1},
  portalStatNumber:{color:palette.paper,fontSize:16,fontWeight:'700',fontFamily:type.sans},
  portalStatLabel:{color:'#CDD7DC',fontSize:8.5,marginTop:3,fontFamily:type.sans},
  transcriptCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large,marginBottom:10,flexDirection:'row',alignItems:'center',gap:12},
  transcriptEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  transcriptTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  transcriptCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  transcriptArrow:{color:palette.ink,fontSize:18},
  supportCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:15,borderRadius:radius.large,marginBottom:8},
  supportEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  supportTitle:{color:palette.inkStrong,fontSize:16,lineHeight:21,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  supportCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
  sectionHeader:{marginTop:28,marginBottom:11},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.6,fontWeight:'700',fontFamily:type.sans},
  sectionTitle:{color:palette.inkStrong,fontSize:23,lineHeight:28,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  sectionCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  emptyCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large},
  emptyEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  emptyTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  emptyCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  studyCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large,marginBottom:9},
  studyCardTop:{flexDirection:'row',gap:12,alignItems:'flex-start'},
  studyCategory:{color:palette.quiet,fontSize:7.5,letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans},
  studyTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:4},
  studyTagline:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:4,fontFamily:type.sans},
  studyProgress:{color:palette.ink,fontSize:18,fontWeight:'700',fontFamily:type.sans},
  studyTrack:{height:3,backgroundColor:palette.stoneDeep,marginTop:13,borderRadius:2,overflow:'hidden'},
  studyFill:{height:3,backgroundColor:palette.ink},
  studyFooter:{flexDirection:'row',justifyContent:'space-between',gap:12,marginTop:11},
  studyMeta:{color:palette.quiet,fontSize:9,fontFamily:type.sans},
  studyAction:{color:palette.ink,fontSize:9.5,fontWeight:'700',fontFamily:type.sans},
  recordEmpty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large},
  recordEmptyTitle:{color:palette.inkStrong,fontSize:15,fontWeight:'700',fontFamily:type.sans},
  recordEmptyCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  recordRow:{flexDirection:'row',gap:11,alignItems:'center',paddingVertical:13,borderBottomWidth:1,borderBottomColor:palette.line},
  recordTick:{width:29,height:29,borderRadius:15,backgroundColor:palette.ink,alignItems:'center',justifyContent:'center'},
  recordTickText:{color:palette.paper,fontSize:11,fontWeight:'800'},
  recordCourse:{color:palette.inkStrong,fontSize:11.5,fontWeight:'700',fontFamily:type.sans},
  recordMeta:{color:palette.quiet,fontSize:8.5,lineHeight:13,marginTop:3,fontFamily:type.sans},
  rowArrow:{color:palette.quiet,fontSize:18},
  curriculum:{backgroundColor:palette.ink,padding:19,borderRadius:radius.large,marginTop:26},
  curriculumEyebrow:{color:'#D8E0E5',fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
  curriculumTitle:{color:palette.paper,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginTop:6},
  curriculumCopy:{color:'#E3EAED',fontSize:10.5,lineHeight:17,marginTop:6,fontFamily:type.sans},
  curriculumMetaRow:{flexDirection:'row',justifyContent:'space-between',gap:10,marginTop:12},
  curriculumMeta:{color:'#CDD7DC',fontSize:8.5,fontFamily:type.sans},
  curriculumButton:{backgroundColor:palette.paper,paddingVertical:13,alignItems:'center',marginTop:15,borderRadius:radius.medium},
  curriculumButtonText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  catalogueSection:{marginBottom:24},
  catalogueCategory:{color:palette.quiet,fontSize:8,letterSpacing:1.5,fontWeight:'700',fontFamily:type.sans,marginBottom:7},
  programmeCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large,marginBottom:8},
  programmeTop:{flexDirection:'row',gap:10,justifyContent:'space-between',alignItems:'flex-start'},
  programmeTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif},
  programmeTagline:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:4,fontFamily:type.sans},
  statusBadge:{backgroundColor:palette.stoneDeep,paddingHorizontal:7,paddingVertical:4,borderRadius:999},
  statusBadgeText:{color:palette.ink,fontSize:7,letterSpacing:.7,fontWeight:'700',fontFamily:type.sans},
  programmeMetaRow:{flexDirection:'row',flexWrap:'wrap',gap:10,marginTop:11,paddingTop:10,borderTopWidth:1,borderTopColor:palette.line},
  programmeMeta:{color:palette.quiet,fontSize:8.5,fontFamily:type.sans},
  openProgramme:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:12},
  openProgrammeText:{color:palette.ink,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  openProgrammeArrow:{color:palette.ink,fontSize:15},
  enrolProgramme:{borderTopWidth:1,borderTopColor:palette.line,marginTop:12,paddingTop:12},
  enrolProgrammeText:{color:palette.ink,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  footBox:{backgroundColor:palette.stoneDeep,padding:16,borderRadius:radius.large,marginTop:8},
  footEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  footTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  foot:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:5,fontFamily:type.sans},
})
