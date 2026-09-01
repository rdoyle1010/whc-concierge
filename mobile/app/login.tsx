import { useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer'

export default function LoginScreen() {
  const params = useLocalSearchParams<{ role?: string }>()
  const initialRole: Role = params.role === 'employer' ? 'employer' : 'talent'
  const [role, setRole] = useState<Role>(initialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const passwordRef = useRef<TextInput>(null)

  async function signIn() {
    if (!email.trim() || !password) {
      Alert.alert('Sign in', 'Enter your email and password.')
      return
    }
    setLoading(true)
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error || !data.user) {
      setLoading(false)
      Alert.alert('Could not sign in', error?.message || 'Sign in failed.')
      return
    }

    const { data: profile } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    const actualRole = profile?.role === 'employer' ? 'employer' : profile?.role === 'admin' ? 'admin' : 'talent'

    // Admin is intentionally not advertised in the public app login. Valid admin
    // credentials are still detected securely and routed through MFA below.
    if (actualRole !== 'admin' && actualRole !== role) {
      await supabase.auth.signOut()
      setLoading(false)
      const correct = actualRole === 'employer' ? 'Employer' : 'Talent'
      Alert.alert('Wrong sign-in area', `This is a ${correct} account. Please use the ${correct} sign in.`)
      return
    }

    const { data: factors, error: factorError } = await supabase.auth.mfa.listFactors()
    if (factorError) {
      await supabase.auth.signOut()
      setLoading(false)
      Alert.alert('Security check failed', 'We could not verify this account’s security settings. Please try again.')
      return
    }
    const verifiedFactor = (factors?.totp || []).find((factor: any) => factor.status === 'verified')
    const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel()
    setLoading(false)

    if (verifiedFactor && assurance?.currentLevel !== 'aal2') {
      router.replace({ pathname: '/mfa-challenge', params: { factorId: verifiedFactor.id, role: actualRole } })
      return
    }

    if (actualRole === 'admin' && !verifiedFactor) {
      router.replace({ pathname: '/security', params: { required: '1', role: 'admin' } })
      return
    }

    router.replace(actualRole === 'admin' ? '/admin' : '/home')
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={8}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets>
        <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
        <View style={styles.header}><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>{role === 'employer' ? 'EMPLOYER' : 'TALENT'}</Text></View>

        <View style={styles.switcher}>{(['talent','employer'] as Role[]).map(item => <Pressable key={item} onPress={() => setRole(item)} style={[styles.switch, role === item && styles.switchActive]}><Text style={[styles.switchText, role === item && styles.switchTextActive]}>{item === 'employer' ? 'Employer' : 'Talent'}</Text></Pressable>)}</View>

        <View style={styles.card}>
          <Text style={styles.eyebrow}>WELCOME BACK</Text>
          <Text style={styles.title}>Your Wellness House account.</Text>
          <Text style={styles.intro}>Use the same account as the Wellness House website. Accounts protected by Authenticator will be asked for the current six-digit code before access.</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} placeholder="Email address" placeholderTextColor="#9aa5ac" style={styles.input}/>
          <TextInput ref={passwordRef} value={password} onChangeText={setPassword} secureTextEntry returnKeyType="go" onSubmitEditing={signIn} placeholder="Password" placeholderTextColor="#9aa5ac" style={styles.input}/>
          <Pressable onPress={signIn} disabled={loading} style={({ pressed }) => [styles.button, pressed && { opacity: 0.88 }, loading && { opacity: 0.6 }]}><Text style={styles.buttonText}>{loading ? 'Checking security…' : 'Sign in securely'}</Text></Pressable>
          <Text style={styles.keyboardNote}>Admin access is not advertised in the public app. Authorised administrator accounts are detected automatically and require Authenticator protection.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({flex:{flex:1,backgroundColor:'#fff'},scroll:{flex:1,backgroundColor:'#fff'},page:{paddingHorizontal:22,paddingTop:18,paddingBottom:180},back:{color:'#66747c',fontSize:14,marginBottom:24},header:{marginBottom:22},wordmark:{color:'#0b2f4d',fontSize:22,letterSpacing:2.2,fontWeight:'600'},sub:{color:'#6f7f88',marginTop:4,fontSize:10,letterSpacing:3.2},switcher:{flexDirection:'row',borderWidth:1,borderColor:'#dce3e7',marginBottom:22},switch:{flex:1,paddingVertical:11,alignItems:'center'},switchActive:{backgroundColor:'#0b2f4d'},switchText:{color:'#71808a',fontSize:11,fontWeight:'600'},switchTextActive:{color:'#fff'},card:{borderTopWidth:1,borderTopColor:'#dfe5e8',paddingTop:22},eyebrow:{fontSize:9,letterSpacing:2.1,color:'#6f7f88',marginBottom:10},title:{color:'#0b2f4d',fontSize:28,lineHeight:34,fontWeight:'500',marginBottom:9},intro:{color:'#65737c',fontSize:13,lineHeight:20,marginBottom:20},input:{height:52,borderWidth:1,borderColor:'#d7dfe3',backgroundColor:'#fff',paddingHorizontal:15,marginBottom:11,color:'#173246',fontSize:15},button:{height:52,backgroundColor:'#0b2f4d',alignItems:'center',justifyContent:'center',marginTop:3},buttonText:{color:'#fff',fontSize:14,fontWeight:'700'},keyboardNote:{color:'#8a969d',fontSize:10,lineHeight:15,marginTop:12}})
