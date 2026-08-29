import { useCallback, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'

type Candidate={
  id:string;full_name?:string|null;headline?:string|null;role_level?:string|null;location?:string|null;bio?:string|null;profile_image_url?:string|null;review_score?:number|null;experience_years?:number|null;years_experience?:number|null;distance_miles?:number|null;matchScore?:number|null;matchLabel?:string|null;matchExplanation?:string|null;bestJob?:string|null;bestJobId?:string|null;interested?:boolean;mutual?:boolean;applicationId?:string|null;applicationStatus?:string|null;shortlisted?:boolean;is_featured?:boolean
}

export default function EmployerMatchScreen(){
  const [candidates,setCandidates]=useState<Candidate[]>([])
  const [liveRoleCount,setLiveRoleCount]=useState(0)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')

  useFocusEffect(useCallback(()=>{void load()},[]))

  async function api(options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}/api/mobile/employer-directory`,{...options,headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',...(options?.headers||{})}})
    const body=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(body?.error||'Could not load Talent.')
    return body
  }

  async function load(){
    setLoading(true);setError('')
    try{
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){router.replace('/login');return}
      const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
      if(profile?.role!=='employer'){router.replace('/home');return}
      const data=await api();setCandidates(data.candidates||[]);setLiveRoleCount(Number(data.live_role_count||0))
    }catch(e:any){setError(e?.message||'Could not load Talent.')}finally{setLoading(false)}
  }

  async function decide(candidate:Candidate,action:'left'|'right'|'save'|'unsave'){
    if(busy)return
    if(action==='right'&&!candidate.bestJobId){Alert.alert('Post a suitable live role first','Interested is role-specific. This professional does not currently have an eligible live role match.');return}
    setBusy(`${candidate.id}-${action}`);setError('')
    try{
      const result=await api({method:'POST',body:JSON.stringify({candidateId:candidate.id,jobId:candidate.bestJobId||null,action})})
      if(action==='left'){setCandidates(current=>current.filter(item=>item.id!==candidate.id));return}
      if(action==='save'||action==='unsave'){setCandidates(current=>current.map(item=>item.id===candidate.id?{...item,shortlisted:action==='save'}:item));return}
      setCandidates(current=>current.map(item=>item.id===candidate.id?{...item,interested:true,mutual:Boolean(result.matched),applicationId:result.applicationId||item.applicationId}:item))
      if(result.matched){
        Alert.alert("It's a match!",`${result.candidateName||candidate.full_name||'This professional'} has also submitted interest in ${result.jobTitle||candidate.bestJob}. Review the application before deciding the next recruitment step.`,[
          ...(result.applicationId?[{text:'Review application',onPress:()=>router.push({pathname:'/application/[id]',params:{id:result.applicationId}})}]:[]),
          {text:'Keep browsing',style:'cancel'},
        ] as any)
      }else Alert.alert('Interest saved',`Your interest in ${candidate.full_name||'this professional'} for ${candidate.bestJob||'this role'} has been recorded. You can keep browsing.`)
    }catch(e:any){setError(e?.message||'Could not save your decision.')}finally{setBusy('')}
  }

  function candidateCard(candidate:Candidate){
    const experience=Number(candidate.experience_years||candidate.years_experience||0)
    const score=Number(candidate.matchScore||0)
    return <View key={candidate.id} style={[styles.card,candidate.is_featured&&styles.featuredCard]}>
      {candidate.is_featured?<Text style={styles.featured}>★ FEATURED</Text>:null}
      <View style={styles.personRow}>
        {candidate.profile_image_url?<Image source={{uri:candidate.profile_image_url}} style={styles.photo}/>:<View style={styles.photoPlaceholder}><Text style={styles.initial}>{(candidate.full_name||'T').slice(0,1).toUpperCase()}</Text></View>}
        <View style={{flex:1}}><Text style={styles.name}>{candidate.full_name||'Wellness professional'}</Text><Text style={styles.headline}>{candidate.headline||candidate.role_level||'Spa & wellness professional'}</Text></View>
        {candidate.bestJobId?<View style={styles.scoreBox}><Text style={styles.score}>{score}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View>:null}
      </View>
      <Text style={styles.meta}>{[candidate.location,experience?`${experience} yrs experience`:null,candidate.distance_miles!=null?`${Math.round(Number(candidate.distance_miles))} miles away`:null].filter(Boolean).join(' · ')}</Text>
      {candidate.bestJob?<View style={styles.bestRole}><Text style={styles.bestEyebrow}>WHY THEY MATCH THIS ROLE</Text><Text style={styles.bestTitle}>{candidate.bestJob}{candidate.matchScore!=null?` · ${candidate.matchScore}%`:''}</Text>{candidate.matchLabel?<Text style={styles.matchLabel}>{candidate.matchLabel}</Text>:null}{candidate.matchExplanation?<Text style={styles.bestCopy}>{candidate.matchExplanation}</Text>:null}</View>:<Text style={styles.noRole}>Browse and save this professional. Post a compatible live role to unlock Interested.</Text>}
      {candidate.bio?<Text numberOfLines={3} style={styles.bio}>{candidate.bio}</Text>:null}
      <View style={styles.actions}>
        <Pressable disabled={!!busy} onPress={()=>decide(candidate,'left')} style={styles.pass}><Text style={styles.passText}>{busy===`${candidate.id}-left`?'Saving…':'Pass'}</Text></Pressable>
        <Pressable disabled={!!busy} onPress={()=>decide(candidate,candidate.shortlisted?'unsave':'save')} style={[styles.save,candidate.shortlisted&&styles.saveActive]}><Text style={[styles.saveText,candidate.shortlisted&&styles.saveTextActive]}>{busy.startsWith(`${candidate.id}-`)?'…':candidate.shortlisted?'Saved':'Save'}</Text></Pressable>
        <Pressable disabled={!!busy||!candidate.bestJobId||candidate.interested} onPress={()=>decide(candidate,'right')} style={[styles.interested,(!candidate.bestJobId||candidate.interested)&&styles.disabled]}><Text style={styles.interestedText}>{candidate.mutual?'Matched':candidate.interested?'Interested':'Interested'}</Text></Pressable>
      </View>
      {candidate.interested&&!candidate.mutual?<Text style={styles.interestNote}>Interest recorded for {candidate.bestJob}. Keep browsing; if Talent submits for the same role, it becomes a match.</Text>:null}
      {candidate.mutual&&candidate.applicationId?<Pressable onPress={()=>router.push({pathname:'/application/[id]',params:{id:candidate.applicationId}})} style={styles.matchRow}><View><Text style={styles.matchText}>Matched · Review application</Text><Text style={styles.matchSub}>Read the application before interview or decline.</Text></View><Text style={styles.matchArrow}>→</Text></Pressable>:null}
    </View>
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>TALENT DISCOVERY</Text><Text style={styles.title}>Browse candidates</Text>
    <Text style={styles.intro}>Pass, privately Save, or show role-specific Interest. A mutual match moves into application review before interview or messaging.</Text>
    {liveRoleCount===0&&!loading?<View style={styles.notice}><Text style={styles.noticeTitle}>Post a live role to unlock intelligent matching.</Text><Text style={styles.noticeCopy}>You can browse and save professionals now. Interested unlocks when a compatible live role exists.</Text><Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:'new'}})} style={styles.primary}><Text style={styles.primaryText}>Post a role</Text></Pressable></View>:null}
    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:null}{error?<Text style={styles.error}>{error}</Text>:null}
    {!loading&&!error&&candidates.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>New professionals are joining the platform.</Text><Text style={styles.emptyCopy}>There are no discoverable professionals currently available to this property. Passed profiles stay hidden.</Text></View>:null}
    {!loading&&!error&&candidates.length>0?<View style={styles.list}>{candidates.map(candidateCard)}</View>:null}
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:space.lg,paddingBottom:115},eyebrow:{color:palette.sage,fontSize:8,letterSpacing:2.1,fontWeight:'800',marginBottom:9},title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontFamily:type.serif,fontWeight:'400'},intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:20},notice:{backgroundColor:'#FDF8F0',borderWidth:1,borderColor:'#E8D8BC',borderRadius:radius.large,padding:17,marginBottom:18},noticeTitle:{color:palette.inkStrong,fontSize:16,fontWeight:'700'},noticeCopy:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:6},primary:{backgroundColor:palette.inkStrong,borderRadius:radius.medium,paddingVertical:12,alignItems:'center',marginTop:12},primaryText:{color:palette.paper,fontSize:11,fontWeight:'800'},list:{gap:13},card:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:17},featuredCard:{borderColor:'#D9C39A'},featured:{color:'#9A7436',fontSize:8,fontWeight:'800',letterSpacing:1.1,marginBottom:10},personRow:{flexDirection:'row',alignItems:'center',gap:11},photo:{width:58,height:58,borderRadius:29,backgroundColor:palette.stoneDeep},photoPlaceholder:{width:58,height:58,borderRadius:29,backgroundColor:palette.sageSoft,alignItems:'center',justifyContent:'center'},initial:{fontFamily:type.serif,fontSize:22,color:palette.inkStrong},name:{fontFamily:type.serif,fontSize:22,lineHeight:27,color:palette.inkStrong},headline:{fontSize:10.5,lineHeight:15,color:palette.muted,marginTop:2},scoreBox:{alignItems:'flex-end',minWidth:54},score:{fontSize:20,fontWeight:'800',color:palette.sage},scoreLabel:{fontSize:7,letterSpacing:1.2,fontWeight:'800',color:palette.quiet},meta:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:12},bestRole:{backgroundColor:'#FDF6EC',borderWidth:1,borderColor:'#EADFC9',borderRadius:radius.medium,padding:12,marginTop:12},bestEyebrow:{fontSize:7.5,letterSpacing:1.2,fontWeight:'800',color:'#9A7436'},bestTitle:{fontSize:11.5,fontWeight:'700',color:palette.inkStrong,marginTop:4},matchLabel:{fontSize:9,fontWeight:'800',color:palette.sage,marginTop:5},bestCopy:{fontSize:9.5,lineHeight:15,color:palette.muted,marginTop:4},noRole:{fontSize:10,lineHeight:16,color:palette.quiet,marginTop:12},bio:{fontSize:10.5,lineHeight:17,color:palette.text,marginTop:11},actions:{flexDirection:'row',gap:7,marginTop:15,paddingTop:13,borderTopWidth:1,borderTopColor:palette.line},pass:{flex:1,paddingVertical:12,alignItems:'center',borderRadius:radius.medium,backgroundColor:palette.stoneDeep},passText:{fontSize:10,fontWeight:'700',color:palette.muted},save:{flex:1,paddingVertical:12,alignItems:'center',borderRadius:radius.medium,backgroundColor:palette.stoneDeep},saveActive:{backgroundColor:'#FDF6EC'},saveText:{fontSize:10,fontWeight:'700',color:palette.muted},saveTextActive:{color:'#9A7436'},interested:{flex:1.45,paddingVertical:12,alignItems:'center',borderRadius:radius.medium,backgroundColor:palette.inkStrong},interestedText:{fontSize:10,fontWeight:'800',color:palette.paper},disabled:{opacity:.45},interestNote:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:9},matchRow:{backgroundColor:palette.sageSoft,borderRadius:radius.medium,padding:12,marginTop:10,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},matchText:{color:palette.sage,fontSize:10.5,fontWeight:'800'},matchSub:{color:palette.muted,fontSize:9,lineHeight:14,marginTop:2},matchArrow:{color:palette.sage,fontSize:15},empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:20},emptyTitle:{fontFamily:type.serif,fontSize:20,color:palette.inkStrong},emptyCopy:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:6},error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:12}
})