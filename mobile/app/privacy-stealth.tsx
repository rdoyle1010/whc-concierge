import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Employer = { id:string; company_name:string|null; property_name:string|null; location?:string|null }

export default function PrivacyStealthScreen(){
  const [candidateId,setCandidateId]=useState('')
  const [profileVisible,setProfileVisible]=useState(true)
  const [employers,setEmployers]=useState<Employer[]>([])
  const [blocked,setBlocked]=useState<Set<string>>(new Set())
  const [search,setSearch]=useState('')
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState<string|null>(null)
  const [message,setMessage]=useState('')

  useEffect(()=>{load()},[])

  async function load(){
    const {data:{user}}=await supabase.auth.getUser()
    if(!user){router.replace('/login');return}
    const {data:profile}=await supabase.from('candidate_profiles').select('id,profile_visible').eq('user_id',user.id).maybeSingle()
    if(!profile){setLoading(false);return}
    setCandidateId(profile.id)
    setProfileVisible(profile.profile_visible!==false)
    const [{data:employerRows},{data:blockRows}]=await Promise.all([
      supabase.from('employer_profiles').select('id,company_name,property_name,location').eq('approval_status','approved').order('company_name'),
      supabase.from('profile_blocks').select('blocked_employer_id').eq('candidate_id',profile.id),
    ])
    setEmployers((employerRows||[]) as Employer[])
    setBlocked(new Set((blockRows||[]).map((row:any)=>row.blocked_employer_id)))
    setLoading(false)
  }

  const filtered=useMemo(()=>{
    const q=search.trim().toLowerCase()
    if(!q)return employers
    return employers.filter(e=>`${e.property_name||''} ${e.company_name||''} ${e.location||''}`.toLowerCase().includes(q))
  },[employers,search])

  async function setVisibility(value:boolean){
    if(!candidateId)return
    const previous=profileVisible
    setProfileVisible(value)
    // Row-level security scopes this update to the signed-in candidate, so a
    // request that is refused comes back as zero rows rather than an error.
    // Both cases have to roll the switch back, or the screen would show a
    // setting the database never took.
    const {data,error}=await supabase.from('candidate_profiles').update({profile_visible:value,updated_at:new Date().toISOString()}).eq('id',candidateId).select('id')
    if(error||!data?.length){setProfileVisible(previous);setMessage('Could not update visibility. Please try again.')}
    else setMessage(value?'Your profile can be discovered by eligible employers, except those you block below.':'Your profile is hidden from all employer discovery.')
  }

  // Blocking one employer no longer flips the global stealth_mode flag. RLS
  // now reads stealth_mode as "hide me from every employer" (the same meaning
  // the web talent settings give it), so setting it here would have hidden the
  // candidate from the whole market the moment they blocked a single property -
  // the opposite of what this screen promises. The block row alone is what
  // hides them from that one employer.
  async function toggleEmployer(employer:Employer){
    if(!candidateId||busy)return
    setBusy(employer.id);setMessage('')
    const isBlocked=blocked.has(employer.id)
    // The blocks_insert_candidate / blocks_delete_candidate policies allow a
    // candidate to write only their own rows, which is exactly the shape of
    // these two calls. A refused delete is not an error - it simply matches no
    // rows - so the returned rows are what decides whether the unblock worked.
    // Reporting success on zero rows would leave the candidate believing an
    // employer had been unblocked when the block still stood.
    if(isBlocked){
      const {data,error}=await supabase.from('profile_blocks').delete().eq('candidate_id',candidateId).eq('blocked_employer_id',employer.id).select('blocked_employer_id')
      if(error)setMessage(`Could not unblock this employer. ${error.message}`)
      else if(!data?.length)setMessage('Could not unblock this employer - nothing was changed. Please sign out, sign back in and try again.')
      else{setBlocked(current=>{const next=new Set(current);next.delete(employer.id);return next});setMessage(`${employer.property_name||employer.company_name} can now discover you if your profile is visible.`)}
    }else{
      const {data,error}=await supabase.from('profile_blocks').insert({candidate_id:candidateId,blocked_employer_id:employer.id}).select('blocked_employer_id')
      if(error)setMessage(`Could not block this employer. ${error.message}`)
      else if(!data?.length)setMessage('Could not block this employer - nothing was saved. Please sign out, sign back in and try again.')
      else{
        setBlocked(current=>new Set(current).add(employer.id))
        setMessage(`${employer.property_name||employer.company_name} is blocked and cannot discover your profile.`)
      }
    }
    setBusy(null)
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color="#0b2f4d"/></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>PRIVACY & STEALTH</Text>
    <Text style={styles.title}>Who can see you?</Text>
    <Text style={styles.intro}>Keep your profile open to opportunities while hiding it from specific employers, including your current workplace.</Text>

    <View style={styles.visibilityCard}>
      <View style={{flex:1,paddingRight:12}}><Text style={styles.cardTitle}>Visible to eligible employers</Text><Text style={styles.cardCopy}>{profileVisible?'Your profile can appear in employer search and matching, except to businesses you block below.':'Your profile is hidden from every employer until you turn visibility back on.'}</Text></View>
      <Pressable onPress={()=>setVisibility(!profileVisible)} style={[styles.visibilityButton,profileVisible&&styles.visibilityButtonOn]}><Text style={[styles.visibilityText,profileVisible&&styles.visibilityTextOn]}>{profileVisible?'ON':'OFF'}</Text></Pressable>
    </View>

    <View style={styles.summary}><Text style={styles.summaryNumber}>{blocked.size}</Text><View style={{flex:1}}><Text style={styles.summaryTitle}>Blocked employer{blocked.size===1?'':'s'}</Text><Text style={styles.summaryCopy}>These businesses cannot discover you in search, matching, Agency or shortlists.</Text></View></View>

    <Text style={styles.sectionLabel}>WHO SHOULD NOT SEE YOU?</Text>
    <TextInput value={search} onChangeText={setSearch} placeholder="Search employer, hotel, spa or location" placeholderTextColor="#98a3aa" style={styles.search}/>
    <Text style={styles.helper}>Tap the box beside any employer you want to hide from. A selected employer is blocked immediately.</Text>

    <View style={styles.list}>
      {filtered.map(employer=>{
        const isBlocked=blocked.has(employer.id)
        const name=employer.property_name||employer.company_name||'Employer'
        return <Pressable key={employer.id} onPress={()=>toggleEmployer(employer)} disabled={busy===employer.id} style={[styles.row,isBlocked&&styles.rowBlocked]}>
          <View style={[styles.check,isBlocked&&styles.checkBlocked]}><Text style={[styles.checkText,isBlocked&&styles.checkTextBlocked]}>{isBlocked?'✓':''}</Text></View>
          <View style={{flex:1}}><Text style={styles.employerName}>{name}</Text>{employer.company_name&&employer.property_name&&employer.company_name!==employer.property_name?<Text style={styles.company}>{employer.company_name}</Text>:null}{employer.location?<Text style={styles.location}>{employer.location}</Text>:null}</View>
          <Text style={[styles.state,isBlocked&&styles.stateBlocked]}>{busy===employer.id?'Saving…':isBlocked?'BLOCKED':'Can see you'}</Text>
        </Pressable>
      })}
    </View>

    {filtered.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No employers found.</Text><Text style={styles.emptyCopy}>Try a different property, company or location name.</Text></View>:null}
    {message?<Text style={styles.message}>{message}</Text>:null}
    <View style={styles.note}><Text style={styles.noteTitle}>Important</Text><Text style={styles.noteCopy}>Blocking an employer stops future discovery. It does not erase an application or conversation you already chose to send. Wellness House administrators retain access for safety, fraud prevention and support.</Text></View>
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:20,paddingTop:54,paddingBottom:110},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#fff'},back:{fontSize:14,color:'#66747c',marginBottom:28},eyebrow:{fontSize:9,letterSpacing:2.1,color:'#71808a',marginBottom:9},title:{fontSize:30,lineHeight:36,color:'#0b2f4d',fontWeight:'500'},intro:{fontSize:13,lineHeight:20,color:'#66747c',marginTop:9,marginBottom:22},visibilityCard:{flexDirection:'row',alignItems:'center',borderWidth:1,borderColor:'#dce3e7',padding:16,backgroundColor:'#f9fbfb'},cardTitle:{fontSize:14,fontWeight:'700',color:'#173246'},cardCopy:{fontSize:11,lineHeight:17,color:'#71808a',marginTop:4},visibilityButton:{minWidth:52,paddingVertical:10,paddingHorizontal:10,borderWidth:1,borderColor:'#d7dfe3',alignItems:'center'},visibilityButtonOn:{backgroundColor:'#0b2f4d',borderColor:'#0b2f4d'},visibilityText:{fontSize:10,fontWeight:'800',color:'#71808a'},visibilityTextOn:{color:'#fff'},summary:{marginTop:14,flexDirection:'row',gap:14,alignItems:'center',borderWidth:1,borderColor:'#e2e6e8',padding:15},summaryNumber:{fontSize:28,color:'#0b2f4d',fontWeight:'600'},summaryTitle:{fontSize:13,fontWeight:'700',color:'#173246'},summaryCopy:{fontSize:10.5,lineHeight:16,color:'#71808a',marginTop:2},sectionLabel:{fontSize:9,letterSpacing:1.8,color:'#71808a',marginTop:28,marginBottom:9},search:{borderWidth:1,borderColor:'#d7dfe3',paddingHorizontal:14,paddingVertical:13,color:'#173246',fontSize:14},helper:{fontSize:10.5,lineHeight:16,color:'#7a878e',marginTop:8,marginBottom:12},list:{gap:8},row:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:'#e0e5e8',padding:13,backgroundColor:'#fff'},rowBlocked:{borderColor:'#9eb0bb',backgroundColor:'#f3f7f8'},check:{width:24,height:24,borderWidth:1.5,borderColor:'#aeb8be',alignItems:'center',justifyContent:'center'},checkBlocked:{backgroundColor:'#0b2f4d',borderColor:'#0b2f4d'},checkText:{fontSize:14,color:'#fff',fontWeight:'800'},checkTextBlocked:{color:'#fff'},employerName:{fontSize:13,fontWeight:'700',color:'#173246'},company:{fontSize:10.5,color:'#71808a',marginTop:2},location:{fontSize:10,color:'#89949a',marginTop:2},state:{fontSize:8.5,letterSpacing:.6,color:'#839097'},stateBlocked:{color:'#0b2f4d',fontWeight:'800'},empty:{borderWidth:1,borderColor:'#e0e5e8',padding:18,marginTop:8},emptyTitle:{fontSize:13,fontWeight:'700',color:'#173246'},emptyCopy:{fontSize:11,color:'#71808a',marginTop:4},message:{fontSize:11,lineHeight:17,color:'#526976',marginTop:14},note:{backgroundColor:'#f4f7f8',padding:15,marginTop:22},noteTitle:{fontSize:11,fontWeight:'700',color:'#173246'},noteCopy:{fontSize:10.5,lineHeight:17,color:'#71808a',marginTop:4}})
