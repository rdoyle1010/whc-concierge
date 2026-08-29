import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'

type Job={id:string;job_title:string;location?:string|null;job_type?:string|null}
type Candidate={
  id:string;full_name?:string|null;headline?:string|null;role_level?:string|null;location?:string|null;bio?:string|null;
  profile_image_url?:string|null;review_score?:number|null;experience_years?:number|null;years_experience?:number|null;
  match_score?:number|null;match_label?:string|null;match_explanation?:string[]|null;distance_miles?:number|null;
  application_id?:string|null;application_status?:string|null;mutual?:boolean;interest_status?:'waiting'|'matched'|'declined'|string|null
}
type ViewMode='discover'|'interested'

export default function EmployerMatchScreen(){
  const [jobs,setJobs]=useState<Job[]>([])
  const [jobId,setJobId]=useState('')
  const [candidates,setCandidates]=useState<Candidate[]>([])
  const [interested,setInterested]=useState<Candidate[]>([])
  const [eligibleCount,setEligibleCount]=useState(0)
  const [reviewedCount,setReviewedCount]=useState(0)
  const [view,setView]=useState<ViewMode>('discover')
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{void initialise()},[])
  useEffect(()=>{if(jobId)void loadRole(jobId)},[jobId])

  async function api(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}${path}`,{...options,headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',...(options?.headers||{})}})
    const body=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(body?.error||'Could not complete this request.')
    return body
  }

  function applyRoleData(data:any){
    setCandidates((data.candidates||[]) as Candidate[])
    setInterested((data.interested_candidates||[]) as Candidate[])
    setEligibleCount(Number(data.eligible_count||0))
    setReviewedCount(Number(data.reviewed_count||0))
  }

  async function initialise(){
    setLoading(true);setError('')
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){router.replace('/login');return}
    const {data:profile}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
    if(profile?.role!=='employer'){router.replace('/home');return}
    try{
      const data=await api('/api/mobile/employer-matches')
      const rows=(data.jobs||[]) as Job[]
      setJobs(rows)
      const selected=data.selected_job_id||rows[0]?.id||''
      setJobId(selected)
      applyRoleData(data)
    }catch(e:any){setError(e?.message||'Could not load Talent Match.')}
    finally{setLoading(false)}
  }

  async function loadRole(selected:string,showSpinner=true){
    if(showSpinner)setLoading(true)
    setError('')
    try{const data=await api(`/api/mobile/employer-matches?jobId=${encodeURIComponent(selected)}`);applyRoleData(data)}
    catch(e:any){setError(e?.message||'Could not load Talent Match.')}
    finally{if(showSpinner)setLoading(false)}
  }

  const current=candidates[0]||null
  const selectedJob=useMemo(()=>jobs.find(job=>job.id===jobId)||null,[jobs,jobId])
  const waitingCount=interested.filter(item=>item.interest_status==='waiting').length
  const mutualCount=interested.filter(item=>item.interest_status==='matched').length

  async function decide(candidate:Candidate,action:'left'|'right'){
    if(!jobId||busy)return
    setBusy(candidate.id);setError('')
    try{
      const result=await api('/api/mobile/employer-matches',{method:'POST',body:JSON.stringify({candidateId:candidate.id,jobId,action})})
      await loadRole(jobId,false)
      if(action==='right'){
        if(result.matched&&result.applicationId){
          Alert.alert('Mutual interest',`${candidate.full_name||'This professional'} is interested too. Their recruitment journey is ready.`,[
            {text:'Open application',onPress:()=>router.push({pathname:'/application/[id]',params:{id:result.applicationId}})},
            {text:'Later',style:'cancel'},
          ])
          setView('interested')
        }else if(result.declined){
          Alert.alert('Interest saved','This professional previously passed this role. Your interest is recorded, but they are currently not progressing.')
          setView('interested')
        }else{
          Alert.alert('Interest sent',`${candidate.full_name||'This professional'} will see your interest in their Jobs area and can accept or decline it.`)
          setView('interested')
        }
      }
    }catch(e:any){setError(e?.message||'Could not save your decision.')}
    finally{setBusy('')}
  }

  async function withdrawInterest(candidate:Candidate){
    if(!jobId||busy)return
    setBusy(candidate.id);setError('')
    try{
      await api(`/api/mobile/employer-matches?jobId=${encodeURIComponent(jobId)}&candidateId=${encodeURIComponent(candidate.id)}`,{method:'DELETE'})
      await loadRole(jobId,false)
      Alert.alert('Interest withdrawn','This professional has been returned to your discovery pool for this role.')
    }catch(e:any){setError(e?.message||'Could not withdraw your interest.')}
    finally{setBusy('')}
  }

  async function reviewPassedAgain(){
    if(!jobId||busy)return
    setBusy('restore');setError('')
    try{await api(`/api/mobile/employer-matches?jobId=${encodeURIComponent(jobId)}`,{method:'DELETE'});await loadRole(jobId,false)}
    catch(e:any){setError(e?.message||'Could not restore passed professionals.')}
    finally{setBusy('')}
  }

  function personHeader(candidate:Candidate,compact=false){
    return <View style={styles.personRow}>
      {candidate.profile_image_url?<Image source={{uri:candidate.profile_image_url}} style={compact?styles.avatar:styles.photo}/>:<View style={compact?styles.avatarPlaceholder:styles.photoPlaceholder}><Text style={styles.initial}>{(candidate.full_name||'T').slice(0,1).toUpperCase()}</Text></View>}
      <View style={{flex:1}}><Text style={compact?styles.smallName:styles.name}>{candidate.full_name||'Wellness professional'}</Text><Text style={styles.headline}>{candidate.headline||candidate.role_level||'Spa & wellness professional'}</Text></View>
      <View style={styles.scoreBox}><Text style={styles.score}>{Number(candidate.match_score||0)}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View>
    </View>
  }

  function discoverCard(candidate:Candidate){
    const experience=Number(candidate.experience_years||candidate.years_experience||0)
    return <View style={styles.card}>
      {personHeader(candidate)}
      <Text style={styles.meta}>{[candidate.location,experience?`${experience} yrs experience`:null,candidate.distance_miles!=null?`${Math.round(Number(candidate.distance_miles))} miles away`:null].filter(Boolean).join(' · ')}</Text>
      {candidate.review_score?<Text style={styles.rating}>{Number(candidate.review_score).toFixed(1)} ★ verified reputation</Text>:null}
      {candidate.bio?<Text numberOfLines={4} style={styles.bio}>{candidate.bio}</Text>:null}
      {Array.isArray(candidate.match_explanation)&&candidate.match_explanation.length?<View style={styles.why}><Text style={styles.whyTitle}>Why this person fits</Text>{candidate.match_explanation.slice(0,3).map((item,index)=><Text key={`${item}-${index}`} style={styles.whyText}>• {item}</Text>)}</View>:null}
      <View style={styles.actions}>
        <Pressable disabled={!!busy} onPress={()=>decide(candidate,'left')} style={styles.passButton}><Text style={styles.passText}>{busy===candidate.id?'Saving…':'Pass'}</Text></Pressable>
        <Pressable disabled={!!busy} onPress={()=>decide(candidate,'right')} style={styles.interestedButton}><Text style={styles.interestedButtonText}>{busy===candidate.id?'Saving…':'Interested'}</Text></Pressable>
      </View>
    </View>
  }

  function interestedCard(candidate:Candidate){
    const status=candidate.interest_status||'waiting'
    const matched=status==='matched'
    const declined=status==='declined'
    return <View key={candidate.id} style={styles.savedCard}>
      {personHeader(candidate,true)}
      <View style={[styles.statusPill,matched&&styles.statusMutual,declined&&styles.statusDeclined]}><Text style={[styles.statusText,matched&&styles.statusMutualText,declined&&styles.statusDeclinedText]}>{matched?'MUTUAL INTEREST':declined?'TALENT DECLINED':'WAITING FOR TALENT RESPONSE'}</Text></View>
      <Text style={styles.savedCopy}>{matched?'You are both interested. Continue from the application below.':declined?'This professional has chosen not to progress with this role. You can remove them from Interested.':'Your interest is with the professional. They now have Accept and Decline controls in their Jobs area.'}</Text>
      {candidate.application_id?<Pressable onPress={()=>router.push({pathname:'/application/[id]',params:{id:candidate.application_id!}})} style={styles.openApplication}><Text style={styles.openApplicationText}>Open application</Text><Text style={styles.arrow}>→</Text></Pressable>:null}
      {!matched?<Pressable disabled={!!busy} onPress={()=>withdrawInterest(candidate)} style={styles.withdraw}><Text style={styles.withdrawText}>{busy===candidate.id?'Saving…':declined?'Remove from Interested':'Withdraw interest'}</Text></Pressable>:null}
    </View>
  }

  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>RECRUITMENT</Text><Text style={styles.title}>Talent Match</Text>
    <Text style={styles.intro}>Discover approved professionals for a live role, send interest and see exactly what happens next.</Text>

    <Text style={styles.label}>ROLE</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobRow}>
      {jobs.map(job=><Pressable key={job.id} onPress={()=>setJobId(job.id)} style={[styles.jobChip,job.id===jobId&&styles.jobChipActive]}><Text numberOfLines={2} style={[styles.jobChipText,job.id===jobId&&styles.jobChipTextActive]}>{job.job_title}</Text></Pressable>)}
    </ScrollView>

    {!jobs.length&&!loading?<View style={styles.empty}><Text style={styles.emptyTitle}>Post a live role first.</Text><Text style={styles.emptyCopy}>Talent Match works against a specific vacancy.</Text><Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:'new'}})} style={styles.primary}><Text style={styles.primaryText}>Post a role</Text></Pressable></View>:null}

    {selectedJob?<Text style={styles.roleContext}>{selectedJob.job_title}{selectedJob.location?` · ${selectedJob.location}`:''}</Text>:null}
    {jobs.length?<View style={styles.summaryRow}>
      <View style={styles.summaryBox}><Text style={styles.summaryNumber}>{eligibleCount}</Text><Text style={styles.summaryLabel}>eligible talent</Text></View>
      <View style={styles.summaryBox}><Text style={styles.summaryNumber}>{waitingCount}</Text><Text style={styles.summaryLabel}>waiting</Text></View>
      <View style={styles.summaryBox}><Text style={styles.summaryNumber}>{mutualCount}</Text><Text style={styles.summaryLabel}>mutual</Text></View>
    </View>:null}

    {jobs.length?<View style={styles.tabs}>
      <Pressable onPress={()=>setView('discover')} style={[styles.tab,view==='discover'&&styles.tabActive]}><Text style={[styles.tabText,view==='discover'&&styles.tabTextActive]}>Discover</Text></Pressable>
      <Pressable onPress={()=>setView('interested')} style={[styles.tab,view==='interested'&&styles.tabActive]}><Text style={[styles.tabText,view==='interested'&&styles.tabTextActive]}>Interested {interested.length?`(${interested.length})`:''}</Text></Pressable>
    </View>:null}

    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}

    {!loading&&!error&&view==='interested'&&interested.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No interested talent yet.</Text><Text style={styles.emptyCopy}>When you select Interested, that professional stays here and can respond from their app.</Text><Pressable onPress={()=>setView('discover')} style={styles.secondary}><Text style={styles.secondaryText}>Discover talent</Text></Pressable></View>:null}
    {!loading&&!error&&view==='interested'&&interested.length>0?<View style={styles.list}>{interested.map(interestedCard)}</View>:null}

    {!loading&&!error&&view==='discover'&&jobs.length>0&&!current?<View style={styles.empty}>
      <Text style={styles.emptyTitle}>{eligibleCount===0?'No approved visible talent currently fits this role.':'You have reviewed the current eligible talent.'}</Text>
      <Text style={styles.emptyCopy}>{eligibleCount===0?'Only approved, visible professionals who meet the role and travel rules can appear here. As more Talent join and are approved, they will appear automatically.':`${reviewedCount} professional${reviewedCount===1?' has':'s have'} already been reviewed for this role. Anyone you selected is safe in Interested.`}</Text>
      {reviewedCount>0?<Pressable onPress={reviewPassedAgain} style={styles.secondary}><Text style={styles.secondaryText}>{busy==='restore'?'Restoring…':'Review passed talent again'}</Text></Pressable>:null}
    </View>:null}

    {!loading&&!error&&view==='discover'&&current?<>{discoverCard(current)}<Text style={styles.help}>Pass removes this person from the current deck. Interested saves them and gives Talent a clear Accept or Decline choice.</Text></>:null}
  </ScrollView></View>
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:space.lg,paddingBottom:112,minHeight:'100%'},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,marginBottom:9,fontWeight:'700'},title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:18,maxWidth:360},label:{color:palette.quiet,fontSize:8,letterSpacing:1.5,marginBottom:8,fontWeight:'700'},
  jobRow:{gap:8,paddingBottom:14},jobChip:{borderWidth:1,borderColor:palette.lineStrong,backgroundColor:palette.paper,paddingHorizontal:12,paddingVertical:11,width:150,minHeight:58,borderRadius:radius.medium,justifyContent:'center'},jobChipActive:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},jobChipText:{color:palette.muted,fontSize:10,fontWeight:'600'},jobChipTextActive:{color:palette.paper},roleContext:{color:palette.text,fontSize:12,fontWeight:'700',marginBottom:11},
  summaryRow:{flexDirection:'row',gap:7,marginBottom:12},summaryBox:{flex:1,backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.medium,padding:10},summaryNumber:{color:palette.inkStrong,fontFamily:type.serif,fontSize:22},summaryLabel:{color:palette.quiet,fontSize:8,marginTop:2},
  tabs:{flexDirection:'row',backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.medium,padding:4,marginBottom:16},tab:{flex:1,paddingVertical:11,alignItems:'center',borderRadius:radius.small},tabActive:{backgroundColor:palette.inkStrong},tabText:{color:palette.muted,fontSize:11,fontWeight:'700'},tabTextActive:{color:palette.paper},
  card:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:17,shadowColor:'#13242C',shadowOpacity:.05,shadowRadius:15,shadowOffset:{width:0,height:7},elevation:2},personRow:{flexDirection:'row',alignItems:'center',gap:12},photo:{width:76,height:76,borderRadius:38,backgroundColor:palette.stoneDeep},photoPlaceholder:{width:76,height:76,borderRadius:38,backgroundColor:palette.sageSoft,alignItems:'center',justifyContent:'center'},avatar:{width:52,height:52,borderRadius:26,backgroundColor:palette.stoneDeep},avatarPlaceholder:{width:52,height:52,borderRadius:26,backgroundColor:palette.sageSoft,alignItems:'center',justifyContent:'center'},initial:{color:palette.inkStrong,fontFamily:type.serif,fontSize:21},name:{color:palette.inkStrong,fontFamily:type.serif,fontSize:25,lineHeight:30},smallName:{color:palette.inkStrong,fontFamily:type.serif,fontSize:21,lineHeight:25},headline:{color:palette.muted,fontSize:11,lineHeight:16,marginTop:3},scoreBox:{minWidth:54,alignItems:'flex-end'},score:{color:palette.sage,fontSize:19,fontWeight:'700'},scoreLabel:{color:palette.quiet,fontSize:7,letterSpacing:1.1,fontWeight:'700'},meta:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:13},rating:{color:palette.sage,fontSize:9.5,fontWeight:'700',marginTop:6},bio:{color:palette.text,fontSize:11,lineHeight:18,marginTop:12},why:{backgroundColor:palette.stoneDeep,borderRadius:radius.medium,padding:12,marginTop:13},whyTitle:{color:palette.inkStrong,fontSize:10,fontWeight:'700',marginBottom:4},whyText:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:2},actions:{flexDirection:'row',gap:9,marginTop:15},passButton:{flex:1,borderWidth:1,borderColor:palette.lineStrong,paddingVertical:13,alignItems:'center',borderRadius:radius.medium},passText:{color:palette.muted,fontSize:11,fontWeight:'700'},interestedButton:{flex:1.35,backgroundColor:palette.inkStrong,paddingVertical:13,alignItems:'center',borderRadius:radius.medium},interestedButtonText:{color:palette.paper,fontSize:11,fontWeight:'700'},
  list:{gap:10},savedCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:16},statusPill:{alignSelf:'flex-start',backgroundColor:'#F5F0E5',borderRadius:999,paddingHorizontal:9,paddingVertical:6,marginTop:12},statusMutual:{backgroundColor:palette.sageSoft},statusDeclined:{backgroundColor:palette.dangerSoft},statusText:{color:'#7A6845',fontSize:7.5,fontWeight:'800',letterSpacing:.8},statusMutualText:{color:palette.sage},statusDeclinedText:{color:palette.danger},savedCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:9},openApplication:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',backgroundColor:palette.inkStrong,borderRadius:radius.medium,paddingHorizontal:13,paddingVertical:12,marginTop:12},openApplicationText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},arrow:{color:palette.paper,fontSize:15},withdraw:{alignSelf:'flex-start',paddingVertical:10,marginTop:5},withdrawText:{color:palette.muted,fontSize:9.5,fontWeight:'700',textDecorationLine:'underline'},
  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large},emptyTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:19,lineHeight:24},emptyCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:6},secondary:{alignSelf:'flex-start',borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:12,paddingVertical:10,borderRadius:radius.medium,marginTop:12},secondaryText:{color:palette.ink,fontSize:10,fontWeight:'700'},primary:{backgroundColor:palette.inkStrong,paddingVertical:13,alignItems:'center',borderRadius:radius.medium,marginTop:12},primaryText:{color:palette.paper,fontSize:11,fontWeight:'700'},error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:12},help:{color:palette.quiet,fontSize:9.5,lineHeight:15,marginTop:11,textAlign:'center'}
})
