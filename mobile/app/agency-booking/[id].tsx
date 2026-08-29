import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, AppState, Image, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../../src/lib/supabase'
import { palette, radius, space, type } from '../../src/lib/theme'

type Booking={id:string;shift_date:string|null;shift_start_time:string|null;shift_end_time:string|null;shift_type?:string|null;hours?:number|null;rate:number;status:string;urgent?:boolean|null;expires_at?:string|null;booking_group?:string|null;cascade_position?:number|null;cascade_total?:number|null;platform_fee?:number|null;paid_at?:string|null;fee_paid_at?:string|null;employer_name?:string|null;employer_location?:string|null;employer_postcode?:string|null;employer_description?:string|null;employer_photos?:string[]|null;employer_review_score?:number|null;employer_review_count?:number|null;employer_star_rating?:number|null;distance_miles?:number|null;nearest_transport?:string|null;transport_walk_minutes?:number|null;parking_available?:boolean|null;taxi_support?:boolean|null;taxi_notes?:string|null;travel_notes?:string|null;candidate_name?:string|null;viewer_role?:'candidate'|'employer'}
const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'
function timeLabel(value?:string|null){return value?value.slice(0,5):''}

export default function AgencyBookingScreen(){
  const {id}=useLocalSearchParams<{id:string}>()
  const [booking,setBooking]=useState<Booking|null>(null)
  const [counterRate,setCounterRate]=useState('')
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{void load()},[id])
  useEffect(()=>{const subscription=AppState.addEventListener('change',state=>{if(state==='active'&&booking?.id)void load(false)});return()=>subscription.remove()},[booking?.id])

  async function authFetch(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`,...(options?.headers||{})}})
    const body=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(body?.error||'Could not update this shift.')
    return body
  }

  async function load(showSpinner=true){
    if(showSpinner)setLoading(true)
    setError('')
    try{
      const payload=await authFetch('/api/agency/booking')
      const found=((payload?.bookings||[]) as Booking[]).find(row=>row.id===id)||null
      setBooking(found)
      if(found?.rate)setCounterRate(String(found.rate))
    }catch(e:any){setError(e?.message||'Could not load this shift.')}
    finally{if(showSpinner)setLoading(false)}
  }

  async function act(action:'accept'|'decline'|'counter'|'accept_group'){
    if(!booking)return
    if(action==='counter'){
      const rate=Number(counterRate)
      if(!Number.isFinite(rate)||rate<=0){Alert.alert('Enter a rate','Enter the hourly rate you want to counter with.');return}
    }
    setBusy(action);setError('')
    try{
      const result=await authFetch('/api/mobile/agency/booking-action',{method:'POST',body:JSON.stringify({bookingId:booking.id,action,rate:action==='counter'?Number(counterRate):undefined})})
      const copy=action==='accept_group'?`All ${result?.accepted||''} standing shifts accepted.`:action==='accept'?(result?.paymentRequired?`Offer accepted. The property now needs to confirm payment${result?.totalDue?` (£${result.totalDue})`:''}.`:'Offer accepted.'):action==='decline'?(result?.message||'Offer declined.'):'Counter-offer sent.'
      Alert.alert('Agency shift updated',copy)
      await load(false)
    }catch(e:any){setError(e?.message||'Could not update this shift.')}
    finally{setBusy('')}
  }

  async function startPayment(){
    if(!booking)return
    setBusy('payment');setError('')
    try{
      const result=await authFetch('/api/mobile/agency/checkout',{method:'POST',body:JSON.stringify({bookingId:booking.id})})
      if(!result?.url)throw new Error('Stripe checkout could not be opened.')
      Alert.alert('Confirm Agency booking',`Professional: £${result.gross}\nWHC platform fee: £${result.fee}\nTotal to pay: £${result.total}`,[{text:'Not yet',style:'cancel'},{text:`Pay £${result.total}`,onPress:()=>Linking.openURL(result.url).catch(()=>setError('Could not open secure payment.'))}])
    }catch(e:any){setError(e?.message||'Could not start payment.')}
    finally{setBusy('')}
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>
  if(!booking)return <View style={styles.center}><Text style={styles.error}>{error||'Shift not found.'}</Text><Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Agency</Text></Pressable></View>

  const candidateView=booking.viewer_role==='candidate'
  const open=['pending','countered'].includes(booking.status)
  const employerCanAccept=!candidateView&&booking.status==='countered'
  const employerCanPay=!candidateView&&booking.status==='accepted'&&!booking.paid_at&&!booking.fee_paid_at
  const paid=Boolean(booking.paid_at||booking.fee_paid_at||booking.status==='confirmed')
  const name=candidateView?(booking.employer_name||'Property'):(booking.candidate_name||'Professional')
  const expiredInMinutes=booking.expires_at?Math.max(0,Math.ceil((new Date(booking.expires_at).getTime()-Date.now())/60000)):null
  const effectiveHours=booking.hours&&booking.hours>0?booking.hours:8
  const shiftGross=booking.rate*effectiveHours
  const fee=booking.platform_fee&&booking.platform_fee>0?booking.platform_fee:Math.ceil(shiftGross*.10)
  const expectedTotal=shiftGross+fee
  const photos=Array.isArray(booking.employer_photos)?booking.employer_photos.filter(Boolean):[]
  const rating=Number(booking.employer_review_score||booking.employer_star_rating||0)

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Agency</Text></Pressable>
    {candidateView&&photos[0]?<Image source={{uri:photos[0]}} style={styles.hero}/>:null}

    <View style={styles.headingRow}>
      <View style={{flex:1}}><Text style={styles.eyebrow}>{booking.urgent?'URGENT AGENCY SHIFT':'AGENCY SHIFT'}</Text><Text style={styles.title}>{name}</Text></View>
      <View style={[styles.statusPill,paid&&styles.statusPillConfirmed]}><Text style={[styles.statusText,paid&&styles.statusTextConfirmed]}>{paid?'CONFIRMED':booking.status.toUpperCase()}</Text></View>
    </View>
    <Text style={styles.meta}>{[booking.shift_date,`${timeLabel(booking.shift_start_time)}${booking.shift_end_time?` – ${timeLabel(booking.shift_end_time)}`:''}`,booking.shift_type].filter(Boolean).join(' · ')}</Text>

    {candidateView?<View style={styles.propertyCard}>
      <View style={styles.propertyTop}><View style={{flex:1}}><Text style={styles.sectionEyebrow}>PROPERTY</Text><Text style={styles.propertyName}>{booking.employer_name||'Property'}</Text><Text style={styles.line}>{booking.employer_location||''}{booking.employer_postcode?` · ${booking.employer_postcode}`:''}</Text></View><View style={styles.ratingBox}><Text style={styles.ratingValue}>{rating>0?rating.toFixed(1):'—'}</Text><Text style={styles.ratingCount}>{rating>0?'★':booking.employer_review_count?'reviews':'new'}</Text></View></View>
      {booking.employer_description?<Text style={styles.description}>{booking.employer_description}</Text>:null}
      {photos.length>1?<ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.gallery}>{photos.slice(1,6).map((photo,i)=><Image key={`${photo}-${i}`} source={{uri:photo}} style={styles.thumb}/>)}</ScrollView>:null}
    </View>:null}

    <View style={styles.commercialCard}>
      <Text style={styles.commercialEyebrow}>SHIFT COMMERCIALS</Text>
      <View style={styles.commercialTop}><View><Text style={styles.rate}>£{booking.rate}<Text style={styles.rateUnit}>/hr</Text></Text><Text style={styles.hours}>{effectiveHours} working hours</Text></View><Text style={styles.totalStrong}>£{shiftGross}</Text></View>
      <View style={styles.costRows}><CostRow label="Professional pay" value={`£${shiftGross}`}/><CostRow label="WHC platform fee" value={`£${fee}`}/><CostRow label="Total booking value" value={`£${expectedTotal}`} strong/></View>
    </View>

    {paid?<View style={styles.confirmedCard}><Text style={styles.confirmedEyebrow}>PAYMENT RECEIVED</Text><Text style={styles.confirmedTitle}>Your booking is confirmed.</Text><Text style={styles.confirmedCopy}>The shift is now secured in WHC. Use Before You Arrive for the final property and arrival information.</Text></View>:null}
    {open&&expiredInMinutes!=null?<View style={[styles.expiryCard,expiredInMinutes<60&&styles.expiryCardUrgent]}><Text style={[styles.expiry,expiredInMinutes<60&&styles.expiryUrgent]}>{expiredInMinutes>0?`${expiredInMinutes} minutes left to respond`:'Response window has expired'}</Text></View>:null}

    {candidateView?<View style={styles.infoCard}>
      <Text style={styles.sectionEyebrow}>TRAVEL PRACTICALITY</Text><Text style={styles.sectionTitle}>Before you accept</Text>
      {booking.distance_miles!=null?<InfoLine label="Distance" value={`${booking.distance_miles} miles from you`}/>:null}
      {booking.nearest_transport?<InfoLine label="Nearest transport" value={`${booking.nearest_transport}${booking.transport_walk_minutes!=null?` · ${booking.transport_walk_minutes} min walk`:''}`}/>:null}
      {booking.parking_available?<InfoLine label="Parking" value="Available"/>:null}
      {booking.taxi_support?<InfoLine label="Taxi support" value={`Available${booking.taxi_notes?` · ${booking.taxi_notes}`:''}`}/>:null}
      {booking.travel_notes?<InfoLine label="Travel note" value={booking.travel_notes}/>:null}
    </View>:null}

    {candidateView?<Pressable onPress={()=>router.push('/security')} style={styles.safetyCard}><Text style={styles.safetyEyebrow}>WHC SHIFT PROTECTION</Text><Text style={styles.safetyTitle}>Safety & security</Text><Text style={styles.safetyCopy}>Review safety guidance, account protection, privacy and what to do if something feels wrong before or during a shift.</Text><Text style={styles.safetyLink}>Open safety & security →</Text></Pressable>:null}

    {employerCanPay?<View style={styles.paymentBox}>
      <Text style={styles.sectionEyebrow}>PAYMENT REQUIRED</Text><Text style={styles.sectionTitle}>Confirm this booking</Text><Text style={styles.help}>The professional has accepted. Secure payment confirms the shift.</Text>
      <View style={styles.paymentRows}><CostRow label="Professional" value={`£${shiftGross}`}/><CostRow label="WHC platform fee" value={`£${fee}`}/><CostRow label="Total" value={`£${expectedTotal}`} strong/></View>
      <Pressable disabled={!!busy} onPress={startPayment} style={[styles.primary,!!busy&&styles.disabled]}><Text style={styles.primaryText}>{busy==='payment'?'Preparing secure payment…':`Pay & confirm £${expectedTotal}`}</Text></Pressable>
      <Text style={styles.secureNote}>Secure checkout is handled by Stripe.</Text>
    </View>:null}

    {open?<View style={styles.actions}>{candidateView?<>
      <Text style={styles.sectionEyebrow}>YOUR RESPONSE</Text><Text style={styles.sectionTitle}>Choose what works for you</Text>
      <Pressable disabled={!!busy} onPress={()=>act('accept')} style={[styles.primary,!!busy&&styles.disabled]}><Text style={styles.primaryText}>{busy==='accept'?'Accepting…':'Accept shift'}</Text></Pressable>
      {booking.booking_group?<Pressable disabled={!!busy} onPress={()=>act('accept_group')} style={[styles.groupButton,!!busy&&styles.disabled]}><Text style={styles.groupText}>Accept all standing shifts</Text></Pressable>:null}
      <View style={styles.counterBox}><Text style={styles.counterEyebrow}>COUNTER OFFER</Text><Text style={styles.counterTitle}>Request a different hourly rate</Text><Text style={styles.help}>Enter the hourly rate you would accept for this shift.</Text><View style={styles.counterRow}><Text style={styles.currency}>£</Text><TextInput value={counterRate} onChangeText={setCounterRate} keyboardType="decimal-pad" style={styles.input}/><Text style={styles.perHour}>/hr</Text></View><Pressable disabled={!!busy} onPress={()=>act('counter')} style={styles.secondary}><Text style={styles.secondaryText}>{busy==='counter'?'Sending…':'Send counter offer'}</Text></Pressable></View>
      <Pressable disabled={!!busy} onPress={()=>act('decline')} style={styles.decline}><Text style={styles.declineText}>{busy==='decline'?'Declining…':'Decline shift'}</Text></Pressable>
    </>:<>
      <Text style={styles.sectionEyebrow}>EMPLOYER RESPONSE</Text><Text style={styles.sectionTitle}>{employerCanAccept?'A counter offer is waiting':'Waiting for Talent'}</Text>
      {employerCanAccept?<Pressable disabled={!!busy} onPress={()=>act('accept')} style={[styles.primary,!!busy&&styles.disabled]}><Text style={styles.primaryText}>{busy==='accept'?'Accepting…':`Accept £${booking.rate}/hr counter`}</Text></Pressable>:<Text style={styles.help}>The professional has not responded to your offer yet.</Text>}
      <Pressable disabled={!!busy} onPress={()=>act('decline')} style={styles.decline}><Text style={styles.declineText}>Decline / close offer</Text></Pressable>
    </>}</View>:!employerCanPay&&!paid?<View style={styles.closed}><Text style={styles.closedEyebrow}>OFFER CLOSED</Text><Text style={styles.closedTitle}>This shift is no longer awaiting a response.</Text><Text style={styles.help}>Current status: {booking.status}.</Text></View>:null}

    {error?<View style={styles.errorCard}><Text style={styles.errorTitle}>We could not update this shift</Text><Text style={styles.error}>{error}</Text></View>:null}
  </ScrollView>
}

function CostRow({label,value,strong=false}:{label:string;value:string;strong?:boolean}){return <View style={[styles.costRow,strong&&styles.costRowStrong]}><Text style={[styles.costLabel,strong&&styles.costLabelStrong]}>{label}</Text><Text style={[styles.costValue,strong&&styles.costValueStrong]}>{value}</Text></View>}
function InfoLine({label,value}:{label:string;value:string}){return <View style={styles.infoLine}><Text style={styles.infoLabel}>{label}</Text><Text style={styles.infoValue}>{value}</Text></View>}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  center:{flex:1,alignItems:'center',justifyContent:'center',padding:28,backgroundColor:palette.stone},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:20},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  hero:{width:'100%',height:220,marginBottom:18,backgroundColor:palette.stoneDeep,borderRadius:radius.large},
  headingRow:{flexDirection:'row',gap:12,alignItems:'flex-start'},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2,fontWeight:'700',marginBottom:7,fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:31,lineHeight:37,fontWeight:'400',fontFamily:type.serif},
  meta:{color:palette.muted,fontSize:11.5,lineHeight:18,marginTop:7,fontFamily:type.sans},
  statusPill:{backgroundColor:palette.stoneDeep,paddingHorizontal:8,paddingVertical:5,borderRadius:999},
  statusPillConfirmed:{backgroundColor:palette.ink},
  statusText:{color:palette.quiet,fontSize:7,fontWeight:'800',letterSpacing:.8,fontFamily:type.sans},
  statusTextConfirmed:{color:palette.paper},
  propertyCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,marginTop:18,borderRadius:radius.large},
  propertyTop:{flexDirection:'row',gap:12},
  sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  propertyName:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:4},
  line:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
  description:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:11,fontFamily:type.sans},
  ratingBox:{alignItems:'flex-end'},
  ratingValue:{color:palette.inkStrong,fontSize:20,fontWeight:'400',fontFamily:type.serif},
  ratingCount:{color:palette.quiet,fontSize:8.5,marginTop:2,fontFamily:type.sans},
  gallery:{marginTop:12},
  thumb:{width:112,height:78,marginRight:8,backgroundColor:palette.stoneDeep,borderRadius:radius.medium},
  commercialCard:{backgroundColor:palette.inkStrong,padding:18,marginTop:12,borderRadius:radius.large},
  commercialEyebrow:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  commercialTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-end',gap:12,marginTop:5},
  rate:{color:palette.paper,fontSize:31,fontWeight:'400',fontFamily:type.serif},
  rateUnit:{fontSize:12,fontFamily:type.sans,fontWeight:'600'},
  hours:{color:'#D8E1E4',fontSize:9,marginTop:3,fontFamily:type.sans},
  totalStrong:{color:palette.paper,fontSize:22,fontWeight:'700',fontFamily:type.sans},
  costRows:{borderTopWidth:1,borderTopColor:'rgba(255,255,255,.16)',marginTop:14,paddingTop:7},
  costRow:{flexDirection:'row',justifyContent:'space-between',gap:12,paddingVertical:6},
  costRowStrong:{borderTopWidth:1,borderTopColor:palette.line,marginTop:5,paddingTop:11},
  costLabel:{color:'#D8E1E4',fontSize:9.5,fontFamily:type.sans},
  costValue:{color:palette.paper,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  costLabelStrong:{color:palette.inkStrong,fontSize:11,fontWeight:'700'},
  costValueStrong:{color:palette.inkStrong,fontSize:14},
  confirmedCard:{backgroundColor:palette.stoneDeep,padding:15,marginTop:10,borderRadius:radius.large},
  confirmedEyebrow:{color:palette.sage,fontSize:7.5,letterSpacing:1.2,fontWeight:'800',fontFamily:type.sans},
  confirmedTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  confirmedCopy:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:5,fontFamily:type.sans},
  expiryCard:{backgroundColor:palette.stoneDeep,padding:11,borderRadius:radius.medium,marginTop:10},
  expiryCardUrgent:{backgroundColor:palette.dangerSoft},
  expiry:{color:palette.muted,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  expiryUrgent:{color:palette.danger},
  infoCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:16,marginTop:18,borderRadius:radius.large},
  sectionTitle:{color:palette.inkStrong,fontSize:19,lineHeight:24,fontWeight:'400',fontFamily:type.serif,marginTop:4,marginBottom:8},
  infoLine:{borderTopWidth:1,borderTopColor:palette.line,paddingVertical:9},
  infoLabel:{color:palette.quiet,fontSize:7.5,letterSpacing:.8,fontWeight:'700',fontFamily:type.sans},
  infoValue:{color:palette.text,fontSize:10.5,lineHeight:16,marginTop:3,fontFamily:type.sans},
  safetyCard:{backgroundColor:palette.ink,padding:16,marginTop:10,borderRadius:radius.large},
  safetyEyebrow:{color:'#CBD5D9',fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  safetyTitle:{color:palette.paper,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  safetyCopy:{color:'#DCE4E7',fontSize:10,lineHeight:16,marginTop:5,fontFamily:type.sans},
  safetyLink:{color:palette.paper,fontSize:9.5,fontWeight:'700',marginTop:10,fontFamily:type.sans},
  paymentBox:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,marginTop:18,borderRadius:radius.large},
  help:{color:palette.muted,fontSize:10.5,lineHeight:17,fontFamily:type.sans},
  paymentRows:{backgroundColor:palette.stone,padding:12,borderRadius:radius.medium,marginTop:12},
  primary:{backgroundColor:palette.ink,paddingVertical:14,alignItems:'center',marginTop:14,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  secureNote:{color:palette.quiet,fontSize:8.5,textAlign:'center',marginTop:7,fontFamily:type.sans},
  actions:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,marginTop:18,borderRadius:radius.large},
  groupButton:{borderWidth:1,borderColor:palette.ink,paddingVertical:13,alignItems:'center',marginTop:9,borderRadius:radius.medium},
  groupText:{color:palette.ink,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  counterBox:{backgroundColor:palette.stoneDeep,padding:14,marginTop:14,borderRadius:radius.medium},
  counterEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans},
  counterTitle:{color:palette.inkStrong,fontSize:15,fontWeight:'700',marginTop:4,fontFamily:type.sans},
  counterRow:{flexDirection:'row',alignItems:'center',marginTop:11},
  currency:{color:palette.inkStrong,fontSize:17,marginRight:5,fontFamily:type.sans},
  input:{flex:1,borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:12,paddingVertical:10,color:palette.text,fontSize:13,backgroundColor:palette.paper,borderRadius:radius.medium,fontFamily:type.sans},
  perHour:{color:palette.muted,fontSize:10,marginLeft:6,fontFamily:type.sans},
  secondary:{borderWidth:1,borderColor:palette.lineStrong,paddingVertical:12,alignItems:'center',marginTop:9,borderRadius:radius.medium,backgroundColor:palette.paper},
  secondaryText:{color:palette.inkStrong,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  decline:{paddingVertical:13,alignItems:'center',marginTop:7},
  declineText:{color:palette.danger,fontSize:10,fontWeight:'700',fontFamily:type.sans},
  closed:{backgroundColor:palette.stoneDeep,padding:16,marginTop:18,borderRadius:radius.large},
  closedEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans},
  closedTitle:{color:palette.inkStrong,fontSize:16,lineHeight:21,fontWeight:'400',fontFamily:type.serif,marginTop:5,marginBottom:4},
  errorCard:{backgroundColor:palette.dangerSoft,borderWidth:1,borderColor:'#E8D7D4',padding:14,borderRadius:radius.large,marginTop:14},
  errorTitle:{color:palette.danger,fontSize:13,fontWeight:'700',fontFamily:type.sans},
  error:{color:palette.danger,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
  disabled:{opacity:.45},
})
