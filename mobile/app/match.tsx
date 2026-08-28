import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Alert, Animated, Dimensions, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
const SCREEN_WIDTH=Dimensions.get('window').width
const SWIPE_THRESHOLD=Math.min(100,SCREEN_WIDTH*.24)

type Job={id:string;job_title:string;location?:string|null;job_type?:string|null}
type Candidate={
  id:string;full_name?:string|null;headline?:string|null;role_level?:string|null;location?:string|null;bio?:string|null;
  profile_image_url?:string|null;review_score?:number|null;experience_years?:number|null;years_experience?:number|null;
  qualifications?:any;product_houses?:any;systems_experience?:any;services_offered?:any;awards?:any;is_featured?:boolean|null;
  match_score?:number|null;match_label?:string|null;match_explanation?:string[]|null;distance_miles?:number|null;role_title?:string|null
}

export default function EmployerMatchScreen(){
  const [jobs,setJobs]=useState<Job[]>([])
  const [jobId,setJobId]=useState('')
  const [candidates,setCandidates]=useState<Candidate[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const position=useRef(new Animated.ValueXY()).current

  useEffect(()=>{void initialise()},[])
  useEffect(()=>{if(jobId)void loadMatches(jobId)},[jobId])

  async function api(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}${path}`,{...options,headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',...(options?.headers||{})}})
    const body=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(body?.error||'Could not complete this request.')
    return body
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
      setCandidates((data.candidates||[]) as Candidate[])
    }catch(e:any){setError(e?.message||'Could not load talent matches.')}
    setLoading(false)
  }

  async function loadMatches(selected:string){
    setLoading(true);setError('')
    try{
      const data=await api(`/api/mobile/employer-matches?jobId=${encodeURIComponent(selected)}`)
      setCandidates((data.candidates||[]) as Candidate[])
      position.setValue({x:0,y:0})
    }catch(e:any){setError(e?.message||'Could not load talent matches.')}
    setLoading(false)
  }

  const current=candidates[0]
  const next=candidates[1]
  const selectedJob=useMemo(()=>jobs.find(job=>job.id===jobId)||null,[jobs,jobId])

  function resetPosition(){Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:false,friction:5}).start()}
  function removeCurrent(){setCandidates(prev=>prev.slice(1));position.setValue({x:0,y:0})}

  async function decide(action:'left'|'right'){
    if(!current||!jobId||busy)return
    setBusy(true);setError('')
    try{
      const result=await api('/api/mobile/employer-matches',{method:'POST',body:JSON.stringify({candidateId:current.id,jobId,action})})
      const name=current.full_name||'Candidate'
      removeCurrent()
      if(action==='right'){
        if(result?.applicationId){
          Alert.alert(result?.matched?'Mutual match':'Interest saved',`${name} is already in the recruitment journey for this role.`,[
            {text:'Continue',onPress:()=>router.push({pathname:'/application/[id]',params:{id:result.applicationId}})},
            {text:'Keep matching',style:'cancel'},
          ])
        }else{
          Alert.alert(result?.matched?'It’s a match':'Interest sent',result?.matched?`${name} is interested in this role too.`:`${name} will be notified that your property is interested.`)
        }
      }
    }catch(e:any){setError(e?.message||'Could not save your decision.');resetPosition()}
    setBusy(false)
  }

  function animateAction(direction:'left'|'right'){
    if(!current||busy)return
    Animated.timing(position,{toValue:{x:direction==='right'?SCREEN_WIDTH:-SCREEN_WIDTH,y:0},duration:170,useNativeDriver:false}).start(()=>void decide(direction))
  }

  async function resetDeck(){
    if(!jobId||busy)return
    setBusy(true);setError('')
    try{await api(`/api/mobile/employer-matches?jobId=${encodeURIComponent(jobId)}`,{method:'DELETE'});await loadMatches(jobId)}
    catch(e:any){setError(e?.message||'Could not reset this role’s match deck.')}
    setBusy(false)
  }

  const panResponder=useMemo(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>true,
    onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>4,
    onPanResponderMove:Animated.event([null,{dx:position.x,dy:position.y}],{useNativeDriver:false}),
    onPanResponderRelease:(_,g)=>{if(g.dx>SWIPE_THRESHOLD)animateAction('right');else if(g.dx< -SWIPE_THRESHOLD)animateAction('left');else resetPosition()},
  }),[current?.id,jobId,busy])

  const rotate=position.x.interpolate({inputRange:[-SCREEN_WIDTH/2,0,SCREEN_WIDTH/2],outputRange:['-8deg','0deg','8deg'],extrapolate:'clamp'})
  const yesOpacity=position.x.interpolate({inputRange:[0,SWIPE_THRESHOLD],outputRange:[0,1],extrapolate:'clamp'})
  const passOpacity=position.x.interpolate({inputRange:[-SWIPE_THRESHOLD,0],outputRange:[1,0],extrapolate:'clamp'})

  function candidateCard(candidate:Candidate){
    const experience=Number(candidate.experience_years||candidate.years_experience||0)
    const score=Number(candidate.match_score||0)
    return <View style={styles.cardInner}>
      {candidate.profile_image_url?<Image source={{uri:candidate.profile_image_url}} style={styles.photo}/>:<View style={styles.photoPlaceholder}><Text style={styles.initial}>{(candidate.full_name||'T').slice(0,1).toUpperCase()}</Text></View>}
      <View style={styles.cardBody}>
        <View style={styles.topRow}><View style={{flex:1}}><Text style={styles.name}>{candidate.full_name||'Wellness professional'}</Text><Text style={styles.headline}>{candidate.headline||candidate.role_level||'Spa & wellness professional'}</Text></View><View style={styles.scoreBox}><Text style={styles.score}>{score}%</Text><Text style={styles.scoreLabel}>MATCH</Text></View></View>
        <Text style={styles.meta}>{[candidate.location,experience?`${experience} yrs experience`:null,candidate.distance_miles!=null?`${Math.round(Number(candidate.distance_miles))} miles away`:null].filter(Boolean).join(' · ')}</Text>
        {candidate.review_score?<Text style={styles.rating}>{Number(candidate.review_score).toFixed(1)} ★ verified reputation</Text>:null}
        {candidate.bio?<Text numberOfLines={4} style={styles.bio}>{candidate.bio}</Text>:null}
        {Array.isArray(candidate.match_explanation)&&candidate.match_explanation.length?<View style={styles.why}><Text style={styles.whyTitle}>Why this match</Text>{candidate.match_explanation.slice(0,3).map((item,index)=><Text key={`${item}-${index}`} style={styles.whyText}>• {item}</Text>)}</View>:null}
      </View>
    </View>
  }

  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.page} scrollEnabled={!current}>
    <Text style={styles.eyebrow}>RECRUITMENT</Text><Text style={styles.title}>Talent Match</Text>
    <Text style={styles.intro}>Choose a live role, then review the professionals who fit it best. Swipe left to pass. Swipe right to show interest.</Text>

    <Text style={styles.label}>MATCH FOR ROLE</Text>
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.jobRow}>
      {jobs.map(job=><Pressable key={job.id} onPress={()=>setJobId(job.id)} style={[styles.jobChip,job.id===jobId&&styles.jobChipActive]}><Text numberOfLines={1} style={[styles.jobChipText,job.id===jobId&&styles.jobChipTextActive]}>{job.job_title}</Text></Pressable>)}
    </ScrollView>
    {!jobs.length&&!loading?<View style={styles.empty}><Text style={styles.emptyTitle}>Post a live role first.</Text><Text style={styles.emptyCopy}>Talent Match ranks professionals against a specific vacancy, so the hotel needs a live job before matching.</Text><Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:'new'}})} style={styles.primary}><Text style={styles.primaryText}>Post a role</Text></Pressable></View>:null}

    {selectedJob?<Text style={styles.roleContext}>{selectedJob.job_title}{selectedJob.location?` · ${selectedJob.location}`:''}</Text>:null}
    {loading?<ActivityIndicator color="#092b45" style={{marginTop:30}}/>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}

    {!loading&&!error&&jobs.length>0&&!current?<View style={styles.empty}><Text style={styles.emptyTitle}>You’ve reviewed the current matches.</Text><Text style={styles.emptyCopy}>Reset this role’s deck if you want to review the current professionals again.</Text><Pressable onPress={resetDeck} style={styles.secondary}><Text style={styles.secondaryText}>{busy?'Resetting…':'Reset match deck'}</Text></Pressable></View>:null}

    {!loading&&!error&&current?<>
      <View style={styles.deck}>
        {next?<View style={[styles.card,styles.nextCard]}>{candidateCard(next)}</View>:null}
        <Animated.View {...panResponder.panHandlers} style={[styles.card,styles.topCard,{transform:[{translateX:position.x},{translateY:position.y},{rotate}]}]}>
          <Animated.View pointerEvents="none" style={[styles.swipeLabel,styles.passLabel,{opacity:passOpacity}]}><Text style={styles.passText}>PASS</Text></Animated.View>
          <Animated.View pointerEvents="none" style={[styles.swipeLabel,styles.yesLabel,{opacity:yesOpacity}]}><Text style={styles.yesText}>INTERESTED</Text></Animated.View>
          {candidateCard(current)}
        </Animated.View>
      </View>
      <View style={styles.actions}><Pressable onPress={()=>animateAction('left')} disabled={busy} style={[styles.action,styles.passButton]}><Text style={styles.passButtonText}>PASS</Text></Pressable><Pressable onPress={()=>animateAction('right')} disabled={busy} style={[styles.action,styles.yesButton]}><Text style={styles.yesButtonText}>{busy?'SAVING…':'INTERESTED'}</Text></Pressable></View>
      <Text style={styles.help}>A right swipe notifies the professional. If they have already shown interest in the same role, it becomes a mutual match and you can move straight into the recruitment conversation.</Text>
    </>:null}
  </ScrollView></View>
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#f7f8f8'},page:{paddingHorizontal:20,paddingTop:22,paddingBottom:110,minHeight:'100%'},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:8},title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'600'},intro:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:10,marginBottom:18},label:{color:'#71808a',fontSize:8,letterSpacing:1.4,marginBottom:8},jobRow:{gap:8,paddingBottom:14},jobChip:{borderWidth:1,borderColor:'#cad5da',backgroundColor:'#fff',paddingHorizontal:12,paddingVertical:10,maxWidth:210},jobChipActive:{backgroundColor:'#092b45',borderColor:'#092b45'},jobChipText:{color:'#526976',fontSize:10,fontWeight:'600'},jobChipTextActive:{color:'#fff'},roleContext:{color:'#173246',fontSize:12,fontWeight:'700',marginBottom:12},error:{color:'#9b2c2c',fontSize:12,lineHeight:18,marginVertical:14},deck:{height:560,position:'relative'},card:{position:'absolute',left:0,right:0,minHeight:520,backgroundColor:'#fff',borderWidth:1,borderColor:'#d9e0e3',overflow:'hidden',shadowColor:'#0b2f4d',shadowOpacity:.10,shadowRadius:16,shadowOffset:{width:0,height:8},elevation:4},topCard:{zIndex:2},nextCard:{top:10,left:8,right:8,opacity:.5,transform:[{scale:.975}]},cardInner:{flex:1},photo:{width:'100%',height:205,backgroundColor:'#e9eef0'},photoPlaceholder:{height:205,backgroundColor:'#e8edef',alignItems:'center',justifyContent:'center'},initial:{color:'#092b45',fontSize:56,fontWeight:'500'},cardBody:{padding:18},topRow:{flexDirection:'row',gap:12,alignItems:'flex-start'},name:{color:'#092b45',fontSize:22,fontWeight:'600'},headline:{color:'#66747c',fontSize:11,lineHeight:16,marginTop:4},scoreBox:{borderWidth:1,borderColor:'#cbd6db',paddingHorizontal:10,paddingVertical:7,alignItems:'center'},score:{color:'#092b45',fontSize:17,fontWeight:'800'},scoreLabel:{color:'#71808a',fontSize:7,letterSpacing:1},meta:{color:'#526976',fontSize:10.5,lineHeight:16,marginTop:12},rating:{color:'#173246',fontSize:10.5,fontWeight:'600',marginTop:8},bio:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:13},why:{backgroundColor:'#f4f7f8',padding:12,marginTop:14},whyTitle:{color:'#173246',fontSize:10,fontWeight:'700',marginBottom:5},whyText:{color:'#66747c',fontSize:9.5,lineHeight:15},swipeLabel:{position:'absolute',top:22,zIndex:5,borderWidth:2,paddingHorizontal:10,paddingVertical:7,backgroundColor:'#fff'},passLabel:{left:18,borderColor:'#9b2c2c'},yesLabel:{right:18,borderColor:'#0b6245'},passText:{color:'#9b2c2c',fontSize:13,fontWeight:'900'},yesText:{color:'#0b6245',fontSize:11,fontWeight:'900'},actions:{flexDirection:'row',gap:10,marginTop:12},action:{flex:1,minHeight:52,alignItems:'center',justifyContent:'center',borderWidth:1},passButton:{backgroundColor:'#fff',borderColor:'#c7d1d6'},yesButton:{backgroundColor:'#092b45',borderColor:'#092b45'},passButtonText:{color:'#8f1d1d',fontSize:11,fontWeight:'800'},yesButtonText:{color:'#fff',fontSize:11,fontWeight:'800'},help:{color:'#71808a',fontSize:10.5,lineHeight:16,marginTop:11,textAlign:'center'},empty:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d9e0e3',padding:22,marginTop:18},emptyTitle:{color:'#092b45',fontSize:19,fontWeight:'700'},emptyCopy:{color:'#66747c',fontSize:12.5,lineHeight:20,marginTop:8},primary:{backgroundColor:'#092b45',paddingVertical:14,alignItems:'center',marginTop:16},primaryText:{color:'#fff',fontSize:11,fontWeight:'800'},secondary:{borderWidth:1,borderColor:'#092b45',paddingVertical:14,alignItems:'center',marginTop:16},secondaryText:{color:'#092b45',fontSize:11,fontWeight:'800'}
})
