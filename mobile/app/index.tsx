import { useEffect, useState } from 'react'
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

export default function IndexScreen() {
  const [message, setMessage] = useState('Opening Wellness House Talent')

  useEffect(() => {
    let active = true

    async function routeUser() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!active) return
      if (!user) {
        router.replace('/login')
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role,full_name')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return
      const role = profile?.role === 'employer' ? 'employer' : profile?.role === 'admin' ? 'admin' : 'talent'
      if (role === 'admin') {
        setMessage('Admin remains web-first. Opening your account hub.')
      }
      router.replace({ pathname: '/home', params: { role } })
    }

    routeUser().catch(() => router.replace('/login'))
    return () => { active = false }
  }, [])

  return (
    <View style={styles.page}>
      <Text style={styles.wordmark}>WELLNESS HOUSE</Text>
      <Text style={styles.sub}>TALENT</Text>
      <ActivityIndicator style={styles.spinner} color="#092b45" />
      <Text style={styles.message}>{message}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  page: { flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 24 },
  wordmark: { color: '#092b45', fontSize: 23, letterSpacing: 2.2, fontWeight: '600' },
  sub: { color: '#6f7f88', marginTop: 4, fontSize: 11, letterSpacing: 4 },
  spinner: { marginTop: 34 },
  message: { marginTop: 16, color: '#6f7f88', fontSize: 12 },
})
