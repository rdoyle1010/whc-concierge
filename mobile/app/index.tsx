import { useEffect, useState } from 'react'
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

const COVER_IMAGE = 'https://raw.githubusercontent.com/rdoyle1010/whc-concierge/main/public/images/gathering-canopy.jpg'

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
      <ImageBackground source={{ uri: COVER_IMAGE }} style={styles.heroImage} imageStyle={styles.heroImageInner}>
        <View style={styles.overlay} />
        <View style={styles.heroContent}>
          <Text style={styles.wordmark}>WELLNESS HOUSE</Text>
          <Text style={styles.sub}>TALENT · EMPLOYERS · WELLNESS</Text>
          <View style={styles.heroCopy}>
            <Text style={styles.eyebrowLight}>THE SPA & WELLNESS CAREER PLATFORM</Text>
            <Text style={styles.titleLight}>Where wellness careers and great teams meet.</Text>
            <Text style={styles.introLight}>One connected platform for permanent roles, Agency, Residency, career development and spa recruitment.</Text>
          </View>
        </View>
      </ImageBackground>

      <View style={styles.content}>
        {hasSession ? (
          <Pressable onPress={() => router.push('/home')} style={styles.primary}>
            <Text style={styles.primaryText}>Continue to your account</Text>
          </Pressable>
        ) : (
          <Pressable onPress={() => router.push('/login')} style={styles.primary}>
            <Text style={styles.primaryText}>Sign in to Wellness House</Text>
          </Pressable>
        )}

        <Text style={styles.sectionEyebrow}>CHOOSE YOUR SPACE</Text>
        <View style={styles.roleGrid}>
          <Pressable onPress={() => router.push({ pathname: '/login', params: { role: 'talent' } })} style={styles.roleCard}>
            <Text style={styles.roleEyebrow}>TALENT</Text>
            <Text style={styles.roleTitle}>Build your career.</Text>
            <Text style={styles.roleCopy}>Matched jobs, Agency shifts, Residency, Interview Ready, Academy, profile, messaging and more.</Text>
            <Text style={styles.roleLink}>Enter Talent →</Text>
          </Pressable>
          <Pressable onPress={() => router.push({ pathname: '/login', params: { role: 'employer' } })} style={styles.roleCard}>
            <Text style={styles.roleEyebrow}>EMPLOYERS</Text>
            <Text style={styles.roleTitle}>Find and keep great people.</Text>
            <Text style={styles.roleCopy}>Recruitment, candidates, Agency cover, property profile, messages and live role management.</Text>
            <Text style={styles.roleLink}>Enter Employer →</Text>
          </Pressable>
        </View>

        <View style={styles.footerNote}>
          <Text style={styles.footerTitle}>One account. One live platform.</Text>
          <Text style={styles.footerCopy}>The app and website read from the same Wellness House data, so profiles, roles, bookings, messages and account permissions stay connected.</Text>
        </View>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  page: { paddingBottom: 32 },
  heroImage: { minHeight: 500, justifyContent: 'flex-end' },
  heroImageInner: { resizeMode: 'cover' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(5,34,52,0.48)' },
  heroContent: { minHeight: 500, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 30, justifyContent: 'space-between' },
  wordmark: { color: '#fff', fontSize: 21, letterSpacing: 2.1, fontWeight: '700' },
  sub: { color: '#edf4f6', marginTop: 4, fontSize: 8, letterSpacing: 2.3 },
  heroCopy: { marginTop: 'auto' },
  eyebrowLight: { color: '#e4ecef', fontSize: 8, letterSpacing: 1.8, marginBottom: 10 },
  titleLight: { color: '#fff', fontSize: 34, lineHeight: 40, fontWeight: '500' },
  introLight: { color: '#eef4f6', fontSize: 14, lineHeight: 21, marginTop: 13, maxWidth: 340 },
  content: { paddingHorizontal: 22, paddingTop: 22 },
  primary: { backgroundColor: '#092b45', paddingVertical: 16, alignItems: 'center', marginBottom: 28 },
  primaryText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  sectionEyebrow: { color: '#788791', fontSize: 8, letterSpacing: 1.9, marginBottom: 12 },
  roleGrid: { gap: 12 },
  roleCard: { borderWidth: 1, borderColor: '#dce3e7', padding: 19, backgroundColor: '#fff' },
  roleEyebrow: { color: '#788791', fontSize: 8, letterSpacing: 1.8, marginBottom: 7 },
  roleTitle: { color: '#173246', fontSize: 19, lineHeight: 24, fontWeight: '600' },
  roleCopy: { color: '#71808a', fontSize: 12, lineHeight: 18, marginTop: 6 },
  roleLink: { color: '#092b45', fontSize: 11, fontWeight: '700', marginTop: 13 },
  footerNote: { backgroundColor: '#f4f7f8', padding: 18, marginTop: 22 },
  footerTitle: { color: '#173246', fontSize: 13, fontWeight: '600' },
  footerCopy: { color: '#71808a', fontSize: 11, lineHeight: 17, marginTop: 6 },
})
