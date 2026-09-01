import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Dimensions, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View, Alert } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { calculateMatchScore } from '../src/lib/matching'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
const SCREEN_WIDTH=Dimensions.get('window').width
const SWIPE_THRESHOLD=Math.min(100,SCREEN_WIDTH*.24)

type AccountRole='talent'|'employer'
type Job={id:string;job_title:string;job_image_url?:string|null;location?:string|null;job_type?:string|null;salary_display_text?:string|null;is_featured?:boolean|null;status?:string|null;posted_date?:string|null;employer_id?:string|null;employer_profiles?:any;[key:string]:any}

export default function JobsScreen(){
  const [role,setRole]=useState<AccountRole>('talent')
  const [jobs,setJobs]=useState<Job[]>([])
  const [candidate,setCandidate]=useState<any>(null)
  const [reviewed,setReviewed]=useState<Set<string>>(new Set())
  const [passed,setPassed]=useState<Set<string>>(new Set())
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [error,setError]=useState('')
  const position=useRef(new Animated.ValueXY()).current

  useEffect(()=>{void load()},[])

  async function mobileApi(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}${path}`,{...options,headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',...(options?.headers||{})}})
    const body=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(body?.error||'Could not complete this request.')
    return body
  }

  async function load(){
    setLoading(true);setError('')
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){router.replace('/login');return}
    const {data:account}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
    const resolved:AccountRole=account?.role==='employer'?'employer':'talent'
    setRole(resolved)
    const employerSelect='id,company_name,property_name,logo_url,property_photos,review_score,review_count,star_rating,location,postcode'

    if(resolved==='employer'){
      const {data:employer}=await supabase.from('employer_profiles').select('id').eq('user_id',user.id).maybeSingle()
      if(!employer){setError('Employer profile not found.');setLoading(false);return}
      const {data,error:queryError}=await supabase.from('job_listings').select(`*,employer_profiles(${employerSelect})`).eq('employer_id',employer.id).order('posted_date',{ascending:false})
      if(queryError)setError(queryError.message)
      setJobs((data||[]) as Job[]);setLoading(false);return
    }

    const {data:candidateRow}=await supabase.from('candidate_profiles').select('*').eq('user_id',user.id).maybeSingle()
    setCandidate(candidateRow||null)
    const swipeData=await mobileApi('/api/mobile/job-swipes').catch(()=>({passed_job_ids:[],reviewed_job_ids:[],saved_job_ids:[]}))
    setPassed(new Set(swipeData.passed_job_ids||[]))
    setReviewed(new Set(swipeData.reviewed_job_ids||swipeData.saved_job_ids||[]))

    const now=new Date().toISOString()
    const {data,error:queryError}=await supabase.from('job_listings').select(`*,employer_profiles(${employerSelect})`).eq('is_live',true).or(`expires_at.is.null,expires_at.gt.${now}`).order('is_featured',{ascending:false}).order('posted_date',{ascending:false})
    if(queryError)setError(queryError.message)
    setJobs((data||[]) as Job[]);position.setValue({x:0,y:0});setLoading(false)
  }

  const ranked=useMemo(()=>{
    const available=role==='talent'?jobs.filter(job=>!passed.has(job.id)&&!reviewed.has(job.id)):jobs
    if(role!=='talent'||!candidate)return available.map(job=>({job,match:null as any}))
    return available.map(job=>({job,match:calculateMatchScore(candidate,job)})).sort((a,b)=>Number(Boolean(b.job.is_featured))-Number(Boolean(a.job.is_featured))||Number(b.match?.score||0)-Number(a.match?.score||0))
  },[jobs,candidate,role,passed,reviewed])
  const current=ranked[0],next=ranked[1]

  function resetPosition(){Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:false,friction:5}).start()}
  async function passCurrent(){
    if(!current||busy)return
    setBusy(true);setError('')
    try{
      await mobileApi('/api/mobile/job-swipes',{method:'POST',body:JSON.stringify({targetId:current.job.id,action:'left'})})
      setPassed(prev=>new Set(prev).add(current.job.id));position.setValue({x:0,y:0})
    }catch(e:any){setError(e?.message||'Could not pass this role.');resetPosition()}
    finally{setBusy(false)}
  }
  async function interestedCurrent(){
    if(!current||busy)return
    const id=current.job.id
    setBusy(true);setError('')
    try{
      // Interest only - exactly like the website. Applying is a separate,
      // deliberate step via the Apply with AI button.
      const result=await mobileApi('/api/mobile/job-swipes',{method:'POST',body:JSON.stringify({targetId:id,action:'right'})})
      setReviewed(prev=>new Set(prev).add(id));position.setValue({x:0,y:0})
      if(result?.matched)Alert.alert("It's a match!","You and the property both said yes. Your conversation is now open in Messages.")
    }catch(e:any){setError(e?.message||'Could not record your interest.');resetPosition()}
    finally{setBusy(false)}
  }
  function applyCurrent(){
    if(!current||busy)return
    router.push({pathname:'/job/[id]',params:{id:current.job.id}})
  }
  function animateAction(direction:'left'|'right'){
    if(!current||busy)return
    Animated.timing(position,{toValue:{x:direction==='right'?SCREEN_WIDTH:-SCREEN_WIDTH,y:0},duration:170,useNativeDriver:false}).start(()=>{if(direction==='right')void interestedCurrent();else void passCurrent()})
  }
  async function resetDeck(){
    if(busy)return
    setBusy(true);setError('')
    try{
      await mobileApi('/api/mobile/job-swipes',{method:'DELETE'})
      setReviewed(new Set());setPassed(new Set());position.setValue({x:0,y:0});await load()
    }catch(e:any){setError(e?.message||'Could not reset your swipe deck.')}
    finally{setBusy(false)}
  }

  const panResponder=useMemo(()=>PanResponder.create({
    onStartShouldSetPanResponder:()=>true,
    onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>4,
    onPanResponderMove:Animated.event([null,{dx:position.x,dy:position.y}],{useNativeDriver:false}),
    onPanResponderRelease:(_,g)=>{if(g.dx>SWIPE_THRESHOLD)animateAction('right');else if(g.dx< -SWIPE_THRESHOLD)animateAction('left');else resetPosition()},
  }),[current?.job.id,busy])
  const rotate=position.x.interpolate({inputRange:[-SCREEN_WIDTH/2,0,SCREEN_WIDTH/2],outputRange:['-8deg','0deg','8deg'],extrapolate:'clamp'})
  const applyOpacity=position.x.interpolate({inputRange:[0,SWIPE_THRESHOLD],outputRange:[0,1],extrapolate:'clamp'})
  const passOpacity=position.x.interpolate({inputRange:[-SWIPE_THRESHOLD,0],outputRange:[1,0],extrapolate:'clamp'})

  function jobCard(job:Job,match:any){
    const employer=Array.isArray(job.employer_profiles)?job.employer_profiles[0]:job.employer_profiles
    const photos=Array.isArray(employer?.property_photos)?employer.property_photos:[]
    const image=job.job_image_url||photos[0]||null
    const rating=Number(employer?.review_score||employer?.star_rating||0)
    const reviews=Number(employer?.review_count||0)
    return <>
      {image?<Image source={{uri:image}} style={styles.hero}/>:<View style={styles.placeholder}><Text style={styles.placeholderText}>WELLNESS HOUSE</Text></View>}
      <View style={styles.cardBody}>
        <View style={styles.propertyRow}>
          {employer?.logo_url?<Image source={{uri:employer.logo_url}} style={styles.logo}/>:null}
          <View style={{flex:1}}><Text style={styles.company}>{employer?.property_name||employer?.company_name||'Wellness employer'}</Text><Text style={styles.rating}>{rating>0?`${rating.toFixed(1)} ★${reviews?` · ${reviews} reviews`:''}`:'New property'}</Text></View>
          {match?<Text style={styles.match}>{match.score}% MATCH</Text>:null}
        </View>
        <Text style={styles.jobTitle}>{job.job_title}</Text>
        <Text style={styles.meta}>{[job.location||employer?.location,job.job_type,job.salary_display_text].filter(Boolean).join(' · ')||'Open for full details'}</Text>
        <Pressable onPress={()=>router.push({pathname:'/job/[id]',params:{id:job.id}})} style={styles.detailsButton}><Text style={styles.detailsText}>Hotel, role & full details →</Text></Pressable>
      </View>
    </>
  }

  if(role==='employer')return <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>RECRUITMENT</Text><Text style={styles.title}>Your jobs</Text><Text style={styles.intro}>Create, edit, publish, close and manage your current roles.</Text>
    <Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:'new'}})} style={styles.primary}><Text style={styles.primaryText}>+ Post a role</Text></Pressable>
    {loading?<ActivityIndicator color="#0b2f4d"/>:null}{error?<Text style={styles.error}>{error}</Text>:null}
    {ranked.map(({job,match})=><View key={job.id} style={styles.listCard}><Pressable onPress={()=>router.push({pathname:'/job/[id]',params:{id:job.id}})}>{jobCard(job,match)}</Pressable><Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:job.id}})} style={styles.manage}><Text style={styles.manageText}>Manage role →</Text></Pressable></View>)}
  </ScrollView>

  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.page} scrollEnabled={!current}>
    <Text style={styles.eyebrow}>OPPORTUNITIES</Text><Text style={styles.title}>Jobs</Text>
    <Text style={styles.intro}>One place to discover roles. Swipe left to pass, swipe right to show interest - or open a role and Apply with AI when you're ready.</Text>
    {loading?<ActivityIndicator color="#0b2f4d" style={{marginTop:30}}/>:null}{error?<Text style={styles.error}>{error}</Text>:null}
    {!loading&&!error&&!current?<View style={styles.empty}><Text style={styles.emptyTitle}>{jobs.length?'You’ve reviewed every live role.':'No live roles right now.'}</Text><Text style={styles.emptyCopy}>{jobs.length?'Applied roles are tracked in Applications. Reset the deck only if you want to review current roles again.':'New matching roles will appear here automatically.'}</Text>{jobs.length?<Pressable onPress={resetDeck} style={styles.reset}><Text style={styles.resetText}>{busy?'Resetting…':'Reset swipe deck'}</Text></Pressable>:null}</View>:null}
    {!loading&&!error&&current?<>
      <View style={styles.deck}>
        {next?<View style={[styles.card,styles.nextCard]}>{jobCard(next.job,next.match)}</View>:null}
        <Animated.View {...panResponder.panHandlers} style={[styles.card,styles.topCard,{transform:[{translateX:position.x},{translateY:position.y},{rotate}]}]}>
          <Animated.View pointerEvents="none" style={[styles.swipeLabel,styles.passLabel,{opacity:passOpacity}]}><Text style={styles.passLabelText}>PASS</Text></Animated.View>
          <Animated.View pointerEvents="none" style={[styles.swipeLabel,styles.applyLabel,{opacity:applyOpacity}]}><Text style={styles.applyLabelText}>INTERESTED</Text></Animated.View>
          {jobCard(current.job,current.match)}
        </Animated.View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={()=>animateAction('left')} disabled={busy} style={[styles.actionButton,styles.passButton]}><Text style={styles.passButtonText}>PASS</Text></Pressable>
        <Pressable onPress={()=>animateAction('right')} disabled={busy} style={[styles.actionButton,styles.interestButton]}><Text style={styles.interestButtonText}>{busy?'SAVING…':'INTERESTED'}</Text></Pressable>
        <Pressable onPress={applyCurrent} disabled={busy} style={[styles.actionButton,styles.applyButton]}><Text style={styles.applyButtonText}>APPLY WITH AI</Text></Pressable>
      </View>
      <Text style={styles.help}>Interested tells the property privately - if they're interested too, a conversation opens. Apply with AI opens the full role, your match analysis and a tailored covering letter, then you choose whether to send it.</Text>
    </>:null}
  </ScrollView></View>
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:'#f7f8f8'},page:{paddingHorizontal:20,paddingTop:22,paddingBottom:110,minHeight:'100%'},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:8},title:{color:'#0b2f4d',fontSize:30,lineHeight:36,fontWeight:'600'},intro:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:10,marginBottom:18},error:{color:'#9b2c2c',fontSize:12,marginVertical:14},deck:{height:535,position:'relative',marginTop:4},card:{position:'absolute',left:0,right:0,minHeight:500,backgroundColor:'#fff',borderWidth:1,borderColor:'#d9e0e3',overflow:'hidden',shadowColor:'#0b2f4d',shadowOpacity:.10,shadowRadius:16,shadowOffset:{width:0,height:8},elevation:4},topCard:{zIndex:2},nextCard:{top:10,left:8,right:8,opacity:.55,transform:[{scale:.975}]},hero:{width:'100%',height:190,backgroundColor:'#eef2f4'},placeholder:{height:180,backgroundColor:'#edf2f4',alignItems:'center',justifyContent:'center'},placeholderText:{fontSize:10,letterSpacing:2,color:'#71808a'},cardBody:{padding:18},propertyRow:{flexDirection:'row',alignItems:'center',gap:9},logo:{width:38,height:38,borderRadius:8,borderWidth:1,borderColor:'#e4e9eb'},company:{color:'#173246',fontSize:11,textTransform:'uppercase',letterSpacing:.6,fontWeight:'700'},rating:{color:'#526976',fontSize:9.5,marginTop:3},match:{color:'#0b2f4d',borderWidth:1,borderColor:'#cdd8dd',paddingHorizontal:7,paddingVertical:4,fontSize:8,fontWeight:'700'},jobTitle:{color:'#173246',fontSize:23,lineHeight:29,fontWeight:'600',marginTop:14},meta:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:7},detailsButton:{marginTop:18,paddingVertical:10},detailsText:{color:'#0b2f4d',fontSize:11,fontWeight:'700'},swipeLabel:{position:'absolute',top:22,zIndex:5,borderWidth:2,paddingHorizontal:10,paddingVertical:7,backgroundColor:'#fff'},passLabel:{left:18,borderColor:'#9b2c2c'},applyLabel:{right:18,borderColor:'#0b6245'},passLabelText:{color:'#9b2c2c',fontSize:13,fontWeight:'900',letterSpacing:1},applyLabelText:{color:'#0b6245',fontSize:11,fontWeight:'900',letterSpacing:.7},actions:{flexDirection:'row',gap:10,marginTop:12},actionButton:{flex:1,minHeight:52,alignItems:'center',justifyContent:'center',borderWidth:1},passButton:{backgroundColor:'#fff',borderColor:'#c7d1d6'},applyButton:{backgroundColor:'#0b2f4d',borderColor:'#0b2f4d'},passButtonText:{color:'#8f1d1d',fontSize:11,fontWeight:'800',letterSpacing:1},interestButton:{backgroundColor:'#fff',borderColor:'#0b6245'},interestButtonText:{color:'#0b6245',fontSize:11,fontWeight:'800',letterSpacing:.7},applyButtonText:{color:'#fff',fontSize:11,fontWeight:'800',letterSpacing:.7},help:{color:'#71808a',fontSize:10.5,lineHeight:16,marginTop:11,textAlign:'center'},empty:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d9e0e3',padding:22,marginTop:18},emptyTitle:{color:'#0b2f4d',fontSize:20,fontWeight:'700'},emptyCopy:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:8},reset:{backgroundColor:'#0b2f4d',paddingVertical:14,alignItems:'center',marginTop:18},resetText:{color:'#fff',fontSize:11,fontWeight:'800'},primary:{backgroundColor:'#0b2f4d',paddingVertical:14,alignItems:'center',marginVertical:18},primaryText:{color:'#fff',fontSize:11,fontWeight:'800'},listCard:{backgroundColor:'#fff',borderWidth:1,borderColor:'#d9e0e3',marginBottom:14,overflow:'hidden'},manage:{padding:15,borderTopWidth:1,borderTopColor:'#e4e9eb'},manageText:{color:'#0b2f4d',fontSize:11,fontWeight:'700'}
})
