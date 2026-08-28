import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

type Role='talent'|'employer'
type ResidencyProfile={
  id:string;reference:string;title?:string|null;bio?:string|null;primary_specialism?:string|null;secondary_specialisms?:string[];
  qualifications?:string[];brand_experience?:string[];current_location?:string|null;travel_availability?:string|null;
  preferred_duration?:string|null;day_rate?:number|null;weekly_rate?:number|null;monthly_rate?:number|null;negotiable?:boolean;
  available_from?:string|null;years_experience?:number|null;is_featured?:boolean
}
type Booking={
  id:string;residency_profile_id:string;property_name?:string|null;employer_name?:string|null;employer_location?:string|null;
  employer_user_id?:string|null;candidate_name?:string|null;candidate_user_id?:string|null;primary_specialism?:string|null;
  start_date:string;end_date:string;days_required:number;proposed_day_rate:number;proposed_total:number;agreed_day_rate?:number|null;
  agreed_total?:number|null;platform_fee?:number|null;accommodation_included?:boolean|null;travel_included?:boolean|null;
  services_required?:string|null;notes?:string|null;status:string;paid_at?:string|null
}

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talent.wellnesshousecollective.co.uk'

function futureDate(days:number){const date=new Date();date.setDate(date.getDate()+days);return date.toISOString().slice(0,10)}
function dateLabel(value?:string|null){if(!value)return'';const date=new Date(`${value}T12:00:00`);return Number.isNaN(date.getTime())?value:date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})}
function statusLabel(value:string){return value.replace(/_/g,' ').replace(/\b\w/g,letter=>letter.toUpperCase())}

export default function ResidencyScreen(){
  const [role,setRole]=useState<Role>('talent')
  const [bookings,setBookings]=useState<Booking[]>([])
  const [profiles,setProfiles]=useState<ResidencyProfile[]>([])
  const [propertyName,setPropertyName]=useState('')
  const [member,setMember]=useState(false)
  const [listingStatus,setListingStatus]=useState('')
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')
  const [offerTarget,setOfferTarget]=useState<ResidencyProfile|null>(null)
  const [startDate,setStartDate]=useState(futureDate(14))
  const [endDate,setEndDate]=useState(futureDate(20))
  const [daysRequired,setDaysRequired]=useState('5')
  const [dayRate,setDayRate]=useState('')
  const [services,setServices]=useState('')
  const [notes,setNotes]=useState('')
  const [accommodation,setAccommodation]=useState(true)
  const [travel,setTravel]=useState(false)
  const [counterRates,setCounterRates]=useState<Record<string,string>>({})

  useEffect(()=>{void load()},[])

  async function authFetch(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`,...(options?.headers||{})}})
    const body=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(body?.error||'Could not update Residency.')
    return body
  }

  async function load(){
    setLoading(true);setError('')
    try{
      const dashboard=await authFetch('/api/mobile/residency/dashboard')
      const resolved:Role=dashboard?.role==='employer'?'employer':'talent'
      setRole(resolved)
      setBookings((dashboard?.bookings||[]) as Booking[])
      if(resolved==='employer'){
        setPropertyName(dashboard?.employer?.propertyName||'')
        const response=await fetch(`${WEB_URL}/api/residency/public`)
        const publicData=await response.json().catch(()=>({}))
        if(!response.ok)throw new Error(publicData?.error||'Could not load Residency specialists.')
        setProfiles((publicData?.profiles||[]) as ResidencyProfile[])
      }else{
        setMember(Boolean(dashboard?.candidate?.residencyMember))
        setListingStatus(dashboard?.candidate?.listing?.approval_status||'')
        setCounterRates(Object.fromEntries(((dashboard?.bookings||[]) as Booking[]).map(row=>[row.id,String(row.proposed_day_rate||'')])))
      }
    }catch(e:any){setError(e?.message||'Could not load Residency.')}
    finally{setLoading(false)}
  }

  async function startConversation(profile:ResidencyProfile){
    setBusy(`conversation-${profile.id}`);setError('')
    try{
      const result=await authFetch('/api/residency/conversation',{method:'POST',body:JSON.stringify({listingId:profile.id})})
      Alert.alert('Private conversation started','You can now message the specialist and send a structured Residency offer.')
      if(result?.recipientId)router.push({pathname:'/message/[userId]',params:{userId:result.recipientId}})
    }catch(e:any){setError(e?.message||'Could not start the Residency conversation.')}
    finally{setBusy('')}
  }

  function prepareOffer(profile:ResidencyProfile){
    setOfferTarget(profile)
    setDayRate(profile.day_rate?String(profile.day_rate):'')
    setServices(profile.primary_specialism||'')
    setNotes('')
  }

  async function sendOffer(){
    if(!offerTarget)return
    const days=Number(daysRequired),rate=Number(dayRate)
    if(!propertyName.trim()||!startDate||!endDate||!Number.isFinite(days)||days<1||!Number.isFinite(rate)||rate<=0){
      Alert.alert('Complete the offer','Add the property, dates, days required and proposed day rate.');return
    }
    setBusy(`offer-${offerTarget.id}`);setError('')
    try{
      const result=await authFetch('/api/residency/offer',{method:'POST',body:JSON.stringify({listingId:offerTarget.id,propertyName:propertyName.trim(),startDate,endDate,daysRequired:days,proposedDayRate:rate,accommodationIncluded:accommodation,travelIncluded:travel,servicesRequired:services,notes})})
      Alert.alert('Residency offer sent',`Offer value £${result?.proposedTotal||days*rate}. The specialist can accept, counter or decline.`)
      setOfferTarget(null);await load()
    }catch(e:any){setError(e?.message||'Could not send the Residency offer.')}
    finally{setBusy('')}
  }

  async function talentRespond(booking:Booking,action:'accept'|'counter'|'decline'){
    setBusy(`${action}-${booking.id}`);setError('')
    try{
      await authFetch('/api/residency/respond',{method:'POST',body:JSON.stringify({bookingId:booking.id,action,counterDayRate:action==='counter'?Number(counterRates[booking.id]):undefined})})
      Alert.alert('Residency updated',action==='accept'?'Offer accepted. The property can now confirm and pay.':action==='counter'?'Counter-offer sent.':'Offer declined.')
      await load()
    }catch(e:any){setError(e?.message||'Could not update the Residency offer.')}
    finally{setBusy('')}
  }

  async function employerRespond(booking:Booking,action:'accept'|'decline'){
    setBusy(`${action}-${booking.id}`);setError('')
    try{
      await authFetch('/api/residency/employer-respond',{method:'POST',body:JSON.stringify({bookingId:booking.id,action})})
      Alert.alert('Residency updated',action==='accept'?'Counter-offer accepted. Secure payment is the next step.':'Counter-offer declined.')
      await load()
    }catch(e:any){setError(e?.message||'Could not update the Residency offer.')}
    finally{setBusy('')}
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>RESIDENCY</Text>
    <Text style={styles.title}>{role==='employer'?'Bring specialist expertise into your property.':'Build a career beyond the standard rota.'}</Text>
    <Text style={styles.intro}>{role==='employer'?'Discover approved spa and wellness specialists for longer placements, begin privately and move into a structured offer when it feels right.':'Manage longer-form specialist opportunities, negotiate your terms and keep each Residency in one clear journey.'}</Text>
    {error?<Text style={styles.error}>{error}</Text>:null}

    {role==='talent'?<>
      <View style={[styles.membershipCard,member&&styles.membershipActive]}>
        <View style={{flex:1}}><Text style={styles.cardEyebrow}>{member?'RESIDENCY ACTIVE':'RESIDENCY ACCESS'}</Text><Text style={styles.membershipTitle}>{member?'Your specialist listing is live in the Residency ecosystem.':'Activate Residency when you are ready for longer specialist work.'}</Text><Text style={styles.help}>{member?`Listing status${listingStatus?`: ${statusLabel(listingStatus)}`:'.'} Employers can discover you through the protected Residency directory.`:'Your listing only becomes discoverable while Residency membership is active.'}</Text></View>
        <Pressable onPress={()=>router.push('/residency-setup')} style={styles.smallLink}><Text style={styles.smallLinkText}>{member?'Manage':'Set up'}</Text></Pressable>
      </View>

      <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>YOUR RESIDENCIES</Text><Text style={styles.sectionTitle}>Offers & bookings</Text><Text style={styles.sectionCopy}>Review the terms first. You can accept, counter or decline before anything is confirmed.</Text></View>
      {bookings.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No Residency offers yet.</Text><Text style={styles.emptyCopy}>When a property sends you an offer it will appear here automatically.</Text></View>:bookings.map(booking=>{
        const open=['offered','countered'].includes(booking.status)
        const confirmed=booking.status==='confirmed'&&Boolean(booking.paid_at)
        return <View key={booking.id} style={styles.card}>
          <View style={styles.cardTop}><View style={styles.statusPill}><Text style={styles.status}>{statusLabel(booking.status)}</Text></View><Text style={styles.rate}>£{booking.proposed_day_rate}/day</Text></View>
          <Text style={styles.cardTitle}>{booking.employer_name||booking.property_name||'Property'}</Text>
          <Text style={styles.meta}>{dateLabel(booking.start_date)} → {dateLabel(booking.end_date)} · {booking.days_required} days</Text>
          <View style={styles.valueRow}><Text style={styles.valueLabel}>Proposed value</Text><Text style={styles.value}>£{booking.proposed_total}</Text></View>
          {booking.employer_location?<Text style={styles.line}>{booking.employer_location}</Text>:null}
          {booking.services_required?<Text style={styles.line}>Required · {booking.services_required}</Text>:null}
          {booking.accommodation_included?<Text style={styles.included}>Accommodation included</Text>:null}
          {booking.travel_included?<Text style={styles.included}>Travel included</Text>:null}
          {booking.notes?<View style={styles.noteBox}><Text style={styles.note}>{booking.notes}</Text></View>:null}
          {open?<View style={styles.actions}>
            <Pressable disabled={!!busy} onPress={()=>talentRespond(booking,'accept')} style={styles.primary}><Text style={styles.primaryText}>Accept offer</Text></Pressable>
            <Text style={styles.counterLabel}>Prefer different terms?</Text>
            <View style={styles.counterRow}><Text style={styles.currency}>£</Text><TextInput value={counterRates[booking.id]||''} onChangeText={value=>setCounterRates(current=>({...current,[booking.id]:value}))} keyboardType="decimal-pad" style={styles.input}/><Text style={styles.per}>/day</Text></View>
            <Pressable disabled={!!busy} onPress={()=>talentRespond(booking,'counter')} style={styles.secondary}><Text style={styles.secondaryText}>Send counter-offer</Text></Pressable>
            <Pressable disabled={!!busy} onPress={()=>talentRespond(booking,'decline')} style={styles.decline}><Text style={styles.declineText}>Decline offer</Text></Pressable>
          </View>:null}
          {booking.status==='accepted'?<View style={styles.confirmBox}><Text style={styles.confirmText}>Accepted · awaiting secure payment from the property.</Text></View>:null}
          {confirmed?<View style={styles.confirmBox}><Text style={styles.confirmText}>Payment received · Residency confirmed.</Text></View>:null}
          {booking.employer_user_id?<Pressable onPress={()=>router.push({pathname:'/message/[userId]',params:{userId:booking.employer_user_id}})} style={styles.messageRow}><Text style={styles.messageLink}>Message property</Text><Text style={styles.arrow}>→</Text></Pressable>:null}
        </View>
      })}
    </>:<>
      <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>CURRENT ACTIVITY</Text><Text style={styles.sectionTitle}>Your Residency bookings</Text><Text style={styles.sectionCopy}>Track offers, counter-offers and confirmed placements before looking for somebody new.</Text></View>
      {bookings.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No Residency offers sent yet.</Text><Text style={styles.emptyCopy}>Specialists you contact and offers you send will appear here.</Text></View>:bookings.map(booking=>{
        const confirmed=booking.status==='confirmed'&&Boolean(booking.paid_at)
        return <View key={booking.id} style={styles.card}>
          <View style={styles.cardTop}><View style={styles.statusPill}><Text style={styles.status}>{statusLabel(booking.status)}</Text></View><Text style={styles.rate}>£{booking.proposed_day_rate}/day</Text></View>
          <Text style={styles.cardTitle}>{booking.candidate_name||'Residency specialist'}</Text>
          <Text style={styles.meta}>{dateLabel(booking.start_date)} → {dateLabel(booking.end_date)} · {booking.days_required} days · £{booking.proposed_total}</Text>
          {booking.primary_specialism?<Text style={styles.line}>{booking.primary_specialism}</Text>:null}
          {booking.status==='countered'?<View style={styles.actions}><View style={styles.counterNotice}><Text style={styles.counterNoticeTitle}>Counter-offer received</Text><Text style={styles.help}>The specialist has proposed £{booking.proposed_day_rate}/day.</Text></View><Pressable disabled={!!busy} onPress={()=>employerRespond(booking,'accept')} style={styles.primary}><Text style={styles.primaryText}>Accept counter-offer</Text></Pressable><Pressable disabled={!!busy} onPress={()=>employerRespond(booking,'decline')} style={styles.decline}><Text style={styles.declineText}>Decline counter</Text></Pressable></View>:null}
          {booking.status==='accepted'?<Pressable onPress={()=>router.push({pathname:'/residency-payment/[id]',params:{id:booking.id}})} style={styles.paymentButton}><Text style={styles.paymentButtonText}>Pay & confirm Residency</Text><Text style={styles.paymentArrow}>→</Text></Pressable>:null}
          {confirmed?<View style={styles.confirmBox}><Text style={styles.confirmText}>Payment received · Residency confirmed.</Text></View>:null}
          {booking.candidate_user_id?<Pressable onPress={()=>router.push({pathname:'/message/[userId]',params:{userId:booking.candidate_user_id}})} style={styles.messageRow}><Text style={styles.messageLink}>Message specialist</Text><Text style={styles.arrow}>→</Text></Pressable>:null}
        </View>
      })}

      <View style={[styles.sectionHeading,{marginTop:28}]}><Text style={styles.sectionEyebrow}>DISCOVER</Text><Text style={styles.sectionTitle}>Residency specialists</Text><Text style={styles.sectionCopy}>A curated directory for longer-form expertise, not a standard job board.</Text></View>
      {profiles.length===0?<View style={styles.empty}><Text style={styles.emptyTitle}>No specialists are listed right now.</Text><Text style={styles.emptyCopy}>New approved Residency profiles will appear here automatically.</Text></View>:profiles.map(profile=><View key={profile.id} style={styles.card}>
        <View style={styles.cardTop}><View style={[styles.statusPill,profile.is_featured&&styles.featuredPill]}><Text style={[styles.status,profile.is_featured&&styles.featuredText]}>{profile.is_featured?'Featured':profile.reference}</Text></View>{profile.day_rate?<Text style={styles.rate}>from £{profile.day_rate}/day</Text>:null}</View>
        <Text style={styles.cardTitle}>{profile.title||profile.primary_specialism||'Wellness specialist'}</Text>
        <Text style={styles.meta}>{[profile.current_location,profile.years_experience?`${profile.years_experience} years experience`:null,profile.preferred_duration].filter(Boolean).join(' · ')}</Text>
        {profile.bio?<Text style={styles.note}>{profile.bio}</Text>:null}
        {profile.secondary_specialisms?.length?<Text style={styles.line}>Specialisms · {profile.secondary_specialisms.slice(0,4).join(', ')}</Text>:null}
        {profile.qualifications?.length?<Text style={styles.line}>Qualifications · {profile.qualifications.slice(0,3).join(', ')}</Text>:null}
        {profile.brand_experience?.length?<Text style={styles.line}>Brand experience · {profile.brand_experience.slice(0,3).join(', ')}</Text>:null}
        {profile.travel_availability?<Text style={styles.line}>Travel · {profile.travel_availability}</Text>:null}
        {profile.available_from?<Text style={styles.line}>Available from · {dateLabel(profile.available_from)}</Text>:null}
        <View style={styles.actions}>
          <Pressable disabled={!!busy} onPress={()=>startConversation(profile)} style={styles.secondary}><Text style={styles.secondaryText}>{busy===`conversation-${profile.id}`?'Starting…':'Start private conversation'}</Text></Pressable>
          <Pressable disabled={!!busy} onPress={()=>prepareOffer(profile)} style={styles.primary}><Text style={styles.primaryText}>Prepare structured offer</Text></Pressable>
        </View>
      </View>)}

      {offerTarget?<View style={styles.offerPanel}>
        <View style={styles.panelTop}><View><Text style={styles.sectionEyebrow}>STRUCTURED OFFER</Text><Text style={styles.offerTitle}>{offerTarget.title||offerTarget.primary_specialism||offerTarget.reference}</Text></View><Pressable onPress={()=>setOfferTarget(null)}><Text style={styles.close}>Close</Text></Pressable></View>
        <Text style={styles.help}>A private Residency conversation must exist before a formal offer can be sent.</Text>
        <Text style={styles.label}>Property</Text><TextInput value={propertyName} onChangeText={setPropertyName} style={styles.fullInput}/>
        <View style={styles.twoCol}><View style={{flex:1}}><Text style={styles.label}>Start date</Text><TextInput value={startDate} onChangeText={setStartDate} style={styles.fullInput}/></View><View style={{flex:1}}><Text style={styles.label}>End date</Text><TextInput value={endDate} onChangeText={setEndDate} style={styles.fullInput}/></View></View>
        <View style={styles.twoCol}><View style={{flex:1}}><Text style={styles.label}>Days required</Text><TextInput value={daysRequired} onChangeText={setDaysRequired} keyboardType="number-pad" style={styles.fullInput}/></View><View style={{flex:1}}><Text style={styles.label}>Day rate £</Text><TextInput value={dayRate} onChangeText={setDayRate} keyboardType="decimal-pad" style={styles.fullInput}/></View></View>
        <Text style={styles.label}>Services required</Text><TextInput value={services} onChangeText={setServices} style={styles.fullInput} multiline/>
        <Text style={styles.label}>Notes</Text><TextInput value={notes} onChangeText={setNotes} style={[styles.fullInput,styles.notesInput]} multiline/>
        <View style={styles.switchRow}><Text style={styles.switchLabel}>Accommodation included</Text><Switch value={accommodation} onValueChange={setAccommodation} trackColor={{false:palette.lineStrong,true:'#BCC8BF'}} thumbColor={palette.paper}/></View>
        <View style={styles.switchRow}><Text style={styles.switchLabel}>Travel included</Text><Switch value={travel} onValueChange={setTravel} trackColor={{false:palette.lineStrong,true:'#BCC8BF'}} thumbColor={palette.paper}/></View>
        <Pressable disabled={!!busy} onPress={sendOffer} style={styles.primary}><Text style={styles.primaryText}>{busy===`offer-${offerTarget.id}`?'Sending…':'Send Residency offer'}</Text></Pressable>
      </View>:null}
    </>}
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:120},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:palette.stone},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},back:{color:palette.muted,fontSize:13},eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9},
  title:{color:palette.inkStrong,fontFamily:type.serif,fontSize:34,lineHeight:40,fontWeight:'400',maxWidth:365},intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:24,maxWidth:365},error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:16},
  membershipCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large,marginBottom:28,flexDirection:'row',gap:12,alignItems:'center'},membershipActive:{borderColor:'#BCC8BF',backgroundColor:'#FBFCFA'},cardEyebrow:{color:palette.sage,fontSize:7.5,letterSpacing:1.3,fontWeight:'800'},membershipTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:19,lineHeight:24,fontWeight:'400',marginTop:5},help:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:5},smallLink:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:10,paddingVertical:8,borderRadius:radius.medium},smallLinkText:{color:palette.ink,fontSize:9.5,fontWeight:'700'},
  sectionHeading:{marginBottom:12},sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.7,fontWeight:'700',marginBottom:5},sectionTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:23,lineHeight:28,fontWeight:'400'},sectionCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:5},
  empty:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large,marginBottom:18},emptyTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:19,fontWeight:'400'},emptyCopy:{color:palette.muted,fontSize:11,lineHeight:17,marginTop:5},
  card:{borderWidth:1,borderColor:palette.line,padding:17,marginBottom:11,backgroundColor:palette.paper,borderRadius:radius.large},cardTop:{flexDirection:'row',justifyContent:'space-between',gap:10,alignItems:'center'},statusPill:{backgroundColor:palette.sageSoft,paddingHorizontal:8,paddingVertical:5,borderRadius:999},status:{color:palette.sage,fontSize:7.5,fontWeight:'800',letterSpacing:.7},featuredPill:{backgroundColor:'#F4EFE5'},featuredText:{color:'#826B42'},rate:{color:palette.ink,fontSize:11.5,fontWeight:'700'},cardTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:21,lineHeight:26,fontWeight:'400',marginTop:10},meta:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5},line:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:6},included:{color:palette.sage,fontSize:9.5,fontWeight:'700',marginTop:6},noteBox:{backgroundColor:palette.stone,padding:11,borderRadius:radius.medium,marginTop:10},note:{color:palette.muted,fontSize:10.5,lineHeight:17},valueRow:{flexDirection:'row',justifyContent:'space-between',borderTopWidth:1,borderTopColor:palette.line,marginTop:13,paddingTop:11},valueLabel:{color:palette.quiet,fontSize:9.5},value:{color:palette.inkStrong,fontSize:12,fontWeight:'700'},
  actions:{marginTop:14,gap:9},primary:{backgroundColor:palette.inkStrong,paddingVertical:13,alignItems:'center',borderRadius:radius.medium},primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},secondary:{borderWidth:1,borderColor:palette.lineStrong,paddingVertical:12,alignItems:'center',borderRadius:radius.medium},secondaryText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},decline:{paddingVertical:10,alignItems:'center'},declineText:{color:palette.danger,fontSize:10.5,fontWeight:'600'},counterLabel:{color:palette.quiet,fontSize:9.5,fontWeight:'700',marginTop:2},counterRow:{flexDirection:'row',alignItems:'center'},currency:{color:palette.text,fontSize:16,marginRight:5},input:{flex:1,borderWidth:1,borderColor:palette.line,paddingHorizontal:12,paddingVertical:10,color:palette.text,backgroundColor:palette.paper,borderRadius:radius.medium},per:{color:palette.muted,fontSize:10.5,marginLeft:6},counterNotice:{backgroundColor:'#F7F3E9',padding:11,borderRadius:radius.medium},counterNoticeTitle:{color:'#6C5936',fontSize:10.5,fontWeight:'700'},
  confirmBox:{backgroundColor:palette.sageSoft,padding:11,borderRadius:radius.medium,marginTop:12},confirmText:{color:palette.sage,fontSize:10,lineHeight:16,fontWeight:'600'},paymentButton:{backgroundColor:palette.inkStrong,paddingHorizontal:13,paddingVertical:13,marginTop:12,borderRadius:radius.medium,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},paymentButtonText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},paymentArrow:{color:palette.paper,fontSize:15},messageRow:{borderTopWidth:1,borderTopColor:palette.line,marginTop:13,paddingTop:12,flexDirection:'row',justifyContent:'space-between'},messageLink:{color:palette.ink,fontSize:10.5,fontWeight:'700'},arrow:{color:palette.ink,fontSize:15},
  offerPanel:{borderWidth:1,borderColor:palette.lineStrong,padding:17,marginTop:18,backgroundColor:palette.paper,borderRadius:radius.large},panelTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},offerTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:21,lineHeight:26,fontWeight:'400'},close:{color:palette.muted,fontSize:10,fontWeight:'700',paddingVertical:4},label:{color:palette.text,fontSize:9.5,fontWeight:'700',marginTop:12,marginBottom:5},fullInput:{borderWidth:1,borderColor:palette.line,paddingHorizontal:11,paddingVertical:10,color:palette.text,fontSize:12,backgroundColor:palette.paper,borderRadius:radius.medium},notesInput:{minHeight:72,textAlignVertical:'top'},twoCol:{flexDirection:'row',gap:10},switchRow:{flexDirection:'row',justifyContent:'space-between',alignItems:'center',paddingVertical:11,borderBottomWidth:1,borderBottomColor:palette.line},switchLabel:{color:palette.muted,fontSize:10.5},
})