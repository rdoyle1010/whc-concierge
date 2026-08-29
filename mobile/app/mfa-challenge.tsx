import { useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

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
      <Text style={styles.wordmark}>WELLNESS HOUSE</Text>
      <Text style={styles.submark}>SECURE ACCESS</Text>

      <Text style={styles.eyebrow}>TWO-STEP VERIFICATION</Text>
      <Text style={styles.title}>Confirm it’s you.</Text>
      <Text style={styles.copy}>Open Microsoft Authenticator, Google Authenticator, 1Password or your chosen authenticator app and enter the current six-digit code.</Text>

      <View style={styles.card}>
        <Text style={styles.label}>AUTHENTICATOR CODE</Text>
        <TextInput
          autoFocus
          inputMode="numeric"
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={6}
          value={code}
          onChangeText={value => setCode(value.replace(/\D/g, ''))}
          placeholder="000000"
          placeholderTextColor={palette.quiet}
          style={styles.code}
        />
        <Text style={styles.help}>Enter the six-digit code currently showing in your authenticator app.</Text>
        <Pressable onPress={verify} disabled={busy || code.length !== 6} style={[styles.button,(busy||code.length!==6)&&styles.disabled]}>
          <Text style={styles.buttonText}>{busy?'Verifying…':'Verify & continue'}</Text>
        </Pressable>
      </View>

      <View style={styles.securityNote}>
        <Text style={styles.securityEyebrow}>ACCOUNT PROTECTION</Text>
        <Text style={styles.securityTitle}>An extra check before access.</Text>
        <Text style={styles.securityCopy}>This code helps protect your profile, applications, employer information and account settings if someone else knows your password.</Text>
      </View>

      <Pressable onPress={signOut} style={styles.linkButton}><Text style={styles.link}>Use a different account</Text></Pressable>
    </View>
  </KeyboardAvoidingView>
}

const styles=StyleSheet.create({
  page:{flex:1,backgroundColor:palette.stone,justifyContent:'center'},
  wrap:{paddingHorizontal:space.page,paddingVertical:32},
  wordmark:{color:palette.inkStrong,fontSize:18,letterSpacing:2.1,fontWeight:'700',fontFamily:type.sans},
  submark:{color:palette.quiet,fontSize:8,letterSpacing:2.7,marginTop:4,marginBottom:40,fontFamily:type.sans},
  eyebrow:{color:palette.quiet,fontSize:8,letterSpacing:2.1,marginBottom:10,fontWeight:'700',fontFamily:type.sans},
  title:{color:palette.inkStrong,fontSize:35,lineHeight:41,fontWeight:'400',fontFamily:type.serif},
  copy:{color:palette.muted,fontSize:13,lineHeight:20,marginTop:10,marginBottom:22,fontFamily:type.sans},
  card:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large},
  label:{color:palette.quiet,fontSize:7.5,letterSpacing:1.4,fontWeight:'700',marginBottom:8,fontFamily:type.sans},
  code:{height:58,borderWidth:1,borderColor:palette.lineStrong,backgroundColor:palette.stone,fontSize:24,letterSpacing:10,textAlign:'center',color:palette.inkStrong,borderRadius:radius.medium,fontFamily:type.sans},
  help:{color:palette.quiet,fontSize:8.5,lineHeight:13,marginTop:7,fontFamily:type.sans},
  button:{height:52,backgroundColor:palette.inkStrong,alignItems:'center',justifyContent:'center',borderRadius:radius.medium,marginTop:16},
  disabled:{opacity:.45},
  buttonText:{color:palette.paper,fontWeight:'700',fontSize:12,fontFamily:type.sans},
  securityNote:{backgroundColor:palette.stoneDeep,padding:16,borderRadius:radius.large,marginTop:12},
  securityEyebrow:{color:palette.quiet,fontSize:7.5,letterSpacing:1.2,fontWeight:'700',fontFamily:type.sans},
  securityTitle:{color:palette.inkStrong,fontSize:17,lineHeight:22,fontWeight:'400',fontFamily:type.serif,marginTop:5},
  securityCopy:{color:palette.muted,fontSize:10,lineHeight:16,marginTop:5,fontFamily:type.sans},
  linkButton:{alignSelf:'center',paddingVertical:14,paddingHorizontal:10,marginTop:4},
  link:{textAlign:'center',color:palette.muted,fontSize:10.5,fontWeight:'700',fontFamily:type.sans}
})
