import { useEffect, useState } from 'react'
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../src/lib/supabase'

const SITE='https://talent.wellnesshousecollective.co.uk'

export default function SecurityLegalScreen(){
  const params=useLocalSearchParams<{required?:string;role?:string}>()
  const [factor,setFactor]=useState<any>(null)
  const [enrollment,setEnrollment]=useState<any>(null)
  const [code,setCode]=useState('')
  const [busy,setBusy]=useState(false)
  const [loading,setLoading]=useState(true)

  useEffect(()=>{refresh()},[])

  async function refresh(){
    setLoading(true)
    const {data,error}=await supabase.auth.mfa.listFactors()
    if(error){Alert.alert('Security',error.message);setLoading(false);return}
    setFactor((data?.totp||[]).find((f:any)=>f.status==='verified')||null)
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
    setEnrollment(null);setCode('');await refresh();Alert.alert('Authenticator enabled','Two-step verification is now active on this account.')
    if(params.required==='1'&&params.role==='admin') router.replace('/admin')
  }

  async function remove(){
    if(!factor?.id)return
    if(params.required==='1'||params.role==='admin'){Alert.alert('Required','Administrator accounts must keep Authenticator enabled.');return}
    const {error}=await supabase.auth.mfa.unenroll({factorId:factor.id})
    if(error){Alert.alert('Security',error.message);return}
    await refresh()
  }

  const open=(path:string)=>Linking.openURL(`${SITE}${path}`)

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
    <Pressable onPress={()=>router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>ACCOUNT PROTECTION</Text>
    <Text style={styles.title}>Security & Legal</Text>
    <Text style={styles.intro}>Protect your account and access the privacy, GDPR, terms and data controls that apply across the app and website.</Text>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Authenticator app</Text>
      <Text style={styles.copy}>Add a second sign-in check using Microsoft Authenticator, Google Authenticator, 1Password or another TOTP authenticator.</Text>
      {params.required==='1'&&!factor?<Text style={styles.required}>Required before administrator access.</Text>:null}
      {loading?<Text style={styles.muted}>Checking security…</Text>:factor?<>
        <Text style={styles.success}>Enabled</Text>
        <Pressable onPress={remove} style={styles.secondary}><Text style={styles.secondaryText}>{params.role==='admin'?'Required for Admin':'Remove authenticator'}</Text></Pressable>
      </>:enrollment?<>
        <Text style={styles.step}>1. Add this key manually in your authenticator app:</Text>
        <Text selectable style={styles.secret}>{enrollment.totp?.secret||'Key unavailable'}</Text>
        <Text style={styles.step}>2. Enter the current 6-digit code:</Text>
        <TextInput inputMode="numeric" keyboardType="number-pad" maxLength={6} value={code} onChangeText={v=>setCode(v.replace(/\D/g,''))} placeholder="000000" style={styles.code}/>
        <Pressable onPress={verify} disabled={busy||code.length!==6} style={[styles.primary,(busy||code.length!==6)&&styles.disabled]}><Text style={styles.primaryText}>{busy?'Verifying…':'Verify & enable'}</Text></Pressable>
      </>:<Pressable onPress={start} disabled={busy} style={styles.primary}><Text style={styles.primaryText}>{busy?'Starting…':'Set up authenticator'}</Text></Pressable>}
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Privacy & GDPR</Text>
      <Text style={styles.copy}>See how personal data is used, manage privacy preferences and access your data rights.</Text>
      <Pressable onPress={()=>open('/privacy')} style={styles.linkRow}><Text style={styles.linkText}>Privacy policy</Text><Text>›</Text></Pressable>
      <Pressable onPress={()=>open('/talent/privacy')} style={styles.linkRow}><Text style={styles.linkText}>Privacy controls & data rights</Text><Text>›</Text></Pressable>
    </View>

    <View style={styles.card}>
      <Text style={styles.cardTitle}>Terms, copyright & platform rules</Text>
      <Text style={styles.copy}>Your use of Wellness House Talent is subject to the platform terms, acceptable-use rules and intellectual-property protections.</Text>
      <Pressable onPress={()=>open('/terms')} style={styles.linkRow}><Text style={styles.linkText}>Terms & conditions</Text><Text>›</Text></Pressable>
      <Pressable onPress={()=>open('/privacy')} style={styles.linkRow}><Text style={styles.linkText}>Data & privacy information</Text><Text>›</Text></Pressable>
      <Text style={styles.legal}>© Wellness House Collective. Platform branding, original editorial content, course materials and proprietary platform content are protected by applicable copyright and intellectual-property law. Employer and Talent content remains subject to the rights stated in the Terms.</Text>
    </View>
  </ScrollView>
}

const styles=StyleSheet.create({scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:18,paddingBottom:48},back:{color:'#687780',fontSize:14,marginBottom:24},eyebrow:{fontSize:9,letterSpacing:2.1,color:'#71808a',marginBottom:10},title:{fontSize:31,lineHeight:37,color:'#092b45',fontWeight:'500'},intro:{fontSize:13,lineHeight:20,color:'#66747c',marginTop:10,marginBottom:20},card:{borderWidth:1,borderColor:'#dce3e7',padding:18,marginBottom:14},cardTitle:{fontSize:18,color:'#173246',fontWeight:'700',marginBottom:8},copy:{fontSize:12,lineHeight:18,color:'#71808a',marginBottom:14},required:{backgroundColor:'#fff7df',color:'#7d5a00',padding:10,fontSize:11,marginBottom:12},muted:{color:'#8a969d',fontSize:12},success:{color:'#1f6b45',fontSize:12,fontWeight:'700',marginBottom:10},primary:{height:48,backgroundColor:'#092b45',alignItems:'center',justifyContent:'center'},primaryText:{color:'#fff',fontSize:13,fontWeight:'700'},secondary:{height:44,borderWidth:1,borderColor:'#d4dde2',alignItems:'center',justifyContent:'center'},secondaryText:{color:'#173246',fontSize:12,fontWeight:'600'},disabled:{opacity:.45},step:{fontSize:12,color:'#173246',marginTop:8,marginBottom:7},secret:{backgroundColor:'#f4f7f8',padding:12,fontSize:12,color:'#173246',marginBottom:10},code:{height:50,borderWidth:1,borderColor:'#cfd9de',paddingHorizontal:14,fontSize:20,textAlign:'center',letterSpacing:8,color:'#092b45',marginBottom:10},linkRow:{flexDirection:'row',alignItems:'center',justifyContent:'space-between',paddingVertical:12,borderTopWidth:1,borderTopColor:'#edf1f3'},linkText:{color:'#092b45',fontSize:13,fontWeight:'600'},legal:{fontSize:10,lineHeight:16,color:'#8a969d',marginTop:12}})
