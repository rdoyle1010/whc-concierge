import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Linking, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

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

  useEffect(()=>{void load()},[])

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
      const l=(data.listing||null) as Listing|null
      setListing(l)
      if(l){
        setPrimary(l.primary_specialism||'')
        setBio(l.bio||'')
        setSpecialisms((l.secondary_specialisms||[]).join(', '))
        setQualifications((l.qualifications||[]).join(', '))
        setBrands((l.brand_experience||[]).join(', '))
        setLocation(l.current_location||'')
        setTravel(l.will_travel_to||'UK Only')
        setDuration(l.preferred_duration||'Flexible')
        setDayRate(l.day_rate?String(l.day_rate):'')
        setWeeklyRate(l.weekly_rate?String(l.weekly_rate):'')
        setMonthlyRate(l.monthly_rate?String(l.monthly_rate):'')
        setAvailableFrom(l.available_from||'')
        setNegotiable(l.negotiable!==false)
      }
    }catch(e:any){setError(e.message||'Could not load Residency setup.')}
    setLoading(false)
  }

  async function join(){
    setBusy(true);setError('')
    try{
      const data=await authFetch('/api/mobile/residency/setup',{method:'POST',body:JSON.stringify({action:'membership_checkout'})})
      if(!data.url)throw new Error('Could not open Residency payment.')
      await Linking.openURL(data.url)
    }catch(e:any){setError(e.message||'Could not start Residency membership.')}
    setBusy(false)
  }

  async function save(){
    setBusy(true);setError('')
    try{
      const data=await authFetch('/api/mobile/residency/setup',{method:'POST',body:JSON.stringify({
        action:'save_listing',primary_specialism:primary,bio,secondary_specialisms:csv(specialisms),qualifications:csv(qualifications),brand_experience:csv(brands),current_location:location,will_travel_to:travel,preferred_duration:duration,day_rate:dayRate?Number(dayRate):null,weekly_rate:weeklyRate?Number(weeklyRate):null,monthly_rate:monthlyRate?Number(monthlyRate):null,negotiable,available_from:availableFrom||null,
      })})
      setListing(data.listing||listing)
      Alert.alert('Residency listing saved',data.listing?.approval_status==='approved'?'Your live listing has been updated.':'Your listing is saved and will appear once WHC approval is complete.')
    }catch(e:any){setError(e.message||'Could not save Residency listing.')}
    setBusy(false)
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>

  const approved=listing?.approval_status==='approved'
  const profileComplete=Boolean(primary.trim()&&bio.trim()&&location.trim())

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Residency</Text></Pressable>
    <Text style={styles.eyebrow}>RESIDENCY · SPECIALIST PROFILE</Text>
    <Text style={styles.title}>Longer placements, professionally presented.</Text>
    <Text style={styles.intro}>Build the specialist profile properties see when they need experienced spa and wellness support for projects, openings, cover or fixed-term assignments.</Text>

    {error?<View style={styles.errorCard}><Text style={styles.errorTitle}>Residency could not update</Text><Text style={styles.error}>{error}</Text></View>:null}

    <View style={[styles.membershipCard,member&&styles.membershipCardActive]}>
      <View style={styles.membershipTop}>
        <View style={{flex:1}}>
          <Text style={[styles.membershipEyebrow,member&&styles.membershipEyebrowActive]}>{member?'RESIDENCY MEMBERSHIP ACTIVE':'RESIDENCY MEMBERSHIP'}</Text>
          <Text style={[styles.membershipTitle,member&&styles.membershipTitleActive]}>{member?'Your specialist access is active':'Join the Residency directory'}</Text>
          <Text style={[styles.membershipCopy,member&&styles.membershipCopyActive]}>{member?`Status: ${subscriptionStatus||'active'}${endsAt?` · current period to ${new Date(endsAt).toLocaleDateString('en-GB')}`:''}`:'£10/month gives you a specialist Residency listing, structured employer offers and booking management.'}</Text>
        </View>
        <View style={[styles.priceBadge,member&&styles.priceBadgeActive]}><Text style={[styles.price,member&&styles.priceActive]}>£10</Text><Text style={[styles.pricePeriod,member&&styles.pricePeriodActive]}>/mo</Text></View>
      </View>
      {!member?<Pressable disabled={busy} onPress={join} style={[styles.membershipButton,busy&&styles.disabled]}><Text style={styles.membershipButtonText}>{busy?'Opening secure checkout…':'Join Residency'}</Text></Pressable>:null}
      {!member?<Pressable onPress={load} style={styles.refreshButton}><Text style={styles.refresh}>Already paid? Refresh membership status</Text></Pressable>:null}
    </View>

    {member?<>
      <View style={styles.recordCard}>
        <View style={styles.recordTop}>
          <View style={{flex:1}}><Text style={styles.recordEyebrow}>LISTING STATUS</Text><Text style={styles.recordTitle}>{listing?approved?'Approved & discoverable':'Approval in progress':'Profile not submitted'}</Text></View>
          <View style={[styles.statusPill,approved&&styles.statusPillActive]}><Text style={[styles.statusText,approved&&styles.statusTextActive]}>{approved?'LIVE':listing?'PENDING':'DRAFT'}</Text></View>
        </View>
        <Text style={styles.recordCopy}>{approved?'Your listing is discoverable by eligible employers in the protected Residency directory.':listing?'WHC approval is pending before your listing becomes discoverable.':'Complete the specialist profile below to create your Residency listing.'}</Text>
        <View style={styles.progressRow}><MiniStatus value={profileComplete?'Ready':'Build'} label="profile"/><MiniStatus value={travel} label="travel"/><MiniStatus value={duration} label="duration"/></View>
      </View>

      <SectionHeader eyebrow="01 · POSITIONING" title="Your specialist profile" copy="Make it immediately clear what kind of assignment you are strongest at and the evidence you bring." />
      <View style={styles.card}>
        <Field label="Primary specialist area" help="The clearest description of the work you want to be found for."><TextInput value={primary} onChangeText={setPrimary} placeholder="e.g. Spa opening specialist" placeholderTextColor={palette.quiet} style={styles.input}/></Field>
        <Field label="Professional summary" help="Explain the problems you solve, the scale you can handle and what a property gets from bringing you in."><TextInput value={bio} onChangeText={setBio} placeholder="What you can bring to a property" placeholderTextColor={palette.quiet} multiline style={[styles.input,styles.multiline]}/></Field>
        <Field label="Secondary specialisms" help="Separate areas with commas."><TextInput value={specialisms} onChangeText={setSpecialisms} placeholder="Operations, training, retail, pre-opening" placeholderTextColor={palette.quiet} style={styles.input}/></Field>
      </View>

      <SectionHeader eyebrow="02 · CREDENTIALS" title="Experience properties can assess" copy="Keep qualifications and brand experience factual so employers can understand fit quickly." />
      <View style={styles.card}>
        <Field label="Qualifications" help="Separate qualifications with commas."><TextInput value={qualifications} onChangeText={setQualifications} placeholder="Separate with commas" placeholderTextColor={palette.quiet} style={styles.input}/></Field>
        <Field label="Brand experience" help="Product houses or hospitality brands you have genuinely worked with."><TextInput value={brands} onChangeText={setBrands} placeholder="ESPA, Natura Bissé, Bamford" placeholderTextColor={palette.quiet} style={styles.input}/></Field>
      </View>

      <SectionHeader eyebrow="03 · MOBILITY" title="Where and when you can work" copy="Residency works best when travel and duration expectations are clear before an employer makes contact." />
      <View style={styles.card}>
        <Field label="Current location / postcode" help="Used as the starting point for practical travel conversations."><TextInput value={location} onChangeText={setLocation} placeholder="Leeds, London, Dubai…" placeholderTextColor={palette.quiet} style={styles.input}/></Field>
        <ChoiceGroup label="Where will you travel?" values={TRAVEL} selected={travel} onSelect={setTravel}/>
        <ChoiceGroup label="Preferred Residency duration" values={DURATIONS} selected={duration} onSelect={setDuration}/>
        <Field label="Available from" help="Use YYYY-MM-DD so employers have a clear availability date."><TextInput value={availableFrom} onChangeText={setAvailableFrom} placeholder="YYYY-MM-DD" placeholderTextColor={palette.quiet} style={styles.input}/></Field>
      </View>

      <SectionHeader eyebrow="04 · COMMERCIALS" title="Your rate expectations" copy="Give employers useful guide rates while retaining the option to negotiate a structured offer." />
      <View style={styles.card}>
        <View style={styles.rateGrid}>
          <View style={styles.rateCol}><Field label="Day rate £"><TextInput value={dayRate} onChangeText={setDayRate} keyboardType="numeric" placeholder="450" placeholderTextColor={palette.quiet} style={styles.input}/></Field></View>
          <View style={styles.rateCol}><Field label="Weekly rate £"><TextInput value={weeklyRate} onChangeText={setWeeklyRate} keyboardType="numeric" placeholder="2000" placeholderTextColor={palette.quiet} style={styles.input}/></Field></View>
        </View>
        <Field label="Monthly rate £"><TextInput value={monthlyRate} onChangeText={setMonthlyRate} keyboardType="numeric" placeholder="7500" placeholderTextColor={palette.quiet} style={styles.input}/></Field>
        <View style={styles.switchRow}><View style={{flex:1,paddingRight:12}}><Text style={styles.switchEyebrow}>OFFER FLEXIBILITY</Text><Text style={styles.switchTitle}>Rates negotiable</Text><Text style={styles.switchCopy}>Employers can still send structured offers and you can counter before anything is agreed.</Text></View><Switch value={negotiable} onValueChange={setNegotiable} trackColor={{false:palette.lineStrong,true:'#A8B9C3'}} thumbColor={negotiable?palette.ink:palette.paper}/></View>
      </View>

      <Pressable disabled={busy} onPress={save} style={[styles.primary,busy&&styles.disabled]}><Text style={styles.primaryText}>{busy?'Saving specialist profile…':listing?'Save Residency changes':'Create Residency listing'}</Text></Pressable>

      <View style={styles.note}><Text style={styles.noteEyebrow}>PROTECTED DIRECTORY</Text><Text style={styles.noteTitle}>A Residency listing is not a public CV board.</Text><Text style={styles.noteCopy}>WHC approval controls whether the listing is discoverable. Your specialist positioning, availability and commercial expectations are there to make relevant employer conversations clearer, not to expose unnecessary personal information.</Text></View>
    </>:null}
  </ScrollView>
}

function SectionHeader({eyebrow,title,copy}:{eyebrow:string;title:string;copy:string}){
  return <View style={styles.sectionHeader}><Text style={styles.sectionEyebrow}>{eyebrow}</Text><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionCopy}>{copy}</Text></View>
}

function Field({label,help,children}:{label:string;help?:string;children:React.ReactNode}){
  return <View style={styles.field}><Text style={styles.label}>{label}</Text>{children}{help?<Text style={styles.fieldHelp}>{help}</Text>:null}</View>
}

function ChoiceGroup({label,values,selected,onSelect}:{label:string;values:string[];selected:string;onSelect:(value:string)=>void}){
  return <View style={styles.choiceBlock}><Text style={styles.label}>{label}</Text><View style={styles.chips}>{values.map(value=><Pressable key={value} onPress={()=>onSelect(value)} style={[styles.chip,selected===value&&styles.chipActive]}><Text style={[styles.chipText,selected===value&&styles.chipTextActive]}>{value}</Text></Pressable>)}</View></View>
}

function MiniStatus({value,label}:{value:string;label:string}){
  return <View style={styles.miniStatus}><Text numberOfLines={1} style={styles.miniValue}>{value}</Text><Text style={styles.miniLabel}>{label}</Text></View>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:118},
  center:{flex:1,alignItems:'center',justifyContent:'center',backgroundColor:palette.stone},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:9,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:34,lineHeight:40,fontWeight:'400',fontFamily:type.serif,maxWidth:360},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
  errorCard:{backgroundColor:palette.dangerSoft,borderWidth:1,borderColor:'#E8D7D4',padding:14,borderRadius:radius.large,marginBottom:12},
  errorTitle:{color:palette.danger,fontSize:13,fontWeight:'700',fontFamily:type.sans},
  error:{color:palette.danger,fontSize:10.5,lineHeight:17,marginTop:4,fontFamily:type.sans},
  membershipCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large,marginBottom:10},
  membershipCardActive:{backgroundColor:palette.inkStrong,borderColor:palette.inkStrong},
  membershipTop:{flexDirection:'row',gap:12,alignItems:'flex-start'},
  membershipEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.3,fontWeight:'700',fontFamily:type.sans},
  membershipEyebrowActive:{color:'#CBD5D9'},
  membershipTitle:{color:palette.inkStrong,fontSize:20,lineHeight:25,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  membershipTitleActive:{color:palette.paper},
  membershipCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  membershipCopyActive:{color:'#DCE4E7'},
  priceBadge:{alignItems:'flex-end'},
  priceBadgeActive:{},
  price:{color:palette.inkStrong,fontSize:19,fontWeight:'700',fontFamily:type.sans},
  priceActive:{color:palette.paper},
  pricePeriod:{color:palette.quiet,fontSize:8.5,fontFamily:type.sans},
  pricePeriodActive:{color:'#CBD5D9'},
  membershipButton:{backgroundColor:palette.ink,paddingVertical:13,alignItems:'center',marginTop:15,borderRadius:radius.medium},
  membershipButtonText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  refreshButton:{paddingVertical:10,alignItems:'center',marginTop:3},
  refresh:{color:palette.muted,fontSize:9.5,fontWeight:'700',fontFamily:type.sans},
  recordCard:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large,marginBottom:4},
  recordTop:{flexDirection:'row',gap:12,alignItems:'flex-start'},
  recordEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  recordTitle:{color:palette.inkStrong,fontSize:18,lineHeight:23,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  recordCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:6,fontFamily:type.sans},
  statusPill:{backgroundColor:palette.stoneDeep,paddingHorizontal:8,paddingVertical:5,borderRadius:999},
  statusPillActive:{backgroundColor:palette.ink},
  statusText:{color:palette.quiet,fontSize:7,fontWeight:'800',letterSpacing:.8,fontFamily:type.sans},
  statusTextActive:{color:palette.paper},
  progressRow:{flexDirection:'row',borderTopWidth:1,borderTopColor:palette.line,marginTop:13,paddingTop:12},
  miniStatus:{flex:1},
  miniValue:{color:palette.inkStrong,fontSize:11,fontWeight:'700',fontFamily:type.sans},
  miniLabel:{color:palette.quiet,fontSize:8,marginTop:3,textTransform:'uppercase',fontFamily:type.sans},
  sectionHeader:{marginTop:28,marginBottom:10},
  sectionEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.5,fontWeight:'700',fontFamily:type.sans},
  sectionTitle:{color:palette.inkStrong,fontSize:22,lineHeight:27,fontWeight:'400',fontFamily:type.serif,marginTop:4},
  sectionCopy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:5,fontFamily:type.sans},
  card:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:17,borderRadius:radius.large},
  field:{marginBottom:14},
  label:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',marginBottom:6,fontFamily:type.sans},
  input:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:12,paddingVertical:11,color:palette.text,fontSize:11.5,backgroundColor:palette.stone,borderRadius:radius.medium,fontFamily:type.sans},
  multiline:{minHeight:118,textAlignVertical:'top'},
  fieldHelp:{color:palette.quiet,fontSize:8.5,lineHeight:13,marginTop:5,fontFamily:type.sans},
  choiceBlock:{marginBottom:15},
  chips:{flexDirection:'row',flexWrap:'wrap',gap:7},
  chip:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:10,paddingVertical:8,borderRadius:999,backgroundColor:palette.stone},
  chipActive:{backgroundColor:palette.ink,borderColor:palette.ink},
  chipText:{color:palette.muted,fontSize:9.5,fontFamily:type.sans},
  chipTextActive:{color:palette.paper,fontWeight:'700'},
  rateGrid:{flexDirection:'row',gap:9},
  rateCol:{flex:1},
  switchRow:{flexDirection:'row',alignItems:'center',gap:12,borderTopWidth:1,borderTopColor:palette.line,paddingTop:14,marginTop:1},
  switchEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.1,fontWeight:'700',fontFamily:type.sans},
  switchTitle:{color:palette.inkStrong,fontSize:12.5,fontWeight:'700',marginTop:4,fontFamily:type.sans},
  switchCopy:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:4,fontFamily:type.sans},
  primary:{backgroundColor:palette.ink,paddingVertical:14,alignItems:'center',marginTop:16,borderRadius:radius.medium},
  primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700',fontFamily:type.sans},
  note:{backgroundColor:palette.stoneDeep,padding:17,borderRadius:radius.large,marginTop:18},
  noteEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  noteTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  noteCopy:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:5,fontFamily:type.sans},
  disabled:{opacity:.45},
})
