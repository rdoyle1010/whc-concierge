import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

type Course = { slug:string; title:string; tagline:string; category:string; minutes:number; price?:number; lessons:any[]; quiz:any[]; is_core?:boolean }
type Enrollment = { course_slug:string; paid_at?:string|null; completed_at?:string|null; progress?:Record<string,boolean>; certificate_code?:string|null }

export default function AcademyScreen(){
  const [courses,setCourses]=useState<Course[]>([])
  const [enrollments,setEnrollments]=useState<Enrollment[]>([])
  const [discount,setDiscount]=useState(0)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{load()},[])

  async function authHeaders(){
    const { data:{ session } }=await supabase.auth.getSession()
    return session?.access_token?{Authorization:`Bearer ${session.access_token}`}:{ }
  }

  async function load(){
    setLoading(true); setError('')
    try{
      const headers=await authHeaders()
      const [catalogRes,academyRes]=await Promise.all([
        fetch(`${WEB_URL}/api/academy/catalog`),
        fetch(`${WEB_URL}/api/academy`,{headers}),
      ])
      const c=await catalogRes.json(); const a=await academyRes.json()
      if(!catalogRes.ok) throw new Error(c.error||'Could not load Academy catalogue.')
      if(!academyRes.ok) throw new Error(a.error||'Could not load your Academy progress.')
      setCourses(c.courses||[]); setEnrollments(a.enrollments||[]); setDiscount(Number(a.academy_discount_pct||0))
    }catch(e:any){setError(e.message||'Could not load Academy.')}
    setLoading(false)
  }

  const enrollmentMap=useMemo(()=>new Map(enrollments.filter(e=>e.paid_at).map(e=>[e.course_slug,e])),[enrollments])
  const categories=useMemo(()=>Array.from(new Set(courses.map(c=>c.category))),[courses])
  const core=courses.filter(c=>c.is_core)
  const coreOwned=core.filter(c=>enrollmentMap.has(c.slug)).length
  const completed=enrollments.filter(e=>e.completed_at).length

  async function checkout(product:'course'|'bundle',courseSlug?:string){
    setBusy(product==='bundle'?'__bundle__':courseSlug||''); setError('')
    try{
      const headers=await authHeaders()
      const res=await fetch(`${WEB_URL}/api/mobile/academy/checkout`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({product,courseSlug})})
      const j=await res.json()
      if(!res.ok||!j.url) throw new Error(j.error||'Could not start payment.')
      const saving=j.discountPct>0?` Your ${j.discountPct}% member Academy discount has been applied.`:''
      Alert.alert('Academy checkout',`You will pay £${(j.amountPence/100).toFixed(2)}.${saving}`,[{text:'Cancel',style:'cancel',onPress:()=>setBusy('')},{text:'Continue to Stripe',onPress:()=>Linking.openURL(j.url)}])
    }catch(e:any){setError(e.message||'Could not start payment.');setBusy('')}
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>DEVELOPMENT</Text><Text style={styles.title}>WHC Academy</Text>
    <Text style={styles.intro}>Practical spa and wellness learning with progress tracking, final assessment, certificate and a profile badge when you pass.</Text>
    {discount>0?<View style={styles.member}><Text style={styles.memberTitle}>{discount}% Academy member discount active</Text><Text style={styles.memberCopy}>Your reduced price is calculated securely at checkout.</Text></View>:null}
    {completed>0?<View style={styles.success}><Text style={styles.successTitle}>{completed} certificate{completed===1?'':'s'} earned</Text><Text style={styles.successCopy}>Completed Academy badges are visible on your professional profile.</Text></View>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}
    {loading?<ActivityIndicator color="#092b45" style={{marginTop:30}}/>:null}
    {!loading&&core.length>0&&coreOwned<core.length?<View style={styles.bundle}><Text style={styles.bundleEyebrow}>CORE CURRICULUM</Text><Text style={styles.bundleTitle}>All {core.length} core courses</Text><Text style={styles.bundleCopy}>£79 before your membership discount. Certificates and profile badges included.</Text><Pressable disabled={busy==='__bundle__'} onPress={()=>checkout('bundle')} style={styles.primary}><Text style={styles.primaryText}>{busy==='__bundle__'?'Opening checkout…':'Get the core bundle'}</Text></Pressable></View>:null}
    {categories.map(category=><View key={category} style={styles.section}><Text style={styles.sectionTitle}>{category}</Text>{courses.filter(c=>c.category===category).map(course=>{
      const enr=enrollmentMap.get(course.slug); const done=Boolean(enr?.completed_at); const lessonsDone=Object.keys(enr?.progress||{}).length; const base=Number(course.price??1000)
      return <View key={course.slug} style={[styles.card,done&&styles.doneCard]}><View style={styles.cardTop}><View style={{flex:1}}><Text style={styles.courseTitle}>{course.title}</Text><Text style={styles.tagline}>{course.tagline}</Text></View>{done?<Text style={styles.certified}>CERTIFIED</Text>:enr?<Text style={styles.owned}>YOURS</Text>:null}</View><Text style={styles.meta}>{course.lessons?.length||0} modules · ~{course.minutes} min · {course.quiz?.length||0} assessment questions</Text>{enr?<Pressable onPress={()=>router.push({pathname:'/academy-course/[slug]',params:{slug:course.slug}})} style={styles.primary}><Text style={styles.primaryText}>{done?'Review course':lessonsDone>0?`Continue ${lessonsDone}/${course.lessons.length}`:'Start course'}</Text></Pressable>:<Pressable disabled={busy===course.slug} onPress={()=>checkout('course',course.slug)} style={styles.secondary}><Text style={styles.secondaryText}>{busy===course.slug?'Opening checkout…':`Enrol · £${(base/100).toFixed(base%100?2:0)}${discount?` before ${discount}% discount`:''}`}</Text></Pressable>}</View>
    })}</View>)}
    <Text style={styles.foot}>WHC Academy certificates evidence completion and knowledge assessment. They do not replace accredited qualifications, licences or insurance requirements.</Text>
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:50},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:22},member:{backgroundColor:'#f4f7f8',padding:16,marginBottom:12},memberTitle:{color:'#173246',fontSize:13,fontWeight:'700'},memberCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:4},success:{borderWidth:1,borderColor:'#d6e4dd',padding:16,marginBottom:12},successTitle:{color:'#254a39',fontSize:13,fontWeight:'700'},successCopy:{color:'#5f756a',fontSize:11,lineHeight:17,marginTop:4},error:{color:'#9b2c2c',fontSize:12,marginBottom:16},bundle:{backgroundColor:'#092b45',padding:20,marginBottom:26},bundleEyebrow:{color:'#dfe7eb',fontSize:9,letterSpacing:1.8},bundleTitle:{color:'#fff',fontSize:21,fontWeight:'600',marginTop:6},bundleCopy:{color:'#c8d2d7',fontSize:12,lineHeight:18,marginTop:6,marginBottom:16},section:{marginBottom:26,gap:10},sectionTitle:{color:'#71808a',fontSize:9,letterSpacing:1.7,textTransform:'uppercase',marginBottom:2},card:{borderWidth:1,borderColor:'#dce3e7',padding:18,backgroundColor:'#fff'},doneCard:{borderColor:'#c9ddd3'},cardTop:{flexDirection:'row',gap:10,justifyContent:'space-between'},courseTitle:{color:'#173246',fontSize:17,fontWeight:'600'},tagline:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:4},certified:{color:'#315846',fontSize:8,letterSpacing:1.1},owned:{color:'#092b45',fontSize:8,letterSpacing:1.1},meta:{color:'#71808a',fontSize:10,marginTop:12,marginBottom:14},primary:{backgroundColor:'#092b45',paddingVertical:14,alignItems:'center'},primaryText:{color:'#fff',fontSize:11,fontWeight:'700'},secondary:{borderWidth:1,borderColor:'#092b45',paddingVertical:13,alignItems:'center'},secondaryText:{color:'#092b45',fontSize:11,fontWeight:'700'},foot:{color:'#839097',fontSize:10,lineHeight:16,marginTop:4}})
