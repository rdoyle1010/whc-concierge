import { useEffect, useState } from 'react'
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talenthousecollective.co.uk'

type Detail={
  application:{id:string;status:string;match_score:number|null;cover_letter:string;submitted_at?:string|null}
  candidate:any
  job:any
  employer:any
}

function list(value:any){return Array.isArray(value)?value.filter(Boolean):[]}
function submitted(value?:string|null){if(!value)return'—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':date.toLocaleString('en-GB',{dateStyle:'medium',timeStyle:'short'})}

export default function EmployerApplicationReview(){
  const {id}=useLocalSearchParams<{id:string}>()
  const [detail,setDetail]=useState<Detail|null>(null)
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')

  useEffect(()=>{void load()},[id])

  async function load(){
    setLoading(true);setError('')
    try{
      const {data:{session}}=await supabase.auth.getSession()
      if(!session?.access_token||!id){router.replace('/login');return}
      const response=await fetch(`${WEB_URL}/api/employer/applications/detail?applicationId=${encodeURIComponent(id)}`,{headers:{Authorization:`Bearer ${session.access_token}`}})
      const body=await response.json().catch(()=>({}))
      if(!response.ok)throw new Error(body?.error||'Could not load this application.')
      setDetail(body as Detail)
    }catch(e:any){setError(e?.message||'Could not load this application.')}
    finally{setLoading(false)}
  }

  if(loading)return<View style={styles.center}><ActivityIndicator color={palette.ink}/></View>
  if(!detail)return<View style={styles.center}><Text style={styles.error}>{error||'Application not found.'}</Text><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Applications</Text></Pressable></View>

  const {application,candidate,job}=detail
  const experience=Number(candidate.experience_years||candidate.years_experience||0)
  const quals=list(candidate.qualifications)
  const brands=list(candidate.product_houses)
  const systems=list(candidate.systems_experience)
  const skills=list(candidate.business_skills)
  const awards=list(candidate.awards)

  return<ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Applications</Text></Pressable>
    <Text style={styles.eyebrow}>APPLICATION REVIEW</Text>
    <Text style={styles.pageTitle}>Review the person before the process.</Text>
    <Text style={styles.intro}>This is the application the candidate actually submitted. Review their profile, evidence and covering letter before moving into interviews or a decline decision.</Text>

    <View style={styles.hero}>
      <View style={styles.personRow}>
        {candidate.profile_image_url?<Image source={{uri:candidate.profile_image_url}} style={styles.photo}/>:<View style={styles.photoPlaceholder}><Text style={styles.initial}>{String(candidate.full_name||'T').slice(0,1)}</Text></View>}
        <View style={{flex:1}}><Text style={styles.name}>{candidate.full_name||'Candidate'}</Text><Text style={styles.headline}>{candidate.headline||candidate.role_level||'Spa & wellness professional'}</Text><Text style={styles.meta}>{[candidate.location,experience?`${experience} years experience`:null].filter(Boolean).join(' · ')}</Text></View>
        {application.match_score!=null?<View style={styles.scoreBox}><Text style={styles.score}>{application.match_score}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View>:null}
      </View>
      <View style={styles.roleBox}><Text style={styles.roleEyebrow}>APPLIED FOR</Text><Text style={styles.roleTitle}>{job.job_title||'Role'}</Text><Text style={styles.roleMeta}>{[job.location,job.salary_display_text,job.job_type].filter(Boolean).join(' · ')}</Text><Text style={styles.submitted}>Submitted {submitted(application.submitted_at)}</Text></View>
    </View>

    {candidate.bio?<View style={styles.section}><Text style={styles.sectionEyebrow}>PROFILE</Text><Text style={styles.sectionTitle}>Candidate overview</Text><Text style={styles.copy}>{candidate.bio}</Text></View>:null}

    <View style={styles.section}><Text style={styles.sectionEyebrow}>APPLICATION</Text><Text style={styles.sectionTitle}>Covering letter</Text>{application.cover_letter?<Text style={styles.letter}>{application.cover_letter}</Text>:<Text style={styles.emptyCopy}>No covering letter was submitted.</Text>}</View>

    {candidate.cv_signed_url?<Pressable onPress={()=>Linking.openURL(candidate.cv_signed_url)} style={styles.cvButton}><View><Text style={styles.cvEyebrow}>CV</Text><Text style={styles.cvTitle}>Open candidate CV</Text></View><Text style={styles.arrow}>→</Text></Pressable>:null}

    <View style={styles.section}><Text style={styles.sectionEyebrow}>CAREER EVIDENCE</Text><Text style={styles.sectionTitle}>What they bring</Text>
      <View style={styles.metrics}><View style={styles.metric}><Text style={styles.metricValue}>{experience||'—'}</Text><Text style={styles.metricLabel}>years experience</Text></View><View style={styles.metric}><Text style={styles.metricValue}>{candidate.review_score?Number(candidate.review_score).toFixed(1):'—'}</Text><Text style={styles.metricLabel}>verified rating</Text></View></View>
      {candidate.career_evidence?<Text style={styles.copy}>{candidate.career_evidence}</Text>:null}
      {awards.length?<TagBlock title="Awards" values={awards}/>:null}
      {quals.length?<TagBlock title="Qualifications" values={quals}/>:null}
      {brands.length?<TagBlock title="Product houses" values={brands}/>:null}
      {systems.length?<TagBlock title="Systems" values={systems}/>:null}
      {skills.length?<TagBlock title="Business skills" values={skills}/>:null}
    </View>

    <View style={styles.processBox}><Text style={styles.processEyebrow}>NEXT</Text><Text style={styles.processTitle}>Ready to make a recruitment decision?</Text><Text style={styles.processCopy}>Continue to the recruitment process to invite the candidate to interview or decide not to progress them.</Text><Pressable onPress={()=>router.push({pathname:'/application/[id]',params:{id:application.id}})} style={styles.primary}><Text style={styles.primaryText}>Continue to recruitment process</Text></Pressable></View>
  </ScrollView>
}

function TagBlock({title,values}:{title:string;values:any[]}){return<View style={styles.tagBlock}><Text style={styles.tagTitle}>{title}</Text><View style={styles.tags}>{values.map((value,index)=><View key={`${String(value)}-${index}`} style={styles.tag}><Text style={styles.tagText}>{String(value)}</Text></View>)}</View></View>}

const styles=StyleSheet.create({
  center:{flex:1,backgroundColor:palette.stone,alignItems:'center',justifyContent:'center',padding:24},scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:20,paddingBottom:130},back:{color:palette.muted,fontSize:13,marginBottom:30},eyebrow:{fontSize:8,letterSpacing:2.2,color:palette.sage,fontWeight:'800'},pageTitle:{fontFamily:type.serif,fontSize:34,lineHeight:40,color:palette.inkStrong,marginTop:8},intro:{color:palette.muted,fontSize:12.5,lineHeight:20,marginTop:10,marginBottom:20},
  hero:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:18},personRow:{flexDirection:'row',gap:12,alignItems:'center'},photo:{width:62,height:62,borderRadius:31,backgroundColor:palette.stoneDeep},photoPlaceholder:{width:62,height:62,borderRadius:31,backgroundColor:palette.sageSoft,alignItems:'center',justifyContent:'center'},initial:{fontFamily:type.serif,fontSize:24,color:palette.inkStrong},name:{fontFamily:type.serif,fontSize:25,lineHeight:29,color:palette.inkStrong},headline:{fontSize:11,lineHeight:16,color:palette.muted,marginTop:3},meta:{fontSize:9.5,color:palette.quiet,marginTop:5},scoreBox:{alignItems:'flex-end'},score:{fontSize:22,fontWeight:'800',color:palette.sage},scoreLabel:{fontSize:7,letterSpacing:1.2,fontWeight:'800',color:palette.quiet},roleBox:{borderTopWidth:1,borderTopColor:palette.line,marginTop:16,paddingTop:14},roleEyebrow:{fontSize:7.5,letterSpacing:1.4,fontWeight:'800',color:'#9A7436'},roleTitle:{fontSize:16,fontWeight:'700',color:palette.inkStrong,marginTop:4},roleMeta:{fontSize:10.5,color:palette.muted,marginTop:4},submitted:{fontSize:9.5,color:palette.quiet,marginTop:7},
  section:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:18,marginTop:14},sectionEyebrow:{fontSize:8,letterSpacing:1.6,fontWeight:'800',color:palette.sage},sectionTitle:{fontFamily:type.serif,fontSize:24,lineHeight:29,color:palette.inkStrong,marginTop:6},copy:{fontSize:11.5,lineHeight:19,color:palette.text,marginTop:10},letter:{fontSize:11.5,lineHeight:20,color:palette.text,marginTop:12},emptyCopy:{fontSize:11,color:palette.muted,marginTop:10},
  cvButton:{backgroundColor:palette.inkStrong,borderRadius:radius.large,padding:17,marginTop:14,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},cvEyebrow:{fontSize:7.5,letterSpacing:1.4,fontWeight:'800',color:'rgba(255,255,255,.55)'},cvTitle:{fontSize:13,fontWeight:'800',color:palette.paper,marginTop:3},arrow:{fontSize:22,color:palette.paper},metrics:{flexDirection:'row',gap:10,marginTop:14,marginBottom:4},metric:{flex:1,backgroundColor:palette.stoneDeep,borderRadius:radius.medium,padding:13},metricValue:{fontFamily:type.serif,fontSize:24,color:palette.inkStrong},metricLabel:{fontSize:8.5,color:palette.muted,marginTop:2},tagBlock:{marginTop:15},tagTitle:{fontSize:9.5,fontWeight:'800',color:palette.inkStrong,marginBottom:7},tags:{flexDirection:'row',flexWrap:'wrap',gap:6},tag:{backgroundColor:palette.stoneDeep,borderRadius:999,paddingHorizontal:9,paddingVertical:6},tagText:{fontSize:8.5,color:palette.text},
  processBox:{backgroundColor:palette.sageSoft,borderRadius:radius.large,padding:18,marginTop:16},processEyebrow:{fontSize:8,letterSpacing:1.6,fontWeight:'800',color:palette.sage},processTitle:{fontFamily:type.serif,fontSize:24,lineHeight:29,color:palette.inkStrong,marginTop:5},processCopy:{fontSize:11,lineHeight:18,color:palette.muted,marginTop:7},primary:{backgroundColor:palette.inkStrong,borderRadius:radius.medium,paddingVertical:14,alignItems:'center',marginTop:14},primaryText:{color:palette.paper,fontSize:11,fontWeight:'800'},error:{color:palette.danger,fontSize:11,lineHeight:17}
})