import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, AppState, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

type Role='talent'|'employer'
type FeaturedEmployerOffer={
  product_key:string
  label:string
  description:string
  price_pence:number
  billing_interval:'month'|'year'|'one_off'
}
type StatusPayload={role:Role;profile:any;featuredEmployerOffer?:FeaturedEmployerOffer|null}

const WEB_URL=process.env.EXPO_PUBLIC_WEB_URL||'https://talenthousecollective.co.uk'

function dateLabel(value?:string|null){
  if(!value)return''
  const date=new Date(value)
  return Number.isNaN(date.getTime())?'':date.toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'})
}

function priceLabel(pence:number,interval?:string|null){
  const pounds=pence/100
  const amount=Number.isInteger(pounds)?`£${pounds}`:`£${pounds.toFixed(2)}`
  return interval==='year'?`${amount} / year`:interval==='month'?`${amount} / month`:amount
}

export default function BillingScreen(){
  const [data,setData]=useState<StatusPayload|null>(null)
  const [loading,setLoading]=useState(true)
  const [busy,setBusy]=useState('')
  const [error,setError]=useState('')

  useEffect(()=>{
    void load()
    const sub=AppState.addEventListener('change',state=>{if(state==='active')void load(false)})
    return()=>sub.remove()
  },[])

  async function authFetch(path:string,options?:RequestInit){
    const {data:{session}}=await supabase.auth.getSession()
    if(!session?.access_token)throw new Error('Your session has expired. Please sign in again.')
    const response=await fetch(`${WEB_URL}${path}`,{...options,headers:{'Content-Type':'application/json',Authorization:`Bearer ${session.access_token}`,...(options?.headers||{})}})
    const body=await response.json().catch(()=>({}))
    if(!response.ok)throw new Error(body?.error||'Could not load billing.')
    return body
  }

  async function load(showSpinner=true){
    if(showSpinner)setLoading(true)
    setError('')
    try{setData(await authFetch('/api/mobile/billing/status'))}
    catch(e:any){setError(e?.message||'Could not load billing.')}
    finally{if(showSpinner)setLoading(false)}
  }

  async function checkout(product:string){
    setBusy(product);setError('')
    try{
      const result=await authFetch('/api/commercial/checkout',{method:'POST',body:JSON.stringify({product,returnUrl:WEB_URL})})
      if(!result?.url)throw new Error('Checkout did not return a secure payment link.')
      Alert.alert('Secure checkout','Stripe will open securely. Return to the app after payment and your account will refresh automatically.')
      await Linking.openURL(result.url)
    }catch(e:any){setError(e?.message||'Could not start checkout.')}
    finally{setBusy('')}
  }

  async function checkoutFeaturedEmployer(){
    if(!data?.profile?.id)return
    setBusy('featured_employer');setError('')
    try{
      const result=await authFetch('/api/stripe/featured-employer',{method:'POST',body:JSON.stringify({employerId:data.profile.id,returnUrl:WEB_URL,returnPath:'/billing'})})
      if(!result?.url)throw new Error('Featured Employer checkout did not return a secure payment link.')
      Alert.alert('Featured Employer','Stripe will open securely. Return to the app after payment and your Featured status will refresh automatically.')
      await Linking.openURL(result.url)
    }catch(e:any){setError(e?.message||'Could not start Featured Employer checkout.')}
    finally{setBusy('')}
  }

  async function manage(scope=''){
    setBusy(scope==='featured_employer'?'manage_featured':'manage');setError('')
    try{
      const result=await authFetch('/api/billing/portal',{method:'POST',body:JSON.stringify({returnUrl:WEB_URL,returnPath:'/billing',...(scope?{scope}:{})})})
      if(!result?.url)throw new Error('Billing portal unavailable.')
      await Linking.openURL(result.url)
    }catch(e:any){setError(e?.message||'Could not open billing management.')}
    finally{setBusy('')}
  }

  if(loading)return <View style={styles.center}><ActivityIndicator color={palette.ink}/></View>
  if(!data?.profile)return <View style={styles.center}><Text style={styles.error}>{error||'Billing profile not found.'}</Text></View>

  const {role,profile}=data
  const tier=String(profile.membership_tier||'free').toLowerCase()
  const paidMembership=role==='talent'?['standard','pro'].includes(tier):['pro','group'].includes(tier)
  const renewal=dateLabel(profile.membership_renews_at)
  const featuredActive=role==='employer'&&Boolean(profile.featured_employer&&(!profile.featured_until||new Date(profile.featured_until).getTime()>Date.now()))
  const planName=tier==='free'?'Free':tier.charAt(0).toUpperCase()+tier.slice(1)

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>ACCOUNT</Text>
    <Text style={styles.title}>{role==='talent'?'Membership & career services':'Membership & recruitment services'}</Text>
    <Text style={styles.intro}>{role==='talent'?'See what is active on your account, what you can use today and any optional visibility services in one place.':'See your live recruitment plan, job allowance and optional employer visibility without mixing them together.'}</Text>
    {error?<Text style={styles.error}>{error}</Text>:null}

    <View style={styles.currentCard}>
      <View style={styles.currentTop}>
        <View><Text style={styles.currentEyebrow}>CURRENT PLAN</Text><Text style={styles.plan}>{planName}</Text></View>
        <View style={[styles.statusPill,paidMembership&&styles.statusPillActive]}><Text style={[styles.status,paidMembership&&styles.statusActive]}>{paidMembership?'ACTIVE':'FREE'}</Text></View>
      </View>
      {renewal?<Text style={styles.renewal}>{profile.membership_cancel_at_period_end?'Access ends':'Renews'} {renewal}</Text>:null}

      {role==='talent'?<View style={styles.entitlements}>
        <View style={styles.entitlement}><Text style={styles.entitlementNumber}>{Number(profile.interview_ready_credits||0)}</Text><Text style={styles.entitlementLabel}>Interview Ready credits</Text></View>
        <View style={styles.entitlement}><Text style={styles.entitlementNumber}>{Number(profile.academy_discount_pct||0)}%</Text><Text style={styles.entitlementLabel}>Academy discount</Text></View>
        {Number(profile.free_feature_credits||0)>0?<View style={styles.entitlement}><Text style={styles.entitlementNumber}>{profile.free_feature_credits}</Text><Text style={styles.entitlementLabel}>Featured credit</Text></View>:null}
      </View>:<View style={styles.entitlements}>
        {tier==='group'?<View style={styles.entitlement}><Text style={styles.entitlementNumber}>{Math.max(0,Number(profile.annual_job_allowance||0)-Number(profile.annual_jobs_used||0))}</Text><Text style={styles.entitlementLabel}>Included jobs remaining</Text></View>:null}
        {tier==='pro'?<View style={styles.entitlement}><Text style={styles.entitlementNumber}>£99</Text><Text style={styles.entitlementLabel}>Standard Job rate</Text></View>:null}
      </View>}

      {paidMembership?<Pressable disabled={!!busy} onPress={()=>manage()} style={styles.manageButton}><Text style={styles.manageText}>{busy==='manage'?'Opening…':'Manage plan & payment method'}</Text><Text style={styles.lightArrow}>→</Text></Pressable>:null}
    </View>

    {role==='talent'?<>
      {!paidMembership?<View style={styles.section}>
        <Text style={styles.sectionEyebrow}>MEMBERSHIP</Text><Text style={styles.sectionTitle}>Choose the support you need</Text><Text style={styles.sectionCopy}>Your free account still works. Membership adds preparation credits, enhanced matching and Academy savings.</Text>
        <View style={styles.planCard}>
          <View style={styles.planRow}><View><Text style={styles.cardTitle}>Standard</Text><Text style={styles.price}>£9.99 <Text style={styles.pricePeriod}>/ month</Text></Text></View><Text style={styles.planTag}>ESSENTIALS</Text></View>
          <Text style={styles.copy}>1 Interview Ready credit each month, enhanced matching and 10% Academy discount.</Text>
          <Pressable disabled={!!busy} onPress={()=>checkout('talent_standard')} style={styles.primary}><Text style={styles.primaryText}>{busy==='talent_standard'?'Opening…':'Choose Standard'}</Text></Pressable>
        </View>
        <View style={[styles.planCard,styles.planCardEmphasis]}>
          <View style={styles.planRow}><View><Text style={styles.cardTitle}>Pro</Text><Text style={styles.price}>£19.99 <Text style={styles.pricePeriod}>/ month</Text></Text></View><Text style={styles.planTag}>MORE SUPPORT</Text></View>
          <Text style={styles.copy}>10 Interview Ready credits each month, priority visibility, advanced preparation and 20% Academy discount.</Text>
          <Pressable disabled={!!busy} onPress={()=>checkout('talent_pro')} style={styles.primary}><Text style={styles.primaryText}>{busy==='talent_pro'?'Opening…':'Choose Pro'}</Text></Pressable>
        </View>
      </View>:null}

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>OPTIONAL VISIBILITY</Text><Text style={styles.sectionTitle}>Featured Talent</Text><Text style={styles.sectionCopy}>Use this only when you want an extra visibility boost. It is separate from your core Talent profile.</Text>
        {profile.is_featured&&profile.featured_until?<View style={styles.activeBox}><Text style={styles.activeEyebrow}>FEATURED ACTIVE</Text><Text style={styles.activeTitle}>Visible until {dateLabel(profile.featured_until)}</Text><Text style={styles.copy}>Your profile currently receives premium placement in employer discovery and Talent House featured areas.</Text></View>:null}
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}><Text style={styles.optionTitle}>7 days</Text><Text style={styles.optionText}>Short visibility boost</Text></View>
          <View style={styles.optionAction}><Text style={styles.optionPrice}>£9.99</Text><Pressable disabled={!!busy} onPress={()=>checkout('featured_talent_7')} style={styles.compactButton}><Text style={styles.compactButtonText}>{busy==='featured_talent_7'?'Opening…':'Choose'}</Text></Pressable></View>
        </View>
        <View style={styles.optionRow}>
          <View style={styles.optionCopy}><Text style={styles.optionTitle}>30 days</Text><Text style={styles.optionText}>A month of premium visibility</Text></View>
          <View style={styles.optionAction}><Text style={styles.optionPrice}>£24.99</Text><Pressable disabled={!!busy} onPress={()=>checkout('featured_talent_30')} style={styles.compactButton}><Text style={styles.compactButtonText}>{busy==='featured_talent_30'?'Opening…':'Choose'}</Text></Pressable></View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>SPECIALIST SERVICES</Text><Text style={styles.sectionTitle}>Agency & Residency</Text><Text style={styles.sectionCopy}>These sit alongside your main Talent membership and have their own status and setup.</Text>
        <Pressable onPress={()=>router.push('/agency-account')} style={styles.serviceCard}><View style={{flex:1}}><Text style={styles.serviceTitle}>Agency Register</Text><Text style={styles.serviceCopy}>{profile.agency_available?`Active${profile.agency_tier?` · ${profile.agency_tier}`:''}`:'Not currently listed'}</Text></View><Text style={styles.arrow}>→</Text></Pressable>
        <Pressable onPress={()=>router.push('/residency-setup')} style={styles.serviceCard}><View style={{flex:1}}><Text style={styles.serviceTitle}>Residency</Text><Text style={styles.serviceCopy}>{profile.residency_member?'Membership active':'No active Residency membership'}</Text></View><Text style={styles.arrow}>→</Text></Pressable>
      </View>
    </>:<>
      {!paidMembership?<View style={styles.section}>
        <Text style={styles.sectionEyebrow}>EMPLOYER MEMBERSHIP</Text><Text style={styles.sectionTitle}>Choose your recruitment plan</Text><Text style={styles.sectionCopy}>Membership and Featured Employer are separate products so you can choose recruitment tools without being forced into promotional visibility.</Text>
        <View style={styles.planCard}>
          <View style={styles.planRow}><View><Text style={styles.cardTitle}>Employer Pro</Text><Text style={styles.price}>£499 <Text style={styles.pricePeriod}>/ year</Text></Text></View><Text style={styles.planTag}>SINGLE PROPERTY</Text></View>
          <Text style={styles.copy}>Full Talent search, enhanced matching, analytics and £99 Standard Jobs.</Text>
          <Pressable disabled={!!busy} onPress={()=>checkout('employer_pro')} style={styles.primary}><Text style={styles.primaryText}>{busy==='employer_pro'?'Opening…':'Choose Employer Pro'}</Text></Pressable>
        </View>
        <View style={[styles.planCard,styles.planCardEmphasis]}>
          <View style={styles.planRow}><View><Text style={styles.cardTitle}>Employer Group</Text><Text style={styles.price}>£999 <Text style={styles.pricePeriod}>/ year</Text></Text></View><Text style={styles.planTag}>MULTI-PROPERTY</Text></View>
          <Text style={styles.copy}>Multi-property recruitment, advanced tools and up to 20 included jobs each year.</Text>
          <Pressable disabled={!!busy} onPress={()=>checkout('employer_group')} style={styles.primary}><Text style={styles.primaryText}>{busy==='employer_group'?'Opening…':'Choose Employer Group'}</Text></Pressable>
        </View>
      </View>:null}

      <View style={styles.section}>
        <Text style={styles.sectionEyebrow}>OPTIONAL VISIBILITY</Text><Text style={styles.sectionTitle}>Featured Employer</Text><Text style={styles.sectionCopy}>Promotional visibility is separate from your recruitment membership. Use it when you want additional property exposure.</Text>
        {featuredActive?<View style={styles.activeBox}>
          <Text style={styles.activeEyebrow}>FEATURED ACTIVE</Text><Text style={styles.activeTitle}>Your property has enhanced visibility</Text>
          <Text style={styles.copy}>{profile.featured_until?`Current paid period runs until ${dateLabel(profile.featured_until)}.`:'Your property currently receives enhanced visibility.'}</Text>
          <Pressable disabled={!!busy} onPress={()=>manage('featured_employer')} style={styles.secondary}><Text style={styles.secondaryText}>{busy==='manage_featured'?'Opening…':'Manage Featured subscription'}</Text></Pressable>
        </View>:data.featuredEmployerOffer?<View style={styles.planCard}>
          <Text style={styles.cardTitle}>{data.featuredEmployerOffer.label}</Text>
          <Text style={styles.price}>{priceLabel(data.featuredEmployerOffer.price_pence,data.featuredEmployerOffer.billing_interval)}</Text>
          <Text style={styles.copy}>{data.featuredEmployerOffer.description}</Text>
          <Text style={styles.copy}>Includes featured property placement, homepage exposure and a launch alert to approved Talent. This remains separate from Employer Pro/Group and Preferred Employer.</Text>
          <Pressable disabled={!!busy} onPress={checkoutFeaturedEmployer} style={styles.primary}><Text style={styles.primaryText}>{busy==='featured_employer'?'Opening…':'Go Featured'}</Text></Pressable>
        </View>:<View style={styles.unavailable}><Text style={styles.unavailableTitle}>Not currently available</Text><Text style={styles.copy}>Featured Employer is not currently available for purchase on this account.</Text></View>}
      </View>
    </>}

    <View style={styles.secureNote}><Text style={styles.secureTitle}>Secure payments</Text><Text style={styles.secureCopy}>Checkout and payment-method management open securely in Stripe. When you return to the app, this screen refreshes your live account status automatically.</Text></View>
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:120},center:{flex:1,alignItems:'center',justifyContent:'center',padding:24,backgroundColor:palette.stone},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},back:{color:palette.muted,fontSize:13},eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9},title:{color:palette.inkStrong,fontFamily:type.serif,fontSize:34,lineHeight:40,fontWeight:'400',maxWidth:365},intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,maxWidth:365},error:{color:palette.danger,fontSize:11,lineHeight:17,marginBottom:14},
  currentCard:{backgroundColor:palette.inkStrong,padding:18,borderRadius:radius.large,marginBottom:30},currentTop:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'flex-start'},currentEyebrow:{color:'#C8D1D2',fontSize:7.5,letterSpacing:1.5,fontWeight:'700'},plan:{color:palette.paper,fontFamily:type.serif,fontSize:29,fontWeight:'400',marginTop:5},statusPill:{backgroundColor:'rgba(255,255,255,.1)',paddingHorizontal:9,paddingVertical:6,borderRadius:999},statusPillActive:{backgroundColor:'rgba(216,232,220,.16)'},status:{color:'#D8DEDF',fontSize:7.5,fontWeight:'800',letterSpacing:1},statusActive:{color:'#E2ECE4'},renewal:{color:'#D8DEDF',fontSize:10.5,marginTop:7},entitlements:{flexDirection:'row',flexWrap:'wrap',gap:8,marginTop:15},entitlement:{minWidth:'30%',flexGrow:1,backgroundColor:'rgba(255,255,255,.08)',padding:10,borderRadius:radius.medium},entitlementNumber:{color:palette.paper,fontFamily:type.serif,fontSize:19,fontWeight:'400'},entitlementLabel:{color:'#C8D1D2',fontSize:8.5,lineHeight:13,marginTop:3},manageButton:{borderTopWidth:1,borderTopColor:'rgba(255,255,255,.16)',marginTop:15,paddingTop:13,flexDirection:'row',justifyContent:'space-between',alignItems:'center'},manageText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},lightArrow:{color:palette.paper,fontSize:15},
  section:{marginBottom:30},sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.7,fontWeight:'700',marginBottom:5},sectionTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:23,lineHeight:28,fontWeight:'400'},sectionCopy:{color:palette.muted,fontSize:10.5,lineHeight:16,marginTop:5,marginBottom:12},
  planCard:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,padding:17,borderRadius:radius.large,marginBottom:10},planCardEmphasis:{borderColor:'#BCC8BF',backgroundColor:'#FBFCFA'},planRow:{flexDirection:'row',justifyContent:'space-between',gap:12,alignItems:'flex-start'},cardTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:20,lineHeight:25,fontWeight:'400'},price:{color:palette.inkStrong,fontSize:18,fontWeight:'700',marginTop:5},pricePeriod:{color:palette.muted,fontSize:10,fontWeight:'500'},planTag:{color:palette.quiet,fontSize:7.5,fontWeight:'800',letterSpacing:.8,paddingTop:4},copy:{color:palette.muted,fontSize:10.5,lineHeight:17,marginTop:7},primary:{backgroundColor:palette.inkStrong,paddingVertical:13,alignItems:'center',marginTop:14,borderRadius:radius.medium},primaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},secondary:{borderWidth:1,borderColor:palette.lineStrong,paddingVertical:12,alignItems:'center',marginTop:13,borderRadius:radius.medium},secondaryText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},
  activeBox:{backgroundColor:palette.sageSoft,borderWidth:1,borderColor:'#CDD7CF',padding:16,borderRadius:radius.large,marginBottom:10},activeEyebrow:{color:palette.sage,fontSize:7.5,fontWeight:'800',letterSpacing:1.1},activeTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:19,lineHeight:24,fontWeight:'400',marginTop:5},
  optionRow:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,padding:15,borderRadius:radius.large,marginBottom:9,flexDirection:'row',justifyContent:'space-between',alignItems:'center',gap:14},optionCopy:{flex:1},optionTitle:{color:palette.inkStrong,fontSize:14,fontWeight:'700'},optionText:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:3},optionAction:{alignItems:'flex-end',gap:7},optionPrice:{color:palette.inkStrong,fontSize:12,fontWeight:'700'},compactButton:{borderWidth:1,borderColor:palette.lineStrong,paddingHorizontal:11,paddingVertical:8,borderRadius:radius.medium},compactButtonText:{color:palette.ink,fontSize:9.5,fontWeight:'700'},
  serviceCard:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,padding:15,borderRadius:radius.large,marginBottom:9,flexDirection:'row',alignItems:'center',gap:12},serviceTitle:{color:palette.inkStrong,fontSize:14,fontWeight:'700'},serviceCopy:{color:palette.muted,fontSize:10,lineHeight:15,marginTop:3},arrow:{color:palette.ink,fontSize:15},
  unavailable:{borderWidth:1,borderColor:palette.line,backgroundColor:palette.paper,padding:16,borderRadius:radius.large},unavailableTitle:{color:palette.inkStrong,fontSize:14,fontWeight:'700'},
  secureNote:{backgroundColor:palette.sageSoft,padding:15,borderRadius:radius.large,marginTop:2},secureTitle:{color:palette.sage,fontSize:10.5,fontWeight:'700'},secureCopy:{color:palette.muted,fontSize:9.5,lineHeight:15,marginTop:4},
})