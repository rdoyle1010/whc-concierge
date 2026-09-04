import { useEffect, useState } from 'react'
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const BUCKET='property-fact-documents'
function entries(obj:any){if(!obj||typeof obj!=='object')return [] as [string,any][];return Object.entries(obj).filter(([,v])=>v!==null&&v!==undefined&&v!==''&&v!==false) as [string,any][]}
function label(k:string){return k.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}
function dateLabel(value?:string|null){if(!value)return'—';const date=new Date(value);return Number.isNaN(date.getTime())?'—':date.toLocaleString('en-GB',{day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}

export default function BeforeYouArriveScreen(){
 const [packs,setPacks]=useState<any[]>([])
 const [loading,setLoading]=useState(true)
 const [busy,setBusy]=useState('')
 const [opening,setOpening]=useState('')
 const [error,setError]=useState('')

 useEffect(()=>{void load()},[])

 async function load(){
  const {data:{user}}=await supabase.auth.getUser()
  if(!user){router.replace('/login');return}
  const {data:profile}=await supabase.from('candidate_profiles').select('id').eq('user_id',user.id).maybeSingle()
  if(profile){
   const {data,error:e}=await supabase.from('booking_arrival_packs').select('*').eq('candidate_id',profile.id).order('generated_at',{ascending:false})
   if(e)setError(e.message)
   setPacks(data||[])
  }
  setLoading(false)
 }

 async function acknowledge(id:string){
  setBusy(id)
  const now=new Date().toISOString()
  const {error:e}=await supabase.from('booking_arrival_packs').update({acknowledged_at:now}).eq('id',id)
  if(e)setError(e.message)
  else setPacks(current=>current.map(item=>item.id===id?{...item,acknowledged_at:now}:item))
  setBusy('')
 }

 async function openDoc(doc:any){
  if(!doc?.path)return
  setOpening(doc.path);setError('')
  const {data,error:e}=await supabase.storage.from(BUCKET).createSignedUrl(doc.path,600)
  setOpening('')
  if(e||!data?.signedUrl){setError('This document could not be opened.');return}
  await Linking.openURL(data.signedUrl)
 }

 return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
  <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
  <Text style={styles.eyebrow}>CONFIRMED FLEXIBLE WORK</Text>
  <Text style={styles.title}>Before you arrive</Text>
  <Text style={styles.intro}>Everything you need after accepting an Agency shift or Residency placement: arrival instructions, travel, welfare, safety, operating expectations and secure property documents.</Text>

  {loading?<ActivityIndicator color={palette.ink} style={{marginTop:28}}/>:null}
  {error?<Text style={styles.error}>{error}</Text>:null}

  {!loading&&packs.length===0?<View style={styles.empty}>
   <Text style={styles.emptyEyebrow}>NO CONFIRMED PACKS</Text>
   <Text style={styles.emptyTitle}>Nothing to prepare for yet.</Text>
   <Text style={styles.emptyCopy}>A Before You Arrive pack appears automatically once an Agency shift or Residency placement is confirmed.</Text>
  </View>:null}

  <View style={styles.list}>{packs.map(pack=>{
   const snapshot=pack.snapshot||{}
   const docs=Array.isArray(snapshot.documents)?snapshot.documents:[]
   const acknowledged=Boolean(pack.acknowledged_at)
   return <View key={pack.id} style={styles.card}>
    <View style={styles.cardHeader}>
     <View style={{flex:1}}>
      <Text style={styles.type}>{pack.booking_type==='residency'?'RESIDENCY PLACEMENT':'AGENCY SHIFT'}</Text>
      <Text style={styles.property}>{snapshot.property?.name||'Property'}</Text>
      <Text style={styles.generated}>Pack generated {dateLabel(pack.generated_at)}</Text>
     </View>
     <View style={[styles.statusPill,acknowledged&&styles.statusPillDone]}><Text style={[styles.statusText,acknowledged&&styles.statusTextDone]}>{acknowledged?'READ':'ACTION'}</Text></View>
    </View>

    {acknowledged?<View style={styles.ack}><Text style={styles.ackEyebrow}>ACKNOWLEDGED</Text><Text style={styles.ackText}>You confirmed this pack was read {dateLabel(pack.acknowledged_at)}.</Text></View>:<View style={styles.actionBox}>
     <Text style={styles.actionEyebrow}>BEFORE YOUR SHIFT</Text>
     <Text style={styles.actionTitle}>Read the pack before travelling.</Text>
     <Text style={styles.actionCopy}>Check arrival, safety and working expectations, then acknowledge the pack so both sides have a clear record.</Text>
     <Pressable disabled={busy===pack.id} onPress={()=>acknowledge(pack.id)} style={styles.primary}><Text style={styles.primaryText}>{busy===pack.id?'Saving…':'I have read this pack'}</Text></Pressable>
    </View>}

    <Section title="Getting there" data={snapshot.property}/>
    <Section title="Arrival & shift" data={{...(snapshot.arrival||{}),...(snapshot.booking||{})}}/>
    <Section title="Welfare & breaks" data={snapshot.welfare}/>
    <Section title="Safety essentials" data={snapshot.safety}/>
    <Section title="Spa operations & expectations" data={snapshot.spa}/>
    {pack.booking_type==='residency'?<Section title="Residency stay details" data={snapshot.residency}/>:null}

    {docs.length?<View style={styles.section}>
     <Text style={styles.sectionEyebrow}>DOCUMENTS</Text>
     <Text style={styles.sectionTitle}>Useful documents</Text>
     {docs.map((doc:any,index:number)=><Pressable key={`${doc.path}-${index}`} disabled={opening===doc.path} onPress={()=>openDoc(doc)} style={styles.doc}>
      <View style={{flex:1}}><Text style={styles.docTitle}>{doc.name||'Document'}</Text><Text style={styles.docCopy}>Secure property document · link expires after opening</Text></View>
      <Text style={styles.docOpen}>{opening===doc.path?'Opening…':'Open →'}</Text>
     </Pressable>)}
    </View>:null}
   </View>
  })}</View>
 </ScrollView>
}

function Section({title,data}:{title:string;data:any}){
 const rows=entries(data)
 if(!rows.length)return null
 return <View style={styles.section}>
  <Text style={styles.sectionEyebrow}>ARRIVAL PACK</Text>
  <Text style={styles.sectionTitle}>{title}</Text>
  {rows.map(([key,value])=><View key={key} style={styles.fact}><Text style={styles.factLabel}>{label(key)}</Text><Text style={styles.factValue}>{typeof value==='boolean'?(value?'Yes':'No'):String(value)}</Text></View>)}
 </View>
}

const styles=StyleSheet.create({
 scroll:{flex:1,backgroundColor:palette.stone},
 page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
 backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
 back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
 eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
 title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif},
 intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
 error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:14,fontFamily:type.sans},
 list:{gap:12},
 card:{borderWidth:1,borderColor:palette.line,padding:17,backgroundColor:palette.paper,borderRadius:radius.large},
 cardHeader:{flexDirection:'row',gap:12,alignItems:'flex-start'},
 type:{color:palette.quiet,fontSize:7.5,fontWeight:'800',letterSpacing:1.3,fontFamily:type.sans},
 property:{color:palette.inkStrong,fontSize:23,lineHeight:28,fontWeight:'400',fontFamily:type.serif,marginTop:5},
 generated:{color:palette.quiet,fontSize:9,marginTop:5,fontFamily:type.sans},
 statusPill:{backgroundColor:palette.dangerSoft,paddingHorizontal:8,paddingVertical:5,borderRadius:999},
 statusPillDone:{backgroundColor:palette.stoneDeep},
 statusText:{color:palette.danger,fontSize:7,fontWeight:'800',letterSpacing:.8,fontFamily:type.sans},
 statusTextDone:{color:palette.ink},
 actionBox:{backgroundColor:palette.stoneDeep,padding:14,borderRadius:radius.medium,marginTop:15},
 actionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
 actionTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
 actionCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
 primary:{backgroundColor:palette.ink,paddingVertical:13,alignItems:'center',marginTop:12,borderRadius:radius.medium},
 primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
 ack:{backgroundColor:palette.stoneDeep,padding:13,borderRadius:radius.medium,marginTop:15},
 ackEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
 ackText:{color:palette.text,fontSize:10.5,lineHeight:16,marginTop:4,fontFamily:type.sans},
 section:{borderTopWidth:1,borderTopColor:palette.line,paddingTop:15,marginTop:17},
 sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
 sectionTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:4,marginBottom:5},
 fact:{paddingVertical:8,borderTopWidth:1,borderTopColor:palette.line},
 factLabel:{color:palette.quiet,fontSize:7.5,letterSpacing:.9,textTransform:'uppercase',fontWeight:'700',fontFamily:type.sans},
 factValue:{color:palette.text,fontSize:10.5,lineHeight:16,marginTop:4,fontFamily:type.sans},
 doc:{flexDirection:'row',alignItems:'center',gap:10,borderWidth:1,borderColor:palette.line,padding:12,marginTop:8,borderRadius:radius.medium,backgroundColor:palette.stone},
 docTitle:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
 docCopy:{color:palette.muted,fontSize:8.5,lineHeight:13,marginTop:3,fontFamily:type.sans},
 docOpen:{color:palette.ink,fontSize:9.5,fontWeight:'700',fontFamily:type.sans},
 empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:19,borderRadius:radius.large},
 emptyEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
 emptyTitle:{color:palette.inkStrong,fontSize:19,lineHeight:24,fontWeight:'400',fontFamily:type.serif,marginTop:5},
 emptyCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
})