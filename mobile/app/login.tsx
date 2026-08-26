import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

export default function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  async function signIn() {
    if (!email.trim() || !password) {
      Alert.alert('Sign in', 'Enter your email and password.')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setLoading(false)
    if (error) {
      Alert.alert('Could not sign in', error.message)
      return
    }
    router.replace('/')
  }

  return (
    <View style={styles.page}>
      <View style={styles.header}>
        <Text style={styles.wordmark}>WELLNESS HOUSE</Text>
        <Text style={styles.sub}>TALENT</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>WELCOME BACK</Text>
        <Text style={styles.title}>Your career, in your pocket.</Text>
        <Text style={styles.intro}>Use the same account you use on the Wellness House Talent website.</Text>
        <TextInput value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="Email address" placeholderTextColor="#9aa5ac" style={styles.input} />
        <TextInput value={password} onChangeText={setPassword} secureTextEntry placeholder="Password" placeholderTextColor="#9aa5ac" style={styles.input} />
        <Pressable onPress={signIn} disabled={loading} style={({ pressed }) => [styles.button, pressed && { opacity: 0.88 }, loading && { opacity: 0.6 }]}>
          <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign in'}</Text>
        </Pressable>
        <Text style={styles.note}>Talent and Employer accounts use the same secure login and the same Supabase data as the website.</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff', paddingHorizontal: 24, justifyContent: 'center' },
  header: { marginBottom: 42 },
  wordmark: { color: '#092b45', fontSize: 23, letterSpacing: 2.2, fontWeight: '600' },
  sub: { color: '#6f7f88', marginTop: 4, fontSize: 11, letterSpacing: 4 },
  card: { borderTopWidth: 1, borderTopColor: '#dfe5e8', paddingTop: 28 },
  eyebrow: { fontSize: 10, letterSpacing: 2.2, color: '#6f7f88', marginBottom: 12 },
  title: { color: '#092b45', fontSize: 31, lineHeight: 36, fontWeight: '500', marginBottom: 10 },
  intro: { color: '#65737c', fontSize: 14, lineHeight: 21, marginBottom: 26 },
  input: { height: 54, borderWidth: 1, borderColor: '#d7dfe3', backgroundColor: '#ffffff', paddingHorizontal: 15, marginBottom: 12, color: '#173246', fontSize: 15 },
  button: { height: 54, backgroundColor: '#092b45', alignItems: 'center', justifyContent: 'center', marginTop: 4 },
  buttonText: { color: '#ffffff', fontSize: 14, fontWeight: '600', letterSpacing: 0.3 },
  note: { color: '#87939a', fontSize: 11, lineHeight: 17, marginTop: 18 },
})
