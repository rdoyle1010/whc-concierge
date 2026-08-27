import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

export default function IndexScreen() {
  const [hasSession, setHasSession] = useState(false)

  useEffect(() => {
    let active = true
    supabase.auth.getUser().then(({ data }) => {
      if (active) setHasSession(Boolean(data.user))
    })
    return () => { active = false }
  }, [])

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
      <View style={styles.brandBlock}>
        <Text style={styles.wordmark}>WELLNESS HOUSE</Text>
        <Text style={styles.sub}>TALENT · EMPLOYERS · WELLNESS</Text>
      </View>

      <View style={styles.hero}>
        <Text style={styles.eyebrow}>THE SPA & WELLNESS CAREER PLATFORM</Text>
        <Text style={styles.title}>One platform. Better careers. Better teams.</Text>
        <Text style={styles.intro}>Discover roles, recruit exceptional people, manage flexible staffing and build careers across spa, wellness and hospitality.</Text>
      </View>

      {hasSession ? (
        <Pressable onPress={() => router.push('/home')} style={styles.primary}>
          <Text style={styles.primaryText}>Continue to your account</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => router.push('/login')} style={styles.primary}>
          <Text style={styles.primaryText}>Sign in</Text>
        </Pressable>
      )}

      <View style={styles.roleGrid}>
        <Pressable onPress={() => router.push({ pathname: '/login', params: { role: 'talent' } })} style={styles.roleCard}>
          <Text style={styles.roleEyebrow}>FOR TALENT</Text>
          <Text style={styles.roleTitle}>Find your next move.</Text>
          <Text style={styles.roleCopy}>Jobs, Agency, Residency, Interview Ready, Academy, profile and messaging.</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/login', params: { role: 'employer' } })} style={styles.roleCard}>
          <Text style={styles.roleEyebrow}>FOR EMPLOYERS</Text>
          <Text style={styles.roleTitle}>Build stronger teams.</Text>
          <Text style={styles.roleCopy}>Post roles, review applicants, book Agency talent and manage your property profile.</Text>
        </Pressable>
        <Pressable onPress={() => router.push({ pathname: '/login', params: { role: 'admin' } })} style={styles.roleCard}>
          <Text style={styles.roleEyebrow}>PLATFORM ADMIN</Text>
          <Text style={styles.roleTitle}>Secure admin access.</Text>
          <Text style={styles.roleCopy}>Open the mobile operations dashboard using your existing administrator account.</Text>
        </Pressable>
      </View>

      <View style={styles.footerNote}>
        <Text style={styles.footerTitle}>Same account on web and app.</Text>
        <Text style={styles.footerCopy}>Both experiences use the same Wellness House platform data, profiles, jobs, bookings, messages and account permissions.</Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  page: { paddingHorizontal: 22, paddingTop: 30, paddingBottom: 34 },
  brandBlock: { marginBottom: 54 },
  wordmark: { color: '#092b45', fontSize: 22, letterSpacing: 2.2, fontWeight: '600' },
  sub: { color: '#788791', marginTop: 5, fontSize: 9, letterSpacing: 2.4 },
  hero: { marginBottom: 26 },
  eyebrow: { color: '#788791', fontSize: 9, letterSpacing: 2.1, marginBottom: 12 },
  title: { color: '#092b45', fontSize: 36, lineHeight: 42, fontWeight: '500' },
  intro: { color: '#66747c', fontSize: 15, lineHeight: 23, marginTop: 14 },
  primary: { backgroundColor: '#092b45', paddingVertical: 17, alignItems: 'center', marginBottom: 18 },
  primaryText: { color: '#fff', fontSize: 14, fontWeight: '700' },
  roleGrid: { gap: 12 },
  roleCard: { borderWidth: 1, borderColor: '#dce3e7', padding: 20, backgroundColor: '#fff' },
  roleEyebrow: { color: '#788791', fontSize: 8, letterSpacing: 1.8, marginBottom: 8 },
  roleTitle: { color: '#173246', fontSize: 20, lineHeight: 25, fontWeight: '600' },
  roleCopy: { color: '#71808a', fontSize: 12, lineHeight: 18, marginTop: 7 },
  footerNote: { backgroundColor: '#f4f7f8', padding: 18, marginTop: 22 },
  footerTitle: { color: '#173246', fontSize: 13, fontWeight: '600' },
  footerCopy: { color: '#71808a', fontSize: 11, lineHeight: 17, marginTop: 6 },
})
