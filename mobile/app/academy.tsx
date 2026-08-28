import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

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
  const completed=enrollments.filter(e=>e.completed_at).length

  async function checkout(product:'course'|'bundle',courseSlug?:string){
    setBusy(product==='bundle'?'__bundle__':courseSlug||'');setError('')
    try{
      const headers=await authHeaders()
      const res=await fetch(`${WEB_URL}/api/mobile/academy/checkout`,{method:'POST',headers:{...headers,'Content-Type':'application/json'},body:JSON.stringify({product,courseSlug,source:'app',returnToApp:true})})
      const j=await res.json()
      if(!res.ok||!j.url)throw new Error(j.error||'Could not start payment.')
      const saving=j.discountPct>0?` Your ${j.discountPct}% member Academy discount has been applied.`:''
      Alert.alert('Academy checkout',`You will pay £${(j.amountPence/100).toFixed(2)}.${saving}`,[{text:'Cancel',style:'cancel',onPress:()=>setBusy('')},{text:'Continue to Stripe',onPress:()=>Linking.openURL(j.url)}])
    }catch(e:any){setError(e.message||'Could not start payment.');setBusy('')}
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>DEVELOPMENT</Text>
    <Text style={styles.title}>WHC Academy</Text>
    <Text style={styles.intro}>Practical spa and wellness learning with progress tracking, final assessment, certificates and profile badges when you pass.</Text>

    {discount>0?<View style={styles.member}><Text style={styles.memberEyebrow}>MEMBER BENEFIT</Text><Text style={styles.memberTitle}>{discount}% Academy discount active</Text><Text style={styles.memberCopy}>Your reduced price is calculated securely at checkout.</Text></View>:null}
    {completed>0?<View style={styles.success}><Text style={styles.successEyebrow}>PROGRESS</Text><Text style={styles.successTitle}>{completed} certificate{completed===1?'':'s'} earned</Text><Text style={styles.successCopy}>Completed Academy badges are visible on your professional profile.</Text></View>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}
    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:null}

    {!loading&&core.length>0&&coreOwned<core.length?<View style={styles.bundle}>
      <Text style={styles.bundleEyebrow}>CORE CURRICULUM</Text>
      <Text style={styles.bundleTitle}>All {core.length} core courses</Text>
      <Text style={styles.bundleCopy}>£79 before your membership discount. Certificates and profile badges included.</Text>
      <Pressable disabled={busy==='__bundle__'} onPress={()=>checkout('bundle')} style={styles.bundleButton}><Text style={styles.bundleButtonText}>{busy==='__bundle__'?'Opening checkout…':'Get the core bundle'}</Text></Pressable>
    </View>:null}

    {categories.map(category=><View key={category} style={styles.section}>
      <Text style={styles.sectionEyebrow}>{category.toUpperCase()}</Text>
      {courses.filter(c=>c.category===category).map(course=>{
        const enr=enrollmentMap.get(course.slug)
        const done=Boolean(enr?.completed_at)
        const lessonsDone=Object.keys(enr?.progress||{}).length
        const base=Number(course.price??1000)
        return <View key={course.slug} style={[styles.card,done&&styles.doneCard]}>
          <View style={styles.cardTop}>
            <View style={{flex:1}}><Text style={styles.courseTitle}>{course.title}</Text><Text style={styles.tagline}>{course.tagline}</Text></View>
            {done?<View style={styles.badge}><Text style={styles.badgeText}>CERTIFIED</Text></View>:enr?<View style={styles.badge}><Text style={styles.badgeText}>YOURS</Text></View>:null}
          </View>
          <Text style={styles.meta}>{course.lessons?.length||0} modules · ~{course.minutes} min · {course.quiz?.length||0} assessment questions</Text>
          {enr?<Pressable onPress={()=>router.push({pathname:'/academy-course/[slug]',params:{slug:course.slug}})} style={styles.primary}><Text style={styles.primaryText}>{done?'Review course':lessonsDone>0?`Continue ${lessonsDone}/${course.lessons.length}`:'Start course'}</Text></Pressable>:<Pressable disabled={busy===course.slug} onPress={()=>checkout('course',course.slug)} style={styles.secondary}><Text style={styles.secondaryText}>{busy===course.slug?'Opening checkout…':`Enrol · £${(base/100).toFixed(base%100?2:0)}${discount?` before ${discount}% discount`:''}`}</Text></Pressable>}
        </View>
      })}
    </View>)}

    <View style={styles.footBox}><Text style={styles.footEyebrow}>IMPORTANT</Text><Text style={styles.foot}>WHC Academy certificates evidence completion and knowledge assessment. They do not replace accredited qualifications, licences or insurance requirements.</Text></View>
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:112},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
  member:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,marginBottom:10,borderRadius:radius.large},
  memberEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  memberTitle:{color:palette.inkStrong,fontSize:16,lineHeight:21,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  memberCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  success:{backgroundColor:palette.stoneDeep,padding:16,marginBottom:10,borderRadius:radius.large},
  successEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  successTitle:{color:palette.inkStrong,fontSize:16,lineHeight:21,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  successCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:16,fontFamily:type.sans},
  bundle:{backgroundColor:palette.ink,padding:19,marginBottom:26,borderRadius:radius.large},
  bundleEyebrow:{color:'#D8E0E5',fontSize:7.5,letterSpacing:1.5,fontWeight:'700',fontFamily:type.sans},
  bundleTitle:{color:palette.paper,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginTop:6},
  bundleCopy:{color:'#E3EAED',fontSize:10.5,lineHeight:17,marginTop:6,fontFamily:type.sans},
  bundleButton:{backgroundColor:palette.paper,paddingVertical:13,alignItems:'center',marginTop:15,borderRadius:radius.medium},
  bundleButtonText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  section:{marginBottom:26,gap:9},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.7,fontWeight:'700',marginBottom:2,fontFamily:type.sans},
  card:{borderWidth:1,borderColor:palette.line,padding:17,backgroundColor:palette.paper,borderRadius:radius.large},
  doneCard:{borderColor:palette.lineStrong},
  cardTop:{flexDirection:'row',gap:10,justifyContent:'space-between',alignItems:'flex-start'},
  courseTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif},
  tagline:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
  badge:{backgroundColor:palette.stoneDeep,paddingHorizontal:7,paddingVertical:4,borderRadius:999},
  badgeText:{color:palette.ink,fontSize:7.5,letterSpacing:.8,fontWeight:'700',fontFamily:type.sans},
  meta:{color:palette.quiet,fontSize:9.5,lineHeight:15,marginTop:11,marginBottom:13,fontFamily:type.sans},
  primary:{backgroundColor:palette.ink,paddingVertical:13,alignItems:'center',borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  secondary:{borderWidth:1,borderColor:palette.lineStrong,paddingVertical:12,alignItems:'center',borderRadius:radius.medium},
  secondaryText:{color:palette.ink,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  footBox:{backgroundColor:palette.stoneDeep,padding:15,borderRadius:radius.large,marginTop:4},
  footEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  foot:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:5,fontFamily:type.sans},
})
