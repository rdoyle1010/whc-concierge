import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
type Role='talent'|'employer'
type Application={id:string;status:string;match_score:number|null;created_at:string|null;archived_at?:string|null;hired_at?:string|null;candidate_id:string;role_id:string;job_listings?:any;candidate_profiles?:any}
const statusCopy:Record<string,string>={draft:'Draft',pending:'Applied',reviewed:'Reviewed',shortlisted:'Shortlisted',interview:'Interview',offered:'Offer',accepted:'Accepted',rejected:'Not progressing',withdrawn:'Withdrawn'}
const ACTIVE_STATUSES=new Set(['draft','pending','reviewed','shortlisted','interview','offered','accepted'])
function fmt(v?:string|null){if(!v)return '—';const d=new Date(v);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
function method(v:string){return v==='teams'?'Microsoft Teams':v==='video'?'Video call':v==='phone'?'Phone call':'In person'}

export default function ApplicationsScreen(){
  const [role,setRole]=useState<Role>('talent')
  const [items,setItems]=useState<Application[]>([])
  const [hired,setHired]=useState<any[]>([])
  const [mode,setMode]=useState<'active'|'hired'>('active')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [expanded,setExpanded]=useState('')
  const [busy,setBusy]=useState('')

  useEffect(()=>{void load()},[])

  async function authFetch(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired.')
    const res=await fetch(`${WEB_URL}${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`,...(options?.headers||{})}})
    const body=await res.json().catch(()=>({}))
    if(!res.ok)throw new Error(body.error||'Could not load recruitment records.')
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
      if(resolved==='talent'){
        const {data:candidate}=await supabase.from('candidate_profiles').select('id').eq('user_id',user.id).maybeSingle()
        if(candidate){
          const {data,error:queryError}=await supabase.from('applications').select('id,status,match_score,created_at,archived_at,hired_at,candidate_id,role_id,job_listings(job_title,location,employer_profiles(property_name,company_name))').eq('candidate_id',candidate.id).order('created_at',{ascending:false})
          if(queryError)throw queryError
          setItems((data||[]) as Application[])
        }
      }else{
        const {data:employer}=await supabase.from('employer_profiles').select('id').eq('user_id',user.id).maybeSingle()
        if(employer){
          const {data:jobs}=await supabase.from('job_listings').select('id').eq('employer_id',employer.id)
          const ids=(jobs||[]).map(j=>j.id)
          if(ids.length){
            const {data,error:queryError}=await supabase.from('applications').select('id,status,match_score,created_at,archived_at,hired_at,candidate_id,role_id,job_listings(job_title,location),candidate_profiles(full_name,headline,role_level)').in('role_id',ids).order('created_at',{ascending:false})
            if(queryError)throw queryError
            setItems((data||[]) as Application[])
          }
        }
      }
      const history=await authFetch('/api/mobile/hired')
      setHired(history.items||[])
    }catch(e:any){setError(e?.message||'Could not load applications.')}
    finally{setLoading(false)}
  }

  const live=useMemo(()=>items.filter(item=>!item.archived_at&&!item.hired_at&&ACTIVE_STATUSES.has(String(item.status||'').toLowerCase())),[items])

  async function withdraw(item:Application){
    const {error:updateError}=await supabase.from('applications').update({status:'withdrawn',updated_at:new Date().toISOString()}).eq('id',item.id)
    if(updateError){setError(updateError.message);return}
    setItems(current=>current.map(row=>row.id===item.id?{...row,status:'withdrawn'}:row))
  }

  async function reopen(id:string){
    Alert.alert('Reopen recruitment record?','The vacancy stays closed. This only moves the candidate record back into active recruitment.',[
      {text:'Cancel',style:'cancel'},
      {text:'Reopen',onPress:async()=>{setBusy(id);try{await authFetch('/api/mobile/hired',{method:'POST',body:JSON.stringify({applicationId:id,action:'reopen_record'})});await load();setMode('active')}catch(e:any){setError(e?.message||'Could not reopen record.')}finally{setBusy('')}}},
    ])
  }

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>RECRUITMENT</Text><Text style={styles.title}>Applications</Text>
    <Text style={styles.intro}>{mode==='active'?(role==='employer'?'Candidates currently moving through recruitment.':'Your active recruitment, in one place.'):role==='employer'?'Completed hires and preserved recruitment history.':'Your completed placements and recruitment history.'}</Text>
    <View style={styles.tabs}><Pressable onPress={()=>setMode('active')} style={[styles.tab,mode==='active'&&styles.tabActive]}><Text style={[styles.tabText,mode==='active'&&styles.tabActiveText]}>Active {live.length}</Text></Pressable><Pressable onPress={()=>setMode('hired')} style={[styles.tab,mode==='hired'&&styles.tabActive]}><Text style={[styles.tabText,mode==='hired'&&styles.tabActiveText]}>Hired {hired.length}</Text></Pressable></View>
    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:null}{error?<Text style={styles.error}>{error}</Text>:null}
    {!loading&&mode==='active'&&live.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No active applications.</Text><Text style={styles.emptyCopy}>{role==='talent'?'Browse Jobs when you are ready to start something new.':'New applications will appear here as candidates move into your recruitment journey.'}</Text></View>:null}
    {mode==='active'?<View style={styles.list}>{live.map(item=>{const job=Array.isArray(item.job_listings)?item.job_listings[0]:item.job_listings,employer=Array.isArray(job?.employer_profiles)?job?.employer_profiles[0]:job?.employer_profiles,candidate=Array.isArray(item.candidate_profiles)?item.candidate_profiles[0]:item.candidate_profiles;return <View key={item.id} style={styles.card}><View style={styles.topRow}><Text style={styles.status}>{statusCopy[item.status]||item.status}</Text>{item.match_score?<Text style={styles.score}>{item.match_score}% match</Text>:null}</View><Text style={styles.cardTitle}>{role==='talent'?(job?.job_title||'Role'):(candidate?.full_name||'Candidate')}</Text><Text style={styles.meta}>{role==='talent'?[employer?.property_name||employer?.company_name,job?.location].filter(Boolean).join(' · '):[candidate?.headline||candidate?.role_level,job?.job_title].filter(Boolean).join(' · ')}</Text>{role==='talent'?<Pressable onPress={()=>router.push({pathname:'/talent-application/[id]',params:{id:item.id}})} style={styles.manage}><Text style={styles.manageText}>{['interview','offered','accepted'].includes(item.status)?'View and respond':'View application progress'}</Text><Text style={styles.arrow}>→</Text></Pressable>:null}{role==='talent'&&!['accepted','rejected','offered'].includes(item.status)?<Pressable onPress={()=>withdraw(item)}><Text style={styles.withdraw}>Withdraw interest</Text></Pressable>:null}{role==='employer'?<Pressable onPress={()=>router.push({pathname:'/application/[id]',params:{id:item.id}})} style={styles.manage}><Text style={styles.manageText}>Manage candidate</Text><Text style={styles.arrow}>→</Text></Pressable>:null}</View>})}</View>:null}
    {!loading&&mode==='hired'&&!hired.length?<View style={styles.empty}><Text style={styles.emptyTitle}>{role==='talent'?'No completed placements yet.':'No completed hires yet.'}</Text><Text style={styles.emptyCopy}>Completed recruitment records will appear here automatically.</Text></View>:null}
    {mode==='hired'?<View style={styles.list}>{hired.map(item=>{const person=role==='talent'?item.employer:item.candidate,job=item.job||{},open=expanded===item.id;return <View key={item.id} style={styles.card}><Text style={styles.hiredStatus}>HIRED</Text><Text style={styles.cardTitle}>{role==='talent'?(job.job_title||'Role'):(person?.full_name||'Candidate')}</Text><Text style={styles.meta}>{role==='talent'?[person?.property_name||person?.company_name,job.location].filter(Boolean).join(' · '):[job.job_title,person?.headline,person?.location].filter(Boolean).join(' · ')}</Text><Text style={styles.date}>Hired {fmt(item.hired_at)} · Archived {fmt(item.archived_at)}</Text><Pressable onPress={()=>setExpanded(open?'':item.id)} style={styles.manage}><Text style={styles.manageText}>{open?'Hide recruitment history':'View recruitment history'}</Text><Text style={styles.arrow}>→</Text></Pressable>{role==='employer'?<Pressable disabled={busy===item.id} onPress={()=>reopen(item.id)}><Text style={styles.reopen}>{busy===item.id?'Reopening...':'Reopen record'}</Text></Pressable>:null}{open?<View style={styles.history}>{item.cover_note||item.cover_letter?<View style={styles.block}><Text style={styles.blockLabel}>ORIGINAL COVERING LETTER</Text><Text style={styles.blockCopy}>{item.cover_note||item.cover_letter}</Text></View>:null}{(item.interviews||[]).length?<View style={styles.block}><Text style={styles.blockLabel}>INTERVIEW HISTORY</Text>{item.interviews.map((iv:any)=><View key={iv.id} style={styles.line}><Text style={styles.lineTitle}>Interview {iv.round_number} · {method(iv.interview_method)}</Text><Text style={styles.lineCopy}>{iv.selected_slot?new Date(iv.selected_slot).toLocaleString('en-GB'):'No confirmed time recorded'}</Text>{iv.employer_note?<Text style={styles.lineCopy}>{iv.employer_note}</Text>:null}</View>)}</View>:null}{item.offer?<View style={styles.block}><Text style={styles.blockLabel}>OFFER COMMUNICATION</Text><Text style={styles.blockCopy}>{item.offer.employer_note||'Offer recorded.'}</Text></View>:null}</View>:null}</View>})}</View>:null}
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:space.lg,paddingBottom:110},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,marginBottom:9,fontWeight:'700'},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:20,maxWidth:350},
  tabs:{flexDirection:'row',backgroundColor:palette.stoneDeep,padding:4,borderRadius:radius.medium,marginBottom:24},
  tab:{flex:1,paddingVertical:11,alignItems:'center',borderRadius:radius.small},
  tabActive:{backgroundColor:palette.paper},
  tabText:{color:palette.muted,fontSize:10.5,fontWeight:'700'},
  tabActiveText:{color:palette.inkStrong},
  list:{gap:12},
  card:{borderWidth:1,borderColor:palette.line,padding:18,backgroundColor:palette.paper,borderRadius:radius.large},
  topRow:{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'center'},
  status:{color:palette.sage,fontSize:8,letterSpacing:1.4,textTransform:'uppercase',fontWeight:'800'},
  hiredStatus:{color:palette.sage,fontSize:8,fontWeight:'800',letterSpacing:1.4},
  score:{color:palette.muted,fontSize:10.5,fontWeight:'700'},
  cardTitle:{color:palette.inkStrong,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginTop:10},
  meta:{color:palette.muted,fontSize:12,lineHeight:18,marginTop:7},
  date:{color:palette.quiet,fontSize:10,marginTop:8},
  withdraw:{color:palette.muted,fontSize:10.5,marginTop:13,textDecorationLine:'underline'},
  manage:{borderTopWidth:1,borderTopColor:palette.line,marginTop:16,paddingTop:13,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  manageText:{color:palette.ink,fontSize:11,fontWeight:'700'},
  arrow:{color:palette.ink,fontSize:15},
  reopen:{color:palette.sage,fontSize:11,fontWeight:'700',marginTop:12},
  history:{marginTop:14,borderTopWidth:1,borderTopColor:palette.line,paddingTop:12,gap:10},
  block:{backgroundColor:palette.stone,padding:13,borderRadius:radius.medium},
  blockLabel:{fontSize:8,letterSpacing:1.3,color:palette.sage,fontWeight:'700'},
  blockCopy:{fontSize:11,lineHeight:18,color:palette.muted,marginTop:6},
  line:{paddingVertical:8,borderBottomWidth:1,borderBottomColor:palette.line},
  lineTitle:{color:palette.text,fontSize:11,fontWeight:'700'},
  lineCopy:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:3},
  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:20,borderRadius:radius.large},
  emptyTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif},
  emptyCopy:{color:palette.muted,fontSize:12,lineHeight:18,marginTop:6},
  error:{color:palette.danger,fontSize:12,marginBottom:18}
})