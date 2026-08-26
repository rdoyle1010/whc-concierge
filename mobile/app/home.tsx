import { useEffect, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { router, useLocalSearchParams } from 'expo-router'
import { supabase } from '../src/lib/supabase'

type Role = 'talent' | 'employer' | 'admin'

type Card = { title: string; copy: string; locked?: boolean }

const talentCards: Card[] = [
  { title: 'Matches', copy: 'See roles matched to your profile and experience.' },
  { title: 'Applications', copy: 'Track every role you have applied for.' },
  { title: 'Agency shifts', copy: 'Manage flexible work and daily availability.' },
  { title: 'Interview Ready', copy: 'Prepare using your CV, the role and the employer.' },
  { title: 'Messages', copy: 'Keep conversations with employers in one place.' },
  { title: 'Profile', copy: 'Keep your experience, skills and preferences current.' },
]

const employerCards: Card[] = [
  { title: 'Jobs', copy: 'Post, edit and manage your live opportunities.' },
  { title: 'Applications', copy: 'Review candidates and move them through the process.' },
  { title: 'Discover Talent', copy: 'Search matched spa and wellness professionals.' },
  { title: 'Agency bookings', copy: 'Find flexible staffing and manage bookings.' },
  { title: 'Messages', copy: 'Keep candidate conversations together.' },
  { title: 'Analytics', copy: 'Understand applications, matching and role performance.' },
]

export default function HomeScreen() {
  const params = useLocalSearchParams<{ role?: string }>()
  const [role, setRole] = useState<Role>((params.role as Role) || 'talent')
  const [name, setName] = useState('')

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const { data: profile } = await supabase.from('profiles').select('role,full_name').eq('id', user.id).maybeSingle()
      const resolved: Role = profile?.role === 'employer' ? 'employer' : profile?.role === 'admin' ? 'admin' : 'talent'
      setRole(resolved)
      setName(profile?.full_name || '')
    }
    load()
  }, [])

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  if (role === 'admin') {
    return <View style={styles.page}><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.title}>Admin stays web-first.</Text><Text style={styles.intro}>The mobile app is being built around Talent and Employer workflows. Platform administration remains on the full web dashboard.</Text><Pressable onPress={signOut} style={styles.secondaryButton}><Text style={styles.secondaryButtonText}>Sign out</Text></Pressable></View>
  }

  const cards = role === 'employer' ? employerCards : talentCards

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.page}>
      <View style={styles.topRow}><View><Text style={styles.wordmark}>WELLNESS HOUSE</Text><Text style={styles.sub}>{role === 'employer' ? 'EMPLOYER' : 'TALENT'}</Text></View><Pressable onPress={signOut}><Text style={styles.signOut}>Sign out</Text></Pressable></View>
      <Text style={styles.eyebrow}>{role === 'employer' ? 'PROPERTY WORKSPACE' : 'YOUR CAREER'}</Text>
      <Text style={styles.title}>{name ? `Hello, ${name.split(' ')[0]}.` : 'Welcome back.'}</Text>
      <Text style={styles.intro}>{role === 'employer' ? 'Recruit, manage and connect from the same platform you already use on the web.' : 'Your matches, applications, shifts, development and messages in one mobile workspace.'}</Text>
      <View style={styles.grid}>{cards.map(card => <View key={card.title} style={styles.card}><Text style={styles.cardTitle}>{card.title}</Text><Text style={styles.cardCopy}>{card.copy}</Text></View>)}</View>
      <View style={styles.notice}><Text style={styles.noticeTitle}>Same platform. Same account.</Text><Text style={styles.noticeCopy}>This app reads from the existing Wellness House Talent Supabase project, so changes made here and on the website stay in sync.</Text></View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#ffffff' },
  page: { flexGrow: 1, backgroundColor: '#ffffff', paddingHorizontal: 22, paddingTop: 68, paddingBottom: 40 },
  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 46 },
  wordmark: { color: '#092b45', fontSize: 20, letterSpacing: 1.8, fontWeight: '600' },
  sub: { color: '#6f7f88', marginTop: 4, fontSize: 9, letterSpacing: 3 },
  signOut: { color: '#71808a', fontSize: 12, paddingTop: 4 },
  eyebrow: { color: '#71808a', fontSize: 9, letterSpacing: 2.1, marginBottom: 10 },
  title: { color: '#092b45', fontSize: 32, lineHeight: 38, fontWeight: '500' },
  intro: { color: '#66747c', fontSize: 14, lineHeight: 21, marginTop: 10, marginBottom: 28, maxWidth: 520 },
  grid: { gap: 12 },
  card: { borderWidth: 1, borderColor: '#dce3e7', padding: 20, backgroundColor: '#ffffff' },
  cardTitle: { color: '#173246', fontSize: 17, fontWeight: '600', marginBottom: 7 },
  cardCopy: { color: '#71808a', fontSize: 12, lineHeight: 18 },
  notice: { marginTop: 26, backgroundColor: '#f4f7f8', padding: 18 },
  noticeTitle: { color: '#173246', fontSize: 13, fontWeight: '600', marginBottom: 6 },
  noticeCopy: { color: '#71808a', fontSize: 11, lineHeight: 17 },
  secondaryButton: { borderWidth: 1, borderColor: '#092b45', paddingVertical: 15, alignItems: 'center', marginTop: 24 },
  secondaryButtonText: { color: '#092b45', fontWeight: '600' },
})
