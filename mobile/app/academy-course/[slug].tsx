import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

type Lesson={title:string;content:string}
type Question={q:string;options:string[]}
type Course={slug:string;title:string;tagline:string;category:string;minutes:number;lessons:Lesson[];quiz:Question[]}
type Enrollment={course_slug:string;paid_at?:string|null;completed_at?:string|null;progress?:Record<string,boolean>;quiz_score?:number|null;certificate_code?:string|null}

export default function AcademyCourseScreen(){
  const { slug }=useLocalSearchParams<{slug:string}>()
  const [course,setCourse]=useState<Course|null>(null)
  const [enrollment,setEnrollment]=useState<Enrollment|null>(null)
  const [loading,setLoading]=useState(true)
  const [view,setView]=useState<'overview'|'quiz'|number>('overview')
  const [answers,setAnswers]=useState<Record<number,number>>({})
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')

  useEffect(()=>{load()},[slug])
  async function headers():Promise<Record<string,string>>{const {data:{session}}=await supabase.auth.getSession();return session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{}}
  async function load(){
    setLoading(true);setError('')
    try{
      const h=await headers()
      const [cRes,aRes]=await Promise.all([
        fetch(`${WEB_URL}/api/academy/catalog?slug=${encodeURIComponent(String(slug||''))}`),
        fetch(`${WEB_URL}/api/academy`,{headers:h}),
      ])
      const c=await cRes.json(); const a=await aRes.json()
      if(!cRes.ok||!c.course) throw new Error(c.error||'Course not found.')
      if(!aRes.ok) throw new Error(a.error||'Could not load your progress.')
      const enr=(a.enrollments||[]).find((e:any)=>e.course_slug===slug&&e.paid_at)||null
      setCourse(c.course);setEnrollment(enr)
    }catch(e:any){setError(e.message||'Could not load course.')}
    setLoading(false)
  }

  const doneCount=useMemo(()=>course?course.lessons.filter((_,i)=>Boolean(enrollment?.progress?.[i]||enrollment?.progress?.[String(i)])).length:0,[course,enrollment])
  const allDone=Boolean(course&&doneCount===course.lessons.length)

  async function markComplete(index:number){
    if(!course||!enrollment||enrollment.progress?.[index]||enrollment.progress?.[String(index)]) return
    setBusy(true);setError('')
    try{
      const h=await headers()
      const res=await fetch(`${WEB_URL}/api/academy`,{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({action:'progress',courseSlug:course.slug,lesson:index})})
      const j=await res.json(); if(!res.ok) throw new Error(j.error||'Could not save progress.')
      setEnrollment({...enrollment,progress:j.progress||{...(enrollment.progress||{}),[index]:true}})
      if(index<course.lessons.length-1)setView(index+1)
    }catch(e:any){setError(e.message||'Could not save progress.')}
    setBusy(false)
  }

  async function submitQuiz(){
    if(!course||!enrollment)return
    const list=course.quiz.map((_,i)=>answers[i])
    if(list.some(a=>a===undefined)){Alert.alert('Assessment','Please answer every question.');return}
    setBusy(true);setError('')
    try{
      const h=await headers()
      const res=await fetch(`${WEB_URL}/api/academy`,{method:'POST',headers:{...h,'Content-Type':'application/json'},body:JSON.stringify({action:'quiz',courseSlug:course.slug,answers:list})})
      const j=await res.json(); if(!res.ok) throw new Error(j.error||'Could not submit assessment.')
      if(j.passed){setEnrollment({...enrollment,completed_at:new Date().toISOString(),quiz_score:j.score,certificate_code:j.certificate_code||enrollment.certificate_code});Alert.alert('Course complete',`You passed with ${j.score}%. Your certificate is ready.`)}else{setEnrollment({...enrollment,quiz_score:j.score});Alert.alert('Assessment result',`You scored ${j.score}%. You need 80% to pass. You can review the modules and try again.`)}
    }catch(e:any){setError(e.message||'Could not submit assessment.')}
    setBusy(false)
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color="#092b45"/></View>
  if(error&&!course)return <View style={styles.center}><Text style={styles.error}>{error}</Text></View>
  if(!course)return null
  if(!enrollment)return <View style={styles.pageStatic}><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Academy</Text></Pressable><Text style={styles.title}>{course.title}</Text><Text style={styles.intro}>You are not enrolled on this course yet. Return to the Academy catalogue to enrol.</Text></View>

  const progressPct=Math.round(((doneCount+(enrollment.completed_at?1:0))/(course.lessons.length+1))*100)
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Academy</Text></Pressable>
    <Text style={styles.eyebrow}>WHC ACADEMY · {course.category.toUpperCase()}</Text><Text style={styles.title}>{course.title}</Text><Text style={styles.intro}>{course.tagline}</Text>
    <View style={styles.progressCard}><Text style={styles.progressText}>{enrollment.completed_at?'Complete · certified':`${doneCount}/${course.lessons.length} modules complete`}</Text><View style={styles.track}><View style={[styles.fill,{width:`${Math.max(4,progressPct)}%`}]} /></View></View>
    {enrollment.completed_at?<View style={styles.certificate}><Text style={styles.certificateTitle}>Certificate earned</Text><Text style={styles.certificateCode}>{enrollment.certificate_code||'Verification code pending'}</Text><Text style={styles.certificateCopy}>This Academy completion badge is visible on your WHC professional profile.</Text></View>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabs}>
      <Pressable onPress={()=>setView('overview')} style={[styles.tab,view==='overview'&&styles.tabActive]}><Text style={[styles.tabText,view==='overview'&&styles.tabTextActive]}>Overview</Text></Pressable>
      {course.lessons.map((lesson,i)=><Pressable key={lesson.title} onPress={()=>setView(i)} style={[styles.tab,view===i&&styles.tabActive]}><Text style={[styles.tabText,view===i&&styles.tabTextActive]}>{i+1}</Text></Pressable>)}
      <Pressable disabled={!allDone} onPress={()=>setView('quiz')} style={[styles.tab,view==='quiz'&&styles.tabActive,!allDone&&styles.tabDisabled]}><Text style={[styles.tabText,view==='quiz'&&styles.tabTextActive]}>Quiz</Text></Pressable>
    </ScrollView>
    {view==='overview'?<View style={styles.card}><Text style={styles.sectionTitle}>Course overview</Text><Text style={styles.body}>{course.lessons.length} modules · approximately {course.minutes} minutes · {course.quiz.length} final assessment questions. Complete every module to unlock the assessment. You need 80% to pass.</Text></View>:null}
    {typeof view==='number'?<View style={styles.card}><Text style={styles.moduleLabel}>MODULE {view+1}</Text><Text style={styles.sectionTitle}>{course.lessons[view].title}</Text><Text style={styles.body}>{course.lessons[view].content}</Text><Pressable disabled={busy||Boolean(enrollment.progress?.[view]||enrollment.progress?.[String(view)])} onPress={()=>markComplete(view)} style={styles.primary}><Text style={styles.primaryText}>{enrollment.progress?.[view]||enrollment.progress?.[String(view)]?'Completed ✓':busy?'Saving…':'Mark module complete'}</Text></Pressable></View>:null}
    {view==='quiz'?<View style={styles.card}><Text style={styles.moduleLabel}>FINAL ASSESSMENT</Text><Text style={styles.sectionTitle}>Show what you know</Text>{course.quiz.map((q,qi)=><View key={q.q} style={styles.question}><Text style={styles.questionText}>{qi+1}. {q.q}</Text>{q.options.map((opt,oi)=><Pressable key={opt} onPress={()=>setAnswers(a=>({...a,[qi]:oi}))} style={[styles.option,answers[qi]===oi&&styles.optionSelected]}><Text style={[styles.optionText,answers[qi]===oi&&styles.optionTextSelected]}>{opt}</Text></Pressable>)}</View>)}<Pressable disabled={busy} onPress={submitQuiz} style={styles.primary}><Text style={styles.primaryText}>{busy?'Submitting…':'Submit assessment'}</Text></Pressable>{enrollment.quiz_score!=null?<Text style={styles.score}>Best score: {enrollment.quiz_score}%</Text>:null}</View>:null}
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:50},pageStatic:{flex:1,backgroundColor:'#fff',paddingHorizontal:22,paddingTop:64},center:{flex:1,backgroundColor:'#fff',alignItems:'center',justifyContent:'center',padding:24},back:{color:'#66747c',fontSize:13,marginBottom:30},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:1.7,marginBottom:10},title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'500'},intro:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:8,marginBottom:20},progressCard:{backgroundColor:'#f4f7f8',padding:15,marginBottom:16},progressText:{color:'#173246',fontSize:11,fontWeight:'600'},track:{height:5,backgroundColor:'#dce4e8',marginTop:9},fill:{height:5,backgroundColor:'#092b45'},certificate:{borderWidth:1,borderColor:'#cfe0d7',padding:17,marginBottom:16},certificateTitle:{color:'#315846',fontSize:14,fontWeight:'700'},certificateCode:{color:'#173246',fontSize:19,fontWeight:'600',letterSpacing:1.2,marginTop:6},certificateCopy:{color:'#65766e',fontSize:11,lineHeight:17,marginTop:6},tabs:{gap:7,paddingBottom:16},tab:{minWidth:42,paddingHorizontal:12,paddingVertical:10,borderWidth:1,borderColor:'#dce3e7',alignItems:'center'},tabActive:{backgroundColor:'#092b45',borderColor:'#092b45'},tabDisabled:{opacity:.35},tabText:{color:'#526976',fontSize:10,fontWeight:'600'},tabTextActive:{color:'#fff'},card:{borderWidth:1,borderColor:'#dce3e7',padding:19,marginBottom:18},moduleLabel:{color:'#71808a',fontSize:8,letterSpacing:1.7,marginBottom:7},sectionTitle:{color:'#173246',fontSize:20,fontWeight:'600',marginBottom:12},body:{color:'#526976',fontSize:13,lineHeight:22},primary:{backgroundColor:'#092b45',paddingVertical:14,alignItems:'center',marginTop:18},primaryText:{color:'#fff',fontSize:11,fontWeight:'700'},question:{marginBottom:20},questionText:{color:'#173246',fontSize:13,lineHeight:19,fontWeight:'600',marginBottom:10},option:{borderWidth:1,borderColor:'#dce3e7',padding:12,marginBottom:7},optionSelected:{backgroundColor:'#092b45',borderColor:'#092b45'},optionText:{color:'#526976',fontSize:11,lineHeight:17},optionTextSelected:{color:'#fff'},score:{color:'#71808a',fontSize:11,textAlign:'center',marginTop:10},error:{color:'#9b2c2c',fontSize:12,marginBottom:14}})
