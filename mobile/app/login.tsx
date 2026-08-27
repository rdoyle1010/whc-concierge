import { useRef, useState } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={8}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="interactive"
        automaticallyAdjustKeyboardInsets
      >
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
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="email-address"
            returnKeyType="next"
            onSubmitEditing={() => passwordRef.current?.focus()}
            placeholder="Email address"
            placeholderTextColor="#9aa5ac"
            style={styles.input}
          />
          <TextInput
            ref={passwordRef}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="go"
            onSubmitEditing={signIn}
            placeholder="Password"
            placeholderTextColor="#9aa5ac"
            style={styles.input}
          />
          <Pressable onPress={signIn} disabled={loading} style={({ pressed }) => [styles.button, pressed && { opacity: 0.88 }, loading && { opacity: 0.6 }]}>
            <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
          </Pressable>
          <Text style={styles.keyboardNote}>Tip: use “Next” then “Go” on the iPhone keyboard to sign in without dismissing it.</Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  flex:{flex:1,backgroundColor:'#fff'},
  scroll:{flex:1,backgroundColor:'#fff'},
  page:{paddingHorizontal:22,paddingTop:18,paddingBottom:180},
  back:{color:'#66747c',fontSize:14,marginBottom:24},
  header:{marginBottom:22},
  wordmark:{color:'#092b45',fontSize:22,letterSpacing:2.2,fontWeight:'600'},
  sub:{color:'#6f7f88',marginTop:4,fontSize:10,letterSpacing:3.2},
  switcher:{flexDirection:'row',borderWidth:1,borderColor:'#dce3e7',marginBottom:22},
  switch:{flex:1,paddingVertical:11,alignItems:'center'},
  switchActive:{backgroundColor:'#092b45'},
  switchText:{color:'#71808a',fontSize:11,fontWeight:'600'},
  switchTextActive:{color:'#fff'},
  card:{borderTopWidth:1,borderTopColor:'#dfe5e8',paddingTop:22},
  eyebrow:{fontSize:9,letterSpacing:2.1,color:'#6f7f88',marginBottom:10},
  title:{color:'#092b45',fontSize:28,lineHeight:34,fontWeight:'500',marginBottom:9},
  intro:{color:'#65737c',fontSize:13,lineHeight:20,marginBottom:20},
  input:{height:52,borderWidth:1,borderColor:'#d7dfe3',backgroundColor:'#fff',paddingHorizontal:15,marginBottom:11,color:'#173246',fontSize:15},
  button:{height:52,backgroundColor:'#092b45',alignItems:'center',justifyContent:'center',marginTop:3},
  buttonText:{color:'#fff',fontSize:14,fontWeight:'700'},
  keyboardNote:{color:'#8a969d',fontSize:10,lineHeight:15,marginTop:12}
})
