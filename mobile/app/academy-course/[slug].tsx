import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'
const PASS_MARK = 80

type Lesson={title:string;content:string}
type Question={q:string;options:string[]}
type Course={slug:string;title:string;tagline:string;category:string;minutes:number;lessons:Lesson[];quiz:Question[]}
type Enrollment={course_slug:string;paid_at?:string|null;completed_at?:string|null;progress?:Record<string,boolean>;quiz_score?:number|null;certificate_code?:string|null}
type CourseView='handbook'|'assessment'|'record'|number

export default function AcademyCourseScreen(){
  const { slug }=useLocalSearchParams<{slug:string}>()
  const [course,setCourse]=useState<Course|null>(null)
  const [enrollment,setEnrollment]=useState<Enrollment|null>(null)
  const [loading,setLoading]=useState(true)
  const [view,setView]=useState<CourseView>('handbook')
  const [answers,setAnswers]=useState<Record<number,number>>({})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  useEffect(()=>{void load()},[slug])

  async function headers():Promise<Record<string,string>>{
    const {data:{session}}=await supabase.auth.getSession()
    return session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{ }
  }

  async function load(){
    setLoading(true);setError('')
    try{
      const h=await headers()
      const [cRes,aRes]=await Promise.all([
        fetch(`${WEB_URL}/api/academy/catalog?slug=${encodeURIComponent(String(slug||''))}`),
        fetch(`${WEB_URL}/api/academy`,{headers:h}),
      ])
      const c=await cRes.json();const a=await aRes.json()
      if(!cRes.ok||!c.course)throw new Error(c.error||'Course not found.')
      if(!aRes.ok)throw new Error(a.error||'Could not load your progress.')
      const enr=(a.enrollments||[]).find((e:any)=>e.course_slug===slug&&e.paid_at)||null
      setCourse(c.course);setEnrollment(enr)
    }catch(e:any){setError(e.message||'Could not load course.')}
    setLoading(false)
  }

  function moduleDone(index:number){
    return Boolean(enrollment?.progress?.[index]||enrollment?.progress?.[String(index)])
  }

  const doneCount=useMemo(()=>course?course.lessons.filter((_,i)=>moduleDone(i)).length:0,[course,enrollment])
  const allDone=Boolean(course&&doneCount===course.lessons.length)
  const progressPct=course?Math.round(((doneCount+(enrollment?.completed_at?1:0))/(course.lessons.length+1))*100):0
  const nextModule=course?course.lessons.findIndex((_,i)=>!moduleDone(i)):-1
  const studyMinutesPerModule=course?.lessons.length?Math.max(1,Math.round(course.minutes/course.lessons.length)):0

  async function markComplete(index:number){
    if(!course||!enrollment||moduleDone(index))return
    setBusy(true);setError('')
    try{
      const h=await headers()
      const res=await fetch(`${WEB_URL}/api/academy`,{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({action:'progress',courseSlug:course.slug,lesson:index})})
      const j=await res.json()
      if(!res.ok)throw new Error(j.error||'Could not save progress.')
      setEnrollment({...enrollment,progress:j.progress||{...(enrollment.progress||{}),[index]:true}})
      if(index<course.lessons.length-1)setView(index+1)
      else setView('assessment')
    }catch(e:any){setError(e.message||'Could not save progress.')}
    setBusy(false)
  }

  async function submitQuiz(){
    if(!course||!enrollment)return
    const list=course.quiz.map((_,i)=>answers[i])
    if(list.some(answer=>answer===undefined)){Alert.alert('Assessment incomplete','Answer every question before submitting your assessment.');return}
    setBusy(true);setError('')
    try{
      const h=await headers()
      const res=await fetch(`${WEB_URL}/api/academy`,{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({action:'quiz',courseSlug:course.slug,answers:list})})
      const j=await res.json()
      if(!res.ok)throw new Error(j.error||'Could not submit assessment.')
      if(j.passed){
        setEnrollment({...enrollment,completed_at:new Date().toISOString(),quiz_score:j.score,certificate_code:j.certificate_code||enrollment.certificate_code})
        setView('record')
        Alert.alert('Course completed',`You passed the final assessment with ${j.score}%. Your Talent House Academy certificate is ready.`)
      }else{
        setEnrollment({...enrollment,quiz_score:j.score})
        Alert.alert('Assessment result',`You scored ${j.score}%. The pass mark is ${PASS_MARK}%. Review the syllabus and try again when you are ready.`)
      }
    }catch(e:any){setError(e.message||'Could not submit assessment.')}
    setBusy(false)
  }

  function continueStudy(){
    if(!course)return
    if(enrollment?.completed_at){setView('record');return}
    if(nextModule>=0){setView(nextModule);return}
    setView('assessment')
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>
  if(error&&!course)return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
  if(!course)return null

  if(!enrollment)return <View style={styles.pageStatic}>
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Academy</Text></Pressable>
    <Text style={styles.eyebrow}>TALENT HOUSE ACADEMY · PROFESSIONAL LEARNING</Text>
    <Text style={styles.title}>{course.title}</Text>
    <Text style={styles.intro}>{course.tagline}</Text>
    <View style={styles.lockedCard}><Text style={styles.lockedEyebrow}>ENROLMENT REQUIRED</Text><Text style={styles.lockedTitle}>This course is not yet on your learning record.</Text><Text style={styles.lockedCopy}>Return to the Academy catalogue to enrol. Once enrolled, your modules, assessment and certificate will all be tracked here.</Text></View>
  </View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Academy</Text></Pressable>
    <Text style={styles.eyebrow}>TALENT HOUSE ACADEMY · {course.category.toUpperCase()}</Text>
    <Text style={styles.title}>{course.title}</Text>
    <Text style={styles.intro}>{course.tagline}</Text>

    <View style={styles.studyStatus}>
      <View style={styles.studyStatusTop}>
        <View><Text style={styles.studyEyebrow}>STUDY STATUS</Text><Text style={styles.studyTitle}>{enrollment.completed_at?'Course completed':'In progress'}</Text></View>
        <Text style={styles.progressNumber}>{progressPct}%</Text>
      </View>
      <View style={styles.track}><View style={[styles.fill,{width:`${Math.max(3,progressPct)}%`}]} /></View>
      <View style={styles.statRow}>
        <View style={styles.stat}><Text style={styles.statNumber}>{doneCount}/{course.lessons.length}</Text><Text style={styles.statLabel}>Modules</Text></View>
        <View style={styles.stat}><Text style={styles.statNumber}>{course.minutes}</Text><Text style={styles.statLabel}>Study minutes</Text></View>
        <View style={styles.stat}><Text style={styles.statNumber}>{PASS_MARK}%</Text><Text style={styles.statLabel}>Pass mark</Text></View>
      </View>
      <Pressable onPress={continueStudy} style={styles.continueButton}><Text style={styles.continueText}>{enrollment.completed_at?'View academic record':nextModule>=0?'Continue learning':'Open final assessment'}</Text><Text style={styles.continueArrow}>→</Text></Pressable>
    </View>

    {error?<Text style={styles.error}>{error}</Text>:null}

    <View style={styles.nav}>
      {[
        ['handbook','Handbook'],
        ['assessment','Assessment'],
        ['record','Record'],
      ].map(([value,label])=><Pressable key={value} onPress={()=>setView(value as CourseView)} style={[styles.navItem,view===value&&styles.navItemActive]}><Text style={[styles.navText,view===value&&styles.navTextActive]}>{label}</Text></Pressable>)}
    </View>

    {view==='handbook'?<>
      <View style={styles.paperSection}>
        <Text style={styles.sectionEyebrow}>COURSE HANDBOOK</Text>
        <Text style={styles.sectionTitle}>About this course</Text>
        <Text style={styles.body}>{course.tagline}. This Talent House Academy professional-development course is designed to be completed in sequence, followed by a final knowledge assessment.</Text>
      </View>

      <View style={styles.paperSection}>
        <Text style={styles.sectionEyebrow}>SYLLABUS</Text>
        <Text style={styles.sectionTitle}>What you will study</Text>
        <Text style={styles.bodySmall}>Work through the modules in order. Your progress is saved to your Academy record.</Text>
        <View style={styles.moduleList}>{course.lessons.map((lesson,index)=><Pressable key={lesson.title} onPress={()=>setView(index)} style={styles.moduleRow}>
          <View style={[styles.moduleNumber,moduleDone(index)&&styles.moduleNumberDone]}><Text style={[styles.moduleNumberText,moduleDone(index)&&styles.moduleNumberTextDone]}>{moduleDone(index)?'✓':String(index+1).padStart(2,'0')}</Text></View>
          <View style={{flex:1}}><Text style={styles.moduleTitle}>{lesson.title}</Text><Text style={styles.moduleMeta}>Module {index+1} · approximately {studyMinutesPerModule} min</Text></View>
          <Text style={styles.rowArrow}>›</Text>
        </Pressable>)}</View>
      </View>

      <View style={styles.paperSection}>
        <Text style={styles.sectionEyebrow}>COURSE REQUIREMENTS</Text>
        <Text style={styles.sectionTitle}>How completion works</Text>
        <Requirement number="01" title="Complete the syllabus" copy={`Complete all ${course.lessons.length} learning modules before the final assessment unlocks.`}/>
        <Requirement number="02" title="Sit the final assessment" copy={`Answer ${course.quiz.length} knowledge questions. The pass mark is ${PASS_MARK}%.`}/>
        <Requirement number="03" title="Earn your Talent House Academy certificate" copy="A successful assessment creates a verified completion record and certificate code on your Talent House profile."/>
      </View>
    </>:null}

    {typeof view==='number'?<View style={styles.learningPaper}>
      <View style={styles.moduleHeader}>
        <View><Text style={styles.sectionEyebrow}>MODULE {String(view+1).padStart(2,'0')}</Text><Text style={styles.moduleStudyMeta}>~{studyMinutesPerModule} min study</Text></View>
        <View style={[styles.moduleStatus,moduleDone(view)&&styles.moduleStatusDone]}><Text style={[styles.moduleStatusText,moduleDone(view)&&styles.moduleStatusTextDone]}>{moduleDone(view)?'COMPLETE':'IN STUDY'}</Text></View>
      </View>
      <Text style={styles.learningTitle}>{course.lessons[view].title}</Text>
      <View style={styles.rule}/>
      <View style={styles.reading}>{course.lessons[view].content.split(/\n\n+/).filter(Boolean).map((paragraph,index)=><Text key={index} style={styles.readingParagraph}>{paragraph.trim()}</Text>)}</View>
      <View style={styles.studyPrompt}><Text style={styles.studyPromptEyebrow}>REFLECT BEFORE MOVING ON</Text><Text style={styles.studyPromptCopy}>What would this module change about the way you work, lead or serve a guest? Make a mental or written note before marking it complete.</Text></View>
      <Pressable disabled={busy||moduleDone(view)} onPress={()=>markComplete(view)} style={[styles.primary,(busy||moduleDone(view))&&styles.primaryDone]}><Text style={styles.primaryText}>{moduleDone(view)?'Module completed ✓':busy?'Saving progress…':'Complete module & continue'}</Text></Pressable>
    </View>:null}

    {view==='assessment'?<View style={styles.paperSection}>
      <Text style={styles.sectionEyebrow}>FINAL ASSESSMENT</Text>
      <Text style={styles.sectionTitle}>Assessment brief</Text>
      <View style={styles.assessmentGrid}>
        <View style={styles.assessmentStat}><Text style={styles.assessmentNumber}>{course.quiz.length}</Text><Text style={styles.assessmentLabel}>Questions</Text></View>
        <View style={styles.assessmentStat}><Text style={styles.assessmentNumber}>{PASS_MARK}%</Text><Text style={styles.assessmentLabel}>Pass mark</Text></View>
        <View style={styles.assessmentStat}><Text style={styles.assessmentNumber}>{doneCount}/{course.lessons.length}</Text><Text style={styles.assessmentLabel}>Modules complete</Text></View>
      </View>
      <Text style={styles.bodySmall}>The assessment checks your understanding of the full syllabus. If you do not reach the pass mark, review the learning modules and attempt it again.</Text>

      {!allDone?<View style={styles.assessmentLocked}><Text style={styles.lockedEyebrow}>ASSESSMENT LOCKED</Text><Text style={styles.lockedTitle}>Complete the syllabus first.</Text><Text style={styles.lockedCopy}>You have completed {doneCount} of {course.lessons.length} modules. The assessment unlocks automatically when every module is complete.</Text></View>:<View style={styles.questionList}>{course.quiz.map((q,qi)=><View key={q.q} style={styles.question}>
        <Text style={styles.questionNumber}>QUESTION {String(qi+1).padStart(2,'0')}</Text>
        <Text style={styles.questionText}>{q.q}</Text>
        {q.options.map((opt,oi)=><Pressable key={opt} onPress={()=>setAnswers(current=>({...current,[qi]:oi}))} style={[styles.option,answers[qi]===oi&&styles.optionSelected]}><View style={[styles.optionMarker,answers[qi]===oi&&styles.optionMarkerSelected]}><Text style={[styles.optionMarkerText,answers[qi]===oi&&styles.optionMarkerTextSelected]}>{String.fromCharCode(65+oi)}</Text></View><Text style={[styles.optionText,answers[qi]===oi&&styles.optionTextSelected]}>{opt}</Text></Pressable>)}
      </View>)}<Pressable disabled={busy} onPress={submitQuiz} style={styles.primary}><Text style={styles.primaryText}>{busy?'Submitting assessment…':'Submit final assessment'}</Text></Pressable></View>}
    </View>:null}

    {view==='record'?<View style={styles.paperSection}>
      <Text style={styles.sectionEyebrow}>ACADEMIC RECORD</Text>
      <Text style={styles.sectionTitle}>{enrollment.completed_at?'Course completed':'Current learning record'}</Text>
      <View style={styles.recordHero}>
        <View><Text style={styles.recordLabel}>COURSE</Text><Text style={styles.recordCourse}>{course.title}</Text></View>
        <View style={styles.recordStatus}><Text style={styles.recordStatusText}>{enrollment.completed_at?'COMPLETED':'IN PROGRESS'}</Text></View>
      </View>
      <View style={styles.recordRows}>
        <RecordRow label="Modules completed" value={`${doneCount} of ${course.lessons.length}`}/>
        <RecordRow label="Assessment result" value={enrollment.quiz_score!=null?`${enrollment.quiz_score}%`:'Not yet submitted'}/>
        <RecordRow label="Required pass mark" value={`${PASS_MARK}%`}/>
        <RecordRow label="Certificate" value={enrollment.completed_at?'Awarded':'Pending completion'}/>
      </View>
      {enrollment.completed_at?<View style={styles.certificate}>
        <Text style={styles.certificateEyebrow}>TALENT HOUSE ACADEMY CERTIFICATE</Text>
        <Text style={styles.certificateTitle}>Certificate of completion</Text>
        <Text style={styles.certificateCourse}>{course.title}</Text>
        <Text style={styles.certificateCode}>{enrollment.certificate_code||'Verification code pending'}</Text>
        <Text style={styles.certificateCopy}>This completion record is attached to your Talent House professional profile. Talent House Academy certificates evidence course completion and knowledge assessment; they do not replace accredited qualifications, licences or insurance requirements.</Text>
      </View>:null}
      <Text style={styles.recordModuleHeading}>MODULE RECORD</Text>
      {course.lessons.map((lesson,index)=><View key={lesson.title} style={styles.recordModuleRow}><Text style={styles.recordModuleIndex}>{String(index+1).padStart(2,'0')}</Text><Text style={styles.recordModuleTitle}>{lesson.title}</Text><Text style={[styles.recordModuleStatus,moduleDone(index)&&styles.recordModuleStatusDone]}>{moduleDone(index)?'Complete':'Pending'}</Text></View>)}
    </View>:null}
  </ScrollView>
}

function Requirement({number,title,copy}:{number:string;title:string;copy:string}){
  return <View style={styles.requirement}><Text style={styles.requirementNumber}>{number}</Text><View style={{flex:1}}><Text style={styles.requirementTitle}>{title}</Text><Text style={styles.requirementCopy}>{copy}</Text></View></View>
}

function RecordRow({label,value}:{label:string;value:string}){
  return <View style={styles.recordRow}><Text style={styles.recordRowLabel}>{label}</Text><Text style={styles.recordRowValue}>{value}</Text></View>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  pageStatic:{flex:1,backgroundColor:palette.stone,paddingHorizontal:space.page,paddingTop:18},
  center:{flex:1,backgroundColor:palette.stone,alignItems:'center',justifyContent:'center',padding:24},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:8,marginBottom:20,fontFamily:type.sans},
  error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:14,fontFamily:type.sans},
  studyStatus:{backgroundColor:palette.ink,padding:18,borderRadius:radius.large,marginBottom:18},
  studyStatusTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},
  studyEyebrow:{color:'#D7E0E4',fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
  studyTitle:{color:palette.paper,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  progressNumber:{color:palette.paper,fontSize:25,fontWeight:'400',fontFamily:type.serif},
  track:{height:3,backgroundColor:'rgba(255,255,255,.18)',marginTop:13,borderRadius:2,overflow:'hidden'},
  fill:{height:3,backgroundColor:palette.paper},
  statRow:{flexDirection:'row',marginTop:15,borderTopWidth:1,borderTopColor:'rgba(255,255,255,.14)',paddingTop:13},
  stat:{flex:1},
  statNumber:{color:palette.paper,fontSize:15,fontWeight:'700',fontFamily:type.sans},
  statLabel:{color:'#CCD7DC',fontSize:8.5,marginTop:3,fontFamily:type.sans},
  continueButton:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:palette.paper,paddingHorizontal:13,paddingVertical:12,borderRadius:radius.medium,marginTop:15},
  continueText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  continueArrow:{color:palette.ink,fontSize:15},
  nav:{flexDirection:'row',borderBottomWidth:1,borderBottomColor:palette.line,marginBottom:18},
  navItem:{flex:1,alignItems:'center',paddingVertical:11,borderBottomWidth:2,borderBottomColor:'transparent'},
  navItemActive:{borderBottomColor:palette.ink},
  navText:{color:palette.quiet,fontSize:9.5,fontWeight:'600',fontFamily:type.sans},
  navTextActive:{color:palette.inkStrong,fontWeight:'700'},
  paperSection:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large,marginBottom:14},
  sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.5,fontWeight:'700',fontFamily:type.sans,marginBottom:6},
  sectionTitle:{color:palette.inkStrong,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginBottom:9},
  body:{color:palette.text,fontSize:12.5,lineHeight:20,fontFamily:type.sans},
  bodySmall:{color:palette.muted,fontSize:10.5,lineHeight:17,fontFamily:type.sans},
  moduleList:{marginTop:13,borderTopWidth:1,borderTopColor:palette.line},
  moduleRow:{flexDirection:'row',alignItems:'center',gap:11,paddingVertical:13,borderBottomWidth:1,borderBottomColor:palette.line},
  moduleNumber:{width:29,height:29,borderRadius:15,borderWidth:1,borderColor:palette.lineStrong,alignItems:'center',justifyContent:'center'},
  moduleNumberDone:{backgroundColor:palette.ink,borderColor:palette.ink},
  moduleNumberText:{color:palette.quiet,fontSize:8.5,fontWeight:'700',fontFamily:type.sans},
  moduleNumberTextDone:{color:palette.paper},
  moduleTitle:{color:palette.inkStrong,fontSize:11.5,fontWeight:'700',fontFamily:type.sans},
  moduleMeta:{color:palette.quiet,fontSize:8.5,marginTop:4,fontFamily:type.sans},
  rowArrow:{color:palette.quiet,fontSize:18},
  requirement:{flexDirection:'row',gap:11,paddingVertical:12,borderTopWidth:1,borderTopColor:palette.line},
  requirementNumber:{width:28,color:palette.quiet,fontSize:8,fontWeight:'700',letterSpacing:1,fontFamily:type.sans,paddingTop:2},
  requirementTitle:{color:palette.inkStrong,fontSize:11.5,fontWeight:'700',fontFamily:type.sans},
  requirementCopy:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:4,fontFamily:type.sans},
  learningPaper:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:19,borderRadius:radius.large,marginBottom:14},
  moduleHeader:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},
  moduleStudyMeta:{color:palette.quiet,fontSize:8.5,fontFamily:type.sans,marginTop:2},
  moduleStatus:{backgroundColor:palette.stoneDeep,paddingHorizontal:8,paddingVertical:5,borderRadius:999},
  moduleStatusDone:{backgroundColor:palette.ink},
  moduleStatusText:{color:palette.quiet,fontSize:7,fontWeight:'800',letterSpacing:.8,fontFamily:type.sans},
  moduleStatusTextDone:{color:palette.paper},
  learningTitle:{color:palette.inkStrong,fontSize:26,lineHeight:31,fontWeight:'400',fontFamily:type.serif,marginTop:10},
  rule:{height:1,backgroundColor:palette.line,marginVertical:18},
  reading:{gap:14},
  readingParagraph:{color:palette.text,fontSize:13,lineHeight:22,fontFamily:type.sans},
  studyPrompt:{backgroundColor:palette.stoneDeep,padding:14,borderRadius:radius.medium,marginTop:20},
  studyPromptEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  studyPromptCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  primary:{backgroundColor:palette.ink,paddingVertical:14,alignItems:'center',marginTop:18,borderRadius:radius.medium},
  primaryDone:{opacity:.48},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  assessmentGrid:{flexDirection:'row',gap:7,marginVertical:13},
  assessmentStat:{flex:1,backgroundColor:palette.stone,padding:11,borderRadius:radius.medium},
  assessmentNumber:{color:palette.inkStrong,fontSize:18,fontWeight:'400',fontFamily:type.serif},
  assessmentLabel:{color:palette.quiet,fontSize:8.5,lineHeight:13,marginTop:3,fontFamily:type.sans},
  assessmentLocked:{backgroundColor:palette.stoneDeep,padding:16,borderRadius:radius.large,marginTop:16},
  lockedCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large},
  lockedEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  lockedTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  lockedCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:6,fontFamily:type.sans},
  questionList:{marginTop:16},
  question:{paddingTop:18,borderTopWidth:1,borderTopColor:palette.line,marginTop:4},
  questionNumber:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  questionText:{color:palette.inkStrong,fontSize:14,lineHeight:21,fontWeight:'700',fontFamily:type.sans,marginTop:6,marginBottom:11},
  option:{borderWidth:1,borderColor:palette.line,padding:11,marginBottom:7,borderRadius:radius.medium,flexDirection:'row',alignItems:'center',gap:10},
  optionSelected:{backgroundColor:palette.ink,borderColor:palette.ink},
  optionMarker:{width:24,height:24,borderRadius:12,borderWidth:1,borderColor:palette.lineStrong,alignItems:'center',justifyContent:'center'},
  optionMarkerSelected:{borderColor:palette.paper,backgroundColor:palette.paper},
  optionMarkerText:{color:palette.quiet,fontSize:8.5,fontWeight:'700',fontFamily:type.sans},
  optionMarkerTextSelected:{color:palette.ink},
  optionText:{color:palette.text,fontSize:10.5,lineHeight:16,flex:1,fontFamily:type.sans},
  optionTextSelected:{color:palette.paper},
  recordHero:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12,backgroundColor:palette.stone,padding:14,borderRadius:radius.medium},
  recordLabel:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  recordCourse:{color:palette.inkStrong,fontSize:14,fontWeight:'700',fontFamily:type.sans,marginTop:4,maxWidth:230},
  recordStatus:{backgroundColor:palette.ink,paddingHorizontal:8,paddingVertical:5,borderRadius:999},
  recordStatusText:{color:palette.paper,fontSize:7,fontWeight:'800',letterSpacing:.8,fontFamily:type.sans},
  recordRows:{marginTop:12,borderTopWidth:1,borderTopColor:palette.line},
  recordRow:{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:11,borderBottomWidth:1,borderBottomColor:palette.line},
  recordRowLabel:{color:palette.muted,fontSize:10.5,fontFamily:type.sans},
  recordRowValue:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',fontFamily:type.sans,textAlign:'right'},
  certificate:{borderWidth:1,borderColor:palette.lineStrong,padding:18,borderRadius:radius.large,marginTop:18},
  certificateEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
  certificateTitle:{color:palette.inkStrong,fontSize:24,lineHeight:29,fontWeight:'400',fontFamily:type.serif,marginTop:7},
  certificateCourse:{color:palette.text,fontSize:11.5,fontWeight:'700',fontFamily:type.sans,marginTop:8},
  certificateCode:{color:palette.ink,fontSize:16,fontWeight:'700',letterSpacing:1.1,fontFamily:type.sans,marginTop:13},
  certificateCopy:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:8,fontFamily:type.sans},
  recordModuleHeading:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans,marginTop:20,marginBottom:4},
  recordModuleRow:{flexDirection:'row',gap:10,alignItems:'center',paddingVertical:10,borderBottomWidth:1,borderBottomColor:palette.line},
  recordModuleIndex:{width:24,color:palette.quiet,fontSize:8,fontFamily:type.sans},
  recordModuleTitle:{flex:1,color:palette.text,fontSize:10.5,fontFamily:type.sans},
  recordModuleStatus:{color:palette.quiet,fontSize:8.5,fontFamily:type.sans},
  recordModuleStatusDone:{color:palette.ink,fontWeight:'700'},
})
