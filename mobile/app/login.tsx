import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer' | 'admin'

export default function LoginScreen() {
  const params = useLocalSearchParams<{ role?: string }>()
  const initialRole: Role = params.role === 'employer' ? 'employer' : params.role === 'admin' ? 'admin' : 'talent'
  const [role, setRole] = useState<Role>(initialRole)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

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
    const actualRole: Role = profile?.role === 'employer' ? 'employer' : profile?.role === 'admin' ? 'admin' : 'talent'
    setLoading(false)

    if (role === 'admin' && actualRole !== 'admin') {
      await supabase.auth.signOut()
      Alert.alert('Admin access', 'This account does not have administrator access.')
      return
    }

    router.replace(actualRole === 'admin' ? '/admin' : '/home')
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
      <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
      <View style={styles.header}>
        <Text style={styles.wordmark}>WELLNESS HOUSE</Text>
        <Text style={styles.sub}>{role === 'admin' ? 'ADMIN' : role === 'employer' ? 'EMPLOYER' : 'TALENT'}</Text>
      </View>

      <View style={styles.switcher}>
        {(['talent','employer','admin'] as Role[]).map(item => (
          <Pressable key={item} onPress={() => setRole(item)} style={[styles.switch, role === item && styles.switchActive]}>
            <Text style={[styles.switchText, role === item && styles.switchTextActive]}>{item === 'admin' ? 'Admin' : item === 'employer' ? 'Employer' : 'Talent'}</Text>
          </Pressable>
        ))}
      </View>

      <View style={styles.card}>
        <Text style={styles.eyebrow}>{role === 'admin' ? 'SECURE PLATFORM ACCESS' : 'WELCOME BACK'}</Text>
        <Text style={styles.title}>{role === 'admin' ? 'Admin sign in.' : 'Your Wellness House account.'}</Text>
        <Text style={styles.intro}>{role === 'admin' ? 'Use your existing administrator credentials to open the mobile operations dashboard.' : 'Use the same email and password you use on the Wellness House website.'}</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email address" placeholderTextColor="#9aa5ac" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#9aa5ac" style={styles.input} />
        <Pressable onPress={signIn} disabled={loading} style={({ pressed }) => [styles.button, pressed && { opacity: 0.88 }, loading && { opacity: 0.6 }]}>
          <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll:{flex:1,backgroundColor:'#fff'}, page:{paddingHorizontal:22,paddingTop:20,paddingBottom:40}, back:{color:'#66747c',fontSize:14,marginBottom:30}, header:{marginBottom:28}, wordmark:{color:'#092b45',fontSize:22,letterSpacing:2.2,fontWeight:'600'}, sub:{color:'#6f7f88',marginTop:4,fontSize:10,letterSpacing:3.2}, switcher:{flexDirection:'row',borderWidth:1,borderColor:'#dce3e7',marginBottom:28}, switch:{flex:1,paddingVertical:12,alignItems:'center'}, switchActive:{backgroundColor:'#092b45'}, switchText:{color:'#71808a',fontSize:11,fontWeight:'600'}, switchTextActive:{color:'#fff'}, card:{borderTopWidth:1,borderTopColor:'#dfe5e8',paddingTop:26}, eyebrow:{fontSize:9,letterSpacing:2.1,color:'#6f7f88',marginBottom:11}, title:{color:'#092b45',fontSize:30,lineHeight:36,fontWeight:'500',marginBottom:10}, intro:{color:'#65737c',fontSize:14,lineHeight:21,marginBottom:24}, input:{height:54,borderWidth:1,borderColor:'#d7dfe3',backgroundColor:'#fff',paddingHorizontal:15,marginBottom:12,color:'#173246',fontSize:15}, button:{height:54,backgroundColor:'#092b45',alignItems:'center',justifyContent:'center',marginTop:4}, buttonText:{color:'#fff',fontSize:14,fontWeight:'700'}
})
