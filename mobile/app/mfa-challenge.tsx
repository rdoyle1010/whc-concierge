import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../src/lib/supabase'

export default function MobileMfaChallenge() {
  const params = useLocalSearchParams<{ factorId?: string; role?: string }>()
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)

  async function verify() {
    const factorId = String(params.factorId || '')
    if (!factorId || code.length !== 6 || busy) return
    setBusy(true)
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code })
    if (error) {
      setBusy(false)
      Alert.alert('Code not accepted', 'Wait for the current six-digit code in your authenticator app and try again.')
      return
    }
    router.replace(params.role === 'admin' ? '/admin' : '/home')
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  return <KeyboardAvoidingView style={styles.page} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <View style={styles.wrap}>
      <Text style={styles.eyebrow}>TWO-STEP VERIFICATION</Text>
      <Text style={styles.title}>Confirm it’s you.</Text>
      <Text style={styles.copy}>Open Microsoft Authenticator, Google Authenticator, 1Password or your chosen authenticator app and enter the current six-digit code.</Text>
      <TextInput autoFocus inputMode="numeric" keyboardType="number-pad" autoComplete="one-time-code" maxLength={6} value={code} onChangeText={value => setCode(value.replace(/\D/g, ''))} placeholder="000000" placeholderTextColor="#a5afb5" style={styles.code}/>
      <Pressable onPress={verify} disabled={busy || code.length !== 6} style={[styles.button,(busy||code.length!==6)&&styles.disabled]}><Text style={styles.buttonText}>{busy?'Verifying…':'Verify & continue'}</Text></Pressable>
      <Pressable onPress={signOut}><Text style={styles.link}>Use a different account</Text></Pressable>
    </View>
  </KeyboardAvoidingView>
}

const styles=StyleSheet.create({page:{flex:1,backgroundColor:'#fff',justifyContent:'center'},wrap:{paddingHorizontal:24},eyebrow:{color:'#74828b',fontSize:9,letterSpacing:2.2,marginBottom:12},title:{color:'#0b2f4d',fontSize:34,lineHeight:40,fontWeight:'500'},copy:{color:'#687780',fontSize:14,lineHeight:22,marginTop:12,marginBottom:28},code:{height:58,borderWidth:1,borderColor:'#cfd9de',fontSize:24,letterSpacing:10,textAlign:'center',color:'#0b2f4d',marginBottom:14},button:{height:54,backgroundColor:'#0b2f4d',alignItems:'center',justifyContent:'center'},disabled:{opacity:.45},buttonText:{color:'#fff',fontWeight:'700',fontSize:14},link:{textAlign:'center',color:'#74828b',fontSize:12,marginTop:18,textDecorationLine:'underline'}})
