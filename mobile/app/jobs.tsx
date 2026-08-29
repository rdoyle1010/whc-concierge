import { useCallback, useMemo, useState } from 'react'
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { calculateMatchScore } from '../src/lib/matching'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
type Role='talent'|'employer'
type Job={id:string;job_title:string;job_description?:string|null;job_image_url?:string|null;location?:string|null;job_type?:string|null;contract_type?:string|null;salary_display_text?:string|null;is_featured?:boolean|null;posted_date?:string|null;employer_id?:string|null;employer_profiles?:any;[key:string]:any}

type AppState={id:string;status:string}

export default function JobsScreen(){
  const [role,setRole]=useState<Role>('talent')
  const [jobs,setJobs]=useState<Job[]>([])
  const [candidate,setCandidate]=useState<any>(null)
  const [passed,setPassed]=useState<Set<string>>(new Set())
  const [saved,setSaved]=useState<Set<string>>(new Set())
  const [applications,setApplications]=useState<Record<string,AppState>>({})
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')

  useFocusEffect(useCallback(()=>{void load()},[]))

  async function api(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}${path}`,{
      ...options,
      headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',...(options?.headers||{})},
    })
    const body=await response.json().catch(()=>({}))
    if(!response.ok){const err:any=new Error(body?.error||'Could not complete this request.');err.payload=body;err.status=response.status;throw err}
    return body
  }

  async function load(){
    setLoading(true);setError('')
    try{
      const {data:{user}}=await supabase.auth.getUser()
      if(!user){router.replace('/login');return}
      const {data:account}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
      const resolved:Role=account?.role==='employer'?'employer':'talent'
      setRole(resolved)
      const employerSelect='id,company_name,property_name,logo_url,property_photos,review_score,review_count,star_rating,location,postcode'

      if(resolved==='employer'){
        const {data:employer}=await supabase.from('employer_profiles').select('id').eq('user_id',user.id).maybeSingle()
        if(!employer){setError('Employer profile not found.');return}
        const {data,error:jobError}=await supabase.from('job_listings').select(`*,employer_profiles(${employerSelect})`).eq('employer_id',employer.id).order('posted_date',{ascending:false})
        if(jobError)throw jobError
        setJobs((data||[]) as Job[])
        return
      }

      const {data:candidateRow}=await supabase.from('candidate_profiles').select('*').eq('user_id',user.id).maybeSingle()
      setCandidate(candidateRow||null)

      const [swipeData,savedData]=await Promise.all([
        api('/api/mobile/job-swipes').catch(()=>({passed_job_ids:[]})),
        api('/api/saved-jobs').catch(()=>({saved:[]})),
      ])
      setPassed(new Set(swipeData.passed_job_ids||[]))
      setSaved(new Set((savedData.saved||[]).map((row:any)=>row.job_id)))

      if(candidateRow?.id){
        const {data:apps,error:appsError}=await supabase.from('applications').select('id,role_id,status').eq('candidate_id',candidateRow.id)
        if(appsError)throw appsError
        const state:Record<string,AppState>={}
        for(const app of apps||[]){if(app.role_id)state[app.role_id]={id:app.id,status:app.status}}
        setApplications(state)
      }else setApplications({})

      const now=new Date().toISOString()
      const {data,error:jobError}=await supabase.from('job_listings').select(`*,employer_profiles(${employerSelect})`).eq('is_live',true).or(`expires_at.is.null,expires_at.gt.${now}`).order('is_featured',{ascending:false}).order('posted_date',{ascending:false})
      if(jobError)throw jobError
      setJobs((data||[]) as Job[])
    }catch(e:any){setError(e?.message||'Could not load jobs.')}
    finally{setLoading(false)}
  }

  const ranked=useMemo(()=>{
    const visible=role==='talent'?jobs.filter(job=>!passed.has(job.id)):jobs
    if(role!=='talent'||!candidate)return visible.map(job=>({job,match:null as any}))
    return visible.map(job=>({job,match:calculateMatchScore(candidate,job)}))
      .sort((a,b)=>Number(Boolean(b.job.is_featured))-Number(Boolean(a.job.is_featured))||Number(b.match?.score||0)-Number(a.match?.score||0))
  },[jobs,candidate,role,passed])

  async function pass(job:Job){
    if(busy)return
    setBusy(`pass-${job.id}`);setError('')
    try{
      await api('/api/mobile/job-swipes',{method:'POST',body:JSON.stringify({targetId:job.id,action:'left'})})
      setPassed(current=>new Set(current).add(job.id))
    }catch(e:any){setError(e?.message||'Could not save your pass.')}
    finally{setBusy('')}
  }

  async function toggleSave(job:Job){
    if(busy)return
    const isSaved=saved.has(job.id)
    setBusy(`save-${job.id}`);setError('')
    try{
      await api('/api/saved-jobs',{method:isSaved?'DELETE':'POST',body:JSON.stringify({jobId:job.id})})
      setSaved(current=>{const next=new Set(current);if(isSaved)next.delete(job.id);else next.add(job.id);return next})
    }catch(e:any){setError(e?.message||'Could not update saved jobs.')}
    finally{setBusy('')}
  }

  async function interested(job:Job){
    if(busy)return
    const existing=applications[job.id]
    if(existing){
      if(existing.status==='draft')router.push({pathname:'/job/[id]',params:{id:job.id}})
      else router.push({pathname:'/talent-application/[id]',params:{id:existing.id}})
      return
    }
    setBusy(`apply-${job.id}`);setError('')
    try{
      const data=await api('/api/applications/draft',{method:'POST',body:JSON.stringify({jobId:job.id})})
      setApplications(current=>({...current,[job.id]:{id:data.applicationId,status:'draft'}}))
      router.push({pathname:'/job/[id]',params:{id:job.id}})
    }catch(e:any){
      if(e?.payload?.applicationId){
        setApplications(current=>({...current,[job.id]:{id:String(e.payload.applicationId),status:'pending'}}))
        router.push({pathname:'/talent-application/[id]',params:{id:String(e.payload.applicationId)}})
      }else setError(e?.message||'Could not start your application.')
    }finally{setBusy('')}
  }

  function jobCard(job:Job,match:any){
    const employer=Array.isArray(job.employer_profiles)?job.employer_profiles[0]:job.employer_profiles
    const photos=Array.isArray(employer?.property_photos)?employer.property_photos:[]
    const image=job.job_image_url||photos[0]||null
    const rating=Number(employer?.review_score||employer?.star_rating||0)
    const reviews=Number(employer?.review_count||0)
    const app=applications[job.id]
    const eligible=Boolean(match&&match.score>=45&&!match.hardStop)
    const below=Boolean(match&&match.score<45&&!match.hardStop)
    return <View key={job.id} style={styles.card}>
      {image?<Image source={{uri:image}} style={styles.hero}/>:<View style={styles.placeholder}><Text style={styles.placeholderText}>WELLNESS HOUSE</Text></View>}
      <View style={styles.cardBody}>
        <View style={styles.propertyRow}>
          {employer?.logo_url?<Image source={{uri:employer.logo_url}} style={styles.logo}/>:null}
          <View style={{flex:1}}><Text style={styles.company}>{employer?.property_name||employer?.company_name||'Wellness employer'}</Text><Text style={styles.rating}>{rating>0?`${rating.toFixed(1)} ★${reviews?` · ${reviews} reviews`:''}`:'New property'}</Text></View>
          {match?<View style={styles.matchBox}><Text style={styles.matchScore}>{match.score}%</Text><Text style={styles.matchLabel}>MATCH</Text></View>:null}
        </View>
        <Text style={styles.jobTitle}>{job.job_title}</Text>
        <Text style={styles.meta}>{[job.location||employer?.location,job.contract_type||job.job_type,job.salary_display_text].filter(Boolean).join(' · ')||'Open for full details'}</Text>
        {job.job_description?<Text numberOfLines={3} style={styles.description}>{job.job_description}</Text>:null}

        {match?<View style={[styles.eligibility,eligible&&styles.eligible,match.hardStop&&styles.blocked,below&&styles.below]}>
          <Text style={styles.eligibilityTitle}>{eligible?'Eligible to apply':match.hardStop?'Mandatory requirement missing':below?'Below match threshold':'Eligibility not available'}</Text>
          <Text style={styles.eligibilityCopy}>{eligible?'Your profile clears the 45% match threshold and mandatory requirements.':match.hardStop?(match.hardStopReason||'A mandatory requirement is missing.'):below?`Your current match is ${match.score}%. Applications open at 45%.`:'Complete your profile to calculate eligibility.'}</Text>
        </View>:null}

        <Pressable onPress={()=>router.push({pathname:'/job/[id]',params:{id:job.id}})} style={styles.details}><Text style={styles.detailsText}>Details</Text><Text style={styles.arrow}>→</Text></Pressable>
        <View style={styles.actions}>
          <Pressable disabled={!!busy} onPress={()=>pass(job)} style={styles.secondary}><Text style={styles.secondaryText}>{busy===`pass-${job.id}`?'Saving…':'Pass'}</Text></Pressable>
          <Pressable disabled={!!busy} onPress={()=>toggleSave(job)} style={[styles.secondary,saved.has(job.id)&&styles.saved]}><Text style={[styles.secondaryText,saved.has(job.id)&&styles.savedText]}>{busy===`save-${job.id}`?'Saving…':saved.has(job.id)?'Saved':'Save'}</Text></Pressable>
        </View>

        {app?.status==='draft'?<Pressable onPress={()=>interested(job)} style={styles.primary}><Text style={styles.primaryText}>Review draft</Text></Pressable>
        :app?<Pressable onPress={()=>interested(job)} style={styles.applicationSent}><Text style={styles.applicationSentText}>Application submitted · View progress</Text></Pressable>
        :eligible?<Pressable disabled={!!busy} onPress={()=>interested(job)} style={styles.primary}><Text style={styles.primaryText}>{busy===`apply-${job.id}`?'Starting…':'Interested — review application'}</Text></Pressable>
        :<View style={styles.disabledButton}><Text style={styles.disabledText}>{match?.hardStop?'Requirement missing':below?'Below 45% match':'Complete profile'}</Text></View>}
      </View>
    </View>
  }

  if(role==='employer')return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>RECRUITMENT</Text><Text style={styles.title}>Your jobs</Text><Text style={styles.intro}>Create, edit, publish and close roles from one place.</Text>
    <Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:'new'}})} style={styles.primary}><Text style={styles.primaryText}>Post a role</Text></Pressable>
    {loading?<ActivityIndicator color={palette.ink}/>:null}{error?<Text style={styles.error}>{error}</Text>:null}
    {ranked.map(({job})=><View key={job.id} style={styles.employerCard}><Text style={styles.jobTitle}>{job.job_title}</Text><Text style={styles.meta}>{[job.location,job.status||job.is_live?'Live':'Closed'].filter(Boolean).join(' · ')}</Text><Pressable onPress={()=>router.push({pathname:'/employer-job/[id]',params:{id:job.id}})} style={styles.details}><Text style={styles.detailsText}>Manage role</Text><Text style={styles.arrow}>→</Text></Pressable></View>)}
  </ScrollView>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Text style={styles.eyebrow}>YOUR MATCHES</Text><Text style={styles.title}>Browse Roles</Text>
    <Text style={styles.intro}>The same journey as the website: review matched roles, Pass, Save, or choose Interested to build and review your application before anything is sent.</Text>
    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}
    {!loading&&!error&&ranked.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No roles to show right now.</Text><Text style={styles.emptyCopy}>New live roles will appear here automatically. Passed roles stay hidden.</Text></View>:null}
    {!loading&&!error?<View style={styles.list}>{ranked.map(({job,match})=>jobCard(job,match))}</View>:null}
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:space.lg,paddingBottom:115},eyebrow:{color:palette.sage,fontSize:8,letterSpacing:2,fontWeight:'800',marginBottom:9},title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontFamily:type.serif,fontWeight:'400'},intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:20},list:{gap:14},
  card:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,overflow:'hidden'},hero:{width:'100%',height:142,backgroundColor:palette.stoneDeep},placeholder:{height:120,backgroundColor:palette.stoneDeep,alignItems:'center',justifyContent:'center'},placeholderText:{fontSize:8,letterSpacing:2,color:palette.quiet,fontWeight:'800'},cardBody:{padding:16},propertyRow:{flexDirection:'row',alignItems:'center',gap:10},logo:{width:42,height:42,borderRadius:radius.small,backgroundColor:palette.paper},company:{fontSize:11,fontWeight:'800',color:palette.inkStrong},rating:{fontSize:9.5,color:palette.muted,marginTop:3},matchBox:{alignItems:'flex-end'},matchScore:{fontSize:20,fontWeight:'800',color:palette.sage},matchLabel:{fontSize:7,letterSpacing:1.1,fontWeight:'800',color:palette.quiet},jobTitle:{fontFamily:type.serif,fontSize:23,lineHeight:28,color:palette.inkStrong,marginTop:12},meta:{fontSize:10.5,lineHeight:16,color:palette.muted,marginTop:5},description:{fontSize:10.5,lineHeight:17,color:palette.text,marginTop:10},
  eligibility:{borderLeftWidth:2,borderLeftColor:palette.lineStrong,backgroundColor:palette.stoneDeep,padding:11,marginTop:12},eligible:{borderLeftColor:palette.sage,backgroundColor:palette.sageSoft},blocked:{borderLeftColor:palette.danger,backgroundColor:palette.dangerSoft},below:{borderLeftColor:'#B68C46',backgroundColor:'#FDF6EC'},eligibilityTitle:{fontSize:10,fontWeight:'800',color:palette.inkStrong},eligibilityCopy:{fontSize:9.5,lineHeight:15,color:palette.muted,marginTop:3},
  details:{borderTopWidth:1,borderTopColor:palette.line,marginTop:13,paddingTop:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},detailsText:{fontSize:10.5,fontWeight:'700',color:palette.ink},arrow:{fontSize:15,color:palette.ink},actions:{flexDirection:'row',gap:8,marginTop:12},secondary:{flex:1,borderWidth:1,borderColor:palette.lineStrong,borderRadius:radius.medium,paddingVertical:11,alignItems:'center'},secondaryText:{fontSize:10,fontWeight:'700',color:palette.muted},saved:{backgroundColor:'#FDF6EC',borderColor:'#EADFC9'},savedText:{color:'#9A7436'},primary:{backgroundColor:palette.inkStrong,borderRadius:radius.medium,paddingVertical:13,alignItems:'center',marginTop:9},primaryText:{fontSize:10.5,fontWeight:'800',color:palette.paper},applicationSent:{backgroundColor:palette.sageSoft,borderRadius:radius.medium,paddingVertical:13,alignItems:'center',marginTop:9},applicationSentText:{fontSize:10.5,fontWeight:'800',color:palette.sage},disabledButton:{backgroundColor:palette.stoneDeep,borderRadius:radius.medium,paddingVertical:13,alignItems:'center',marginTop:9,opacity:.75},disabledText:{fontSize:10.5,fontWeight:'700',color:palette.quiet},
  employerCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:16,marginBottom:12},empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:20},emptyTitle:{fontFamily:type.serif,fontSize:20,color:palette.inkStrong},emptyCopy:{fontSize:11,lineHeight:17,color:palette.muted,marginTop:6},error:{fontSize:11,lineHeight:17,color:palette.danger,marginBottom:12}
})