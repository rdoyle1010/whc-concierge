import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

type Role = 'talent' | 'employer'
type Step = { number:string; title:string; copy:string; action?:string; href?: any }

const talentSteps: Step[] = [
  { number:'01', title:'Build your profile', copy:'Add your CV, experience, skills, availability, location and preferences. Use Stealth Mode if you do not want your current employer to see you.', action:'Open profile', href:'/profile' },
  { number:'02', title:'See your matches', copy:'Browse permanent roles, Residency and Agency work. Your match is based on your actual profile, not just a job title.', action:'Browse jobs', href:'/jobs' },
  { number:'03', title:'Apply and track', copy:'Apply from one place, save roles for later and withdraw interest if your plans change.', action:'Applications', href:'/applications' },
  { number:'04', title:'Prepare properly', copy:'Interview Ready combines your CV, the job description and employer information to help you understand what to talk about and where questions may be harder.', action:'Interview Ready', href:'/interview-ready' },
  { number:'05', title:'Build your reputation', copy:'Completed work can lead to verified ratings, reviews and employer references that strengthen your profile over time.', action:'Reputation', href:'/reputation' },
  { number:'06', title:'Keep developing', copy:'Use Talent House Academy courses, assessments and certificates to add visible professional development to your profile.', action:'Academy', href:'/academy' },
]

const employerSteps: Step[] = [
  { number:'01', title:'Complete your property profile', copy:'Add photos, spa details, location, travel information and what makes working at your property different.', action:'Property profile', href:'/property-profile' },
  { number:'02', title:'Post the complete role', copy:'Add the real job description, requirements, benefits and working pattern so Talent can properly understand the opportunity.', action:'Jobs', href:'/jobs' },
  { number:'03', title:'Review matched Talent', copy:'See applications and matched professionals in one place, then message the people you want to progress.', action:'Applications', href:'/applications' },
  { number:'04', title:'Use Agency when you need cover', copy:'Find flexible spa professionals based on availability, location and travel practicality, then manage bookings from the same platform.', action:'Agency bookings', href:'/agency' },
  { number:'05', title:'Build your employer reputation', copy:'Your property can collect verified ratings and reviews too. Talent should be able to see what it is genuinely like to work with you.', action:'Reputation', href:'/reputation' },
  { number:'06', title:'Keep everything together', copy:'Jobs, applications, messages, billing and property information all use the same live Talent House account as the website.', action:'Messages', href:'/messages' },
]

export default function TourScreen(){
  const [role,setRole]=useState<Role>('talent')

  useEffect(()=>{void loadRole()},[])
  async function loadRole(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user) return
    const {data}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
    setRole(data?.role==='employer'?'employer':'talent')
  }

  const steps=role==='employer'?employerSteps:talentSteps

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>START HERE</Text>
    <Text style={styles.title}>{role==='employer'?'A clearer route to the right people.':'A clearer route to your next move.'}</Text>
    <Text style={styles.intro}>{role==='employer'?'Six simple steps from property profile to hiring, Agency cover and employer reputation.':'Six simple steps from profile setup to better matches, stronger applications and a professional reputation that grows with you.'}</Text>

    <View style={styles.banner}>
      <Text style={styles.bannerEyebrow}>ONE LIVE ACCOUNT</Text>
      <Text style={styles.bannerTitle}>App + website stay in sync.</Text>
      <Text style={styles.bannerCopy}>Anything you update uses the same Talent House account, so use whichever is easier at the time.</Text>
    </View>

    <View style={styles.steps}>{steps.map(step=><View key={step.number} style={styles.step}>
      <View style={styles.numberWrap}><Text style={styles.number}>{step.number}</Text></View>
      <View style={styles.stepBody}>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepCopy}>{step.copy}</Text>
        {step.href?<Pressable onPress={()=>router.push(step.href)} style={styles.actionRow}><Text style={styles.action}>{step.action}</Text><Text style={styles.arrow}>→</Text></Pressable>:null}
      </View>
    </View>)}</View>

    <View style={styles.footer}>
      <Text style={styles.footerEyebrow}>COME BACK ANY TIME</Text>
      <Text style={styles.footerTitle}>You do not need to remember all of this.</Text>
      <Text style={styles.footerCopy}>Start here remains available from Home whenever you need a quick reminder of where something lives.</Text>
    </View>
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:112},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif,maxWidth:360},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,maxWidth:365,fontFamily:type.sans},
  banner:{backgroundColor:palette.ink,padding:18,borderRadius:radius.large,marginBottom:18},
  bannerEyebrow:{color:'#D8E0E5',fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
  bannerTitle:{color:palette.paper,fontSize:19,lineHeight:24,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  bannerCopy:{color:'#E6ECEF',fontSize:10.5,lineHeight:17,marginTop:6,fontFamily:type.sans},
  steps:{borderTopWidth:1,borderTopColor:palette.line},
  step:{flexDirection:'row',borderBottomWidth:1,borderBottomColor:palette.line,paddingVertical:18,gap:13},
  numberWrap:{width:30,paddingTop:2},
  number:{color:palette.quiet,fontSize:8.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  stepBody:{flex:1},
  stepTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif},
  stepCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:6,fontFamily:type.sans},
  actionRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:11},
  action:{color:palette.ink,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  arrow:{color:palette.ink,fontSize:15},
  footer:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginTop:22},
  footerEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  footerTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  footerCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
})
