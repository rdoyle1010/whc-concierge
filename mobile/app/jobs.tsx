import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Dimensions, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { calculateMatchScore } from '../src/lib/matching'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
const SCREEN_WIDTH=Dimensions.get('window').width
const SWIPE_THRESHOLD=Math.min(100,SCREEN_WIDTH*.24)

type AccountRole='talent'|'employer'
type Job={id:string;job_title:string;job_image_url?:string|null;location?:string|null;job_type?:string|null;salary_display_text?:string|null;is_featured?:boolean|null;status?:string|null;posted_date?:string|null;employer_id?:string|null;employer_profiles?:any;[key:string]:any}
type TalentInterest={
  interest_id:string
  sent_at?:string|null
  response:'waiting'|'accepted'|'declined'|string
  application_id?:string|null
  application_status?:string|null
  job:Job
  employer?:{property_name?:string|null;company_name?:string|null;logo_url?:string|null;location?:string|null;review_score?:number|null;star_rating?:number|null}|null
}

export default function JobsScreen(){
  const [role,setRole]=useState<AccountRole>('talent')
  const [jobs,setJobs]=useState<Job[]>([])
  const [candidate,setCandidate]=useState<any>(null)
  const [reviewed,setReviewed]=useState<Set<string>>(new Set())
  const [passed,setPassed]=useState<Set<string>>(new Set())
  const [interests,setInterests]=useState<TalentInterest[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [interestBusy,setInterestBusy]=useState('')
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

    const [swipeData,interestData]=await Promise.all([
      mobileApi('/api/mobile/job-swipes').catch(()=>({passed_job_ids:[],reviewed_job_ids:[],saved_job_ids:[]})),
      mobileApi('/api/mobile/talent-interests').catch(()=>({interests:[],pending_count:0})),
    ])
    setPassed(new Set(swipeData.passed_job_ids||[]))
    setReviewed(new Set(swipeData.reviewed_job_ids||swipeData.saved_job_ids||[]))
    setInterests((interestData.interests||[]) as TalentInterest[])

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
  const pendingInterests=interests.filter(item=>item.response==='waiting')
  const activeInterests=interests.filter(item=>item.response==='accepted'&&item.application_id)

  function resetPosition(){Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:false,friction:5}).start()}

  async function respondToInterest(item:TalentInterest,action:'accept'|'decline'){
    if(interestBusy)return
    setInterestBusy(item.interest_id);setError('')
    try{
      const result=await mobileApi('/api/mobile/talent-interests',{method:'POST',body:JSON.stringify({interestId:item.interest_id,action})})
      setInterests(currentRows=>currentRows.map(row=>row.interest_id===item.interest_id?{...row,response:result.response,application_id:result.applicationId||row.application_id,application_status:result.applicationStatus||row.application_status}:row))
      if(action==='accept'){
        setReviewed(prev=>new Set(prev).add(item.job.id))
        if(result.applicationId)router.push({pathname:'/talent-application/[id]',params:{id:result.applicationId}})
      }
    }catch(e:any){setError(e?.message||'Could not save your response.')}
    finally{setInterestBusy('')}
  }

  async function passCurrent(){
    if(!current||busy)return
    setBusy(true);setError('')
    try{
      await mobileApi('/api/mobile/job-swipes',{method:'POST',body:JSON.stringify({targetId:current.job.id,action:'left'})})
      setPassed(prev=>new Set(prev).add(current.job.id));position.setValue({x:0,y:0})
    }catch(e:any){setError(e?.message||'Could not pass this role.');resetPosition()}
    finally{setBusy(false)}
  }

  async function applyCurrent(){
    if(!current||busy)return
    const id=current.job.id
    setBusy(true);setError('')
    try{
      const result=await mobileApi('/api/mobile/job-swipes',{method:'POST',body:JSON.stringify({targetId:id,action:'right'})})
      setReviewed(prev=>new Set(prev).add(id));position.setValue({x:0,y:0})
      router.push({pathname:'/job/[id]',params:{id,applicationId:result?.applicationId||''}})
    }catch(e:any){setError(e?.message||'Could not open the application journey.');resetPosition()}
    finally{setBusy(false)}
  }

  function animateAction(direction:'left'|'right'){
    if(!current||busy)return
    Animated.timing(position,{toValue:{x:direction==='right'?SCREEN_WIDTH:-SCREEN_WIDTH,y:0},duration:170,useNativeDriver:false}).start(()=>{if(direction==='right')void applyCurrent();else void passCurrent()})
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
    onStartShouldSetPanResponder:()=>false,
    onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>8&&Math.abs(g.dx)>Math.abs(g.dy),
    onPanResponderMove:Animated.event([null,{dx:position.x,dy:position.y}],{useNativeDriver:false}),
    onPanResponderRelease:(_,g)=>{if(g.dx>SWIPE_THRESHOLD)animateAction('right');else if(g.dx< -SWIPE_THRESHOLD)animateAction('left');else resetPosition()},
    onPanResponderTerminate:()=>resetPosition(),
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
          {match?<View style={styles.matchBox}><Text style={styles.matchScore}>{match.score}%</Text><Text style={styles.matchLabel}>MATCH</Text></View>:null}
        </View>
        <Text style={styles.jobTitle}>{job.job_title}</Text>
        <Text style={styles.meta}>{[job.location||employer?.location,job.job_type,job.salary_display_text].filter(Boolean).join(' · ')||'Open for full details'}</Text>
        <Pressable onPress={()=>router.push({pathname:'/job/[id]',params:{id:job.id}})} style={styles.detailsButton}><Text style={styles.detailsText}>View property and role</Text><Text style={styles.arrow}>→</Text></Pressable>
      </View>
    </>
  }

  function interestCard(item:TalentInterest){
    const employer=item.employer||{}
    const propertyName=employer.property_name||employer.company_name||'A wellness property'
    return <View key={item.interest_id} style={styles.interestCard}>
      <View style={styles.interestTop}>
        {employer.logo_url?<Image source={{uri:employer.logo_url}} style={styles.interestLogo}/>:<View style={styles.interestLogoPlaceholder}><Text style={styles.interestInitial}>{propertyName.slice(0,1).toUpperCase()}</Text></View>}
        <View style={{flex:1}}><Text style={styles.interestProperty}>{propertyName}</Text><Text style={styles.interestMeta}>{[item.job.job_title,item.job.location].filter(Boolean).join(' · ')}</Text></View>
      </View>
      <Text style={styles.interestTitle}>They are interested in you.</Text>
      <Text style={styles.interestCopy}>This property has selected your profile for this role. You decide whether the interest becomes mutual.</Text>
      <Pressable onPress={()=>router.push({pathname:'/job/[id]',params:{id:item.job.id}})} style={styles.viewRole}><Text style={styles.viewRoleText}>View role before deciding →</Text></Pressable>
      <View style={styles.interestActions}>
        <Pressable disabled={!!interestBusy} onPress={()=>respondToInterest(item,'decline')} style={styles.declineButton}><Text style={styles.declineText}>{interestBusy===item.interest_id?'Saving…':'Decline'}</Text></Pressable>
        <Pressable disabled={!!interestBusy} onPress={()=>respondToInterest(item,'accept')} style={styles.acceptButton}><Text style={styles.acceptText}>{interestBusy===item.interest_id?'Saving…':'I’m interested too'}</Text></Pressable>
      </View>
    </View>
  }

  if(role==='employer')return <ScrollView style={styles.screen} contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>RECRUITMENT</Text><Text style={styles.title}>Your jobs</Text><Text style={styles.intro}>Create, edit, publish and close roles from one place.</Text>
    <Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:'new'}})} style={styles.primary}><Text style={styles.primaryText}>Post a role</Text></Pressable>
    {loading?<ActivityIndicator color={palette.ink}/>:null}{error?<Text style={styles.error}>{error}</Text>:null}
    {ranked.map(({job,match})=><View key={job.id} style={styles.listCard}><Pressable onPress={()=>router.push({pathname:'/job/[id]',params:{id:job.id}})}>{jobCard(job,match)}</Pressable><Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:job.id}})} style={styles.manage}><Text style={styles.manageText}>Manage role</Text><Text style={styles.arrow}>→</Text></Pressable></View>)}
  </ScrollView>

  return <View style={styles.screen}><ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>OPPORTUNITIES</Text><Text style={styles.title}>Jobs</Text>
    <Text style={styles.intro}>See who is interested in you, then discover roles matched to your profile.</Text>
    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:null}{error?<Text style={styles.error}>{error}</Text>:null}

    {!loading&&pendingInterests.length>0?<View style={styles.interestSection}>
      <Text style={styles.sectionEyebrow}>EMPLOYER INTEREST</Text><Text style={styles.sectionTitle}>{pendingInterests.length===1?'A property wants to meet you.':`${pendingInterests.length} properties are interested in you.`}</Text>
      <Text style={styles.sectionCopy}>Nothing happens automatically. Review each role and choose whether you want to progress.</Text>
      {pendingInterests.map(interestCard)}
    </View>:null}

    {!loading&&activeInterests.length>0?<View style={styles.mutualSection}>
      <Text style={styles.sectionEyebrow}>MUTUAL INTEREST</Text>
      {activeInterests.map(item=><Pressable key={item.interest_id} onPress={()=>router.push({pathname:'/talent-application/[id]',params:{id:item.application_id!}})} style={styles.mutualCard}><View style={{flex:1}}><Text style={styles.mutualTitle}>{item.employer?.property_name||item.employer?.company_name||'Property'} · {item.job.job_title}</Text><Text style={styles.mutualCopy}>You are both interested. Continue the recruitment journey.</Text></View><Text style={styles.arrow}>→</Text></Pressable>)}
    </View>:null}

    {!loading?<View style={styles.discoverHeader}><Text style={styles.sectionEyebrow}>DISCOVER ROLES</Text><Text style={styles.sectionTitle}>Your current matches</Text></View>:null}
    {!loading&&!error&&!current?<View style={styles.empty}><Text style={styles.emptyTitle}>{jobs.length?'You’re up to date.':'No live roles right now.'}</Text><Text style={styles.emptyCopy}>{jobs.length?'You have reviewed every current role. Employer interest will still appear above when a property selects you.':'New matching roles will appear here automatically.'}</Text>{jobs.length?<Pressable onPress={resetDeck} style={styles.reset}><Text style={styles.resetText}>{busy?'Resetting…':'Review current roles again'}</Text></Pressable>:null}</View>:null}
    {!loading&&!error&&current?<>
      <View style={styles.deck}>
        {next?<View style={[styles.card,styles.nextCard]}>{jobCard(next.job,next.match)}</View>:null}
        <Animated.View {...panResponder.panHandlers} style={[styles.card,styles.topCard,{transform:[{translateX:position.x},{translateY:position.y},{rotate}]}]}>
          <Animated.View pointerEvents="none" style={[styles.swipeLabel,styles.passLabel,{opacity:passOpacity}]}><Text style={styles.passLabelText}>PASS</Text></Animated.View>
          <Animated.View pointerEvents="none" style={[styles.swipeLabel,styles.applyLabel,{opacity:applyOpacity}]}><Text style={styles.applyLabelText}>START APPLICATION</Text></Animated.View>
          {jobCard(current.job,current.match)}
        </Animated.View>
      </View>
      <View style={styles.actions}>
        <Pressable onPress={()=>animateAction('left')} disabled={busy} style={[styles.actionButton,styles.passButton]}><Text style={styles.passButtonText}>Pass</Text></Pressable>
        <Pressable onPress={()=>animateAction('right')} disabled={busy} style={[styles.actionButton,styles.applyButton]}><Text style={styles.applyButtonText}>{busy?'Opening…':'Start application'}</Text></Pressable>
      </View>
      <Text style={styles.help}>Open the role to see the property, your match analysis and application support before you submit anything.</Text>
    </>:null}
  </ScrollView></View>
}

const styles=StyleSheet.create({
  screen:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:space.lg,paddingBottom:112,minHeight:'100%'},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,marginBottom:9,fontWeight:'700'},title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:20,maxWidth:350},error:{color:palette.danger,fontSize:12,lineHeight:18,marginVertical:14},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.6,fontWeight:'700'},sectionTitle:{color:palette.inkStrong,fontSize:22,lineHeight:28,fontFamily:type.serif,fontWeight:'400',marginTop:5},sectionCopy:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:6,marginBottom:12},interestSection:{marginBottom:26},mutualSection:{marginBottom:25},discoverHeader:{marginBottom:12},
  interestCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.lineStrong,borderRadius:radius.large,padding:16,marginTop:10},interestTop:{flexDirection:'row',alignItems:'center',gap:11},interestLogo:{width:42,height:42,borderRadius:radius.medium},interestLogoPlaceholder:{width:42,height:42,borderRadius:radius.medium,backgroundColor:palette.sageSoft,alignItems:'center',justifyContent:'center'},interestInitial:{color:palette.inkStrong,fontFamily:type.serif,fontSize:17},interestProperty:{color:palette.inkStrong,fontSize:13,fontWeight:'700'},interestMeta:{color:palette.muted,fontSize:10,lineHeight:15,marginTop:3},interestTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:21,lineHeight:26,marginTop:15},interestCopy:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:6},viewRole:{paddingVertical:11,borderBottomWidth:1,borderBottomColor:palette.line,marginTop:5},viewRoleText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},interestActions:{flexDirection:'row',gap:8,marginTop:12},declineButton:{flex:1,borderWidth:1,borderColor:palette.lineStrong,paddingVertical:12,alignItems:'center',borderRadius:radius.medium},declineText:{color:palette.muted,fontSize:10.5,fontWeight:'700'},acceptButton:{flex:1.4,backgroundColor:palette.inkStrong,paddingVertical:12,alignItems:'center',borderRadius:radius.medium},acceptText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},
  mutualCard:{flexDirection:'row',alignItems:'center',gap:10,backgroundColor:palette.sageSoft,borderRadius:radius.medium,padding:14,marginTop:8},mutualTitle:{color:palette.inkStrong,fontSize:11.5,fontWeight:'700'},mutualCopy:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:3},
  deck:{height:535,position:'relative',marginTop:4},card:{position:'absolute',left:0,right:0,minHeight:500,backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,overflow:'hidden',borderRadius:radius.large,shadowColor:'#13242C',shadowOpacity:.07,shadowRadius:18,shadowOffset:{width:0,height:8},elevation:3},topCard:{zIndex:2},nextCard:{top:10,left:8,right:8,opacity:.52,transform:[{scale:.975}]},hero:{width:'100%',height:190,backgroundColor:palette.stoneDeep},placeholder:{height:180,backgroundColor:palette.stoneDeep,alignItems:'center',justifyContent:'center'},placeholderText:{fontSize:9,letterSpacing:2.2,color:palette.quiet,fontWeight:'700'},cardBody:{padding:18},propertyRow:{flexDirection:'row',alignItems:'center',gap:10},logo:{width:38,height:38,borderRadius:radius.medium,borderWidth:1,borderColor:palette.line},company:{color:palette.text,fontSize:10,textTransform:'uppercase',letterSpacing:.8,fontWeight:'700'},rating:{color:palette.muted,fontSize:9.5,marginTop:3},matchBox:{minWidth:54,alignItems:'flex-end'},matchScore:{color:palette.sage,fontSize:18,fontWeight:'700'},matchLabel:{color:palette.quiet,fontSize:7,letterSpacing:1.1,fontWeight:'700',marginTop:1},jobTitle:{color:palette.inkStrong,fontSize:26,lineHeight:31,fontWeight:'400',fontFamily:type.serif,marginTop:16},meta:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:8},detailsButton:{marginTop:17,paddingTop:13,borderTopWidth:1,borderTopColor:palette.line,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},detailsText:{color:palette.ink,fontSize:11,fontWeight:'700'},arrow:{color:palette.ink,fontSize:15},
  swipeLabel:{position:'absolute',top:22,zIndex:5,borderWidth:1.5,paddingHorizontal:10,paddingVertical:7,backgroundColor:palette.paper,borderRadius:radius.small},passLabel:{left:18,borderColor:palette.danger},applyLabel:{right:18,borderColor:palette.sage},passLabelText:{color:palette.danger,fontSize:10,fontWeight:'800',letterSpacing:1},applyLabelText:{color:palette.sage,fontSize:10,fontWeight:'800',letterSpacing:.8},actions:{flexDirection:'row',gap:10,marginTop:10},actionButton:{flex:1,paddingVertical:14,alignItems:'center',borderRadius:radius.medium},passButton:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.lineStrong},applyButton:{backgroundColor:palette.inkStrong},passButtonText:{color:palette.muted,fontSize:11,fontWeight:'700'},applyButtonText:{color:palette.paper,fontSize:11,fontWeight:'700'},help:{color:palette.quiet,fontSize:9.5,lineHeight:15,marginTop:10,textAlign:'center'},
  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large,marginTop:6},emptyTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:19,fontWeight:'400'},emptyCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5},reset:{alignSelf:'flex-start',marginTop:12,borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:12,paddingVertical:9,borderRadius:radius.medium},resetText:{color:palette.ink,fontSize:10,fontWeight:'700'},
  primary:{backgroundColor:palette.inkStrong,paddingVertical:14,alignItems:'center',borderRadius:radius.medium,marginBottom:14},primaryText:{color:palette.paper,fontSize:11,fontWeight:'700'},listCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,overflow:'hidden',marginBottom:12},manage:{padding:14,borderTopWidth:1,borderTopColor:palette.line,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},manageText:{color:palette.ink,fontSize:10.5,fontWeight:'700'}
})
