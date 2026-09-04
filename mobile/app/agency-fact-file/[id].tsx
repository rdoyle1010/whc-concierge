import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talenthousecollective.co.uk'
const list=(value:any)=>Array.isArray(value)?value.filter(Boolean):[]
const time=(value?:string|null)=>value?value.slice(0,5):''

function Line({label,value}:{label:string;value:any}){
  if(value===null||value===undefined||value==='')return null
  return <View style={styles.line}><Text style={styles.lineLabel}>{label}</Text><Text style={styles.lineValue}>{String(value)}</Text></View>
}

function Section({eyebrow='SHIFT FACTS',title,children}:{eyebrow?:string;title:string;children:any}){
  return <View style={styles.section}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text>{children}</View>
}

function Chips({items}:{items:any[]}){
  if(!items.length)return null
  return <View style={styles.chips}>{items.map((item:any)=><Text key={String(item)} style={styles.chip}>{String(item)}</Text>)}</View>
}

export default function AgencyFactFileScreen(){
  const {id}=useLocalSearchParams<{id:string}>()
  const [data,setData]=useState<any>(null)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [counterRate,setCounterRate]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{void load()},[id])

  async function authFetch(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const res=await fetch(`${WEB_URL}${path}`,{...options,headers:{Authorization:`Bearer ${session.access_token}`,'Content-Type':'application/json',...(options?.headers||{})}})
    const body=await res.json().catch(()=>({}))
    if(!res.ok)throw new Error(body?.error||'Could not load this shift.')
    return body
  }

  async function load(){
    setLoading(true);setError('')
    try{
      const body=await authFetch(`/api/mobile/agency/fact-file/${id}`)
      setData(body)
      if(body?.booking?.rate)setCounterRate(String(body.booking.rate))
    }catch(e:any){setError(e?.message||'Could not load this shift.')}
    finally{setLoading(false)}
  }

  async function act(action:'accept'|'decline'|'counter'){
    if(!data?.booking||busy)return
    if(action==='counter'){
      const value=Number(counterRate)
      if(!Number.isFinite(value)||value<=0){Alert.alert('Enter a rate','Enter the hourly rate you would accept.');return}
    }
    setBusy(action);setError('')
    try{
      await authFetch('/api/mobile/agency/booking-action',{method:'POST',body:JSON.stringify({bookingId:data.booking.id,action,rate:action==='counter'?Number(counterRate):undefined})})
      Alert.alert('Shift updated',action==='accept'?'You have accepted the shift. The property will now complete confirmation.':action==='decline'?'The shift has been declined.':'Your counter-offer has been sent.')
      await load()
    }catch(e:any){setError(e?.message||'Could not update this shift.')}
    finally{setBusy('')}
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>
  if(!data?.booking)return <View style={styles.center}><Text style={styles.error}>{error||'Shift not found.'}</Text><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Agency</Text></Pressable></View>

  const b=data.booking
  const p=data.property||{}
  const f=data.fact_file||{}
  const snapshot=data.arrival_pack?.snapshot||null
  const photos=list(p.photos)
  const candidateView=data.viewer_role==='candidate'
  const open=['pending','offered','requested','countered'].includes(String(b.status))
  const rating=Number(p.review_score||0)
  const hours=Number(b.hours||0)>0?Number(b.hours):8
  const pay=Number(b.professional_pay||Number(b.rate||0)*hours)
  const documents=list(f.useful_documents)
  const services=list(p.services_offered)
  const brands=list(p.product_houses_used)
  const systems=list(p.systems_used)
  const highlights=list(p.highlights)

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Agency</Text></Pressable>
    {candidateView&&photos[0]?<Image source={{uri:photos[0]}} style={styles.hero}/>:null}

    <View style={styles.headingRow}>
      <View style={{flex:1}}><Text style={styles.eyebrow}>AGENCY · FACT FILE</Text><Text style={styles.title}>{candidateView?p.name:(data.candidate?.full_name||'Agency shift')}</Text></View>
      <View style={styles.statusPill}><Text style={styles.statusPillText}>{String(b.status).toUpperCase()}</Text></View>
    </View>
    <Text style={styles.meta}>{[b.shift_date,`${time(b.shift_start_time)}${b.shift_end_time?` – ${time(b.shift_end_time)}`:''}`,b.shift_type].filter(Boolean).join(' · ')}</Text>
    <Text style={styles.intro}>{candidateView?'Everything you should know about the property and the working day before you decide whether to accept.':'The practical property and shift record attached to this Agency booking.'}</Text>

    {candidateView?<View style={styles.propertyCard}>
      <View style={styles.propertyTop}>
        {p.logo_url?<Image source={{uri:p.logo_url}} style={styles.logo} resizeMode="contain"/>:null}
        <View style={{flex:1}}><Text style={styles.propertyEyebrow}>PROPERTY PROFILE</Text><Text style={styles.propertyName}>{p.name}</Text><Text style={styles.propertyLocation}>{[p.location,p.postcode].filter(Boolean).join(' · ')}</Text></View>
        <View style={styles.ratingBox}><Text style={styles.rating}>{rating?rating.toFixed(1):(p.star_rating?String(p.star_rating):'—')}</Text><Text style={styles.ratingCount}>{rating?'★ WHC':p.star_rating?'★ PROPERTY':'NEW'}</Text></View>
      </View>
      {p.description?<Text style={styles.description}>{p.description}</Text>:null}
      {photos.length>1?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>{photos.slice(1,6).map((photo:string,i:number)=><Image key={`${photo}-${i}`} source={{uri:photo}} style={styles.thumb}/>)}</ScrollView>:null}
      <Pressable onPress={()=>router.push({pathname:'/property/[id]',params:{id:p.id}})} style={styles.propertyLink}><Text style={styles.propertyLinkText}>Open full hotel & spa profile</Text><Text style={styles.arrow}>→</Text></Pressable>
    </View>:null}

    <View style={styles.payCard}>
      <Text style={styles.payEyebrow}>YOUR SHIFT</Text>
      <View style={styles.payTop}><View><Text style={styles.pay}>£{b.rate}<Text style={styles.payUnit}>/hr</Text></Text><Text style={styles.payCopy}>{hours} working hours</Text></View><View style={styles.payRight}><Text style={styles.payTotal}>£{pay}</Text><Text style={styles.payTotalLabel}>professional pay</Text></View></View>
      {b.distance_miles!=null?<View style={styles.distanceRow}><Text style={styles.distanceLabel}>TRAVEL</Text><Text style={styles.distance}>{b.distance_miles} miles from your saved location</Text></View>:null}
    </View>

    {candidateView?<>
      <Section eyebrow="TRAVEL & ARRIVAL" title="Getting there">
        <Line label="Property address" value={f.property_address||[p.location,p.postcode].filter(Boolean).join(' · ')}/>
        <Line label="Directions" value={f.directions}/>
        <Line label="Nearest station / transport" value={f.nearest_transport||p.nearest_transport}/>
        <Line label="Walk from transport" value={p.transport_walk_minutes!=null?`${p.transport_walk_minutes} minutes`:null}/>
        <Line label="Parking" value={(f.parking_available??p.parking_available)?(f.parking_details||'Staff parking available'):p.commute_car_required?'Car recommended / required':null}/>
        <Line label="Taxi support" value={p.taxi_support?(p.taxi_notes||'May be available'):null}/>
        <Line label="Staff entrance / arrival point" value={f.staff_entrance}/>
        <Line label="Arrive before shift" value={f.recommended_arrival_buffer_minutes!=null?`${f.recommended_arrival_buffer_minutes} minutes`:null}/>
        {f.map_url?<Pressable onPress={()=>Linking.openURL(f.map_url)} style={styles.linkButton}><Text style={styles.linkText}>Open map</Text><Text style={styles.arrow}>→</Text></Pressable>:null}
      </Section>

      <Section eyebrow="ON ARRIVAL" title="Who to report to">
        <Line label="Name" value={f.arrival_contact_name}/>
        <Line label="Role" value={f.arrival_contact_role}/>
        <Line label="Contact number" value={f.arrival_phone}/>
        {p.agency_note?<View style={styles.note}><Text style={styles.noteLabel}>PROPERTY NOTE</Text><Text style={styles.noteText}>{p.agency_note}</Text></View>:null}
      </Section>

      <Section eyebrow="PRESENTATION" title="Uniform & what to bring">
        <Line label="Uniform" value={f.uniform_required}/>
        <Line label="Bring with you" value={f.worker_should_bring}/>
        <Line label="Changing facilities" value={f.changing_facilities}/>
        <Line label="Locker information" value={f.locker_information}/>
      </Section>

      <Section eyebrow="WELFARE" title="During your shift">
        <Line label="Food" value={f.food_provided}/>
        <Line label="Staff restaurant" value={f.staff_restaurant}/>
        <Line label="Refreshments" value={f.refreshments}/>
        <Line label="Break policy" value={f.break_policy}/>
      </Section>

      <Section eyebrow="SPA OPERATIONS" title="Working facts">
        <View style={styles.metricGrid}>
          {p.num_treatment_rooms!=null?<Metric label="Treatment rooms" value={String(p.num_treatment_rooms)}/>:null}
          {p.team_size!=null?<Metric label="Spa team" value={String(p.team_size)}/>:null}
        </View>
        {brands.length?<><Text style={styles.miniHeading}>Product houses</Text><Chips items={brands}/></>:null}
        {services.length?<><Text style={styles.miniHeading}>Treatments & services</Text><Chips items={services}/></>:null}
        {systems.length?<><Text style={styles.miniHeading}>Systems</Text><Chips items={systems}/></>:null}
        <Line label="Treatment protocols" value={f.treatment_protocols}/>
        <Line label="Booking system" value={f.booking_system}/>
        <Line label="Guest service standards" value={f.guest_service_standards}/>
        <Line label="Property rules" value={f.property_rules}/>
      </Section>

      {(f.retail_commission||f.treatment_commission||f.gratuities_service_charge||f.retail_targets)?<Section eyebrow="COMMERCIAL" title="Earnings & expectations">
        <Line label="Retail commission" value={f.retail_commission}/>
        <Line label="Treatment commission" value={f.treatment_commission}/>
        <Line label="Gratuities / service charge" value={f.gratuities_service_charge}/>
        <Line label="Retail targets" value={f.retail_targets}/>
      </Section>:null}

      <Section eyebrow="SAFETY" title="Know before you work">
        <Line label="Fire & emergency basics" value={f.fire_emergency_basics}/>
        <Line label="Assembly point" value={f.assembly_point}/>
        <Line label="Health & safety" value={f.health_safety_acknowledgement}/>
        <Pressable onPress={()=>router.push('/security')} style={styles.security}><Text style={styles.securityEyebrow}>WHC SHIFT PROTECTION</Text><Text style={styles.securityTitle}>Safety & Security</Text><Text style={styles.securityText}>Review platform safety, privacy and what to do if something feels wrong before or during a shift.</Text><Text style={styles.securityLink}>Open guidance →</Text></Pressable>
      </Section>

      {highlights.length?<Section eyebrow="PROPERTY" title="Useful facts"><Chips items={highlights}/></Section>:null}

      {documents.length?<Section eyebrow="DOCUMENTS" title="Useful documents">{documents.map((doc:any,i:number)=>{
        const label=typeof doc==='string'?`Document ${i+1}`:(doc?.label||doc?.name||`Document ${i+1}`)
        const url=typeof doc==='string'?doc:doc?.url
        return url?<Pressable key={`${label}-${i}`} onPress={()=>Linking.openURL(url)} style={styles.document}><View style={{flex:1}}><Text style={styles.documentEyebrow}>PROPERTY DOCUMENT</Text><Text style={styles.documentText}>{label}</Text></View><Text style={styles.arrow}>→</Text></Pressable>:null
      })}</Section>:null}

      {snapshot?<View style={styles.snapshot}><Text style={styles.snapshotEyebrow}>CONFIRMED RECORD</Text><Text style={styles.snapshotTitle}>Before You Arrive snapshot saved</Text><Text style={styles.snapshotText}>The information agreed for this booking is preserved even if the property updates its live Fact File later.</Text></View>:null}
    </>:null}

    {candidateView&&open?<View style={styles.actions}>
      <Text style={styles.actionEyebrow}>YOUR DECISION</Text><Text style={styles.actionTitle}>Ready to take the shift?</Text><Text style={styles.actionHelp}>Accept only when you are happy with the shift, property and arrival information above.</Text>
      <Pressable disabled={!!busy} onPress={()=>act('accept')} style={[styles.primary,!!busy&&styles.disabled]}><Text style={styles.primaryText}>{busy==='accept'?'Accepting…':'Accept shift'}</Text></Pressable>
      <View style={styles.counter}><Text style={styles.counterEyebrow}>COUNTER OFFER</Text><Text style={styles.counterTitle}>Want a different rate?</Text><Text style={styles.counterCopy}>Enter the hourly rate you would accept.</Text><View style={styles.counterRow}><Text style={styles.currency}>£</Text><TextInput value={counterRate} onChangeText={setCounterRate} keyboardType="decimal-pad" style={styles.input}/><Text style={styles.perHour}>/hr</Text></View><Pressable disabled={!!busy} onPress={()=>act('counter')} style={styles.secondary}><Text style={styles.secondaryText}>{busy==='counter'?'Sending…':'Send counter-offer'}</Text></Pressable></View>
      <Pressable disabled={!!busy} onPress={()=>act('decline')} style={styles.decline}><Text style={styles.declineText}>{busy==='decline'?'Declining…':'Decline shift'}</Text></Pressable>
    </View>:null}

    {!candidateView?<Pressable onPress={()=>router.push({pathname:'/agency-booking/[id]',params:{id:b.id}})} style={styles.primary}><Text style={styles.primaryText}>Open booking controls →</Text></Pressable>:null}
    {error?<View style={styles.errorCard}><Text style={styles.errorTitle}>We could not update this shift</Text><Text style={styles.error}>{error}</Text></View>:null}
  </ScrollView>
}

function Metric({label,value}:{label:string;value:string}){return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:120},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:palette.stone},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:20},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  hero:{width:'100%',height:220,backgroundColor:palette.stoneDeep,marginBottom:18,borderRadius:radius.large},
  headingRow:{flexDirection:'row',gap:12,alignItems:'flex-start'},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:8,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:31,lineHeight:37,fontWeight:'400',fontFamily:type.serif},
  meta:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:7,fontFamily:type.sans},
  intro:{color:palette.muted,fontSize:12,lineHeight:19,marginTop:9,fontFamily:type.sans},
  statusPill:{backgroundColor:palette.stoneDeep,paddingHorizontal:8,paddingVertical:5,borderRadius:999},
  statusPillText:{color:palette.quiet,fontSize:7,fontWeight:'800',letterSpacing:.8,fontFamily:type.sans},
  propertyCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,marginTop:18,borderRadius:radius.large},
  propertyTop:{flexDirection:'row',gap:10,alignItems:'center'},
  logo:{width:48,height:48,borderWidth:1,borderColor:palette.line,borderRadius:radius.medium,backgroundColor:palette.paper},
  propertyEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans},
  propertyName:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:3},
  propertyLocation:{color:palette.quiet,fontSize:9.5,marginTop:3,fontFamily:type.sans},
  ratingBox:{alignItems:'flex-end'},
  rating:{color:palette.inkStrong,fontSize:18,fontWeight:'700',fontFamily:type.sans},
  ratingCount:{color:palette.quiet,fontSize:7.5,marginTop:2,fontFamily:type.sans},
  description:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:11,fontFamily:type.sans},
  gallery:{marginTop:11},
  thumb:{width:112,height:78,marginRight:8,backgroundColor:palette.stoneDeep,borderRadius:radius.medium},
  propertyLink:{borderTopWidth:1,borderTopColor:palette.line,paddingTop:12,marginTop:12,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  propertyLinkText:{color:palette.ink,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  arrow:{color:palette.ink,fontSize:15},
  payCard:{backgroundColor:palette.inkStrong,padding:18,marginTop:11,borderRadius:radius.large},
  payEyebrow:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  payTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',gap:12,marginTop:5},
  pay:{color:palette.paper,fontSize:31,fontWeight:'400',fontFamily:type.serif},
  payUnit:{fontSize:12,fontWeight:'600',fontFamily:type.sans},
  payCopy:{color:'#D8E1E4',fontSize:9,marginTop:3,fontFamily:type.sans},
  payRight:{alignItems:'flex-end'},
  payTotal:{color:palette.paper,fontSize:22,fontWeight:'700',fontFamily:type.sans},
  payTotalLabel:{color:'#CBD5D9',fontSize:8,marginTop:2,fontFamily:type.sans},
  distanceRow:{borderTopWidth:1,borderTopColor:'rgba(255,255,255,.16)',marginTop:14,paddingTop:11},
  distanceLabel:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1,fontWeight:'700',fontFamily:type.sans},
  distance:{color:palette.paper,fontSize:9.5,marginTop:3,fontFamily:type.sans},
  section:{marginTop:26},
  sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.4,fontWeight:'700',fontFamily:type.sans},
  sectionTitle:{color:palette.inkStrong,fontSize:21,lineHeight:26,fontWeight:'400',fontFamily:type.serif,marginTop:4,marginBottom:9},
  line:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:12,marginBottom:7,borderRadius:radius.medium},
  lineLabel:{color:palette.quiet,fontSize:7.5,textTransform:'uppercase',letterSpacing:.8,fontWeight:'700',fontFamily:type.sans},
  lineValue:{color:palette.text,fontSize:10.5,lineHeight:16,fontWeight:'600',marginTop:4,fontFamily:type.sans},
  note:{backgroundColor:palette.stoneDeep,padding:13,marginTop:5,borderRadius:radius.medium},
  noteLabel:{color:palette.quiet,fontSize:7.5,letterSpacing:1,fontWeight:'700',fontFamily:type.sans},
  noteText:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:4,fontFamily:type.sans},
  linkButton:{borderWidth:1,borderColor:palette.lineStrong,padding:12,marginTop:3,borderRadius:radius.medium,backgroundColor:palette.paper,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},
  linkText:{color:palette.ink,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  metricGrid:{flexDirection:'row',gap:8,marginBottom:8},
  metric:{flex:1,backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:13,borderRadius:radius.medium},
  metricValue:{color:palette.inkStrong,fontSize:21,fontWeight:'400',fontFamily:type.serif},
  metricLabel:{color:palette.quiet,fontSize:8.5,marginTop:3,fontFamily:type.sans},
  miniHeading:{color:palette.inkStrong,fontSize:10,fontWeight:'700',marginTop:13,marginBottom:7,fontFamily:type.sans},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:6},
  chip:{backgroundColor:palette.stoneDeep,color:palette.text,fontSize:9,paddingHorizontal:9,paddingVertical:6,borderRadius:999,fontFamily:type.sans},
  security:{backgroundColor:palette.ink,padding:15,marginTop:5,borderRadius:radius.large},
  securityEyebrow:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  securityTitle:{color:palette.paper,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:4},
  securityText:{color:'#DCE4E7',fontSize:9.5,lineHeight:15,marginTop:4,fontFamily:type.sans},
  securityLink:{color:palette.paper,fontSize:9.5,fontWeight:'700',marginTop:9,fontFamily:type.sans},
  document:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:13,marginBottom:7,borderRadius:radius.medium,flexDirection:'row',alignItems:'center',gap:10},
  documentEyebrow:{color:palette.quiet,fontSize:7,letterSpacing:1,fontWeight:'700',fontFamily:type.sans},
  documentText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',marginTop:3,fontFamily:type.sans},
  snapshot:{backgroundColor:palette.stoneDeep,padding:15,marginTop:22,borderRadius:radius.large},
  snapshotEyebrow:{color:palette.sage,fontSize:7.5,letterSpacing:1.2,fontWeight:'800',fontFamily:type.sans},
  snapshotTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  snapshotText:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:5,fontFamily:type.sans},
  actions:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,marginTop:24,borderRadius:radius.large},
  actionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  actionTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:4},
  actionHelp:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  primary:{backgroundColor:palette.ink,paddingVertical:14,alignItems:'center',marginTop:14,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  counter:{backgroundColor:palette.stoneDeep,padding:14,marginTop:12,borderRadius:radius.medium},
  counterEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans},
  counterTitle:{color:palette.inkStrong,fontSize:14,fontWeight:'700',marginTop:4,fontFamily:type.sans},
  counterCopy:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:4,fontFamily:type.sans},
  counterRow:{flexDirection:'row',alignItems:'center',marginTop:10},
  currency:{color:palette.inkStrong,fontSize:17,marginRight:5,fontFamily:type.sans},
  input:{flex:1,borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:12,paddingVertical:10,color:palette.text,fontSize:13,backgroundColor:palette.paper,borderRadius:radius.medium,fontFamily:type.sans},
  perHour:{color:palette.muted,fontSize:10,marginLeft:6,fontFamily:type.sans},
  secondary:{borderWidth:1,borderColor:palette.lineStrong,paddingVertical:12,alignItems:'center',marginTop:9,borderRadius:radius.medium,backgroundColor:palette.paper},
  secondaryText:{color:palette.inkStrong,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  decline:{paddingVertical:13,alignItems:'center',marginTop:6},
  declineText:{color:palette.danger,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  errorCard:{backgroundColor:palette.dangerSoft,borderWidth:1,borderColor:'#E8D7D4',padding:14,borderRadius:radius.large,marginTop:14},
  errorTitle:{color:palette.danger,fontSize:13,fontWeight:'700',fontFamily:type.sans},
  error:{color:palette.danger,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
  disabled:{opacity:.45},
})
