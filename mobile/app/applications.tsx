import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
type Role='talent'|'employer'
type Application={id:string;status:string;match_score:number|null;created_at?:string|null;archived_at?:string|null;hired_at?:string|null;candidate_id?:string;role_id?:string;job?:any;candidate?:any;job_listings?:any;candidate_profiles?:any}
const statusCopy:Record<string,string>={draft:'Draft',pending:'Applied',reviewed:'Reviewed',shortlisted:'Shortlisted',interview:'Interview',offered:'Offer',accepted:'Accepted',rejected:'Not progressing',withdrawn:'Withdrawn'}
const TALENT_ACTIVE=new Set(['draft','pending','reviewed','shortlisted','interview','offered','accepted'])
const EMPLOYER_ACTIVE=new Set(['pending','reviewed','shortlisted','interview','offered','accepted'])

export default function ApplicationsScreen(){
  const [role,setRole]=useState<Role>('talent')
  const [items,setItems]=useState<Application[]>([])
  const [hired,setHired]=useState<any[]>([])
  const [mode,setMode]=useState<'active'|'hired'>('active')
  const [loading,setLoading]=useState(true)
  const [error,setError]=useState('')
  const [expanded,setExpanded]=useState('')

  useEffect(()=>{void load()},[])

  async function authFetch(path:string,options?:RequestInit){
    const{data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired.')
    const res=await fetch(`${WEB_URL}${path}`,{...options,headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',...(options?.headers||{})}})
    const body=await res.json().catch(()=>({}))
    if(!res.ok)throw new Error(body.error||'Could not load recruitment records.')
    return body
  }

  async function load(){
    setLoading(true);setError('')
    try{
      const{data:{user}}=await supabase.auth.getUser()
      if(!user){router.replace('/login');return}
      const{data:account}=await supabase.from('profiles').select('role').eq('id',user.id).maybeSingle()
      const resolved:Role=account?.role==='employer'?'employer':'talent'
      setRole(resolved)

      if(resolved==='employer'){
        const data=await authFetch('/api/employer/applications/list')
        setItems(data.items||[])
      }else{
        const{data:candidate}=await supabase.from('candidate_profiles').select('id').eq('user_id',user.id).maybeSingle()
        if(candidate){
          const{data,error:queryError}=await supabase.from('applications')
            .select('id,status,match_score,created_at,archived_at,hired_at,candidate_id,role_id,job_listings(job_title,location,employer_profiles(property_name,company_name))')
            .eq('candidate_id',candidate.id).order('created_at',{ascending:false})
          if(queryError)throw queryError
          setItems((data||[]) as Application[])
        }else setItems([])
      }
      const history=await authFetch('/api/mobile/hired')
      setHired(history.items||[])
    }catch(e:any){setError(e?.message||'Could not load applications.')}
    finally{setLoading(false)}
  }

  const live=useMemo(()=>{
    const allowed=role==='employer'?EMPLOYER_ACTIVE:TALENT_ACTIVE
    return items.filter(item=>!item.archived_at&&!item.hired_at&&allowed.has(String(item.status||'').toLowerCase()))
  },[items,role])

  async function withdraw(item:Application){
    Alert.alert('Withdraw application?','This removes the application from the recruitment process.',[
      {text:'Cancel',style:'cancel'},
      {text:'Withdraw',style:'destructive',onPress:async()=>{try{await authFetch('/api/applications/withdraw',{method:'POST',body:JSON.stringify({applicationId:item.id})});await load()}catch(e:any){setError(e.message)}}},
    ])
  }

  return<ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Text style={styles.eyebrow}>RECRUITMENT</Text><Text style={styles.title}>Applications</Text>
    <Text style={styles.intro}>{role==='employer'?'Review genuine submitted applications here. Open a candidate to see the full application before progressing them.':'Your active recruitment in one place.'}</Text>

    <View style={styles.tabs}><Pressable onPress={()=>setMode('active')} style={[styles.tab,mode==='active'&&styles.tabActive]}><Text style={[styles.tabText,mode==='active'&&styles.tabTextActive]}>Active {live.length}</Text></Pressable><Pressable onPress={()=>setMode('hired')} style={[styles.tab,mode==='hired'&&styles.tabActive]}><Text style={[styles.tabText,mode==='hired'&&styles.tabTextActive]}>Hired {hired.length}</Text></Pressable></View>

    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:30}}/>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}

    {!loading&&mode==='active'&&live.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No active applications.</Text><Text style={styles.emptyCopy}>{role==='employer'?'Submitted candidates will appear here as soon as they enter your recruitment journey.':'Browse Jobs when you are ready to start something new.'}</Text></View>:null}

    {mode==='active'?<View style={styles.list}>{live.map(item=>{
      const job=role==='employer'?item.job:(Array.isArray(item.job_listings)?item.job_listings[0]:item.job_listings)
      const employer=role==='talent'?(Array.isArray(job?.employer_profiles)?job?.employer_profiles[0]:job?.employer_profiles):null
      const candidate=role==='employer'?item.candidate:null
      return<View key={item.id} style={styles.card}>
        <View style={styles.topRow}><Text style={styles.status}>{statusCopy[item.status]||item.status}</Text>{item.match_score!=null?<Text style={styles.score}>{item.match_score}% match</Text>:null}</View>
        <Text style={styles.cardTitle}>{role==='employer'?(candidate?.full_name||'Candidate'):(job?.job_title||'Role')}</Text>
        <Text style={styles.meta}>{role==='employer'?[candidate?.headline||candidate?.role_level,job?.job_title,job?.location].filter(Boolean).join(' · '):[employer?.property_name||employer?.company_name,job?.location].filter(Boolean).join(' · ')}</Text>
        {role==='employer'?<Pressable onPress={()=>router.push({pathname:'/application/[id]',params:{id:item.id}})} style={styles.manage}><Text style={styles.manageText}>Review application</Text><Text style={styles.arrow}>→</Text></Pressable>:<Pressable onPress={()=>router.push({pathname:'/talent-application/[id]',params:{id:item.id}})} style={styles.manage}><Text style={styles.manageText}>{['interview','offered','accepted'].includes(item.status)?'View and respond':'View application progress'}</Text><Text style={styles.arrow}>→</Text></Pressable>}
        {role==='talent'&&!['accepted','rejected','offered'].includes(item.status)?<Pressable onPress={()=>withdraw(item)}><Text style={styles.withdraw}>Withdraw application</Text></Pressable>:null}
      </View>
    })}</View>:null}

    {mode==='hired'&&!loading&&hired.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No completed hires yet.</Text><Text style={styles.emptyCopy}>Completed recruitment records will appear here automatically.</Text></View>:null}
    {mode==='hired'?<View style={styles.list}>{hired.map((item:any)=>{const person=role==='employer'?item.candidate:item.employer;const job=item.job||{};const open=expanded===item.id;return<View key={item.id} style={styles.card}><Text style={styles.status}>HIRED</Text><Text style={styles.cardTitle}>{role==='employer'?(person?.full_name||'Candidate'):(job.job_title||'Role')}</Text><Text style={styles.meta}>{role==='employer'?[job.job_title,person?.headline].filter(Boolean).join(' · '):[person?.property_name||person?.company_name,job.location].filter(Boolean).join(' · ')}</Text><Pressable onPress={()=>setExpanded(open?'':item.id)} style={styles.manage}><Text style={styles.manageText}>{open?'Hide recruitment history':'View recruitment history'}</Text><Text style={styles.arrow}>→</Text></Pressable>{open?<View style={styles.history}>{item.cover_note||item.cover_letter?<Text style={styles.historyText}>{item.cover_note||item.cover_letter}</Text>:<Text style={styles.historyText}>Recruitment history preserved.</Text>}</View>:null}</View>})}</View>:null}
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:space.lg,paddingBottom:110},eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,marginBottom:9,fontWeight:'700'},title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontFamily:type.serif,fontWeight:'400'},intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:20},tabs:{flexDirection:'row',backgroundColor:palette.stoneDeep,padding:4,borderRadius:radius.medium,marginBottom:24},tab:{flex:1,paddingVertical:11,alignItems:'center',borderRadius:radius.small},tabActive:{backgroundColor:palette.paper},tabText:{color:palette.muted,fontSize:10.5,fontWeight:'700'},tabTextActive:{color:palette.inkStrong},list:{gap:12},card:{borderWidth:1,borderColor:palette.line,padding:18,backgroundColor:palette.paper,borderRadius:radius.large},topRow:{flexDirection:'row',justifyContent:'space-between',gap:10},status:{color:palette.sage,fontSize:8,letterSpacing:1.4,textTransform:'uppercase',fontWeight:'800'},score:{color:palette.muted,fontSize:10.5,fontWeight:'700'},cardTitle:{color:palette.inkStrong,fontSize:22,lineHeight:27,fontFamily:type.serif,marginTop:10},meta:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:7},manage:{borderTopWidth:1,borderTopColor:palette.line,marginTop:16,paddingTop:13,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},manageText:{color:palette.ink,fontSize:11,fontWeight:'800'},arrow:{color:palette.ink,fontSize:16},withdraw:{color:palette.muted,fontSize:10.5,marginTop:13,textDecorationLine:'underline'},empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:20,borderRadius:radius.large},emptyTitle:{color:palette.inkStrong,fontSize:20,fontFamily:type.serif},emptyCopy:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:7},history:{borderTopWidth:1,borderTopColor:palette.line,marginTop:14,paddingTop:12},historyText:{color:palette.muted,fontSize:10.5,lineHeight:17},error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:14}
})