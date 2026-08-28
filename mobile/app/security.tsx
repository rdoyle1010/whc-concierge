import { useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

const SITE='https://talent.wellnesshousecollective.co.uk'

export default function SecurityLegalScreen(){
  const params=useLocalSearchParams<{required?:string;role?:string}>()
  const [factor,setFactor]=useState<any>(null)
  const [enrollment,setEnrollment]=useState<any>(null)
  const [code,setCode]=useState('')
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{void refresh()},[])

  async function refresh(){
    setLoading(true)
    const {data,error}=await supabase.auth.mfa.listFactors()
    if(error){Alert.alert('Security',error.message);setLoading(false);return}
    setFactor((data?.totp||[]).find((item:any)=>item.status==='verified')||null)
    setLoading(false)
  }

  async function start(){
    setBusy(true)
    const {data,error}=await supabase.auth.mfa.enroll({factorType:'totp',friendlyName:'WHC Authenticator'})
    setBusy(false)
    if(error){Alert.alert('Authenticator',error.message);return}
    setEnrollment(data)
  }

  async function verify(){
    if(!enrollment?.id||code.length!==6)return
    setBusy(true)
    const {error}=await supabase.auth.mfa.challengeAndVerify({factorId:enrollment.id,code})
    setBusy(false)
    if(error){Alert.alert('Code not accepted','Check the current six-digit code and try again.');return}
    setEnrollment(null);setCode('');await refresh()
    Alert.alert('Authenticator enabled','Two-step verification is now active on this account.')
    if(params.required==='1'&&params.role==='admin')router.replace('/admin')
  }

  async function remove(){
    if(!factor?.id)return
    if(params.required==='1'||params.role==='admin'){Alert.alert('Required','Administrator accounts must keep Authenticator enabled.');return}
    const {error}=await supabase.auth.mfa.unenroll({factorId:factor.id})
    if(error){Alert.alert('Security',error.message);return}
    await refresh()
  }

  const open=(path:string)=>Linking.openURL(`${SITE}${path}`)

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={()=>router.back()} style={styles.backButton}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>ACCOUNT</Text>
    <Text style={styles.title}>Security, privacy & settings</Text>
    <Text style={styles.intro}>Keep your account protected, control how you are seen and find the important platform rules without digging through small print.</Text>

    <View style={[styles.heroCard,factor&&styles.heroCardActive]}>
      <View style={styles.heroTop}>
        <View style={{flex:1}}><Text style={styles.heroEyebrow}>TWO-STEP VERIFICATION</Text><Text style={styles.heroTitle}>Authenticator app</Text></View>
        <View style={[styles.statusPill,factor&&styles.statusPillActive]}><Text style={[styles.statusText,factor&&styles.statusTextActive]}>{loading?'CHECKING':factor?'ON':'OFF'}</Text></View>
      </View>
      <Text style={styles.heroCopy}>Add a second sign-in check using Microsoft Authenticator, Google Authenticator, 1Password or another TOTP authenticator.</Text>

      {params.required==='1'&&!factor?<View style={styles.requiredBox}><Text style={styles.requiredTitle}>Required for administrator access</Text><Text style={styles.requiredCopy}>Admin accounts must keep two-step verification enabled.</Text></View>:null}

      {loading?<Text style={styles.muted}>Checking your security status…</Text>:factor?<>
        <View style={styles.successBox}><Text style={styles.successTitle}>Authenticator enabled</Text><Text style={styles.successCopy}>This account is protected by a second sign-in step.</Text></View>
        <Pressable onPress={remove} style={styles.secondary}><Text style={styles.secondaryText}>{params.role==='admin'?'Required for Admin':'Remove authenticator'}</Text></Pressable>
      </>:enrollment?<>
        <Text style={styles.stepLabel}>STEP 1</Text><Text style={styles.stepTitle}>Add this key to your authenticator app</Text>
        <Text selectable style={styles.secret}>{enrollment.totp?.secret||'Key unavailable'}</Text>
        <Text style={styles.stepLabel}>STEP 2</Text><Text style={styles.stepTitle}>Enter the current six-digit code</Text>
        <TextInput inputMode="numeric" keyboardType="number-pad" maxLength={6} value={code} onChangeText={value=>setCode(value.replace(/\D/g,''))} placeholder="000000" placeholderTextColor={palette.quiet} style={styles.code}/>
        <Pressable onPress={verify} disabled={busy||code.length!==6} style={[styles.primary,(busy||code.length!==6)&&styles.disabled]}><Text style={styles.primaryText}>{busy?'Verifying…':'Verify & enable'}</Text></Pressable>
      </>:<Pressable onPress={start} disabled={busy} style={styles.primary}><Text style={styles.primaryText}>{busy?'Starting…':'Set up authenticator'}</Text></Pressable>}
    </View>

    <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>PRIVACY</Text><Text style={styles.sectionTitle}>Control your visibility and data</Text></View>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Privacy & GDPR</Text>
      <Text style={styles.copy}>Manage Stealth Mode, blocked employers and your wider privacy rights.</Text>
      <Pressable onPress={()=>router.push('/privacy-stealth')} style={styles.linkRow}><View style={{flex:1}}><Text style={styles.linkText}>Stealth Mode & blocked employers</Text><Text style={styles.linkCopy}>Choose who must not be able to discover your profile.</Text></View><Text style={styles.arrow}>→</Text></Pressable>
      <Pressable onPress={()=>open('/privacy')} style={styles.linkRow}><View style={{flex:1}}><Text style={styles.linkText}>Privacy policy</Text><Text style={styles.linkCopy}>How Wellness House handles personal information.</Text></View><Text style={styles.arrow}>→</Text></Pressable>
      <Pressable onPress={()=>open('/talent/privacy')} style={styles.linkRow}><View style={{flex:1}}><Text style={styles.linkText}>Privacy controls & data rights</Text><Text style={styles.linkCopy}>Access the wider data-rights area.</Text></View><Text style={styles.arrow}>→</Text></Pressable>
    </View>

    <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>AGENCY SAFETY</Text><Text style={styles.sectionTitle}>Before and during a shift</Text></View>
    <View style={styles.card}>
      <View style={styles.protocolRow}><Text style={styles.protocolNumber}>01</Text><Text style={styles.protocol}>Check the property, address, hours, rate, travel information and booking status before accepting.</Text></View>
      <View style={styles.protocolRow}><Text style={styles.protocolNumber}>02</Text><Text style={styles.protocol}>Keep booking and payment arrangements on Wellness House so there is a clear record.</Text></View>
      <View style={styles.protocolRow}><Text style={styles.protocolNumber}>03</Text><Text style={styles.protocol}>If the workplace, duties or person materially differ from the booking, use Shift Resolution and do not feel pressured to continue.</Text></View>
      <View style={styles.protocolRow}><Text style={styles.protocolNumber}>04</Text><Text style={styles.protocol}>If you feel unsafe or at immediate risk, leave if you safely can and contact the appropriate emergency service.</Text></View>
      <View style={styles.protocolRow}><Text style={styles.protocolNumber}>05</Text><Text style={styles.protocol}>Never share passwords, authenticator codes, banking credentials or private documents through chat.</Text></View>
      <Pressable onPress={()=>router.push('/agency')} style={styles.linkRow}><Text style={styles.linkText}>Open Agency & Shift Resolution</Text><Text style={styles.arrow}>→</Text></Pressable>
    </View>

    <View style={styles.sectionHeading}><Text style={styles.sectionEyebrow}>PLATFORM</Text><Text style={styles.sectionTitle}>Legal & acceptable use</Text></View>
    <View style={styles.card}>
      <Text style={styles.copy}>Your use of Wellness House Talent is subject to the platform terms, privacy rules and intellectual-property protections.</Text>
      <Pressable onPress={()=>open('/terms')} style={styles.linkRow}><Text style={styles.linkText}>Terms & conditions</Text><Text style={styles.arrow}>→</Text></Pressable>
      <Pressable onPress={()=>open('/privacy')} style={styles.linkRow}><Text style={styles.linkText}>Data & privacy information</Text><Text style={styles.arrow}>→</Text></Pressable>
      <Text style={styles.legal}>© Wellness House Collective. Original platform branding, editorial content, course materials and proprietary platform content are protected by applicable copyright and intellectual-property law. Employer and Talent content remains subject to the rights stated in the Terms.</Text>
    </View>
  </ScrollView>
}

const styles=StyleSheet.create({
  scroll:{flex:1,backgroundColor:palette.stone},
  page:{paddingHorizontal:space.page,paddingTop:18,paddingBottom:120},
  backButton:{alignSelf:'flex-start',paddingVertical:6,marginBottom:22},
  back:{color:palette.muted,fontSize:13},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.2,fontWeight:'700',marginBottom:9},
  title:{color:palette.inkStrong,fontFamily:type.serif,fontSize:34,lineHeight:40,fontWeight:'400',maxWidth:365},
  intro:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,maxWidth:365},
  heroCard:{backgroundColor:palette.inkStrong,padding:18,borderRadius:radius.large,marginBottom:30},
  heroCardActive:{backgroundColor:'#173831'},
  heroTop:{flexDirection:'row',justifyContent:'space-between',alignItems:'flex-start',gap:12},
  heroEyebrow:{color:'#C8D1D2',fontSize:7.5,letterSpacing:1.5,fontWeight:'700'},
  heroTitle:{color:palette.paper,fontFamily:type.serif,fontSize:24,lineHeight:29,fontWeight:'400',marginTop:5},
  heroCopy:{color:'#D8DEDF',fontSize:10.5,lineHeight:17,marginTop:8},
  statusPill:{backgroundColor:'rgba(255,255,255,.1)',paddingHorizontal:9,paddingVertical:6,borderRadius:999},
  statusPillActive:{backgroundColor:'rgba(216,232,220,.16)'},
  statusText:{color:'#D8DEDF',fontSize:7.5,fontWeight:'800',letterSpacing:.8},
  statusTextActive:{color:'#E4EFE6'},
  requiredBox:{backgroundColor:'#F8F2E5',padding:11,borderRadius:radius.medium,marginTop:14},
  requiredTitle:{color:'#6A5634',fontSize:10.5,fontWeight:'800'},
  requiredCopy:{color:'#7B6A4C',fontSize:9.5,lineHeight:15,marginTop:3},
  muted:{color:'#D8DEDF',fontSize:10.5,marginTop:14},
  successBox:{backgroundColor:'rgba(255,255,255,.08)',padding:11,borderRadius:radius.medium,marginTop:14},
  successTitle:{color:palette.paper,fontSize:10.5,fontWeight:'800'},
  successCopy:{color:'#D8DEDF',fontSize:9.5,lineHeight:15,marginTop:3},
  primary:{backgroundColor:palette.paper,paddingVertical:13,alignItems:'center',marginTop:14,borderRadius:radius.medium},
  primaryText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'800'},
  secondary:{borderWidth:1,borderColor:'rgba(255,255,255,.25)',paddingVertical:12,alignItems:'center',marginTop:12,borderRadius:radius.medium},
  secondaryText:{color:palette.paper,fontSize:10.5,fontWeight:'700'},
  disabled:{opacity:.45},
  stepLabel:{color:'#C8D1D2',fontSize:7.5,letterSpacing:1.3,fontWeight:'700',marginTop:16},
  stepTitle:{color:palette.paper,fontSize:11.5,fontWeight:'700',marginTop:4,marginBottom:7},
  secret:{backgroundColor:'rgba(255,255,255,.08)',padding:12,fontSize:11,color:palette.paper,borderRadius:radius.medium},
  code:{height:50,borderWidth:1,borderColor:'rgba(255,255,255,.22)',paddingHorizontal:14,fontSize:20,textAlign:'center',letterSpacing:8,color:palette.paper,backgroundColor:'rgba(255,255,255,.06)',borderRadius:radius.medium},
  sectionHeading:{marginBottom:10},
  sectionEyebrow:{color:palette.quiet,fontSize:8,letterSpacing:1.7,fontWeight:'700',marginBottom:5},
  sectionTitle:{color:palette.inkStrong,fontFamily:type.serif,fontSize:22,lineHeight:27,fontWeight:'400'},
  card:{borderWidth:1,borderColor:palette.line,padding:17,marginBottom:26,backgroundColor:palette.paper,borderRadius:radius.large},
  cardTitle:{color:palette.inkStrong,fontSize:14,fontWeight:'700'},
  copy:{fontSize:10.5,lineHeight:17,color:palette.muted,marginTop:5,marginBottom:7},
  linkRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',gap:12,paddingVertical:12,borderTopWidth:1,borderTopColor:palette.line},
  linkText:{color:palette.inkStrong,fontSize:10.5,fontWeight:'700',flex:1},
  linkCopy:{color:palette.muted,fontSize:9.5,lineHeight:14,marginTop:3},
  arrow:{color:palette.ink,fontSize:15},
  protocolRow:{flexDirection:'row',gap:11,paddingVertical:10,borderBottomWidth:1,borderBottomColor:palette.line},
  protocolNumber:{color:palette.sage,fontSize:8,fontWeight:'800',letterSpacing:.8,paddingTop:2},
  protocol:{fontSize:10.5,lineHeight:17,color:palette.muted,flex:1},
  legal:{fontSize:9.5,lineHeight:15,color:palette.quiet,marginTop:12},
})