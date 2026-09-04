import { useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { ensureTalentRecords } from '../src/lib/talent-bootstrap'
import { palette, radius, space, type } from '../src/lib/theme'

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

    let { data: profile, error: profileError } = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
    if (profileError) {
      await supabase.auth.signOut()
      setLoading(false)
      Alert.alert('Account setup', 'We could not load your Talent House profile. Please try again.')
      return
    }

    if (!profile && role === 'talent') {
      try {
        await ensureTalentRecords(data.user)
        const refreshed = await supabase.from('profiles').select('role').eq('id', data.user.id).maybeSingle()
        profile = refreshed.data
      } catch (bootstrapError:any) {
        await supabase.auth.signOut()
        setLoading(false)
        Alert.alert('Finish account setup', bootstrapError?.message || 'We could not finish setting up your Talent profile.')
        return
      }
    }

    if (!profile) {
      await supabase.auth.signOut()
      setLoading(false)
      Alert.alert('Account not ready', 'This account is not linked to a Talent House profile yet. If you are Talent, choose Talent and try again. Employer accounts should contact the property administrator.')
      return
    }

    const actualRole = profile?.role === 'employer' ? 'employer' : profile?.role === 'admin' ? 'admin' : 'talent'

    if (actualRole !== 'admin' && actualRole !== role) {
      await supabase.auth.signOut()
      setLoading(false)
      const correct = actualRole === 'employer' ? 'Employer' : 'Talent'
      Alert.alert('Wrong sign-in area', `This is a ${correct} account. Please use the ${correct} sign in.`)
      return
    }

    if (actualRole === 'talent') {
      try {
        await ensureTalentRecords(data.user)
      } catch (bootstrapError:any) {
        await supabase.auth.signOut()
        setLoading(false)
        Alert.alert('Talent profile unavailable', bootstrapError?.message || 'We could not prepare your Talent profile.')
        return
      }
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
        <Pressable onPress={() => router.back()}><Text style={styles.back}>← Back</Text></Pressable>
        <View style={styles.header}><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>{role === 'employer' ? 'EMPLOYER' : 'TALENT'}</Text></View>

        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.title}>Sign in to your account.</Text>
        <Text style={styles.intro}>Your website and app use the same Talent House account.</Text>

        <View style={styles.switcher}>{(['talent','employer'] as Role[]).map(item => <Pressable key={item} onPress={() => setRole(item)} style={[styles.switch, role === item && styles.switchActive]}><Text style={[styles.switchText, role === item && styles.switchTextActive]}>{item === 'employer' ? 'Employer' : 'Talent'}</Text></Pressable>)}</View>

        <View style={styles.form}>
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" returnKeyType="next" onSubmitEditing={() => passwordRef.current?.focus()} placeholder="you@example.com" placeholderTextColor={palette.quiet} style={styles.input}/>
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput ref={passwordRef} value={password} onChangeText={setPassword} secureTextEntry returnKeyType="go" onSubmitEditing={signIn} placeholder="Your password" placeholderTextColor={palette.quiet} style={styles.input}/>
          <Pressable onPress={signIn} disabled={loading} style={({ pressed }) => [styles.button, pressed && { opacity: 0.9 }, loading && { opacity: 0.6 }]}><Text style={styles.buttonText}>{loading ? 'Checking security…' : 'Sign in'}</Text></Pressable>
          {role==='talent'?<Pressable onPress={()=>router.push('/signup')} style={styles.signupLink}><Text style={styles.signupText}>New to Talent House? Create Talent account</Text></Pressable>:null}
          <View style={styles.securityNote}><Text style={styles.securityTitle}>Secure account access</Text><Text style={styles.securityCopy}>Accounts protected by Authenticator will be asked for the current six-digit code before access.</Text></View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex:{flex:1,backgroundColor:palette.stone},scroll:{flex:1,backgroundColor:palette.stone},page:{paddingHorizontal:space.page,paddingTop:20,paddingBottom:180},back:{color:palette.muted,fontSize:13,marginBottom:34},header:{marginBottom:42},wordmark:{color:palette.inkStrong,fontSize:20,letterSpacing:2.2,fontWeight:'700'},sub:{color:palette.quiet,marginTop:4,fontSize:9,letterSpacing:3},eyebrow:{fontSize:8,letterSpacing:2.1,color:palette.quiet,marginBottom:10,fontWeight:'700'},title:{color:palette.inkStrong,fontSize:36,lineHeight:42,fontWeight:'400',fontFamily:type.serif,marginBottom:10},intro:{color:palette.muted,fontSize:13,lineHeight:20,marginBottom:24,maxWidth:330},switcher:{flexDirection:'row',backgroundColor:palette.stoneDeep,padding:4,borderRadius:radius.medium,marginBottom:28},switch:{flex:1,paddingVertical:11,alignItems:'center',borderRadius:radius.small},switchActive:{backgroundColor:palette.paper},switchText:{color:palette.muted,fontSize:11,fontWeight:'600'},switchTextActive:{color:palette.inkStrong},form:{backgroundColor:palette.paper,borderWidth:1,borderColor:palette.line,padding:18,borderRadius:radius.large},inputLabel:{color:palette.text,fontSize:11,fontWeight:'700',marginBottom:7},input:{height:52,borderWidth:1,borderColor:palette.lineStrong,backgroundColor:palette.paper,paddingHorizontal:14,marginBottom:16,color:palette.text,fontSize:15,borderRadius:radius.medium},button:{height:52,backgroundColor:palette.inkStrong,alignItems:'center',justifyContent:'center',borderRadius:radius.medium,marginTop:2},buttonText:{color:palette.paper,fontSize:13,fontWeight:'700'},signupLink:{paddingVertical:14,alignItems:'center'},signupText:{color:palette.ink,fontSize:10.5,fontWeight:'700'},securityNote:{backgroundColor:palette.sageSoft,padding:13,borderRadius:radius.medium,marginTop:2},securityTitle:{color:palette.sage,fontSize:10,fontWeight:'700'},securityCopy:{color:palette.muted,fontSize:10,lineHeight:15,marginTop:4}
})