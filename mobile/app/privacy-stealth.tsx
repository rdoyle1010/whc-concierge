import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

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
    const {error}=await supabase.from('candidate_profiles').update({profile_visible:value,updated_at:new Date().toISOString()}).eq('id',candidateId)
    if(error){setProfileVisible(previous);setMessage('Could not update visibility. Please try again.')}
    else setMessage(value?'Your profile can be discovered by eligible employers, except those you block below.':'Your profile is hidden from all employer discovery.')
  }

  async function toggleEmployer(employer:Employer){
    if(!candidateId||busy)return
    setBusy(employer.id);setMessage('')
    const isBlocked=blocked.has(employer.id)
    if(isBlocked){
      const {error}=await supabase.from('profile_blocks').delete().eq('candidate_id',candidateId).eq('blocked_employer_id',employer.id)
      if(!error){setBlocked(current=>{const next=new Set(current);next.delete(employer.id);return next});setMessage(`${employer.property_name||employer.company_name} can now discover you if your profile is visible.`)}
      else setMessage('Could not unblock this employer.')
    }else{
      const {error}=await supabase.from('profile_blocks').insert({candidate_id:candidateId,blocked_employer_id:employer.id})
      if(!error){
        setBlocked(current=>new Set(current).add(employer.id))
        await supabase.from('candidate_profiles').update({stealth_mode:true,updated_at:new Date().toISOString()}).eq('id',candidateId)
        setMessage(`${employer.property_name||employer.company_name} is blocked and cannot discover your profile.`)
      }else setMessage('Could not block this employer.')
    }
    setBusy(null)
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>PRIVACY · STEALTH MODE</Text>
    <Text style={styles.title}>Control who can discover you.</Text>
    <Text style={styles.intro}>Stay open to new opportunities while hiding your profile from selected employers, including your current workplace.</Text>

    <View style={[styles.visibilityCard,!profileVisible&&styles.visibilityCardHidden]}>
      <View style={{flex:1,paddingRight:12}}>
        <Text style={[styles.visibilityEyebrow,!profileVisible&&styles.visibilityEyebrowHidden]}>{profileVisible?'PROFILE DISCOVERY ON':'PROFILE HIDDEN'}</Text>
        <Text style={[styles.visibilityTitle,!profileVisible&&styles.visibilityTitleHidden]}>{profileVisible?'Visible to eligible employers':'Hidden from all employer discovery'}</Text>
        <Text style={[styles.visibilityCopy,!profileVisible&&styles.visibilityCopyHidden]}>{profileVisible?'Your profile can appear in employer search and matching, except to businesses you block below.':'Your profile will not appear in employer search or matching until visibility is turned back on.'}</Text>
      </View>
      <Pressable onPress={()=>setVisibility(!profileVisible)} style={[styles.visibilityButton,profileVisible&&styles.visibilityButtonOn]}><Text style={[styles.visibilityText,profileVisible&&styles.visibilityTextOn]}>{profileVisible?'ON':'OFF'}</Text></Pressable>
    </View>

    <View style={styles.summaryCard}>
      <View style={styles.summaryNumberWrap}><Text style={styles.summaryNumber}>{blocked.size}</Text></View>
      <View style={{flex:1}}><Text style={styles.summaryEyebrow}>BLOCKED EMPLOYERS</Text><Text style={styles.summaryTitle}>{blocked.size===0?'No employers are blocked':`${blocked.size} employer${blocked.size===1?'':'s'} cannot discover you`}</Text><Text style={styles.summaryCopy}>Blocked businesses are excluded from search, matching, Agency and shortlists.</Text></View>
    </View>

    <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>SELECTIVE PRIVACY</Text><Text style={styles.sectionTitle}>Who should not see you?</Text><Text style={styles.sectionCopy}>Search for a hotel, spa, company or location and block only the employers you want hidden from.</Text></View>

    <View style={styles.searchWrap}><TextInput value={search} onChangeText={setSearch} placeholder="Search employer, hotel, spa or location" placeholderTextColor={palette.quiet} style={styles.search}/></View>
    <Text style={styles.helper}>Tap an employer to block or unblock them. Changes are applied immediately.</Text>

    <View style={styles.list}>
      {filtered.map(employer=>{
        const isBlocked=blocked.has(employer.id)
        const name=employer.property_name||employer.company_name||'Employer'
        return <Pressable key={employer.id} onPress={()=>toggleEmployer(employer)} disabled={busy===employer.id} style={[styles.row,isBlocked&&styles.rowBlocked]}>
          <View style={[styles.check,isBlocked&&styles.checkBlocked]}><Text style={[styles.checkText,isBlocked&&styles.checkTextBlocked]}>{isBlocked?'✓':''}</Text></View>
          <View style={{flex:1}}><Text style={styles.employerName}>{name}</Text>{employer.company_name&&employer.property_name&&employer.company_name!==employer.property_name?<Text style={styles.company}>{employer.company_name}</Text>:null}{employer.location?<Text style={styles.location}>{employer.location}</Text>:null}</View>
          <View style={[styles.statePill,isBlocked&&styles.statePillBlocked]}><Text style={[styles.state,isBlocked&&styles.stateBlocked]}>{busy===employer.id?'SAVING':isBlocked?'BLOCKED':'VISIBLE'}</Text></View>
        </Pressable>
      })}
    </View>

    {filtered.length===0?<View style={styles.empty}><Text style={styles.emptyEyebrow}>NO MATCHES</Text><Text style={styles.emptyTitle}>No employers found.</Text><Text style={styles.emptyCopy}>Try a different property, company or location name.</Text></View>:null}
    {message?<View style={styles.messageCard}><Text style={styles.message}>{message}</Text></View>:null}

    <View style={styles.note}><Text style={styles.noteEyebrow}>PRIVACY PRINCIPLE</Text><Text style={styles.noteTitle}>You stay in control of discovery.</Text><Text style={styles.noteCopy}>Blocking an employer stops future discovery. It does not erase an application or conversation you already chose to send. Wellness House administrators retain access where needed for safety, fraud prevention and support.</Text></View>
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:palette.stone},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{fontSize:13,color:palette.muted,fontFamily:type.sans},
  eyebrow:{fontSize:8,letterSpacing:2.1,color:palette.quiet,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{fontSize:34,lineHeight:40,color:palette.inkStrong,fontWeight:'400',fontFamily:type.serif,maxWidth:360},
  intro:{fontSize:13,lineHeight:20,color:palette.muted,marginTop:10,marginBottom:22,fontFamily:type.sans},
  visibilityCard:{flexDirection:'row',alignItems:'center',backgroundColor:palette.inkStrong,padding:18,borderRadius:radius.large},
  visibilityCardHidden:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line},
  visibilityEyebrow:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  visibilityEyebrowHidden:{color:palette.quiet},
  visibilityTitle:{color:palette.paper,fontSize:19,lineHeight:24,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  visibilityTitleHidden:{color:palette.inkStrong},
  visibilityCopy:{color:'#DCE4E7',fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  visibilityCopyHidden:{color:palette.muted},
  visibilityButton:{minWidth:54,paddingVertical:10,paddingHorizontal:10,borderWidth:1,borderColor:palette.lineStrong,alignItems:'center',borderRadius:999,backgroundColor:palette.stoneDeep},
  visibilityButtonOn:{backgroundColor:palette.paper,borderColor:palette.paper},
  visibilityText:{fontSize:9,fontWeight:'800',color:palette.quiet,fontFamily:type.sans},
  visibilityTextOn:{color:palette.inkStrong},
  summaryCard:{marginTop:10,flexDirection:'row',gap:13,alignItems:'center',backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:15,borderRadius:radius.large},
  summaryNumberWrap:{width:52,height:52,borderRadius:26,backgroundColor:palette.stoneDeep,alignItems:'center',justifyContent:'center'},
  summaryNumber:{fontSize:22,color:palette.inkStrong,fontWeight:'400',fontFamily:type.serif},
  summaryEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans},
  summaryTitle:{fontSize:12.5,fontWeight:'700',color:palette.inkStrong,marginTop:3,fontFamily:type.sans},
  summaryCopy:{fontSize:9.5,lineHeight:15,color:palette.muted,marginTop:3,fontFamily:type.sans},
  sectionHeader:{marginTop:28,marginBottom:10},
  sectionEyebrow:{fontSize:7.5,letterSpacing:1.4,color:palette.quiet,fontWeight:'700',fontFamily:type.sans},
  sectionTitle:{fontSize:21,lineHeight:26,color:palette.inkStrong,fontWeight:'400',fontFamily:type.serif,marginTop:4},
  sectionCopy:{fontSize:10.5,lineHeight:17,color:palette.muted,marginTop:5,fontFamily:type.sans},
  searchWrap:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,borderRadius:radius.large,padding:6},
  search:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:12,paddingVertical:12,color:palette.text,fontSize:11.5,backgroundColor:palette.stone,borderRadius:radius.medium,fontFamily:type.sans},
  helper:{fontSize:8.5,lineHeight:13,color:palette.quiet,marginTop:7,marginBottom:12,fontFamily:type.sans},
  list:{gap:8},
  row:{flexDirection:'row',alignItems:'center',gap:12,borderWidth:1,borderColor:palette.line,padding:13,backgroundColor:palette.paper,borderRadius:radius.medium},
  rowBlocked:{borderColor:palette.lineStrong,backgroundColor:palette.stoneDeep},
  check:{width:24,height:24,borderWidth:1.5,borderColor:palette.lineStrong,alignItems:'center',justifyContent:'center',borderRadius:6,backgroundColor:palette.paper},
  checkBlocked:{backgroundColor:palette.ink,borderColor:palette.ink},
  checkText:{fontSize:13,color:palette.paper,fontWeight:'800',fontFamily:type.sans},
  checkTextBlocked:{color:palette.paper},
  employerName:{fontSize:12.5,fontWeight:'700',color:palette.inkStrong,fontFamily:type.sans},
  company:{fontSize:9.5,color:palette.muted,marginTop:2,fontFamily:type.sans},
  location:{fontSize:9,color:palette.quiet,marginTop:2,fontFamily:type.sans},
  statePill:{backgroundColor:palette.stoneDeep,paddingHorizontal:7,paddingVertical:5,borderRadius:999},
  statePillBlocked:{backgroundColor:palette.ink},
  state:{fontSize:7,letterSpacing:.6,color:palette.quiet,fontWeight:'800',fontFamily:type.sans},
  stateBlocked:{color:palette.paper},
  empty:{borderWidth:1,borderColor:palette.line,padding:17,marginTop:8,borderRadius:radius.large,backgroundColor:palette.paper},
  emptyEyebrow:{fontSize:7.5,letterSpacing:1.2,color:palette.quiet,fontWeight:'700',fontFamily:type.sans},
  emptyTitle:{fontSize:16,lineHeight:21,fontWeight:'400',color:palette.inkStrong,fontFamily:type.serif,marginTop:4},
  emptyCopy:{fontSize:10,color:palette.muted,marginTop:4,fontFamily:type.sans},
  messageCard:{backgroundColor:palette.stoneDeep,padding:13,borderRadius:radius.medium,marginTop:12},
  message:{fontSize:10,lineHeight:16,color:palette.muted,fontFamily:type.sans},
  note:{backgroundColor:palette.ink,padding:16,marginTop:22,borderRadius:radius.large},
  noteEyebrow:{fontSize:7.5,letterSpacing:1.2,color:'#CBD5D9',fontWeight:'700',fontFamily:type.sans},
  noteTitle:{fontSize:17,lineHeight:22,fontWeight:'400',color:palette.paper,fontFamily:type.serif,marginTop:5},
  noteCopy:{fontSize:10,lineHeight:16,color:'#DCE4E7',marginTop:5,fontFamily:type.sans}
})
