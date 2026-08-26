import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

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

  useEffect(()=>{load()},[])
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
      setCandidate(c);setRate(c.hourly_rate?String(c.hourly_rate):'');setPhone(c.phone||'');setPostcode(c.postcode||'');setRadius(c.travel_radius_miles?String(c.travel_radius_miles):'');setSms(Boolean(c.sms_opt_in));setTier(c.agency_tier==='featured'?'featured':'basic')
    }catch(e:any){setError(e.message||'Could not load Agency account.')}
    setLoading(false)
  }
  async function save(){
    setBusy('save');setError('')
    try{
      await authFetch('/api/mobile/agency/account',{method:'POST',body:JSON.stringify({action:'save',hourly_rate:rate,phone,postcode,travel_radius_miles:radius,sms_opt_in:sms})})
      Alert.alert('Agency details saved','Your rate, contact and travel settings have been updated.');await load()
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
      const data=await authFetch('/api/billing/portal',{method:'POST',body:JSON.stringify({returnUrl:WEB_URL})})
      if(!data.url) throw new Error('Could not open billing portal.')
      await Linking.openURL(data.url)
    }catch(e:any){setError(e.message||'Could not open subscription management.')}
    setBusy('')
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color="#092b45"/></View>
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>AGENCY ACCOUNT</Text><Text style={styles.title}>Be bookable on your terms.</Text>
    <Text style={styles.intro}>Set what you charge, how far you will travel and how properties can reach you. Your paid Agency tier controls register visibility; WHC approval and verification remain separate trust checks.</Text>
    {error?<Text style={styles.error}>{error}</Text>:null}

    <View style={styles.statusCard}>
      <Text style={styles.statusTitle}>{candidate?.agency_available?'Agency register active':'Not currently on the Agency register'}</Text>
      {candidate?.agency_available?<Text style={styles.statusCopy}>{candidate.agency_tier==='featured'?'Featured · £20/month':'Basic · £10/month'}{candidate.agency_listed_until?` · current period to ${new Date(candidate.agency_listed_until).toLocaleDateString('en-GB')}`:''}</Text>:<Text style={styles.statusCopy}>Choose Basic or Featured below once your Talent profile is approved.</Text>}
    </View>

    <View style={styles.trustGrid}>
      <View style={styles.trust}><Text style={styles.trustLabel}>TALENT APPROVAL</Text><Text style={styles.trustValue}>{candidate?.approval_status==='approved'?'Approved ✓':candidate?.approval_status||'Pending'}</Text></View>
      <View style={styles.trust}><Text style={styles.trustLabel}>WHC VERIFIED</Text><Text style={styles.trustValue}>{candidate?.whc_verified?'Verified ✓':'Not yet verified'}</Text></View>
      <View style={styles.trust}><Text style={styles.trustLabel}>INSURANCE</Text><Text style={styles.trustValue}>{candidate?.has_insurance?'Recorded ✓':'Not recorded'}</Text></View>
      <View style={styles.trust}><Text style={styles.trustLabel}>LOCATION</Text><Text style={styles.trustValue}>{candidate?.location_verified?'Postcode verified ✓':'Needs postcode'}</Text></View>
    </View>

    <View style={styles.card}><Text style={styles.sectionTitle}>Your Agency details</Text>
      <Text style={styles.label}>Hourly rate (£)</Text><TextInput value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="25" style={styles.input}/>
      <Text style={styles.label}>Mobile number</Text><TextInput value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholder="07700 900123" style={styles.input}/>
      <Text style={styles.label}>Postcode</Text><TextInput value={postcode} onChangeText={setPostcode} autoCapitalize="characters" placeholder="SW1A 1AA" style={styles.input}/>
      <Text style={styles.label}>Travel radius (miles)</Text><TextInput value={radius} onChangeText={setRadius} keyboardType="number-pad" placeholder="15" style={styles.input}/>
      <View style={styles.switchRow}><View style={{flex:1}}><Text style={styles.switchTitle}>Urgent shift texts</Text><Text style={styles.help}>Allow WHC to text you about urgent same-day cover.</Text></View><Switch value={sms} onValueChange={setSms}/></View>
      <Pressable disabled={!!busy} onPress={save} style={styles.secondary}><Text style={styles.secondaryText}>{busy==='save'?'Saving…':'Save Agency details'}</Text></Pressable>
    </View>

    {!candidate?.agency_available?<View style={styles.card}><Text style={styles.sectionTitle}>Join the Agency register</Text>
      <Pressable onPress={()=>setTier('basic')} style={[styles.plan,tier==='basic'&&styles.planActive]}><Text style={styles.planTitle}>Basic · £10/month</Text><Text style={styles.help}>Listed on the Agency register, receive shift offers and urgent-cover alerts.</Text></Pressable>
      <Pressable onPress={()=>setTier('featured')} style={[styles.plan,tier==='featured'&&styles.planActive]}><Text style={styles.planTitle}>Featured · £20/month</Text><Text style={styles.help}>Everything in Basic plus top placement and a Featured badge.</Text></Pressable>
      {candidate?.approval_status!=='approved'?<Text style={styles.warning}>Your Talent profile must be approved by WHC before payment is enabled.</Text>:null}
      <Pressable disabled={!!busy||candidate?.approval_status!=='approved'} onPress={checkout} style={[styles.primary,(!!busy||candidate?.approval_status!=='approved')&&styles.disabled]}><Text style={styles.primaryText}>{busy==='checkout'?'Opening payment…':`Join ${tier==='featured'?'Featured':'Basic'} Agency`}</Text></Pressable>
    </View>:<View style={styles.card}><Text style={styles.sectionTitle}>Subscription</Text><Text style={styles.help}>Use Stripe billing to update your payment method, cancel, or manage your active Agency subscription.</Text><Pressable disabled={!!busy} onPress={manageSubscription} style={styles.primary}><Text style={styles.primaryText}>{busy==='portal'?'Opening billing…':'Manage Agency subscription'}</Text></Pressable></View>}
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:110},center:{flex:1,backgroundColor:'#fff',alignItems:'center',justifyContent:'center'},back:{color:'#66747c',fontSize:13,marginBottom:34},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2.1,marginBottom:10},title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'},intro:{color:'#66747c',fontSize:14,lineHeight:21,marginTop:10,marginBottom:22},error:{color:'#9b2c2c',fontSize:12,lineHeight:18,marginBottom:14},statusCard:{backgroundColor:'#f4f7f8',padding:18,marginBottom:12},statusTitle:{color:'#173246',fontSize:15,fontWeight:'700'},statusCopy:{color:'#66747c',fontSize:11,lineHeight:17,marginTop:5},trustGrid:{gap:8,marginBottom:14},trust:{borderWidth:1,borderColor:'#dce3e7',padding:13},trustLabel:{color:'#71808a',fontSize:8,letterSpacing:1.2},trustValue:{color:'#173246',fontSize:12,fontWeight:'600',marginTop:4},card:{borderWidth:1,borderColor:'#dce3e7',padding:18,marginBottom:14},sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600',marginBottom:14},label:{color:'#173246',fontSize:10,fontWeight:'600',marginBottom:5,marginTop:10},input:{borderWidth:1,borderColor:'#d7e0e4',paddingHorizontal:12,paddingVertical:11,color:'#173246',fontSize:12},switchRow:{flexDirection:'row',alignItems:'center',gap:14,marginTop:16},switchTitle:{color:'#173246',fontSize:12,fontWeight:'600'},help:{color:'#71808a',fontSize:10,lineHeight:16,marginTop:3},secondary:{borderWidth:1,borderColor:'#092b45',paddingVertical:13,alignItems:'center',marginTop:18},secondaryText:{color:'#092b45',fontSize:11,fontWeight:'700'},plan:{borderWidth:1,borderColor:'#dce3e7',padding:14,marginBottom:9},planActive:{borderColor:'#092b45',borderWidth:2},planTitle:{color:'#173246',fontSize:13,fontWeight:'700'},warning:{color:'#8a5b18',fontSize:11,lineHeight:17,marginTop:8},primary:{backgroundColor:'#092b45',paddingVertical:15,alignItems:'center',marginTop:16},primaryText:{color:'#fff',fontSize:11,fontWeight:'700'},disabled:{opacity:.4}})
