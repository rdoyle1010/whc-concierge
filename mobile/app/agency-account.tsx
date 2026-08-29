import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'

type Candidate = {
  id:string; approval_status?:string|null; whc_verified?:boolean|null; has_insurance?:boolean|null;
  agency_available?:boolean|null; agency_tier?:string|null; agency_listed_until?:string|null;
  hourly_rate?:number|null; phone?:string|null; sms_opt_in?:boolean|null; postcode?:string|null;
  travel_radius_miles?:number|null; location_verified?:boolean|null; approved_for_agency?:boolean|null;
}

export default function AgencyAccountScreen(){
  const [candidate,setCandidate]=useState<Candidate|null>(null)
  const [rate,setRate]=useState('')
  const [phone,setPhone]=useState('')
  const [postcode,setPostcode]=useState('')
  const [radius,setRadius]=useState('')
  const [sms,setSms]=useState(false)
  const [tier,setTier]=useState<'basic'|'featured'>('basic')
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{void load()},[])

  async function authFetch(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const res=await fetch(`${WEB_URL}${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`,...(options?.headers||{})}})
    const body=await res.json().catch(()=>({}))
    if(!res.ok) throw new Error(body?.error||'Could not update Agency account.')
    return body
  }

  async function load(){
    setLoading(true);setError('')
    try{
      const data=await authFetch('/api/mobile/agency/account')
      const c=data.candidate as Candidate
      setCandidate(c)
      setRate(c.hourly_rate?String(c.hourly_rate):'')
      setPhone(c.phone||'')
      setPostcode(c.postcode||'')
      setRadius(c.travel_radius_miles?String(c.travel_radius_miles):'')
      setSms(Boolean(c.sms_opt_in))
      setTier(c.agency_tier==='featured'?'featured':'basic')
    }catch(e:any){setError(e.message||'Could not load Agency account.')}
    setLoading(false)
  }

  async function save(){
    setBusy('save');setError('')
    try{
      await authFetch('/api/mobile/agency/account',{method:'POST',body:JSON.stringify({action:'save',hourly_rate:rate,phone,postcode,travel_radius_miles:radius,sms_opt_in:sms})})
      Alert.alert('Agency details saved','Your rate, contact and travel settings have been updated.')
      await load()
    }catch(e:any){setError(e.message||'Could not save Agency details.')}
    setBusy('')
  }

  async function checkout(){
    setBusy('checkout');setError('')
    try{
      const data=await authFetch('/api/mobile/agency/account',{method:'POST',body:JSON.stringify({action:'checkout',tier,hourly_rate:rate,phone,postcode,travel_radius_miles:radius,sms_opt_in:sms})})
      if(!data.url) throw new Error('Could not open Agency payment.')
      await Linking.openURL(data.url)
    }catch(e:any){setError(e.message||'Could not start Agency subscription.')}
    setBusy('')
  }

  async function manageSubscription(){
    setBusy('portal');setError('')
    try{
      const data=await authFetch('/api/mobile/agency/account',{method:'POST',body:JSON.stringify({action:'manage_subscription'})})
      if(!data.url) throw new Error('Could not open billing portal.')
      await Linking.openURL(data.url)
    }catch(e:any){setError(e.message||'Could not open subscription management.')}
    setBusy('')
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>

  const active=Boolean(candidate?.agency_available)
  const currentTier=candidate?.agency_tier==='featured'?'Featured':'Basic'

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>AGENCY · YOUR ACCOUNT</Text>
    <Text style={styles.title}>Be bookable on your terms.</Text>
    <Text style={styles.intro}>Control your rate, travel area and urgent-cover contact preferences. Subscription visibility and WHC trust checks stay separate so properties can see both clearly.</Text>
    {error?<View style={styles.errorCard}><Text style={styles.errorTitle}>We could not update Agency</Text><Text style={styles.error}>{error}</Text></View>:null}

    <View style={[styles.statusCard,active&&styles.statusCardActive]}>
      <View style={styles.statusTop}>
        <View style={{flex:1}}>
          <Text style={[styles.statusEyebrow,active&&styles.statusEyebrowActive]}>{active?'AGENCY REGISTER ACTIVE':'REGISTER STATUS'}</Text>
          <Text style={[styles.statusTitle,active&&styles.statusTitleActive]}>{active?`${currentTier} Agency membership`:'Not currently listed'}</Text>
          <Text style={[styles.statusCopy,active&&styles.statusCopyActive]}>{active?`${currentTier==='Featured'?'Priority placement and Featured visibility':'Standard register visibility and shift access'}${candidate?.agency_listed_until?` · current period to ${new Date(candidate.agency_listed_until).toLocaleDateString('en-GB')}`:''}`:'Choose a register tier once your Talent profile has WHC approval.'}</Text>
        </View>
        <View style={[styles.statusBadge,active&&styles.statusBadgeActive]}><Text style={[styles.statusBadgeText,active&&styles.statusBadgeTextActive]}>{active?'LIVE':'OFF'}</Text></View>
      </View>
      {active?<View style={styles.statusMetrics}><MiniStatus value={rate?`£${rate}`:'—'} label="hourly rate" dark/><MiniStatus value={radius?`${radius} mi`:'—'} label="travel radius" dark/><MiniStatus value={sms?'On':'Off'} label="urgent texts" dark/></View>:null}
    </View>

    <SectionHeader eyebrow="TRUST & READINESS" title="What properties can rely on" copy="Your membership controls visibility. Approval, verification, insurance and location are independent trust signals." />
    <View style={styles.trustGrid}>
      <TrustItem label="Talent approval" value={candidate?.approval_status==='approved'?'Approved':'Pending'} complete={candidate?.approval_status==='approved'} />
      <TrustItem label="WHC verification" value={candidate?.whc_verified?'Verified':'Not yet'} complete={Boolean(candidate?.whc_verified)} />
      <TrustItem label="Insurance" value={candidate?.has_insurance?'Recorded':'Not recorded'} complete={Boolean(candidate?.has_insurance)} />
      <TrustItem label="Location" value={candidate?.location_verified?'Verified':'Needs postcode'} complete={Boolean(candidate?.location_verified)} />
    </View>

    <SectionHeader eyebrow="WORKING PREFERENCES" title="Your Agency details" copy="Set the practical information WHC uses when matching you to flexible work." />
    <View style={styles.card}>
      <Field label="Hourly rate (£)" help="Your requested hourly rate for Agency work."><TextInput value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="25" placeholderTextColor={palette.quiet} style={styles.input}/></Field>
      <Field label="Mobile number" help="Used for booking contact and urgent cover where you opt in."><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="07700 900123" placeholderTextColor={palette.quiet} style={styles.input}/></Field>
      <View style={styles.twoCol}>
        <View style={styles.col}><Field label="Postcode" help="Your starting point for travel matching."><TextInput value={postcode} onChangeText={setPostcode} autoCapitalize="characters" placeholder="SW1A 1AA" placeholderTextColor={palette.quiet} style={styles.input}/></Field></View>
        <View style={styles.col}><Field label="Travel radius" help="Maximum miles you want to travel."><TextInput value={radius} onChangeText={setRadius} keyboardType="number-pad" placeholder="15" placeholderTextColor={palette.quiet} style={styles.input}/></Field></View>
      </View>
      <View style={styles.switchRow}>
        <View style={{flex:1}}><Text style={styles.switchEyebrow}>URGENT COVER</Text><Text style={styles.switchTitle}>Same-day shift texts</Text><Text style={styles.help}>Allow WHC to text you when a property urgently needs cover that fits your Agency settings.</Text></View>
        <Switch value={sms} onValueChange={setSms} trackColor={{false:palette.lineStrong,true:'#A8B9C3'}} thumbColor={sms?palette.ink:palette.paper}/>
      </View>
      <Pressable disabled={!!busy} onPress={save} style={[styles.secondary,!!busy&&styles.disabled]}><Text style={styles.secondaryText}>{busy==='save'?'Saving details…':'Save Agency details'}</Text></Pressable>
    </View>

    {!active?<>
      <SectionHeader eyebrow="MEMBERSHIP" title="Join the Agency register" copy="Choose how visible you want to be. Your profile must still pass WHC approval before payment is enabled." />
      <View style={styles.planStack}>
        <Plan selected={tier==='basic'} onPress={()=>setTier('basic')} name="Basic Agency" price="£10 / month" kicker="REGISTER ACCESS" points={['Listed on the Agency register','Receive relevant shift offers','Eligible for urgent-cover alerts']} />
        <Plan selected={tier==='featured'} onPress={()=>setTier('featured')} name="Featured Agency" price="£20 / month" kicker="PRIORITY VISIBILITY" points={['Everything in Basic','Priority register placement','Featured status shown to properties']} />
      </View>
      {candidate?.approval_status!=='approved'?<View style={styles.warning}><Text style={styles.warningEyebrow}>APPROVAL REQUIRED</Text><Text style={styles.warningText}>Your Talent profile must be approved by WHC before Agency payment can be started.</Text></View>:null}
      <Pressable disabled={!!busy||candidate?.approval_status!=='approved'} onPress={checkout} style={[styles.primary,(!!busy||candidate?.approval_status!=='approved')&&styles.disabled]}><Text style={styles.primaryText}>{busy==='checkout'?'Opening secure payment…':`Join ${tier==='featured'?'Featured':'Basic'} Agency`}</Text></Pressable>
      <Text style={styles.secureNote}>Secure subscription checkout is handled through Stripe.</Text>
    </>:<>
      <SectionHeader eyebrow="SUBSCRIPTION" title="Manage membership" copy="Payment method, cancellation and subscription settings remain in Stripe's secure billing portal." />
      <View style={styles.subscriptionCard}>
        <View style={{flex:1}}><Text style={styles.subscriptionEyebrow}>CURRENT MEMBERSHIP</Text><Text style={styles.subscriptionTitle}>{currentTier} Agency</Text><Text style={styles.subscriptionCopy}>{currentTier==='Featured'?'Priority register placement is active on your account.':'Your profile is active on the standard Agency register.'}</Text></View>
        <Text style={styles.subscriptionPrice}>{currentTier==='Featured'?'£20':'£10'}<Text style={styles.subscriptionPeriod}>/mo</Text></Text>
      </View>
      <Pressable disabled={!!busy} onPress={manageSubscription} style={[styles.primary,!!busy&&styles.disabled]}><Text style={styles.primaryText}>{busy==='portal'?'Opening Stripe…':'Manage Agency subscription'}</Text></Pressable>
    </>}

    <View style={styles.note}><Text style={styles.noteEyebrow}>YOUR CONTROL</Text><Text style={styles.noteTitle}>Visibility does not override suitability.</Text><Text style={styles.noteCopy}>Featured placement can increase visibility, but WHC matching, approval, verification, travel practicality and property requirements remain separate. Properties should still choose the right professional for the shift.</Text></View>
  </ScrollView>
}

function SectionHeader({eyebrow,title,copy}:{eyebrow:string;title:string;copy:string}){
  return <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionCopy}>{copy}</Text></View>
}

function TrustItem({label,value,complete}:{label:string;value:string;complete:boolean}){
  return <View style={styles.trust}><View style={[styles.trustMark,complete&&styles.trustMarkDone]}><Text style={[styles.trustMarkText,complete&&styles.trustMarkTextDone]}>{complete?'✓':'·'}</Text></View><Text style={styles.trustLabel}>{label}</Text><Text style={[styles.trustValue,complete&&styles.trustValueDone]}>{value}</Text></View>
}

function Field({label,help,children}:{label:string;help:string;children:React.ReactNode}){
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}<Text style={styles.fieldHelp}>{help}</Text></View>
}

function Plan({selected,onPress,name,price,kicker,points}:{selected:boolean;onPress:()=>void;name:string;price:string;kicker:string;points:string[]}){
  return <Pressable onPress={onPress} style={[styles.plan,selected&&styles.planActive]}>
    <View style={styles.planTop}><View style={{flex:1}}><Text style={styles.planKicker}>{kicker}</Text><Text style={styles.planTitle}>{name}</Text></View><Text style={styles.planPrice}>{price}</Text></View>
    <View style={styles.planPoints}>{points.map(point=><View key={point} style={styles.planPoint}><Text style={styles.planTick}>✓</Text><Text style={styles.planPointText}>{point}</Text></View>)}</View>
    <View style={[styles.planChoice,selected&&styles.planChoiceActive]}><Text style={[styles.planChoiceText,selected&&styles.planChoiceTextActive]}>{selected?'Selected':'Choose plan'}</Text></View>
  </Pressable>
}

function MiniStatus({value,label,dark=false}:{value:string;label:string;dark?:boolean}){
  return <View style={styles.miniStatus}><Text style={[styles.miniValue,dark&&styles.miniValueDark]}>{value}</Text><Text style={[styles.miniLabel,dark&&styles.miniLabelDark]}>{label}</Text></View>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  center:{flex:1,backgroundColor:palette.stone,alignItems:'center',justifyContent:'center'},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif,maxWidth:350},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
  errorCard:{backgroundColor:palette.dangerSoft,borderWidth:1,borderColor:'#E8D7D4',padding:14,borderRadius:radius.large,marginBottom:14},
  errorTitle:{color:palette.danger,fontSize:14,fontWeight:'700',fontFamily:type.sans},
  error:{color:palette.danger,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
  statusCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large,marginBottom:8},
  statusCardActive:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},
  statusTop:{flexDirection:'row',gap:12,alignItems:'flex-start'},
  statusEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  statusEyebrowActive:{color:'#CAD4D8'},
  statusTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  statusTitleActive:{color:palette.paper},
  statusCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  statusCopyActive:{color:'#DCE4E7'},
  statusBadge:{backgroundColor:palette.stoneDeep,paddingHorizontal:8,paddingVertical:5,borderRadius:999},
  statusBadgeActive:{backgroundColor:palette.paper},
  statusBadgeText:{color:palette.quiet,fontSize:7,fontWeight:'800',letterSpacing:.8,fontFamily:type.sans},
  statusBadgeTextActive:{color:palette.inkStrong},
  statusMetrics:{flexDirection:'row',borderTopWidth:1,borderTopColor:'rgba(255,255,255,.16)',marginTop:15,paddingTop:13},
  miniStatus:{flex:1},
  miniValue:{color:palette.inkStrong,fontSize:16,fontWeight:'700',fontFamily:type.sans},
  miniValueDark:{color:palette.paper},
  miniLabel:{color:palette.quiet,fontSize:8.5,marginTop:3,fontFamily:type.sans},
  miniLabelDark:{color:'#CBD5D9'},
  sectionHeader:{marginTop:28,marginBottom:10},
  sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.5,fontWeight:'700',fontFamily:type.sans},
  sectionTitle:{color:palette.inkStrong,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginTop:4},
  sectionCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  trustGrid:{flexDirection:'row',flexWrap:'wrap',gap:8},
  trust:{width:'48.5%',backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:14,borderRadius:radius.large,minHeight:118},
  trustMark:{width:25,height:25,borderRadius:13,backgroundColor:palette.stoneDeep,alignItems:'center',justifyContent:'center'},
  trustMarkDone:{backgroundColor:palette.ink},
  trustMarkText:{color:palette.quiet,fontSize:13,fontWeight:'800'},
  trustMarkTextDone:{color:palette.paper},
  trustLabel:{color:palette.quiet,fontSize:8,letterSpacing:.6,fontWeight:'700',marginTop:10,fontFamily:type.sans},
  trustValue:{color:palette.muted,fontSize:11,fontWeight:'600',marginTop:4,fontFamily:type.sans},
  trustValueDone:{color:palette.inkStrong},
  card:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large},
  field:{marginBottom:13},
  label:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',marginBottom:6,fontFamily:type.sans},
  input:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:12,paddingVertical:11,color:palette.text,fontSize:11.5,backgroundColor:palette.stone,borderRadius:radius.medium,fontFamily:type.sans},
  fieldHelp:{color:palette.quiet,fontSize:8.5,lineHeight:13,marginTop:5,fontFamily:type.sans},
  twoCol:{flexDirection:'row',gap:9},
  col:{flex:1},
  switchRow:{flexDirection:'row',alignItems:'center',gap:14,borderTopWidth:1,borderTopColor:palette.line,paddingTop:15,marginTop:2},
  switchEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans},
  switchTitle:{color:palette.inkStrong,fontSize:13,fontWeight:'700',marginTop:4,fontFamily:type.sans},
  help:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:4,fontFamily:type.sans},
  secondary:{borderWidth:1,borderColor:palette.ink,paddingVertical:13,alignItems:'center',marginTop:18,borderRadius:radius.medium},
  secondaryText:{color:palette.ink,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  planStack:{gap:9},
  plan:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large},
  planActive:{borderColor:palette.ink,borderWidth:2,padding:16},
  planTop:{flexDirection:'row',gap:12,justifyContent:'space-between',alignItems:'flex-start'},
  planKicker:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  planTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  planPrice:{color:palette.inkStrong,fontSize:13,fontWeight:'700',fontFamily:type.sans},
  planPoints:{borderTopWidth:1,borderTopColor:palette.line,marginTop:13,paddingTop:11,gap:7},
  planPoint:{flexDirection:'row',gap:8,alignItems:'flex-start'},
  planTick:{color:palette.ink,fontSize:9,fontWeight:'800'},
  planPointText:{color:palette.muted,fontSize:9.5,lineHeight:15,flex:1,fontFamily:type.sans},
  planChoice:{alignSelf:'flex-start',borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:10,paddingVertical:7,borderRadius:radius.small,marginTop:13},
  planChoiceActive:{backgroundColor:palette.ink,borderColor:palette.ink},
  planChoiceText:{color:palette.muted,fontSize:8.5,fontWeight:'700',fontFamily:type.sans},
  planChoiceTextActive:{color:palette.paper},
  warning:{backgroundColor:'#FBF7F0',borderWidth:1,borderColor:'#E9DFCC',padding:13,borderRadius:radius.medium,marginTop:10},
  warningEyebrow:{color:'#7B6034',fontSize:7.5,letterSpacing:1.1,fontWeight:'800',fontFamily:type.sans},
  warningText:{color:'#7B6034',fontSize:9.5,lineHeight:15,marginTop:4,fontFamily:type.sans},
  primary:{backgroundColor:palette.ink,paddingVertical:14,alignItems:'center',marginTop:14,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  secureNote:{color:palette.quiet,fontSize:8.5,textAlign:'center',marginTop:7,fontFamily:type.sans},
  subscriptionCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,flexDirection:'row',gap:12,alignItems:'flex-start'},
  subscriptionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  subscriptionTitle:{color:palette.inkStrong,fontSize:19,lineHeight:24,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  subscriptionCopy:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:4,fontFamily:type.sans},
  subscriptionPrice:{color:palette.inkStrong,fontSize:18,fontWeight:'700',fontFamily:type.sans},
  subscriptionPeriod:{color:palette.quiet,fontSize:9,fontWeight:'500'},
  note:{backgroundColor:palette.stoneDeep,padding:17,borderRadius:radius.large,marginTop:24},
  noteEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  noteTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  noteCopy:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:5,fontFamily:type.sans},
  disabled:{opacity:.45},
})