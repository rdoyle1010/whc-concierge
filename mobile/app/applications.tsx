import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

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
    <View style={styles.tabs}><Pressable onPress={()=>setMode('active')} style={[styles.tab,mode==='active'&&styles.tabActive]}><Text style={[styles.tabText,mode==='active'&&styles.tabActiveText]}>Active ({live.length})</Text></Pressable><Pressable onPress={()=>setMode('hired')} style={[styles.tab,mode==='hired'&&styles.tabActive]}><Text style={[styles.tabText,mode==='hired'&&styles.tabActiveText]}>Hired history ({hired.length})</Text></Pressable></View>
    <Text style={styles.intro}>{mode==='active'?(role==='employer'?'Candidates currently moving through recruitment.':'Roles currently moving through recruitment.'):role==='employer'?'Completed hires and their preserved recruitment history.':'Your completed placements and preserved recruitment history.'}</Text>
    {loading?<ActivityIndicator color="#092b45" style={{marginTop:30}}/>:null}{error?<Text style={styles.error}>{error}</Text>:null}
    {!loading&&mode==='active'&&live.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No active applications.</Text><Text style={styles.emptyCopy}>{role==='talent'?'Go to Jobs and choose Apply with AI to start an application.':'New applications appear here when Talent apply to your live roles.'}</Text></View>:null}
    {mode==='active'?<View style={styles.list}>{live.map(item=>{const job=Array.isArray(item.job_listings)?item.job_listings[0]:item.job_listings,employer=Array.isArray(job?.employer_profiles)?job?.employer_profiles[0]:job?.employer_profiles,candidate=Array.isArray(item.candidate_profiles)?item.candidate_profiles[0]:item.candidate_profiles;return <View key={item.id} style={styles.card}><View style={styles.topRow}><Text style={styles.status}>{statusCopy[item.status]||item.status}</Text>{item.match_score?<Text style={styles.score}>{item.match_score}% match</Text>:null}</View><Text style={styles.cardTitle}>{role==='talent'?(job?.job_title||'Role'):(candidate?.full_name||'Candidate')}</Text><Text style={styles.meta}>{role==='talent'?[employer?.property_name||employer?.company_name,job?.location].filter(Boolean).join(' · '):[candidate?.headline||candidate?.role_level,job?.job_title].filter(Boolean).join(' · ')}</Text>{role==='talent'?<Pressable onPress={()=>router.push({pathname:'/talent-application/[id]',params:{id:item.id}})} style={styles.manage}><Text style={styles.manageText}>{['interview','offered','accepted'].includes(item.status)?'View & respond →':'View application progress →'}</Text></Pressable>:null}{role==='talent'&&!['accepted','rejected','offered'].includes(item.status)?<Pressable onPress={()=>withdraw(item)}><Text style={styles.withdraw}>Withdraw interest</Text></Pressable>:null}{role==='employer'?<Pressable onPress={()=>router.push({pathname:'/application/[id]',params:{id:item.id}})} style={styles.manage}><Text style={styles.manageText}>Manage candidate →</Text></Pressable>:null}</View>})}</View>:null}
    {!loading&&mode==='hired'&&!hired.length?<View style={styles.empty}><Text style={styles.emptyTitle}>{role==='talent'?'No completed placements yet.':'No completed hires yet.'}</Text><Text style={styles.emptyCopy}>Completed recruitment records will appear here automatically.</Text></View>:null}
    {mode==='hired'?<View style={styles.list}>{hired.map(item=>{const person=role==='talent'?item.employer:item.candidate,job=item.job||{},open=expanded===item.id;return <View key={item.id} style={styles.card}><Text style={styles.hiredStatus}>HIRED</Text><Text style={styles.cardTitle}>{role==='talent'?(job.job_title||'Role'):(person?.full_name||'Candidate')}</Text><Text style={styles.meta}>{role==='talent'?[person?.property_name||person?.company_name,job.location].filter(Boolean).join(' · '):[job.job_title,person?.headline,person?.location].filter(Boolean).join(' · ')}</Text><Text style={styles.date}>Hired {fmt(item.hired_at)} · Archived {fmt(item.archived_at)}</Text><Pressable onPress={()=>setExpanded(open?'':item.id)} style={styles.manage}><Text style={styles.manageText}>{open?'Hide recruitment history':'View recruitment history'} →</Text></Pressable>{role==='employer'?<Pressable disabled={busy===item.id} onPress={()=>reopen(item.id)}><Text style={styles.reopen}>{busy===item.id?'Reopening...':'Reopen record'}</Text></Pressable>:null}{open?<View style={styles.history}>{item.cover_note||item.cover_letter?<View style={styles.block}><Text style={styles.blockLabel}>ORIGINAL COVERING LETTER</Text><Text style={styles.blockCopy}>{item.cover_note||item.cover_letter}</Text></View>:null}{(item.interviews||[]).length?<View style={styles.block}><Text style={styles.blockLabel}>INTERVIEW HISTORY</Text>{item.interviews.map((iv:any)=><View key={iv.id} style={styles.line}><Text style={styles.lineTitle}>Interview {iv.round_number} · {method(iv.interview_method)}</Text><Text style={styles.lineCopy}>{iv.selected_slot?new Date(iv.selected_slot).toLocaleString('en-GB'):'No confirmed time recorded'}</Text>{iv.employer_note?<Text style={styles.lineCopy}>{iv.employer_note}</Text>:null}</View>)}</View>:null}{item.offer?<View style={styles.block}><Text style={styles.blockLabel}>OFFER COMMUNICATION</Text><Text style={styles.blockCopy}>{item.offer.employer_note||'Offer recorded.'}</Text></View>:null}</View>:null}</View>})}</View>:null}
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:42,paddingBottom:100},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'},tabs:{flexDirection:'row',borderWidth:1,borderColor:'#d7e0e4',marginTop:20},tab:{flex:1,paddingVertical:12,alignItems:'center'},tabActive:{backgroundColor:'#092b45'},tabText:{color:'#66747c',fontSize:10,fontWeight:'700'},tabActiveText:{color:'#fff'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:14,marginBottom:26},list:{gap:12},card:{borderWidth:1,borderColor:'#dce3e7',padding:19},topRow:{flexDirection:'row',justifyContent:'space-between',gap:10},status:{color:'#092b45',fontSize:9,letterSpacing:1.3,textTransform:'uppercase'},hiredStatus:{color:'#456655',fontSize:9,fontWeight:'800',letterSpacing:1.3},score:{color:'#173246',fontSize:11,fontWeight:'600'},cardTitle:{color:'#173246',fontSize:18,fontWeight:'600',marginTop:9},meta:{color:'#66747c',fontSize:12,lineHeight:18,marginTop:7},date:{color:'#8a969d',fontSize:10,marginTop:7},withdraw:{color:'#7a4a4a',fontSize:11,marginTop:13},manage:{borderTopWidth:1,borderTopColor:'#edf1f3',marginTop:16,paddingTop:14},manageText:{color:'#092b45',fontSize:11,fontWeight:'700'},reopen:{color:'#9c7a42',fontSize:11,fontWeight:'700',marginTop:12},history:{marginTop:14,borderTopWidth:1,borderTopColor:'#edf1f3',paddingTop:12,gap:10},block:{backgroundColor:'#f7f6f3',padding:13},blockLabel:{fontSize:8,letterSpacing:1.3,color:'#9c7a42',fontWeight:'700'},blockCopy:{fontSize:11,lineHeight:18,color:'#5f6e77',marginTop:6},line:{paddingVertical:8,borderBottomWidth:1,borderBottomColor:'#e8ecee'},lineTitle:{color:'#173246',fontSize:11,fontWeight:'600'},lineCopy:{color:'#71808a',fontSize:10,lineHeight:16,marginTop:3},empty:{backgroundColor:'#f4f7f8',padding:20},emptyTitle:{color:'#173246',fontSize:15,fontWeight:'600'},emptyCopy:{color:'#71808a',fontSize:12,lineHeight:18,marginTop:6},error:{color:'#9b2c2c',fontSize:12,marginBottom:18}})
