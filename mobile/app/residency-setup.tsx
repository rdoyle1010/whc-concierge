import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talent.wellnesshousecollective.co.uk'
const DURATIONS = ['1-2 months','3-4 months','5-6 months','Flexible']
const TRAVEL = ['UK Only','Europe','Middle East','Asia Pacific','Global']

type Listing = {
  id?: string
  approval_status?: string | null
  primary_specialism?: string | null
  bio?: string | null
  secondary_specialisms?: string[] | null
  qualifications?: string[] | null
  brand_experience?: string[] | null
  current_location?: string | null
  will_travel_to?: string | null
  preferred_duration?: string | null
  day_rate?: number | null
  weekly_rate?: number | null
  monthly_rate?: number | null
  negotiable?: boolean | null
  available_from?: string | null
}

export default function ResidencySetupScreen(){
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState(false)
  const [member,setMember]=useState(false)
  const [subscriptionStatus,setSubscriptionStatus]=useState('')
  const [endsAt,setEndsAt]=useState<string|null>(null)
  const [listing,setListing]=useState<Listing|null>(null)
  const [primary,setPrimary]=useState('')
  const [bio,setBio]=useState('')
  const [specialisms,setSpecialisms]=useState('')
  const [qualifications,setQualifications]=useState('')
  const [brands,setBrands]=useState('')
  const [location,setLocation]=useState('')
  const [travel,setTravel]=useState('UK Only')
  const [duration,setDuration]=useState('Flexible')
  const [dayRate,setDayRate]=useState('')
  const [weeklyRate,setWeeklyRate]=useState('')
  const [monthlyRate,setMonthlyRate]=useState('')
  const [availableFrom,setAvailableFrom]=useState('')
  const [negotiable,setNegotiable]=useState(true)
  const [error,setError]=useState('')

  useEffect(()=>{load()},[])
  async function authFetch(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const res=await fetch(`${WEB_URL}${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`,...(options?.headers||{})}})
    const data=await res.json().catch(()=>({}))
    if(!res.ok)throw new Error(data.error||'Could not update Residency.')
    return data
  }
  function csv(value:string){return value.split(',').map(v=>v.trim()).filter(Boolean)}
  async function load(){
    setLoading(true);setError('')
    try{
      const data=await authFetch('/api/mobile/residency/setup')
      setMember(Boolean(data.candidate?.residency_member))
      setSubscriptionStatus(data.candidate?.residency_subscription_status||'')
      setEndsAt(data.candidate?.residency_subscription_ends_at||null)
      const l=(data.listing||null) as Listing|null;setListing(l)
      if(l){setPrimary(l.primary_specialism||'');setBio(l.bio||'');setSpecialisms((l.secondary_specialisms||[]).join(', '));setQualifications((l.qualifications||[]).join(', '));setBrands((l.brand_experience||[]).join(', '));setLocation(l.current_location||'');setTravel(l.will_travel_to||'UK Only');setDuration(l.preferred_duration||'Flexible');setDayRate(l.day_rate?String(l.day_rate):'');setWeeklyRate(l.weekly_rate?String(l.weekly_rate):'');setMonthlyRate(l.monthly_rate?String(l.monthly_rate):'');setAvailableFrom(l.available_from||'');setNegotiable(l.negotiable!==false)}
    }catch(e:any){setError(e.message||'Could not load Residency setup.')}
    setLoading(false)
  }
  async function join(){
    setBusy(true);setError('')
    try{const data=await authFetch('/api/mobile/residency/setup',{method:'POST',body:JSON.stringify({action:'membership_checkout'})});if(!data.url)throw new Error('Could not open Residency payment.');await Linking.openURL(data.url)}catch(e:any){setError(e.message||'Could not start Residency membership.')}
    setBusy(false)
  }
  async function save(){
    setBusy(true);setError('')
    try{
      const data=await authFetch('/api/mobile/residency/setup',{method:'POST',body:JSON.stringify({action:'save_listing',primary_specialism:primary,bio,secondary_specialisms:csv(specialisms),qualifications:csv(qualifications),brand_experience:csv(brands),current_location:location,will_travel_to:travel,preferred_duration:duration,day_rate:dayRate?Number(dayRate):null,weekly_rate:weeklyRate?Number(weeklyRate):null,monthly_rate:monthlyRate?Number(monthlyRate):null,negotiable,available_from:availableFrom||null})})
      setListing(data.listing||listing);Alert.alert('Residency listing saved',data.listing?.approval_status==='approved'?'Your live listing has been updated.':'Your listing is saved and will appear once WHC approval is complete.')
    }catch(e:any){setError(e.message||'Could not save Residency listing.')}
    setBusy(false)
  }
  if(loading)return <View style={styles.center}><ActivityIndicator color="#092b45"/></View>
  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Residency</Text></Pressable>
    <Text style={styles.eyebrow}>RESIDENCY LISTING</Text><Text style={styles.title}>Your specialist profile.</Text><Text style={styles.intro}>Create the profile properties see when they are looking for longer-form spa and wellness expertise.</Text>
    {error?<Text style={styles.error}>{error}</Text>:null}
    <View style={styles.membershipCard}><View style={styles.row}><View style={{flex:1}}><Text style={styles.sectionTitle}>{member?'Residency membership active':'Join Residency'}</Text><Text style={styles.help}>{member?`Status: ${subscriptionStatus||'active'}${endsAt?` · current period to ${new Date(endsAt).toLocaleDateString('en-GB')}`:''}`:'£10/month gives you a specialist Residency listing, employer offers and booking management.'}</Text></View><Text style={styles.price}>£10/mo</Text></View>{!member?<Pressable disabled={busy} onPress={join} style={styles.primary}><Text style={styles.primaryText}>{busy?'Opening Stripe…':'Join Residency'}</Text></Pressable>:null}<Pressable onPress={load}><Text style={styles.refresh}>I’ve paid · refresh status</Text></Pressable></View>
    {member?<>
      <View style={styles.statusCard}><Text style={styles.statusLabel}>LISTING STATUS</Text><Text style={styles.statusValue}>{listing?.approval_status||'Not created'}</Text><Text style={styles.help}>{listing?.approval_status==='approved'?'Your listing is discoverable by employers in the protected Residency directory.':listing?'WHC approval is pending before your listing appears publicly.':'Complete the listing below to submit it for approval.'}</Text></View>
      <Field label="Primary specialist area" value={primary} onChangeText={setPrimary} placeholder="e.g. Spa opening specialist"/>
      <Field label="Professional summary" value={bio} onChangeText={setBio} placeholder="What you can bring to a property" multiline/>
      <Field label="Secondary specialisms" value={specialisms} onChangeText={setSpecialisms} placeholder="Operations, training, retail, pre-opening"/>
      <Field label="Qualifications" value={qualifications} onChangeText={setQualifications} placeholder="Separate with commas"/>
      <Field label="Brand experience" value={brands} onChangeText={setBrands} placeholder="ESPA, Natura Bissé, Bamford"/>
      <Field label="Current location / postcode" value={location} onChangeText={setLocation}/>
      <Text style={styles.label}>Where will you travel?</Text><View style={styles.chips}>{TRAVEL.map(v=><Pressable key={v} onPress={()=>setTravel(v)} style={[styles.chip,travel===v&&styles.chipActive]}><Text style={[styles.chipText,travel===v&&styles.chipTextActive]}>{v}</Text></Pressable>)}</View>
      <Text style={styles.label}>Preferred Residency duration</Text><View style={styles.chips}>{DURATIONS.map(v=><Pressable key={v} onPress={()=>setDuration(v)} style={[styles.chip,duration===v&&styles.chipActive]}><Text style={[styles.chipText,duration===v&&styles.chipTextActive]}>{v}</Text></Pressable>)}</View>
      <View style={styles.rateGrid}><Field label="Day rate £" value={dayRate} onChangeText={setDayRate} keyboardType="numeric"/><Field label="Weekly rate £" value={weeklyRate} onChangeText={setWeeklyRate} keyboardType="numeric"/><Field label="Monthly rate £" value={monthlyRate} onChangeText={setMonthlyRate} keyboardType="numeric"/></View>
      <Field label="Available from" value={availableFrom} onChangeText={setAvailableFrom} placeholder="YYYY-MM-DD"/>
      <View style={styles.switchRow}><View style={{flex:1}}><Text style={styles.labelNoMargin}>Rates negotiable</Text><Text style={styles.help}>Employers can still send structured offers and you can counter.</Text></View><Switch value={negotiable} onValueChange={setNegotiable}/></View>
      <Pressable disabled={busy} onPress={save} style={styles.primary}><Text style={styles.primaryText}>{busy?'Saving…':listing?'Save changes':'Create Residency listing'}</Text></Pressable>
    </>:null}
  </ScrollView>
}
function Field({label,...props}:any){return <View style={styles.field}><Text style={styles.label}>{label}</Text><TextInput {...props} style={[styles.input,props.multiline&&styles.multiline]} placeholderTextColor="#9aa5ab"/></View>}
const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:64,paddingBottom:50},center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:'#fff'},back:{color:'#66747c',fontSize:13,marginBottom:30},eyebrow:{color:'#71808a',fontSize:9,letterSpacing:2,marginBottom:10},title:{color:'#092b45',fontSize:31,lineHeight:37,fontWeight:'500'},intro:{color:'#66747c',fontSize:13,lineHeight:20,marginTop:8,marginBottom:20},membershipCard:{backgroundColor:'#f4f7f8',padding:18,marginBottom:16},statusCard:{borderWidth:1,borderColor:'#dce3e7',padding:18,marginBottom:20},row:{flexDirection:'row',gap:14,alignItems:'flex-start'},sectionTitle:{color:'#173246',fontSize:17,fontWeight:'600'},price:{color:'#092b45',fontSize:14,fontWeight:'700'},help:{color:'#71808a',fontSize:11,lineHeight:17,marginTop:5},primary:{backgroundColor:'#092b45',paddingVertical:14,alignItems:'center',marginTop:16},primaryText:{color:'#fff',fontSize:11,fontWeight:'700'},refresh:{color:'#526976',fontSize:10,fontWeight:'600',textAlign:'center',marginTop:12},statusLabel:{color:'#71808a',fontSize:8,letterSpacing:1.6},statusValue:{color:'#173246',fontSize:19,fontWeight:'600',textTransform:'capitalize',marginTop:5},field:{marginBottom:15},label:{color:'#526976',fontSize:10,fontWeight:'600',marginBottom:6},labelNoMargin:{color:'#526976',fontSize:10,fontWeight:'600'},input:{borderWidth:1,borderColor:'#dce3e7',paddingHorizontal:13,paddingVertical:12,color:'#173246',fontSize:12,backgroundColor:'#fff'},multiline:{minHeight:110,textAlignVertical:'top'},chips:{flexDirection:'row',flexWrap:'wrap',gap:7,marginBottom:16},chip:{borderWidth:1,borderColor:'#dce3e7',paddingHorizontal:10,paddingVertical:9},chipActive:{backgroundColor:'#092b45',borderColor:'#092b45'},chipText:{color:'#526976',fontSize:10},chipTextActive:{color:'#fff'},rateGrid:{gap:0},switchRow:{flexDirection:'row',alignItems:'center',gap:14,borderWidth:1,borderColor:'#dce3e7',padding:14,marginBottom:16},error:{color:'#9b2c2c',fontSize:12,marginBottom:14}})
