import { useEffect, useState } from 'react'
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { router } from 'expo-router'
import { supabase } from '../src/lib/supabase'

// Notification preferences, mirroring the web talent settings centre.
//
// In-app notifications are always created (src/lib/notifications.ts). These
// controls govern only what reaches the inbox and the phone, which is exactly
// what src/lib/notification-prefs.ts enforces on the server:
//   - email categories live in privacy_preferences, read and written through
//     /api/privacy/preferences.
//   - the role-alert frequency and match threshold live on the candidate
//     profile, written through /api/profile/update.
//   - SMS is opt-in only and needs a mobile number on file, so the toggle is
//     disabled until there is one.

const WEB_URL = process.env.EXPO_PUBLIC_WEB_URL || 'https://talenthousecollective.co.uk'

type EmailPrefs = Record<string, boolean>
type Frequency = 'instant' | 'daily' | 'weekly'

const FREQUENCIES: Array<{ value: Frequency; label: string }> = [
  { value: 'instant', label: 'Instant' },
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
]

export default function NotificationPreferencesScreen() {
  const [emailPrefs, setEmailPrefs] = useState<EmailPrefs>({})
  const [candidateId, setCandidateId] = useState('')
  const [alertsEnabled, setAlertsEnabled] = useState(true)
  const [frequency, setFrequency] = useState<Frequency>('instant')
  const [minScore, setMinScore] = useState('60')
  const [smsOptIn, setSmsOptIn] = useState(false)
  const [phone, setPhone] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => { load() }, [])

  async function token() {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) throw new Error('Your session has expired. Please sign in again.')
    return session.access_token
  }

  async function load() {
    setLoading(true)
    setError('')
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.replace('/login'); return }
      const accessToken = await token()
      const [prefsResponse, { data: profile }] = await Promise.all([
        fetch(`${WEB_URL}/api/privacy/preferences`, { headers: { Authorization: `Bearer ${accessToken}` } }),
        supabase.from('candidate_profiles').select('id,job_alerts_enabled,job_alerts_frequency,job_alerts_min_score,sms_opt_in,phone').eq('user_id', user.id).maybeSingle(),
      ])
      const prefsPayload = await prefsResponse.json().catch(() => ({}))
      if (!prefsResponse.ok) throw new Error(prefsPayload?.error || 'Could not load your preferences.')
      setEmailPrefs((prefsPayload?.preferences || {}) as EmailPrefs)
      if (profile) {
        setCandidateId(profile.id)
        setAlertsEnabled(profile.job_alerts_enabled !== false)
        setFrequency((profile.job_alerts_frequency || 'instant') as Frequency)
        setMinScore(String(profile.job_alerts_min_score ?? 60))
        setSmsOptIn(Boolean(profile.sms_opt_in))
        setPhone(profile.phone || '')
      }
    } catch (e: any) {
      setError(e?.message || 'Could not load your preferences.')
    } finally {
      setLoading(false)
    }
  }

  async function saveEmailPref(field: string, value: boolean) {
    const previous = Boolean(emailPrefs[field])
    setEmailPrefs(current => ({ ...current, [field]: value }))
    setSaving(field); setError(''); setNotice('')
    try {
      const accessToken = await token()
      const response = await fetch(`${WEB_URL}/api/privacy/preferences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ [field]: value }),
      })
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error || 'Could not save that preference.')
      setNotice('Saved.')
    } catch (e: any) {
      setEmailPrefs(current => ({ ...current, [field]: previous }))
      setError(e?.message || 'Could not save that preference. Please try again.')
    } finally {
      setSaving('')
    }
  }

  async function saveProfilePref(field: string, value: unknown, revert: () => void) {
    if (!candidateId) return
    setSaving(field); setError(''); setNotice('')
    try {
      const accessToken = await token()
      const response = await fetch(`${WEB_URL}/api/profile/update`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` },
        body: JSON.stringify({ profileId: candidateId, data: { [field]: value } }),
      })
      if (!response.ok) throw new Error((await response.json().catch(() => ({})))?.error || 'Could not save that preference.')
      setNotice('Saved.')
    } catch (e: any) {
      revert()
      setError(e?.message || 'Could not save that preference. Please try again.')
    } finally {
      setSaving('')
    }
  }

  function toggleAlerts() {
    const next = !(Boolean(emailPrefs.job_alerts_email) && alertsEnabled)
    const previous = alertsEnabled
    setAlertsEnabled(next)
    void saveEmailPref('job_alerts_email', next)
    void saveProfilePref('job_alerts_enabled', next, () => setAlertsEnabled(previous))
  }

  function toggleSms() {
    if (!smsOptIn && !phone) { setError('Add a mobile number to your profile before turning on text alerts.'); return }
    const next = !smsOptIn
    setSmsOptIn(next)
    void saveProfilePref('sms_opt_in', next, () => setSmsOptIn(!next))
  }

  const row = (field: string, title: string, description: string, on: boolean, onToggle: () => void) => (
    <View key={field} style={styles.row}>
      <View style={{ flex: 1, paddingRight: 14 }}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowCopy}>{description}</Text>
      </View>
      <Pressable disabled={saving === field} onPress={onToggle} style={[styles.switch, on && styles.switchOn, saving === field && styles.disabled]}>
        <Text style={[styles.switchText, on && styles.switchTextOn]}>{on ? 'ON' : 'OFF'}</Text>
      </Pressable>
    </View>
  )

  if (loading) return <View style={styles.center}><ActivityIndicator color="#0b2f4d" /></View>

  return <ScrollView style={styles.scroll} contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
    <Pressable onPress={() => router.back()}><Text style={styles.back}>‹ Back</Text></Pressable>
    <Text style={styles.eyebrow}>NOTIFICATIONS</Text>
    <Text style={styles.title}>What reaches you, and when</Text>
    <Text style={styles.intro}>In-app notifications always appear in the app. These controls govern only what reaches your inbox and your phone.</Text>
    {error ? <Text style={styles.error}>{error}</Text> : null}
    {notice && !error ? <Text style={styles.notice}>{notice}</Text> : null}

    <Text style={styles.tier}>INSTANT</Text>
    <Text style={styles.tierNote}>Sent the moment something happens.</Text>
    {row('job_alerts_email', 'New matched role', 'One email the moment a live role scores above your match threshold.', Boolean(emailPrefs.job_alerts_email) && alertsEnabled, toggleAlerts)}
    {row('application_updates_email', 'Interview requests and employer messages', 'An email when a property invites you to interview, updates your application or messages you.', Boolean(emailPrefs.application_updates_email), () => saveEmailPref('application_updates_email', !emailPrefs.application_updates_email))}
    {row('booking_updates_email', 'Agency shift requests and booking updates', 'An email when a property offers you a shift, or a booking is accepted, countered, confirmed or declined.', Boolean(emailPrefs.booking_updates_email), () => saveEmailPref('booking_updates_email', !emailPrefs.booking_updates_email))}

    <Text style={styles.tier}>DAILY</Text>
    <Text style={styles.tierNote}>Batched once a day, so your inbox stays quiet.</Text>
    <View style={styles.block}>
      <Text style={styles.rowTitle}>Daily roles digest</Text>
      <Text style={styles.rowCopy}>Choose how role alerts arrive: the instant they go live, one daily digest, or a weekly round-up.</Text>
      <View style={styles.chipRow}>{FREQUENCIES.map(option => <Pressable key={option.value} disabled={!candidateId} onPress={() => { const previous = frequency; setFrequency(option.value); void saveProfilePref('job_alerts_frequency', option.value, () => setFrequency(previous)) }} style={[styles.chip, frequency === option.value && styles.chipActive]}><Text style={[styles.chipText, frequency === option.value && styles.chipTextActive]}>{option.label}</Text></Pressable>)}</View>
      <View style={styles.scoreRow}>
        <Text style={styles.scoreLabel}>Only roles above</Text>
        <TextInput value={minScore} onChangeText={setMinScore} keyboardType="number-pad" style={styles.scoreInput} onBlur={() => { const parsed = Math.max(0, Math.min(100, parseInt(minScore, 10) || 0)); setMinScore(String(parsed)); void saveProfilePref('job_alerts_min_score', parsed, () => undefined) }} />
        <Text style={styles.scoreLabel}>% match</Text>
      </View>
    </View>
    {row('academy_updates_email', 'Academy suggestions', 'Occasional emails about courses, gifted enrolments and Academy resources suited to your profile.', Boolean(emailPrefs.academy_updates_email), () => saveEmailPref('academy_updates_email', !emailPrefs.academy_updates_email))}

    <Text style={styles.tier}>WEEKLY</Text>
    <Text style={styles.tierNote}>One considered email a week, at most.</Text>
    {row('product_news_email', 'Career intelligence and market updates', 'The weekly intelligence email: market salary movements, hiring trends and platform news.', Boolean(emailPrefs.product_news_email), () => saveEmailPref('product_news_email', !emailPrefs.product_news_email))}

    <Text style={styles.tier}>SMS</Text>
    <Text style={styles.tierNote}>Texts are reserved for time-critical agency work.</Text>
    {row('sms_opt_in', 'Urgent agency shifts by text', 'A short text when a property needs same-day cover and has offered you the shift. Details stay inside your account.', smsOptIn, toggleSms)}
    <Text style={styles.footnote}>{phone ? `Number on file: ${phone}. Change it from your profile.` : 'No mobile number on file yet. Add one to your profile to receive shift texts.'}</Text>

    <Text style={styles.footnote}>Turning an email off never stops the notification appearing in the app, and it never stops anything you legally have to be told about - account, security and payment messages always send.</Text>
  </ScrollView>
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: '#fff' },
  page: { paddingHorizontal: 22, paddingTop: 18, paddingBottom: 110 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' },
  back: { color: '#66747c', fontSize: 14, marginBottom: 26 },
  eyebrow: { color: '#71808a', fontSize: 8, letterSpacing: 2, marginBottom: 8 },
  title: { color: '#0b2f4d', fontSize: 29, lineHeight: 34, fontWeight: '500' },
  intro: { color: '#66747c', fontSize: 13, lineHeight: 20, marginTop: 8 },
  tier: { color: '#0b2f4d', fontSize: 9, letterSpacing: 1.8, fontWeight: '800', marginTop: 28 },
  tierNote: { color: '#8b989f', fontSize: 10.5, lineHeight: 16, marginTop: 4, marginBottom: 6 },
  row: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#e4e9ec', paddingVertical: 14 },
  rowTitle: { color: '#173246', fontSize: 13, fontWeight: '700' },
  rowCopy: { color: '#71808a', fontSize: 10.5, lineHeight: 16, marginTop: 3 },
  switch: { minWidth: 54, paddingVertical: 10, paddingHorizontal: 10, borderWidth: 1, borderColor: '#d7dfe3', alignItems: 'center' },
  switchOn: { backgroundColor: '#0b2f4d', borderColor: '#0b2f4d' },
  switchText: { color: '#71808a', fontSize: 10, fontWeight: '800' },
  switchTextOn: { color: '#fff' },
  disabled: { opacity: 0.45 },
  block: { borderTopWidth: 1, borderTopColor: '#e4e9ec', paddingVertical: 14 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 11 },
  chip: { borderWidth: 1, borderColor: '#d7e0e4', paddingHorizontal: 14, paddingVertical: 9, backgroundColor: '#fff' },
  chipActive: { backgroundColor: '#0b2f4d', borderColor: '#0b2f4d' },
  chipText: { color: '#66747c', fontSize: 10.5, fontWeight: '700' },
  chipTextActive: { color: '#fff' },
  scoreRow: { flexDirection: 'row', alignItems: 'center', gap: 9, marginTop: 13 },
  scoreLabel: { color: '#66747c', fontSize: 11 },
  scoreInput: { borderWidth: 1, borderColor: '#d7e0e4', paddingHorizontal: 10, paddingVertical: 8, width: 66, color: '#173246', fontSize: 13, backgroundColor: '#fff' },
  footnote: { color: '#8b989f', fontSize: 10, lineHeight: 16, marginTop: 12 },
  notice: { color: '#456655', fontSize: 11, marginTop: 14 },
  error: { color: '#9b2c2c', fontSize: 11, lineHeight: 17, marginTop: 14 },
})
