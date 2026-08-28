import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

type Review = { id:string; rating:number; text?:string|null; property_name?:string|null; created_at?:string|null; criteria_scores?:Record<string,number>|null }
type Reference = { id:string; status:string; request_message?:string|null; response_text?:string|null; would_rehire?:boolean|null; created_at?:string|null; employer_name?:string|null; candidate_name?:string|null; candidate_title?:string|null }
type EligibleEmployer = { id:string; name:string; location?:string|null }

function stars(value:number){
  const rounded=Math.max(0,Math.min(5,Math.round(Number(value)||0)))
  return `${'★'.repeat(rounded)}${'☆'.repeat(5-rounded)}`
}

export default function ReputationScreen(){
  const [role,setRole]=useState<'talent'|'employer'>('talent')
  const [profile,setProfile]=useState<any>(null)
  const [reviews,setReviews]=useState<Review[]>([])
  const [references,setReferences]=useState<Reference[]>([])
  const [eligible,setEligible]=useState<EligibleEmployer[]>([])
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')
  const [requestMessages,setRequestMessages]=useState<Record<string,string>>({})
  const [responses,setResponses]=useState<Record<string,string>>({})
  const [rehire,setRehire]=useState<Record<string,boolean>>({})

  useEffect(()=>{void load()},[])

  async function authFetch(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`,...(options?.headers||{})}})
    const body=await response.json().catch(()=>({}))
    if(!response.ok) throw new Error(body?.error||'Could not update reputation.')
    return body
  }

  async function load(){
    setLoading(true);setError('')
    try{
      const data=await authFetch('/api/mobile/reputation')
      setRole(data.role==='employer'?'employer':'talent')
      setProfile(data.profile||null)
      setReviews(data.reviews||[])
      setReferences(data.references||[])
      setEligible(data.eligibleEmployers||[])
    }catch(e:any){setError(e.message||'Could not load reputation.')}
    setLoading(false)
  }

  async function requestReference(employer:EligibleEmployer){
    setBusy(`request-${employer.id}`);setError('')
    try{
      await authFetch('/api/mobile/reputation',{method:'POST',body:JSON.stringify({action:'request_reference',employerId:employer.id,message:(requestMessages[employer.id]||'').trim()})})
      Alert.alert('Reference requested',`${employer.name} has been asked to complete a verified WHC reference.`)
      await load()
    }catch(e:any){setError(e.message||'Could not request reference.')}
    setBusy('')
  }

  async function respondReference(ref:Reference,status:'completed'|'declined'){
    setBusy(`${status}-${ref.id}`);setError('')
    try{
      await authFetch('/api/mobile/reputation',{method:'POST',body:JSON.stringify({action:'respond_reference',referenceId:ref.id,status,responseText:responses[ref.id]||'',wouldRehire:Boolean(rehire[ref.id])})})
      Alert.alert(status==='completed'?'Reference submitted':'Request declined',status==='completed'?'The verified reference is now attached to the Talent member’s WHC reputation.':'The Talent member has been notified.')
      await load()
    }catch(e:any){setError(e.message||'Could not respond to reference.')}
    setBusy('')
  }

  const distribution=useMemo(()=>[5,4,3,2,1].map(value=>({
    value,
    count:reviews.filter(review=>Math.round(Number(review.rating)||0)===value).length,
  })),[reviews])
  const distributionMax=Math.max(1,...distribution.map(item=>item.count))
  const completedReferences=references.filter(ref=>ref.status==='completed').length

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>REPUTATION</Text>
    <Text style={styles.title}>{role==='talent'?'Your professional reputation.':'Your property reputation.'}</Text>
    <Text style={styles.intro}>{role==='talent'?'A transparent record of verified work, reviews and employer references.':'A transparent record of verified Talent feedback and reference activity for your property.'}</Text>
    {loading?<ActivityIndicator color={palette.ink} style={{marginTop:20}}/>:null}
    {error?<Text style={styles.error}>{error}</Text>:null}

    {!loading&&profile?<>
      <View style={styles.heroScore}>
        <View style={styles.heroLeft}>
          <Text style={styles.score}>{Number(profile.reviewScore||0).toFixed(1)}</Text>
          <Text style={styles.heroStars}>{profile.reviewCount?stars(Number(profile.reviewScore||0)):'☆☆☆☆☆'}</Text>
          <Text style={styles.scoreCopy}>{profile.reviewCount||0} verified review{Number(profile.reviewCount||0)===1?'':'s'}</Text>
        </View>
        <View style={styles.heroDivider}/>
        <View style={styles.heroRight}>
          <Text style={styles.verifiedLabel}>WHC VERIFIED</Text>
          <Text style={styles.verifiedTitle}>{profile.name}</Text>
          <Text style={styles.verifiedCopy}>Ratings are only attached to work or relationships Wellness House can verify.</Text>
        </View>
      </View>

      <View style={styles.summaryGrid}>
        <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{profile.reviewCount||0}</Text><Text style={styles.summaryLabel}>Verified reviews</Text></View>
        <View style={styles.summaryCard}><Text style={styles.summaryNumber}>{completedReferences}</Text><Text style={styles.summaryLabel}>Verified references</Text></View>
      </View>

      {reviews.length>0?<View style={styles.breakdownCard}>
        <Text style={styles.breakdownTitle}>Rating breakdown</Text>
        {distribution.map(item=><View key={item.value} style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>{item.value} ★</Text>
          <View style={styles.track}><View style={[styles.fill,{width:`${Math.round((item.count/distributionMax)*100)}%`}]}/></View>
          <Text style={styles.breakdownCount}>{item.count}</Text>
        </View>)}
      </View>:null}
    </>:null}

    {!loading&&role==='talent'?<>
      <Text style={styles.sectionEyebrow}>REFERENCES</Text>
      <Text style={styles.sectionTitle}>Employer references</Text>
      {references.length===0?<Text style={styles.empty}>No reference requests yet.</Text>:references.map(ref=><View key={ref.id} style={styles.card}>
        <View style={styles.row}><Text style={styles.cardTitle}>{ref.employer_name||'Property'}</Text><Text style={styles.status}>{ref.status}</Text></View>
        {ref.request_message?<Text style={styles.muted}>Your request: {ref.request_message}</Text>:null}
        {ref.status==='completed'?<><Text style={styles.referenceText}>“{ref.response_text}”</Text><Text style={styles.rehire}>{ref.would_rehire?'Would hire again ✓':'Would not confirm rehire'}</Text></>:ref.status==='pending'?<Text style={styles.muted}>Waiting for the property to respond.</Text>:<Text style={styles.muted}>The property declined this request.</Text>}
      </View>)}

      <Text style={[styles.sectionEyebrow,{marginTop:26}]}>REQUEST</Text>
      <Text style={styles.sectionTitle}>Request a verified reference</Text>
      <Text style={styles.help}>Only properties where WHC can verify completed work appear here.</Text>
      {eligible.length===0?<Text style={styles.empty}>No new eligible properties at the moment.</Text>:eligible.map(emp=><View key={emp.id} style={styles.card}>
        <Text style={styles.cardTitle}>{emp.name}</Text>
        {emp.location?<Text style={styles.muted}>{emp.location}</Text>:null}
        <TextInput value={requestMessages[emp.id]||''} onChangeText={v=>setRequestMessages(s=>({...s,[emp.id]:v}))} placeholder="Optional note to the property" placeholderTextColor={palette.quiet} multiline style={styles.textareaSmall}/>
        <Pressable disabled={!!busy} onPress={()=>requestReference(emp)} style={styles.primary}><Text style={styles.primaryText}>{busy===`request-${emp.id}`?'Sending…':'Request reference'}</Text></Pressable>
      </View>)}
    </>:null}

    {!loading&&role==='employer'?<>
      <Text style={styles.sectionEyebrow}>REFERENCES</Text>
      <Text style={styles.sectionTitle}>Reference requests</Text>
      {references.length===0?<Text style={styles.empty}>No reference requests yet.</Text>:references.map(ref=><View key={ref.id} style={styles.card}>
        <View style={styles.row}><View style={{flex:1}}><Text style={styles.cardTitle}>{ref.candidate_name||'Talent'}</Text>{ref.candidate_title?<Text style={styles.muted}>{ref.candidate_title}</Text>:null}</View><Text style={styles.status}>{ref.status}</Text></View>
        {ref.request_message?<Text style={styles.requestBox}>{ref.request_message}</Text>:null}
        {ref.status==='pending'?<>
          <TextInput value={responses[ref.id]||''} onChangeText={v=>setResponses(s=>({...s,[ref.id]:v}))} placeholder="Write a useful professional reference…" placeholderTextColor={palette.quiet} multiline style={styles.textarea}/>
          <View style={styles.switchRow}><Text style={styles.switchLabel}>I would hire this person again</Text><Switch value={Boolean(rehire[ref.id])} onValueChange={v=>setRehire(s=>({...s,[ref.id]:v}))} trackColor={{false:palette.lineStrong,true:'#AEBCC4'}} thumbColor={palette.ink}/></View>
          <Pressable disabled={!!busy} onPress={()=>respondReference(ref,'completed')} style={styles.primary}><Text style={styles.primaryText}>{busy===`completed-${ref.id}`?'Submitting…':'Submit verified reference'}</Text></Pressable>
          <Pressable disabled={!!busy} onPress={()=>respondReference(ref,'declined')}><Text style={styles.decline}>Decline request</Text></Pressable>
        </>:ref.status==='completed'?<><Text style={styles.referenceText}>“{ref.response_text}”</Text><Text style={styles.rehire}>{ref.would_rehire?'Would hire again ✓':'Rehire not confirmed'}</Text></>:<Text style={styles.muted}>Request declined.</Text>}
      </View>)}
    </>:null}

    {!loading?<>
      <Text style={[styles.sectionEyebrow,{marginTop:26}]}>REVIEWS</Text>
      <Text style={styles.sectionTitle}>Verified reviews</Text>
      {reviews.length===0?<Text style={styles.empty}>No reviews yet.</Text>:reviews.map(review=><View key={review.id} style={styles.reviewCard}>
        <View style={styles.row}><View><Text style={styles.reviewScore}>{Number(review.rating||0).toFixed(1)} / 5</Text><Text style={styles.reviewStars}>{stars(review.rating)}</Text></View><Text style={styles.date}>{review.created_at?new Date(review.created_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}):''}</Text></View>
        {review.text?<Text style={styles.referenceText}>“{review.text}”</Text>:<Text style={styles.muted}>A verified star rating was left without a written comment.</Text>}
        {review.property_name?<Text style={styles.reviewSource}>Verified at {review.property_name}</Text>:<Text style={styles.reviewSource}>Verified WHC relationship</Text>}
      </View>)}
    </>:null}

    <View style={styles.note}><Text style={styles.noteEyebrow}>TRUST</Text><Text style={styles.noteTitle}>Verified, not anonymous.</Text><Text style={styles.noteCopy}>WHC only unlocks reviews and references where the platform can confirm a genuine working relationship. Reviews cannot be bought or anonymously added to a profile.</Text></View>
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:112},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
  error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:16,fontFamily:type.sans},
  heroScore:{backgroundColor:palette.ink,padding:19,flexDirection:'row',gap:16,marginBottom:10,borderRadius:radius.large},
  heroLeft:{width:116},
  heroRight:{flex:1,justifyContent:'center'},
  heroDivider:{width:1,backgroundColor:'rgba(255,255,255,.18)'},
  score:{color:palette.paper,fontSize:39,lineHeight:44,fontWeight:'400',fontFamily:type.serif},
  heroStars:{color:palette.paper,fontSize:15,letterSpacing:1.2,marginTop:3},
  scoreCopy:{color:'#D6E0E5',fontSize:9.5,lineHeight:15,marginTop:7,fontFamily:type.sans},
  verifiedLabel:{color:'#C8D3D9',fontSize:7.5,letterSpacing:1.5,fontWeight:'700',fontFamily:type.sans},
  verifiedTitle:{color:palette.paper,fontSize:16,lineHeight:20,fontWeight:'400',fontFamily:type.serif,marginTop:6},
  verifiedCopy:{color:'#D6E0E5',fontSize:9.5,lineHeight:15,marginTop:5,fontFamily:type.sans},
  summaryGrid:{flexDirection:'row',gap:8,marginBottom:10},
  summaryCard:{flex:1,borderWidth:1,borderColor:palette.line,padding:14,backgroundColor:palette.paper,borderRadius:radius.medium},
  summaryNumber:{color:palette.inkStrong,fontSize:22,fontWeight:'400',fontFamily:type.serif},
  summaryLabel:{color:palette.muted,fontSize:9,lineHeight:14,marginTop:4,fontFamily:type.sans},
  breakdownCard:{borderWidth:1,borderColor:palette.line,padding:16,marginBottom:26,backgroundColor:palette.paper,borderRadius:radius.large},
  breakdownTitle:{color:palette.inkStrong,fontSize:13,fontWeight:'700',marginBottom:12,fontFamily:type.sans},
  breakdownRow:{flexDirection:'row',alignItems:'center',gap:8,marginVertical:4},
  breakdownLabel:{width:28,color:palette.muted,fontSize:9.5,fontFamily:type.sans},
  track:{height:4,backgroundColor:palette.stoneDeep,flex:1,overflow:'hidden',borderRadius:2},
  fill:{height:4,backgroundColor:palette.ink},
  breakdownCount:{width:18,textAlign:'right',color:palette.quiet,fontSize:9.5,fontFamily:type.sans},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.6,fontWeight:'700',marginBottom:5,fontFamily:type.sans},
  sectionTitle:{color:palette.inkStrong,fontSize:21,lineHeight:26,fontWeight:'400',fontFamily:type.serif,marginBottom:10},
  help:{color:palette.muted,fontSize:10.5,lineHeight:17,marginBottom:12,fontFamily:type.sans},
  empty:{color:palette.quiet,fontSize:11,lineHeight:17,marginBottom:14,fontFamily:type.sans},
  card:{borderWidth:1,borderColor:palette.line,padding:16,marginBottom:9,backgroundColor:palette.paper,borderRadius:radius.large},
  reviewCard:{borderWidth:1,borderColor:palette.line,padding:17,marginBottom:9,backgroundColor:palette.paper,borderRadius:radius.large},
  row:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},
  cardTitle:{color:palette.inkStrong,fontSize:13.5,fontWeight:'700',fontFamily:type.sans},
  status:{color:palette.quiet,fontSize:7.5,textTransform:'uppercase',letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans},
  muted:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:5,fontFamily:type.sans},
  referenceText:{color:palette.text,fontSize:11.5,lineHeight:18,marginTop:11,fontFamily:type.sans},
  rehire:{color:palette.ink,fontSize:9.5,fontWeight:'700',marginTop:8,fontFamily:type.sans},
  requestBox:{backgroundColor:palette.stone,padding:11,color:palette.text,fontSize:10.5,lineHeight:16,marginTop:11,borderRadius:radius.medium,fontFamily:type.sans},
  textarea:{borderWidth:1,borderColor:palette.lineStrong,minHeight:116,padding:12,textAlignVertical:'top',color:palette.text,fontSize:11.5,marginTop:13,backgroundColor:palette.paper,borderRadius:radius.medium,fontFamily:type.sans},
  textareaSmall:{borderWidth:1,borderColor:palette.lineStrong,minHeight:70,padding:11,textAlignVertical:'top',color:palette.text,fontSize:10.5,marginTop:11,backgroundColor:palette.paper,borderRadius:radius.medium,fontFamily:type.sans},
  switchRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',marginTop:12},
  switchLabel:{color:palette.text,fontSize:10.5,flex:1,paddingRight:10,fontFamily:type.sans},
  primary:{backgroundColor:palette.ink,paddingVertical:13,alignItems:'center',marginTop:13,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  decline:{color:palette.danger,fontSize:9.5,textAlign:'center',padding:12,fontFamily:type.sans},
  reviewScore:{color:palette.inkStrong,fontSize:14.5,fontWeight:'700',fontFamily:type.sans},
  reviewStars:{color:palette.inkStrong,fontSize:15,letterSpacing:1.1,marginTop:3},
  reviewSource:{color:palette.ink,fontSize:9.5,fontWeight:'700',marginTop:10,fontFamily:type.sans},
  date:{color:palette.quiet,fontSize:8.5,fontFamily:type.sans},
  note:{backgroundColor:palette.stoneDeep,padding:17,marginTop:20,borderRadius:radius.large},
  noteEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  noteTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  noteCopy:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:5,fontFamily:type.sans},
})
