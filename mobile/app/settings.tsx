import { useEffect, useState } from 'react'
import { ActivityIndicator, Alert, Pressable, ScrollView, Share, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'
import { palette, radius, space, type } from '../src/lib/theme'

// Settings, and the two things on it that are rights rather than features.
//
// A copy of your own data and the deletion of your account are both things
// the UK GDPR gives people, and both were reachable only from a browser. The
// app collects the CV, the right-to-work document, the photograph, the shift
// history and the messages, and offered no way to ask for any of it back or
// to have it removed. That is not a missing convenience.
//
// Everything else here is a signpost. The screens exist already and were
// findable only if you knew they did.

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'
const CONFIRM_WORD = 'DELETE'

export default function SettingsScreen() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [confirmText, setConfirmText] = useState('')
  const [error, setError] = useState('')

  useEffect(() => { void load() }, [])

  async function load() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) { router.replace('/login'); return }
    setEmail(user.email || '')
    setLoading(false)
  }

  async function authFetch(path: string, options?: RequestInit) {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    const response = await fetch(`${WEB_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}`, ...(options?.headers || {}) },
    })
    const body = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(body?.error || 'Something went wrong.')
    return body
  }

  async function exportData() {
    setBusy('export'); setError('')
    try {
      const body = await authFetch('/api/data-export')
      // Handed to the share sheet rather than saved somewhere the person then
      // has to go and find. From there it goes to Files, Mail, or anywhere
      // else they keep things.
      await Share.share({
        title: 'Your Talent House data',
        message: JSON.stringify(body, null, 2),
      })
    } catch (e: any) {
      setError(e?.message || 'Could not put your data together. Try again, and tell us if it keeps happening.')
    } finally {
      setBusy('')
    }
  }

  async function deleteAccount() {
    if (confirmText.trim().toUpperCase() !== CONFIRM_WORD) {
      Alert.alert('Not deleted', `Type ${CONFIRM_WORD} to confirm.`)
      return
    }
    setBusy('delete'); setError('')
    try {
      const body = await authFetch('/api/account/delete', { method: 'POST' })
      await supabase.auth.signOut()
      const leftover = Array.isArray(body?.failures) && body.failures.length
        ? ' A small amount could not be removed automatically and has been passed to Talent House to finish by hand.'
        : ''
      Alert.alert('Account deleted', `Your account and your data have been removed.${leftover}`)
      router.replace('/')
    } catch (e: any) {
      setError(e?.message || 'Could not delete the account. Nothing has been removed.')
    } finally {
      setBusy('')
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/')
  }

  if (loading) return <View style={styles.center}><ActivityIndicator color={palette.ink} /></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()} style={styles.backButton}><Text style={styles.back}>← Back</Text></Pressable>
    <Text style={styles.eyebrow}>ACCOUNT</Text>
    <Text style={styles.title}>Settings</Text>
    <Text style={styles.intro}>Signed in as {email || 'your account'}.</Text>

    {error ? <Text style={styles.error}>{error}</Text> : null}

    <Text style={styles.sectionEyebrow}>YOUR ACCOUNT</Text>
    {[
      ['Profile', 'What properties see about you.', '/profile'],
      ['Notifications', 'What reaches you, and how.', '/notification-preferences'],
      ['Who can see you', 'Visibility and blocked properties.', '/privacy-stealth'],
      ['Security & two-step', 'Passwords, authenticator, safety.', '/security'],
      ['Membership & billing', 'Plans, payments and receipts.', '/billing'],
    ].map(([label, copy, href]) => <Pressable key={href} onPress={() => router.push(href as any)} style={styles.row}>
      <View style={styles.rowCopy}>
        <Text style={styles.rowTitle}>{label}</Text>
        <Text style={styles.rowText}>{copy}</Text>
      </View>
      <Text style={styles.arrow}>›</Text>
    </Pressable>)}

    <Text style={[styles.sectionEyebrow, styles.spaced]}>YOUR DATA</Text>
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Get a copy of everything</Text>
      <Text style={styles.cardCopy}>Your profile, applications, shifts, messages, Academy record and consent history, in one file. It is yours to keep, and asking for it is your right rather than a favour.</Text>
      <Pressable onPress={exportData} disabled={busy === 'export'} style={[styles.secondary, busy === 'export' && styles.disabled]}>
        <Text style={styles.secondaryText}>{busy === 'export' ? 'PUTTING IT TOGETHER' : 'EXPORT MY DATA'}</Text>
      </Pressable>
    </View>

    <View style={styles.dangerCard}>
      <Text style={styles.dangerTitle}>Delete my account</Text>
      <Text style={styles.cardCopy}>This removes your profile, documents, photographs, applications and messages. It cannot be undone, and you will not be able to sign in afterwards. Records Talent House is legally required to keep - payments and tax, mainly - are anonymised rather than destroyed.</Text>
      {confirming ? <>
        <Text style={styles.confirmPrompt}>Type {CONFIRM_WORD} to confirm.</Text>
        <TextInput
          value={confirmText}
          onChangeText={setConfirmText}
          autoCapitalize="characters"
          autoCorrect={false}
          placeholder={CONFIRM_WORD}
          placeholderTextColor={palette.quiet}
          style={styles.confirmInput}
        />
        <Pressable onPress={deleteAccount} disabled={busy === 'delete'} style={[styles.danger, busy === 'delete' && styles.disabled]}>
          <Text style={styles.dangerText}>{busy === 'delete' ? 'DELETING' : 'DELETE MY ACCOUNT PERMANENTLY'}</Text>
        </Pressable>
        <Pressable onPress={() => { setConfirming(false); setConfirmText('') }} style={styles.secondary}>
          <Text style={styles.secondaryText}>KEEP MY ACCOUNT</Text>
        </Pressable>
      </> : <Pressable onPress={() => setConfirming(true)} style={styles.dangerOutline}>
        <Text style={styles.dangerOutlineText}>DELETE MY ACCOUNT</Text>
      </Pressable>}
    </View>

    <Pressable onPress={signOut} style={styles.signOutRow}><Text style={styles.signOut}>Sign out</Text></Pressable>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: palette.stone },
  page: { paddingHorizontal: space.page, paddingTop: 18, paddingBottom: 140 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 24, backgroundColor: palette.stone },
  backButton: { alignSelf: 'flex-start', paddingVertical: 6, marginBottom: 22 },
  back: { color: palette.muted, fontSize: 13 },
  eyebrow: { color: palette.quiet, fontSize: 8, letterSpacing: 2.2, fontWeight: '700', marginBottom: 9 },
  title: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 34, lineHeight: 40, fontWeight: '400', maxWidth: 365 },
  intro: { color: palette.muted, fontSize: 13, lineHeight: 20, marginTop: 10, marginBottom: 24, maxWidth: 365 },
  error: { color: palette.danger, fontSize: 11, lineHeight: 17, marginBottom: 14 },
  sectionEyebrow: { color: palette.quiet, fontSize: 8, letterSpacing: 1.7, fontWeight: '700', marginBottom: 9 },
  spaced: { marginTop: 30 },
  row: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 15, borderRadius: radius.large, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 12 },
  rowCopy: { flex: 1 },
  rowTitle: { color: palette.inkStrong, fontSize: 14, fontWeight: '700' },
  rowText: { color: palette.muted, fontSize: 10, lineHeight: 15, marginTop: 3 },
  arrow: { color: palette.ink, fontSize: 17 },
  card: { borderWidth: 1, borderColor: palette.line, backgroundColor: palette.paper, padding: 17, borderRadius: radius.large, marginBottom: 12 },
  cardTitle: { color: palette.inkStrong, fontFamily: type.serif, fontSize: 20, lineHeight: 25, fontWeight: '400' },
  cardCopy: { color: palette.muted, fontSize: 11, lineHeight: 17, marginTop: 7 },
  dangerCard: { borderWidth: 1, borderColor: '#E4CFCF', backgroundColor: palette.dangerSoft, padding: 17, borderRadius: radius.large },
  dangerTitle: { color: palette.danger, fontFamily: type.serif, fontSize: 20, lineHeight: 25, fontWeight: '400' },
  confirmPrompt: { color: palette.danger, fontSize: 10.5, fontWeight: '700', marginTop: 14 },
  confirmInput: { borderWidth: 1, borderColor: '#E4CFCF', backgroundColor: palette.paper, borderRadius: radius.medium, padding: 12, marginTop: 7, color: palette.text, fontSize: 13, letterSpacing: 1.5 },
  danger: { backgroundColor: palette.danger, paddingVertical: 13, alignItems: 'center', marginTop: 12, borderRadius: radius.medium },
  dangerText: { color: palette.paper, fontSize: 10.5, fontWeight: '700', letterSpacing: .6 },
  dangerOutline: { borderWidth: 1, borderColor: palette.danger, paddingVertical: 12, alignItems: 'center', marginTop: 14, borderRadius: radius.medium },
  dangerOutlineText: { color: palette.danger, fontSize: 10.5, fontWeight: '700', letterSpacing: .6 },
  secondary: { borderWidth: 1, borderColor: palette.lineStrong, backgroundColor: palette.paper, paddingVertical: 12, alignItems: 'center', marginTop: 12, borderRadius: radius.medium },
  secondaryText: { color: palette.ink, fontSize: 10.5, fontWeight: '700', letterSpacing: .6 },
  signOutRow: { alignItems: 'center', marginTop: 30, paddingVertical: 10 },
  signOut: { color: palette.muted, fontSize: 12.5 },
  disabled: { opacity: .5 },
})
