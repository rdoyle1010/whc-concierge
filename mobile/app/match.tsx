import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Animated, Dimensions, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
const SCREEN_WIDTH=Dimensions.get('window').width
const SWIPE_THRESHOLD=Math.min(100,SCREEN_WIDTH*.24)

type Job={id:string;job_title:string;location?:string|null;job_type?:string|null}
type Candidate={
  id:string;full_name?:string|null;headline?:string|null;role_level?:string|null;location?:string|null;bio?:string|null;
  profile_image_url?:string|null;review_score?:number|null;experience_years?:number|null;years_experience?:number|null;
  match_score?:number|null;match_label?:string|null;match_explanation?:string[]|null;distance_miles?:number|null;role_title?:string|null;
  application_id?:string|null;application_status?:string|null;mutual?:boolean;interest_status?:'waiting'|'matched'|string|null
}
type ViewMode='discover'|'interested'

export default function EmployerMatchScreen(){
  const [jobs,setJobs]=useState<Job[]>([])
  const [jobId,setJobId]=useState('')
  const [candidates,setCandidates]=useState<Candidate[]>([])
  const [interested,setInterested]=useState<Candidate[]>([])
  const [view,setView]=useState<ViewMode>('discover')
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const position=useRef(new Animated.ValueXY()).current

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
    position.setValue({x:0,y:0})
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
      setJobId(data.selected_job_id||rows[0]?.id||'')
      applyRoleData(data)
    }catch(e:any){setError(e?.message||'Could not load talent matches.')}
    setLoading(false)
  }

  async function loadRole(selected:string,showSpinner=true){
    if(showSpinner)setLoading(true)
    setError('')
    try{const data=await api(`/api/mobile/employer-matches?jobId=${encodeURIComponent(selected)}`);applyRoleData(data)}
    catch(e:any){setError(e?.message||'Could not load talent matches.')}
    if(showSpinner)setLoading(false)
  }

  const current=candidates[0]
  const next=candidates[1]
  const selectedJob=useMemo(()=>jobs.find(job=>job.id===jobId)||null,[jobs,jobId])

  function resetPosition(){Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:false,friction:5}).start()}
  function removeCurrent(){setCandidates(prev=>prev.slice(1));position.setValue({x:0,y:0})}

  async function decide(action:'left'|'right'){
    if(!current||!jobId||busy)return
    setBusy(true);setError('')
    const candidate=current
    try{
      const result=await api('/api/mobile/employer-matches',{method:'POST',body:JSON.stringify({candidateId:candidate.id,jobId,action})})
      removeCurrent()
      if(action==='right'){
        await loadRole(jobId,false)
        const name=candidate.full_name||'Candidate'
        if(result?.applicationId){
          Alert.alert(result?.matched?'Mutual match':'Interest saved',`${name} is saved in Interested Talent and already has a recruitment journey for this role.`,[
            {text:'Open application',onPress:()=>router.push({pathname:'/application/[id]',params:{id:result.applicationId}})},
            {text:'Keep matching',style:'cancel'},
          ])
        }else{
          Alert.alert('Interest saved',`${name} has been notified and is now saved under Interested Talent. They will stay there while you wait for their response.`)
        }
      }
    }catch(e:any){setError(e?.message||'Could not save your decision.');resetPosition()}
    setBusy(false)
  }

  function animateAction(direction:'left'|'right'){
    if(!current||busy)return
    Animated.timing(position,{toValue:{x:direction==='right'?SCREEN_WIDTH:-SCREEN_WIDTH,y:0},duration:170,useNativeDriver:false}).start(()=>void decide(direction))
  }

  async function reviewPassedAgain(){
    if(!jobId||busy)return
    setBusy(true);setError('')
    try{await api(`/api/mobile/employer-matches?jobId=${encodeURIComponent(jobId)}`,{method:'DELETE'});await loadRole(jobId,false)}
    catch(e:any){setError(e?.message||'Could not restore passed professionals.')}
    setBusy(false)
  }

  const panResponder=useMemo(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>false,
    onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>8&&Math.abs(g.dx)>Math.abs(g.dy),
    onPanResponderMove:Animated.event([null,{dx:position.x,dy:position.y}],{useNativeDriver:false}),
    onPanResponderRelease:(_,g)=>{if(g.dx>SWIPE_THRESHOLD)animateAction('right');else if(g.dx< -SWIPE_THRESHOLD)animateAction('left');else resetPosition()},
  }),[current?.id,jobId,busy])

  const rotate=position.x.interpolate({inputRange:[-SCREEN_WIDTH/2,0,SCREEN_WIDTH/2],outputRange:['-8deg','0deg','8deg'],extrapolate:'clamp'})
  const yesOpacity=position.x.interpolate({inputRange:[0,SWIPE_THRESHOLD],outputRange:[0,1],extrapolate:'clamp'})
  const passOpacity=position.x.interpolate({inputRange:[-SWIPE_THRESHOLD,0],outputRange:[1,0],extrapolate:'clamp'})

  function candidateSummary(candidate:Candidate){
    const experience=Number(candidate.experience_years||candidate.years_experience||0)
    return <>
      {candidate.profile_image_url?<Image source={{uri:candidate.profile_image_url}} style={styles.photo}/>:<View style={styles.photoPlaceholder}><Text style={styles.initial}>{(candidate.full_name||'T').slice(0,1).toUpperCase()}</Text></View>}
      <View style={styles.cardBody}>
        <View style={styles.topRow}><View style={{flex:1}}><Text style={styles.name}>{candidate.full_name||'Wellness professional'}</Text><Text style={styles.headline}>{candidate.headline||candidate.role_level||'Spa & wellness professional'}</Text></View><View style={styles.scoreBox}><Text style={styles.score}>{Number(candidate.match_score||0)}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View></View>
        <Text style={styles.meta}>{[candidate.location,experience?`${experience} yrs experience`:null,candidate.distance_miles!=null?`${Math.round(Number(candidate.distance_miles))} miles away`:null].filter(Boolean).join(' · ')}</Text>
        {candidate.review_score?<Text style={styles.rating}>{Number(candidate.review_score).toFixed(1)} ★ verified reputation</Text>:null}
        {candidate.bio?<Text numberOfLines={4} style={styles.bio}>{candidate.bio}</Text>:null}
        {Array.isArray(candidate.match_explanation)&&candidate.match_explanation.length?<View style={styles.why}><Text style={styles.whyTitle}>Why this person fits</Text>{candidate.match_explanation.slice(0,3).map((item,index)=><Text key={`${item}-${index}`} style={styles.whyText}>• {item}</Text>)}</View>:null}
      </View>
    </>
  }

  function interestedCard(candidate:Candidate){
    const matched=Boolean(candidate.application_id)
    return <View key={candidate.id} style={styles.interestedCard}>
      <View style={styles.interestedTop}>
        {candidate.profile_image_url?<Image source={{uri:candidate.profile_image_url}} style={styles.avatar}/>:<View style={styles.avatarPlaceholder}><Text style={styles.avatarInitial}>{(candidate.full_name||'T').slice(0,1).toUpperCase()}</Text></View>}
        <View style={{flex:1}}><Text style={styles.interestedName}>{candidate.full_name||'Wellness professional'}</Text><Text style={styles.interestedHeadline}>{candidate.headline||candidate.role_level||'Spa & wellness professional'}</Text></View>
        <Text style={styles.interestedScore}>{Number(candidate.match_score||0)}%</Text>
      </View>
      <View style={[styles.statusPill,matched&&styles.statusPillMatched]}><Text style={[styles.statusText,matched&&styles.statusTextMatched]}>{matched?'MATCHED / IN RECRUITMENT':'INTEREST SENT · WAITING FOR TALENT'}</Text></View>
      <Text style={styles.interestedCopy}>{matched?'This professional is now in your recruitment journey for this role.':'Your interest has been saved. The professional has been notified and will remain here while you wait for their response.'}</Text>
      {candidate.application_id?<Pressable onPress={()=>router.push({pathname:'/application/[id]',params:{id:candidate.application_id!}})} style={styles.openButton}><Text style={styles.openButtonText}>Open application →</Text></Pressable>:null}
    </View>
  }

  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>RECRUITMENT</Text><Text style={styles.title}>Talent Match</Text>
    <Text style={styles.intro}>Discover professionals for a live role and keep everyone you are interested in together.</Text>

    <Text style={styles.label}>ROLE</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobRow}>
      {jobs.map(job=><Pressable key={job.id} onPress={()=>setJobId(job.id)} style={[styles.jobChip,job.id===jobId&&styles.jobChipActive]}><Text numberOfLines={1} style={[styles.jobChipText,job.id===jobId&&styles.jobChipTextActive]}>{job.job_title}</Text></Pressable>)}
    </ScrollView>
    {!jobs.length&&!loading?<View style={styles.empty}><Text style={styles.emptyTitle}>Post a live role first.</Text><Text style={styles.emptyCopy}>Matching works against a specific vacancy.</Text><Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:'new'}})} style={styles.primary}><Text style={styles.primaryText}>Post a role</Text></Pressable></View>:null}

    {selectedJob?<Text style={styles.roleContext}>{selectedJob.job_title}{selectedJob.location?` · ${selectedJob.location}`:''}</Text>:null}
    {jobs.length?<View style={styles.tabs}>
      <Pressable onPress={()=>setView('discover')} style={[styles.tab,view==='discover'&&styles.tabActive]}><Text style={[styles.tabText,view==='discover'&&styles.tabTextActive]}>Discover</Text></Pressable>
      <Pressable onPress={()=>setView('interested')} style={[styles.tab,view==='interested'&&styles.tabActive]}><Text style={[styles.tabText,view==='interested'&&styles.tabTextActive]}>Interested {interested.length?`(${interested.length})`:''}</Text></Pressable>
    </View>:null}

    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}

    {!loading&&!error&&view==='interested'&&interested.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No interested talent yet.</Text><Text style={styles.emptyCopy}>When you press Interested on a professional, they will be saved here for this role instead of disappearing.</Text><Pressable onPress={()=>setView('discover')} style={styles.secondary}><Text style={styles.secondaryText}>Discover talent</Text></Pressable></View>:null}
    {!loading&&!error&&view==='interested'&&interested.length>0?<View style={styles.interestedList}>{interested.map(interestedCard)}</View>:null}

    {!loading&&!error&&view==='discover'&&jobs.length>0&&!current?<View style={styles.empty}><Text style={styles.emptyTitle}>You’re up to date.</Text><Text style={styles.emptyCopy}>You have reviewed the current matches. People you liked are safe in Interested.</Text><Pressable onPress={reviewPassedAgain} style={styles.secondary}><Text style={styles.secondaryText}>{busy?'Restoring…':'Review passed talent again'}</Text></Pressable></View>:null}

    {!loading&&!error&&view==='discover'&&current?<>
      <View style={styles.decisionHeader}><Text style={styles.decisionTitle}>Your decision</Text><Text style={styles.decisionHint}>Swipe left to pass or right to save to Interested.</Text></View>
      <View style={styles.actions}>
        <Pressable onPress={()=>animateAction('left')} disabled={busy} style={[styles.action,styles.passButton]}><Text style={styles.passButtonText}>← Pass</Text></Pressable>
        <Pressable onPress={()=>animateAction('right')} disabled={busy} style={[styles.action,styles.yesButton]}><Text style={styles.yesButtonText}>{busy?'Saving…':'Interested →'}</Text></Pressable>
      </View>
      <View style={styles.deck}>
        {next?<View style={[styles.card,styles.nextCard]}>{candidateSummary(next)}</View>:null}
        <Animated.View {...panResponder.panHandlers} style={[styles.card,styles.topCard,{transform:[{translateX:position.x},{translateY:position.y},{rotate}]}]}>
          <Animated.View pointerEvents="none" style={[styles.swipeLabel,styles.passLabel,{opacity:passOpacity}]}><Text style={styles.passText}>PASS</Text></Animated.View>
          <Animated.View pointerEvents="none" style={[styles.swipeLabel,styles.yesLabel,{opacity:yesOpacity}]}><Text style={styles.yesText}>INTERESTED</Text></Animated.View>
          {candidateSummary(current)}
        </Animated.View>
      </View>
      <Text style={styles.help}>Interested professionals are saved in the Interested tab. If interest becomes mutual, their application opens from the same saved card.</Text>
    </>:null}
  </ScrollView></View>
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:space.lg,paddingBottom:112,minHeight:'100%'},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,marginBottom:9,fontWeight:'700'},title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:18,maxWidth:350},
  label:{color:palette.quiet,fontSize:8,letterSpacing:1.5,marginBottom:8,fontWeight:'700'},jobRow:{gap:8,paddingBottom:14},jobChip:{borderWidth:1,borderColor:palette.lineStrong,backgroundColor:palette.paper,paddingHorizontal:12,paddingVertical:10,maxWidth:210,borderRadius:radius.medium},jobChipActive:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},jobChipText:{color:palette.muted,fontSize:10,fontWeight:'600'},jobChipTextActive:{color:palette.paper},roleContext:{color:palette.text,fontSize:11.5,fontWeight:'700',marginBottom:12},
  tabs:{flexDirection:'row',backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.medium,padding:4,marginBottom:16},tab:{flex:1,paddingVertical:10,alignItems:'center',borderRadius:radius.small},tabActive:{backgroundColor:palette.inkStrong},tabText:{color:palette.muted,fontSize:10.5,fontWeight:'700'},tabTextActive:{color:palette.paper},
  error:{color:palette.danger,fontSize:12,lineHeight:18,marginVertical:14},decisionHeader:{marginTop:2,marginBottom:9},decisionTitle:{color:palette.inkStrong,fontSize:14,fontWeight:'700'},decisionHint:{color:palette.quiet,fontSize:10.5,lineHeight:16,marginTop:3},
  deck:{height:560,position:'relative',marginTop:12},card:{position:'absolute',left:0,right:0,minHeight:520,backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,overflow:'hidden',borderRadius:radius.large,shadowColor:'#13242C',shadowOpacity:.07,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:3},topCard:{zIndex:2},nextCard:{top:10,left:8,right:8,opacity:.5,transform:[{scale:.975}]},photo:{width:'100%',height:205,backgroundColor:palette.stoneDeep},photoPlaceholder:{height:205,backgroundColor:palette.stoneDeep,alignItems:'center',justifyContent:'center'},initial:{color:palette.inkStrong,fontSize:56,fontWeight:'400',fontFamily:type.serif},cardBody:{padding:18},topRow:{flexDirection:'row',gap:12,alignItems:'flex-start'},name:{color:palette.inkStrong,fontSize:25,lineHeight:30,fontWeight:'400',fontFamily:type.serif},headline:{color:palette.muted,fontSize:11,lineHeight:16,marginTop:4},scoreBox:{alignItems:'flex-end',minWidth:52},score:{color:palette.sage,fontSize:18,fontWeight:'700'},scoreLabel:{color:palette.quiet,fontSize:7,letterSpacing:1.1,fontWeight:'700'},meta:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:12},rating:{color:palette.text,fontSize:10.5,fontWeight:'600',marginTop:8},bio:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:13},why:{backgroundColor:palette.sageSoft,padding:12,marginTop:14,borderRadius:radius.medium},whyTitle:{color:palette.sage,fontSize:10,fontWeight:'700',marginBottom:5},whyText:{color:palette.muted,fontSize:9.5,lineHeight:15},
  swipeLabel:{position:'absolute',top:22,zIndex:5,borderWidth:1.5,paddingHorizontal:10,paddingVertical:7,backgroundColor:palette.paper,borderRadius:radius.small},passLabel:{left:18,borderColor:palette.danger},yesLabel:{right:18,borderColor:palette.sage},passText:{color:palette.danger,fontSize:11,fontWeight:'800'},yesText:{color:palette.sage,fontSize:10,fontWeight:'800'},
  actions:{flexDirection:'row',gap:10},action:{flex:1,paddingVertical:13,alignItems:'center',borderRadius:radius.medium},passButton:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.lineStrong},passButtonText:{color:palette.muted,fontSize:11,fontWeight:'700'},yesButton:{backgroundColor:palette.inkStrong},yesButtonText:{color:palette.paper,fontSize:11,fontWeight:'800'},help:{color:palette.quiet,fontSize:9.5,lineHeight:15,textAlign:'center',paddingHorizontal:15,marginTop:5},
  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:20,borderRadius:radius.large,marginTop:14},emptyTitle:{color:palette.inkStrong,fontSize:20,fontFamily:type.serif,fontWeight:'400'},emptyCopy:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:7},primary:{backgroundColor:palette.inkStrong,paddingVertical:13,alignItems:'center',marginTop:14,borderRadius:radius.medium},primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},secondary:{borderWidth:1,borderColor:palette.lineStrong,paddingVertical:12,alignItems:'center',marginTop:14,borderRadius:radius.medium},secondaryText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700'},
  interestedList:{gap:12},interestedCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,borderRadius:radius.large},interestedTop:{flexDirection:'row',gap:12,alignItems:'center'},avatar:{width:54,height:54,borderRadius:27,backgroundColor:palette.stoneDeep},avatarPlaceholder:{width:54,height:54,borderRadius:27,backgroundColor:palette.stoneDeep,alignItems:'center',justifyContent:'center'},avatarInitial:{fontFamily:type.serif,fontSize:24,color:palette.inkStrong},interestedName:{fontFamily:type.serif,fontSize:20,color:palette.inkStrong},interestedHeadline:{fontSize:10.5,color:palette.muted,marginTop:3},interestedScore:{fontSize:16,fontWeight:'800',color:palette.sage},statusPill:{alignSelf:'flex-start',backgroundColor:'#F4EEE1',paddingHorizontal:8,paddingVertical:5,borderRadius:999,marginTop:13},statusPillMatched:{backgroundColor:palette.sageSoft},statusText:{fontSize:7.5,fontWeight:'800',letterSpacing:.7,color:'#7A6845'},statusTextMatched:{color:palette.sage},interestedCopy:{fontSize:10.5,lineHeight:17,color:palette.muted,marginTop:9},openButton:{backgroundColor:palette.inkStrong,paddingVertical:12,alignItems:'center',borderRadius:radius.medium,marginTop:13},openButtonText:{color:palette.paper,fontSize:10.5,fontWeight:'800'}
})