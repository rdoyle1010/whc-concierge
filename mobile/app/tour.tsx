import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer'

type Step = { number:string; title:string; copy:string; action?:string; href?: any }

const talentSteps: Step[] = [
  { number:'01', title:'Build your profile', copy:'Add your CV, experience, skills, availability, location and preferences. Use Stealth Mode if you do not want your current employer to see you.', action:'Open profile', href:'/profile' },
  { number:'02', title:'See your matches', copy:'Browse permanent roles, residencies and Agency work. Your match is based on your actual profile, not just a job title.', action:'Browse jobs', href:'/jobs' },
  { number:'03', title:'Apply and track', copy:'Apply from one place, save roles for later and withdraw interest if your plans change.', action:'Applications', href:'/applications' },
  { number:'04', title:'Prepare properly', copy:'Interview Ready combines your CV, the job description and employer information to help you understand what to talk about and where questions may be harder.', action:'Interview Ready', href:'/interview-ready' },
  { number:'05', title:'Build your reputation', copy:'Completed work can lead to verified ratings, reviews and employer references that strengthen your profile over time.', action:'Reputation', href:'/reputation' },
  { number:'06', title:'Keep developing', copy:'Use WHC Academy courses, assessments and certificates to add visible professional development to your profile.', action:'Academy', href:'/academy' },
]

const employerSteps: Step[] = [
  { number:'01', title:'Complete your property profile', copy:'Add photos, spa details, location, travel information and what makes working at your property different.', action:'Property profile', href:'/property-profile' },
  { number:'02', title:'Post the complete role', copy:'Add the real job description, requirements, benefits and working pattern so Talent can properly understand the opportunity.', action:'Jobs', href:'/jobs' },
  { number:'03', title:'Review matched Talent', copy:'See applications and matched professionals in one place, then message the people you want to progress.', action:'Applications', href:'/applications' },
  { number:'04', title:'Use Agency when you need cover', copy:'Find flexible spa professionals based on availability, location and travel practicality, then manage bookings from the same platform.', action:'Agency bookings', href:'/agency' },
  { number:'05', title:'Build your employer reputation', copy:'Your property can collect verified ratings and reviews too. Talent should be able to see what it is genuinely like to work with you.', action:'Reputation', href:'/reputation' },
  { number:'06', title:'Keep everything together', copy:'Jobs, applications, messages, billing and property information all use the same live Wellness House account as the website.', action:'Messages', href:'/messages' },
]

export default function TourScreen(){
  const [role,setRole]=useState<Role>('talent')

  useEffect(()=>{loadRole()},[])
  async function loadRole(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user) return
    const {data}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
    setRole(data?.role==='employer'?'employer':'talent')
  }

  const steps=role==='employer'?employerSteps:talentSteps

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>60-SECOND TOUR</Text>
    <Text style={styles.title}>How to use Wellness House.</Text>
    <Text style={styles.intro}>{role==='employer'?'The quickest route from property profile to hiring, Agency cover and reputation.':'The quickest route from profile to better matches, stronger applications and a reputation that grows with you.'}</Text>

    <View style={styles.banner}><Text style={styles.bannerTitle}>App + website = one account</Text><Text style={styles.bannerCopy}>Anything you update uses the same live Wellness House platform. Use whichever is easier at the time.</Text></View>

    {steps.map(step=><View key={step.number} style={styles.step}>
      <Text style={styles.number}>{step.number}</Text>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepCopy}>{step.copy}</Text>
        {step.href?<Pressable onPress={()=>router.push(step.href)}><Text style={styles.action}>{step.action} →</Text></Pressable>:null}
      </View>
    </View>)}

    <View style={styles.footer}><Text style={styles.footerTitle}>You do not need to remember all of this.</Text><Text style={styles.footerCopy}>Come back to Start here from your Home screen whenever you need it.</Text></View>
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:40,paddingBottom:110},back:{color:'#66747c',fontSize:13,marginBottom:30},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:20},banner:{backgroundColor:'#092b45',padding:18,marginBottom:14},bannerTitle:{color:'#fff',fontSize:14,fontWeight:'600'},bannerCopy:{color:'#d6e0e5',fontSize:11,lineHeight:17,marginTop:5},step:{flexDirection:'row',borderBottomWidth:1,borderBottomColor:'#e4e9ec',paddingVertical:18,gap:14},number:{color:'#9aa7af',fontSize:10,letterSpacing:1.4,width:26},stepBody:{flex:1},stepTitle:{color:'#173246',fontSize:16,fontWeight:'600'},stepCopy:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:6},action:{color:'#092b45',fontSize:11,fontWeight:'700',marginTop:10},footer:{backgroundColor:'#f4f7f8',padding:18,marginTop:22},footerTitle:{color:'#173246',fontSize:13,fontWeight:'600'},footerCopy:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:5}})
