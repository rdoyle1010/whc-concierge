import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, Animated, Dimensions, Image, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { calculateMatchScore } from '../src/lib/matching'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
const SCREEN_WIDTH=Dimensions.get('window').width
const SWIPE_THRESHOLD=Math.min(100,SCREEN_WIDTH*.24)

type AccountRole='talent'|'employer'
type Job={id:string;job_title:string;job_image_url?:string|null;location?:string|null;job_type?:string|null;salary_display_text?:string|null;is_featured?:boolean|null;status?:string|null;employer_profiles?:any;[key:string]:any}

export default function JobsScreen(){
 const [role,setRole]=useState<AccountRole>('talent')
 const [jobs,setJobs]=useState<Job[]>([])
 const [candidate,setCandidate]=useState<any>(null)
 const [saved,setSaved]=useState<Set<string>>(new Set())
 const [passed,setPassed]=useState<Set<string>>(new Set())
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState(false)
 const [error,setError]=useState('')
 const [cardIndex,setCardIndex]=useState(0)
 const [lastAction,setLastAction]=useState('')
 const position=useRef(new Animated.ValueXY()).current

 useEffect(()=>{load()},[])

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
  const employerSelect='company_name,property_name,logo_url,property_photos,review_score,review_count,star_rating'

  if(resolved==='employer'){
   const {data:employer}=await supabase.from('employer_profiles').select('id').eq('user_id',user.id).maybeSingle()
   if(!employer){setError('Employer profile not found.');setLoading(false);return}
   const {data,error:queryError}=await supabase.from('job_listings').select(`*,employer_profiles(${employerSelect})`).eq('employer_id',employer.id).order('posted_date',{ascending:false})
   if(queryError)setError(queryError.message)
   setJobs((data||[]) as Job[])
  }else{
   const {data:candidateRow}=await supabase.from('candidate_profiles').select('*').eq('user_id',user.id).maybeSingle()
   setCandidate(candidateRow||null)
   if(candidateRow?.id){
    const [{data:savedRows},swipeData]=await Promise.all([
     supabase.from('saved_jobs').select('job_id').eq('candidate_id',candidateRow.id),
     mobileApi('/api/mobile/job-swipes').catch(()=>({passed_job_ids:[],saved_job_ids:[]})),
    ])
    setSaved(new Set([...(savedRows||[]).map((row:any)=>row.job_id),...(swipeData.saved_job_ids||[])]))
    setPassed(new Set(swipeData.passed_job_ids||[]))
   }
   const now=new Date().toISOString()
   const {data,error:queryError}=await supabase.from('job_listings').select(`*,employer_profiles(${employerSelect})`).eq('is_live',true).or(`expires_at.is.null,expires_at.gt.${now}`).order('is_featured',{ascending:false}).order('posted_date',{ascending:false})
   if(queryError)setError(queryError.message)
   setJobs((data||[]) as Job[])
  }
  setCardIndex(0)
  position.setValue({x:0,y:0})
  setLoading(false)
 }

 const rankedJobs=useMemo(()=>{
  const available=role==='talent'?jobs.filter(job=>!passed.has(job.id)&&!saved.has(job.id)):jobs
  if(role!=='talent'||!candidate)return available.map(job=>({job,match:null as any}))
  return available.map(job=>({job,match:calculateMatchScore(candidate,job)})).sort((a,b)=>Number(Boolean(b.job.is_featured))-Number(Boolean(a.job.is_featured))||Number(b.match?.score||0)-Number(a.match?.score||0))
 },[jobs,candidate,role,passed,saved])

 const current=rankedJobs[cardIndex]
 const next=rankedJobs[cardIndex+1]

 function resetPosition(){Animated.spring(position,{toValue:{x:0,y:0},useNativeDriver:false,friction:5}).start()}

 async function completeSwipe(direction:'left'|'right'){
  if(!current||busy)return
  setBusy(true);setError('')
  try{
   await mobileApi('/api/mobile/job-swipes',{method:'POST',body:JSON.stringify({targetId:current.job.id,action:direction})})
   if(direction==='right'){
    setSaved(prev=>new Set(prev).add(current.job.id))
    setLastAction('Saved')
   }else{
    setPassed(prev=>new Set(prev).add(current.job.id))
    setLastAction('Passed')
   }
   setCardIndex(0)
   position.setValue({x:0,y:0})
  }catch(e:any){setError(e?.message||'Could not save your swipe.');resetPosition()}
  finally{setBusy(false)}
 }

 function triggerSwipe(direction:'left'|'right'){
  if(!current||busy)return
  Animated.timing(position,{toValue:{x:direction==='right'?SCREEN_WIDTH:-SCREEN_WIDTH,y:0},duration:180,useNativeDriver:false}).start(()=>completeSwipe(direction))
 }

 async function resetSwipeDeck(){
  if(busy)return
  setBusy(true);setError('')
  try{
   await mobileApi('/api/mobile/job-swipes',{method:'DELETE'})
   setSaved(new Set())
   setPassed(new Set())
   setCardIndex(0)
   setLastAction('Swipe deck reset')
   position.setValue({x:0,y:0})
   await load()
  }catch(e:any){setError(e?.message||'Could not reset your swipe deck.')}
  finally{setBusy(false)}
 }

 const panResponder=useMemo(()=>PanResponder.create({
  onStartShouldSetPanResponder:()=>true,
  onMoveShouldSetPanResponder:(_,g)=>Math.abs(g.dx)>4,
  onPanResponderMove:Animated.event([null,{dx:position.x,dy:position.y}],{useNativeDriver:false}),
  onPanResponderRelease:(_,g)=>{
   if(g.dx>SWIPE_THRESHOLD)triggerSwipe('right')
   else if(g.dx< -SWIPE_THRESHOLD)triggerSwipe('left')
   else resetPosition()
  },
 }),[current?.job.id,busy])

 const rotate=position.x.interpolate({inputRange:[-SCREEN_WIDTH/2,0,SCREEN_WIDTH/2],outputRange:['-8deg','0deg','8deg'],extrapolate:'clamp'})
 const saveOpacity=position.x.interpolate({inputRange:[0,SWIPE_THRESHOLD],outputRange:[0,1],extrapolate:'clamp'})
 const passOpacity=position.x.interpolate({inputRange:[-SWIPE_THRESHOLD,0],outputRange:[1,0],extrapolate:'clamp'})

 function renderJobContent(job:Job,match:any){
  const employer=Array.isArray(job.employer_profiles)?job.employer_profiles[0]:job.employer_profiles
  const company=employer?.property_name||employer?.company_name||'Wellness employer'
  const photos=Array.isArray(employer?.property_photos)?employer.property_photos:[]
  const image=job.job_image_url||photos[0]||null
  const rating=Number(employer?.review_score||employer?.star_rating||0)
  const reviews=Number(employer?.review_count||0)
  return <>
   {image?<Image source={{uri:image}} style={styles.jobImage}/>:<View style={styles.imagePlaceholder}><Text style={styles.placeholderText}>WELLNESS HOUSE</Text></View>}
   <View style={styles.contentPad}>
    <View style={styles.propertyLine}>
     {employer?.logo_url?<Image source={{uri:employer.logo_url}} style={styles.logo}/>:null}
     <View style={{flex:1}}><Text style={styles.company}>{company}</Text><Text style={styles.rating}>{rating>0?`${rating.toFixed(1)} ★${reviews?` · ${reviews} reviews`:''}`:'New property'}</Text></View>
     {match?<Text style={styles.match}>{match.score}% MATCH</Text>:null}
    </View>
    <Text style={styles.jobTitle}>{job.job_title}</Text>
    <Text style={styles.meta}>{[job.location,job.job_type,job.salary_display_text].filter(Boolean).join(' · ')||'Details available inside'}</Text>
    <Text style={styles.view}>Tap for hotel, photos, reviews and full role →</Text>
   </View>
  </>
 }

 if(role==='talent')return <View style={styles.swipeScreen}>
  <ScrollView style={styles.scroll} contentContainerStyle={styles.swipePage} scrollEnabled={!current}>
   <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
   <Text style={styles.eyebrow}>OPPORTUNITIES</Text>
   <Text style={styles.title}>Your matched roles</Text>
   <Text style={styles.intro}>Swipe the whole card right to save or left to pass. Tap Details if you want to see the hotel, reviews, photos and full role first.</Text>
   {loading?<ActivityIndicator color="#092b45" style={{marginTop:26}}/>:null}
   {error?<Text style={styles.error}>{error}</Text>:null}
   {!loading&&!error&&!current?<View style={styles.empty}>
    <Text style={styles.emptyTitle}>{jobs.length?'You’ve reviewed every live role.':'Nothing to show yet.'}</Text>
    <Text style={styles.emptyCopy}>{jobs.length?'Reset the swipe deck to bring the current live roles back and swipe them again.':'New live opportunities will appear here.'}</Text>
    {jobs.length?<Pressable onPress={resetSwipeDeck} disabled={busy} style={styles.resetButton}><Text style={styles.resetText}>{busy?'Resetting…':'Reset swipe deck'}</Text></Pressable>:null}
   </View>:null}
   {!loading&&!error&&current?<View style={styles.deck}>
    {next?<View style={[styles.swipeCard,styles.nextCard]}>{renderJobContent(next.job,next.match)}</View>:null}
    <Animated.View {...panResponder.panHandlers} style={[styles.swipeCard,styles.topCard,{transform:[{translateX:position.x},{translateY:position.y},{rotate}]}]}>
     <Animated.View pointerEvents="none" style={[styles.decisionBadge,styles.passBadge,{opacity:passOpacity}]}><Text style={styles.passText}>PASS</Text></Animated.View>
     <Animated.View pointerEvents="none" style={[styles.decisionBadge,styles.saveBadge,{opacity:saveOpacity}]}><Text style={styles.saveText}>SAVE</Text></Animated.View>
     {renderJobContent(current.job,current.match)}
    </Animated.View>
   </View>:null}
   {current?<>
    <View style={styles.swipeActions}>
     <Pressable onPress={()=>triggerSwipe('left')} disabled={busy} style={[styles.circleButton,styles.passCircle]}><Text style={styles.circleSymbol}>×</Text><Text style={styles.circleLabel}>Pass</Text></Pressable>
     <Pressable onPress={()=>router.push({pathname:'/job/[id]',params:{id:current.job.id}})} style={[styles.circleButton,styles.viewCircle]}><Text style={styles.infoSymbol}>i</Text><Text style={styles.circleLabel}>Details</Text></Pressable>
     <Pressable onPress={()=>triggerSwipe('right')} disabled={busy} style={[styles.circleButton,styles.saveCircle]}><Text style={styles.heartSymbol}>♡</Text><Text style={styles.circleLabel}>Save</Text></Pressable>
    </View>
    <Text style={styles.progress}>{rankedJobs.length} role{rankedJobs.length===1?'':'s'} left{lastAction?` · ${lastAction}`:''}</Text>
   </>:null}
   <Pressable onPress={()=>router.push('/saved')} style={styles.savedLink}><Text style={styles.savedLinkText}>View saved roles ({saved.size}) →</Text></Pressable>
  </ScrollView>
 </View>

 return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
  <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
  <Text style={styles.eyebrow}>RECRUITMENT</Text><Text style={styles.title}>Your jobs</Text>
  <Text style={styles.intro}>Create, edit, publish, close and manage your current roles.</Text>
  <Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:'new'}})} style={styles.postButton}><Text style={styles.postButtonText}>+ Post a role</Text></Pressable>
  {loading?<ActivityIndicator color="#092b45"/>:null}{error?<Text style={styles.error}>{error}</Text>:null}
  <View style={styles.list}>{rankedJobs.map(({job,match})=><View key={job.id} style={styles.card}><Pressable onPress={()=>router.push({pathname:'/job/[id]',params:{id:job.id}})}>{renderJobContent(job,match)}</Pressable><Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:job.id}})} style={styles.action}><Text style={styles.actionText}>Manage role →</Text></Pressable></View>)}</View>
 </ScrollView>
}

const styles=StyleSheet.create({
 scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:18,paddingBottom:40},swipeScreen:{flex:1,backgroundColor:'#f7f8f8'},swipePage:{paddingHorizontal:20,paddingTop:18,paddingBottom:110,minHeight:'100%'},back:{color:'#66747c',fontSize:14,marginBottom:28},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:9},title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'500'},intro:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:9,marginBottom:18},error:{color:'#9b2c2c',fontSize:12,marginBottom:18},
 deck:{height:545,marginTop:4,position:'relative'},swipeCard:{position:'absolute',left:0,right:0,borderWidth:1,borderColor:'#d9e0e3',backgroundColor:'#fff',minHeight:500,overflow:'hidden',shadowColor:'#0b2f4d',shadowOpacity:.10,shadowRadius:16,shadowOffset:{width:0,height:8},elevation:4},topCard:{zIndex:2},nextCard:{top:10,left:8,right:8,opacity:.55,transform:[{scale:.975}]},jobImage:{width:'100%',height:190,backgroundColor:'#eef2f4'},imagePlaceholder:{height:170,backgroundColor:'#edf2f4',alignItems:'center',justifyContent:'center'},placeholderText:{fontSize:10,letterSpacing:2,color:'#71808a'},contentPad:{padding:18},propertyLine:{flexDirection:'row',alignItems:'center',gap:9},logo:{width:38,height:38,borderRadius:8,borderWidth:1,borderColor:'#e4e9eb'},company:{color:'#173246',fontSize:11,textTransform:'uppercase',letterSpacing:.6,fontWeight:'700'},rating:{color:'#526976',fontSize:9.5,marginTop:3},match:{color:'#092b45',borderWidth:1,borderColor:'#cdd8dd',paddingHorizontal:7,paddingVertical:4,fontSize:8,fontWeight:'700'},jobTitle:{color:'#173246',fontSize:22,lineHeight:28,fontWeight:'600',marginTop:13},meta:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:7},view:{color:'#092b45',fontSize:11,fontWeight:'700',marginTop:14},
 decisionBadge:{position:'absolute',top:24,zIndex:10,borderWidth:2,paddingHorizontal:12,paddingVertical:7},passBadge:{right:18,borderColor:'#9b2c2c'},saveBadge:{left:18,borderColor:'#315846'},passText:{color:'#9b2c2c',fontSize:18,fontWeight:'900'},saveText:{color:'#315846',fontSize:18,fontWeight:'900'},swipeActions:{flexDirection:'row',justifyContent:'center',gap:22,marginTop:14},circleButton:{width:72,height:72,borderRadius:36,alignItems:'center',justifyContent:'center',borderWidth:1.5},passCircle:{borderColor:'#c98989'},viewCircle:{borderColor:'#9aaab2'},saveCircle:{borderColor:'#7ca08d'},circleSymbol:{color:'#9b2c2c',fontSize:28},heartSymbol:{color:'#315846',fontSize:25},infoSymbol:{color:'#092b45',fontSize:20,fontWeight:'700'},circleLabel:{color:'#526976',fontSize:9,fontWeight:'700',marginTop:2},progress:{textAlign:'center',color:'#71808a',fontSize:10,marginTop:10},savedLink:{alignItems:'center',paddingVertical:22},savedLinkText:{color:'#092b45',fontSize:12,fontWeight:'700'},
 empty:{backgroundColor:'#fff',borderWidth:1,borderColor:'#dce3e7',padding:22,marginTop:8},emptyTitle:{color:'#173246',fontSize:16,fontWeight:'600'},emptyCopy:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:6},resetButton:{backgroundColor:'#092b45',paddingVertical:13,alignItems:'center',marginTop:16},resetText:{color:'#fff',fontSize:11,fontWeight:'800'},postButton:{backgroundColor:'#092b45',paddingVertical:15,alignItems:'center',marginBottom:20},postButtonText:{color:'#fff',fontSize:13,fontWeight:'700'},list:{gap:12},card:{borderWidth:1,borderColor:'#dce3e7',backgroundColor:'#fff',overflow:'hidden'},action:{margin:18,marginTop:0,borderTopWidth:1,borderTopColor:'#eef1f2',paddingTop:12},actionText:{color:'#092b45',fontSize:11,fontWeight:'700'}
})